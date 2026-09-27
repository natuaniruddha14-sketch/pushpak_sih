import { prisma } from '../lib/prisma';
import { Organization, Prisma } from '@prisma/client';
import { memStore } from '../lib/mem-store';
import crypto from 'crypto';

export class OrganizationRepository {
  static async findById(id: string): Promise<Organization | null> {
    try {
      if (process.env.DATABASE_URL) {
        const o = await prisma.organization.findUnique({
          where: { id },
          include: { _count: { select: { users: true, projects: true } } },
        });
        if (o) return o;
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    const org = memStore.organizations.get(id);
    if (org) return org as unknown as Organization;
    if (memStore.organizations.size > 0) return Array.from(memStore.organizations.values())[0] as unknown as Organization;
    return null;
  }

  static async findByCode(code: string): Promise<Organization | null> {
    try {
      if (process.env.DATABASE_URL) {
        const o = await prisma.organization.findUnique({ where: { code } });
        if (o) return o;
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    for (const org of memStore.organizations.values()) {
      if (org.code === code) {
        return org as unknown as Organization;
      }
    }
    return null;
  }

  static async create(data: Prisma.OrganizationCreateInput): Promise<Organization> {
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.organization.create({ data });
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    const id = 'org-' + crypto.randomUUID().substring(0, 8);
    const orgObj = {
      id,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memStore.organizations.set(id, orgObj);
    return orgObj as unknown as Organization;
  }

  static async listAll(): Promise<Organization[]> {
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.organization.findMany({
          orderBy: { name: 'asc' },
        });
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    return Array.from(memStore.organizations.values()) as unknown as Organization[];
  }
}
