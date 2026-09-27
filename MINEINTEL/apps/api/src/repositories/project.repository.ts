import { prisma, isDatabaseConnected } from '../lib/prisma';
import { Project, Prisma } from '@prisma/client';
import { memStore } from '../lib/mem-store';
import crypto from 'crypto';

export class ProjectRepository {
  static async findById(id: string): Promise<Project | null> {
    if (isDatabaseConnected()) {
      try {
        const p = await prisma.project.findUnique({
          where: { id },
          include: {
            organization: true,
            owner: { select: { id: true, name: true, email: true, role: true } },
            _count: { select: { documents: true, reports: true, structuredRecs: true } },
          },
        });
        if (p) return p;
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const prj = memStore.projects.get(id);
    if (prj) return prj as unknown as Project;
    return null;
  }

  static async findByCode(code: string): Promise<Project | null> {
    if (isDatabaseConnected()) {
      try {
        const p = await prisma.project.findUnique({ where: { code } });
        if (p) return p;
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    for (const prj of memStore.projects.values()) {
      if (prj.code === code) {
        return prj as unknown as Project;
      }
    }
    return null;
  }

  static async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.project.create({ data });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    const id = 'prj-' + crypto.randomUUID().substring(0, 8);
    const orgId = (data.organization as any)?.connect?.id || 'org-cmpdi-hq-001';
    const ownerId = (data.owner as any)?.connect?.id || 'usr-admin-01';

    const prjObj = {
      id,
      organizationId: orgId,
      ownerId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      mineLocation: data.mineLocation ?? null,
      targetSeam: data.targetSeam ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { documents: 0, reports: 0, structuredRecs: 0 },
    };

    memStore.projects.set(id, prjObj);
    return prjObj as unknown as Project;
  }

  static async listByOrganization(organizationId: string): Promise<Project[]> {
    if (isDatabaseConnected()) {
      try {
        return await prisma.project.findMany({
          where: { organizationId },
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { documents: true, reports: true } },
          },
          orderBy: { updatedAt: 'desc' },
        });
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    return Array.from(memStore.projects.values()).filter(
      (p) => p.organizationId === organizationId
    ) as unknown as Project[];
  }

  static async delete(id: string): Promise<boolean> {
    if (isDatabaseConnected()) {
      try {
        await prisma.project.delete({ where: { id } });
        return true;
      } catch (_err) {}
    }

    await memStore.initializeDefaults();
    return memStore.projects.delete(id);
  }
}
