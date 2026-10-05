import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { CloudinaryService } from '../services/cloudinary.service.js';
import { ImageService } from '../services/image.service.js';
import { db, isFirebaseConfigured } from '../config/firebase.js';

export class UploadController {
  /**
   * Universal upload endpoint for Photos, Videos, and Template Media
   */
  static async uploadPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const file = req.file || (req.files && Array.isArray(req.files) ? req.files[0] : null);
      if (!file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      const isTemplate = req.body.isTemplate === 'true' || req.body.target === 'template' || req.query.target === 'template';
      const userId = req.user?.uid || 'admin_' + Date.now();
      const isVideo = file.mimetype?.startsWith('video/') || Boolean(req.body.isVideo);

      const folder = isTemplate
        ? 'craft-ai/templates'
        : isVideo
        ? 'craft-ai/videos'
        : `craft-ai/users/${userId}/photos`;

      console.log(`[Cloudinary] Uploading ${file.mimetype || 'media'} (${(file.size / (1024 * 1024)).toFixed(2)} MB) to folder: ${folder}...`);

      const uploadResult = await CloudinaryService.uploadBuffer(
        file.buffer,
        folder
      );

      console.log('[Cloudinary] Successfully uploaded to Cloudinary CDN:', uploadResult.secureUrl);

      // If this is a regular user portrait photo (not a template or video), perform facial processing
      let processing = null;
      if (!isTemplate && !isVideo && !uploadResult.resourceType?.includes('video')) {
        try {
          processing = await ImageService.processUserPhoto(uploadResult.secureUrl);
        } catch (procErr) {
          console.warn('[UploadController] Face processing warning (fallback to direct URL):', procErr);
        }

        // Update user document in Firestore if configured
        if (isFirebaseConfigured && db && req.user?.uid) {
          await db.collection('users').doc(req.user.uid).set(
            {
              photoUrl: uploadResult.secureUrl,
              processedPhotoUrl: processing?.processedUrl || uploadResult.secureUrl,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      }

      res.status(200).json({
        success: true,
        data: {
          url: uploadResult.secureUrl,
          photoUrl: uploadResult.secureUrl,
          secureUrl: uploadResult.secureUrl,
          processedPhotoUrl: processing?.processedUrl || uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          resourceType: uploadResult.resourceType,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          duration: uploadResult.duration,
          processing,
        },
      });
    } catch (error: any) {
      console.error('[UploadController] uploadPhoto error:', error);
      res.status(500).json({ success: false, message: 'Failed to upload media to Cloudinary', error: error?.message });
    }
  }

  /**
   * Dedicated Admin Media / Template Upload Endpoint
   */
  static async uploadAdminMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const file = req.file || (req.files && Array.isArray(req.files) ? req.files[0] : null);
      if (!file) {
        res.status(400).json({ success: false, message: 'No media file uploaded' });
        return;
      }

      const folder = 'craft-ai/templates';
      console.log(`[Cloudinary] Admin uploading template asset (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`);

      const uploadResult = await CloudinaryService.uploadBuffer(
        file.buffer,
        folder
      );

      console.log('[Cloudinary] Admin template asset stored at:', uploadResult.secureUrl);

      res.status(200).json({
        success: true,
        data: {
          url: uploadResult.secureUrl,
          secureUrl: uploadResult.secureUrl,
          photoUrl: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          resourceType: uploadResult.resourceType,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          duration: uploadResult.duration,
        },
      });
    } catch (error: any) {
      console.error('[UploadController] uploadAdminMedia error:', error);
      res.status(500).json({ success: false, message: 'Failed to upload template media', error: error?.message });
    }
  }

  static async getSignature(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const folder = (req.query.folder as string) || 'craft-ai/creatives';
      const sigData = CloudinaryService.generateSignature(folder);
      res.status(200).json({ success: true, data: sigData });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to generate signature', error: error?.message });
    }
  }
}
