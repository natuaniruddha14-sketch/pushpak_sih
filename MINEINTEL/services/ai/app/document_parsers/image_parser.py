import os
import io
from typing import Dict, Any, List, Optional
from PIL import Image
from app.ocr.local_engine import LocalOCREngine
from app.ocr.preprocessor import ImagePreprocessor


class ImageDocumentParser:
    """
    Parser for standalone image files (PNG, JPG, JPEG, WEBP, TIFF) in mining operations.
    Extracts visual layout metadata, runs OCR without fabricating results,
    extracts blocks/regions with coordinates, and flags low-confidence extractions.
    """

    def __init__(self, min_confidence_threshold: float = 0.70):
        self.ocr_engine = LocalOCREngine(min_confidence_threshold=min_confidence_threshold)
        self.min_confidence_threshold = min_confidence_threshold

    def parse_image(self, file_path: str, document_id: str = "") -> Dict[str, Any]:
        """
        Parses an image file:
        - Reads image dimensions and format
        - Preprocesses image (denoise, contrast enhancement)
        - Executes OCR via LocalOCREngine or pytesseract
        - Extracts text blocks, bounding boxes, and confidence
        - Flags low confidence (< threshold)
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Image file not found: {file_path}")

        filename = os.path.basename(file_path)
        ext = os.path.splitext(filename)[1].lower().replace(".", "")

        with Image.open(file_path) as pil_image:
            width, height = pil_image.size
            format_name = pil_image.format or ext.upper()
            mode = pil_image.mode

            # Preprocess image
            processed_img = ImagePreprocessor.preprocess_image(pil_image)

            # Check Tesseract detailed block extraction if available
            blocks_data: List[Dict[str, Any]] = []
            extracted_text = ""
            confidence = 0.0

            # Run OCR extraction
            ocr_res = self.ocr_engine.extract_text(pil_image, document_id=document_id, page_number=1)
            extracted_text = ocr_res.text
            confidence = ocr_res.confidence
            blocks_data = ocr_res.metadata.get("blocks", [])
            needs_review = ocr_res.needs_review

            # If no blocks were created but text exists
            if not blocks_data and extracted_text:
                blocks_data.append({
                    "block_index": 1,
                    "text": extracted_text,
                    "bbox": [0, 0, width, height],
                    "confidence": round(confidence, 4),
                    "needs_review": needs_review
                })

            words = extracted_text.split()

            page_obj = {
                "page_number": 1,
                "raw_text": extracted_text or f"Raster Image Document: {filename}",
                "char_count": len(extracted_text),
                "word_count": len(words),
                "has_tables": False,
                "has_images": True,
                "ocr_required": True,
                "ocr_confidence": round(confidence, 4),
                "needs_review": needs_review,
                "blocks": blocks_data,
                "tables": [],
            }

            return {
                "document_id": document_id,
                "filename": filename,
                "file_type": ext,
                "page_count": 1,
                "has_native_text": False,
                "ocr_required": True,
                "ocr_status": "FLAGGED_FOR_REVIEW" if needs_review else "COMPLETED",
                "ocr_confidence": round(confidence, 4),
                "needs_review": needs_review,
                "image_metadata": {
                    "width": width,
                    "height": height,
                    "format": format_name,
                    "mode": mode,
                    "aspect_ratio": round(width / height, 2) if height > 0 else 1.0
                },
                "raw_text": extracted_text or f"Raster Image Document: {filename}",
                "pages": [page_obj],
                "blocks": blocks_data,
                "tables": [],  # Images without detected tabular grids have 0 tables
                "total_words": len(words),
                "total_chars": len(extracted_text),
                "source_reference": {
                    "document_id": document_id,
                    "page_number": 1,
                    "locator": f"Image:{filename}:Page 1"
                }
            }
