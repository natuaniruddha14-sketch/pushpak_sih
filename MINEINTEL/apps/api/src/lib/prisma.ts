import { PrismaClient } from '@prisma/client';
import net from 'net';

declare global {
  var prisma: PrismaClient | undefined;
  var dbConnectedState: boolean | undefined;
  var lastDbCheckTime: number | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

let dbConnected = global.dbConnectedState ?? Boolean(process.env.DATABASE_URL);
let lastCheckTime = global.lastDbCheckTime ?? 0;
const PROBE_CACHE_TTL_MS = 20000; // 20s cache

/**
 * Fast network probe to check if database port is actively listening.
 */
function probeTcp(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      settled = true;
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.once('error', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    try {
      socket.connect(port, host);
    } catch (_e) {
      resolve(false);
    }
  });
}

function parseHostPortFromDatabaseUrl(dbUrl?: string): { host: string; port: number } | null {
  if (!dbUrl) return null;
  try {
    const parsed = new URL(dbUrl);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
    };
  } catch (_e) {
    return { host: 'localhost', port: 5432 };
  }
}

/**
 * Checks whether PostgreSQL database is reachable.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    dbConnected = false;
    global.dbConnectedState = false;
    return false;
  }

  const now = Date.now();
  if (now - lastCheckTime < PROBE_CACHE_TTL_MS && dbConnected !== undefined) {
    return dbConnected;
  }

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    dbConnected = true;
  } catch (_err) {
    const target = parseHostPortFromDatabaseUrl(process.env.DATABASE_URL);
    if (target) {
      dbConnected = await probeTcp(target.host, target.port, 3000);
    } else {
      dbConnected = false;
    }
  }

  lastCheckTime = now;
  global.dbConnectedState = dbConnected;
  global.lastDbCheckTime = lastCheckTime;

  return dbConnected;
}

export function isDatabaseConnected(): boolean {
  return dbConnected;
}

// Initial probe
checkDatabaseConnection().catch(() => {});

export default prisma;
