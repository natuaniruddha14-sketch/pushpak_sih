from typing import List, Dict, Any, Optional
from app.extraction.base_extractor import BaseInformationExtractor
from app.extraction.schemas import ExtractionResult, DocumentEntity, NumericalStructuredRecord
from app.extraction.deterministic_extractor import DeterministicExtractor
from app.extraction.unit_validator import UnitValidator


class LLMAssistedExtractor(BaseInformationExtractor):
    """
    LLM-assisted information extractor for complex unstructured text blocks.
    Acts as an enhancement layer on top of deterministic extraction.
    Does NOT make the core system dependent on LLMs for basic numerical extraction.
    """

    def __init__(self, llm_provider: Optional[Any] = None):
        self.llm_provider = llm_provider
        self.fallback_extractor = DeterministicExtractor()

    def extract_document(
        self,
        document_id: str,
        pages: List[Dict[str, Any]]
    ) -> ExtractionResult:
        """
        Processes document pages using deterministic extraction as primary base,
        enhanced with LLM entity extraction where available.
        """
        all_entities: List[DocumentEntity] = []
        all_records: List[NumericalStructuredRecord] = []

        for p in pages:
            page_num = p.get("page_number", 1)
            page_text = p.get("text", "")

            # 1. Deterministic Extraction (Always succeeds, high reliability)
            det_entities, det_records = self.fallback_extractor.extract_from_page(
                page_text=page_text,
                document_id=document_id,
                page_number=page_num
            )
            all_entities.extend(det_entities)
            all_records.extend(det_records)

            # 2. LLM-assisted enhancement (if LLM provider configured and active)
            if self.llm_provider:
                try:
                    llm_entities, llm_records = self._extract_with_llm(
                        page_text=page_text,
                        document_id=document_id,
                        page_number=page_num
                    )
                    all_entities.extend(llm_entities)
                    all_records.extend(llm_records)
                except Exception as _e:
                    # Fallback cleanly without breaking system execution
                    pass

        # Deduplicate records and entities
        unique_entities = self._deduplicate_entities(all_entities)
        unique_records = self._deduplicate_records(all_records)

        return ExtractionResult(
            document_id=document_id,
            entities=unique_entities,
            structured_records=unique_records,
            total_pages_processed=len(pages),
            extraction_method="HYBRID_LLM_DETERMINISTIC",
        )

    def _extract_with_llm(
        self,
        page_text: str,
        document_id: str,
        page_number: int
    ) -> tuple[List[DocumentEntity], List[NumericalStructuredRecord]]:
        """Placeholder interface call to LLM provider for structured JSON extraction."""
        # Returns empty enhancement if LLM is mock or unconfigured
        return [], []

    def _deduplicate_entities(self, entities: List[DocumentEntity]) -> List[DocumentEntity]:
        seen = set()
        dedup = []
        for e in entities:
            key = (e.document_id, e.page_number, e.entity_type, e.entity_value.lower())
            if key not in seen:
                seen.add(key)
                dedup.append(e)
        return dedup

    def _deduplicate_records(self, records: List[NumericalStructuredRecord]) -> List[NumericalStructuredRecord]:
        seen = set()
        dedup = []
        for r in records:
            key = (r.document_id, r.source_page, r.metric_name, r.metric_value, r.unit)
            if key not in seen:
                seen.add(key)
                dedup.append(r)
        return dedup
