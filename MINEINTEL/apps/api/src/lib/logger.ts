import crypto from 'crypto';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  durationMs?: number;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'authorization',
  'jwt_secret',
  'secret',
  'apikey',
  'api_key',
  'cookie',
  'set-cookie',
]);

export function sanitizeData(data: unknown, depth = 0): unknown {
  if (depth > 5 || data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data.length > 500 ? `${data.substring(0, 500)}...[TRUNCATED]` : data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value, depth + 1);
      }
    }
    return sanitized;
  }

  return data;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      service: 'mineintel-api',
      message,
      ...(context ? (sanitizeData(context) as Record<string, unknown>) : {}),
    };

    return JSON.stringify(payload);
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatLog('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatLog('INFO', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('WARN', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errObj = error instanceof Error
      ? {
          name: error.name,
          errorMessage: error.message,
          stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
        }
      : { rawError: String(error) };

    console.error(
      this.formatLog('ERROR', message, {
        ...context,
        error: errObj,
      })
    );
  }
}

export const logger = new Logger();
