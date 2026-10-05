import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { db, isFirebaseConfigured } from '../config/firebase.js';
import { CloudinaryService } from '../services/cloudinary.service.js';
import { GeneratedCreative } from '../types/index.js';

let inMemoryCreatives: GeneratedCreative[] = [];

export class CreativeController {
  static async saveCreative(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { templateId, templateName, category, type = 'image', base64Data, outputUrl } = req.body;

      let finalOutputUrl = outputUrl;

      // If client sent base64 image data, upload directly to Cloudinary
      if (base64Data && base64Data.startsWith('data:image')) {
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const buffer = Buffer.from(matches[2], 'base64');
          const uploadResult = await CloudinaryService.uploadBuffer(
            buffer,
            `craft-ai/creatives/${userId}`
          );
          finalOutputUrl = uploadResult.secureUrl;
        }
      }

      if (!finalOutputUrl) {
        res.status(400).json({ success: false, message: 'Creative output URL or base64Data is required' });
        return;
      }

      const creativeItem: GeneratedCreative = {
        id: `creative_${Date.now()}`,
        userId,
        templateId,
        templateName: templateName || 'Custom Story',
        category: category || 'trending',
        outputUrl: finalOutputUrl,
        type,
        createdAt: new Date().toISOString(),
      };

      if (isFirebaseConfigured && db) {
        await db.collection('generatedCreatives').doc(creativeItem.id).set(creativeItem);
      }

      inMemoryCreatives.unshift(creativeItem);

      res.status(201).json({
        success: true,
        message: 'Creative saved successfully',
        data: creativeItem,
      });
    } catch (error: any) {
      console.error('[CreativeController] saveCreative error:', error);
      res.status(500).json({ success: false, message: 'Failed to save creative', error: error?.message });
    }
  }

  static async getUserCreatives(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (isFirebaseConfigured && db) {
        const snapshot = await db
          .collection('generatedCreatives')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();

        const items = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        res.status(200).json({ success: true, count: items.length, data: items });
        return;
      }

      const userItems = inMemoryCreatives.filter(c => c.userId === userId);
      res.status(200).json({ success: true, count: userItems.length, data: userItems });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch creations', error: error?.message });
    }
  }

  static async deleteCreative(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      const id = req.params.id as string;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (isFirebaseConfigured && db) {
        const docRef = db.collection('generatedCreatives').doc(id);
        const doc = await docRef.get();
        if (doc.exists && doc.data()?.userId === userId) {
          await docRef.delete();
          res.status(200).json({ success: true, message: 'Creation deleted successfully' });
          return;
        }
      }

      const index = inMemoryCreatives.findIndex(c => c.id === id && c.userId === userId);
      if (index !== -1) {
        inMemoryCreatives.splice(index, 1);
        res.status(200).json({ success: true, message: 'Creation deleted successfully' });
        return;
      }

      res.status(404).json({ success: false, message: 'Creative not found or unauthorized' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to delete creation', error: error?.message });
    }
  }
}
