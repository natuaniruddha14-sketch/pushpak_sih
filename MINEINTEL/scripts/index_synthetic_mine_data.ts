import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient, DocumentType, ProcessingStage } from '@prisma/client';

const prisma = new PrismaClient();

const DATA_DIR = path.join(process.cwd(), 'data', 'synthetic_mine_data');
const ADMIN_EMAIL = 'admin@cmpdi.in';

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
}

async function indexSyntheticMineData() {
  console.log('================================================================');
  console.log('       INDEXING SYNTHETIC MINE DATA (PDFs & EXCEL WORKBOOKS)     ');
  console.log('================================================================\n');

  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    throw new Error(`Admin user ${ADMIN_EMAIL} not found.`);
  }

  const projects = await prisma.project.findMany();
  const gevraProject = projects.find((p) => p.name.includes('Gevra')) || projects[0];
  const rajmahalProject = projects.find((p) => p.name.includes('Rajmahal')) || projects[1] || projects[0];
  const piparwarProject = projects.find((p) => p.name.includes('Piparwar')) || projects[2] || projects[0];

  const docsToSeed = [
    {
      filename: 'Gevra_OCP_Expansion_Geological_Report_2026.pdf',
      title: 'Gevra OCP Expansion Geological Assessment Report 2026',
      fileType: DocumentType.PDF,
      mimeType: 'application/pdf',
      project: gevraProject,
      mineName: 'Gevra OpenCast Project',
      blockName: 'Seam V/VI/VII Expansion Sector',
      coalSeam: 'Seam V, VI and VII Combined',
      reserveCategory: 'Proved Reserve',
      subsidiary: 'SECL',
      sourceDepartment: 'Geology & Mineral Resource Department',
      reportYear: 2026,
      pages: [
        {
          pageNumber: 1,
          text: `CENTRAL MINE PLANNING & DESIGN INSTITUTE LIMITED
Regional Institute - V, Bilaspur | Subsidiary of Coal India Limited
GEOLOGICAL ASSESSMENT & EXPANSION REPORT (2026)
Mine Block: Gevra OpenCast Project (Expansion to 70 MTPA)
Coalfield: Korba Coalfield, Mand-Raigarh Basin
Project Code: PRJ-GEVRA-EXP-2026

EXECUTIVE SUMMARY:
Total Proved Coal Reserves: 425.80 Million Tonnes (MT) in Seam V/VI/VII.
Average Seam Thickness: 18.4 meters (cumulative workable coal thickness).
Overburden Stripping Ratio: 2.14 m³/tonne.
Dominant Coal Grade: Grade G11 to G13 (Gross Calorific Value: 4,300 - 4,900 kcal/kg).
Annual Targeted Production: 70.00 MTPA with fully mechanized surface miners.`,
          chunks: [
            'Proved coal reserve established in Gevra OCP Seam V/VI/VII block stands at 425.80 Million Tonnes (MT) with an average seam thickness of 18.4 meters and stripping ratio of 2.14 m3/t.',
            'Coal grade in Gevra OpenCast ranges from Grade G11 to G13 with Gross Calorific Value (GCV) between 4,300 and 4,900 kcal/kg. Average GCV is 4,650 kcal/kg.',
          ],
        },
        {
          pageNumber: 2,
          text: `GEVRA OCP — SEAM-WISE PROVED RESERVES & METRICS
Seam V Upper: Thickness 12.4m | Proved Reserves 145.20 MT | Grade G11 (4,550 kcal/kg) | Stripping Ratio 2.28 m3/t.
Seam VI Lower: Thickness 18.2m | Proved Reserves 180.40 MT | Grade G12 (4,380 kcal/kg) | Stripping Ratio 2.05 m3/t.
Seam VII Bottom: Thickness 7.8m | Proved Reserves 100.20 MT | Grade G13 (4,250 kcal/kg) | Stripping Ratio 2.10 m3/t.
CUMULATIVE TOTAL: Average Seam Thickness 18.4m | Proved Reserves 425.80 MT | Stripping Ratio 2.14 m3/t.
Total Overburden Volume to be Handled: 911.21 Million Cubic Meters.`,
          chunks: [
            'Seam-wise breakdown for Gevra: Seam V Upper contains 145.20 MT proved coal; Seam VI Lower contains 180.40 MT; Seam VII Bottom contains 100.20 MT, yielding 425.80 MT total proved reserve.',
            'Total overburden volume in Gevra OCP expansion sector is 911.21 Million Cubic Meters at an average stripping ratio of 2.14 m3 per tonne of coal mined.',
          ],
        },
      ],
      tables: [
        {
          tableName: 'Gevra_Seam_Reserves_Summary',
          columns: ['Seam Name', 'Thickness (m)', 'Proved Reserves (MT)', 'Coal Grade', 'Stripping Ratio (m3/t)'],
          rows: [
            ['Seam V Upper', '12.4', '145.20', 'G11', '2.28'],
            ['Seam VI Lower', '18.2', '180.40', 'G12', '2.05'],
            ['Seam VII Bottom', '7.8', '100.20', 'G13', '2.10'],
            ['Cumulative Total', '18.4', '425.80', 'G11-G13', '2.14'],
          ],
        },
      ],
    },
    {
      filename: 'Rajmahal_Master_Exploration_Report_2026.pdf',
      title: 'Rajmahal Master Exploration Dossier & Resource Estimation 2026',
      fileType: DocumentType.PDF,
      mimeType: 'application/pdf',
      project: rajmahalProject,
      mineName: 'Rajmahal OpenCast Mine',
      blockName: 'Lalmatia & Hura Basin Sector',
      coalSeam: 'Seam III Block',
      reserveCategory: 'Geological Resource',
      subsidiary: 'ECL',
      sourceDepartment: 'Exploration & Drilling Division',
      reportYear: 2026,
      pages: [
        {
          pageNumber: 1,
          text: `EASTERN COALFIELDS LIMITED & CMPDI RI-I ASANSOL
RAJMAHAL EXPANSION MASTER EXPLORATION DOSSIER (2026)
Mine Block: Lalmatia & Hura Basin Sector (Seam III Block)
Operating Subsidiary: Eastern Coalfields Limited (ECL)

CERTIFIED GEOLOGICAL PARAMETERS:
• Total Geological Resource: 1,250.00 Million Tonnes (MT) in Seam III.
• Average Seam Thickness: 14.2 meters.
• Overburden Stripping Ratio: 1.85 m³/tonne.
• Ash Content: 24.5% to 32.0%.
• Gross Calorific Value (GCV): 4,800 kcal/kg (Dominant Grade: G10).
• Moisture Content: 7.2% average.`,
          chunks: [
            'Rajmahal Coalfield geological resource stands at 1,250.00 Million Tonnes (MT) in Seam III with average thickness 14.2m, ash content 24.5% to 32.0%, and Gross Calorific Value (GCV) 4,800 kcal/kg.',
            'The overburden stripping ratio for Rajmahal Coalfield is 1.85 m3/tonne, with coal supplies feeding NTPC Farakka and Kahalgaon Super Thermal Power Stations.',
          ],
        },
        {
          pageNumber: 2,
          text: `RAJMAHAL COALFIELD — SEAM III RESOURCE CLASSIFICATION
North Block Quarry: Thickness 8.2m | Ash Content 26.4% | Resource 450.00 MT.
Central Sector: Thickness 14.2m | Ash Content 28.5% | Resource 520.00 MT.
South Dip Extension: Thickness 6.4m | Ash Content 31.2% | Resource 280.00 MT.
CUMULATIVE SEAM III DEPOSIT: Average Thickness 14.2m | Ash 24.5% - 32.0% | Total Resource 1,250.00 MT.`,
          chunks: [
            'Seam III in Rajmahal Central Sector demonstrates an average seam thickness of 14.2m with 520 MT resource, while North Block Quarry holds 450 MT with 26.4% ash content.',
          ],
        },
      ],
      tables: [
        {
          tableName: 'Rajmahal_Seam_III_Resources',
          columns: ['Sector', 'Seam Name', 'Thickness (m)', 'Ash Content (%)', 'Geological Resource (MT)'],
          rows: [
            ['North Block Quarry', 'Seam III Top', '8.2', '26.4%', '450.00'],
            ['Central Sector', 'Seam III Main', '14.2', '28.5%', '520.00'],
            ['South Dip Extension', 'Seam III Bottom', '6.4', '31.2%', '280.00'],
            ['Total Resource', 'Seam III Combined', '14.2', '24.5%-32.0%', '1250.00'],
          ],
        },
      ],
    },
    {
      filename: 'Singrauli_Borehole_Lithology_Log.xlsx',
      title: 'Singrauli Coalfield Borehole SB-42 Lithology & Quality Analysis',
      fileType: DocumentType.EXCEL,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      project: gevraProject,
      mineName: 'Singrauli Mining Block',
      blockName: 'Purewa & Turra Sector',
      coalSeam: 'Purewa / Turra Seam',
      reserveCategory: 'Indicated Reserve',
      subsidiary: 'NCL',
      sourceDepartment: 'Core Drilling & Chemical Laboratory',
      reportYear: 2025,
      pages: [
        {
          pageNumber: 1,
          text: `CMPDI BOREHOLE CORE LOG & STRATIGRAPHIC ANALYSIS — SINGRAULI COALFIELD
Borehole ID: SB-42 | Location: Purewa Block | Target Depth: 180.00m
Lithology Log:
0.0 - 12.5m: Alluvial Topsoil & Clay (12.5m)
12.5 - 48.0m: Coarse Grained Sandstone (35.5m)
48.0 - 66.4m: Coal Seam (Purewa Seam), Thickness: 18.4m, Core Recovery 98%, GCV 4650 kcal/kg, Grade G12.
66.4 - 84.5m: Parting Sandstone & Carbonaceous Shale (18.1m)
84.5 - 99.0m: Coal Seam (Turra Seam), Thickness: 14.5m, Core Recovery 99%, GCV 5120 kcal/kg, Grade G9.`,
          chunks: [
            'Borehole SB-42 in Singrauli Coalfield logged Purewa seam cumulative thickness at 18.4m with GCV grade G12 (4650 kcal/kg) and core recovery of 98%.',
            'Turra seam intersection in Borehole SB-42 measured 14.5m in thickness between 84.5m and 99.0m depth, yielding Grade G9 coal with GCV 5120 kcal/kg.',
          ],
        },
      ],
      tables: [
        {
          tableName: 'Borehole_SB42_Lithology',
          columns: ['From Depth (m)', 'To Depth (m)', 'Thickness (m)', 'Strata Type', 'Seam', 'GCV (kcal/kg)', 'Grade'],
          rows: [
            ['48.0', '66.4', '18.4', 'Coal (Bituminous)', 'Purewa Seam', '4650', 'Grade G12'],
            ['84.5', '99.0', '14.5', 'Coal (Bituminous)', 'Turra Seam', '5120', 'Grade G9'],
          ],
        },
      ],
    },
    {
      filename: 'Kusmunda_Dipka_Production_Quality_FY26.xlsx',
      title: 'Kusmunda & Dipka Monthly Coal Production & Stripping Register FY26',
      fileType: DocumentType.EXCEL,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      project: piparwarProject,
      mineName: 'Kusmunda & Dipka OCP',
      blockName: 'Central Korba Sector',
      coalSeam: 'Lower Kusmunda / Dipka Seam I & II',
      reserveCategory: 'Production Register',
      subsidiary: 'SECL',
      sourceDepartment: 'Production & Coal Dispatch',
      reportYear: 2026,
      pages: [
        {
          pageNumber: 1,
          text: `SECL COAL PRODUCTION & OVERBURDEN STRIPPING REGISTER — FY 2025-26
Kusmunda OpenCast Project FY26 Total: Target Coal 50.40 MT | Actual Production 52.01 MT | Overburden Removed 92.58 Mm³ | Stripping Ratio 1.78 m³/t | Rakes Dispatched 1,679.
Dipka OpenCast Sector FY26 Total: Target Coal 38.00 MT | Actual Production 38.45 MT | Overburden Removed 74.98 Mm³ | Stripping Ratio 1.95 m³/t | Rakes Dispatched 1,240.
Combined SECL Mega Mines Production: 90.46 Million Tonnes with 167.56 Mm³ total overburden removal.`,
          chunks: [
            'Kusmunda OpenCast Project achieved total raw coal production of 52.01 Million Tonnes in FY 2025-26 against a target of 50.40 MT, with an average stripping ratio of 1.78 m3/tonne.',
            'Dipka OpenCast Sector produced 38.45 MT of coal in FY 2025-26 with overburden removal of 74.98 Mm3, operating at a stripping ratio of 1.95 m3/tonne.',
          ],
        },
      ],
      tables: [
        {
          tableName: 'Kusmunda_Dipka_FY26_Summary',
          columns: ['Mine Block', 'Target Coal (MT)', 'Actual Coal (MT)', 'Overburden (Mm3)', 'Stripping Ratio (m3/t)', 'Rakes Dispatched'],
          rows: [
            ['Kusmunda OCP', '50.40', '52.01', '92.58', '1.78', '1679'],
            ['Dipka OCP', '38.00', '38.45', '74.98', '1.95', '1240'],
          ],
        },
      ],
    },
    {
      filename: 'CMPDI_Environmental_Compliance_Report_2026.pdf',
      title: 'CMPDI Half-Yearly Environmental Compliance & Air Quality Audit 2026',
      fileType: DocumentType.PDF,
      mimeType: 'application/pdf',
      project: gevraProject,
      mineName: 'Korba Coalfield Sector',
      blockName: 'Environmental Buffer Zone',
      coalSeam: 'Regional Baseline',
      reserveCategory: 'Environmental Audit',
      subsidiary: 'CMPDI',
      sourceDepartment: 'Environment & Climate Change Division',
      reportYear: 2026,
      pages: [
        {
          pageNumber: 1,
          text: `MINISTRY OF COAL / CMPDI ENVIRONMENTAL COMPLIANCE AUDIT (2025-26)
Monitored Mines: Gevra, Kusmunda, Dipka, and Rajmahal Coalfields
Reporting Period: October 2025 to March 2026 | Document ID: doc-cmpdi-env-2026

1. AMBIENT AIR QUALITY MONITORING (CPCB / DGMS STANDARDS):
• Particulate Matter PM10: 68.4 µg/m³ (Statutory Prescribed Limit: 100 µg/m³ - COMPLIANT).
• Particulate Matter PM2.5: 38.2 µg/m³ (Statutory Prescribed Limit: 60 µg/m³ - COMPLIANT).
• Sulphur Dioxide (SO2): 18.5 µg/m³ (Prescribed Limit: 80 µg/m³ - COMPLIANT).
• Nitrogen Oxides (NOx): 24.1 µg/m³ (Prescribed Limit: 80 µg/m³ - COMPLIANT).

2. MINE WATER REGIME & EFFLUENT TREATMENT:
• Mine Sump Water Discharge pH: 7.42 (Within neutral permissible range 6.5 - 8.5).
• Total Suspended Solids (TSS): 28.0 mg/l (Statutory Limit: 100 mg/l).
• Water Recycling: 85% of pumped mine sump water is reutilized for dust suppression misting.
• Cumulative Overburden Dump Saplings Planted: 185,000 native tree species (Survival Rate: 84.5%).`,
          chunks: [
            'Environmental monitoring at Korba Coalfields confirms ambient air particulate levels are fully compliant: PM10 at 68.4 µg/m³ and PM2.5 at 38.2 µg/m³ against statutory thresholds of 100 and 60 µg/m³.',
            'Mine sump water discharge across Gevra and Kusmunda has a neutral pH of 7.42 with 85% recycled for continuous haul road dust suppression misting.',
          ],
        },
      ],
      tables: [
        {
          tableName: 'Air_Quality_Compliance_Summary',
          columns: ['Parameter', 'Measured Value', 'Prescribed Standard', 'Status'],
          rows: [
            ['Particulate Matter PM10', '68.4 µg/m³', '100 µg/m³', 'COMPLIANT'],
            ['Particulate Matter PM2.5', '38.2 µg/m³', '60 µg/m³', 'COMPLIANT'],
            ['Sulphur Dioxide (SO2)', '18.5 µg/m³', '80 µg/m³', 'COMPLIANT'],
            ['Nitrogen Oxides (NOx)', '24.1 µg/m³', '80 µg/m³', 'COMPLIANT'],
          ],
        },
      ],
    },
  ];

  for (const d of docsToSeed) {
    const filePath = path.join(DATA_DIR, d.filename);
    let fileSizeBytes = 10000;
    let checksum = `synth-${d.filename}-${Date.now()}`;

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      fileSizeBytes = stats.size;
      const buf = fs.readFileSync(filePath);
      checksum = crypto.createHash('sha256').update(buf).digest('hex');
    }

    console.log(`Processing: ${d.title} (${d.filename})...`);

    // Check if document with matching filename already exists
    const existing = await prisma.document.findFirst({
      where: {
        OR: [{ filename: d.filename }, { checksum }],
      },
    });

    if (existing) {
      // Update existing document to ensure it has latest metadata & stage
      await prisma.document.update({
        where: { id: existing.id },
        data: {
          title: d.title,
          fileType: d.fileType,
          fileSizeBytes,
          checksum,
          storagePath: `/synthetic_mine_data/${d.filename}`,
          processingStage: ProcessingStage.COMPLETED,
          pageCount: d.pages.length,
          chunkCount: d.pages.reduce((acc, p) => acc + p.chunks.length, 0),
          mineName: d.mineName,
          blockName: d.blockName,
          coalSeam: d.coalSeam,
          reserveCategory: d.reserveCategory,
          subsidiary: d.subsidiary,
          sourceDepartment: d.sourceDepartment,
          reportYear: d.reportYear,
          ocrStatus: 'NATIVE',
          ocrConfidence: 0.98,
          tables: d.tables as any,
        },
      });

      // Delete old chunks and pages to recreate clean chunks
      await withRetry(() => prisma.documentChunk.deleteMany({ where: { documentId: existing.id } }));
      await withRetry(() => prisma.documentPage.deleteMany({ where: { documentId: existing.id } }));

      // Recreate pages and chunks
      for (const p of d.pages) {
        const page = await withRetry(() =>
          prisma.documentPage.create({
            data: {
              documentId: existing.id,
              pageNumber: p.pageNumber,
              rawText: p.text,
              hasTables: (d.tables && d.tables.length > 0) || false,
            },
          })
        );

        for (let idx = 0; idx < p.chunks.length; idx++) {
          await withRetry(() =>
            prisma.documentChunk.create({
              data: {
                documentId: existing.id,
                pageId: page.id,
                chunkIndex: idx,
                content: p.chunks[idx],
                tokenCount: Math.ceil(p.chunks[idx].length / 4),
              },
            })
          );
        }
      }
      console.log(`  -> Updated existing document ID: ${existing.id}`);
    } else {
      // Create new document
      const newDoc = await withRetry(() =>
        prisma.document.create({
          data: {
            projectId: d.project.id,
            uploaderId: admin.id,
            title: d.title,
            filename: d.filename,
            fileType: d.fileType,
            fileSizeBytes,
            mimeType: d.mimeType,
            checksum,
            storagePath: `/synthetic_mine_data/${d.filename}`,
            processingStage: ProcessingStage.COMPLETED,
            pageCount: d.pages.length,
            chunkCount: d.pages.reduce((acc, p) => acc + p.chunks.length, 0),
            mineName: d.mineName,
            blockName: d.blockName,
            coalSeam: d.coalSeam,
            reserveCategory: d.reserveCategory,
            subsidiary: d.subsidiary,
            sourceDepartment: d.sourceDepartment,
            reportYear: d.reportYear,
            ocrStatus: 'NATIVE',
            ocrConfidence: 0.98,
            tables: d.tables as any,
          },
        })
      );

      for (const p of d.pages) {
        const page = await withRetry(() =>
          prisma.documentPage.create({
            data: {
              documentId: newDoc.id,
              pageNumber: p.pageNumber,
              rawText: p.text,
              hasTables: (d.tables && d.tables.length > 0) || false,
            },
          })
        );

        for (let idx = 0; idx < p.chunks.length; idx++) {
          await withRetry(() =>
            prisma.documentChunk.create({
              data: {
                documentId: newDoc.id,
                pageId: page.id,
                chunkIndex: idx,
                content: p.chunks[idx],
                tokenCount: Math.ceil(p.chunks[idx].length / 4),
              },
            })
          );
        }
      }
      console.log(`  -> Created new document ID: ${newDoc.id}`);
    }
  }

  const finalDocCount = await prisma.document.count();
  const finalChunkCount = await prisma.documentChunk.count();

  console.log('\n[INDEXING COMPLETE]');
  console.log(`  Total Documents in DB: ${finalDocCount}`);
  console.log(`  Total Document Chunks in DB: ${finalChunkCount}`);
}

indexSyntheticMineData()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error during indexing:', err);
    prisma.$disconnect();
    process.exit(1);
  });
