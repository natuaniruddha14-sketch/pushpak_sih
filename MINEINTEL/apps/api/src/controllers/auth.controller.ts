import { Request, Response } from 'express';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { UserRepository } from '../repositories/user.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { hashPassword, comparePassword, generateToken } from '../lib/auth';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { UserRole } from '@prisma/client';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parseResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { email, password, name, role, organizationId } = parseResult.data;

      // Check if email already registered
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'Conflict', message: 'User email is already registered' });
        return;
      }

      // Default or lookup organization
      let targetOrgId = organizationId;
      if (!targetOrgId) {
        let defaultOrg = await OrganizationRepository.findByCode('CMPDI-HQ');
        if (!defaultOrg) {
          defaultOrg = await OrganizationRepository.create({
            name: 'Central Mine Planning & Design Institute',
            code: 'CMPDI-HQ',
            description: 'Default organization created on user registration',
          });
        }
        targetOrgId = defaultOrg.id;
      }

      // Hash password with bcrypt
      const passwordHash = await hashPassword(password);

      // Create User
      const newUser = await UserRepository.create({
        email,
        name,
        passwordHash,
        role: role as UserRole,
        organization: { connect: { id: targetOrgId } },
      });

      // Generate JWT Token
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        organizationId: newUser.organizationId,
      });

      // Log Audit Event
      await AuditLogRepository.create({
        organizationId: newUser.organizationId,
        userId: newUser.id,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: newUser.id,
        details: { role: newUser.role, email: newUser.email },
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          organizationId: newUser.organizationId,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt.toISOString(),
          updatedAt: newUser.updatedAt.toISOString(),
        },
      });
    } catch (err: any) {
      console.error('[Auth Error Register]:', err);
      res.status(500).json({ error: 'Internal Server Error', message: err.message || 'Failed to register user' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parseResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { email, password } = parseResult.data;

      // Find user
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
        return;
      }

      // Verify bcrypt password hash
      const isPasswordValid = await comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
        return;
      }

      // Generate JWT Token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      });

      // Log Audit Event
      await AuditLogRepository.create({
        organizationId: user.organizationId,
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        details: { email: user.email },
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      res.status(200).json({
        token,
        user: {
          id: user.id,
          organizationId: user.organizationId,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      });
    } catch (err: any) {
      console.error('[Auth Error Login]:', err);
      res.status(500).json({ error: 'Internal Server Error', message: err.message || 'Failed to authenticate user' });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // In stateless JWT auth, logout confirms client token discard
      const authReq = req as AuthenticatedRequest;
      if (authReq.user) {
        await AuditLogRepository.create({
          organizationId: authReq.user.organizationId,
          userId: authReq.user.id,
          action: 'USER_LOGOUT',
          entityType: 'User',
          entityId: authReq.user.id,
          ipAddress: req.ip || req.socket.remoteAddress,
        });
      }

      res.status(200).json({ message: 'Successfully logged out' });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized', message: 'User is not authenticated' });
        return;
      }

      const user = await UserRepository.findById(req.user.id);
      if (!user) {
        res.status(404).json({ error: 'Not Found', message: 'User profile not found' });
        return;
      }

      res.status(200).json({
        user: {
          id: user.id,
          organizationId: user.organizationId,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }
}
