import fs from 'fs';
import path from 'path';

/**
 * MineIntel Realistic Synthetic Demonstration Dataset Generator
 * 
 * IMPORTANT DISCLAIMER:
 * All figures, numbers, seam descriptions, and organizational titles in this dataset
 * are SYNTHETIC DEMONSTRATION DATA generated exclusively for MineIntel AI benchmark testing.
 * None of these files represent official CMPDI, CIL, or Ministry of Coal records.
 */

const DEMO_DIR = path.join(process.cwd(), 'data', 'demo_documents');
const UPLOADS_DIR = path.join(process.cwd(), 'storage', 'uploads');

if (!fs.existsSync(DEMO_DIR)) {
  fs.mkdirSync(DEMO_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

console.log('[MINEINTEL DEMO GENERATOR] Initializing synthetic demonstration dataset generation...');

const demoHeaderDisclaimer = `
================================================================================
                      MINEINTEL SYNTHETIC DEMO DATASET                          
  DISCLAIMER: DEMONSTRATION DATA ONLY — NOT OFFICIAL CMPDI / CIL RECORDS       
================================================================================
`;

// 1. DEMO Project Alpha Mining Report
const doc1Content = `${demoHeaderDisclaimer}
# DEMO PROJECT ALPHA MINING & EXPANSION REPORT (FY 2024-25)
**Document ID:** DEMO-DOC-ALPHA-2025  
**Project Name:** DEMO Project Alpha — Gevra Sector B  
**Reporting Period:** 2024-25  
**Authoring Body:** CMPDI Regional Institute-V (Synthetic Demo Unit)  
**Security Classification:** DEMONSTRATION DATA ONLY  

---

## 1. Executive Summary & Production Overview (Page 1)
DEMO Project Alpha represents a premier open-cast coal mining block operating under synthetic trial guidelines. Annual production capacity for reporting period FY 2024-25 is verified at **70.50 Million Tonnes (MT)**. Total proved coal reserves are estimated at **425.80 MT** within depth limits of 220 meters.

## 2. Geological Seam Parameters & Stratigraphy (Page 2)
Cross-section analysis from 42 core boreholes confirms the following seam geometry:
- **Target Seams:** Seam V (Upper Gevra) & Seam VI/VII (Combined Lower Seam)
- **Cumulative Seam Thickness:** 18.40 meters (Range: 15.2m to 21.4m)
- **Sub-crop Dip:** 4° to 6° South-West
- **Coal Quality Grade:** GCV Grade Band G11 (**4,400 kcal/kg**)
- **Proximate Quality Metrics:** Ash Content 34.20%, Moisture 7.80%, Volatile Matter 24.50%

## 3. Overburden Removal & Stripping Ratio Compliance (Page 3)
| Sector Bench | Coal Production (MT) | Overburden Volume (Mm³) | Stripping Ratio (m³/tonne) | Bench Height (m) |
| :--- | :--- | :--- | :--- | :--- |
| Quarry Bench North | 32.10 MT | 68.70 Mm³ | 2.14 m³/t | 15.0 m |
| Quarry Bench South | 38.40 MT | 82.18 Mm³ | 2.14 m³/t | 18.0 m |
| **Total Block Alpha** | **70.50 MT** | **150.88 Mm³** | **2.14 m³/t (Avg)** | **16.5 m (Avg)** |

*Page 4: Verified against Synthetic Borehole Logs BH-701 to BH-742.*
`;

// 2. DEMO Project Beta Mining Report
const doc2Content = `${demoHeaderDisclaimer}
# DEMO PROJECT BETA MINING & FEASIBILITY REPORT (FY 2024-25)
**Document ID:** DEMO-DOC-BETA-2025  
**Project Name:** DEMO Project Beta — Dipka Sector West  
**Reporting Period:** 2024-25  
**Authoring Body:** CMPDI Regional Institute-V (Synthetic Demo Unit)  
**Security Classification:** DEMONSTRATION DATA ONLY  

---

## 1. Executive Overview & Reserve Categorization (Page 1)
DEMO Project Beta encompasses 1,420 hectares of coal-bearing terrain. Evaluated proved reserves stand at **310.40 MT** under UNFC Code 111 categorization, with indicated reserves of **62.00 MT**.

## 2. Operational Metrics & Mining Method (Page 2)
- **Annual Production Capacity:** 38.20 Million Tonnes (MT)
- **Overburden Stripping Ratio:** 1.95 m³/tonne
- **Average Seam Thickness:** 15.20 meters
- **Coal Quality:** Grade G12 (**4,100 kcal/kg**)
- **Excavation Fleet:** 4 Draglines (24/96 scale), 14 Surface Miners, 42 Shovel-Dumper units

## 3. Hydrology & Pit Dewatering (Page 3)
Groundwater inflow monitoring recorded an average pit sump discharge of **8,400 m³/day** during dry season and **12,200 m³/day** during peak monsoon.
`;

// 3. DEMO Annual Production Report FY25
const doc3Content = `${demoHeaderDisclaimer}
# DEMO CIL SUBSIDIARY ANNUAL PRODUCTION REPORT (FY 2024-25)
**Document ID:** DEMO-DOC-PROD-AUDIT-2025  
**Scope:** Multi-Mine Sector Synthesis  
**Reporting Period:** 2024-25  
**Security Classification:** DEMONSTRATION DATA ONLY  

---

## 1. Sector Production Audit Benchmark Table (Page 1)
| Mine Block Name | Reporting Period | Coal Production (MT) | Proved Reserves (MT) | Stripping Ratio (m³/t) | Seam Thickness (m) | GCV Grade |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEMO Project Alpha (Gevra)** | 2024-25 | 70.50 MT | 425.80 MT | 2.14 m³/t | 18.4 m | G11 (4400 kcal) |
| **DEMO Project Beta (Dipka)** | 2024-25 | 38.20 MT | 310.40 MT | 1.95 m³/t | 15.2 m | G12 (4100 kcal) |
| **Kusmunda OCP Sector** | 2024-25 | 46.80 MT | 380.00 MT | 2.45 m³/t | 21.0 m | G10 (4700 kcal) |
| **Rajmahal OCP Sector** | 2024-25 | 22.40 MT | 215.60 MT | 3.10 m³/t | 12.8 m | G13 (3800 kcal) |
| **Singrauli Block Sector** | 2024-25 | 31.00 MT | 290.20 MT | 2.30 m³/t | 16.5 m | G11 (4500 kcal) |

*Page 2: All values cross-audited against synthetic production logs.*
`;

// 4. DEMO Geological Assessment Report
const doc4Content = `${demoHeaderDisclaimer}
# DEMO GEOLOGICAL ASSESSMENT & CORE DRILLING DOSSIER
**Document ID:** DEMO-DOC-GEOLOGY-2025  
**Project Name:** Synthetic Coalfield Core Drilling Survey  
**Reporting Period:** 2024-25  
**Security Classification:** DEMONSTRATION DATA ONLY  

---

## 1. Structural Geology & Seam Formation (Page 1)
Core logging across 120 exploratory boreholes reveals a stable Barakar Formation stratigraphy. Coal seam thickness exhibits uniform deposition across the central basin, reaching a maximum thickness of **21.0 meters** in the Kusmunda sector.

## 2. UNFC Coal Resource Classification Table (Page 2)
- **Proved Coal Reserves (111):** 1,622.00 MT (Cumulative across 5 demo blocks)
- **Indicated Coal Reserves (221):** 352.80 MT
- **Inferred Coal Reserves (333):** 118.90 MT
- **Average Seam Dip:** 3° to 7°
`;

// 5. DEMO Groundwater Assessment Report
const doc5Content = `${demoHeaderDisclaimer}
# DEMO GROUNDWATER HYDROLOGY ASSESSMENT REPORT
**Document ID:** DEMO-DOC-HYDROLOGY-2025  
**Target Basin:** Synthetic Open-Cast Mining Basins  
**Reporting Period:** 2024-25  
**Security Classification:** DEMONSTRATION DATA ONLY  

---

## 1. Hydrogeological Observations & Pit Inflow (Page 1)
Piezometric head monitoring network across 24 observation wells indicates unconfined to semi-confined aquifer behavior in the upper sandstone formation.

## 2. Monsoon Dewatering Metrics (Page 2)
- **Peak Monsoon Pit Inflow:** **14,500 m³/day** (Kusmunda pit sump)
- **Average Pit Inflow:** 9,200 m³/day (Gevra pit sump)
- **Aquifer Transmissivity:** 142 m²/day
- **Storage Coefficient:** 0.0025
- **Dewatering Infrastructure:** 8 High-head submersible pumps (250 HP) deployed at primary quarry sump.
`;

// 6. DEMO Land Reclamation Report
const doc6Content = `${demoHeaderDisclaimer}
# DEMO MINE LAND RECLAMATION & AFFORESTATION DOSSIER
**Document ID:** DEMO-DOC-RECLAMATION-2025  
**Target Sector:** Post-Mining Overburden Dump Sector  
**Reporting Period:** 2024-25  
**Security Classification:** DEMONSTRATION DATA ONLY  

---

## 1. Progressive Backfilling & Dump Slope Stability (Page 1)
Internal backfilling has progressed concurrently with coal extraction. Overburden dump slopes have been reshaped to a stable angle of 28 degrees.

## 2. Biological Reclamation Statistics (Page 2)
- **Reclaimed Area (Biological):** 145.0 Hectares
- **Tree Plantation Density:** **2,500 saplings per hectare** (Native species: Neem, Acacia, Sheesham)
- **Topsoil Management:** 1.45 Million m³ topsoil preserved in dedicated storage bunds with biological stabilization.
`;

// 7. DEMO Environmental Monitoring Report
const doc7Content = `${demoHeaderDisclaimer}
# DEMO ENVIRONMENTAL MONITORING & EMP COMPLIANCE REPORT
**Document ID:** DEMO-DOC-ENV-2025  
**Scope:** Air, Water, Noise & Dust Suppression Audit  
**Reporting Period:** 2024-25  
**Security Classification:** DEMONSTRATION DATA ONLY  

---

## 1. Ambient Air Quality Audit (Page 1)
Continuous Ambient Air Quality Monitoring Systems (CAAQMS) recorded the following 24-hour averages:
- **Particulate Matter (PM10):** 68.4 µg/m³ (Compliant with 100 µg/m³ standard)
- **Particulate Matter (PM2.5):** 32.1 µg/m³ (Compliant with 60 µg/m³ standard)
- **Sulfur Dioxide (SO2):** 14.2 µg/m³
- **Nitrogen Oxides (NOx):** 21.8 µg/m³

## 2. Effluent Treatment & Dust Suppression (Page 2)
Mine discharge water is treated through oil-grease traps and settling ponds before recycling. 100% haul roads covered with high-pressure mobile water sprinklers.
`;

// 8. DEMO Historical Scanned-Style Report (OCR Required)
const doc8Content = `${demoHeaderDisclaimer}
[SCANNED DOCUMENT OCR RECOVERY SIMULATION — VINTAGE BOREHOLE LOG 1998]
DOCUMENT REF: HISTORICAL/BH-1998/COR-04
MINE LOCATION: GEVRA BLOCK OLD QUARRY SECTOR
DRILLING DATE: 14-OCT-1998
CHIEF GEOLOGIST: DR. K.R. PRASAD (RETIRED)

================================================================================
BOREHOLE STRATIGRAPHY LOG SHEET (HANDWRITTEN OCR FIELD RECOVERY)
================================================================================
DEPTH (m)    | THICKNESS (m) | LITHOLOGY DESCRIPTION                  | RECOVERY %
0.0 - 12.5m  | 12.5m         | WEATHERED SANDSTONE OVERBURDEN         | 88.0%
12.5 - 28.9m | 16.4m         | COAL SEAM V (BLACK SHINY BITUMINOUS)   | 96.5%
28.9 - 34.2m | 5.3m          | INTERCALATED SHALE & SILTSTONE         | 92.0%
34.2 - 52.6m | 18.4m         | COAL SEAM VI/VII (HIGH GRADE CORE)     | 98.2%
================================================================================

HISTORICAL COAL QUALITY (1998 ANALYSIS):
PROVED RESERVES (1998 ESTIMATE): 385.0 MILLION TONNES
GCV GRADE: G11 (4,350 KCAL/KG)
ASH CONTENT: 33.8%
MOISTURE CONTENT: 7.2%

NOTE: SCANNED IMAGE BLUR DETECTED ON MARGINS (OCR CONFIDENCE: 78.4%).
`;

// Write text/md documents
const docs = [
  { filename: 'DEMO_Project_Alpha_Mining_Report.pdf.txt', content: doc1Content },
  { filename: 'DEMO_Project_Beta_Mining_Report.pdf.txt', content: doc2Content },
  { filename: 'DEMO_Annual_Production_Report_FY25.pdf.txt', content: doc3Content },
  { filename: 'DEMO_Geological_Assessment_Report.pdf.txt', content: doc4Content },
  { filename: 'DEMO_Groundwater_Assessment_Report.pdf.txt', content: doc5Content },
  { filename: 'DEMO_Land_Reclamation_Report.pdf.txt', content: doc6Content },
  { filename: 'DEMO_Environmental_Monitoring_Report.pdf.txt', content: doc7Content },
  { filename: 'DEMO_Historical_Scanned_Borehole_Log_1998.pdf.txt', content: doc8Content },
];

docs.forEach((doc) => {
  const p1 = path.join(DEMO_DIR, doc.filename);
  const p2 = path.join(UPLOADS_DIR, doc.filename);
  fs.writeFileSync(p1, doc.content, 'utf-8');
  fs.writeFileSync(p2, doc.content, 'utf-8');
  console.log(`[GENERATED DEMO FILE]: ${doc.filename}`);
});

// Write Excel Workbook equivalent JSON data file
const excelContent = {
  disclaimer: 'MINEINTEL SYNTHETIC DEMONSTRATION DATASET - NOT OFFICIAL CMPDI/CIL DATA',
  sheetName: 'Mining_Metrics_Master_FY25',
  records: [
    { project: 'DEMO Project Alpha', year: '2024-25', productionMt: 70.5, provedMt: 425.8, strippingRatio: 2.14, seamThickness: 18.4, gcv: 4400 },
    { project: 'DEMO Project Beta', year: '2024-25', productionMt: 38.2, provedMt: 310.4, strippingRatio: 1.95, seamThickness: 15.2, gcv: 4100 },
    { project: 'Kusmunda OCP', year: '2024-25', productionMt: 46.8, provedMt: 380.0, strippingRatio: 2.45, seamThickness: 21.0, gcv: 4700 },
    { project: 'Rajmahal OCP', year: '2024-25', productionMt: 22.4, provedMt: 215.6, strippingRatio: 3.10, seamThickness: 12.8, gcv: 3800 },
    { project: 'Singrauli Block', year: '2024-25', productionMt: 31.0, provedMt: 290.2, strippingRatio: 2.30, seamThickness: 16.5, gcv: 4500 },
  ],
};

const excelPath = path.join(DEMO_DIR, 'DEMO_Mining_Metrics_Master_FY25.xlsx.json');
fs.writeFileSync(excelPath, JSON.stringify(excelContent, null, 2), 'utf-8');
console.log(`[GENERATED DEMO FILE]: DEMO_Mining_Metrics_Master_FY25.xlsx.json`);

console.log('[MINEINTEL DEMO GENERATOR] Successfully created 8 realistic synthetic demo documents + Excel workbook.');
