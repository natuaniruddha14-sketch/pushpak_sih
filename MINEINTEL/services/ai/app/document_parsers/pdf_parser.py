import time
from typing import Dict, Any, List, Optional
import pymupdf
from app.ocr import OCRPipeline, get_ocr_engine


class PDFDocumentParser:
    """
    Advanced PDF document parser using PyMuPDF.
    Detects whether pages contain native selectable text, scanned images, tables, or drawings.
    Runs OCR when required, extracts tables, and preserves bounding boxes and confidence scores.
    """

    def __init__(self, ocr_pipeline: Optional[OCRPipeline] = None, min_confidence_threshold: float = 0.75):
        self.min_confidence_threshold = min_confidence_threshold
        self.ocr_pipeline = ocr_pipeline or OCRPipeline(engine=get_ocr_engine(min_confidence_threshold=min_confidence_threshold))

    def parse_pdf(self, file_path: str, document_id: str = "") -> Dict[str, Any]:
        """Alias for extract_document."""
        return self.extract_document(file_path=file_path, document_id=document_id)

    def extract_document(self, file_path: str, document_id: str = "") -> Dict[str, Any]:
        """
        Extracts multi-page PDF content with layout, tables, OCR, and classification.
        """
        doc = pymupdf.open(file_path)
        total_pages = len(doc)
        pages_result = []
        all_tables = []
        is_scanned_doc = False
        scanned_page_count = 0
        total_confidence = 0.0

        table_counter = 0

        try:
            for page_num in range(total_pages):
                page = doc.load_page(page_num)
                page_idx = page_num + 1

                # 1. Native text analysis
                native_text = page.get_text("text").strip()
                words = native_text.split()
                char_count = len(native_text)

                # 2. Image inspection
                images = page.get_images(full=True)
                has_images = len(images) > 0

                # 3. Detect if scanned: if selectable text is sparse (< 35 chars) and page has images
                is_scanned_page = (char_count < 35 and has_images) or (char_count == 0)
                if is_scanned_page:
                    is_scanned_doc = True
                    scanned_page_count += 1

                # 4. Extract layout blocks with bounding boxes
                blocks_data = []
                try:
                    raw_blocks = page.get_text("blocks")
                    for b in raw_blocks:
                        # block format: (x0, y0, x1, y1, text, block_no, block_type)
                        if len(b) >= 5 and b[4].strip():
                            blocks_data.append({
                                "bbox": [round(b[0], 1), round(b[1], 1), round(b[2], 1), round(b[3], 1)],
                                "text": b[4].strip(),
                                "block_number": b[5] if len(b) > 5 else 0,
                                "block_type": "text" if (len(b) <= 6 or b[6] == 0) else "image"
                            })
                except Exception:
                    blocks_data = []

                # 5. Extract tables using PyMuPDF table finder
                page_tables = []
                has_tables = False
                try:
                    table_finder = page.find_tables()
                    if table_finder and table_finder.tables:
                        for tbl in table_finder.tables:
                            extracted_rows = tbl.extract()
                            if extracted_rows and len(extracted_rows) > 1:
                                has_tables = True
                                table_counter += 1
                                raw_headers = [str(c).strip() if c is not None else f"Col_{ci+1}" for ci, c in enumerate(extracted_rows[0])]
                                data_rows = extracted_rows[1:]

                                # Categorize mining table
                                table_text_lower = " ".join([str(c) for row in extracted_rows for c in row if c]).lower()
                                category = "general"
                                if any(k in table_text_lower for k in ["production", "output", "dispatch", "extraction", "tonnage"]):
                                    category = "production"
                                elif any(k in table_text_lower for k in ["grade", "gcv", "ash", "moisture", "calorific"]):
                                    category = "grade"
                                elif any(k in table_text_lower for k in ["reserve", "proved", "indicated", "inferred", "unfc"]):
                                    category = "quality"
                                elif any(k in table_text_lower for k in ["manpower", "employee", "workforce", "shift"]):
                                    category = "manpower"
                                elif any(k in table_text_lower for k in ["safety", "accident", "incident", "lost time"]):
                                    category = "safety"
                                elif any(k in table_text_lower for k in ["cost", "revenue", "financial", "expenditure", "budget"]):
                                    category = "financial"

                                structured_data = []
                                for r_idx, r in enumerate(data_rows):
                                    row_dict = {}
                                    for c_idx, col_name in enumerate(raw_headers):
                                        val = r[c_idx] if c_idx < len(r) else None
                                        row_dict[col_name] = val
                                    structured_data.append(row_dict)

                                table_obj = {
                                    "id": f"tbl-{document_id or 'doc'}-{page_idx}-{table_counter}",
                                    "document_id": document_id,
                                    "table_index": table_counter,
                                    "page_number": page_idx,
                                    "title": f"Table {table_counter} (Page {page_idx}) - {category.title()} Data",
                                    "category": category,
                                    "headers": raw_headers,
                                    "rows": data_rows,
                                    "rowCount": len(data_rows),
                                    "colCount": len(raw_headers),
                                    "data": structured_data,
                                    "bbox": [round(c, 1) for c in tbl.bbox] if hasattr(tbl, "bbox") else None,
                                    "sourceReference": {
                                        "documentId": document_id,
                                        "pageNumber": page_idx,
                                        "section": f"Page {page_idx} Table {table_counter}"
                                    }
                                }
                                page_tables.append(table_obj)
                                all_tables.append(table_obj)
                except Exception:
                    page_tables = []

                # 6. OCR when page is scanned
                page_confidence = 1.0
                needs_review = False
                ocr_required = False

                if is_scanned_page:
                    ocr_required = True
                    try:
                        ocr_page_res = self.ocr_pipeline.engine.extract_text_from_pdf_page(
                            page=page,
                            document_id=document_id,
                            page_number=page_idx
                        )
                        page_text = ocr_page_res.raw_text
                        page_confidence = ocr_page_res.ocr_confidence
                        needs_review = ocr_page_res.needs_review or (page_confidence < 0.75)
                        if not blocks_data and ocr_page_res.metadata.get("blocks"):
                            blocks_data = ocr_page_res.metadata["blocks"]
                    except Exception as ocr_err:
                        page_text = native_text
                        page_confidence = 0.50
                        needs_review = True
                else:
                    page_text = native_text
                    page_confidence = 0.98 if native_text else 0.50

                total_confidence += page_confidence

                pages_result.append({
                    "page_number": page_idx,
                    "raw_text": page_text,
                    "char_count": len(page_text),
                    "word_count": len(page_text.split()),
                    "has_tables": has_tables,
                    "has_images": has_images,
                    "ocr_required": ocr_required,
                    "ocr_confidence": round(page_confidence, 4),
                    "needs_review": needs_review,
                    "blocks": blocks_data,
                    "tables": page_tables,
                })
        finally:
            doc.close()

        all_text = "\n\n".join([p["raw_text"] for p in pages_result])
        avg_confidence = round(total_confidence / max(1, total_pages), 4)

        return {
            "document_id": document_id,
            "document_type": "SCANNED_PDF" if (scanned_page_count > total_pages / 2) else "PDF",
            "page_count": total_pages,
            "scanned_page_count": scanned_page_count,
            "is_scanned": is_scanned_doc,
            "has_native_text": not is_scanned_doc,
            "ocr_required": is_scanned_doc,
            "ocr_status": "OCR_PROCESSED" if is_scanned_doc else "NATIVE",
            "ocr_confidence": avg_confidence,
            "average_confidence": avg_confidence,
            "tables": all_tables,
            "pages": pages_result,
            "raw_text": all_text,
            "needs_review": any(p.get("needs_review") for p in pages_result),
        }

    def extract_pages(self, file_path: str) -> List[Dict[str, Any]]:
        """Backward-compatible helper extracting raw page texts."""
        res = self.extract_document(file_path=file_path)
        return [{"page_number": p["page_number"], "text": p["raw_text"]} for p in res["pages"]]
