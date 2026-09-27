import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/query', SearchController.queryAI);
router.post('/hybrid', SearchController.hybridSearch);
router.post('/sessions', SearchController.createQuerySession);
router.get('/sessions', SearchController.listSessionsByProject);
router.get('/sessions/:id', SearchController.getQuerySession);
router.post('/sessions/messages', SearchController.addMessage);

export default router;
