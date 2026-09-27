import express, { Request, Response } from 'express';
import cors from 'cors';
import { HealthStatus } from '@mineintel/shared-types';
import { env } from './lib/env';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { securityHeadersMiddleware } from './middleware/security-headers.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';
import { apiRateLimiter, authRateLimiter, uploadRateLimiter } from './middleware/rate-limit.middleware';
import { errorHandlerMiddleware } from './middleware/error.middleware';

import authRouter from './routes/auth.router';
import projectRouter from './routes/project.router';
import documentRouter from './routes/document.router';
import searchRouter from './routes/search.router';
import reportRouter from './routes/report.router';
import analyticsRouter from './routes/analytics.router';
import validationRouter from './routes/validation.router';

const app = express();

// 1. Production Security & Diagnostic Headers
app.use(requestIdMiddleware);
app.use(securityHeadersMiddleware);

// 2. CORS Handling
const allowedOrigins = env.CORS_ORIGIN === '*'
  ? '*'
  : env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Accept'],
}));

// 3. Structured Request Logging
app.use(loggingMiddleware);

// 4. Body Parsing with bounded limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Global API Rate Limiter
app.use(apiRateLimiter);

// Health Endpoints (Exempt from Rate Limiting)
const getHealthStatus = (): HealthStatus => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  service: 'mineintel-api',
  version: '0.1.0',
  uptimeSeconds: Math.floor(process.uptime()),
  environment: env.NODE_ENV,
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(getHealthStatus());
});

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json(getHealthStatus());
});

// 6. API Route Handlers with targeted rate limits
app.use('/api/v1/auth', authRateLimiter, authRouter);
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/documents', uploadRateLimiter, documentRouter);
app.use('/index/document', uploadRateLimiter, documentRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/ai', searchRouter);
app.use('/api/v1/rag', searchRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/validation', validationRouter);

// 7. 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested API endpoint does not exist',
    statusCode: 404,
    timestamp: new Date().toISOString(),
  });
});

// 8. Centralized Global Error Handler
app.use(errorHandlerMiddleware);

export default app;
