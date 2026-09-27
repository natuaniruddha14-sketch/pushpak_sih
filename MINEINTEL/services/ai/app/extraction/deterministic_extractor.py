import re
from typing import List, Dict, Any, Optional, Tuple
from app.extraction.schemas import DocumentEntity, NumericalStructuredRecord, ExtractionResult
from app.extraction.unit_validator import UnitValidator


class DeterministicExtractor:
    """
    Deterministic Mining Information Extractor using high-precision regex patterns,
    unit normalizers, and tabular record parsers.
    Does NOT depend on LLMs for basic numerical extraction.
    """

    # Company & Organization Patterns
    COMPANIES = ["Coal India Limited", "CIL", "SECL", "NCL", "ECL", "WCL", "MCL", "BCCL", "CCL", "South Eastern Coalfields"]
    ORGANIZATIONS = ["CMPDI", "Central Mine Planning & Design Institute", "Ministry of Coal", "MoC", "CIL Directorate"]

    # Metric Patterns: (metric_name, regex_pattern, default_unit)
    METRIC_PATTERNS = [
        (
            "annual_production",
            r"(?:annual\s+production|coal\s+production|production\s+capacity|target\s+production|annual\s+output)\s*[:=\-]?\s*([\d\.,]+)\s*(MT|million\s+tonnes|million\s+tons|mt|tonnes)",
            "MT",
        ),
        (
            "proved_reserve",
            r"(?:proved\s+coal\s+reserve|proved\s+reserve|proved\s+resource|proved\s+coal)\s*[:=\-]?\s*([\d\.,]+)\s*(MT|million\s+tonnes|million\s+tons|mt)",
            "MT",
        ),
        (
            "indicated_reserve",
            r"(?:indicated\s+coal\s+reserve|indicated\s+reserve|indicated\s+resource)\s*[:=\-]?\s*([\d\.,]+)\s*(MT|million\s+tonnes|million\s+tons|mt)",
            "MT",
        ),
        (
            "inferred_reserve",
            r"(?:inferred\s+coal\s+reserve|inferred\s+reserve|inferred\s+resource)\s*[:=\-]?\s*([\d\.,]+)\s*(MT|million\s+tonnes|million\s+tons|mt)",
            "MT",
        ),
        (
            "stripping_ratio",
            r"(?:stripping\s+ratio|overburden\s+stripping\s+ratio|ob\s+stripping\s+ratio|stripping)\s*[:=\-]?\s*([\d\.,]+)\s*(m3\/t|m3\/tonne|m³/t|m³/tonne|cu\.m\/tonne)",
            "m³/tonne",
        ),
        (
            "seam_thickness",
            r"(?:seam\s+thickness|average\s+thickness|cumulative\s+thickness|thickness)\s*[:=\-]?\s*([\d\.,]+)\s*(m|meters|metres|meter)",
            "m",
        ),
        (
            "ash_content",
            r"(?:ash\s+content|ash\s+percentage|ash)\s*[:=\-]?\s*([\d\.,]+)\s*(%|percent|pct)",
            "%",
        ),
        (
            "gcv",
            r"(?:gcv|gross\s+calorific\s+value|calorific\s+value)\s*[:=\-]?\s*([\d\.,]+)\s*(kcal\/kg|kcal)",
            "kcal/kg",
        ),
        (
            "land_reclaimed",
            r"(?:land\s+reclaimed|reclaimed\s+area|afforestation|land\s+reclamation)\s*[:=\-]?\s*([\d\.,]+)\s*(ha|hectares|hectare)",
            "hectares",
        ),
        (
            "groundwater_inflow",
            r"(?:groundwater\s+inflow|mine\s+water\s+discharge|water\s+inflow|pumping\s+rate)\s*[:=\-]?\s*([\d\.,]+)\s*(m3\/day|m3\/hr|lps|litres\/sec)",
            "m³/day",
        ),
    ]

    def extract_from_page(
        self,
        page_text: str,
        document_id: str,
        page_number: int
    ) -> Tuple[List[DocumentEntity], List[NumericalStructuredRecord]]:
        """
        Extracts domain entities and numerical structured records from a single document page text.
        Retains document_id, page_number, and confidence for every extracted item.
        """
        entities: List[DocumentEntity] = []
        structured_records: List[NumericalStructuredRecord] = []

        if not page_text or not page_text.strip():
            return entities, structured_records

        # 1. Extract Reporting Period & Year
        reporting_period, year = self._extract_date_and_period(page_text)
        if year:
            entities.append(DocumentEntity(
                document_id=document_id,
                page_number=page_number,
                entity_type="Year",
                entity_value=str(year),
                confidence=1.0,
            ))
        if reporting_period:
            entities.append(DocumentEntity(
                document_id=document_id,
                page_number=page_number,
                entity_type="Reporting Period",
                entity_value=reporting_period,
                confidence=1.0,
            ))

        # 2. Extract Project & Mine Names
        project_name = self._extract_project_name(page_text)
        if project_name:
            entities.append(DocumentEntity(
                document_id=document_id,
                page_number=page_number,
                entity_type="Project",
                entity_value=project_name,
                confidence=0.95,
            ))

        mine_name = self._extract_mine_name(page_text)
        if mine_name:
            entities.append(DocumentEntity(
                document_id=document_id,
                page_number=page_number,
                entity_type="Mine",
                entity_value=mine_name,
                confidence=0.95,
            ))

        # 3. Extract Companies & Organizations
        for comp in self.COMPANIES:
            if re.search(r"\b" + re.escape(comp) + r"\b", page_text, re.IGNORECASE):
                entities.append(DocumentEntity(
                    document_id=document_id,
                    page_number=page_number,
                    entity_type="Company",
                    entity_value=comp,
                    confidence=1.0,
                ))

        for org in self.ORGANIZATIONS:
            if re.search(r"\b" + re.escape(org) + r"\b", page_text, re.IGNORECASE):
                entities.append(DocumentEntity(
                    document_id=document_id,
                    page_number=page_number,
                    entity_type="Organization",
                    entity_value=org,
                    confidence=1.0,
                ))

        # 4. Extract Coal Seams & Grades
        seams = re.findall(r"(?:Seam|seam)\s+([I|V|X|0-9\/A-Z]+)", page_text)
        for seam in set(seams):
            entities.append(DocumentEntity(
                document_id=document_id,
                page_number=page_number,
                entity_type="Coal",
                entity_value=f"Seam {seam}",
                confidence=0.95,
            ))

        grades = re.findall(r"\b(G[1-9]|G1[0-7])\b", page_text)
        for grade in set(grades):
            entities.append(DocumentEntity(
                document_id=document_id,
                page_number=page_number,
                entity_type="Coal",
                entity_value=f"Grade {grade}",
                confidence=0.95,
            ))

        # 5. Extract Locations
        locations = re.findall(r"([A-Za-z0-9\s\-]+Coalfield)", page_text)
        for loc in set(locations):
            entities.append(DocumentEntity(
                document_id=document_id,
                page_number=page_number,
                entity_type="Location",
                entity_value=loc.strip(),
                confidence=0.90,
            ))

        # 6. Extract Deterministic Numerical Structured Records
        for metric_name, pattern, default_unit in self.METRIC_PATTERNS:
            matches = re.finditer(pattern, page_text, re.IGNORECASE)
            for m in matches:
                val_str = m.group(1)
                unit_str = m.group(2) if m.lastindex >= 2 else default_unit
                num_val = UnitValidator.parse_numeric(val_str)
                norm_unit = UnitValidator.normalize_unit(unit_str)

                if num_val is not None and UnitValidator.validate_numeric_value(metric_name, num_val, norm_unit):
                    structured_records.append(NumericalStructuredRecord(
                        document_id=document_id,
                        source_page=page_number,
                        metric_name=metric_name,
                        metric_value=num_val,
                        unit=norm_unit,
                        year=year,
                        reporting_period=reporting_period,
                        project=project_name or mine_name,
                        confidence=0.96,
                    ))

                    # Track Units & Specific Entity types
                    entities.append(DocumentEntity(
                        document_id=document_id,
                        page_number=page_number,
                        entity_type="Units",
                        entity_value=norm_unit,
                        confidence=1.0,
                    ))

                    entity_map = {
                        "annual_production": "Production",
                        "proved_reserve": "Geological Resource",
                        "indicated_reserve": "Geological Resource",
                        "inferred_reserve": "Geological Resource",
                        "stripping_ratio": "Overburden",
                        "groundwater_inflow": "Groundwater",
                        "land_reclaimed": "Land Reclamation",
                    }
                    if metric_name in entity_map:
                        entities.append(DocumentEntity(
                            document_id=document_id,
                            page_number=page_number,
                            entity_type=entity_map[metric_name],
                            entity_value=f"{num_val} {norm_unit}",
                            confidence=0.96,
                        ))

        return entities, structured_records

    def _extract_date_and_period(self, text: str) -> Tuple[Optional[str], Optional[int]]:
        """Extract reporting period (e.g. FY 2025-26, Q3 FY25) and 4-digit Year."""
        period: Optional[str] = None
        year: Optional[int] = None

        # Reporting Period match (e.g. FY 2025-26, FY25-26, 2024-25)
        period_match = re.search(r"\b(FY\s*\d{2,4}(?:-\d{2,4})?|Q[1-4]\s*FY\s*\d{2,4}|\d{4}-\d{2,4})\b", text, re.IGNORECASE)
        if period_match:
            period = period_match.group(1).upper()

        # Check for explicit Year prefix (e.g. Year: 2026, Year 2026)
        year_prefix_match = re.search(r"\b(?:Year|Yr)\s*[:=\-]?\s*(19[5-9]\d|20[0-9]\d)\b", text, re.IGNORECASE)
        if year_prefix_match:
            year_candidate = int(year_prefix_match.group(1))
            if UnitValidator.validate_year(year_candidate):
                year = year_candidate

        if not year:
            # Year match (e.g. 2026, 2025)
            for m in re.finditer(r"\b(19[5-9]\d|20[0-9]\d)\b", text):
                y_cand = int(m.group(1))
                if UnitValidator.validate_year(y_cand):
                    year = y_cand
                    break

        return period, year

    def _extract_project_name(self, text: str) -> Optional[str]:
        """Extract project name or project code."""
        m = re.search(r"(?:Project|PRJ)\s*[:=\-]?\s*([A-Za-z0-9\s\-]+(?:Expansion|Survey|Investigation|Audit|Project))", text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
        m_code = re.search(r"\b(PRJ-[A-Z0-9\-]+)\b", text)
        if m_code:
            return m_code.group(1)
        return None

    def _extract_mine_name(self, text: str) -> Optional[str]:
        """Extract mine or opencast block name."""
        m = re.search(r"\b([A-Za-z0-9\s\-]+(?:OpenCast|OCP|Mine|Block))\b", text, re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            if len(val) < 40 and not val.lower().startswith("the"):
                return val
        return None
