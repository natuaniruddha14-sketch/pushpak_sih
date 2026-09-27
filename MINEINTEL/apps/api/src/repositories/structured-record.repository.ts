import { prisma, isDatabaseConnected } from '../lib/prisma';
import { StructuredRecord, Prisma } from '@prisma/client';
import { memStore } from '../lib/mem-store';
import crypto from 'crypto';

export class StructuredRecordRepository {
  static async findById(id: string): Promise<StructuredRecord | null> {
    if (isDatabaseConnected()) {
      try {
        const r = await prisma.structuredRecord.findUnique({
          where: { id },
          include: { document: { select: { title: true, fileType: true } } },
        });
        if (r) return r;
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const rec = memStore.structuredRecords.get(id);
    return rec ? (rec as unknown as StructuredRecord) : null;
  }

  static async create(data: Prisma.StructuredRecordCreateInput): Promise<StructuredRecord> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.structuredRecord.create({ data });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const id = 'rec-' + crypto.randomUUID().substring(0, 8);
    const projectId = (data.project as any)?.connect?.id || 'prj-rajmahal-001';
    const documentId = (data.document as any)?.connect?.id || 'doc-001';
    const doc = memStore.documents.get(documentId);

    const recObj = {
      id,
      projectId,
      documentId,
      mineName: data.mineName,
      blockName: data.blockName ?? null,
      coalSeam: data.coalSeam ?? null,
      provedReserveMt: data.provedReserveMt ?? null,
      indicatedReserveMt: data.indicatedReserveMt ?? null,
      inferredReserveMt: data.inferredReserveMt ?? null,
      seamThicknessMeters: data.seamThicknessMeters ?? null,
      ashContentPercent: data.ashContentPercent ?? null,
      moisturePercent: data.moisturePercent ?? null,
      volatileMatterPercent: data.volatileMatterPercent ?? null,
      grossCalorificValueKcal: data.grossCalorificValueKcal ?? null,
      strippingRatio: data.strippingRatio ?? null,
      annualProductionMt: data.annualProductionMt ?? null,
      depthMeters: data.depthMeters ?? null,
      extractedData: data.extractedData ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      document: doc ? { title: doc.title, fileType: doc.fileType } : undefined,
    };

    memStore.structuredRecords.set(id, recObj);
    return recObj as unknown as StructuredRecord;
  }

  static async listByProject(projectId: string): Promise<StructuredRecord[]> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.structuredRecord.findMany({
          where: { projectId },
          include: { document: { select: { title: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const list: StructuredRecord[] = [];
    for (const r of memStore.structuredRecords.values()) {
      if (r.projectId === projectId) {
        list.push(r as unknown as StructuredRecord);
      }
    }
    return list;
  }

  static async queryMiningMetrics(projectId: string, filter?: { mineName?: string; coalSeam?: string }): Promise<StructuredRecord[]> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.structuredRecord.findMany({
          where: {
            projectId,
            ...(filter?.mineName ? { mineName: filter.mineName } : {}),
            ...(filter?.coalSeam ? { coalSeam: filter.coalSeam } : {}),
          },
          orderBy: { provedReserveMt: 'desc' },
        });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const list: StructuredRecord[] = [];
    for (const r of memStore.structuredRecords.values()) {
      if (r.projectId === projectId) {
        if (filter?.mineName && !r.mineName.toLowerCase().includes(filter.mineName.toLowerCase())) continue;
        if (filter?.coalSeam && (!r.coalSeam || !r.coalSeam.toLowerCase().includes(filter.coalSeam.toLowerCase()))) continue;
        list.push(r as unknown as StructuredRecord);
      }
    }
    return list;
  }
}
