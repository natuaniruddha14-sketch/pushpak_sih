from abc import ABC, abstractmethod
from typing import Dict, Any, List


class OCRExtractorBase(ABC):
    """Abstract Base Class for OCR & Text Extraction Engines."""

    @abstractmethod
    async def extract_text_from_image(self, image_bytes: bytes) -> str:
        """Extract plain text from raw image bytes."""
        pass

    @abstractmethod
    async def extract_text_with_layout(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """Extract text blocks with bounding boxes and layout positioning."""
        pass


# TODO: Implement TesseractOCRExtractor using pytesseract
# TODO: Implement EasyOCRExtractor for scanned CMPDI mining documents
# TODO: Implement AzureFormRecognizerExtractor for structured table layout parsing
