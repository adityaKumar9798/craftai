import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CreativesProvider } from './contexts/CreativesContext';
import { ResponsiveLayout } from './components/layout/ResponsiveLayout';
import { useAuth } from './contexts/AuthContext';
import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH, ADMIN_HASH_KEY } from './constants/routes';

// Public Pages
import { SplashPage } from './pages/public/SplashPage';
import { LandingPage } from './pages/public/LandingPage';
import { GuestAccountPage } from './pages/public/GuestAccountPage';
import { AddPhotoPage } from './pages/public/AddPhotoPage';
import { PhotoProcessingPage } from './pages/public/PhotoProcessingPage';
import { MoodSelectionPage } from './pages/public/MoodSelectionPage';

// User Dashboard & App Pages
import { HomeDashboard } from './pages/user/HomeDashboard';
import { CategoriesPage } from './pages/user/CategoriesPage';
import { TemplateGridPage } from './pages/user/TemplateGridPage';
import { TemplatePreviewPage } from './pages/user/TemplatePreviewPage';
import { FinalResultPage } from './pages/user/FinalResultPage';
import { VideoStoriesPage } from './pages/user/VideoStoriesPage';
import { MyCreationsPage } from './pages/user/MyCreationsPage';
import { ProfilePage } from './pages/user/ProfilePage';
import { SettingsPage } from './pages/user/SettingsPage';
import { SearchPage } from './pages/user/SearchPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';

// ─── Route Guards ────────────────────────────────────────────────────────────

/** Redirects unauthenticated users to /login */
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/guest-account" replace />;
  return <>{children}</>;
};

/** Redirects non-admins away; also requires login */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const isAdminLoggedIn = localStorage.getItem('admin_logged_in') === 'true' || isAdmin || user?.role === 'admin';

  if (!isAdminLoggedIn) return <Navigate to={ADMIN_LOGIN_PATH} replace />;
  return <>{children}</>;
};

/** Handles hash-based admin trigger (#A9x7K2m8Q4p6L1z5-admin) */
const HashRouteHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === ADMIN_HASH_KEY || hash.toLowerCase() === ADMIN_HASH_KEY.toLowerCase()) {
      navigate(ADMIN_BASE_PATH, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

// ─── App ─────────────────────────────────────────────────────────────────────

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <HashRouteHandler />
      <AuthProvider>
        <CreativesProvider>
          <Routes>

            {/* ── PUBLIC (no login required) ─────────────────────────── */}
            <Route path="/" element={<SplashPage />} />
            <Route path="/onboarding" element={<LandingPage />} />
            <Route path="/guest-account" element={<GuestAccountPage />} />
            <Route path="/get-started" element={<GuestAccountPage />} />
            <Route path="/login" element={<Navigate to="/guest-account" replace />} />
            <Route path="/signup" element={<Navigate to="/guest-account" replace />} />

            {/* ── SEMI-PROTECTED (part of post-login flow) ───────────── */}
            <Route path="/add-photo" element={<PrivateRoute><AddPhotoPage /></PrivateRoute>} />
            <Route path="/processing" element={<PrivateRoute><PhotoProcessingPage /></PrivateRoute>} />
            <Route path="/mood-selection" element={<PrivateRoute><MoodSelectionPage /></PrivateRoute>} />

            {/* ── PROTECTED USER ROUTES ──────────────────────────────── */}
            <Route path="/home" element={
              <PrivateRoute>
                <ResponsiveLayout><HomeDashboard /></ResponsiveLayout>
              </PrivateRoute>
            } />
            <Route path="/categories" element={
              <PrivateRoute>
                <ResponsiveLayout><CategoriesPage /></ResponsiveLayout>
              </PrivateRoute>
            } />
            <Route path="/category/:slug" element={
              <PrivateRoute>
                <ResponsiveLayout><TemplateGridPage /></ResponsiveLayout>
              </PrivateRoute>
            } />
            <Route path="/template/:id" element={
              <PrivateRoute>
                <ResponsiveLayout><TemplatePreviewPage /></ResponsiveLayout>
              </PrivateRoute>
            } />
            <Route path="/result/:id" element={
              <PrivateRoute>
                <ResponsiveLayout><FinalResultPage /></ResponsiveLayout>
              </PrivateRoute>
            } />
            <Route path="/video-stories" element={
              <PrivateRoute>
                <ResponsiveLayout><VideoStoriesPage /></ResponsiveLayout>
              </PrivateRoute>
            } />
            <Route path="/creations" element={
              <PrivateRoute>
                <ResponsiveLayout><MyCreationsPage /></ResponsiveLayout>
              </PrivateRoute>
            } />
            <Route path="/favorites" element={
              <PrivateRoute>
                <ResponsiveLayout><MyCreationsPage /></ResponsiveLayout>
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <ResponsiveLayout><ProfilePage /></ResponsiveLayout>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <ResponsiveLayout><SettingsPage /></ResponsiveLayout>
              </PrivateRoute>
            } />
            <Route path="/search" element={
              <PrivateRoute>
                <ResponsiveLayout><SearchPage /></ResponsiveLayout>
              </PrivateRoute>
            } />

            {/* ── SECRET ADMIN ROUTES (#A9x7K2m8Q4p6L1z5-admin) ─────── */}
            <Route path={ADMIN_LOGIN_PATH} element={<AdminLoginPage />} />
            <Route path={`${ADMIN_BASE_PATH}/*`} element={
              <AdminRoute>
                <ResponsiveLayout><AdminDashboard /></ResponsiveLayout>
              </AdminRoute>
            } />

            {/* Legacy aliases redirecting to secret admin portal */}
            <Route path="/admin/login" element={<Navigate to={ADMIN_LOGIN_PATH} replace />} />
            <Route path="/admin/*" element={<Navigate to={ADMIN_BASE_PATH} replace />} />
            <Route path="/admin" element={<Navigate to={ADMIN_BASE_PATH} replace />} />

            {/* ── FALLBACK ───────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </CreativesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
