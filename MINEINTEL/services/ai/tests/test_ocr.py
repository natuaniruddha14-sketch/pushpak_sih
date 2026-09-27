import os
import tempfile
import pytest
import pymupdf
from PIL import Image, ImageDraw, ImageFont
from app.ocr.base import OCREngine, OCRResult, OCRPageResult
from app.ocr.local_engine import LocalOCREngine
from app.ocr.factory import get_ocr_engine
from app.ocr.preprocessor import ImagePreprocessor
from app.ocr.pipeline import OCRPipeline


@pytest.fixture
def sample_pdf_with_scanned_and_native_pages():
    """Create a temporary PDF file containing both native text pages and scanned image pages."""
    temp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    temp_path = temp_file.name
    temp_file.close()

    doc = pymupdf.open()

    # Page 1: Native Text Page (High text content)
    page1 = doc.new_page(width=595, height=842)
    page1.insert_text(
        (50, 100),
        "MINEINTEL GEOLOGICAL REPORT 2026\nProved Coal Reserves: 425.80 MT\nSeam Thickness: 18.4m\nStripping Ratio: 2.14 m3/t",
        fontsize=14
    )

    # Page 2: Scanned Image Page (Low/No native text, text rendered onto image)
    page2 = doc.new_page(width=595, height=842)
    # Create synthetic image with text
    img = Image.new("RGB", (800, 1100), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((60, 120), "SCANNED BOREHOLE LOG SHEET - BLOCK B", fill=(20, 20, 20))
    draw.text((60, 180), "Borehole ID: SB-42 | Depth: 210m | Purewa Seam", fill=(30, 30, 30))

    img_byte_arr = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    img_path = img_byte_arr.name
    img_byte_arr.close()
    img.save(img_path, format="PNG")

    page2.insert_image(pymupdf.Rect(50, 50, 545, 792), filename=img_path)

    doc.save(temp_path)
    doc.close()
    os.remove(img_path)

    yield temp_path

    if os.path.exists(temp_path):
        os.remove(temp_path)


class TestOCREngineAbstraction:
    """Test OCR abstraction interface and factory switching capabilities."""

    def test_factory_returns_ocr_engine_instance(self):
        engine = get_ocr_engine("local", min_confidence_threshold=0.75)
        assert isinstance(engine, OCREngine)
        assert engine.min_confidence_threshold == 0.75

    def test_factory_fallback(self):
        engine = get_ocr_engine("non_existent_engine")
        assert isinstance(engine, OCREngine)


class TestImagePreprocessingPipeline:
    """Test image preprocessing steps."""

    def test_preprocess_image_modes_and_contrast(self):
        img = Image.new("RGB", (200, 200), color=(200, 200, 200))
        processed = ImagePreprocessor.preprocess_image(img, contrast_factor=2.0)
        assert processed.mode == "L"
        assert processed.size == (200, 200)


class TestLocalOCREngine:
    """Test LocalOCREngine text extraction, confidence scoring, review flags, and preservation."""

    def test_extract_text_preserves_metadata(self):
        engine = LocalOCREngine(min_confidence_threshold=0.70)
        img = Image.new("RGB", (300, 100), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.text((10, 10), "Gevra Coalfield Report 2026", fill=(0, 0, 0))

        res = engine.extract_text(img, document_id="doc-test-123", page_number=1)
        assert isinstance(res, OCRResult)
        assert res.ocr_required is True
        assert res.metadata["document_id"] == "doc-test-123"
        assert res.metadata["page_number"] == 1

    def test_low_confidence_marks_needs_review(self):
        # Create a low-contrast engine with high confidence threshold
        engine = LocalOCREngine(min_confidence_threshold=0.95)
        # Low contrast image
        img = Image.new("RGB", (100, 100), color=(128, 128, 128))
        res = engine.extract_text(img)
        # Should be marked for review due to low confidence
        assert res.needs_review is True

    def test_does_not_silently_invent_text(self):
        """Verify that OCR engine does not invent or hallucinate text on empty/blank pages."""
        engine = LocalOCREngine(min_confidence_threshold=0.70)
        blank_img = Image.new("RGB", (200, 200), color=(255, 255, 255))
        res = engine.extract_text(blank_img)
        # Must not invent words out of thin air
        assert res.text.strip() == ""
        assert res.word_count == 0


class TestOCRPipeline:
    """Test multi-page document processing pipeline and progress tracking."""

    def test_pipeline_preserves_document_id_and_pages(self, sample_pdf_with_scanned_and_native_pages):
        pipeline = OCRPipeline(min_confidence_threshold=0.70)
        progress_logs = []

        def on_progress(update):
            progress_logs.append(update)

        res = pipeline.process_pdf_document(
            file_path=sample_pdf_with_scanned_and_native_pages,
            document_id="doc-geological-001",
            progress_callback=on_progress
        )

        assert res["document_id"] == "doc-geological-001"
        assert res["status"] == "COMPLETED"
        assert res["total_pages"] == 2
        assert len(res["pages"]) == 2

        # Page 1: Native text -> ocr_required should be False
        p1 = res["pages"][0]
        assert p1["document_id"] == "doc-geological-001"
        assert p1["page_number"] == 1
        assert "MINEINTEL GEOLOGICAL REPORT" in p1["raw_text"]
        assert p1["ocr_required"] is False
        assert p1["ocr_confidence"] == 1.0

        # Page 2: Scanned image -> ocr_required should be True
        p2 = res["pages"][1]
        assert p2["document_id"] == "doc-geological-001"
        assert p2["page_number"] == 2
        assert p2["ocr_required"] is True

        # Verify progress callbacks were invoked
        assert len(progress_logs) > 0
        assert progress_logs[-1]["progress_percent"] == 100
