import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { db, isFirebaseConfigured } from '../config/firebase.js';

export const verifyAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || !req.user.uid) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Authentication required',
    });
    return;
  }

  try {
    // Check if role is admin on the decoded token
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Check firestore adminUsers collection if firebase is configured
    if (isFirebaseConfigured && db) {
      const adminDoc = await db.collection('adminUsers').doc(req.user.uid).get();
      if (adminDoc.exists) {
        next();
        return;
      }
    }

    res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify admin status',
      error: error?.message,
    });
  }
};
