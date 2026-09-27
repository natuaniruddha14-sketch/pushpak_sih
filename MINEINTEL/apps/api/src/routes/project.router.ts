import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/', ProjectController.list);
router.get('/:id', ProjectController.getById);
router.post('/', requireRole(UserRole.ADMIN, UserRole.GEOLOGIST, UserRole.MINING_ENGINEER, UserRole.ANALYST), ProjectController.create);
router.delete('/:id', requireRole(UserRole.ADMIN), ProjectController.delete);

export default router;
