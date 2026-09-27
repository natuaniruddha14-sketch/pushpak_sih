import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables across possible paths
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('4000'),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('mineintel-dev-jwt-secret-key-change-in-production-32chars!'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  CORS_ORIGIN: z.string().default('*'),
  MAX_FILE_SIZE_MB: z.string().transform((val) => parseInt(val, 10)).default('50'),
  STORAGE_DIR: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['local', 'supabase']).default('local'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('mineintel-documents'),
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('60000'), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).default('200'),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).default('15'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[MINEINTEL API] ❌ Invalid Environment Configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment variables in production mode. Process exiting.');
  }
}

export const env = parsed.success
  ? parsed.data
  : {
      NODE_ENV: 'development' as const,
      PORT: 4000,
      HOST: '0.0.0.0',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://mineintel_user:mineintel_password@localhost:5432/mineintel_db?schema=public',
      JWT_SECRET: process.env.JWT_SECRET || 'mineintel-dev-jwt-secret-key-change-in-production-32chars!',
      JWT_EXPIRES_IN: '24h',
      AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
      CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
      MAX_FILE_SIZE_MB: 50,
      STORAGE_DIR: process.env.STORAGE_DIR,
      RATE_LIMIT_WINDOW_MS: 60000,
      RATE_LIMIT_MAX_REQUESTS: 200,
      AUTH_RATE_LIMIT_MAX_REQUESTS: 15,
    };

// Production warning for default secrets
if (env.NODE_ENV === 'production' && env.JWT_SECRET.includes('mineintel-dev-jwt-secret')) {
  console.warn('[MINEINTEL API] ⚠️ WARNING: Insecure default JWT_SECRET detected in production! Please configure a secure secret.');
}
