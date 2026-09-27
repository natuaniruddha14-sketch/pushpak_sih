import os
from typing import Dict, Any, List, Optional
import openpyxl
import pandas as pd


class ExcelDocumentParser:
    """
    Advanced Excel and CSV document parser.
    Preserves workbook, sheet, row, column, cell values, headers, and formulas.
    Extracts structured mining tables with complete source cell traceability.
    """

    def parse_file(self, file_path: str, document_id: str = "") -> Dict[str, Any]:
        """Alias for extract_document."""
        return self.extract_document(file_path=file_path, document_id=document_id)

    def extract_document(self, file_path: str, document_id: str = "") -> Dict[str, Any]:
        """
        Parses XLSX, XLS, or CSV files into structured sheets, tables, and cell coordinates.
        """
        ext = os.path.splitext(file_path)[1].lower()
        workbook_name = os.path.basename(file_path)

        if ext == ".csv":
            return self._extract_csv(file_path, document_id, workbook_name)

        return self._extract_excel(file_path, document_id, workbook_name)

    def _extract_excel(self, file_path: str, document_id: str, workbook_name: str) -> Dict[str, Any]:
        # Load with openpyxl data_only=False to inspect formulas
        try:
            wb_formulas = openpyxl.load_workbook(file_path, data_only=False, read_only=False)
            wb_values = openpyxl.load_workbook(file_path, data_only=True, read_only=False)
        except Exception:
            wb_formulas = None
            wb_values = openpyxl.load_workbook(file_path, data_only=True)

        sheets_result = []
        all_tables = []
        table_counter = 0

        try:
            sheet_names = wb_values.sheetnames
            for sheet_idx, sheet_name in enumerate(sheet_names):
                ws_val = wb_values[sheet_name]
                ws_form = wb_formulas[sheet_name] if wb_formulas and sheet_name in wb_formulas.sheetnames else None

                rows_data = []
                headers = []
                cells_detail = []
                formulas_found = {}

                max_r = min(ws_val.max_row or 0, 500)
                max_c = min(ws_val.max_column or 0, 50)

                # Read rows
                for r in range(1, max_r + 1):
                    row_cells = []
                    is_row_empty = True
                    for c in range(1, max_c + 1):
                        cell_val = ws_val.cell(row=r, column=c).value
                        cell_form = ws_form.cell(row=r, column=c).value if ws_form else None

                        if cell_val is not None and str(cell_val).strip() != "":
                            is_row_empty = False

                        # Format value
                        val_str = str(cell_val).strip() if cell_val is not None else ""
                        row_cells.append(val_str)

                        # Check for formula
                        if cell_form is not None and str(cell_form).startswith("="):
                            coord = f"{openpyxl.utils.get_column_letter(c)}{r}"
                            formulas_found[coord] = str(cell_form)

                        cells_detail.append({
                            "sheet": sheet_name,
                            "row": r,
                            "col": c,
                            "column": c,
                            "coordinate": f"{openpyxl.utils.get_column_letter(c)}{r}",
                            "value": cell_val,
                            "formula": str(cell_form) if (cell_form and str(cell_form).startswith("=")) else None
                        })

                    if not is_row_empty:
                        rows_data.append(row_cells)

                if not rows_data:
                    continue

                # Header detection: first non-empty row
                headers = [str(h) if h else f"Col_{i+1}" for i, h in enumerate(rows_data[0])]
                data_rows = rows_data[1:] if len(rows_data) > 1 else []

                # Table classification
                sheet_text = " ".join([str(c) for r in rows_data for c in r]).lower()
                category = "general"
                if any(k in sheet_text for k in ["production", "dispatch", "extraction", "despatch", "output"]):
                    category = "production"
                elif any(k in sheet_text for k in ["gcv", "grade", "ash", "moisture", "calorific"]):
                    category = "grade"
                elif any(k in sheet_text for k in ["reserve", "proved", "indicated", "unfc"]):
                    category = "quality"
                elif any(k in sheet_text for k in ["stripping", "overburden", "ob removal"]):
                    category = "production"
                elif any(k in sheet_text for k in ["manpower", "workers", "attendance"]):
                    category = "manpower"
                elif any(k in sheet_text for k in ["safety", "injury", "fatality", "incident"]):
                    category = "safety"
                elif any(k in sheet_text for k in ["revenue", "expenditure", "cost", "capex"]):
                    category = "financial"

                table_counter += 1
                structured_data = []
                for r_idx, r in enumerate(data_rows):
                    row_dict = {}
                    for c_idx, h in enumerate(headers):
                        row_dict[h] = r[c_idx] if c_idx < len(r) else None
                    structured_data.append(row_dict)

                tbl_obj = {
                    "id": f"tbl-{document_id or 'doc'}-{sheet_idx+1}-{table_counter}",
                    "document_id": document_id,
                    "table_index": table_counter,
                    "page_number": sheet_idx + 1,
                    "sheetName": sheet_name,
                    "title": f"Workbook '{workbook_name}' • Sheet '{sheet_name}' - {category.title()} Table",
                    "category": category,
                    "headers": headers,
                    "rows": data_rows,
                    "rowCount": len(data_rows),
                    "colCount": len(headers),
                    "data": structured_data,
                    "cells": cells_detail,
                    "formulas": formulas_found,
                    "sourceReference": {
                        "documentId": document_id,
                        "sheetName": sheet_name,
                        "pageNumber": sheet_idx + 1,
                        "section": f"Sheet '{sheet_name}'"
                    }
                }
                all_tables.append(tbl_obj)

                # Plain readable sheet representation
                sheet_text_repr = f"=== WORKBOOK: {workbook_name} | SHEET: {sheet_name} ===\n"
                sheet_text_repr += f"Headers: {', '.join(headers)}\n\n"
                for r in data_rows[:30]:
                    sheet_text_repr += " | ".join(r) + "\n"

                sheets_result.append({
                    "page_number": sheet_idx + 1,
                    "sheet_name": sheet_name,
                    "raw_text": sheet_text_repr,
                    "char_count": len(sheet_text_repr),
                    "word_count": len(sheet_text_repr.split()),
                    "has_tables": True,
                    "has_images": False,
                    "ocr_required": False,
                    "ocr_confidence": 1.0,
                    "needs_review": False,
                    "table": tbl_obj
                })

        finally:
            if wb_values:
                wb_values.close()
            if wb_formulas:
                wb_formulas.close()

        all_text = "\n\n".join([p["raw_text"] for p in sheets_result])

        return {
            "document_id": document_id,
            "document_type": "EXCEL",
            "workbook_name": workbook_name,
            "sheet_count": len(sheet_names),
            "sheets": sheet_names,
            "page_count": len(sheets_result),
            "tables": all_tables,
            "table_count": len(all_tables),
            "pages": sheets_result,
            "raw_text": all_text,
            "has_native_text": True,
            "ocr_required": False,
            "ocr_status": "NATIVE",
            "ocr_confidence": 1.0,
            "average_confidence": 1.0,
        }

    def _extract_csv(self, file_path: str, document_id: str, workbook_name: str) -> Dict[str, Any]:
        df = pd.read_csv(file_path).fillna("")
        headers = [str(c) for c in df.columns]
        rows = df.values.tolist()

        csv_text = f"=== CSV DOCUMENT: {workbook_name} ===\n"
        csv_text += f"Headers: {', '.join(headers)}\n\n"
        for r in rows[:50]:
            csv_text += " | ".join([str(c) for c in r]) + "\n"

        structured_data = df.to_dict(orient="records")

        # Build cells for traceability
        cells_detail = []
        for r_idx, r in enumerate(rows):
            for c_idx, val in enumerate(r):
                cells_detail.append({
                    "sheet": "CSV_DATA",
                    "row": r_idx + 1,
                    "col": c_idx + 1,
                    "column": c_idx + 1,
                    "coordinate": f"R{r_idx+1}C{c_idx+1}",
                    "value": val,
                    "formula": None
                })

        table_obj = {
            "id": f"tbl-{document_id or 'doc'}-1-1",
            "document_id": document_id,
            "table_index": 1,
            "page_number": 1,
            "sheetName": "CSV_DATA",
            "title": f"CSV Dataset • {workbook_name}",
            "category": "production" if any("prod" in h.lower() for h in headers) else "general",
            "headers": headers,
            "rows": rows,
            "rowCount": len(rows),
            "colCount": len(headers),
            "data": structured_data,
            "cells": cells_detail,
            "sourceReference": {
                "documentId": document_id,
                "sheetName": "CSV_DATA",
                "pageNumber": 1,
                "section": "CSV Table"
            }
        }

        return {
            "document_id": document_id,
            "document_type": "EXCEL",
            "workbook_name": workbook_name,
            "sheet_count": 1,
            "sheets": ["CSV_DATA"],
            "page_count": 1,
            "tables": [table_obj],
            "table_count": 1,
            "pages": [{
                "page_number": 1,
                "sheet_name": "CSV_DATA",
                "raw_text": csv_text,
                "char_count": len(csv_text),
                "word_count": len(csv_text.split()),
                "has_tables": True,
                "has_images": False,
                "ocr_required": False,
                "ocr_confidence": 1.0,
                "needs_review": False,
                "table": table_obj
            }],
            "raw_text": csv_text,
            "has_native_text": True,
            "ocr_required": False,
            "ocr_status": "NATIVE",
            "ocr_confidence": 1.0,
            "average_confidence": 1.0,
        }

    def extract_sheets(self, file_path: str) -> Dict[str, List[Dict[str, Any]]]:
        """Backward-compatible helper extracting sheet records."""
        doc = self.extract_document(file_path=file_path)
        out = {}
        for p in doc["pages"]:
            if "table" in p:
                out[p.get("sheet_name", "Sheet1")] = p["table"]["data"]
        return out
