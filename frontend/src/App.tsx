import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CreativesProvider } from './contexts/CreativesContext';
import { ResponsiveLayout } from './components/layout/ResponsiveLayout';
import { useAuth } from './contexts/AuthContext';

// Public Pages
import { SplashPage } from './pages/public/SplashPage';
import { LandingPage } from './pages/public/LandingPage';
import { SignupPage } from './pages/public/SignupPage';
import { LoginPage } from './pages/public/LoginPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { AddPhotoPage } from './pages/public/AddPhotoPage';
import { PhotoProcessingPage } from './pages/public/PhotoProcessingPage';
import { MoodSelectionPage } from './pages/public/MoodSelectionPage';

import { ProfileSetupPage } from './pages/public/ProfileSetupPage';

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
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/** Redirects non-admins away; also requires login */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return <>{children}</>;
};

// ─── App ─────────────────────────────────────────────────────────────────────

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CreativesProvider>
          <Routes>

            {/* ── PUBLIC (no login required) ─────────────────────────── */}
            <Route path="/" element={<SplashPage />} />
            <Route path="/onboarding" element={<LandingPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/setup-profile" element={<PrivateRoute><ProfileSetupPage /></PrivateRoute>} />

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

            {/* ── ADMIN ROUTES ───────────────────────────────────────── */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/*" element={
              <AdminRoute>
                <ResponsiveLayout><AdminDashboard /></ResponsiveLayout>
              </AdminRoute>
            } />

            {/* ── FALLBACK ───────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </CreativesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
