import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Grid,
  Plus,
  Sparkles,
  User,
  Search,
  Crown,
  ShieldAlert,
  Menu,
  Bell,
  FileText,
  Users,
  X,
  Flame,
  Image as ImageIcon,
  LogOut,
  ArrowRight,
  Video,
  Heart,
  Settings,
  ChevronRight,
  Download,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_BASE_PATH } from '../../constants/routes';

interface MobileLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  hideHeader = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith(ADMIN_BASE_PATH);

  const { userPhotoUrl, user, logout, isAdmin } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const adminNavItems = [
    { label: 'Create Template', path: ADMIN_BASE_PATH, icon: FileText, modalEvent: 'openAddTemplateModal' },
    { label: 'Create Post', path: `${ADMIN_BASE_PATH}/posts`, icon: ImageIcon, modalEvent: 'openAddPostModal' },
    { label: 'Create Devotional', path: ADMIN_BASE_PATH, icon: Sparkles, modalEvent: 'openAddDevotionalModal' },
    { label: 'Trending Topics', path: `${ADMIN_BASE_PATH}/trending-topics`, icon: Flame },
    { label: 'Manage Posts', path: `${ADMIN_BASE_PATH}/posts`, icon: ImageIcon },
    { label: 'Templates', path: `${ADMIN_BASE_PATH}/templates`, icon: FileText },
    { label: 'Downloads & Stats', path: `${ADMIN_BASE_PATH}/downloads`, icon: Download },
    { label: 'Users', path: `${ADMIN_BASE_PATH}/users`, icon: Users },
    { label: 'Categories', path: `${ADMIN_BASE_PATH}/categories`, icon: Grid },
  ];

  const userNavItems = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Categories', path: '/categories', icon: Grid },
    { label: 'Video Stories', path: '/video-stories', icon: Video },
    { label: 'My Creations', path: '/creations', icon: Sparkles },
    { label: 'My Favorites', path: '/favorites', icon: Heart },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleAdminNavClick = (item: typeof adminNavItems[0]) => {
    setDrawerOpen(false);
    if (item.modalEvent) {
      if (location.pathname !== item.path) {
        navigate(item.path);
      }
      setTimeout(() => {
        window.dispatchEvent(new Event(item.modalEvent!));
      }, 100);
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 pb-20 select-none">
      {/* Mobile Top Header */}
      {!hideHeader && (
        <header className="h-16 px-4 sm:px-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 active:scale-95 transition"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center">
              <Logo size="sm" />
              {isAdminPage && (
                <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isAdminPage ? (
              <>
                <button
                  onClick={() => navigate(`${ADMIN_BASE_PATH}/trending-topics`)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-700 bg-gray-100/70 hover:bg-gray-200 transition"
                  title="Trending Topics"
                >
                  <Flame className="w-4.5 h-4.5 text-orange-500" />
                </button>
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
                    alt="Current"
                    onClick={() => setDrawerOpen(true)}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/20 cursor-pointer"
                  />
                ) : (
                  <div
                    onClick={() => setDrawerOpen(true)}
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-purple-500/20 cursor-pointer"
                  >
                    {user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4 text-white" />}
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/search')}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 transition"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/categories')}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-amber-500 hover:bg-amber-50 transition"
                  aria-label="Categories"
                >
                  <Crown className="w-5 h-5 fill-amber-400" />
                </button>
              </>
            )}
          </div>
        </header>
      )}

      {/* Slidebar / Drawer Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 animate-in fade-in"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slidebar Drawer Content */}
      <aside
        className={`fixed inset-y-0 left-0 w-[290px] sm:w-[320px] max-w-[85vw] ${
          isAdminPage ? 'bg-[#101328] text-gray-200' : 'bg-white text-gray-800'
        } z-50 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className={`p-5 pb-4 flex items-center justify-between border-b ${
          isAdminPage ? 'border-white/10' : 'border-gray-100'
        }`}>
          <div>
            <Logo size="md" dark={isAdminPage} />
            {isAdminPage ? (
              <p className="text-[#7C3AED] text-xs font-semibold mt-0.5 ml-10">
                Creator Studio
              </p>
            ) : (
              <p className="text-gray-400 text-xs font-medium mt-0.5 ml-10">
                AI Creative Platform
              </p>
            )}
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className={`p-2 rounded-xl transition ${
              isAdminPage
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Menu List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {isAdminPage ? (
            <>
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Admin Controls & Features
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/admin' && item.path !== ADMIN_BASE_PATH && location.pathname.startsWith(item.path));
                return (
                  <button
                    key={item.label}
                    onClick={() => handleAdminNavClick(item)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                      isActive && !item.modalEvent
                        ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/25'
                        : 'text-gray-300 hover:text-white hover:bg-white/5 active:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${isActive && !item.modalEvent ? 'bg-white/20 text-white' : 'bg-white/5 text-purple-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-left font-medium">{item.label}</span>
                    </div>
                    {item.modalEvent ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300">
                        Quick Add
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                );
              })}

              <div className="pt-3 mt-3 border-t border-white/10">
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  User View
                </div>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate('/home');
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-white/5 text-emerald-400">
                      <Home className="w-4 h-4" />
                    </div>
                    <span>Switch to User Home</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Menu
              </div>
              {userNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#F3E8FF] text-[#7C3AED] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C3AED]' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </NavLink>
                );
              })}

              {isAdmin && (
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      navigate(ADMIN_BASE_PATH);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-4 h-4 text-purple-600" />
                      <span>Admin Dashboard</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-400" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Bottom Profile & Logout */}
        <div className={`p-4 border-t ${
          isAdminPage ? 'border-white/10 bg-[#0A0D1B]' : 'border-gray-100 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {userPhotoUrl ? (
                <img
                  src={userPhotoUrl}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/30"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4 text-white" />}
                </div>
              )}
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${isAdminPage ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {isAdminPage ? 'Administrator' : user?.plan || 'Free Plan'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              setDrawerOpen(false);
              await logout();
              navigate('/login');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 active:scale-98 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 ${
        location.pathname.startsWith('/template') || location.pathname === '/profile'
          ? 'px-0 py-0'
          : 'px-3 sm:px-4 py-3 sm:py-5'
      }`}>
        {children}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 py-2 px-4 sm:px-6 flex items-center justify-between z-40 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {isAdminPage ? (
          <>
            <NavLink
              to={ADMIN_BASE_PATH}
              end
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[10px] font-medium transition ${
                  isActive ? 'text-purple-600 font-bold' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to={`${ADMIN_BASE_PATH}/posts`}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[10px] font-medium transition ${
                  isActive ? 'text-purple-600 font-bold' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <ImageIcon className="w-5 h-5" />
              <span>Posts</span>
            </NavLink>

            {/* Central Prominent Gradient '+' Button for Admin */}
            <div className="relative -top-4">
              <button
                onClick={() => window.dispatchEvent(new Event('openAddTemplateModal'))}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all"
                title="Add Template"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            <NavLink
              to={`${ADMIN_BASE_PATH}/trending-topics`}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[10px] font-medium transition ${
                  isActive ? 'text-purple-600 font-bold' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Flame className="w-5 h-5" />
              <span>Trending</span>
            </NavLink>

            <NavLink
              to={`${ADMIN_BASE_PATH}/users`}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[10px] font-medium transition ${
                  isActive ? 'text-purple-600 font-bold' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Users className="w-5 h-5" />
              <span>Users</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#F72585] font-bold' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/categories"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#F72585] font-bold' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Grid className="w-5 h-5" />
              <span>Categories</span>
            </NavLink>

            {/* Central Prominent Gradient '+' Button */}
            <div className="relative -top-4">
              <button
                onClick={() => navigate('/add-photo')}
                className="flex h-13 w-13 items-center justify-center rounded-full brand-gradient text-white shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all"
                title="Create Story"
              >
                <Plus className="w-7 h-7 stroke-[2.5]" />
              </button>
            </div>

            <NavLink
              to="/creations"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#F72585] font-bold' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Sparkles className="w-5 h-5" />
              <span>Creations</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#F72585] font-bold' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
};
