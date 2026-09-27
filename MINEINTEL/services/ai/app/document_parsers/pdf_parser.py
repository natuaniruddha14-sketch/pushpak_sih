import fitz  # PyMuPDF
from typing import Dict, Any, List


class PDFDocumentParser:
    """PDF document parsing utility using PyMuPDF (fitz)."""

    def extract_pages(self, file_path: str) -> List[Dict[str, Any]]:
        """Extract page-by-page text content and basic metadata using PyMuPDF."""
        pages = []
        doc = fitz.open(file_path)
        try:
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pages.append({
                    "page_number": page_num + 1,
                    "text": page.get_text("text"),
                })
        finally:
            doc.close()
        return pages

# TODO: Add OCR fallback check for scanned PDF pages containing image elements
