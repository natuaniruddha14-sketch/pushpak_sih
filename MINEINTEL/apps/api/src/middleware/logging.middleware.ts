import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Capture response finish to log latency and status
  res.on('finish', () => {
    const durationMs = req.startTime ? Date.now() - req.startTime : 0;
    const statusCode = res.statusCode;

    // Filter out noisy health checks in production if needed, or log at debug level
    if (req.originalUrl === '/health' || req.originalUrl === '/api/v1/health') {
      return;
    }

    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      contentLength: res.getHeader('content-length'),
    };

    if (statusCode >= 500) {
      logger.error(`[HTTP] ${req.method} ${req.originalUrl} - ${statusCode}`, undefined, logData);
    } else if (statusCode >= 400) {
      logger.warn(`[HTTP] ${req.method} ${req.originalUrl} - ${statusCode}`, logData);
    } else {
      logger.info(`[HTTP] ${req.method} ${req.originalUrl} - ${statusCode}`, logData);
    }
  });

  next();
};
