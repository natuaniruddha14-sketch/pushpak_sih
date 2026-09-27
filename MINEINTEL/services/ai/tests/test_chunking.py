import pytest
from app.chunking import (
    SemanticChunker,
    clean_text,
    extract_section_title,
    ProcessedChunk,
    ChunkMetadata,
)


class TestTextCleaningAndSectionExtraction:
    def test_clean_text(self):
        raw = "Line 1 \x00\x07 with control chars.\r\n\r\nLine 2   with   extra  spaces.\n\n\n\nLine 3."
        cleaned = clean_text(raw)

        assert "\x00" not in cleaned
        assert "\x07" not in cleaned
        assert "Line 1 with control chars." in cleaned
        assert "Line 2 with extra spaces." in cleaned
        assert "\n\n\n" not in cleaned

    def test_extract_section_title(self):
        # Markdown heading
        text_md = "# GEOLOGICAL FORMATION AND COAL SEAMS\nContent text here..."
        assert extract_section_title(text_md) == "GEOLOGICAL FORMATION AND COAL SEAMS"

        # Numbered Section
        text_num = "SECTION 3: STRIP RATIO AND OVERBURDEN ANALYSIS\nContent text here..."
        assert extract_section_title(text_num) == "STRIP RATIO AND OVERBURDEN ANALYSIS"

        # ALL CAPS line
        text_caps = "EXPLORATION DRILLING LOGS\nSome detailed logs..."
        assert extract_section_title(text_caps) == "EXPLORATION DRILLING LOGS"

        # Fallback default title
        text_plain = "regular paragraph with normal sentence text.\nsecond line."
        assert extract_section_title(text_plain, "Default Section") == "Default Section"


class TestSemanticChunker:
    def test_semantic_chunking_basic(self):
        chunker = SemanticChunker()
        text = (
            "# GEOLOGY AND RESERVES\n"
            "The Gevra OpenCast Project contains extensive reserves of non-coking coal. "
            "Seam V/VI/VII is the primary mineable horizon with an average thickness of 18.4 meters. "
            "Proved coal reserves stand at 425.80 Million Tonnes (MT).\n\n"
            "Overburden stripping ratio is 2.14 m3/t with GCV grade ranging between G11 and G13."
        )

        chunks = chunker.chunk_text(
            text=text,
            document_id="doc-test-001",
            page_number=1,
            page_id="page-101",
            project_id="prj-gevra-001",
            document_type="PDF",
            chunk_size=150,
            overlap=20
        )

        assert len(chunks) > 0
        for i, chunk in enumerate(chunks):
            assert isinstance(chunk, ProcessedChunk)
            assert chunk.metadata.document_id == "doc-test-001"
            assert chunk.metadata.page_number == 1
            assert chunk.metadata.page_id == "page-101"
            assert chunk.metadata.project_id == "prj-gevra-001"
            assert chunk.metadata.document_type == "PDF"
            assert chunk.metadata.chunk_index == i
            assert chunk.metadata.section_title == "GEOLOGY AND RESERVES"
            assert chunk.token_count > 0
            assert chunk.start_char >= 0
            assert chunk.end_char > chunk.start_char

    def test_empty_text_chunking(self):
        chunker = SemanticChunker()
        chunks = chunker.chunk_text(text="", document_id="doc-empty", page_number=1)
        assert chunks == []
