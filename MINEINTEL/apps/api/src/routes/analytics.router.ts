import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/summary', AnalyticsController.getSummary);
router.get('/production', AnalyticsController.getProductionAnalytics);
router.get('/comparison', AnalyticsController.getProjectComparison);
router.get('/trends', AnalyticsController.getYearlyTrends);
router.get('/document-stats', AnalyticsController.getDocumentStatistics);
router.get('/topics', AnalyticsController.getTopicIdentification);
router.get('/wordcloud', AnalyticsController.getWordCloudData);
router.get('/word-cloud', AnalyticsController.getWordCloudData);

export default router;
