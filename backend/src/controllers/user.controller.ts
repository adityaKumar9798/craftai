import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { db, isFirebaseConfigured } from '../config/firebase.js';

let inMemoryFavorites: { id: string; userId: string; templateId: string }[] = [];

export class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (isFirebaseConfigured && db) {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          res.status(200).json({ success: true, data: { uid, ...userDoc.data() } });
          return;
        }
      }

      // Authenticated profile
      res.status(200).json({
        success: true,
        data: {
          uid,
          name: req.user?.name || req.user?.email?.split('@')[0] || 'Creator',
          email: req.user?.email || '',
          photoUrl: req.user?.photoUrl || '',
          role: req.user?.role || 'user',
          plan: 'Free User',
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to get profile', error: error?.message });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const updates = req.body;

      if (isFirebaseConfigured && db) {
        await db.collection('users').doc(uid).set(updates, { merge: true });
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { uid, ...updates },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to update profile', error: error?.message });
    }
  }

  static async toggleFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      const { templateId } = req.body;

      if (!userId || !templateId) {
        res.status(400).json({ success: false, message: 'User ID and templateId required' });
        return;
      }

      if (isFirebaseConfigured && db) {
        const query = await db
          .collection('favorites')
          .where('userId', '==', userId)
          .where('templateId', '==', templateId)
          .get();

        if (!query.empty) {
          await query.docs[0].ref.delete();
          res.status(200).json({ success: true, isFavorite: false });
          return;
        } else {
          await db.collection('favorites').add({
            userId,
            templateId,
            createdAt: new Date().toISOString(),
          });
          res.status(200).json({ success: true, isFavorite: true });
          return;
        }
      }

      const index = inMemoryFavorites.findIndex(f => f.userId === userId && f.templateId === templateId);
      if (index !== -1) {
        inMemoryFavorites.splice(index, 1);
        res.status(200).json({ success: true, isFavorite: false });
      } else {
        inMemoryFavorites.push({ id: `fav_${Date.now()}`, userId, templateId });
        res.status(200).json({ success: true, isFavorite: true });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to toggle favorite', error: error?.message });
    }
  }

  static async getFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (isFirebaseConfigured && db) {
        const query = await db.collection('favorites').where('userId', '==', userId).get();
        const favs = query.docs.map(doc => doc.data().templateId);
        res.status(200).json({ success: true, data: favs });
        return;
      }

      const favs = inMemoryFavorites.filter(f => f.userId === userId).map(f => f.templateId);
      res.status(200).json({ success: true, data: favs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to get favorites', error: error?.message });
    }
  }

  static async syncUser(req: any, res: Response): Promise<void> {
    try {
      const { uid, name, firstName, lastName, username, religion, guestNumber, guestTitle, email, photoUrl, role, plan, createdAt } = req.body;
      if (!uid) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
      }

      if (isFirebaseConfigured && db) {
        const userRef = db.collection('users').doc(uid);
        const existingDoc = await userRef.get();
        const existingData = existingDoc.exists ? existingDoc.data() : {};

        const updatedData = {
          uid,
          name: name || existingData?.name || email?.split('@')[0] || 'Creator',
          firstName: firstName || existingData?.firstName || '',
          lastName: lastName || existingData?.lastName || '',
          username: username || existingData?.username || '',
          religion: religion || existingData?.religion || 'hindu',
          guestNumber: guestNumber || existingData?.guestNumber || null,
          guestTitle: guestTitle || existingData?.guestTitle || '',
          email: email || existingData?.email || '',
          photoUrl: photoUrl || existingData?.photoUrl || '',
          role: existingData?.role || role || (email?.toLowerCase().includes('admin') ? 'admin' : 'user'),
          plan: existingData?.plan || plan || (role === 'admin' ? 'Administrator' : 'Free User'),
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdAt: existingData?.createdAt || createdAt || new Date().toISOString(),
        };

        await userRef.set(updatedData, { merge: true });
        console.log('[Firebase Admin] Real user synced to Firestore database:', uid);
        res.status(200).json({ success: true, data: updatedData });
        return;
      }

      res.status(200).json({ success: true, message: 'Synced locally' });
    } catch (error: any) {
      console.warn('[Firebase Admin] Sync error:', error?.message);
      res.status(500).json({ success: false, message: 'Failed to sync user', error: error?.message });
    }
  }

  static async listUsers(req: any, res: Response): Promise<void> {
    try {
      if (isFirebaseConfigured && db) {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs
          .map(doc => ({ uid: doc.id, ...doc.data() }))
          .filter((u: any) => !u.uid?.startsWith('usr_'));
        res.status(200).json({ success: true, data: users });
        return;
      }
      res.status(200).json({ success: true, data: [] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to list users', error: error?.message });
    }
  }

  static async toggleRole(req: any, res: Response): Promise<void> {
    try {
      const { uid, role, plan } = req.body;
      if (!uid) {
        res.status(400).json({ success: false, message: 'UID required' });
        return;
      }
      if (isFirebaseConfigured && db) {
        await db.collection('users').doc(uid).set({ role, plan }, { merge: true });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to update role', error: error?.message });
    }
  }

  static async deleteUser(req: any, res: Response): Promise<void> {
    try {
      const { uid } = req.params;
      if (!uid) {
        res.status(400).json({ success: false, message: 'UID required' });
        return;
      }
      if (isFirebaseConfigured && db) {
        await db.collection('users').doc(uid).delete();
      }
      res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to delete user', error: error?.message });
    }
  }

  static async clearAllUsers(req: any, res: Response): Promise<void> {
    try {
      if (isFirebaseConfigured && db) {
        const snapshot = await db.collection('users').get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        res.status(200).json({ success: true, message: `Removed ${snapshot.size} users, starting clean` });
        return;
      }
      res.status(200).json({ success: true, message: 'Clean state reset' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to clear users', error: error?.message });
    }
  }

  static async cleanupMockUsers(req: any, res: Response): Promise<void> {
    try {
      if (isFirebaseConfigured && db) {
        const snapshot = await db.collection('users').get();
        let deletedCount = 0;
        for (const doc of snapshot.docs) {
          const id = doc.id;
          const data = doc.data();
          if (id.startsWith('usr_') || data.email === 'aditya@gmail.com' || data.email === 'admin@craftai.com') {
            await doc.ref.delete();
            deletedCount++;
          }
        }
        res.status(200).json({ success: true, message: `Purged ${deletedCount} fake user documents from database` });
        return;
      }
      res.status(200).json({ success: true, message: 'Database not configured' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  }
}

