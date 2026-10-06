import { Router } from 'express';
import { MetricsController } from '../controllers/metrics.controller.js';

const router = Router();

// Public & user endpoints for tracking and viewing stats
router.post('/download', MetricsController.trackDownload);
router.post('/share', MetricsController.trackShare);
router.get('/', MetricsController.getMetrics);
router.get('/downloads', MetricsController.getDownloads);
router.post('/reset-downloads', MetricsController.resetDownloads);

export default router;
