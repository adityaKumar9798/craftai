import { Request, Response } from 'express';
import { TemplateService } from '../services/template.service.js';

export class CategoryController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categories = await TemplateService.getCategories();
      res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to retrieve categories', error: error?.message });
    }
  }
}
