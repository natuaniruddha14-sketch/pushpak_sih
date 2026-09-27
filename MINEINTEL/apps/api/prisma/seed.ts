import { PrismaClient, UserRole, DocumentType, ProcessingStage, JobStatus, MessageRole, ReportTemplate, ReportFormat } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[MINEINTEL SEED] Starting database seed process...');

  // 1. Clean existing records (Optional reset for idempotency)
  await prisma.auditLog.deleteMany();
  await prisma.reportSource.deleteMany();
  await prisma.report.deleteMany();
  await prisma.citation.deleteMany();
  await prisma.queryMessage.deleteMany();
  await prisma.querySession.deleteMany();
  await prisma.processingJob.deleteMany();
  await prisma.structuredRecord.deleteMany();
  await prisma.documentEntity.deleteMany();
  await prisma.documentChunk.deleteMany();
  await prisma.documentPage.deleteMany();
  await prisma.document.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 2. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Central Mine Planning & Design Institute',
      code: 'CMPDI-HQ',
      description: 'CIL Subsidiary for Coal Exploration, Mine Planning and Environmental Engineering',
    },
  });
  console.log(`[SEED] Created Organization: ${org.name} (${org.code})`);

  // 3. Create Users (1 Admin, 2 Analysts)
  const adminUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'admin@cmpdi.in',
      name: 'Dr. Rajesh Sharma',
      passwordHash: '$2b$10$8/IN4Lc7Lo5z/vRzrZlOGezOuCm4R6./RkMN9cEl33lbMIZy5wF/.', // Password123!
      role: UserRole.ADMIN,
    },
  });

  const geologistUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'geologist@cmpdi.in',
      name: 'Ananya Sen',
      passwordHash: '$2b$10$8/IN4Lc7Lo5z/vRzrZlOGezOuCm4R6./RkMN9cEl33lbMIZy5wF/.', // Password123!
      role: UserRole.GEOLOGIST,
    },
  });

  const engineerUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'engineer@cmpdi.in',
      name: 'Vikram Verma',
      passwordHash: '$2b$10$8/IN4Lc7Lo5z/vRzrZlOGezOuCm4R6./RkMN9cEl33lbMIZy5wF/.', // Password123!
      role: UserRole.MINING_ENGINEER,
    },
  });

  console.log(`[SEED] Created 3 Users: Admin (${adminUser.email}), Geologist (${geologistUser.email}), Engineer (${engineerUser.email})`);

  // 4. Create 3 Projects
  const projectRajmahal = await prisma.project.create({
    data: {
      organizationId: org.id,
      ownerId: geologistUser.id,
      name: 'Rajmahal OCP Coal Exploration & Reserve Estimation',
      code: 'PRJ-RAJMAHAL-2026',
      description: 'Geological report and reserve assessment for Hurra C block in Rajmahal coalfield.',
      mineLocation: 'Rajmahal Coalfield, Eastern Coalfields Ltd (ECL)',
      targetSeam: 'Lalmatia Top & Bottom Seams (Seam I & II)',
    },
  });

  const projectGevra = await prisma.project.create({
    data: {
      organizationId: org.id,
      ownerId: engineerUser.id,
      name: 'Gevra Expansion Geological Survey & Block-B Audit',
      code: 'PRJ-GEVRA-EXP-2026',
      description: 'Feasibility study for 70 MTPA peak capacity expansion at Gevra OpenCast Project.',
      mineLocation: 'Korba Coalfield, South Eastern Coalfields Ltd (SECL)',
      targetSeam: 'Upper & Lower Gevra Seams',
    },
  });

  const projectPiparwar = await prisma.project.create({
    data: {
      organizationId: org.id,
      ownerId: adminUser.id,
      name: 'Piparwar Mine Annual Production & Stripping Analysis',
      code: 'PRJ-PIPARWAR-2026',
      description: 'Performance review of in-pit crushing, overland conveyor system and overburden removal.',
      mineLocation: 'North Karanpura Coalfield, Central Coalfields Ltd (CCL)',
      targetSeam: 'Piparwar Bottom Seam',
    },
  });

  console.log(`[SEED] Created 3 Projects: ${projectRajmahal.code}, ${projectGevra.code}, ${projectPiparwar.code}`);

  // 5. Create Sample Documents & Related Child Entities
  const doc1 = await prisma.document.create({
    data: {
      projectId: projectRajmahal.id,
      uploaderId: geologistUser.id,
      title: 'CMPDI Geological Assessment Report - Rajmahal Block C',
      filename: 'Rajmahal_BlockC_Geological_Report_2025.pdf',
      fileType: DocumentType.PDF,
      fileSizeBytes: 14502300,
      mimeType: 'application/pdf',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      storagePath: 'storage/uploads/Rajmahal_BlockC_Geological_Report_2025.pdf',
      processingStage: ProcessingStage.INDEXED,
      pageCount: 42,
      chunkCount: 120,
      mineName: 'Rajmahal OpenCast Mine',
      blockName: 'Hurra C Block',
      coalSeam: 'Seam I (Lalmatia Top)',
      reserveCategory: 'Proved Reserve',
      authoringBody: 'CMPDI Regional Institute-I, Asansol',
      reportYear: 2025,
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      projectId: projectGevra.id,
      uploaderId: engineerUser.id,
      title: 'Scanned Mine Borehole Core Log & Stratigraphy Sheet',
      filename: 'Gevra_Borehole_BH-704_CoreLog_Scanned.pdf',
      fileType: DocumentType.SCANNED_PDF,
      fileSizeBytes: 28401100,
      mimeType: 'application/pdf',
      checksum: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      storagePath: 'storage/uploads/Gevra_Borehole_BH-704_CoreLog_Scanned.pdf',
      processingStage: ProcessingStage.INDEXED,
      pageCount: 18,
      chunkCount: 54,
      mineName: 'Gevra OCP',
      blockName: 'Expansion Sector II',
      coalSeam: 'Gevra Seam VI',
      reserveCategory: 'Proved Reserve',
      authoringBody: 'CMPDI Regional Institute-V, Bilaspur',
      reportYear: 2024,
    },
  });

  const doc3 = await prisma.document.create({
    data: {
      projectId: projectPiparwar.id,
      uploaderId: adminUser.id,
      title: 'Coal Quality Metrics & Production Audit Dataset',
      filename: 'Piparwar_Production_CoalQuality_2025.xlsx',
      fileType: DocumentType.EXCEL,
      fileSizeBytes: 4205000,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      checksum: '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1a50caf6037b51b31215',
      storagePath: 'storage/uploads/Piparwar_Production_CoalQuality_2025.xlsx',
      processingStage: ProcessingStage.INDEXED,
      pageCount: 6,
      chunkCount: 18,
      mineName: 'Piparwar OCP',
      blockName: 'Main Mine Pit',
      coalSeam: 'Piparwar Bottom Seam',
      reserveCategory: 'Indicated Reserve',
      authoringBody: 'CCL Operations Division, Ranchi',
      reportYear: 2025,
    },
  });

  console.log(`[SEED] Created 3 Documents: ${doc1.title}, ${doc2.title}, ${doc3.title}`);

  // 6. Create Document Pages & Chunks
  const page1 = await prisma.documentPage.create({
    data: {
      documentId: doc1.id,
      pageNumber: 12,
      rawText: 'Section 4.2: Coal Reserve Quantification. The Hurra C block contains total proved coal reserves of 142.50 Million Tonnes within depth limits of 180 meters. Average coal seam thickness recorded across 34 boreholes is 16.4 meters with GCV ranging from 3,800 to 4,200 kcal/kg (Grade G11).',
      hasTables: true,
      hasImages: false,
    },
  });

  const chunk1 = await prisma.documentChunk.create({
    data: {
      documentId: doc1.id,
      pageId: page1.id,
      chunkIndex: 0,
      content: 'Hurra C block proved coal reserves stand at 142.50 MT with seam thickness of 16.4m and GCV of 3800-4200 kcal/kg (Grade G11). Stripping ratio is estimated at 2.45 m3/tonne.',
      tokenCount: 42,
    },
  });

  // 7. Create Document Entities
  await prisma.documentEntity.createMany({
    data: [
      {
        documentId: doc1.id,
        pageId: page1.id,
        entityType: 'RESERVE_METRIC',
        entityValue: '142.50 MT',
        confidence: 0.98,
        metadata: { reserveCategory: 'Proved', unit: 'Million Tonnes' },
      },
      {
        documentId: doc1.id,
        pageId: page1.id,
        entityType: 'COAL_SEAM',
        entityValue: 'Seam I (Lalmatia Top)',
        confidence: 0.99,
        metadata: { thicknessMeters: 16.4 },
      },
      {
        documentId: doc2.id,
        entityType: 'BOREHOLE_ID',
        entityValue: 'BH-704',
        confidence: 0.95,
        metadata: { depthMeters: 215.0, coreRecoveryPercent: 94.2 },
      },
    ],
  });

  // 8. Create Structured Records with Numeric Mining Metrics
  await prisma.structuredRecord.createMany({
    data: [
      {
        projectId: projectRajmahal.id,
        documentId: doc1.id,
        mineName: 'Rajmahal OpenCast Mine',
        blockName: 'Hurra C Block',
        coalSeam: 'Seam I (Lalmatia Top)',
        provedReserveMt: 142.50,
        indicatedReserveMt: 35.20,
        inferredReserveMt: 12.00,
        seamThicknessMeters: 16.4,
        ashContentPercent: 32.5,
        moisturePercent: 8.4,
        volatileMatterPercent: 24.1,
        grossCalorificValueKcal: 4100.0,
        strippingRatio: 2.45,
        annualProductionMt: 18.5,
        depthMeters: 180.0,
        extractedData: { coalGrade: 'G11', overburdenVolumeMm3: 45.3 },
      },
      {
        projectId: projectGevra.id,
        documentId: doc2.id,
        mineName: 'Gevra OpenCast Project',
        blockName: 'Expansion Sector II',
        coalSeam: 'Gevra Seam VI',
        provedReserveMt: 410.80,
        indicatedReserveMt: 88.00,
        inferredReserveMt: 25.40,
        seamThicknessMeters: 28.5,
        ashContentPercent: 38.2,
        moisturePercent: 6.8,
        volatileMatterPercent: 21.5,
        grossCalorificValueKcal: 3650.0,
        strippingRatio: 1.85,
        annualProductionMt: 70.0,
        depthMeters: 220.0,
        extractedData: { coalGrade: 'G12', surfaceMinerCount: 14 },
      },
      {
        projectId: projectPiparwar.id,
        documentId: doc3.id,
        mineName: 'Piparwar OCP',
        blockName: 'Main Mine Pit',
        coalSeam: 'Piparwar Bottom Seam',
        provedReserveMt: 95.40,
        indicatedReserveMt: 22.10,
        inferredReserveMt: 8.50,
        seamThicknessMeters: 12.2,
        ashContentPercent: 28.4,
        moisturePercent: 9.1,
        volatileMatterPercent: 26.0,
        grossCalorificValueKcal: 4450.0,
        strippingRatio: 1.62,
        annualProductionMt: 12.5,
        depthMeters: 140.0,
        extractedData: { coalGrade: 'G10', inPitCrusherStatus: 'Operational' },
      },
    ],
  });

  console.log('[SEED] Created StructuredRecords with numeric mining metrics.');

  // 9. Create Processing Jobs tracking progress
  await prisma.processingJob.create({
    data: {
      projectId: projectRajmahal.id,
      documentId: doc1.id,
      userId: geologistUser.id,
      status: JobStatus.COMPLETED,
      progressPercent: 100,
      currentStep: 'Vector Indexing Completed',
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(),
    },
  });

  // 10. Create Query Session, Message, and Citations
  const session = await prisma.querySession.create({
    data: {
      projectId: projectRajmahal.id,
      userId: geologistUser.id,
      title: 'Rajmahal Coal Seam Thickness & Proved Reserve Query',
    },
  });

  const msgUser = await prisma.queryMessage.create({
    data: {
      sessionId: session.id,
      role: MessageRole.USER,
      content: 'What is the proved coal reserve and average seam thickness in Hurra C Block of Rajmahal mine?',
    },
  });

  const msgAssistant = await prisma.queryMessage.create({
    data: {
      sessionId: session.id,
      role: MessageRole.ASSISTANT,
      content: 'Based on the CMPDI Geological Assessment Report (2025), Hurra C Block contains total proved coal reserves of 142.50 Million Tonnes. The average recorded coal seam thickness across 34 boreholes is 16.4 meters (Lalmatia Top Seam I), with GCV ranging between 3,800 and 4,200 kcal/kg (Grade G11).',
      latencyMs: 840,
      tokenCount: 68,
    },
  });

  await prisma.citation.create({
    data: {
      messageId: msgAssistant.id,
      documentId: doc1.id,
      pageId: page1.id,
      chunkId: chunk1.id,
      documentTitle: doc1.title,
      pageNumber: 12,
      snippet: 'Hurra C block contains total proved coal reserves of 142.50 Million Tonnes within depth limits of 180 meters. Average coal seam thickness is 16.4 meters.',
      relevanceScore: 0.94,
    },
  });

  console.log('[SEED] Created QuerySession, QueryMessage, and Citation references.');

  // 11. Create Sample Report & Audit Logs
  const report = await prisma.report.create({
    data: {
      projectId: projectRajmahal.id,
      authorId: geologistUser.id,
      title: 'Rajmahal Hurra C Reserve & Grade Executive Summary',
      templateType: ReportTemplate.GEOLOGICAL_RESERVE,
      status: JobStatus.COMPLETED,
      summaryText: 'Executive summary detailing 142.50 MT proved reserves in Rajmahal Hurra C Block with 16.4m seam thickness.',
      storagePath: 'storage/reports/Rajmahal_Reserve_Summary_2026.pdf',
      fileFormat: ReportFormat.PDF,
      sources: {
        create: [{ documentId: doc1.id }],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'System',
      entityId: org.id,
      details: { environment: 'development', version: '0.1.0' },
      ipAddress: '127.0.0.1',
    },
  });

  console.log(`[SEED] Created Report (${report.title}) and AuditLog entry.`);
  console.log('[MINEINTEL SEED] Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
