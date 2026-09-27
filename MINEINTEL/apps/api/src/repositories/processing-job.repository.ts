import { prisma, isDatabaseConnected } from '../lib/prisma';
import { ProcessingJob, Prisma, JobStatus } from '@prisma/client';
import { memStore } from '../lib/mem-store';
import crypto from 'crypto';

export class ProcessingJobRepository {
  static async findById(id: string): Promise<ProcessingJob | null> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.processingJob.findUnique({
          where: { id },
          include: {
            document: { select: { title: true, fileType: true } },
            user: { select: { name: true, email: true } },
          },
        });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const job = memStore.processingJobs.get(id);
    return job ? (job as unknown as ProcessingJob) : null;
  }

  static async create(data: Prisma.ProcessingJobCreateInput): Promise<ProcessingJob> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.processingJob.create({ data });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const id = 'job-' + crypto.randomUUID().substring(0, 8);
    const projectId = (data.project as any)?.connect?.id || 'prj-rajmahal-001';
    const documentId = (data.document as any)?.connect?.id || 'doc-001';
    const userId = (data.user as any)?.connect?.id || 'usr-admin-01';
    const doc = memStore.documents.get(documentId);
    const user = memStore.users.get(userId);

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
      document: doc ? { title: doc.title, fileType: doc.fileType } : undefined,
      user: user ? { name: user.name, email: user.email } : undefined,
    };

    memStore.processingJobs.set(id, jobObj);
    return jobObj as unknown as ProcessingJob;
  }

  static async updateProgress(
    id: string,
    progressPercent: number,
    currentStep?: string,
    status?: JobStatus,
    errorMessage?: string
  ): Promise<ProcessingJob | null> {
    if (isDatabaseConnected()) {
      try {
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
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const job = memStore.processingJobs.get(id);
    if (job) {
      job.progressPercent = progressPercent;
      if (currentStep) job.currentStep = currentStep;
      if (status) job.status = status;
      if (errorMessage) job.errorMessage = errorMessage;
      if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
        job.completedAt = new Date();
      }
      job.updatedAt = new Date();
      return job as unknown as ProcessingJob;
    }
    return null;
  }

  static async listByDocument(documentId: string): Promise<ProcessingJob[]> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.processingJob.findMany({
          where: { documentId },
          orderBy: { createdAt: 'desc' },
        });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const list: ProcessingJob[] = [];
    for (const job of memStore.processingJobs.values()) {
      if (job.documentId === documentId) {
        list.push(job as unknown as ProcessingJob);
      }
    }
    return list;
  }
}
