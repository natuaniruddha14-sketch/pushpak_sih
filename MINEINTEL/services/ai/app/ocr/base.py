from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, Union
from PIL import Image


@dataclass
class OCRResult:
    """Standardized result returned by extract_text."""
    text: str
    confidence: float  # Normalized between 0.0 and 1.0
    ocr_required: bool = True
    needs_review: bool = False
    word_count: int = 0
    char_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class OCRPageResult:
    """Standardized result returned by extract_text_from_pdf_page."""
    document_id: str
    page_number: int
    raw_text: str
    ocr_required: bool
    ocr_confidence: float
    needs_review: bool
    word_count: int = 0
    char_count: int = 0
    processing_step: str = "COMPLETED"
    metadata: Dict[str, Any] = field(default_factory=dict)


class OCREngine(ABC):
    """Abstract OCR Engine Interface allowing switching between providers."""

    def __init__(self, min_confidence_threshold: float = 0.70):
        self.min_confidence_threshold = min_confidence_threshold

    @abstractmethod
    def extract_text(
        self,
        image: Union[bytes, Image.Image],
        document_id: Optional[str] = None,
        page_number: Optional[int] = None
    ) -> OCRResult:
        """Extract text and confidence score from raw image bytes or PIL Image."""
        pass

    @abstractmethod
    def extract_text_from_pdf_page(
        self,
        page: Any,  # PyMuPDF Page object
        document_id: str = "",
        page_number: Optional[int] = None
    ) -> OCRPageResult:
        """Render scanned PDF page, preprocess image, perform OCR, and preserve page metadata."""
        pass
