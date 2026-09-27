from app.ocr.base import OCREngine
from app.ocr.local_engine import LocalOCREngine


def get_ocr_engine(engine_name: str = "local", min_confidence_threshold: float = 0.70) -> OCREngine:
    """
    Factory function to instantiate and switch between OCR engines.
    Allows seamless switching between local, tesseract, easyocr, or cloud providers.
    """
    engine_type = engine_name.lower().strip()
    if engine_type in ["local", "tesseract", "default"]:
        return LocalOCREngine(min_confidence_threshold=min_confidence_threshold)
    else:
        # Default fallback to LocalOCREngine
        return LocalOCREngine(min_confidence_threshold=min_confidence_threshold)
