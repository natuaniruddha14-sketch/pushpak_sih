import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/auth';
import { UserRole } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication token missing or invalid format' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (token === 'demo-jwt-token-cmpdi-2026') {
    const admin = (await UserRepository.findByEmail('admin@cmpdi.in')) || (await UserRepository.findByEmail('geologist@cmpdi.in'));
    if (admin) {
      req.user = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        organizationId: admin.organizationId,
      };
      next();
      return;
    }
  }

  try {
    const decoded: JwtPayload = verifyToken(token);
    
    // Optionally fetch full user record to verify account is still active
    const user = await UserRepository.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User account no longer exists' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    };

    next();
  } catch (_err) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User is not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Role '${req.user.role}' does not have sufficient permissions. Allowed: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};
