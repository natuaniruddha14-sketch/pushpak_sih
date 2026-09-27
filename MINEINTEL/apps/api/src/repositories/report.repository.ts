import { prisma } from '../lib/prisma';
import { Report, Prisma } from '@prisma/client';

export class ReportRepository {
  static async findById(id: string): Promise<Report | null> {
    return prisma.report.findUnique({
      where: { id },
      include: {
        author: { select: { name: true, email: true } },
        project: { select: { name: true } },
        sources: { include: { document: { select: { title: true, fileType: true } } } },
      },
    });
  }

  static async create(data: Prisma.ReportCreateInput): Promise<Report> {
    return prisma.report.create({ data });
  }

  static async listByProject(projectId: string): Promise<Report[]> {
    return prisma.report.findMany({
      where: { projectId },
      include: { author: { select: { name: true } }, sources: { select: { documentId: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
