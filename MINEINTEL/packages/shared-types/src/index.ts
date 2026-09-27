/**
 * Shared Type Definitions for MINEINTEL AI Platform
 */

// Service Health Status Types
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  service: string;
  version: string;
  uptimeSeconds?: number;
  environment?: string;
  details?: Record<string, unknown>;
}

// User & Auth Types
export const UserRole = {
  ADMIN: 'ADMIN',
  ANALYST: 'ANALYST',
  GEOLOGIST: 'GEOLOGIST',
  MINING_ENGINEER: 'MINING_ENGINEER',
  EXECUTIVE: 'EXECUTIVE',
  VIEWER: 'VIEWER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface UserProfile {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

// Document Processing Pipeline Types
export const DocumentType = {
  PDF: 'PDF',
  SCANNED_PDF: 'SCANNED_PDF',
  DOCX: 'DOCX',
  EXCEL: 'EXCEL',
  IMAGE: 'IMAGE',
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const ProcessingStage = {
  UPLOADED: 'UPLOADED',
  OCR_EXTRACTING: 'OCR_EXTRACTING',
  METADATA_EXTRACTING: 'METADATA_EXTRACTING',
  STRUCTURED_DATA_EXTRACTING: 'STRUCTURED_DATA_EXTRACTING',
  CHUNKING: 'CHUNKING',
  EMBEDDING: 'EMBEDDING',
  INDEXED: 'INDEXED',
  FAILED: 'FAILED',
} as const;

export type ProcessingStage = (typeof ProcessingStage)[keyof typeof ProcessingStage];

export interface MiningDocumentMetadata {
  mineName?: string;
  blockName?: string;
  coalSeam?: string;
  reserveCategory?: string; // Proved, Indicated, Inferred
  depthMeters?: number;
  gradeCategory?: string;
  authoringBody?: string; // CMPDI, CIL, WCL, SECL, etc.
  reportYear?: number;
}

export interface DocumentRecord {
  id: string;
  title: string;
  filename: string;
  fileType: DocumentType;
  fileSizeBytes: number;
  storagePath: string;
  processingStage: ProcessingStage;
  metadata?: MiningDocumentMetadata;
  pageCount?: number;
  chunkCount?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  tokenCount: number;
  metadata?: Record<string, unknown>;
}

// RAG Retrieval & QA Types
export interface CitationSource {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  pageNumber?: number;
  snippet: string;
  relevanceScore: number;
}

export interface QueryRequest {
  query: string;
  topK?: number;
  filterByMine?: string;
  filterByYear?: number;
}

export interface QueryResponse {
  query: string;
  answer: string;
  citations: CitationSource[];
  processingTimeMs: number;
}

// Automated Reports Types
export interface ReportRequest {
  title: string;
  documentIds: string[];
  templateType: 'EXECUTIVE_SUMMARY' | 'GEOLOGICAL_RESERVE' | 'PRODUCTION_AUDIT';
}

export interface ReportArtifact {
  id: string;
  title: string;
  downloadUrl: string;
  format: 'PDF' | 'DOCX';
  createdAt: string;
}
