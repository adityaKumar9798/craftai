import { db, isFirebaseConfigured } from '../config/firebase.js';
import { Template, Category } from '../types/index.js';

// NO hardcoded demo data — Firebase Firestore is the single source of truth.
// All templates and categories are managed via the Admin Dashboard.

export class TemplateService {
  static async getCategories(): Promise<Category[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await db.collection('categories').orderBy('order', 'asc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      } catch (e: any) {
        console.warn('[TemplateService] getCategories error:', e?.message);
      }
    }
    return [];
  }

  static async getTemplates(filters?: {
    category?: string;
    type?: 'image' | 'video';
    search?: string;
    tag?: string;
  }): Promise<Template[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await db.collection('templates').get();
        let result: Template[] = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Template));

        if (filters?.category && filters.category !== 'all') {
          result = result.filter(t => t.category?.toLowerCase() === filters.category!.toLowerCase());
        }
        if (filters?.type) {
          result = result.filter(t => t.type === filters.type);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          result = result.filter(t => t.name?.toLowerCase().includes(q) || t.tags?.some((tag: string) => tag.toLowerCase().includes(q)));
        }
        if (filters?.tag && filters.tag !== 'All') {
          result = result.filter(t => t.tags?.some((tag: string) => tag.toLowerCase() === filters.tag!.toLowerCase()));
        }

        return result;
      } catch (e: any) {
        console.warn('[TemplateService] getTemplates error:', e?.message);
      }
    }
    return [];
  }

  static async getTemplateById(id: string): Promise<Template | null> {
    if (isFirebaseConfigured && db) {
      try {
        const doc = await db.collection('templates').doc(id).get();
        if (doc.exists) {
          return { id: doc.id, ...(doc.data() as any) };
        }
      } catch (e: any) {
        console.warn('[TemplateService] getTemplateById error:', e?.message);
      }
    }
    return null;
  }

  static async createTemplate(templateData: Omit<Template, 'id' | 'createdAt'>): Promise<Template> {
    const newTemplate: Template = {
      ...templateData,
      id: `tmpl_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await db.collection('templates').doc(newTemplate.id).set(newTemplate);
    }

    return newTemplate;
  }

  static async updateTemplate(id: string, updates: Partial<Template>): Promise<Template | null> {
    if (isFirebaseConfigured && db) {
      await db.collection('templates').doc(id).update(updates);
      const doc = await db.collection('templates').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...(doc.data() as any) };
      }
    }
    return null;
  }

  static async deleteTemplate(id: string): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      await db.collection('templates').doc(id).delete();
      return true;
    }
    return false;
  }
}
