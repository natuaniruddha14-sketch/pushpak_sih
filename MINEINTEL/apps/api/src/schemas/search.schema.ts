import { z } from 'zod';
import { MessageRole } from '@prisma/client';

export const hybridSearchSchema = z.object({
  projectId: z.string().min(1, 'Project ID required').optional(),
  query: z.string().optional(),
  question: z.string().optional(),
  topK: z.number().int().min(1).max(50).default(5),
  filterByMine: z.string().optional(),
  filterBySeam: z.string().optional(),
  filterByYear: z.number().int().optional(),
});

export const createQuerySessionSchema = z.object({
  projectId: z.string().min(1, 'Project ID required'),
  title: z.string().min(1, 'Session title required'),
});

export const addMessageSchema = z.object({
  sessionId: z.string().min(1, 'Session ID required'),
  role: z.nativeEnum(MessageRole),
  content: z.string().min(1, 'Message content required'),
  tokenCount: z.number().int().optional(),
  latencyMs: z.number().int().optional(),
  citations: z
    .array(
      z.object({
        documentId: z.string(),
        pageId: z.string().optional(),
        chunkId: z.string().optional(),
        documentTitle: z.string(),
        pageNumber: z.number().int().optional(),
        snippet: z.string(),
        relevanceScore: z.number(),
      })
    )
    .optional(),
});

export type HybridSearchInput = z.infer<typeof hybridSearchSchema>;
export type CreateQuerySessionInput = z.infer<typeof createQuerySessionSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
