import { z } from 'zod';

export const miningMetricsQuerySchema = z.object({
  projectId: z.string().uuid('Valid project ID required'),
  mineName: z.string().optional(),
  coalSeam: z.string().optional(),
});

export type MiningMetricsQueryInput = z.infer<typeof miningMetricsQuerySchema>;
