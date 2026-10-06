import { Request, Response } from 'express';
import { db, isFirebaseConfigured } from '../config/firebase.js';

interface SessionData {
  lastSeen: number;
  path?: string;
  userId?: string;
  userName?: string;
}

// In-memory real-time sessions tracker
const activeSessions = new Map<string, SessionData>();

// Purge sessions older than 15 seconds (heartbeat is sent every 5-8 seconds)
const cleanStaleSessions = () => {
  const cutoff = Date.now() - 15000;
  for (const [sessionId, data] of activeSessions.entries()) {
    if (data.lastSeen < cutoff) {
      activeSessions.delete(sessionId);
    }
  }
};

// Periodic auto-cleanup every 5 seconds
setInterval(cleanStaleSessions, 5000);

export class PresenceController {
  // Direct helper to get exact active sessions count
  static getLiveCount(): number {
    cleanStaleSessions();
    return activeSessions.size;
  }

  // Client heartbeat
  static async heartbeat(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, path, userId, userName } = req.body || {};
      if (!sessionId) {
        res.status(400).json({ success: false, message: 'Session ID required' });
        return;
      }

      const now = Date.now();
      activeSessions.set(sessionId, {
        lastSeen: now,
        path: path || '/',
        userId: userId || 'guest',
        userName: userName || 'Visitor',
      });

      cleanStaleSessions();
      const currentActiveCount = activeSessions.size;

      // Sync with Firestore active_sessions if configured
      if (isFirebaseConfigured && db) {
        try {
          await db.collection('active_sessions').doc(sessionId).set({
            sessionId,
            path: path || '/',
            userId: userId || 'guest',
            userName: userName || 'Visitor',
            lastSeen: now,
          });
        } catch (dbErr) {}
      }

      res.status(200).json({
        success: true,
        activeCount: currentActiveCount,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Heartbeat error', error: error?.message });
    }
  }

  // Client leaves page / closes tab
  static async leave(req: Request, res: Response): Promise<void> {
    try {
      let sessionId = req.body?.sessionId || req.query?.sessionId;
      if (!sessionId && typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          sessionId = parsed.sessionId;
        } catch {}
      }

      if (sessionId && typeof sessionId === 'string') {
        activeSessions.delete(sessionId);

        if (isFirebaseConfigured && db) {
          try {
            await db.collection('active_sessions').doc(sessionId).delete();
          } catch {}
        }
      }

      cleanStaleSessions();
      res.status(200).json({ success: true, activeCount: activeSessions.size });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  }

  // Get current active users count
  static async getActiveCount(req: Request, res: Response): Promise<void> {
    try {
      cleanStaleSessions();
      let count = activeSessions.size;

      if (isFirebaseConfigured && db) {
        try {
          const cutoff = Date.now() - 15000;
          const snap = await db.collection('active_sessions').where('lastSeen', '>=', cutoff).get();
          count = Math.max(count, snap.size);
        } catch {}
      }

      res.status(200).json({
        success: true,
        activeCount: count,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  }
}

