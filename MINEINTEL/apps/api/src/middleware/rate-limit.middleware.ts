import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { env } from '../lib/env';

interface ClientHitRecord {
  timestamps: number[];
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests. Please try again later.',
    keyGenerator = (req) => {
      // Use authenticated user ID if present, otherwise fallback to IP
      const userId = (req as any).user?.id;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return userId ? `user:${userId}` : `ip:${ip}`;
    },
    skip = () => false,
  } = options;

  const hits = new Map<string, ClientHitRecord>();

  // Periodically clean up stale client entries (every 5 minutes)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Prevent interval from keeping Node process alive during tests or shutdown
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const clientRecord = hits.get(key) || { timestamps: [] };

    // Retain only timestamps within the current sliding window
    clientRecord.timestamps = clientRecord.timestamps.filter((ts) => now - ts < windowMs);

    const currentCount = clientRecord.timestamps.length;
    const remaining = Math.max(0, max - currentCount - 1);
    const resetTime = clientRecord.timestamps.length > 0
      ? Math.ceil((clientRecord.timestamps[0] + windowMs - now) / 1000)
      : Math.ceil(windowMs / 1000);

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetTime);

    if (currentCount >= max) {
      res.setHeader('Retry-After', resetTime);
      logger.warn(`[RateLimit Exceeded] Key: ${key} exceeded limit of ${max} req / ${windowMs}ms`, {
        key,
        requestId: req.id,
        path: req.originalUrl,
      });

      res.status(429).json({
        error: 'Too Many Requests',
        message,
        statusCode: 429,
        requestId: req.id,
        retryAfterSeconds: resetTime,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    clientRecord.timestamps.push(now);
    hits.set(key, clientRecord);

    next();
  };
}

// Global General API Rate Limiter: 200 requests per minute
export const apiRateLimiter = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'General API rate limit exceeded. Please wait a moment before sending more requests.',
  skip: (req) => req.path === '/health' || req.path === '/api/v1/health',
});

// Strict Auth Limiter: 15 attempts per 15 minutes per IP to prevent brute-force attacks
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

// Upload Rate Limiter: 100 uploads per 10 minutes (skips GET requests like polling and reading)
export const uploadRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: 'Document upload rate limit exceeded. Please try again later.',
  skip: (req) => req.method === 'GET' || req.method === 'OPTIONS' || env.NODE_ENV === 'test',
});
