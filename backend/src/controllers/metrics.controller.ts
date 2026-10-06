import { Request, Response } from 'express';
import { db, isFirebaseConfigured, admin } from '../config/firebase.js';
import { TemplateService } from '../services/template.service.js';
import { PresenceController } from './presence.controller.js';

export interface DownloadLogEntry {
  id: string;
  templateId?: string;
  templateName?: string;
  category?: string;
  type?: 'image' | 'video';
  format?: 'story' | 'post';
  userName?: string;
  userEmail?: string;
  userPhotoUrl?: string;
  userId?: string;
  downloadedAt: string;
}

let inMemoryDownloadsCount = 0;
let inMemorySharesCount = 0;
let inMemoryDownloadLogs: DownloadLogEntry[] = [];

export class MetricsController {
  // Track download in real-time
  static async trackDownload(req: Request, res: Response): Promise<void> {
    try {
      const {
        templateId,
        templateName,
        category,
        type = 'image',
        format = 'story',
        userName = 'Guest Creator',
        userEmail = '',
        userPhotoUrl = '',
        userId = 'guest',
      } = req.body;

      const entry: DownloadLogEntry = {
        id: `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        templateId: templateId || 'custom',
        templateName: templateName || 'Craft AI Creative',
        category: category || 'General',
        type,
        format,
        userName,
        userEmail,
        userPhotoUrl,
        userId,
        downloadedAt: new Date().toISOString(),
      };

      inMemoryDownloadsCount += 1;
      inMemoryDownloadLogs.unshift(entry);
      if (inMemoryDownloadLogs.length > 100) {
        inMemoryDownloadLogs.pop();
      }

      // Sync with Firestore if configured
      if (isFirebaseConfigured && db) {
        try {
          const metricsRef = db.collection('platform_stats').doc('metrics');
          await metricsRef.set(
            {
              totalDownloads: admin.firestore.FieldValue.increment(1),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          await db.collection('downloads').doc(entry.id).set(entry);

          if (templateId && templateId !== 'custom') {
            await db.collection('templates').doc(templateId).set(
              {
                downloadsCount: admin.firestore.FieldValue.increment(1),
              },
              { merge: true }
            );
          }
        } catch (dbErr) {
          console.warn('[Metrics] Firestore write note:', dbErr);
        }
      }

      console.log(`[Metrics] Real-time download recorded: ${entry.templateName} (Total: ${inMemoryDownloadsCount})`);

      res.status(200).json({
        success: true,
        message: 'Download tracked successfully',
        data: {
          totalDownloads: inMemoryDownloadsCount,
          recentDownload: entry,
        },
      });
    } catch (error: any) {
      console.error('[Metrics] Track download error:', error);
      res.status(500).json({ success: false, message: 'Failed to track download', error: error?.message });
    }
  }

  // Get global real-time metrics
  static async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      let totalUsers = 0;
      let totalTemplates = (await TemplateService.getTemplates()).length;
      let totalDownloads = inMemoryDownloadsCount;
      let totalShares = inMemorySharesCount;

      if (isFirebaseConfigured && db) {
        try {
          const usersSnap = await db.collection('users').get();
          totalUsers = usersSnap.docs.filter((d) => !d.id.startsWith('usr_')).length;

          const tmplsSnap = await db.collection('templates').get();
          if (tmplsSnap.size > 0) totalTemplates = tmplsSnap.size;

          const metricsDoc = await db.collection('platform_stats').doc('metrics').get();
          if (metricsDoc.exists) {
            const data = metricsDoc.data();
            if (typeof data?.totalDownloads === 'number') {
              totalDownloads = Math.max(totalDownloads, data.totalDownloads);
            }
            if (typeof data?.totalShares === 'number') {
              totalShares = Math.max(totalShares, data.totalShares);
            }
          }

          const downloadsSnap = await db.collection('downloads').get();
          if (downloadsSnap.size > totalDownloads) {
            totalDownloads = downloadsSnap.size;
          }
        } catch (e) {
          // fallback
        }
      }

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalTemplates,
          totalDownloads,
          totalShares,
          activeNow: PresenceController.getLiveCount(),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch metrics', error: error?.message });
    }
  }

  // Get recent downloads stream
  static async getDownloads(req: Request, res: Response): Promise<void> {
    try {
      if (isFirebaseConfigured && db) {
        try {
          const snapshot = await db
            .collection('downloads')
            .orderBy('downloadedAt', 'desc')
            .limit(50)
            .get();

          const downloads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          res.status(200).json({ success: true, data: downloads });
          return;
        } catch (e) {}
      }

      res.status(200).json({ success: true, data: inMemoryDownloadLogs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to get downloads', error: error?.message });
    }
  }

  // Track social share
  static async trackShare(req: Request, res: Response): Promise<void> {
    try {
      inMemorySharesCount += 1;
      if (isFirebaseConfigured && db) {
        try {
          await db.collection('platform_stats').doc('metrics').set(
            {
              totalShares: admin.firestore.FieldValue.increment(1),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch {}
      }
      res.status(200).json({ success: true, totalShares: inMemorySharesCount });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  }

  // Reset downloads count (for testing/clean slate)
  static async resetDownloads(req: Request, res: Response): Promise<void> {
    try {
      inMemoryDownloadsCount = 0;
      inMemoryDownloadLogs = [];

      if (isFirebaseConfigured && db) {
        try {
          await db.collection('platform_stats').doc('metrics').set(
            {
              totalDownloads: 0,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          const snap = await db.collection('downloads').get();
          const batch = db.batch();
          snap.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
        } catch {}
      }

      res.status(200).json({ success: true, message: 'Downloads reset to 0' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  }
}
