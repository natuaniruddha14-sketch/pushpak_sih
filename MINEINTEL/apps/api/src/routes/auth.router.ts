import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.getCurrentUser);

export default router;
