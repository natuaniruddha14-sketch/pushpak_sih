import { prisma } from '../lib/prisma';
import { Document, Prisma, ProcessingStage } from '@prisma/client';
import { memStore } from '../lib/mem-store';
import crypto from 'crypto';

export class DocumentRepository {
  static async findById(id: string): Promise<Document | null> {
    try {
      if (process.env.DATABASE_URL) {
        const d = await prisma.document.findUnique({
          where: { id },
          include: {
            project: true,
            uploader: { select: { id: true, name: true, email: true } },
            pages: { orderBy: { pageNumber: 'asc' } },
            chunks: { select: { id: true, chunkIndex: true, tokenCount: true } },
            _count: { select: { pages: true, chunks: true, entities: true, structuredRecs: true } },
          },
        });
        if (d) return d;
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    const doc = memStore.documents.get(id);
    if (doc) return doc as unknown as Document;
    if (memStore.documents.size > 0) return Array.from(memStore.documents.values())[0] as unknown as Document;
    return null;
  }

  static async findByChecksum(checksum: string): Promise<Document | null> {
    try {
      if (process.env.DATABASE_URL) {
        const d = await prisma.document.findUnique({ where: { checksum } });
        if (d) return d;
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    for (const doc of memStore.documents.values()) {
      if (doc.checksum === checksum) {
        return doc as unknown as Document;
      }
    }
    return null;
  }

  static async create(data: Prisma.DocumentCreateInput): Promise<Document> {
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.document.create({ data });
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    const id = 'doc-' + crypto.randomUUID().substring(0, 8);
    const projectId = (data.project as any)?.connect?.id || 'prj-rajmahal-001';
    const uploaderId = (data.uploader as any)?.connect?.id || 'usr-admin-01';
    const uploader = memStore.users.get(uploaderId) || Array.from(memStore.users.values())[0];

    const docObj = {
      id,
      projectId,
      uploaderId,
      title: data.title,
      filename: data.filename,
      fileType: data.fileType,
      fileSizeBytes: data.fileSizeBytes,
      mimeType: data.mimeType,
      checksum: data.checksum,
      storagePath: data.storagePath,
      processingStage: data.processingStage || ProcessingStage.UPLOADED,
      mineName: data.mineName ?? null,
      blockName: data.blockName ?? null,
      coalSeam: data.coalSeam ?? null,
      reserveCategory: data.reserveCategory ?? null,
      authoringBody: data.authoringBody ?? null,
      reportYear: data.reportYear ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      uploader: uploader ? { id: uploader.id, name: uploader.name, email: uploader.email } : undefined,
    };

    memStore.documents.set(id, docObj);
    return docObj as unknown as Document;
  }

  static async updateStage(
    id: string,
    processingStage: ProcessingStage,
    errorMessage?: string
  ): Promise<Document> {
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.document.update({
          where: { id },
          data: { processingStage, errorMessage },
        });
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    const doc = memStore.documents.get(id);
    if (doc) {
      doc.processingStage = processingStage;
      if (errorMessage) doc.errorMessage = errorMessage;
      doc.updatedAt = new Date();
    }
    return doc as unknown as Document;
  }

  static async listByProject(projectId: string): Promise<Document[]> {
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.document.findMany({
          where: { projectId },
          include: { uploader: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        });
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    return Array.from(memStore.documents.values()).filter(
      (d) => d.projectId === projectId
    ) as unknown as Document[];
  }
}
