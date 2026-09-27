import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import { env } from '../lib/env';

export const errorHandlerMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.id || 'unknown';
  const timestamp = new Date().toISOString();

  // 1. Handled AppError instances
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[AppError ${err.statusCode}] ${err.message}`, err, {
        requestId,
        errorCode: err.errorCode,
        path: req.originalUrl,
      });
    } else {
      logger.warn(`[AppError ${err.statusCode}] ${err.message}`, {
        requestId,
        errorCode: err.errorCode,
        path: req.originalUrl,
        details: err.details,
      });
    }

    res.status(err.statusCode).json({
      success: false,
      data: null,
      error: err.name,
      message: err.message,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      requestId,
      timestamp,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.flatten();
    logger.warn(`[Validation Error] ${req.method} ${req.originalUrl}`, {
      requestId,
      errors: formattedErrors,
    });

    res.status(400).json({
      success: false,
      data: null,
      error: 'Validation Error',
      message: 'Invalid request payload or query parameters',
      errorCode: 'VALIDATION_ERROR',
      statusCode: 400,
      requestId,
      timestamp,
      details: formattedErrors.fieldErrors,
    });
    return;
  }

  // 3. Payload Too Large (Express Body Parser / Stream)
  if (
    err.name === 'PayloadTooLargeError' ||
    ('type' in err && (err as any).type === 'entity.too.large') ||
    (err as any).status === 413
  ) {
    logger.warn(`[Payload Too Large] Request body exceeded size limit`, { requestId });
    res.status(413).json({
      success: false,
      data: null,
      error: 'Payload Too Large',
      message: 'Request payload exceeds maximum allowed size limit',
      errorCode: 'PAYLOAD_TOO_LARGE',
      statusCode: 413,
      requestId,
      timestamp,
    });
    return;
  }

  // 4. Multer Upload Errors
  if (err.name === 'MulterError') {
    const multerError = err as any;
    let message = 'File upload error occurred';
    let statusCode = 400;

    if (multerError.code === 'LIMIT_FILE_SIZE') {
      message = `Uploaded file exceeds maximum allowed limit of ${env.MAX_FILE_SIZE_MB}MB`;
      statusCode = 413;
    } else if (multerError.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected upload field '${multerError.field}'. Expected 'file'.`;
    }

    logger.warn(`[Upload Error] ${message}`, { requestId, code: multerError.code });

    res.status(statusCode).json({
      success: false,
      data: null,
      error: 'Upload Error',
      message,
      errorCode: multerError.code || 'UPLOAD_ERROR',
      statusCode,
      requestId,
      timestamp,
    });
    return;
  }

  // 5. JSON Syntax Errors (Malformed Body)
  if ('type' in err && (err as any).type === 'entity.parse.failed') {
    logger.warn(`[JSON Parse Failed] Malformed JSON in request body`, { requestId });
    res.status(400).json({
      success: false,
      data: null,
      error: 'Bad Request',
      message: 'Malformed JSON payload in request body',
      errorCode: 'MALFORMED_JSON',
      statusCode: 400,
      requestId,
      timestamp,
    });
    return;
  }

  // 6. Unhandled / Internal Server Errors (No stack trace exposed to users)
  logger.error(`[Unhandled Error] ${err.message}`, err, {
    requestId,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    data: null,
    error: 'Internal Server Error',
    message: 'An unexpected server error occurred. Please contact support.',
    errorCode: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
    requestId,
    timestamp,
  });
};
