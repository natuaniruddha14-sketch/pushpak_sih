import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/', ReportController.listReports);
router.get('/:id/download', ReportController.downloadReport);
router.get('/:id', ReportController.getById);

router.post('/generate', ReportController.generateReport);
router.post('/', ReportController.generateReport);

export default router;
