import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { verifyAuth } from '../middleware/auth.js';

const router = Router();

router.get('/profile', verifyAuth, UserController.getProfile);
router.patch('/profile', verifyAuth, UserController.updateProfile);
router.post('/favorites/toggle', verifyAuth, UserController.toggleFavorite);
router.get('/favorites', verifyAuth, UserController.getFavorites);
router.post('/sync', UserController.syncUser);
router.get('/list', UserController.listUsers);
router.post('/role', UserController.toggleRole);
router.post('/cleanup', UserController.cleanupMockUsers);
router.post('/clear-all', UserController.clearAllUsers);
router.delete('/:uid', UserController.deleteUser);

export default router;
