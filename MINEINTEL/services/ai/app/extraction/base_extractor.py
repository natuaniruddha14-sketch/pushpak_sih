from abc import ABC, abstractmethod
from typing import List, Dict, Any
from app.extraction.schemas import ExtractionResult


class BaseInformationExtractor(ABC):
    """Abstract Base Class for Mining Information Extractors."""

    @abstractmethod
    def extract_document(
        self,
        document_id: str,
        pages: List[Dict[str, Any]]  # List of {"page_number": int, "text": str}
    ) -> ExtractionResult:
        """Extract domain entities and numerical structured records from a multi-page document."""
        pass
