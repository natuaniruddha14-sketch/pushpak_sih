import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import pymupdf

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(BASE_DIR, "data", "synthetic_mine_data")
WEB_PUBLIC_DIR = os.path.join(BASE_DIR, "apps", "web", "public", "synthetic_mine_data")

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(WEB_PUBLIC_DIR, exist_ok=True)

print(f"[SYNTHETIC GENERATOR] Target directories:\n  -> {OUT_DIR}\n  -> {WEB_PUBLIC_DIR}")

def save_both(filename, content_bytes=None, workbook=None, pdf_doc=None):
    p1 = os.path.join(OUT_DIR, filename)
    p2 = os.path.join(WEB_PUBLIC_DIR, filename)
    if workbook:
        workbook.save(p1)
        workbook.save(p2)
    elif pdf_doc:
        pdf_doc.save(p1)
        pdf_doc.save(p2)
    elif content_bytes:
        with open(p1, "wb") as f:
            f.write(content_bytes)
        with open(p2, "wb") as f:
            f.write(content_bytes)
    print(f"  [OK] Saved: {filename}")


# -----------------------------------------------------------------------------
# 1. Gevra OCP Geological Report (PDF)
# -----------------------------------------------------------------------------
def build_gevra_pdf():
    doc = pymupdf.open()
    
    # Page 1: Cover
    p1 = doc.new_page(width=595, height=842) # A4
    # Header banner
    p1.draw_rect(pymupdf.Rect(40, 40, 555, 95), fill=(0.12, 0.18, 0.28), color=None)
    p1.insert_text((55, 68), "CENTRAL MINE PLANNING & DESIGN INSTITUTE LIMITED", fontsize=13, fontname="helv", color=(1, 0.84, 0))
    p1.insert_text((55, 84), "Regional Institute - V, Bilaspur | A Subsidiary of Coal India Limited", fontsize=9, fontname="helv", color=(0.85, 0.9, 1))

    # Title box
    p1.draw_rect(pymupdf.Rect(40, 120, 555, 230), fill=(0.95, 0.96, 0.98), color=(0.7, 0.75, 0.8), width=1)
    p1.insert_text((60, 150), "GEOLOGICAL ASSESSMENT & EXPANSION REPORT (2026)", fontsize=14, fontname="helv", color=(0.1, 0.15, 0.25))
    p1.insert_text((60, 175), "Mine Block: Gevra OpenCast Project (Expansion to 70 MTPA)", fontsize=11, fontname="helv", color=(0.2, 0.2, 0.2))
    p1.insert_text((60, 195), "Coalfield: Korba Coalfield, Mand-Raigarh Basin", fontsize=10, fontname="helv", color=(0.35, 0.35, 0.35))
    p1.insert_text((60, 212), "Project Code: PRJ-GEVRA-EXP-2026 | Document ID: doc-gevra-2026", fontsize=9, fontname="helv", color=(0.4, 0.4, 0.4))

    # Executive Overview
    overview_text = (
        "1. EXECUTIVE SUMMARY\n\n"
        "Gevra OpenCast Project (OCP), operated by South Eastern Coalfields Limited (SECL),\n"
        "represents one of the largest sovereign energy assets in India. This technical dossier\n"
        "consolidates verified borehole lithology logs, seam continuity models, and proved coal\n"
        "reserve calculations covering the Seam V, VI, and VII combined block.\n\n"
        "KEY CERTIFIED METRICS:\n"
        "• Total Proved Coal Reserves: 425.80 Million Tonnes (MT) in Seam V/VI/VII.\n"
        "• Average Seam Thickness: 18.4 meters (cumulative workable coal thickness).\n"
        "• Overburden Stripping Ratio: 2.14 m³/tonne.\n"
        "• Dominant Coal Grade: Grade G11 to G13 (Gross Calorific Value: 4,300 - 4,900 kcal/kg).\n"
        "• Annual Targeted Production: 70.00 MTPA with fully mechanized surface miners.\n\n"
        "2. GEOLOGICAL & STRATIGRAPHIC SETTING\n\n"
        "The project area is located in the South-Central sector of Korba Coalfield.\n"
        "The sedimentary strata belong to the Barakar Formation of Lower Gondwana age.\n"
        "Major structural faults show throw ranging from 5m to 25m with strike N50W-S50E.\n"
        "The coal seams exhibit remarkable lateral continuity with gentle southerly dip (3° to 5°).\n"
    )
    p1.insert_text((40, 260), overview_text, fontsize=9.5, fontname="helv", color=(0.15, 0.15, 0.15))

    # Page 2: Tabular Reserve Breakdown
    p2 = doc.new_page(width=595, height=842)
    p2.draw_rect(pymupdf.Rect(40, 40, 555, 75), fill=(0.12, 0.18, 0.28), color=None)
    p2.insert_text((55, 62), "GEVRA OCP — SEAM-WISE PROVED RESERVES & METRICS", fontsize=12, fontname="helv", color=(1, 0.84, 0))

    intro_p2 = (
        "3. PROVED RESERVES & QUALITY METRICS BREAKDOWN\n\n"
        "The table below details proved in-situ coal reserves, average thickness, stripping ratio,\n"
        "and ash percentages derived from 48 deep exploration boreholes drilled by CMPDI.\n"
    )
    p2.insert_text((40, 100), intro_p2, fontsize=10, fontname="helv", color=(0.15, 0.15, 0.15))

    # Draw Table
    table_top = 160
    row_height = 25
    cols = [40, 160, 240, 320, 410, 555]
    headers = ["Coal Seam Block", "Thickness (m)", "Proved MT", "Grade / GCV", "Stripping Ratio (m³/t)"]
    rows = [
        ["Seam V Upper", "12.4 m", "145.20 MT", "G11 (4,550 kcal/kg)", "2.28 m³/t"],
        ["Seam VI Lower", "18.2 m", "180.40 MT", "G12 (4,380 kcal/kg)", "2.05 m³/t"],
        ["Seam VII Bottom", "7.8 m", "100.20 MT", "G13 (4,250 kcal/kg)", "2.10 m³/t"],
        ["CUMULATIVE TOTAL", "18.4 m (Avg)", "425.80 MT", "G11 - G13 (Avg 4,650)", "2.14 m³/t (Overall)"]
    ]

    # Header Row
    p2.draw_rect(pymupdf.Rect(40, table_top, 555, table_top + row_height), fill=(0.2, 0.28, 0.4), color=(0.1, 0.1, 0.1), width=0.5)
    for i, h in enumerate(headers):
        p2.insert_text((cols[i] + 5, table_top + 16), h, fontsize=9, fontname="helv", color=(1, 1, 1))

    # Data Rows
    for r_idx, r_data in enumerate(rows):
        y = table_top + ((r_idx + 1) * row_height)
        fill_col = (0.92, 0.95, 0.98) if r_idx == 3 else ((0.98, 0.98, 0.98) if r_idx % 2 == 1 else (1, 1, 1))
        p2.draw_rect(pymupdf.Rect(40, y, 555, y + row_height), fill=fill_col, color=(0.7, 0.7, 0.7), width=0.5)
        for c_idx, val in enumerate(r_data):
            f_col = (0.05, 0.2, 0.4) if r_idx == 3 else (0.15, 0.15, 0.15)
            p2.insert_text((cols[c_idx] + 5, y + 16), val, fontsize=8.5, fontname="helv", color=f_col)

    # Technical Notes
    p2_notes = (
        "\n\n4. BOREHOLE VALIDATION & CONFIDENCE AUDIT\n"
        "• Primary Borehole Reference: SB-42, BH-704, and Core Log BH-812.\n"
        "• Specific Gravity of Coal: 1.48 to 1.54 g/cm³.\n"
        "• Equilibrated Moisture: 6.8% at 60% Relative Humidity and 40°C.\n"
        "• Volatile Matter (dry mineral matter free basis): 28.5%.\n"
        "• Total Overburden to be Handled: 911.21 Million Cubic Meters.\n"
        "• Certified by: CMPDI Exploration Geologist & CIL Reserves Authority."
    )
    p2.insert_text((40, table_top + (5 * row_height) + 10), p2_notes, fontsize=9.5, fontname="helv", color=(0.2, 0.2, 0.2))

    save_both("Gevra_OCP_Expansion_Geological_Report_2026.pdf", pdf_doc=doc)
    doc.close()


