import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { TemplateService } from '../services/template.service.js';
import { db, isFirebaseConfigured } from '../config/firebase.js';

export class AdminController {
  static async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const templates = await TemplateService.getTemplates();
      let totalUsers = 0;
      let downloads = 0;
      let shares = 0;

      if (isFirebaseConfigured && db) {
        try {
          const usersSnap = await db.collection('users').get();
          totalUsers = usersSnap.size;
          const creativesSnap = await db.collection('generatedCreatives').get();
          downloads = creativesSnap.size;
        } catch (e) {
          // fallback to 0
        }
      }

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalTemplates: templates.length,
          downloads,
          shares,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch admin stats', error: error?.message });
    }
  }

  static async createTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const templateData = req.body;
      const created = await TemplateService.createTemplate(templateData);
      res.status(201).json({ success: true, message: 'Template created successfully', data: created });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to create template', error: error?.message });
    }
  }

  static async updateTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const updates = req.body;
      const updated = await TemplateService.updateTemplate(id, updates);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Template not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Template updated successfully', data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to update template', error: error?.message });
    }
  }

  static async deleteTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const deleted = await TemplateService.deleteTemplate(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Template not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Template deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to delete template', error: error?.message });
    }
  }
}
