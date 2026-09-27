import { Router } from 'express';
import { ValidationController } from '../controllers/validation.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/quality-score', ValidationController.getQualityScore);
router.get('/checks', ValidationController.getValidationChecks);
router.get('/conflicts', ValidationController.getConflictingValues);
router.get('/traceability', ValidationController.getTraceabilityLog);
router.get('/audit-logs', ValidationController.getAuditLogs);

export default router;