# -----------------------------------------------------------------------------
# 2. Rajmahal Master Exploration Report (PDF)
# -----------------------------------------------------------------------------
def build_rajmahal_pdf():
    doc = pymupdf.open()
    
    # Page 1: Cover & Project Setup
    p1 = doc.new_page(width=595, height=842)
    p1.draw_rect(pymupdf.Rect(40, 40, 555, 95), fill=(0.15, 0.25, 0.2), color=None)
    p1.insert_text((55, 68), "EASTERN COALFIELDS LIMITED & CMPDI RI-I ASANSOL", fontsize=13, fontname="helv", color=(1, 0.88, 0.4))
    p1.insert_text((55, 84), "Rajmahal Coalfield Deep Exploration & Mineral Resource Estimation", fontsize=9, fontname="helv", color=(0.9, 0.95, 0.9))

    p1.draw_rect(pymupdf.Rect(40, 120, 555, 230), fill=(0.96, 0.98, 0.96), color=(0.7, 0.8, 0.7), width=1)
    p1.insert_text((60, 150), "RAJMAHAL EXPANSION MASTER EXPLORATION DOSSIER (2026)", fontsize=13, fontname="helv", color=(0.1, 0.25, 0.15))
    p1.insert_text((60, 175), "Mine Block: Lalmatia & Hura Basin Sector (Seam III Block)", fontsize=11, fontname="helv", color=(0.2, 0.2, 0.2))
    p1.insert_text((60, 195), "Operating Subsidiary: Eastern Coalfields Limited (ECL)", fontsize=10, fontname="helv", color=(0.35, 0.35, 0.35))
    p1.insert_text((60, 212), "Project Code: PRJ-RAJMAHAL-2026 | Document ID: doc-rajmahal-2026", fontsize=9, fontname="helv", color=(0.4, 0.4, 0.4))

    body_text = (
        "1. EXECUTIVE OVERVIEW\n\n"
        "Rajmahal Coalfield represents a major power-grade coal deposit in Jharkhand.\n"
        "The basin supplies critical thermal fuel to NTPC Farakka and Kahalgaon Super Thermal\n"
        "Power Stations. This technical dossier establishes proved geological resources across\n"
        "the main mining seams.\n\n"
        "CERTIFIED GEOLOGICAL PARAMETERS:\n"
        "• Total Geological Resource: 1,250.00 Million Tonnes (MT) in Seam III.\n"
        "• Average Seam Thickness: 14.2 meters.\n"
        "• Overburden Stripping Ratio: 1.85 m³/tonne.\n"
        "• Ash Content: 24.5% to 32.0%.\n"
        "• Gross Calorific Value (GCV): 4,800 kcal/kg (Dominant Grade: G10).\n"
        "• Moisture Content: 7.2% average.\n\n"
        "2. SEAM STRATIGRAPHY & QUARRY BENCH SPECIFICATIONS\n\n"
        "Seam III is the principal deposit in the Lalmatia area. The seam occurs at shallow depths\n"
        "(between 30m and 160m), making it ideal for high-capacity dragline and shovel-dumper\n"
        "operations. The overlying overburden consists predominantly of coarse-grained sandstones\n"
        "and siltstones with good bench stability parameters."
    )
    p1.insert_text((40, 260), body_text, fontsize=9.5, fontname="helv", color=(0.15, 0.15, 0.15))

    # Page 2: Resource Classification Table
    p2 = doc.new_page(width=595, height=842)
    p2.draw_rect(pymupdf.Rect(40, 40, 555, 75), fill=(0.15, 0.25, 0.2), color=None)
    p2.insert_text((55, 62), "RAJMAHAL COALFIELD — SEAM III RESOURCE CLASSIFICATION", fontsize=12, fontname="helv", color=(1, 0.88, 0.4))

    table_top = 130
    row_height = 25
    cols = [40, 150, 240, 320, 420, 555]
    headers = ["Quarry Sector", "Seam Name", "Thickness (m)", "Ash Content (%)", "Geological Resource (MT)"]
    rows = [
        ["North Block Quarry", "Seam III Top", "8.2 m", "26.4%", "450.00 MT"],
        ["Central Sector", "Seam III Main", "14.2 m", "28.5%", "520.00 MT"],
        ["South Dip Extension", "Seam III Bottom", "6.4 m", "31.2%", "280.00 MT"],
        ["CUMULATIVE DEPOSIT", "Seam III Combined", "14.2 m (Avg)", "24.5% - 32.0%", "1,250.00 MT"]
    ]

    p2.draw_rect(pymupdf.Rect(40, table_top, 555, table_top + row_height), fill=(0.2, 0.35, 0.25), color=(0.1, 0.1, 0.1), width=0.5)
    for i, h in enumerate(headers):
        p2.insert_text((cols[i] + 5, table_top + 16), h, fontsize=9, fontname="helv", color=(1, 1, 1))

    for r_idx, r_data in enumerate(rows):
        y = table_top + ((r_idx + 1) * row_height)
        fill_col = (0.92, 0.97, 0.92) if r_idx == 3 else ((0.98, 0.98, 0.98) if r_idx % 2 == 1 else (1, 1, 1))
        p2.draw_rect(pymupdf.Rect(40, y, 555, y + row_height), fill=fill_col, color=(0.7, 0.7, 0.7), width=0.5)
        for c_idx, val in enumerate(r_data):
            f_col = (0.1, 0.35, 0.1) if r_idx == 3 else (0.15, 0.15, 0.15)
            p2.insert_text((cols[c_idx] + 5, y + 16), val, fontsize=8.5, fontname="helv", color=f_col)

    save_both("Rajmahal_Master_Exploration_Report_2026.pdf", pdf_doc=doc)
    doc.close()


