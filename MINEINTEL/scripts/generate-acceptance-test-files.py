import os
import io
import pymupdf
import openpyxl
import docx
from PIL import Image, ImageDraw, ImageFont

TEST_DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "acceptance_test_docs")
os.makedirs(TEST_DOCS_DIR, exist_ok=True)

print(f"[GENERATOR] Generating test files in: {TEST_DOCS_DIR}")

# 1. Normal PDF (selectable text + mining table)
def generate_normal_pdf():
    pdf_path = os.path.join(TEST_DOCS_DIR, "normal_mining_report.pdf")
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842) # A4
    
    # Title & Text
    text = (
        "CMPDI / Coal India Limited - Operational Assessment Report\n"
        "Mine Name: Gevra OpenCast Project\n"
        "Subsidiary: South Eastern Coalfields Limited (SECL)\n"
        "Department: Production & Planning\n"
        "Reporting Date: 2026-03-15\n\n"
        "1. Executive Summary\n"
        "Total raw coal production reached 45.20 MT for the fiscal year.\n"
        "Target coal seams include Seam V and Seam VI/VII with average thickness of 18.4m.\n\n"
        "2. Production and Dispatch Metrics\n"
    )
    page.insert_text((50, 60), text, fontsize=11)
    
    # Table drawing with lines and text for PyMuPDF table finder
    # Draw table bounding rectangle
    rect = pymupdf.Rect(50, 220, 520, 320)
    page.draw_rect(rect, color=(0.2, 0.2, 0.2), width=1)
    
    # Horizontal grid lines
    page.draw_line(pymupdf.Point(50, 245), pymupdf.Point(520, 245), color=(0.2, 0.2, 0.2), width=1)
    page.draw_line(pymupdf.Point(50, 270), pymupdf.Point(520, 270), color=(0.2, 0.2, 0.2), width=1)
    page.draw_line(pymupdf.Point(50, 295), pymupdf.Point(520, 295), color=(0.2, 0.2, 0.2), width=1)
    
    # Vertical grid lines
    page.draw_line(pymupdf.Point(180, 220), pymupdf.Point(180, 320), color=(0.2, 0.2, 0.2), width=1)
    page.draw_line(pymupdf.Point(320, 220), pymupdf.Point(320, 320), color=(0.2, 0.2, 0.2), width=1)
    page.draw_line(pymupdf.Point(420, 220), pymupdf.Point(420, 320), color=(0.2, 0.2, 0.2), width=1)
    
    # Headers
    page.insert_text((55, 237), "Coal Seam", fontsize=10)
    page.insert_text((185, 237), "Thickness (m)", fontsize=10)
    page.insert_text((325, 237), "Coal Grade", fontsize=10)
    page.insert_text((425, 237), "Proved Reserves (MT)", fontsize=10)
    
    # Row 1
    page.insert_text((55, 260), "Seam V Upper", fontsize=10)
    page.insert_text((185, 260), "12.4 m", fontsize=10)
    page.insert_text((325, 260), "G11", fontsize=10)
    page.insert_text((425, 260), "145.20 MT", fontsize=10)
    
    # Row 2
    page.insert_text((55, 285), "Seam VI Lower", fontsize=10)
    page.insert_text((185, 285), "18.2 m", fontsize=10)
    page.insert_text((325, 285), "G12", fontsize=10)
    page.insert_text((425, 285), "280.60 MT", fontsize=10)
    
    # Row 3 (Total)
    page.insert_text((55, 310), "Total Reserve", fontsize=10)
    page.insert_text((185, 310), "30.6 m", fontsize=10)
    page.insert_text((325, 310), "Mixed Band", fontsize=10)
    page.insert_text((425, 310), "425.80 MT", fontsize=10)
    
    doc.save(pdf_path)
    doc.close()
    print(f"Generated normal PDF: {pdf_path}")
    return pdf_path

