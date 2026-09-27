import { prisma } from '../lib/prisma';
import { ProcessingJob, Prisma, JobStatus } from '@prisma/client';
import { memStore } from '../lib/mem-store';
import crypto from 'crypto';

export class ProcessingJobRepository {
  static async findById(id: string): Promise<ProcessingJob | null> {
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.processingJob.findUnique({
          where: { id },
          include: {
            document: { select: { title: true, fileType: true } },
            user: { select: { name: true, email: true } },
          },
        });
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    const job = memStore.querySessions.get(id); // Use querySessions map or jobs map
    return job ? (job as unknown as ProcessingJob) : null;
  }

  static async create(data: Prisma.ProcessingJobCreateInput): Promise<ProcessingJob> {
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.processingJob.create({ data });
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    const id = 'job-' + crypto.randomUUID().substring(0, 8);
    const projectId = (data.project as any)?.connect?.id || 'prj-rajmahal-001';
    const documentId = (data.document as any)?.connect?.id || 'doc-001';
    const userId = (data.user as any)?.connect?.id || 'usr-admin-01';

    const jobObj = {
      id,
      projectId,
      documentId,
      userId,
      status: data.status || JobStatus.QUEUED,
      progressPercent: data.progressPercent ?? 0,
      currentStep: data.currentStep ?? 'Queued',
      errorMessage: data.errorMessage ?? null,
      startedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memStore.querySessions.set(id, jobObj);
    return jobObj as unknown as ProcessingJob;
  }

  static async updateProgress(
    id: string,
    progressPercent: number,
    currentStep?: string,
    status?: JobStatus,
    errorMessage?: string
  ): Promise<ProcessingJob> {
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.processingJob.update({
          where: { id },
          data: {
            progressPercent,
            ...(currentStep ? { currentStep } : {}),
            ...(status ? { status } : {}),
            ...(errorMessage ? { errorMessage } : {}),
            ...(status === JobStatus.COMPLETED || status === JobStatus.FAILED
              ? { completedAt: new Date() }
              : {}),
          },
        });
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    const job = memStore.querySessions.get(id);
    if (job) {
      job.progressPercent = progressPercent;
      if (currentStep) job.currentStep = currentStep;
      if (status) job.status = status;
      if (errorMessage) job.errorMessage = errorMessage;
      job.updatedAt = new Date();
    }
    return job as unknown as ProcessingJob;
  }

  static async listByDocument(documentId: string): Promise<ProcessingJob[]> {
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.processingJob.findMany({
          where: { documentId },
          orderBy: { createdAt: 'desc' },
        });
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    const list: ProcessingJob[] = [];
    for (const job of memStore.querySessions.values()) {
      if (job.documentId === documentId) {
        list.push(job as unknown as ProcessingJob);
      }
    }
    return list;
  }
}
