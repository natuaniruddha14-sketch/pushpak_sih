import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createProjectSchema } from '../schemas/project.schema';
import { ProjectRepository } from '../repositories/project.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { prisma } from '../lib/prisma';

export class ProjectController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized', message: 'User is not authenticated' });
        return;
      }

      const projects = await ProjectRepository.listByOrganization(req.user.organizationId);
      res.status(200).json({ projects });
    } catch (err: any) {
      console.error('[Project Error List]:', err);
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const project = await ProjectRepository.findById(id);

      if (!project) {
        res.status(404).json({ error: 'Not Found', message: 'Project not found' });
        return;
      }

      if (req.user && project.organizationId !== req.user.organizationId) {
        res.status(403).json({ error: 'Forbidden', message: 'Access to this project is denied' });
        return;
      }

      res.status(200).json({ project });
    } catch (err: any) {
      console.error('[Project Error GetById]:', err);
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized', message: 'User is not authenticated' });
        return;
      }

      const parseResult = createProjectSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parseResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { name, code, description, mineLocation, targetSeam } = parseResult.data;

      // Check code collision
      const existing = await ProjectRepository.findByCode(code);
      if (existing) {
        res.status(409).json({ error: 'Conflict', message: `Project code '${code}' already exists` });
        return;
      }

      const project = await ProjectRepository.create({
        name,
        code,
        description,
        mineLocation,
        targetSeam,
        organization: { connect: { id: req.user.organizationId } },
        owner: { connect: { id: req.user.id } },
      });

      await AuditLogRepository.create({
        organizationId: req.user.organizationId,
        userId: req.user.id,
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: project.id,
        details: { name: project.name, code: project.code },
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      res.status(201).json({ project });
    } catch (err: any) {
      console.error('[Project Error Create]:', err);
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const project = await ProjectRepository.findById(id);

      if (!project) {
        res.status(404).json({ error: 'Not Found', message: 'Project not found' });
        return;
      }

      if (req.user && project.organizationId !== req.user.organizationId) {
        res.status(403).json({ error: 'Forbidden', message: 'Access to this project is denied' });
        return;
      }

      await prisma.project.delete({ where: { id } });

      if (req.user) {
        await AuditLogRepository.create({
          organizationId: req.user.organizationId,
          userId: req.user.id,
          action: 'PROJECT_DELETED',
          entityType: 'Project',
          entityId: id,
          details: { name: project.name },
          ipAddress: req.ip || req.socket.remoteAddress,
        });
      }

      res.status(200).json({ message: 'Project successfully deleted', id });
    } catch (err: any) {
      console.error('[Project Error Delete]:', err);
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }
}
