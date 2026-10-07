import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { realtimeStore } from '../services/realtimeStore';
import {
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateFirebaseProfile,
  isFirebaseConfigured,
  browserPopupRedirectResolver,
} from '../firebase/firebase';
import { firebaseConfig } from '../firebase/firebase';

interface AuthContextType {
  user: UserProfile | null;
  userPhotoUrl: string;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name?: string) => Promise<{ email: string; name: string }>;
  resendVerificationEmail: (email: string, pass?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<UserProfile | null>;
  quickLogin: (role: 'admin' | 'user') => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPhoto: (photoUrl: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setRoleAsAdmin: (isAdmin: boolean) => Promise<void>;
  createGuestAccount: (firstName: string, lastName: string) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const withTimeout = <T,>(promise: Promise<T>, ms = 1200): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), ms)),
  ]);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('craft_ai_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.uid?.startsWith('usr_') && !parsed.uid?.includes('-')) {
        localStorage.removeItem('craft_ai_user');
        localStorage.removeItem('craft_ai_token');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [userPhotoUrl, setUserPhotoUrl] = useState<string>(() => {
    const saved = localStorage.getItem('craft_ai_photo');
    return saved || '';
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('craft_ai_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Sync with real-time Firebase Auth state
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      // Catch Google redirect login result if redirect flow was used
      getRedirectResult(auth)
        .then(async (result) => {
          if (result && result.user) {
            console.log('[Auth] Google Redirect result detected for:', result.user.email);
            const idToken = await result.user.getIdToken();
            setToken(idToken);
            localStorage.setItem('craft_ai_token', idToken);

            let profile: UserProfile = {
              uid: result.user.uid,
              name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
              email: result.user.email || '',
              photoUrl: result.user.photoURL || '',
              role: result.user.email?.toLowerCase().includes('admin') ? 'admin' : 'user',
              plan: result.user.email?.toLowerCase().includes('admin') ? 'Administrator' : 'Free User',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };

            if (db) {
              try {
                const userRef = doc(db, 'users', result.user.uid);
                const snapshot = await withTimeout(getDoc(userRef), 2000);
                if (snapshot.exists()) {
                  const data = snapshot.data();
                  profile = {
                    ...profile,
                    ...data,
                    uid: result.user.uid,
                    name: data.name || profile.name,
                    firstName: data.firstName || profile.firstName,
                    lastName: data.lastName || profile.lastName,
                    username: data.username || profile.username,
                    religion: data.religion || profile.religion,
                    privacyAccepted: data.privacyAccepted !== undefined ? data.privacyAccepted : profile.privacyAccepted,
                    onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : profile.onboardingCompleted,
                    photoUrl: data.photoUrl || profile.photoUrl,
                    role: data.role || profile.role,
                    plan: data.plan || profile.plan,
                    createdAt: data.createdAt || profile.createdAt,
                  };
                  withTimeout(setDoc(userRef, { lastLoginAt: new Date().toISOString() }, { merge: true }), 1500).catch(() => {});
                } else {
                  withTimeout(setDoc(userRef, profile, { merge: true }), 1500).catch(() => {});
                }
              } catch (fsErr) {
                console.warn('[Firestore Client] Redirect Notice:', fsErr);
              }
            }

            setUser(profile);
            if (profile.photoUrl) {
              setUserPhotoUrl(profile.photoUrl);
              localStorage.setItem('craft_ai_photo', profile.photoUrl);
            }
            localStorage.setItem('craft_ai_user', JSON.stringify(profile));
            realtimeStore.saveUser(profile).catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('[Auth] Redirect result notice:', err);
        });

      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            const idToken = await fbUser.getIdToken();
            setToken(idToken);
            localStorage.setItem('craft_ai_token', idToken);

            // Only use saved photo if it belongs to THIS user (prevents photo bleed between accounts)
            const savedUser = localStorage.getItem('craft_ai_user');
            const savedUid = savedUser ? JSON.parse(savedUser).uid : null;
            const savedPhoto = savedUid === fbUser.uid ? (localStorage.getItem('craft_ai_photo') || '') : '';

            let profile: UserProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              email: fbUser.email || '',
              photoUrl: savedPhoto || fbUser.photoURL || '',
              role: fbUser.email?.toLowerCase().includes('admin') ? 'admin' : 'user',
              plan: fbUser.email?.toLowerCase().includes('admin') ? 'Administrator' : 'Free User',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };

            // Safely fetch or update real user document in Firebase Firestore
            if (db) {
              try {
                const userRef = doc(db, 'users', fbUser.uid);
                const snapshot = await withTimeout(getDoc(userRef), 2000);

                if (snapshot.exists()) {
                  const data = snapshot.data();
                  profile = {
                    ...profile,
                    ...data,
                    uid: fbUser.uid,
                    name: data.name || profile.name,
                    firstName: data.firstName || profile.firstName,
                    lastName: data.lastName || profile.lastName,
                    username: data.username || profile.username,
                    religion: data.religion || profile.religion,
                    privacyAccepted: data.privacyAccepted !== undefined ? data.privacyAccepted : profile.privacyAccepted,
                    onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : profile.onboardingCompleted,
                    email: data.email || profile.email,
                    photoUrl: savedPhoto || data.photoUrl || profile.photoUrl,
                    role: data.role || profile.role,
                    plan: data.plan || profile.plan,
                    createdAt: data.createdAt || profile.createdAt,
                  };
                  withTimeout(setDoc(userRef, { lastLoginAt: new Date().toISOString() }, { merge: true }), 1500).catch(() => {});
                } else {
                  withTimeout(setDoc(userRef, profile, { merge: true }), 1500).catch(() => {});
                  console.log('[Firestore] Real user document created in database:', fbUser.uid);
                }
              } catch (fsErr) {
                console.warn('[Firestore Client] Permission notice (handled):', fsErr);
              }
            }

            // Sync with backend Firebase Admin SDK (which bypasses client security rules)
            try {
              fetch('/api/users/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
              }).catch(() => {});
            } catch {}

            setUser(profile);
            if (profile.photoUrl) {
              setUserPhotoUrl(profile.photoUrl);
              localStorage.setItem('craft_ai_photo', profile.photoUrl);
            }
            localStorage.setItem('craft_ai_user', JSON.stringify(profile));
            realtimeStore.saveUser(profile).catch(() => {});
          } catch (e) {
            console.warn('[Auth] Error setting up user:', e);
          }
        } else {
          // If logged out from Firebase, clear user state
          setUser(null);
          setUserPhotoUrl('');
          setToken(null);
          localStorage.removeItem('craft_ai_user');
          localStorage.removeItem('craft_ai_photo');
          localStorage.removeItem('craft_ai_token');
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  // Real Email & Password Sign Up
  const signup = async (emailOrUsername: string, pass: string, name?: string): Promise<{ email: string; name: string }> => {
    if (isFirebaseConfigured && auth) {
      const email = emailOrUsername.trim().includes('@')
        ? emailOrUsername.trim()
        : `${emailOrUsername.trim().toLowerCase()}@craftai.com`;

      // 1. Create User in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      // 2. Set user displayName if given
      if (name) {
        try {
          await updateFirebaseProfile(cred.user, { displayName: name });
        } catch {}
      }

      // 3. Keep user authenticated & setup initial profile
      const idToken = await cred.user.getIdToken();
      setToken(idToken);
      localStorage.setItem('craft_ai_token', idToken);

      let profile: UserProfile = {
        uid: cred.user.uid,
        name: name || cred.user.displayName || email.split('@')[0],
        email,
        photoUrl: '',
        role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
        plan: email.toLowerCase().includes('admin') ? 'Administrator' : 'Free User',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      if (db) {
        try {
          const userRef = doc(db, 'users', cred.user.uid);
          await withTimeout(setDoc(userRef, profile, { merge: true }), 1500).catch(() => {});
        } catch (fsErr) {
          console.warn('[Firestore Client] Notice:', fsErr);
        }
      }

      // Sync with backend
      try {
        fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        }).catch(() => {});
      } catch {}

      setUser(profile);
      localStorage.setItem('craft_ai_user', JSON.stringify(profile));
      realtimeStore.saveUser(profile).catch(() => {});

      return { email, name: profile.name };
    } else {
      throw new Error('Firebase configuration missing.');
    }
  };

  // Real Email & Password Login
  const login = async (emailOrUsername: string, pass: string) => {
    if (isFirebaseConfigured && auth) {
      const email = emailOrUsername.trim().includes('@')
        ? emailOrUsername.trim()
        : `${emailOrUsername.trim().toLowerCase()}@craftai.com`;

      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const idToken = await cred.user.getIdToken();
      setToken(idToken);
      localStorage.setItem('craft_ai_token', idToken);

      let profile: UserProfile = {
        uid: cred.user.uid,
        name: cred.user.displayName || email.split('@')[0],
        email,
        photoUrl: '',  // email/password users start with no photo until they upload one
        role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
        plan: email.toLowerCase().includes('admin') ? 'Administrator' : 'Free User',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Read or update real user data from Firestore collection "users" (with timeout)
      if (db) {
        try {
          const userRef = doc(db, 'users', cred.user.uid);
          const userSnap = await withTimeout(getDoc(userRef), 1200);
          if (userSnap.exists()) {
            const data = userSnap.data();
            profile = {
              ...profile,
              name: data.name || profile.name,
              // Only restore photo from Firestore if user explicitly uploaded one (not a Google URL bleed)
              photoUrl: (data.photoUrl && !data.photoUrl.includes('googleusercontent')) ? data.photoUrl : profile.photoUrl,
              role: data.role || profile.role,
              plan: data.plan || profile.plan,
              createdAt: data.createdAt || profile.createdAt,
            };
            withTimeout(setDoc(userRef, { lastLoginAt: new Date().toISOString() }, { merge: true }), 1200).catch(() => {});
          } else {
            withTimeout(setDoc(userRef, profile, { merge: true }), 1200).catch(() => {});
          }
        } catch (fsErr) {
          console.warn('[Firestore Client] Permission notice (handled):', fsErr);
        }
      }

      // Sync with backend asynchronously without blocking navigation
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      }).catch(() => {});

      setUser(profile);
      if (profile.photoUrl) {
        setUserPhotoUrl(profile.photoUrl);
        localStorage.setItem('craft_ai_photo', profile.photoUrl);
      }
      localStorage.setItem('craft_ai_user', JSON.stringify(profile));
      realtimeStore.saveUser(profile).catch(() => {});
    } else {
      throw new Error('Firebase is not configured.');
    }
  };

  // Resend Verification Email
  const resendVerificationEmail = async (emailOrUsername: string, pass?: string): Promise<boolean> => {
    if (isFirebaseConfigured && auth) {
      const email = emailOrUsername.trim().includes('@')
        ? emailOrUsername.trim()
        : `${emailOrUsername.trim().toLowerCase()}@craftai.com`;

      try {
        if (pass) {
          const cred = await signInWithEmailAndPassword(auth, email, pass);
          await sendEmailVerification(cred.user, {
            url: `${window.location.origin}/login?verified=true&email=${encodeURIComponent(email)}`,
            handleCodeInApp: false,
          });
          await signOut(auth);
          return true;
        } else {
          // If password is not provided, we can send a password reset / account check
          await sendPasswordResetEmail(auth, email);
          return true;
        }
      } catch (err) {
        console.warn('[Auth] Resend verification error:', err);
        return false;
      }
    }
    return false;
  };

  // Real Google OAuth Login with Firebase & Firestore database
  const loginWithGoogle = async (): Promise<UserProfile | null> => {
    if (isFirebaseConfigured && auth) {
      console.log('[Auth] Initiating Google sign-in...');
      let res: any = null;

      // On mobile / small screens (like Android/iPhone emulators or phones), use redirect directly to avoid popup double-trigger
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

      if (isMobile) {
        console.log('[Auth] Using redirect flow for mobile');
        await signInWithRedirect(auth, googleProvider);
        return null;
      }

      // On Desktop: use standard popup
      try {
        console.log('[Auth] Using popup flow for desktop');
        console.log('[Auth] Firebase config:', {
          authDomain: firebaseConfig.authDomain,
          projectId: firebaseConfig.projectId,
        });
        console.log('[Auth] Starting signInWithPopup...');
        res = await signInWithPopup(auth, googleProvider);
        console.log('[Auth] Popup sign-in successful:', res?.user?.email);
        console.log('[Auth] User UID:', res?.user?.uid);
        console.log('[Auth] User exists in auth:', !!res?.user);
      } catch (popupErr: any) {
        console.error('[Auth] Popup error:', popupErr.code, popupErr.message);
        console.error('[Auth] Full error details:', popupErr);
        if (popupErr.code === 'auth/popup-closed-by-user') {
          // User closed popup window, do not trigger a second redirect
          console.log('[Auth] User closed popup');
          return null;
        }
        if (popupErr.code === 'auth/popup-blocked') {
          // Only redirect if popup is strictly blocked by browser
          console.log('[Auth] Popup blocked, using redirect');
          await signInWithRedirect(auth, googleProvider);
          return null;
        }
        if (popupErr.code === 'auth/internal-error') {
          console.error('[Auth] Internal error - likely Firebase config issue');
          console.error('[Auth] Check authDomain in Firebase console matches:', firebaseConfig.authDomain);
        }
        throw popupErr;
      }

      if (!res?.user) return null;

      const idToken = await res.user.getIdToken();
      setToken(idToken);
      localStorage.setItem('craft_ai_token', idToken);

      const cleanName = res.user.displayName || res.user.email?.split('@')[0] || 'User';

      let profile: UserProfile = {
        uid: res.user.uid,
        name: cleanName,
        email: res.user.email || '',
        photoUrl: res.user.photoURL || '',
        role: res.user.email?.toLowerCase().includes('admin') ? 'admin' : 'user',
        plan: res.user.email?.toLowerCase().includes('admin') ? 'Administrator' : 'Free User',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Check Firestore to see if user has already chosen username/religion
      if (db) {
        try {
          console.log('[Auth] Checking Firestore for existing user:', res.user.uid);
          const userRef = doc(db, 'users', res.user.uid);
          const snap = await withTimeout(getDoc(userRef), 2000);
          if (snap.exists()) {
            console.log('[Auth] User exists in Firestore, updating lastLoginAt');
            const data = snap.data();
            profile = {
              ...profile,
              ...data,
              uid: res.user.uid,
              name: data.name || profile.name,
              firstName: data.firstName || profile.firstName,
              lastName: data.lastName || profile.lastName,
              username: data.username || profile.username,
              religion: data.religion || profile.religion,
              privacyAccepted: data.privacyAccepted !== undefined ? data.privacyAccepted : profile.privacyAccepted,
              onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : profile.onboardingCompleted,
              photoUrl: data.photoUrl || profile.photoUrl,
              role: data.role || profile.role,
              plan: data.plan || profile.plan,
            };
            withTimeout(setDoc(userRef, { lastLoginAt: new Date().toISOString() }, { merge: true }), 1500).catch(() => {});
          } else {
            // Save newly created Google user profile in Firestore
            console.log('[Auth] New user, saving to Firestore:', profile);
            await withTimeout(setDoc(userRef, profile, { merge: true }), 1500).catch(() => {});
            console.log('[Auth] User saved to Firestore successfully');
          }
        } catch (fsErr) {
          console.error('[Firestore] Error saving user:', fsErr);
        }
      } else {
        console.warn('[Auth] Firestore db is not available');
      }

      // Set user immediately in state and storage
      setUser(profile);
      if (profile.photoUrl) {
        setUserPhotoUrl(profile.photoUrl);
        localStorage.setItem('craft_ai_photo', profile.photoUrl);
      }
      localStorage.setItem('craft_ai_user', JSON.stringify(profile));

      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      }).catch(() => {});
      realtimeStore.saveUser(profile).catch(() => {});

      return profile;
    } else {
      throw new Error('Firebase Auth not available.');
    }
  };

  // Quick Login (disabled from writing fake accounts to database)
  const quickLogin = async (role: 'admin' | 'user') => {
    if (isFirebaseConfigured && auth) {
      throw new Error('Please log in using your real Firebase credentials or Google Sign-In.');
    }
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    }
  };

  // Create Guest Account without Firebase Auth
  const createGuestAccount = async (firstName: string, lastName: string): Promise<UserProfile> => {
    const username = `user${Date.now()}`;
    const guestUid = `guest_${username}`;

    const profile: UserProfile = {
      uid: guestUid,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      username,
      email: '',
      photoUrl: '',
      role: 'user',
      plan: 'Free User',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      onboardingCompleted: true,
    };

    setUser(profile);
    localStorage.setItem('craft_ai_user', JSON.stringify(profile));
    localStorage.setItem('craft_ai_token', 'guest_token');

    // Sync with backend
    try {
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      }).catch(() => {});
    } catch {}

    return profile;
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {}
    }
    setUser(null);
    setToken(null);
    setUserPhotoUrl('');
    localStorage.removeItem('craft_ai_user');
    localStorage.removeItem('craft_ai_token');
    localStorage.removeItem('craft_ai_photo');  // clear photo on logout
  };

  const updateUserPhoto = async (newPhotoUrl: string) => {
    setUserPhotoUrl(newPhotoUrl);
    localStorage.setItem('craft_ai_photo', newPhotoUrl);

    if (auth?.currentUser) {
      try {
        await updateFirebaseProfile(auth.currentUser, { photoURL: newPhotoUrl });
      } catch (err) {
        console.warn('[Firebase Auth] updateProfile notice:', err);
      }
    }

    if (user) {
      const updated = { ...user, photoUrl: newPhotoUrl };
      setUser(updated);
      localStorage.setItem('craft_ai_user', JSON.stringify(updated));

      try {
        await fetch('/api/users/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ photoUrl: newPhotoUrl }),
        });
      } catch {}

      if (db && user.uid) {
        try {
          await setDoc(doc(db, 'users', user.uid), { photoUrl: newPhotoUrl }, { merge: true });
        } catch (e) {}
      }
      try {
        await realtimeStore.saveUser(updated);
      } catch {}
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem('craft_ai_user', JSON.stringify(updated));

      if (db && user.uid) {
        try {
          await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
        } catch (e) {}
      }
      await realtimeStore.saveUser(updated);
    }
  };

  const setRoleAsAdmin = async (isAdminVal: boolean) => {
    if (user) {
      const updated = {
        ...user,
        role: (isAdminVal ? 'admin' : 'user') as 'user' | 'admin',
        plan: isAdminVal ? 'Administrator' : 'Free User',
      };
      setUser(updated);
      localStorage.setItem('craft_ai_user', JSON.stringify(updated));

      if (db && user.uid) {
        try {
          await setDoc(doc(db, 'users', user.uid), { role: updated.role, plan: updated.plan }, { merge: true });
        } catch (e) {}
      }
      await realtimeStore.saveUser(updated);
    }
  };

  const isAuthenticated = Boolean(user || token || localStorage.getItem('craft_ai_user') || localStorage.getItem('craft_ai_token'));
  const isAdmin = Boolean(user?.role === 'admin' || (typeof localStorage !== 'undefined' && localStorage.getItem('craft_ai_user')?.includes('"role":"admin"')));

  return (
    <AuthContext.Provider
      value={{
        user,
        userPhotoUrl,
        token,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        signup,
        resendVerificationEmail,
        loginWithGoogle,
        quickLogin,
        resetPassword,
        logout,
        updateUserPhoto,
        updateUserProfile,
        setRoleAsAdmin,
        createGuestAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
