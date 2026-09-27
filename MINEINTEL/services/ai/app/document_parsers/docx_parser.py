import os
import re
from typing import Dict, Any, List, Optional
import docx
from docx.table import Table


class DocxDocumentParser:
    """
    Production-grade DOCX document parser for mining domain documents.
    Extracts headings, paragraphs, structured tables with cell traceability,
    mining entity hints, and source references.
    """

    MINING_CATEGORIES = {
        "production": [r"production", r"overburden", r"ob removal", r"coal extract", r"excavation", r"tonnage", r"output", r"rom coal"],
        "dispatch": [r"dispatch", r"offtake", r"rake", r"loading", r"sidings", r"transport", r"mode of dispatch", r"fsa"],
        "grade_quality": [r"grade", r"gcv", r"ash %", r"moisture", r"calorific", r"quality", r"g1", r"g2", r"g3", r"g4", r"g5", r"g6", r"g7", r"g8", r"g9", r"g10", r"g11", r"g12", r"g13", r"g14"],
        "safety": [r"accident", r"fatal", r"injury", r"near miss", r"lost time", r"safety", r"incident", r"dgms", r"violation"],
        "manpower": [r"manpower", r"worker", r"attendance", r"executive", r"non-executive", r"contractor", r"headcount", r"shift"],
        "financial": [r"revenue", r"cost", r"expenditure", r"ebitda", r"profit", r"royalty", r"cess", r"capex", r"opex", r"inr", r"crore", r"lakh"],
        "reserves": [r"reserve", r"resource", r"proved", r"indicated", r"inferred", r"seam", r"strike", r"dip", r"stripping ratio"]
    }

    def classify_mining_table(self, title: str, headers: List[str], sample_text: str) -> str:
        """Classify a table into mining domain categories."""
        combined_text = f"{title} {' '.join(headers)} {sample_text}".lower()
        for category, patterns in self.MINING_CATEGORIES.items():
            for pattern in patterns:
                if re.search(r"\b" + pattern, combined_text):
                    return category
        return "general_mining"

    def parse_document(self, file_path: str, document_id: str = "") -> Dict[str, Any]:
        """
        Parses a DOCX document completely, extracting:
        - Hierarchy of headings and sections
        - Paragraphs with style names and character counts
        - Structured tables with cell-level traceability
        - Mining metadata indicators
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"DOCX file not found: {file_path}")

        doc = docx.Document(file_path)

        sections_data: List[Dict[str, Any]] = []
        paragraphs_data: List[Dict[str, Any]] = []
        current_heading = "Preamble"
        current_heading_level = 0
        current_section_idx = 0

        raw_text_parts: List[str] = []

        # Iterate over paragraphs
        for p_idx, p in enumerate(doc.paragraphs):
            text = p.text.strip()
            if not text:
                continue

            style_name = p.style.name if p.style else "Normal"
            raw_text_parts.append(text)

            # Check if this paragraph is a heading
            if style_name.startswith("Heading") or style_name.startswith("Title"):
                level = 1
                if style_name.startswith("Heading"):
                    match = re.search(r"Heading\s*(\d+)", style_name)
                    if match:
                        level = int(match.group(1))
                elif style_name == "Title":
                    level = 1

                current_heading = text
                current_heading_level = level
                current_section_idx += 1

                sections_data.append({
                    "section_index": current_section_idx,
                    "title": text,
                    "level": level,
                    "paragraph_index": p_idx
                })

            paragraphs_data.append({
                "paragraph_index": p_idx,
                "section": current_heading,
                "section_level": current_heading_level,
                "style": style_name,
                "text": text,
                "char_count": len(text),
                "word_count": len(text.split())
            })

        # Iterate over tables
        tables_data: List[Dict[str, Any]] = []
        for t_idx, table in enumerate(doc.tables):
            extracted_table = self._parse_single_table(table, t_idx, current_heading, document_id)
            if extracted_table:
                tables_data.append(extracted_table)

        # Build full text representation
        full_text = "\n\n".join(raw_text_parts)

        # Core document metadata properties
        core_properties = {}
        try:
            cp = doc.core_properties
            if cp:
                core_properties = {
                    "author": cp.author or "",
                    "created": str(cp.created) if cp.created else "",
                    "modified": str(cp.modified) if cp.modified else "",
                    "title": cp.title or "",
                    "subject": cp.subject or "",
                    "keywords": cp.keywords or ""
                }
        except Exception:
            pass

        # Synthesize pages representation for pipeline indexing
        pages_data = []
        if paragraphs_data:
            # Group paragraphs into pages (~12 paragraphs per page)
            chunk_size = 12
            for p_start in range(0, len(paragraphs_data), chunk_size):
                p_chunk = paragraphs_data[p_start : p_start + chunk_size]
                p_idx = (p_start // chunk_size) + 1
                p_text = "\n\n".join([p["text"] for p in p_chunk])
                p_tables = tables_data if p_idx == 1 else []
                pages_data.append({
                    "page_number": p_idx,
                    "raw_text": p_text,
                    "char_count": len(p_text),
                    "word_count": sum(p["word_count"] for p in p_chunk),
                    "has_tables": len(p_tables) > 0,
                    "has_images": False,
                    "ocr_required": False,
                    "ocr_confidence": 1.0,
                    "needs_review": False,
                    "tables": p_tables,
                })
        else:
            pages_data.append({
                "page_number": 1,
                "raw_text": full_text or f"DOCX Document: {os.path.basename(file_path)}",
                "char_count": len(full_text),
                "word_count": len(full_text.split()),
                "has_tables": len(tables_data) > 0,
                "has_images": False,
                "ocr_required": False,
                "ocr_confidence": 1.0,
                "needs_review": False,
                "tables": tables_data,
            })

        return {
            "document_id": document_id,
            "filename": os.path.basename(file_path),
            "file_type": "docx",
            "page_count": len(pages_data),
            "has_native_text": True,
            "ocr_required": False,
            "ocr_confidence": 1.0,
            "ocr_status": "NATIVE",
            "sections": sections_data,
            "paragraphs": paragraphs_data,
            "tables": tables_data,
            "table_count": len(tables_data),
            "pages": pages_data,
            "core_properties": core_properties,
            "raw_text": full_text,
            "total_words": sum(p["word_count"] for p in paragraphs_data) + sum(t.get("word_count", 0) for t in tables_data),
            "total_chars": sum(p["char_count"] for p in paragraphs_data)
        }

    def _parse_single_table(self, table: Table, table_idx: int, section_context: str, document_id: str) -> Optional[Dict[str, Any]]:
        """Extract table headers, rows, cells, and mining classification."""
        if not table.rows:
            return None

        num_rows = len(table.rows)
        num_cols = len(table.columns) if table.columns else (len(table.rows[0].cells) if table.rows else 0)

        # Extract rows
        raw_rows: List[List[str]] = []
        for row in table.rows:
            raw_rows.append([cell.text.strip().replace("\n", " ") for cell in row.cells])

        if not raw_rows:
            return None

        # Headers are usually the first row
        headers = [h if h else f"col_{c_idx + 1}" for c_idx, h in enumerate(raw_rows[0])]

        data_rows: List[Dict[str, Any]] = []
        cell_records: List[Dict[str, Any]] = []
        sample_text_tokens: List[str] = []

        for r_idx, row in enumerate(raw_rows):
            # Record individual cell coordinates for precise fact traceability
            for c_idx, cell_value in enumerate(row):
                if cell_value:
                    sample_text_tokens.append(cell_value)
                    cell_records.append({
                        "sheet": section_context or "DOCX_TABLE",
                        "row": r_idx + 1,
                        "col": c_idx + 1,
                        "column": c_idx + 1,
                        "coordinate": f"R{r_idx + 1}C{c_idx + 1}",
                        "header": headers[c_idx] if c_idx < len(headers) else f"col_{c_idx+1}",
                        "value": cell_value,
                        "formula": None,
                        "source_ref": f"Table_{table_idx + 1}:R{r_idx + 1}C{c_idx + 1}"
                    })

            if r_idx > 0:  # Data rows (excluding header)
                row_dict = {}
                for c_idx, val in enumerate(row):
                    h = headers[c_idx] if c_idx < len(headers) else f"col_{c_idx + 1}"
                    row_dict[h] = val
                data_rows.append(row_dict)

        sample_str = " ".join(sample_text_tokens[:50])
        category = self.classify_mining_table(section_context, headers, sample_str)

        all_text = " ".join(sample_text_tokens)

        table_id = f"tbl-{document_id or 'doc'}-1-{table_idx + 1}"

        return {
            "id": table_id,
            "table_id": table_id,
            "document_id": document_id,
            "table_index": table_idx + 1,
            "page_number": 1,
            "title": f"Table {table_idx + 1} - {section_context or 'Mining Data'}",
            "section_context": section_context,
            "category": category,
            "rowCount": num_rows,
            "colCount": num_cols,
            "row_count": num_rows,
            "col_count": num_cols,
            "headers": headers,
            "rows": raw_rows,
            "data": data_rows,
            "cells": cell_records,
            "word_count": len(all_text.split()),
            "sourceReference": {
                "documentId": document_id,
                "pageNumber": 1,
                "section": section_context,
                "tableNumber": table_idx + 1,
                "locator": f"DOCX:Section '{section_context}':Table {table_idx + 1}"
            }
        }

    def extract_paragraphs_and_tables(self, file_path: str) -> Dict[str, Any]:
        """Backward compatibility for existing callers."""
        res = self.parse_document(file_path)
        return {
            "paragraphs": [p["text"] for p in res["paragraphs"]],
            "tables": [t["rows"] for t in res["tables"]]
        }
