import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Grid,
  Video,
  Sparkles,
  Heart,
  User,
  Settings,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Camera,
  ShieldAlert,
  BarChart2,
  LayoutDashboard,
  FileText,
  Users,
  Image as ImageIcon,
  Crown,
  ArrowRight,
  Flame
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../contexts/AuthContext';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ children }) => {
  const { user, userPhotoUrl, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isAdminPage = location.pathname.startsWith('/admin');

  const navItems = isAdminPage
    ? [
        { label: 'Create Template', path: '/admin', icon: FileText },
        { label: 'Create Post', path: '/admin/create-post', icon: ImageIcon },
        { label: 'Create Devotional', path: '/admin/create-devotional', icon: Sparkles },
        { label: 'Trending Topics', path: '/admin/trending-topics', icon: Flame },
        { label: 'Manage Posts', path: '/admin/posts', icon: ImageIcon },
        { label: 'Templates', path: '/admin/templates', icon: FileText },
        { label: 'Users', path: '/admin/users', icon: Users },
        { label: 'Categories', path: '/admin/categories', icon: Grid },
      ]
    : [
        { label: 'Home', path: '/home', icon: Home },
        { label: 'Categories', path: '/categories', icon: Grid },
        { label: 'Video Stories', path: '/video-stories', icon: Video },
        { label: 'My Creations', path: '/creations', icon: Sparkles },
        { label: 'My Favorites', path: '/favorites', icon: Heart },
        { label: 'Profile', path: '/profile', icon: User },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex text-gray-900">
      {/* LEFT SIDEBAR */}
      <aside className={`w-64 flex flex-col fixed inset-y-0 left-0 z-30 select-none ${isAdminPage ? 'bg-[#101328] text-gray-300' : 'bg-white border-r border-gray-100 text-gray-500'}`}>
        {/* Logo */}
        <div className="p-6 pb-4">
          <NavLink to="/home" className="inline-block">
            <Logo size="md" dark={isAdminPage} />
          </NavLink>
          {isAdminPage && (
            <p className="text-[#7C3AED] text-xs font-semibold mt-1 ml-11">
              Creator Studio
            </p>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/home' && item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  if (item.label === 'Create Template' && location.pathname.startsWith('/admin')) {
                    e.preventDefault();
                    window.dispatchEvent(new Event('openAddTemplateModal'));
                  } else if (item.label === 'Create Post' && location.pathname.startsWith('/admin')) {
                    e.preventDefault();
                    window.dispatchEvent(new Event('openAddPostModal'));
                  } else if (item.label === 'Create Devotional' && location.pathname.startsWith('/admin')) {
                    e.preventDefault();
                    window.dispatchEvent(new Event('openAddDevotionalModal'));
                  } else if (item.label === 'Trending Topics') {
                    // Navigate directly to dedicated /admin/trending-topics page
                  }
                }}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? isAdminPage ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/25' : 'bg-[#F3E8FF] text-[#7C3AED] shadow-xs'
                    : isAdminPage ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? (isAdminPage ? 'text-white' : 'text-[#7C3AED]') : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>


        {/* Change Photo Quick Bar */}
        {isAdminPage ? (
          <div className="p-4 mx-4 mb-4 rounded-2xl bg-[#090C15] border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-purple-500/20">
                {user?.name?.[0]?.toUpperCase() || <User className="w-5 h-5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'admin'}</p>
                <p className="text-[11px] text-gray-400">Administrator</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        ) : (
          <div className="p-4 mx-4 mb-4 rounded-2xl bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 border border-purple-100">
            <div className="flex items-center gap-3">
              {userPhotoUrl ? (
                <img
                  src={userPhotoUrl}
                  alt="Current"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-400"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-purple-300">
                  {user?.name?.[0]?.toUpperCase() || <User className="w-5 h-5 text-white" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">Your Photo</p>
                <button
                  onClick={() => navigate('/add-photo')}
                  className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Camera className="w-3 h-3" /> Change Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white/95 backdrop-blur-md sticky top-0 z-20">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates, users, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-16 py-2.5 rounded-full bg-gray-50 border border-transparent hover:border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-400">
              Ctrl K
            </div>
          </form>

          {/* Right Area: Notifications & User Avatar Dropdown */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F72585] ring-2 ring-white" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-white p-4 shadow-xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h4 className="font-bold text-sm text-gray-900">Notifications</h4>
                    <span className="text-[11px] text-purple-600 font-semibold cursor-pointer">Mark all read</span>
                  </div>
                  <div className="py-2 space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-purple-50 text-gray-700">
                      <p className="font-semibold text-purple-900">New Festival Templates!</p>
                      <p className="text-gray-500 mt-0.5">Explore 10 fresh Diwali & Holi trending story presets.</p>
                    </div>
                    <div className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 transition">
                      <p className="font-semibold text-gray-900">Photo processed successfully</p>
                      <p className="text-gray-500 mt-0.5">Your subject has been optimized for all 45+ templates.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-50 transition"
              >
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
                    alt={user?.name || 'User'}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-purple-500/20">
                    {user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4 text-white" />}
                  </div>
                )}
                <span className="text-sm font-bold text-gray-800 flex flex-col items-start leading-tight">
                  <span>{user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}</span>
                  {isAdminPage && <span className="text-[10px] text-gray-500 font-medium">Administrator</span>}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900">{user?.name || user?.email?.split('@')[0] || 'User'}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email || ''}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                      {user?.plan || 'Free User'}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition"
                    >
                      <User className="w-4 h-4 text-gray-400" /> Profile
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/add-photo');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition"
                    >
                      <Camera className="w-4 h-4 text-gray-400" /> Change Photo
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-xl transition"
                      >
                        <ShieldAlert className="w-4 h-4 text-purple-500" /> Admin Dashboard
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-gray-100">
                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
