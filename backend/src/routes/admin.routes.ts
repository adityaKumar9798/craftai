import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { verifyAuth } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';

const router = Router();

// Protect all admin endpoints with auth and server-side verified admin check
router.use(verifyAuth, verifyAdmin);

router.get('/stats', AdminController.getStats);
router.post('/templates', AdminController.createTemplate);
router.patch('/templates/:id', AdminController.updateTemplate);
router.delete('/templates/:id', AdminController.deleteTemplate);

export default router;
