import { Router } from 'express';
import { CreativeController } from '../controllers/creative.controller.js';
import { verifyAuth } from '../middleware/auth.js';

const router = Router();

router.post('/save', verifyAuth, CreativeController.saveCreative);
router.get('/my-creations', verifyAuth, CreativeController.getUserCreatives);
router.delete('/:id', verifyAuth, CreativeController.deleteCreative);

export default router;
