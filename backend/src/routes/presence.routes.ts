import { Router } from 'express';
import { PresenceController } from '../controllers/presence.controller.js';

const router = Router();

router.post('/heartbeat', PresenceController.heartbeat);
router.post('/leave', PresenceController.leave);
router.get('/count', PresenceController.getActiveCount);

export default router;