# 2. Scanned PDF (Image only, no native selectable text)
def generate_scanned_pdf():
    pdf_path = os.path.join(TEST_DOCS_DIR, "scanned_safety_audit.pdf")
    
    # Render an image with clear text
    img = Image.new("RGB", (1200, 1600), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Large readable text simulating a scanned document page
    draw.rectangle([50, 50, 1150, 1550], outline=(100, 100, 100), width=3)
    draw.text((100, 100), "CENTRAL MINE PLANNING AND DESIGN INSTITUTE", fill=(0, 0, 0))
    draw.text((100, 150), "ANNUAL SAFETY AUDIT & MINE INSPECTION", fill=(0, 0, 0))
    draw.text((100, 220), "Mine Name: Kusmunda OpenCast Mine", fill=(0, 0, 0))
    draw.text((100, 270), "Subsidiary: SECL Bilaspur", fill=(0, 0, 0))
    draw.text((100, 320), "Safety Compliance Status: FULLY COMPLIANT", fill=(0, 0, 0))
    draw.text((100, 370), "Lost Time Injury Frequency Rate (LTIFR): 0.00", fill=(0, 0, 0))
    draw.text((100, 420), "Gas Monitoring in Under-bench: Normal (CH4 < 0.1%)", fill=(0, 0, 0))
    draw.text((100, 470), "Explosive Storage Compliance: DGMS Standard Approved", fill=(0, 0, 0))
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_bytes = img_byte_arr.getvalue()
    
    # Create PDF with ONLY the image
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    img_rect = pymupdf.Rect(0, 0, 595, 842)
    page.insert_image(img_rect, stream=img_bytes)
    
    doc.save(pdf_path)
    doc.close()
    print(f"Generated scanned PDF: {pdf_path}")
    return pdf_path

# 3. Image (PNG with mining dispatch data)
def generate_image():
    img_path = os.path.join(TEST_DOCS_DIR, "dipka_dispatch_board.png")
    img = Image.new("RGB", (800, 400), color=(250, 250, 250))
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([20, 20, 780, 380], outline=(40, 40, 40), width=2)
    draw.text((40, 40), "MINEINTEL DISPATCH & OVERBURDEN DASHBOARD", fill=(10, 10, 10))
    draw.text((40, 80), "Mine: Dipka OpenCast Sector", fill=(10, 10, 10))
    draw.text((40, 120), "Subsidiary: SECL Coal Dispatch Division", fill=(10, 10, 10))
    draw.text((40, 160), "Daily Overburden Removal: 85.50 Thousand Cubic Meters", fill=(10, 10, 10))
    draw.text((40, 200), "Rakes Despatched: 32 Rakes to NTPC Power Plants", fill=(10, 10, 10))
    draw.text((40, 240), "Average Coal Grade Despatched: G11 Band", fill=(10, 10, 10))
    
    img.save(img_path)
    print(f"Generated PNG image: {img_path}")
    return img_path

# 4. Excel file (XLSX with sheet, cells, headers, formula)
def generate_excel():
    xlsx_path = os.path.join(TEST_DOCS_DIR, "seam_quality_analysis.xlsx")
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Seam_Quality_2026"
    
    # Headers
    ws.append(["Seam Name", "Ash Percent", "Moisture Percent", "GCV kcal per kg", "Tonnage MT"])
    
    # Data rows
    ws.append(["Seam V Upper", 32.5, 7.8, 4400, 24.5])
    ws.append(["Seam VI Lower", 28.2, 6.5, 4850, 35.8])
    ws.append(["Seam VII Bottom", 35.1, 8.2, 4150, 18.2])
    
    # Formula row
    ws.append(["Total Reserve", "-", "-", "-", "=SUM(E2:E4)"])
    
    wb.save(xlsx_path)
    print(f"Generated Excel file: {xlsx_path}")
    return xlsx_path

# 5. DOCX (Headings, paragraphs, structured table)
def generate_docx():
    docx_path = os.path.join(TEST_DOCS_DIR, "geological_survey_report.docx")
    doc = docx.Document()
    
    doc.add_heading("CMPDI Exploration & Geological Survey Report", level=1)
    
    doc.add_paragraph(
        "This formal technical document covers the stratigraphic seam correlation and "
        "proved coal reserves for the Rajmahal expansion block operated by Eastern Coalfields Limited (ECL)."
    )
    
    doc.add_heading("Reserve Stratigraphy and Grade Classification", level=2)
    
    table = doc.add_table(rows=4, cols=4)
    # Header row
    table.cell(0, 0).text = "Coalfield Area"
    table.cell(0, 1).text = "Target Seam"
    table.cell(0, 2).text = "Grade Category"
    table.cell(0, 3).text = "Proved MT"
    
    # Row 1
    table.cell(1, 0).text = "North Block Quarry"
    table.cell(1, 1).text = "Seam II/III"
    table.cell(1, 2).text = "Grade G10"
    table.cell(1, 3).text = "85.40"
    
    # Row 2
    table.cell(2, 0).text = "Central Sector"
    table.cell(2, 1).text = "Seam IV Top"
    table.cell(2, 2).text = "Grade G11"
    table.cell(2, 3).text = "120.60"
    
    # Row 3
    table.cell(3, 0).text = "South Dip Extension"
    table.cell(3, 1).text = "Seam V Main"
    table.cell(3, 2).text = "Grade G12"
    table.cell(3, 3).text = "94.20"
    
    doc.save(docx_path)
    print(f"Generated DOCX file: {docx_path}")
    return docx_path

if __name__ == "__main__":
    generate_normal_pdf()
    generate_scanned_pdf()
    generate_image()
    generate_excel()
    generate_docx()
    print("[SUCCESS] All 5 acceptance test documents generated successfully!")
