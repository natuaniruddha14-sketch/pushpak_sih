import bcrypt from 'bcryptjs';
import { UserRole, DocumentType, ProcessingStage, JobStatus, MessageRole, ReportTemplate, ReportFormat } from '@prisma/client';

export interface MemOrganization {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemUser {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  organization?: MemOrganization;
}

export interface MemProject {
  id: string;
  organizationId: string;
  ownerId: string;
  name: string;
  code: string;
  description?: string | null;
  mineLocation?: string | null;
  targetSeam?: string | null;
  createdAt: Date;
  updatedAt: Date;
  organization?: MemOrganization;
  owner?: Partial<MemUser>;
  _count?: { documents: number; reports: number; structuredRecs: number };
}

export interface MemDocument {
  id: string;
  projectId: string;
  uploaderId: string;
  title: string;
  filename: string;
  fileType: DocumentType;
  fileSizeBytes: number;
  mimeType: string;
  checksum: string;
  storagePath: string;
  processingStage: ProcessingStage;
  pageCount?: number | null;
  chunkCount?: number | null;
  errorMessage?: string | null;
  mineName?: string | null;
  blockName?: string | null;
  coalSeam?: string | null;
  reserveCategory?: string | null;
  authoringBody?: string | null;
  reportYear?: number | null;
  sourceDepartment?: string | null;
  subsidiary?: string | null;
  documentDate?: Date | null;
  processingError?: string | null;
  ocrConfidence?: number | null;
  ocrStatus?: string | null;
  tables?: any[];
  createdAt: Date;
  updatedAt: Date;
  uploader?: { id: string; name: string; email: string };
  pages?: any[];
  chunks?: any[];
  _count?: { pages: number; chunks: number; entities: number; structuredRecs: number };
}

export interface MemStructuredRecord {
  id: string;
  projectId: string;
  documentId: string;
  mineName: string;
  blockName?: string | null;
  coalSeam?: string | null;
  provedReserveMt?: number | null;
  indicatedReserveMt?: number | null;
  inferredReserveMt?: number | null;
  seamThicknessMeters?: number | null;
  ashContentPercent?: number | null;
  moisturePercent?: number | null;
  volatileMatterPercent?: number | null;
  grossCalorificValueKcal?: number | null;
  strippingRatio?: number | null;
  annualProductionMt?: number | null;
  depthMeters?: number | null;
  extractedData?: any;
  createdAt: Date;
  updatedAt: Date;
  document?: { title: string; fileType?: string };
}

export interface MemProcessingJob {
  id: string;
  projectId: string;
  documentId: string;
  userId: string;
  status: JobStatus;
  progressPercent: number;
  currentStep?: string | null;
  errorMessage?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  document?: { title: string; fileType?: string };
  user?: { name: string; email: string };
}

export interface MemAuditLog {
  id: string;
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: any;
  ipAddress?: string | null;
  createdAt: Date;
  user?: { name: string; email: string };
}

export interface MemReport {
  id: string;
  projectId: string;
  authorId: string;
  title: string;
  templateType: ReportTemplate;
  status: JobStatus;
  summaryText?: string | null;
  storagePath?: string | null;
  fileFormat: ReportFormat;
  createdAt: Date;
  updatedAt: Date;
  author?: { name: string; email: string };
  project?: { name: string; code?: string };
  sources?: any[];
}

export interface MemQuerySession {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: any[];
  user?: { name: string; email: string };
}

class InMemoryStore {
  organizations: Map<string, MemOrganization> = new Map();
  users: Map<string, MemUser> = new Map();
  projects: Map<string, MemProject> = new Map();
  documents: Map<string, MemDocument> = new Map();
  processingJobs: Map<string, MemProcessingJob> = new Map();
  structuredRecords: Map<string, MemStructuredRecord> = new Map();
  querySessions: Map<string, MemQuerySession> = new Map();
  reports: Map<string, MemReport> = new Map();
  auditLogs: MemAuditLog[] = [];
  documentChunks: Map<string, any[]> = new Map();

  private initialized = false;

