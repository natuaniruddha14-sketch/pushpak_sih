import { z } from 'zod';
import { ReportTemplate, ReportFormat } from '@prisma/client';

export const createReportSchema = z.object({
  projectId: z.string().uuid('Valid project ID required'),
  title: z.string().min(3, 'Report title must be at least 3 characters'),
  templateType: z.nativeEnum(ReportTemplate),
  documentIds: z.array(z.string().uuid()).min(1, 'At least one source document ID required'),
  fileFormat: z.nativeEnum(ReportFormat).default(ReportFormat.PDF),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
