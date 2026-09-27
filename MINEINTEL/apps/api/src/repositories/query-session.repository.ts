import { prisma, isDatabaseConnected } from '../lib/prisma';
import { QuerySession, QueryMessage, Citation, Prisma, MessageRole } from '@prisma/client';
import { memStore } from '../lib/mem-store';
import crypto from 'crypto';

export class QuerySessionRepository {
  static async findById(id: string): Promise<QuerySession | null> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.querySession.findUnique({
          where: { id },
          include: {
            user: { select: { name: true, email: true } },
            messages: {
              orderBy: { createdAt: 'asc' },
              include: { citations: { include: { document: { select: { title: true } } } } },
            },
          },
        });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const session = memStore.querySessions.get(id);
    return session ? (session as unknown as QuerySession) : null;
  }

  static async createSession(data: Prisma.QuerySessionCreateInput): Promise<QuerySession> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.querySession.create({ data });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const id = 'sess-' + crypto.randomUUID().substring(0, 8);
    const projectId = (data.project as any)?.connect?.id || 'prj-rajmahal-001';
    const userId = (data.user as any)?.connect?.id || 'usr-admin-01';
    const user = memStore.users.get(userId);

    const sessionObj = {
      id,
      projectId,
      userId,
      title: data.title,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      user: user ? { name: user.name, email: user.email } : undefined,
    };

    memStore.querySessions.set(id, sessionObj);
    return sessionObj as unknown as QuerySession;
  }

  static async addMessage(data: Prisma.QueryMessageCreateInput): Promise<QueryMessage> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.queryMessage.create({
          data,
          include: { citations: true },
        });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const sessionId = (data.session as any)?.connect?.id;
    const session = sessionId ? memStore.querySessions.get(sessionId) : null;

    const messageObj = {
      id: 'msg-' + crypto.randomUUID().substring(0, 8),
      sessionId: sessionId || 'sess-default',
      role: data.role as MessageRole,
      content: data.content,
      tokenCount: data.tokenCount ?? null,
      latencyMs: data.latencyMs ?? null,
      createdAt: new Date(),
      citations: [],
    };

    if (session) {
      session.messages.push(messageObj);
      session.updatedAt = new Date();
    }

    return messageObj as unknown as QueryMessage;
  }

  static async addCitation(data: Prisma.CitationCreateInput): Promise<Citation> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.citation.create({ data });
      } catch (_err) {}
    }

    const citationObj = {
      id: 'cit-' + crypto.randomUUID().substring(0, 8),
      messageId: (data.message as any)?.connect?.id || 'msg-default',
      documentId: (data.document as any)?.connect?.id || 'doc-default',
      pageId: (data.page as any)?.connect?.id || null,
      chunkId: (data.chunk as any)?.connect?.id || null,
      documentTitle: data.documentTitle,
      pageNumber: data.pageNumber ?? 1,
      snippet: data.snippet,
      relevanceScore: data.relevanceScore,
      createdAt: new Date(),
    };

    return citationObj as unknown as Citation;
  }

  static async listByProject(projectId: string): Promise<QuerySession[]> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.querySession.findMany({
          where: { projectId },
          include: { user: { select: { name: true } }, _count: { select: { messages: true } } },
          orderBy: { updatedAt: 'desc' },
        });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const list: QuerySession[] = [];
    for (const s of memStore.querySessions.values()) {
      if (s.projectId === projectId) {
        list.push(s as unknown as QuerySession);
      }
    }
    return list;
  }
}
