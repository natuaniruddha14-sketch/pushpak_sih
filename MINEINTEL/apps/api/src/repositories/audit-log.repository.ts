import { prisma, isDatabaseConnected } from '../lib/prisma';
import { AuditLog, Prisma } from '@prisma/client';
import { memStore } from '../lib/mem-store';
import crypto from 'crypto';

export class AuditLogRepository {
  static async create(data: Prisma.AuditLogUncheckedCreateInput): Promise<AuditLog> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.auditLog.create({ data });
      } catch (_err) {}
    }

    const logItem = {
      id: 'log-' + crypto.randomUUID().substring(0, 8),
      organizationId: data.organizationId ?? null,
      userId: data.userId ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      details: data.details ?? null,
      ipAddress: data.ipAddress ?? null,
      createdAt: new Date(),
    };
    memStore.auditLogs.push(logItem);
    return logItem as unknown as AuditLog;
  }

  static async listByOrganization(organizationId: string, limit = 50): Promise<AuditLog[]> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.auditLog.findMany({
          where: { organizationId },
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
      } catch (_err) {}
    }

    return memStore.auditLogs
      .filter((l) => l.organizationId === organizationId || !l.organizationId)
      .slice(0, limit) as unknown as AuditLog[];
  }
}
