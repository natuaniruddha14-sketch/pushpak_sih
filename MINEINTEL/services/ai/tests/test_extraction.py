import pytest
from app.extraction.schemas import DocumentEntity, NumericalStructuredRecord, ExtractionResult
from app.extraction.unit_validator import UnitValidator
from app.extraction.deterministic_extractor import DeterministicExtractor
from app.extraction.pipeline_extractor import MiningInformationExtractor


class TestProductionExtraction:
    """Tests for production metric and entity extraction."""

    def test_extract_annual_production_numeric_and_entity(self):
        extractor = DeterministicExtractor()
        text = "Gevra OpenCast Project achieved Annual Production: 42.50 MT during FY 2025-26."
        entities, records = extractor.extract_from_page(text, document_id="doc-prod-001", page_number=1)

        # 1. Verify Numerical Structured Record
        prod_records = [r for r in records if r.metric_name == "annual_production"]
        assert len(prod_records) > 0
        r = prod_records[0]
        assert r.document_id == "doc-prod-001"
        assert r.source_page == 1
        assert r.metric_value == 42.50
        assert r.unit == "MT"
        assert r.confidence > 0.90

        # 2. Verify Production Entity
        prod_entities = [e for e in entities if e.entity_type == "Production"]
        assert len(prod_entities) > 0
        e = prod_entities[0]
        assert e.document_id == "doc-prod-001"
        assert e.page_number == 1
        assert "42.5" in e.entity_value


class TestUnitValidation:
    """Tests for unit normalization and numeric bounds validation."""

    def test_unit_normalization(self):
        assert UnitValidator.normalize_unit("million tonnes") == "MT"
        assert UnitValidator.normalize_unit("mt") == "MT"
        assert UnitValidator.normalize_unit("m3/t") == "m³/tonne"
        assert UnitValidator.normalize_unit("m3/tonne") == "m³/tonne"
        assert UnitValidator.normalize_unit("meters") == "m"
        assert UnitValidator.normalize_unit("ha") == "hectares"
        assert UnitValidator.normalize_unit("kcal/kg") == "kcal/kg"
        assert UnitValidator.normalize_unit("percent") == "%"

    def test_numeric_value_bounds_validation(self):
        # Valid percentage
        assert UnitValidator.validate_numeric_value("ash_content", 24.5, "%") is True
        # Invalid percentage (> 100%)
        assert UnitValidator.validate_numeric_value("ash_content", 150.0, "%") is False
        # Valid production / reserve
        assert UnitValidator.validate_numeric_value("annual_production", 50.0, "MT") is True
        # Invalid negative production
        assert UnitValidator.validate_numeric_value("annual_production", -10.0, "MT") is False
        # Valid GCV
        assert UnitValidator.validate_numeric_value("gcv", 4500.0, "kcal/kg") is True


class TestDatesAndReportingPeriods:
    """Tests for year and reporting period entity extraction."""

    def test_extract_dates_and_reporting_periods(self):
        extractor = DeterministicExtractor()
        text = "Annual Geological Survey Report for FY 2025-26 published in Year: 2026 by CMPDI."
        entities, _ = extractor.extract_from_page(text, document_id="doc-date-001", page_number=2)

        years = [e for e in entities if e.entity_type == "Year"]
        periods = [e for e in entities if e.entity_type == "Reporting Period"]

        assert len(years) > 0
        assert years[0].entity_value == "2026"
        assert years[0].document_id == "doc-date-001"
        assert years[0].page_number == 2

        assert len(periods) > 0
        assert "FY 2025-26" in periods[0].entity_value


class TestProjectNamesAndOrganizations:
    """Tests for project names, mine blocks, companies, and organizations extraction."""

    def test_extract_project_mine_and_companies(self):
        extractor = DeterministicExtractor()
        text = "Project: Gevra OCP Expansion Project under SECL (Coal India Limited) inspected by CMPDI."
        entities, _ = extractor.extract_from_page(text, document_id="doc-prj-001", page_number=1)

        entity_types = {e.entity_type: e.entity_value for e in entities}

        assert "Project" in entity_types
        assert "Gevra" in entity_types["Project"]

        assert "Company" in entity_types
        assert any(c in entity_types["Company"] for c in ["SECL", "Coal India Limited"])

        assert "Organization" in entity_types
        assert entity_types["Organization"] == "CMPDI"


class TestMetadataPreservation:
    """Tests that every extracted entity and record retains document ID, page number, and confidence."""

    def test_pipeline_preserves_document_id_page_number_and_confidence(self):
        pipeline = MiningInformationExtractor()
        pages = [
            {
                "page_number": 1,
                "text": "Project: Singrauli Deep Seam. Proved Coal Reserve: 425.80 MT. Stripping Ratio: 2.14 m3/t in FY 2025-26."
            },
            {
                "page_number": 2,
                "text": "Seam V/VI thickness averages 18.4m with Ash Content: 24.5% and GCV: 4400 kcal/kg."
            }
        ]

        res = pipeline.extract_document(document_id="doc-preserve-99", pages=pages)

        assert isinstance(res, ExtractionResult)
        assert res.document_id == "doc-preserve-99"
        assert res.total_pages_processed == 2

        # Check all entities
        for entity in res.entities:
            assert entity.document_id == "doc-preserve-99"
            assert entity.page_number in [1, 2]
            assert 0.0 <= entity.confidence <= 1.0

        # Check all structured records
        for record in res.structured_records:
            assert record.document_id == "doc-preserve-99"
            assert record.source_page in [1, 2]
            assert 0.0 <= record.confidence <= 1.0
            assert record.metric_value > 0.0
            assert record.unit != ""