# -----------------------------------------------------------------------------
# 3. Singrauli Borehole Lithology Log (Excel XLSX)
# -----------------------------------------------------------------------------
def build_singrauli_excel():
    wb = openpyxl.Workbook()
    
    # Styles
    navy_fill = PatternFill(start_color="1B2A4A", end_color="1B2A4A", fill_type="solid")
    gold_fill = PatternFill(start_color="F5A623", end_color="F5A623", fill_type="solid")
    accent_fill = PatternFill(start_color="E8F1F5", end_color="E8F1F5", fill_type="solid")
    border_thin = Border(
        left=Side(style='thin', color='CCCCCC'),
        right=Side(style='thin', color='CCCCCC'),
        top=Side(style='thin', color='CCCCCC'),
        bottom=Side(style='thin', color='CCCCCC')
    )
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    bold_font = Font(name="Calibri", size=11, bold=True)
    regular_font = Font(name="Calibri", size=10)

    # Sheet 1: Borehole Lithology Log
    ws1 = wb.active
    ws1.title = "Borehole_Lithology_Log"

    ws1.append(["CMPDI BOREHOLE CORE LOG & STRATIGRAPHIC ANALYSIS — SINGRAULI COALFIELD"])
    ws1.append(["Borehole ID: SB-42", "Location: Purewa Block", "Target Depth: 180.00 m", "Date: 2025-11-20"])
    ws1.append([])

    headers1 = [
        "From Depth (m)", "To Depth (m)", "Thickness (m)", "Lithology / Strata Type",
        "Seam Correlation", "Core Recovery (%)", "RQD (%)", "Observed Characteristics"
    ]
    ws1.append(headers1)

    log_rows = [
        [0.0, 12.5, 12.5, "Alluvial Topsoil & Clay", "Overburden", 85, 45, "Weathered clayey soil with boulder gravel"],
        [12.5, 48.0, 35.5, "Coarse Grained Sandstone", "Overburden", 94, 78, "Hard siliceous sandstone with cross-bedding"],
        [48.0, 66.4, 18.4, "Coal Seam (Bituminous)", "Purewa Seam", 98, 92, "Bright banded vitrain rich coal, GCV 4650 kcal/kg"],
        [66.4, 76.0, 9.6, "Carbonaceous Shale", "Parting Band", 92, 70, "Dark grey laminated shale with plant fossils"],
        [76.0, 84.5, 8.5, "Medium Grained Sandstone", "Parting Band", 95, 82, "Massive quartzose sandstone"],
        [84.5, 99.0, 14.5, "Coal Seam (Bituminous)", "Turra Seam", 99, 95, "Semi-lustrous coal, low ash, GCV 5120 kcal/kg"],
        [99.0, 140.0, 41.0, "Fine Grained Sandstone & Shale", "Floor Strata", 96, 85, "Competent floor bench rock"],
        [140.0, 180.0, 40.0, "Basal Tillite & Sandstone", "Talchir Formation", 98, 88, "Glacial conglomerate and green shale"]
    ]

    for r in log_rows:
        ws1.append(r)

    # Sheet 2: Proximate Analysis & Coal Quality
    ws2 = wb.create_sheet(title="Proximate_Quality_Analysis")
    ws2.append(["COAL QUALITY, PROXIMATE ANALYSIS & GCV GRADE CLASSIFICATION"])
    ws2.append(["Laboratory: CMPDI Certified Central Coal Testing Laboratory | Standard: IS 1350"])
    ws2.append([])

    headers2 = [
        "Coal Seam", "Sample ID", "Moisture (%)", "Ash (%)", "Volatile Matter (%)",
        "Fixed Carbon (%)", "GCV (kcal/kg)", "Coal Grade", "Equilibrated Stripping Ratio"
    ]
    ws2.append(headers2)

    qual_rows = [
        ["Purewa Seam Top", "SMP-PUR-01", 7.2, 28.5, 29.8, 34.5, 4650, "Grade G12", 2.14],
        ["Purewa Seam Bottom", "SMP-PUR-02", 6.8, 27.2, 30.5, 35.5, 4780, "Grade G11", 2.14],
        ["Turra Seam Main", "SMP-TUR-01", 6.2, 23.8, 31.8, 38.2, 5150, "Grade G9", 1.95],
        ["Turra Seam Bottom", "SMP-TUR-02", 6.0, 22.5, 32.4, 39.1, 5280, "Grade G9", 1.95]
    ]

    for r in qual_rows:
        ws2.append(r)

    # Style both sheets
    for ws in [ws1, ws2]:
        header_row_idx = 4
        # Title styling
        ws["A1"].font = Font(name="Calibri", size=13, bold=True, color="1B2A4A")
        ws["A2"].font = Font(name="Calibri", size=10, italic=True, color="555555")

        for col_idx in range(1, ws.max_column + 1):
            cell = ws.cell(row=header_row_idx, column=col_idx)
            cell.fill = navy_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        for row_idx in range(header_row_idx + 1, ws.max_row + 1):
            for col_idx in range(1, ws.max_column + 1):
                cell = ws.cell(row=row_idx, column=col_idx)
                cell.border = border_thin
                cell.font = regular_font
                if row_idx % 2 == 0:
                    cell.fill = accent_fill

        # Auto width
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    save_both("Singrauli_Borehole_Lithology_Log.xlsx", workbook=wb)


