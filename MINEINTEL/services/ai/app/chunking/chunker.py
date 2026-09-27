import re
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ChunkMetadata(BaseModel):
    document_id: str
    page_id: Optional[str] = None
    page_number: int
    project_id: Optional[str] = None
    document_type: Optional[str] = None
    section_title: Optional[str] = "General"
    chunk_index: int


class ProcessedChunk(BaseModel):
    content: str
    token_count: int
    start_char: int
    end_char: int
    metadata: ChunkMetadata


def clean_text(text: str) -> str:
    """
    Cleans raw document text for chunking:
    - Removes non-printable control characters
    - Normalizes consecutive spaces while keeping newlines for section detection
    - Strips leading/trailing whitespace
    """
    if not text:
        return ""
    # Remove control characters except newlines and tabs
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # Replace carriage returns with standard newlines
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Normalize multiple horizontal spaces
    text = re.sub(r"[ \t]+", " ", text)
    # Reduce 3+ newlines down to 2 (paragraph break)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_section_title(text: str, default_title: str = "General") -> str:
    """
    Detects section title in text segment using markdown headers or mining document conventions.
    """
    if not text:
        return default_title

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    for line in lines[:3]:
        # Markdown heading match (# Heading or ## Heading)
        md_match = re.match(r"^#{1,6}\s*(.+)$", line)
        if md_match:
            return md_match.group(1).strip()

        # Numbered Section match (e.g., "1. EXECUTIVE SUMMARY", "SECTION 2: GEOLOGY")
        num_match = re.match(r"^(?:SECTION\s+\d+[:\.]?|\d+\.\d*)\s*([A-Za-z0-9\s\-_]+)$", line, re.IGNORECASE)
        if num_match and len(line) < 80:
            return num_match.group(1).strip()

        # ALL CAPS line under 60 chars (e.g. "GEOLOGICAL RESERVES REPORT")
        if line.isupper() and 4 < len(line) < 60:
            return line.strip()

    return default_title


class DocumentChunkerBase(ABC):
    """Abstract Base Class for Document Chunking Engines."""

    @abstractmethod
    def chunk_text(
        self,
        text: str,
        document_id: str,
        page_number: int = 1,
        page_id: Optional[str] = None,
        project_id: Optional[str] = None,
        document_type: Optional[str] = None,
        chunk_size: int = 500,
        overlap: int = 50,
        start_chunk_index: int = 0
    ) -> List[ProcessedChunk]:
        """Split text into chunks with metadata."""
        pass


class SemanticChunker(DocumentChunkerBase):
    """
    Semantic Chunker for mining reports and geological documents.
    Cleans text, preserves section titles, respects sentence/paragraph boundaries,
    and attaches required metadata.
    """

    def chunk_text(
        self,
        text: str,
        document_id: str,
        page_number: int = 1,
        page_id: Optional[str] = None,
        project_id: Optional[str] = None,
        document_type: Optional[str] = None,
        chunk_size: int = 500,
        overlap: int = 50,
        start_chunk_index: int = 0
    ) -> List[ProcessedChunk]:
        cleaned = clean_text(text)
        if not cleaned:
            return []

        section_title = extract_section_title(cleaned)

        # Split into sentences / logical units
        # Splits by double newlines or sentence terminators (.!? followed by space/newline)
        raw_paragraphs = [p.strip() for p in cleaned.split("\n\n") if p.strip()]

        units: List[str] = []
        for para in raw_paragraphs:
            # Check if para itself has markdown section title
            if para.startswith("#") or (para.isupper() and len(para) < 60):
                section_title = extract_section_title(para, section_title)
            
            if len(para) <= chunk_size:
                units.append(para)
            else:
                # Split large paragraph by sentence boundaries
                sentences = re.split(r"(?<=[.!?])\s+", para)
                units.extend([s.strip() for s in sentences if s.strip()])

        chunks: List[ProcessedChunk] = []
        current_chunk_text = ""
        current_start_char = 0
        char_pointer = 0
        chunk_index = start_chunk_index

        for unit in units:
            unit_start = cleaned.find(unit, char_pointer)
            if unit_start == -1:
                unit_start = char_pointer

            if not current_chunk_text:
                current_chunk_text = unit
                current_start_char = unit_start
            elif len(current_chunk_text) + len(unit) + 1 <= chunk_size:
                current_chunk_text += " " + unit
            else:
                # Flush current chunk
                token_count = max(1, len(current_chunk_text.split()))
                chunks.append(ProcessedChunk(
                    content=current_chunk_text,
                    token_count=token_count,
                    start_char=current_start_char,
                    end_char=current_start_char + len(current_chunk_text),
                    metadata=ChunkMetadata(
                        document_id=document_id,
                        page_id=page_id,
                        page_number=page_number,
                        project_id=project_id,
                        document_type=document_type,
                        section_title=section_title,
                        chunk_index=chunk_index,
                    )
                ))
                chunk_index += 1

                # Carry over overlap if possible
                overlap_text = current_chunk_text[-overlap:] if len(current_chunk_text) > overlap else ""
                if overlap_text:
                    current_chunk_text = overlap_text + " " + unit
                    current_start_char = max(0, unit_start - len(overlap_text))
                else:
                    current_chunk_text = unit
                    current_start_char = unit_start

            char_pointer = unit_start + len(unit)

        # Flush final remaining chunk
        if current_chunk_text:
            token_count = max(1, len(current_chunk_text.split()))
            chunks.append(ProcessedChunk(
                content=current_chunk_text,
                token_count=token_count,
                start_char=current_start_char,
                end_char=current_start_char + len(current_chunk_text),
                metadata=ChunkMetadata(
                    document_id=document_id,
                    page_id=page_id,
                    page_number=page_number,
                    project_id=project_id,
                    document_type=document_type,
                    section_title=section_title,
                    chunk_index=chunk_index,
                )
            ))

        return chunks
