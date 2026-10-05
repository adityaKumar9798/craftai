import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller.js';
import { verifyAuth } from '../middleware/auth.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for high-res videos & images
});

// Photo & Video upload (supports any file field: photo, file, image, media, video)
router.post('/photo', verifyAuth, upload.any(), UploadController.uploadPhoto);
router.post('/media', verifyAuth, upload.any(), UploadController.uploadPhoto);
router.post('/admin-media', verifyAuth, upload.any(), UploadController.uploadAdminMedia);

// Signed upload configuration for direct Cloudinary client upload
router.get('/signature', verifyAuth, UploadController.getSignature);

export default router;
