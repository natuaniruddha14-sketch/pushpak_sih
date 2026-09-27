import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingId = req.headers['x-request-id'];
  const requestId = (typeof incomingId === 'string' && incomingId.trim())
    ? incomingId.trim()
    : crypto.randomUUID();

  req.id = requestId;
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', requestId);

  next();
};
