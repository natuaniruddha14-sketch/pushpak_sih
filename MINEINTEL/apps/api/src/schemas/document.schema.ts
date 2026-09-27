import { z } from 'zod';
import { DocumentType, ProcessingStage } from '@prisma/client';

export const createDocumentSchema = z.object({
  projectId: z.string().uuid('Valid project ID required'),
  title: z.string().min(2, 'Document title must be at least 2 characters'),
  filename: z.string().min(1, 'Filename required'),
  fileType: z.nativeEnum(DocumentType),
  fileSizeBytes: z.number().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type required'),
  checksum: z.string().min(8, 'Valid checksum hash required'),
  storagePath: z.string().min(1, 'Storage path required'),
  mineName: z.string().optional(),
  blockName: z.string().optional(),
  coalSeam: z.string().optional(),
  reserveCategory: z.string().optional(),
  authoringBody: z.string().optional(),
  reportYear: z.number().int().min(1900).max(2100).optional(),
});

export const updateDocumentStageSchema = z.object({
  processingStage: z.nativeEnum(ProcessingStage),
  errorMessage: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentStageInput = z.infer<typeof updateDocumentStageSchema>;
