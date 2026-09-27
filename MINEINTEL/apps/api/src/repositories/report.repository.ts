import { prisma, isDatabaseConnected } from '../lib/prisma';
import { Report, Prisma, JobStatus, ReportFormat, ReportTemplate } from '@prisma/client';
import { memStore } from '../lib/mem-store';
import crypto from 'crypto';

export class ReportRepository {
  static async findById(id: string): Promise<Report | null> {
    if (isDatabaseConnected()) {
      try {
        const r = await prisma.report.findUnique({
          where: { id },
          include: {
            author: { select: { name: true, email: true } },
            project: { select: { name: true } },
            sources: { include: { document: { select: { title: true, fileType: true } } } },
          },
        });
        if (r) return r;
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const rep = memStore.reports.get(id);
    return rep ? (rep as unknown as Report) : null;
  }

  static async create(data: Prisma.ReportCreateInput): Promise<Report> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.report.create({ data });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const id = 'rep-' + crypto.randomUUID().substring(0, 8);
    const projectId = (data.project as any)?.connect?.id || 'prj-rajmahal-001';
    const authorId = (data.author as any)?.connect?.id || 'usr-admin-01';
    const project = memStore.projects.get(projectId);
    const author = memStore.users.get(authorId);

    const reportObj = {
      id,
      projectId,
      authorId,
      title: data.title,
      templateType: data.templateType || ReportTemplate.EXECUTIVE_SUMMARY,
      status: data.status || JobStatus.COMPLETED,
      summaryText: data.summaryText ?? null,
      storagePath: data.storagePath ?? null,
      fileFormat: data.fileFormat || ReportFormat.PDF,
      createdAt: new Date(),
      updatedAt: new Date(),
      project: project ? { name: project.name, code: project.code } : undefined,
      author: author ? { name: author.name, email: author.email } : undefined,
      sources: [],
    };

    memStore.reports.set(id, reportObj);
    return reportObj as unknown as Report;
  }

  static async listByProject(projectId?: string): Promise<Report[]> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.report.findMany({
          where: projectId ? { projectId } : {},
          include: {
            author: { select: { name: true } },
            project: { select: { name: true, code: true } },
            sources: { include: { document: { select: { id: true, title: true, filename: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const list: Report[] = [];
    for (const rep of memStore.reports.values()) {
      if (!projectId || rep.projectId === projectId) {
        list.push(rep as unknown as Report);
      }
    }
    return list;
  }
}
