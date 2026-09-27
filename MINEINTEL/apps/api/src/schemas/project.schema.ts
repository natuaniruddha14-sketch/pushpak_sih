import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(120),
  code: z
    .string()
    .min(3, 'Project code must be at least 3 characters')
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, 'Project code must be uppercase alphanumeric with dashes/underscores'),
  description: z.string().optional(),
  mineLocation: z.string().optional(),
  targetSeam: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
