import { prisma } from '../lib/prisma';
import { QuerySession, QueryMessage, Citation, Prisma } from '@prisma/client';

export class QuerySessionRepository {
  static async findById(id: string): Promise<QuerySession | null> {
    return prisma.querySession.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { citations: { include: { document: { select: { title: true } } } } },
        },
      },
    });
  }

  static async createSession(data: Prisma.QuerySessionCreateInput): Promise<QuerySession> {
    return prisma.querySession.create({ data });
  }

  static async addMessage(data: Prisma.QueryMessageCreateInput): Promise<QueryMessage> {
    return prisma.queryMessage.create({
      data,
      include: { citations: true },
    });
  }

  static async addCitation(data: Prisma.CitationCreateInput): Promise<Citation> {
    return prisma.citation.create({ data });
  }

  static async listByProject(projectId: string): Promise<QuerySession[]> {
    return prisma.querySession.findMany({
      where: { projectId },
      include: { user: { select: { name: true } }, _count: { select: { messages: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
