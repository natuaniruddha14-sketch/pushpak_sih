import app from './app';
import { env } from './lib/env';
import { logger } from './lib/logger';

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`[MINEINTEL API] Server listening on http://${env.HOST}:${env.PORT}`, {
    port: env.PORT,
    host: env.HOST,
    environment: env.NODE_ENV,
  });
  logger.info(`[MINEINTEL API] Health endpoint active at http://${env.HOST}:${env.PORT}/health`);
});

const gracefulShutdown = (signal: string) => {
  logger.info(`[MINEINTEL API] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('[MINEINTEL API] HTTP server closed cleanly.');
    process.exit(0);
  });

  // Force close after 10s timeout
  setTimeout(() => {
    logger.error('[MINEINTEL API] Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('[MINEINTEL API] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('[MINEINTEL API] Uncaught Exception:', error);
  process.exit(1);
});
