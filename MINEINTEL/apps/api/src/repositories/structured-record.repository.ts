import { prisma } from '../lib/prisma';
import { StructuredRecord, Prisma } from '@prisma/client';

export class StructuredRecordRepository {
  static async findById(id: string): Promise<StructuredRecord | null> {
    return prisma.structuredRecord.findUnique({
      where: { id },
      include: { document: { select: { title: true, fileType: true } } },
    });
  }

  static async create(data: Prisma.StructuredRecordCreateInput): Promise<StructuredRecord> {
    return prisma.structuredRecord.create({ data });
  }

  static async listByProject(projectId: string): Promise<StructuredRecord[]> {
    return prisma.structuredRecord.findMany({
      where: { projectId },
      include: { document: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async queryMiningMetrics(projectId: string, filter?: { mineName?: string; coalSeam?: string }): Promise<StructuredRecord[]> {
    return prisma.structuredRecord.findMany({
      where: {
        projectId,
        ...(filter?.mineName ? { mineName: filter.mineName } : {}),
        ...(filter?.coalSeam ? { coalSeam: filter.coalSeam } : {}),
      },
      orderBy: { provedReserveMt: 'desc' },
    });
  }
}
