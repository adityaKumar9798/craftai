import { Router } from 'express';
import { TrendingController } from '../controllers/trending.controller.js';
import { verifyAuth } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';

const router = Router();

// Public: GET all trending topics (no auth needed — home dashboard)
router.get('/', TrendingController.getAll);

// Admin only: create, update, delete
router.post('/', verifyAuth, verifyAdmin, TrendingController.create);
router.patch('/:id', verifyAuth, verifyAdmin, TrendingController.update);
router.delete('/:id', verifyAuth, verifyAdmin, TrendingController.remove);

export default router;
