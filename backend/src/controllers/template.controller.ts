import { Request, Response } from 'express';
import { TemplateService } from '../services/template.service.js';

export class TemplateController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { category, type, search, tag } = req.query;
      const templates = await TemplateService.getTemplates({
        category: category as string,
        type: type as any,
        search: search as string,
        tag: tag as string,
      });
      res.status(200).json({ success: true, count: templates.length, data: templates });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to retrieve templates', error: error?.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const template = await TemplateService.getTemplateById(id);
      if (!template) {
        res.status(404).json({ success: false, message: 'Template not found' });
        return;
      }
      res.status(200).json({ success: true, data: template });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to retrieve template', error: error?.message });
    }
  }
}
