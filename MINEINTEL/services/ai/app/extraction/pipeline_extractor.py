from typing import List, Dict, Any, Optional
from app.extraction.base_extractor import BaseInformationExtractor
from app.extraction.deterministic_extractor import DeterministicExtractor
from app.extraction.llm_extractor import LLMAssistedExtractor
from app.extraction.schemas import ExtractionResult, DocumentEntity, NumericalStructuredRecord


class MiningInformationExtractor(BaseInformationExtractor):
    """
    Main Coordinator Pipeline for Mining-Specific Information Extraction.
    Combines high-precision deterministic extraction with optional LLM enhancement,
    validates numeric parameters & units, and preserves page-level metadata.
    """

    def __init__(self, use_llm_assisted: bool = False, llm_provider: Optional[Any] = None):
        self.deterministic_extractor = DeterministicExtractor()
        self.llm_extractor = LLMAssistedExtractor(llm_provider=llm_provider) if use_llm_assisted else None

    def extract_document(
        self,
        document_id: str,
        pages: List[Dict[str, Any]]
    ) -> ExtractionResult:
        """
        Executes document extraction across all pages.
        Retains document_id, page_number, and confidence for every extracted item.
        """
        all_entities: List[DocumentEntity] = []
        all_records: List[NumericalStructuredRecord] = []

        for p in pages:
            page_num = p.get("page_number", 1)
            page_text = p.get("text", "")

            # Deterministic Extraction
            entities, records = self.deterministic_extractor.extract_from_page(
                page_text=page_text,
                document_id=document_id,
                page_number=page_num
            )
            all_entities.extend(entities)
            all_records.extend(records)

        # Optional LLM enhancement
        if self.llm_extractor:
            llm_res = self.llm_extractor.extract_document(document_id=document_id, pages=pages)
            all_entities.extend(llm_res.entities)
            all_records.extend(llm_res.structured_records)

        # Deduplicate
        unique_entities = self._deduplicate_entities(all_entities)
        unique_records = self._deduplicate_records(all_records)

        return ExtractionResult(
            document_id=document_id,
            entities=unique_entities,
            structured_records=unique_records,
            total_pages_processed=len(pages),
            extraction_method="HYBRID" if self.llm_extractor else "DETERMINISTIC",
        )

    def _deduplicate_entities(self, entities: List[DocumentEntity]) -> List[DocumentEntity]:
        seen = set()
        dedup = []
        for e in entities:
            key = (e.document_id, e.page_number, e.entity_type, e.entity_value.lower().strip())
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
