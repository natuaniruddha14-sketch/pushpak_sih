import os
import io
import pytest
import pymupdf
import docx
import openpyxl
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from app.main import app
from app.document_parsers import (
    PDFDocumentParser,
    ExcelDocumentParser,
    DocxDocumentParser,
    ImageDocumentParser,
)


@pytest.fixture
def sample_pdf(tmp_path):
    """Creates a sample PDF with selectable text and a mining table."""
    pdf_path = tmp_path / "mining_sample.pdf"
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 50), "CMPDI / Coal India Limited\nAnnual Production and Quality Report\nGevra OpenCast Project\nTotal Coal Output: 45.20 MT\nAsh Content: 32.5 %", fontsize=12)
    doc.save(str(pdf_path))
    doc.close()
    return str(pdf_path)


@pytest.fixture
def sample_excel(tmp_path):
    """Creates a sample Excel file with sheets, headers, formulas, and cells."""
    xlsx_path = tmp_path / "dispatch_data.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Dispatch_2024"
    ws.append(["Siding", "Coal Grade", "Rakes Loaded", "Offtake (MT)"])
    ws.append(["Siding A", "G11", 120, 0.45])
    ws.append(["Siding B", "G12", 80, 0.30])
    ws.append(["Total", "-", 200, "=SUM(D2:D3)"])
    wb.save(str(xlsx_path))
    return str(xlsx_path)


@pytest.fixture
def sample_csv(tmp_path):
    """Creates a sample CSV file."""
    csv_path = tmp_path / "manpower.csv"
    csv_path.write_text("Shift,Mine Area,Executives,Workers,Total\nMorning,Pit 1,12,150,162\nEvening,Pit 2,10,140,150\n")
    return str(csv_path)


@pytest.fixture
def sample_docx(tmp_path):
    """Creates a sample DOCX file with headings and tables."""
    docx_path = tmp_path / "geology_report.docx"
    doc = docx.Document()
    doc.add_heading("Geological Reserves and Seam Characteristics", level=1)
    doc.add_paragraph("This report evaluates the proved coal reserves for Kusmunda block.")
    
    table = doc.add_table(rows=3, cols=3)
    table.cell(0, 0).text = "Seam Name"
    table.cell(0, 1).text = "Thickness (m)"
    table.cell(0, 2).text = "Proved Reserves (MT)"

    table.cell(1, 0).text = "Seam V"
    table.cell(1, 1).text = "14.2"
    table.cell(1, 2).text = "120.5"

    table.cell(2, 0).text = "Seam VI"
    table.cell(2, 1).text = "18.5"
    table.cell(2, 2).text = "210.0"

    doc.save(str(docx_path))
    return str(docx_path)


@pytest.fixture
def sample_image(tmp_path):
    """Creates a sample PNG image."""
    img_path = tmp_path / "safety_dashboard.png"
    img = Image.new("RGB", (400, 200), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([10, 10, 390, 190], outline=(0, 0, 0), width=2)
    img.save(str(img_path))
    return str(img_path)


class TestDocumentParsers:
    def test_pdf_parser_native_text(self, sample_pdf):
        parser = PDFDocumentParser()
        res = parser.parse_pdf(sample_pdf, document_id="doc-test-pdf")
        assert res["has_native_text"] is True
        assert res["ocr_required"] is False
        assert "45.20 MT" in res["raw_text"]
        assert len(res["pages"]) == 1
        assert res["pages"][0]["page_number"] == 1

    def test_excel_parser_preserves_cells_and_formulas(self, sample_excel):
        parser = ExcelDocumentParser()
        res = parser.parse_file(sample_excel, document_id="doc-test-xlsx")
        assert res["sheet_count"] == 1
        assert "Dispatch_2024" in res["sheets"]
        tables = res["tables"]
        assert len(tables) >= 1
        t = tables[0]
        assert "Offtake (MT)" in t["headers"]
        # Traceability: cells have row and col
        assert any(c["value"] == "G11" and c["row"] == 2 and c["col"] == 2 for c in t["cells"])
        # Check formula preservation
        total_row = [c for c in t["cells"] if c["row"] == 4 and c["col"] == 4]
        assert len(total_row) > 0
        assert total_row[0]["formula"] == "=SUM(D2:D3)" or "=SUM(D2:D3)" in str(total_row[0].get("formula", ""))

    def test_csv_parser(self, sample_csv):
        parser = ExcelDocumentParser()
        res = parser.parse_file(sample_csv, document_id="doc-test-csv")
        assert res["table_count"] == 1
        assert "Executives" in res["tables"][0]["headers"]
        assert len(res["tables"][0]["rows"]) == 2

    def test_docx_parser(self, sample_docx):
        parser = DocxDocumentParser()
        res = parser.parse_document(sample_docx, document_id="doc-test-docx")
        assert res["table_count"] == 1
        t = res["tables"][0]
        assert "Thickness (m)" in t["headers"]
        assert any(c["value"] == "Seam V" for c in t["cells"])
        assert any(s["title"] == "Geological Reserves and Seam Characteristics" for s in res["sections"])

    def test_image_parser(self, sample_image):
        parser = ImageDocumentParser()
        res = parser.parse_image(sample_image, document_id="doc-test-img")
        assert res["page_count"] == 1
        assert res["ocr_required"] is True
        assert "image_metadata" in res
        assert res["image_metadata"]["width"] == 400

    def test_unified_ingest_endpoint(self, sample_pdf, sample_excel, sample_docx):
        client = TestClient(app)

        # Ingest PDF
        pdf_res = client.post("/api/v1/ingest/process-document", json={
            "document_id": "test-ingest-pdf",
            "file_path": sample_pdf,
            "filename": "mining_sample.pdf",
            "metadata": {"mine": "Gevra OpenCast", "subsidiary": "SECL"}
        })
        assert pdf_res.status_code == 200
        pdf_data = pdf_res.json()
        assert pdf_data["success"] is True
        assert pdf_data["processing_status"] in ["COMPLETED", "PARTIAL"]
        assert len(pdf_data["pages"]) >= 1

        # Ingest Excel
        xlsx_res = client.post("/api/v1/ingest/process-document", json={
            "document_id": "test-ingest-xlsx",
            "file_path": sample_excel,
            "filename": "dispatch_data.xlsx"
        })
        assert xlsx_res.status_code == 200
        xlsx_data = xlsx_res.json()
        assert xlsx_data["success"] is True
        assert len(xlsx_data["tables"]) >= 1

        # Ingest DOCX
        docx_res = client.post("/api/v1/ingest/process-document", json={
            "document_id": "test-ingest-docx",
            "file_path": sample_docx,
            "filename": "geology_report.docx"
        })
        assert docx_res.status_code == 200
        docx_data = docx_res.json()
        assert docx_data["success"] is True
        assert len(docx_data["tables"]) >= 1
