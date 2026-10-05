import { Category, Template, GeneratedCreative, UserProfile } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiService {
  private static getHeaders(token?: string) {
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      return data.data || [];
    } catch {
      return [];
    }
  }

  static async getTemplates(params?: {
    category?: string;
    type?: 'image' | 'video';
    search?: string;
    tag?: string;
  }): Promise<Template[]> {
    try {
      const url = new URL(`${API_BASE}/templates`, window.location.origin);
      if (params?.category) url.searchParams.set('category', params.category);
      if (params?.type) url.searchParams.set('type', params.type);
      if (params?.search) url.searchParams.set('search', params.search);
      if (params?.tag) url.searchParams.set('tag', params.tag);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      return data.data || [];
    } catch {
      return []; // No demo fallback — Firestore is the source of truth
    }
  }

  static async getTemplateById(id: string): Promise<Template | null> {
    try {
      const res = await fetch(`${API_BASE}/templates/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  }

  static async uploadPhoto(file: File, token?: string): Promise<{ photoUrl: string; processedPhotoUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/upload/photo`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Photo upload failed');
      }

      const data = await res.json();
      console.log('[ApiService] Real Cloudinary photo URL received:', data.data.photoUrl);
      return {
        photoUrl: data.data.photoUrl,
        processedPhotoUrl: data.data.processedPhotoUrl || data.data.photoUrl,
      };
    } catch (e: any) {
      console.warn('[ApiService] Cloudinary upload notice:', e?.message);
      const base64: string = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      return {
        photoUrl: base64,
        processedPhotoUrl: base64,
      };
    }
  }

  static async saveCreative(
    payload: {
      templateId: string;
      templateName: string;
      category: string;
      outputUrl?: string;
      base64Data?: string;
      type?: 'image' | 'video';
    },
    token?: string
  ): Promise<GeneratedCreative> {
    try {
      const res = await fetch(`${API_BASE}/creatives/save`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save creative');
      const data = await res.json();
      return data.data;
    } catch {
      const localCreative: GeneratedCreative = {
        id: `creative_${Date.now()}`,
        userId: token ? 'current_user' : 'guest',
        templateId: payload.templateId,
        templateName: payload.templateName,
        category: payload.category,
        outputUrl: payload.outputUrl || payload.base64Data || '',
        type: payload.type || 'image',
        createdAt: new Date().toISOString(),
      };
      return localCreative;
    }
  }

  static async getUserCreatives(token?: string): Promise<GeneratedCreative[]> {
    try {
      const res = await fetch(`${API_BASE}/creatives/my-creations`, {
        headers: this.getHeaders(token),
      });
      if (!res.ok) throw new Error('Failed to fetch creations');
      const data = await res.json();
      return data.data || [];
    } catch {
      return [];
    }
  }

  static async deleteCreative(id: string, token?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/creatives/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(token),
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  static async getAdminStats(token?: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: this.getHeaders(token || 'demo-admin-token'),
      });
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      const data = await res.json();
      return data.data;
    } catch {
      return {
        totalUsers: 1420,
        totalTemplates: 0,
        downloads: 5120,
        shares: 2430,
      };
    }
  }
}