  async initializeDefaults() {
    if (this.initialized) return;
    this.initialized = true;

    const defaultOrg: MemOrganization = {
      id: 'org-cmpdi-hq-001',
      name: 'Central Mine Planning & Design Institute',
      code: 'CMPDI-HQ',
      description: 'Default Organization',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.organizations.set(defaultOrg.id, defaultOrg);

    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    const preseededUsers: Partial<MemUser>[] = [
      { id: 'usr-admin-01', name: 'System Administrator', email: 'admin@cmpdi.in', role: UserRole.ADMIN },
      { id: 'usr-geologist-01', name: 'Dr. Rajesh Sharma', email: 'geologist@cmpdi.in', role: UserRole.GEOLOGIST },
      { id: 'usr-engineer-01', name: 'Amitav Roy', email: 'engineer@cmpdi.in', role: UserRole.MINING_ENGINEER },
      { id: 'usr-analyst-01', name: 'Sunita Verma', email: 'analyst@cmpdi.in', role: UserRole.ANALYST },
      { id: 'usr-executive-01', name: 'V. K. Singh', email: 'executive@cmpdi.in', role: UserRole.EXECUTIVE },
    ];

    for (const u of preseededUsers) {
      const userObj: MemUser = {
        id: u.id!,
        organizationId: defaultOrg.id,
        email: u.email!,
        name: u.name!,
        passwordHash: defaultPasswordHash,
        role: u.role!,
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: defaultOrg,
      };
      this.users.set(userObj.id, userObj);
    }

    const defaultProject: MemProject = {
      id: 'prj-rajmahal-001',
      organizationId: defaultOrg.id,
      ownerId: 'usr-admin-01',
      name: 'Rajmahal OpenCast Coal Expansion',
      code: 'PRJ-RAJMAHAL-2026',
      description: 'Geological study and reserve estimation for Rajmahal Coalfield Block-B.',
      mineLocation: 'Singrauli / Rajmahal Coalfield',
      targetSeam: 'Seam V/VI/VII',
      createdAt: new Date(),
      updatedAt: new Date(),
      organization: defaultOrg,
      owner: { id: 'usr-admin-01', name: 'System Administrator', email: 'admin@cmpdi.in' },
      _count: { documents: 1, reports: 1, structuredRecs: 1 },
    };
    this.projects.set(defaultProject.id, defaultProject);

    const defaultDoc: MemDocument = {
      id: 'doc-gevra-2026',
      projectId: defaultProject.id,
      uploaderId: 'usr-admin-01',
      title: 'Gevra OCP Expansion Geological Report 2026',
      filename: 'Gevra_OCP_Expansion_Geological_Report_2026.pdf',
      fileType: DocumentType.PDF,
      fileSizeBytes: 14850000,
      mimeType: 'application/pdf',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      storagePath: 'storage/Gevra_OCP_Expansion_Geological_Report_2026.pdf',
      processingStage: ProcessingStage.INDEXED,
      pageCount: 42,
      chunkCount: 156,
      mineName: 'Gevra OpenCast Project',
      blockName: 'Block-B',
      coalSeam: 'Seam V/VI/VII',
      reserveCategory: 'Proved Reserve',
      authoringBody: 'CMPDI Regional Institute-V',
      reportYear: 2026,
      createdAt: new Date(),
      updatedAt: new Date(),
      uploader: { id: 'usr-admin-01', name: 'System Administrator', email: 'admin@cmpdi.in' },
      _count: { pages: 42, chunks: 156, entities: 12, structuredRecs: 1 },
    };
    this.documents.set(defaultDoc.id, defaultDoc);

    const defaultRecord: MemStructuredRecord = {
      id: 'rec-gevra-001',
      projectId: defaultProject.id,
      documentId: defaultDoc.id,
      mineName: 'Gevra OpenCast Project',
      blockName: 'Block-B West',
      coalSeam: 'Seam V/VI/VII',
      provedReserveMt: 425.80,
      indicatedReserveMt: 85.20,
      seamThicknessMeters: 18.4,
      strippingRatio: 2.14,
      annualProductionMt: 70.5,
      grossCalorificValueKcal: 4650,
      ashContentPercent: 34.2,
      createdAt: new Date(),
      updatedAt: new Date(),
      document: { title: defaultDoc.title, fileType: 'PDF' },
    };
    this.structuredRecords.set(defaultRecord.id, defaultRecord);
  }
}

export const memStore = new InMemoryStore();
memStore.initializeDefaults().catch(console.error);
