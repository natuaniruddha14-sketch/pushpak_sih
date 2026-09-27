import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { uploadSingleFile } from '../middleware/upload.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/', DocumentController.listByProject);
router.get('/jobs/:jobId', DocumentController.getJobStatus);
router.get('/:id', DocumentController.getById);
router.get('/:id/download', DocumentController.downloadDocument);
router.get('/:id/tables', DocumentController.getTables);

// Upload Endpoints (supports multipart and base64 JSON body fallbacks)
router.post(
  '/upload',
  requireRole(UserRole.ADMIN, UserRole.GEOLOGIST, UserRole.MINING_ENGINEER, UserRole.ANALYST),
  uploadSingleFile,
  DocumentController.uploadDocument
);

router.post(
  '/',
  requireRole(UserRole.ADMIN, UserRole.GEOLOGIST, UserRole.MINING_ENGINEER, UserRole.ANALYST),
  uploadSingleFile,
  DocumentController.uploadDocument
);

// Ingestion Pipeline Endpoints
router.post('/:documentId/index', requireRole(UserRole.ADMIN, UserRole.GEOLOGIST, UserRole.MINING_ENGINEER, UserRole.ANALYST), DocumentController.indexDocument);
router.post('/index/document/:documentId', requireRole(UserRole.ADMIN, UserRole.GEOLOGIST, UserRole.MINING_ENGINEER, UserRole.ANALYST), DocumentController.indexDocument);
router.post('/:documentId', requireRole(UserRole.ADMIN, UserRole.GEOLOGIST, UserRole.MINING_ENGINEER, UserRole.ANALYST), DocumentController.indexDocument);

router.patch('/:id/stage', DocumentController.updateStage);
router.delete('/:id', requireRole(UserRole.ADMIN, UserRole.GEOLOGIST), DocumentController.delete);

export default router;
