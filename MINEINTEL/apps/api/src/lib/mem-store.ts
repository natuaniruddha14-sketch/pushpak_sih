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
  createdAt: Date;
  updatedAt: Date;
  uploader?: { id: string; name: string; email: string };
  pages?: any[];
  chunks?: any[];
  _count?: { pages: number; chunks: number; entities: number; structuredRecs: number };
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
}

class InMemoryStore {
  organizations: Map<string, MemOrganization> = new Map();
  users: Map<string, MemUser> = new Map();
  projects: Map<string, MemProject> = new Map();
  documents: Map<string, MemDocument> = new Map();
  auditLogs: MemAuditLog[] = [];
  querySessions: Map<string, any> = new Map();
  reports: Map<string, any> = new Map();

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

    const defaultPasswordHash = await bcrypt.hash('admin123', 10);

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
  }
}

export const memStore = new InMemoryStore();
memStore.initializeDefaults().catch(console.error);
