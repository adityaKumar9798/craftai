import { Request, Response } from 'express';
import { db, isFirebaseConfigured } from '../config/firebase.js';

const COLLECTION = 'trending_topics';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'carft-ai';
const API_KEY = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyAa91hu_Mmp4nNAeOqwdTizhYB-6zJEd5A';

// Firestore REST API base (works with Web API Key + user ID token for write, or open rules for read)
const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

interface FirestoreFieldValue {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  timestampValue?: string;
  doubleValue?: number;
}

interface FirestoreDoc {
  name?: string;
  fields?: Record<string, FirestoreFieldValue>;
}

function firestoreDocToObject(doc: FirestoreDoc): Record<string, any> {
  if (!doc.fields) return {};
  const obj: Record<string, any> = {};
  for (const [key, val] of Object.entries(doc.fields)) {
    if (val.stringValue !== undefined) obj[key] = val.stringValue;
    else if (val.integerValue !== undefined) obj[key] = parseInt(val.integerValue, 10);
    else if (val.doubleValue !== undefined) obj[key] = val.doubleValue;
    else if (val.booleanValue !== undefined) obj[key] = val.booleanValue;
    else if (val.timestampValue !== undefined) obj[key] = val.timestampValue;
  }
  // Extract doc ID from name: projects/.../databases/.../documents/collection/docId
  if (doc.name) {
    obj.id = doc.name.split('/').pop() || '';
  }
  return obj;
}

function objectToFirestoreDoc(obj: Record<string, any>): { fields: Record<string, any> } {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'id') continue; // skip id field
    if (typeof val === 'string') fields[key] = { stringValue: val };
    else if (typeof val === 'number' && Number.isInteger(val)) fields[key] = { integerValue: String(val) };
    else if (typeof val === 'number') fields[key] = { doubleValue: val };
    else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
  }
  return { fields };
}

export class TrendingController {
  // GET /api/trending — public, no auth required
  static async getAll(_req: Request, res: Response): Promise<void> {
    // Try Firebase Admin SDK first (fastest)
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await db.collection(COLLECTION).orderBy('order', 'asc').get();
        const topics = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.status(200).json({ success: true, data: topics });
        return;
      } catch (error: any) {
        console.warn('[TrendingController] Admin SDK error, trying REST API:', error?.message);
      }
    }

    // Fallback: Firestore REST API with API key (works if Firestore rules allow public reads)
    try {
      const url = `${FIRESTORE_REST_BASE}/${COLLECTION}?key=${API_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json() as { documents?: FirestoreDoc[] };
        const docs = data.documents || [];
        const topics = docs.map(firestoreDocToObject).sort((a, b) => (a.order || 0) - (b.order || 0));
        res.status(200).json({ success: true, data: topics });
        return;
      } else {
        const errText = await response.text();
        console.warn('[TrendingController] REST API error:', response.status, errText);
      }
    } catch (error: any) {
      console.warn('[TrendingController] REST API fetch failed:', error?.message);
    }

    // Both failed — return empty array so home page doesn't break
    res.status(200).json({ success: true, data: [] });
  }

  // POST /api/trending — admin only
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, slug, icon, order, isPublished } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Topic name is required' });
        return;
      }
      const id = `top_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const topicData = {
        id,
        name: String(name),
        slug: String(slug || name.toLowerCase().replace(/\s+/g, '-')),
        icon: String(icon || '🔥'),
        order: Number(order ?? 1),
        isPublished: isPublished !== false,
        createdAt: new Date().toISOString(),
      };

      if (isFirebaseConfigured && db) {
        await db.collection(COLLECTION).doc(id).set(topicData);
        console.log('[TrendingController] Created topic (Admin SDK):', id, name);
        res.status(201).json({ success: true, data: topicData });
        return;
      }

      // REST API fallback — forward user's Firebase ID token for auth
      const authHeader = req.headers.authorization as string;
      const url = `${FIRESTORE_REST_BASE}/${COLLECTION}/${id}?key=${API_KEY}`;
      const firestoreBody = objectToFirestoreDoc(topicData);
      const restRes = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(firestoreBody),
      });
      if (restRes.ok) {
        console.log('[TrendingController] Created topic (REST API):', id, name);
        res.status(201).json({ success: true, data: topicData });
      } else {
        const errText = await restRes.text();
        console.warn('[TrendingController] REST create error:', restRes.status, errText);
        res.status(restRes.status).json({ success: false, message: 'Failed to create topic', error: errText });
      }
    } catch (error: any) {
      console.error('[TrendingController] create error:', error?.message);
      res.status(500).json({ success: false, message: 'Failed to create trending topic', error: error?.message });
    }
  }

  // PATCH /api/trending/:id — admin only
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const updates = req.body;

      if (isFirebaseConfigured && db) {
        await db.collection(COLLECTION).doc(id).update({ ...updates, updatedAt: new Date().toISOString() });
        console.log('[TrendingController] Updated topic (Admin SDK):', id);
        res.status(200).json({ success: true, message: 'Topic updated' });
        return;
      }

      const authHeader = req.headers.authorization as string;
      const url = `${FIRESTORE_REST_BASE}/${COLLECTION}/${id}?key=${API_KEY}`;
      const firestoreBody = objectToFirestoreDoc({ ...updates, updatedAt: new Date().toISOString() });
      const restRes = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(firestoreBody),
      });
      if (restRes.ok) {
        res.status(200).json({ success: true, message: 'Topic updated' });
      } else {
        const errText = await restRes.text();
        res.status(restRes.status).json({ success: false, message: 'Failed to update topic', error: errText });
      }
    } catch (error: any) {
      console.error('[TrendingController] update error:', error?.message);
      res.status(500).json({ success: false, message: 'Failed to update trending topic', error: error?.message });
    }
  }

  // DELETE /api/trending/:id — admin only
  static async remove(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);

      if (isFirebaseConfigured && db) {
        await db.collection(COLLECTION).doc(id).delete();
        console.log('[TrendingController] Deleted topic (Admin SDK):', id);
        res.status(200).json({ success: true, message: 'Topic deleted' });
        return;
      }

      const authHeader = req.headers.authorization as string;
      const url = `${FIRESTORE_REST_BASE}/${COLLECTION}/${id}?key=${API_KEY}`;
      const restRes = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      });
      if (restRes.ok || restRes.status === 404) {
        console.log('[TrendingController] Deleted topic (REST API):', id);
        res.status(200).json({ success: true, message: 'Topic deleted' });
      } else {
        const errText = await restRes.text();
        res.status(restRes.status).json({ success: false, message: 'Failed to delete topic', error: errText });
      }
    } catch (error: any) {
      console.error('[TrendingController] remove error:', error?.message);
      res.status(500).json({ success: false, message: 'Failed to delete trending topic', error: error?.message });
    }
  }
}
