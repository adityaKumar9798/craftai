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

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const categoryData = req.body;
      if (!categoryData.name) {
        res.status(400).json({ success: false, message: 'Category name is required' });
        return;
      }
      const newCategory = await TemplateService.createCategory(categoryData);
      res.status(201).json({ success: true, data: newCategory });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to create category', error: error?.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const updates = req.body;
      const updated = await TemplateService.updateCategory(id, updates);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to update category', error: error?.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const deleted = await TemplateService.deleteCategory(id);
      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to delete category', error: error?.message });
    }
  }
}

