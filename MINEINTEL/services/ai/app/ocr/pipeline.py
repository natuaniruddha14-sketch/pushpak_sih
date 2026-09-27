import time
from typing import List, Dict, Any, Callable, Optional
import pymupdf
from app.ocr.base import OCREngine, OCRPageResult
from app.ocr.factory import get_ocr_engine


class OCRPipeline:
    """
    Multi-page document OCR processing pipeline.
    Renders pages, executes image preprocessing, performs OCR, calculates confidence scores,
    marks low-confidence pages for human review, and exposes progress metrics.
    """

    def __init__(
        self,
        engine: Optional[OCREngine] = None,
        min_confidence_threshold: float = 0.70
    ):
        self.engine = engine or get_ocr_engine(min_confidence_threshold=min_confidence_threshold)
        self.min_confidence_threshold = min_confidence_threshold

    def process_pdf_document(
        self,
        file_path: str,
        document_id: str,
        progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ) -> Dict[str, Any]:
        """
        Processes a multi-page PDF document.
        Exposes real-time progress callbacks to the backend API.
        Preserves document_id, page_number, and raw_text for each page.
        """
        doc = pymupdf.open(file_path)
        total_pages = len(doc)
        processed_pages: List[OCRPageResult] = []
        low_confidence_pages: List[int] = []

        start_time = time.time()

        try:
            for i in range(total_pages):
                page = doc.load_page(i)
                page_num = i + 1

                # Update Progress Callback (e.g., Rendering & OCR step)
                progress_pct = int(((i + 0.5) / total_pages) * 100)
                if progress_callback:
                    progress_callback({
                        "document_id": document_id,
                        "status": "PROCESSING",
                        "progress_percent": progress_pct,
                        "current_step": f"Rendering & Preprocessing Page {page_num} of {total_pages}",
                        "current_page": page_num,
                        "total_pages": total_pages,
                    })

                # Perform Page Extraction / OCR
                page_res = self.engine.extract_text_from_pdf_page(
                    page=page,
                    document_id=document_id,
                    page_number=page_num
                )
                processed_pages.append(page_res)

                if page_res.needs_review:
                    low_confidence_pages.append(page_num)

                # Update Progress Callback (Page Complete step)
                completed_pct = int(((i + 1.0) / total_pages) * 100)
                if progress_callback:
                    progress_callback({
                        "document_id": document_id,
                        "status": "PROCESSING",
                        "progress_percent": completed_pct,
                        "current_step": f"Page {page_num} OCR Complete (Confidence: {int(page_res.ocr_confidence * 100)}%)",
                        "current_page": page_num,
                        "total_pages": total_pages,
                    })

        finally:
            doc.close()

        elapsed_time = round(time.time() - start_time, 2)
        total_ocr_pages = sum(1 for p in processed_pages if p.ocr_required)
        avg_confidence = (
            sum(p.ocr_confidence for p in processed_pages) / total_pages
            if total_pages > 0 else 1.0
        )

        # Aggregate Result Summary
        return {
            "document_id": document_id,
            "status": "COMPLETED",
            "progress_percent": 100,
            "total_pages": total_pages,
            "ocr_pages_count": total_ocr_pages,
            "average_confidence": round(avg_confidence, 4),
            "low_confidence_pages": low_confidence_pages,
            "requires_review_count": len(low_confidence_pages),
            "processing_time_seconds": elapsed_time,
            "pages": [
                {
                    "document_id": p.document_id,
                    "page_number": p.page_number,
                    "raw_text": p.raw_text,
                    "ocr_required": p.ocr_required,
                    "ocr_confidence": p.ocr_confidence,
                    "needs_review": p.needs_review,
                    "word_count": p.word_count,
                    "char_count": p.char_count,
                    "processing_step": p.processing_step,
                }
                for p in processed_pages
            ]
        }
