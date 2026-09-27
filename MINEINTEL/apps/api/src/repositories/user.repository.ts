import { prisma } from '../lib/prisma';
import { User, Prisma, UserRole } from '@prisma/client';
import { memStore } from '../lib/mem-store';
import crypto from 'crypto';

export class UserRepository {
  static async findById(id: string): Promise<User | null> {
    try {
      if (process.env.DATABASE_URL) {
        const u = await prisma.user.findUnique({
          where: { id },
          include: { organization: true },
        });
        if (u) return u;
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    const user = memStore.users.get(id);
    if (user) return user as unknown as User;
    if (memStore.users.size > 0) return Array.from(memStore.users.values())[0] as unknown as User;
    return null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      if (process.env.DATABASE_URL) {
        const u = await prisma.user.findUnique({
          where: { email },
          include: { organization: true },
        });
        if (u) return u;
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    for (const u of memStore.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return u as unknown as User;
      }
    }
    return null;
  }

  static async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.user.create({ data });
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    const id = 'usr-' + crypto.randomUUID().substring(0, 8);
    const orgId = (data.organization as any)?.connect?.id || 'org-cmpdi-hq-001';
    const org = memStore.organizations.get(orgId) || Array.from(memStore.organizations.values())[0];

    const userObj = {
      id,
      organizationId: orgId,
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role as UserRole,
      createdAt: new Date(),
      updatedAt: new Date(),
      organization: org,
    };

    memStore.users.set(id, userObj);
    return userObj as unknown as User;
  }

  static async listByOrganization(organizationId: string): Promise<User[]> {
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.user.findMany({
          where: { organizationId },
          orderBy: { name: 'asc' },
        });
      }
    } catch (_err) {}

    await memStore.initializeDefaults();
    const list: User[] = [];
    for (const u of memStore.users.values()) {
      if (u.organizationId === organizationId) {
        list.push(u as unknown as User);
      }
    }
    return list;
  }
}
