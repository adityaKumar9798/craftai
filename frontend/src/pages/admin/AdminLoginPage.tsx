import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { ADMIN_BASE_PATH } from '../../constants/routes';
import { auth, db, signInWithEmailAndPassword, doc, getDoc, setDoc, isFirebaseConfigured } from '../../firebase/firebase';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide your admin email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!isFirebaseConfigured || !auth) {
        throw new Error('Firebase is not configured.');
      }

      // 1. Real Firebase Authentication with Email & Password
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = cred.user;

      // 2. Check if user is an admin (Firestore role OR admin in email)
      let isAdminUser = false;
      let userName = fbUser.displayName || email.split('@')[0];

      if (db) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data?.role === 'admin' || data?.isAdmin === true) {
              isAdminUser = true;
            }
            if (data?.name) userName = data.name;
          }
        } catch (fsErr) {
          console.warn('Firestore admin check note:', fsErr);
        }
      }

      // Automatically grant admin if email contains "admin" (e.g. adminaditya@craftai.com)
      if (!isAdminUser && (email.toLowerCase().includes('admin') || fbUser.email?.toLowerCase().includes('admin'))) {
        isAdminUser = true;
      }

      if (!isAdminUser) {
        setError('Access Denied: This Firebase account does not have Administrator privileges. Set role: "admin" in Firestore users.');
        return;
      }

      // 3. Ensure Firestore user document has role: 'admin' and plan: 'Administrator'
      if (db) {
        try {
          await setDoc(
            doc(db, 'users', fbUser.uid),
            {
              uid: fbUser.uid,
              email: fbUser.email || email.trim(),
              name: userName,
              role: 'admin',
              plan: 'Administrator',
              lastLoginAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {}
      }

      // 4. Save session and navigate
      localStorage.setItem('admin_email', fbUser.email || email.trim());
      localStorage.setItem('admin_logged_in', 'true');
      const profile = {
        uid: fbUser.uid,
        name: userName,
        email: fbUser.email || email.trim(),
        photoUrl: fbUser.photoURL || '',
        role: 'admin' as const,
        plan: 'Administrator',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('craft_ai_user', JSON.stringify(profile));

      navigate(ADMIN_BASE_PATH);
    } catch (err: any) {
      console.error('Firebase Admin Login Error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please verify your email and password in Firebase.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password for this Firebase user.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please wait a moment and try again.');
      } else {
        setError(err.message || 'Firebase login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
        <div className="flex justify-center mb-6">
          <Link to="/home">
            <Logo size="md" />
          </Link>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4" /> Admin Access
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Admin Portal Login
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Access real-time analytics, user manager, and template editor
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="admin@yourdomain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl brand-gradient text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In as Administrator'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
