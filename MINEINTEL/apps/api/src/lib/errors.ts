/**
 * Standard Application Error Hierarchy for MINEINTEL AI Platform
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    errorCode = 'INTERNAL_SERVER_ERROR',
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation Failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource Conflict', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Payload Too Large', details?: unknown) {
    super(message, 413, 'PAYLOAD_TOO_LARGE', details);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Unsupported Media Type', details?: unknown) {
    super(message, 415, 'UNSUPPORTED_MEDIA_TYPE', details);
  }
}

export class TooManyRequestsError extends AppError {
  public readonly retryAfterSeconds?: number;
  constructor(message = 'Too Many Requests', retryAfterSeconds?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfterSeconds });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected internal error occurred', details?: unknown) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details, false);
  }
}
