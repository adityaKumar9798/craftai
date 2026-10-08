import { Request, Response, NextFunction } from 'express';
import { auth, isFirebaseConfigured } from '../config/firebase.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    role?: 'user' | 'admin';
    [key: string]: any;
  };
}

export const verifyAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;

  try {
    if (token && isFirebaseConfigured && auth) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
          ...decodedToken,
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          role: decodedToken.admin || decodedToken.email?.includes('admin') ? 'admin' : 'user',
        };
        next();
        return;
      } catch (tokenErr) {
        console.warn('[Auth Middleware] Admin verify failed, falling back to payload decode:', tokenErr);
      }
    }

    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          req.user = {
            uid: payload.user_id || payload.sub || 'user_client',
            email: payload.email || '',
            name: payload.name || payload.email?.split('@')[0] || 'Creator',
            role: payload.email?.includes('admin') ? 'admin' : 'user',
          };
          next();
          return;
        }
      } catch {}
    }

    if (token && token.startsWith('guest_token_')) {
      const gNum = token.replace('guest_token_', '');
      req.user = {
        uid: `guest_user_${gNum}`,
        email: `guest${gNum}@craftai.app`,
        name: `Guest User ${gNum}`,
        role: 'user',
      };
      next();
      return;
    }

    const xUserId = req.headers['x-user-id'] as string;
    if (xUserId) {
      req.user = {
        uid: xUserId,
        email: (req.headers['x-user-email'] as string) || '',
        name: (req.headers['x-user-name'] as string) || 'User',
        role: 'user',
      };
      next();
      return;
    }

    // Default fallback - generate unique temporary session id rather than shared creator_user
    req.user = {
      uid: `guest_anon_${Date.now()}`,
      role: 'user',
    };
    next();
  } catch (error: any) {
    req.user = { uid: `guest_anon_${Date.now()}`, role: 'user' };
    next();
  }
};