# -----------------------------------------------------------------------------
# 4. Kusmunda & Dipka Monthly Production Register (Excel XLSX)
# -----------------------------------------------------------------------------
def build_kusmunda_dipka_excel():
    wb = openpyxl.Workbook()
    
    teal_fill = PatternFill(start_color="0D5C75", end_color="0D5C75", fill_type="solid")
    alt_fill = PatternFill(start_color="F0F7F9", end_color="F0F7F9", fill_type="solid")
    border_thin = Border(
        left=Side(style='thin', color='DDDDDD'),
        right=Side(style='thin', color='DDDDDD'),
        top=Side(style='thin', color='DDDDDD'),
        bottom=Side(style='thin', color='DDDDDD')
    )
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    regular_font = Font(name="Calibri", size=10)
    bold_font = Font(name="Calibri", size=10, bold=True)

    ws = wb.active
    ws.title = "Production_and_Stripping_FY26"

    ws.append(["SECL COAL PRODUCTION & OVERBURDEN STRIPPING REGISTER — FY 2025-26"])
    ws.append(["Units: Kusmunda OpenCast Project & Dipka OpenCast Sector | Source: Coal Dispatch Management System"])
    ws.append([])

    headers = [
        "Month", "OpenCast Mine Block", "Target Coal (MT)", "Actual Production (MT)",
        "Overburden Removed (Mm³)", "Stripping Ratio (m³/t)", "Rakes Dispatched", "Average GCV (kcal/kg)"
    ]
    ws.append(headers)

    records = [
        ["April 2025", "Kusmunda OCP", 4.20, 4.35, 7.74, 1.78, 142, 4520],
        ["May 2025", "Kusmunda OCP", 4.10, 4.28, 7.62, 1.78, 138, 4550],
        ["June 2025", "Kusmunda OCP", 3.80, 3.90, 6.94, 1.78, 126, 4480],
        ["July 2025", "Kusmunda OCP", 3.20, 3.25, 5.79, 1.78, 105, 4410],
        ["August 2025", "Kusmunda OCP", 3.10, 3.18, 5.66, 1.78, 102, 4390],
        ["September 2025", "Kusmunda OCP", 3.50, 3.62, 6.44, 1.78, 116, 4460],
        ["October 2025", "Kusmunda OCP", 4.30, 4.45, 7.92, 1.78, 144, 4560],
        ["November 2025", "Kusmunda OCP", 4.50, 4.68, 8.33, 1.78, 151, 4610],
        ["December 2025", "Kusmunda OCP", 4.80, 4.95, 8.81, 1.78, 160, 4650],
        ["January 2026", "Kusmunda OCP", 5.00, 5.15, 9.17, 1.78, 166, 4680],
        ["February 2026", "Kusmunda OCP", 4.70, 4.82, 8.58, 1.78, 155, 4640],
        ["March 2026", "Kusmunda OCP", 5.20, 5.38, 9.58, 1.78, 174, 4700],
        ["FY 2025-26 TOTAL", "Kusmunda OCP", 50.40, 52.01, 92.58, 1.78, 1679, 4554],
        ["FY 2025-26 TOTAL", "Dipka OCP", 38.00, 38.45, 74.98, 1.95, 1240, 4620]
    ]

    for r in records:
        ws.append(r)

    # Style
    ws["A1"].font = Font(name="Calibri", size=13, bold=True, color="0D5C75")
    ws["A2"].font = Font(name="Calibri", size=10, italic=True, color="555555")

    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=4, column=col_idx)
        cell.fill = teal_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    for row_idx in range(5, ws.max_row + 1):
        is_total = "TOTAL" in str(ws.cell(row=row_idx, column=1).value)
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.border = border_thin
            cell.font = bold_font if is_total else regular_font
            if is_total:
                cell.fill = PatternFill(start_color="DCEEF3", end_color="DCEEF3", fill_type="solid")
            elif row_idx % 2 == 1:
                cell.fill = alt_fill

    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 14)

    save_both("Kusmunda_Dipka_Production_Quality_FY26.xlsx", workbook=wb)


# -----------------------------------------------------------------------------
# 5. CMPDI Environmental Compliance Report (PDF)
# -----------------------------------------------------------------------------
def build_environmental_pdf():
    doc = pymupdf.open()
    p1 = doc.new_page(width=595, height=842)

    p1.draw_rect(pymupdf.Rect(40, 40, 555, 95), fill=(0.18, 0.28, 0.22), color=None)
    p1.insert_text((55, 68), "MINISTRY OF COAL / CMPDI ENVIRONMENTAL COMPLIANCE AUDIT", fontsize=12, fontname="helv", color=(0.8, 1, 0.8))
    p1.insert_text((55, 84), "Half-Yearly Statutory Compliance Report — MoEFCC EC Conditions", fontsize=9, fontname="helv", color=(0.9, 0.95, 0.9))

    p1.draw_rect(pymupdf.Rect(40, 120, 555, 220), fill=(0.96, 0.98, 0.96), color=(0.7, 0.8, 0.7), width=1)
    p1.insert_text((60, 145), "ANNUAL ENVIRONMENTAL MONITORING DOSSIER (2025-26)", fontsize=13, fontname="helv", color=(0.1, 0.3, 0.15))
    p1.insert_text((60, 168), "Monitored Mines: Gevra, Kusmunda, Dipka, and Rajmahal Coalfields", fontsize=10, fontname="helv", color=(0.2, 0.2, 0.2))
    p1.insert_text((60, 188), "Reporting Period: October 2025 to March 2026", fontsize=9.5, fontname="helv", color=(0.35, 0.35, 0.35))
    p1.insert_text((60, 206), "Document ID: doc-cmpdi-env-2026 | Clearance Ref: J-11015/12/2020-IA.II(M)", fontsize=8.5, fontname="helv", color=(0.4, 0.4, 0.4))

    env_body = (
        "1. AMBIENT AIR QUALITY MONITORING (CPCB / DGMS STANDARDS)\n\n"
        "Continuous Ambient Air Quality Monitoring Stations (CAAQMS) deployed around mine\n"
        "boundaries yielded the following 24-hour average readings:\n"
        "• Particulate Matter PM10: 68.4 µg/m³ (Statutory Prescribed Limit: 100 µg/m³ - COMPLIANT)\n"
        "• Particulate Matter PM2.5: 38.2 µg/m³ (Statutory Prescribed Limit: 60 µg/m³ - COMPLIANT)\n"
        "• Sulphur Dioxide (SO2): 18.5 µg/m³ (Prescribed Limit: 80 µg/m³ - COMPLIANT)\n"
        "• Nitrogen Oxides (NOx): 24.1 µg/m³ (Prescribed Limit: 80 µg/m³ - COMPLIANT)\n\n"
        "2. MINE WATER REGIME & EFFLUENT TREATMENT\n\n"
        "• Mine Sump Water Discharge pH: 7.42 (Within neutral permissible range 6.5 - 8.5)\n"
        "• Total Suspended Solids (TSS): 28.0 mg/l (Statutory Limit: 100 mg/l)\n"
        "• Heavy Metals (Fe, Cr, As, Pb): Below Detectable Limits in discharge flumes.\n"
        "• Water Recycling: 85% of pumped mine sump water is reutilized for dust misting sprays,\n"
        "  haul road suppression tankers, and coal handling plant (CHP) washing circuits.\n\n"
        "3. AFFORESTATION & GREEN BELT STRENGTHENING\n\n"
        "• Cumulative Saplings Planted on Overburden Dumps: 185,000 native tree species.\n"
        "• Overall Survival Rate: 84.5% across reclaimed decoaled benches.\n"
        "• Certified by: State Pollution Control Board & CMPDI Environmental Division."
    )
    p1.insert_text((40, 250), env_body, fontsize=9.5, fontname="helv", color=(0.15, 0.15, 0.15))

    save_both("CMPDI_Environmental_Compliance_Report_2026.pdf", pdf_doc=doc)
    doc.close()


if __name__ == "__main__":
    print("[1/5] Building Gevra OCP Geological Report PDF...")
    build_gevra_pdf()
    print("[2/5] Building Rajmahal Exploration Report PDF...")
    build_rajmahal_pdf()
    print("[3/5] Building Singrauli Borehole Lithology Log Excel...")
    build_singrauli_excel()
    print("[4/5] Building Kusmunda Dipka Production Excel...")
    build_kusmunda_dipka_excel()
    print("[5/5] Building CMPDI Environmental Compliance PDF...")
    build_environmental_pdf()
    print("[SUCCESS] All 5 high-fidelity synthetic mine data files generated successfully!")
