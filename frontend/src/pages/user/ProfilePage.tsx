import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  Camera,
  Settings,
  Bell,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Loader2,
  Edit2,
  Check,
  X,
  User,
  Crown,
  Download,
  Copy,
  FolderHeart,
  Share2,
  CheckCircle2,
  Palette,
  Sparkle,
  Sliders,
  ExternalLink,
  MessageCircleQuestion,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCreatives } from '../../contexts/CreativesContext';
import { ApiService } from '../../services/api';
import { ReligionType } from '../../types';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userPhotoUrl, updateUserPhoto, updateUserProfile, token, logout } = useAuth();
  const { creations, favorites, downloadsCount } = useCreatives();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [displayPhoto, setDisplayPhoto] = useState<string>(() => {
    return userPhotoUrl || '';
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editReligion, setEditReligion] = useState<ReligionType>('hindu');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (userPhotoUrl) {
      setDisplayPhoto(userPhotoUrl);
    }
  }, [userPhotoUrl]);

  const isGuest = Boolean(
    user?.uid?.startsWith('guest_') ||
    user?.email?.toLowerCase().includes('@craftai.app') ||
    user?.email?.toLowerCase().startsWith('guest')
  );

  const handleStartEdit = () => {
    setEditFirstName(user?.firstName || user?.name?.split(' ')[0] || '');
    setEditLastName(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
    setEditUsername(
      user?.username?.replace(/^@/, '') ||
      (user?.name ? user.name.toLowerCase().replace(/\s+/g, '_') : '') ||
      (!isGuest && user?.email ? user.email.split('@')[0] : '') ||
      ''
    );
    setEditReligion(user?.religion || 'hindu');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const cleanUsername = editUsername.trim().startsWith('@')
        ? editUsername.trim()
        : `@${editUsername.trim().replace(/[^a-zA-Z0-9_]/g, '')}`;
      
      const fullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim() || user?.name || 'User';

      await updateUserProfile({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        name: fullName,
        username: cleanUsername,
        religion: editReligion,
      });

      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setDisplayPhoto(objectUrl);
    setUploading(true);

    try {
      const res = await ApiService.uploadPhoto(file, token || undefined);
      if (res && res.photoUrl) {
        setDisplayPhoto(res.photoUrl);
        await updateUserPhoto(res.photoUrl);
      }
    } catch (err: any) {
      console.error('Profile photo upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyHandle = () => {
    const handleText =
      user?.username ||
      (user?.name ? `@${user.name.toLowerCase().replace(/\s+/g, '_')}` : '') ||
      (!isGuest && user?.email ? `@${user.email.split('@')[0]}` : '@user');
    navigator.clipboard?.writeText(handleText);
    setCopiedHandle(true);
    setTimeout(() => setCopiedHandle(false), 2000);
  };

  const currentDisplayPhoto = displayPhoto || userPhotoUrl || '';
  const userReligion = user?.religion || 'hindu';

  const religionLabels: Record<ReligionType, { label: string; icon: string; bg: string }> = {
    hindu: { label: 'Hindu Sanatan', icon: '🕉️', bg: 'bg-amber-50 text-amber-800 border-amber-200/80' },
    muslim: { label: 'Islamic Duas', icon: '☪️', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80' },
    sikh: { label: 'Sikh Gurbani', icon: '☬', bg: 'bg-blue-50 text-blue-800 border-blue-200/80' },
    christian: { label: 'Christian Gospel', icon: '✝️', bg: 'bg-purple-50 text-purple-800 border-purple-200/80' },
  };

  const relData = religionLabels[userReligion] || religionLabels.hindu;

  const sections = [
    {
      heading: 'Creative Workspace',
      items: [
        {
          label: 'My Saved Creations',
          subtitle: 'Your customized devotional status & cards',
          icon: Sparkles,
          iconColor: 'text-purple-600 bg-purple-50',
          path: '/creations',
          badge: `${creations.length} ${creations.length === 1 ? 'Item' : 'Items'}`,
        },
        {
          label: 'Favorites & Bookmarks',
          subtitle: 'Saved festival templates for quick access',
          icon: Heart,
          iconColor: 'text-rose-500 bg-rose-50',
          path: '/favorites',
          badge: `${favorites.length} Saved`,
        },
      ],
    },
    {
      heading: 'Account & Identity',
      items: [
        {
          label: 'Edit Profile & Faith',
          subtitle: 'Name, user handle & community templates',
          icon: Edit2,
          iconColor: 'text-indigo-600 bg-indigo-50',
          action: handleStartEdit,
          extra: (
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              {relData.icon} {relData.label.split(' ')[0]}
            </span>
          ),
        },
        {
          label: 'Update Profile Photo',
          subtitle: 'Used for automatic branding on exported cards',
          icon: Camera,
          iconColor: 'text-sky-600 bg-sky-50',
          action: () => fileInputRef.current?.click(),
        },
      ],
    },
    {
      heading: 'Preferences & Support',
      items: [
        {
          label: 'Daily Reminders & Festival Alerts',
          subtitle: 'Morning devotional cards & festival alerts',
          icon: Bell,
          iconColor: 'text-amber-600 bg-amber-50',
          isToggle: true,
        },
        {
          label: 'Language',
          subtitle: 'Interface & card templates language',
          icon: Globe,
          iconColor: 'text-emerald-600 bg-emerald-50',
          path: '/settings',
          extra: (
            <span className="text-xs text-gray-400 font-medium">English</span>
          ),
        },
        {
          label: 'Settings & Cache',
          subtitle: 'Clear card cache and manage preferences',
          icon: Settings,
          iconColor: 'text-gray-600 bg-gray-100',
          path: '/settings',
        },
        {
          label: 'Help & Support',
          subtitle: 'FAQs, contact us and video guides',
          icon: MessageCircleQuestion,
          iconColor: 'text-blue-600 bg-blue-50',
          path: '/settings',
        },
      ],
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] text-gray-900 select-none pb-24">
      {/* Hidden File Input for Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      <div className="w-full max-w-md mx-auto flex flex-col">
        
        {/* ── STICKY REAL APP PROFILE HEADER ─────────────────────────────────── */}
        <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md px-5 pt-4 pb-4 border-b border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          
          <div className="flex flex-col items-center text-center">
            
            {/* Avatar */}
            <div className="relative mb-2.5">
              <div className="relative w-20 h-20 rounded-full ring-2 ring-gray-100 overflow-hidden bg-gradient-to-tr from-[#7B2CBF] to-[#2188FF] p-0.5 shadow-sm">
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  {currentDisplayPhoto ? (
                    <img
                      src={currentDisplayPhoto}
                      alt={user?.name || 'User'}
                      className={`w-full h-full object-cover transition duration-300 ${
                        uploading ? 'opacity-60 scale-105' : 'opacity-100 scale-100'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-2xl">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Camera Icon Badge */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-sm ring-2 ring-white flex items-center justify-center transition active:scale-95 disabled:opacity-75"
                title="Change Photo"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Name + Verified */}
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
              </h1>
              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />
            </div>

            {/* Username & Email */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-3">
              <button
                onClick={handleCopyHandle}
                className="inline-flex items-center gap-1 font-medium text-purple-600 hover:text-purple-700 transition"
              >
                <span>
                  {user?.username ||
                    (user?.name ? `@${user.name.toLowerCase().replace(/\s+/g, '_')}` : '') ||
                    (!isGuest && user?.email ? `@${user.email.split('@')[0]}` : '@user')}
                </span>
                {copiedHandle ? (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">Copied!</span>
                ) : (
                  <Copy className="w-3 h-3 text-gray-400" />
                )}
              </button>
              {!isGuest && user?.email && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[170px] text-gray-400 font-normal">
                    {user.email}
                  </span>
                </>
              )}
            </div>

            {/* Badges: Community + Plan */}
            <div className="flex items-center justify-center gap-2 mb-3.5">
              <button
                onClick={handleStartEdit}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs hover:bg-opacity-80 transition ${relData.bg}`}
              >
                <span>{relData.icon}</span>
                <span>{relData.label}</span>
                <ChevronRight className="w-3 h-3 text-gray-400 ml-0.5" />
              </button>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold">
                <Crown className="w-3 h-3 text-purple-600 fill-purple-600" />
                <span>{user?.plan || 'Free User'}</span>
              </span>
            </div>

            {/* Clean Twitter/Instagram Style Horizontal Stats */}
            <div className="w-full flex items-center justify-around py-2.5 px-3 rounded-2xl bg-gray-50 border border-gray-100">
              <button
                onClick={() => navigate('/creations')}
                className="flex-1 text-center hover:opacity-80 transition cursor-pointer"
              >
                <div className="text-base font-bold text-gray-900 leading-tight">
                  {creations.length}
                </div>
                <div className="text-[11px] font-medium text-gray-400">Creations</div>
              </button>
              <div className="w-[1px] h-6 bg-gray-200" />
              <button
                onClick={() => navigate('/favorites')}
                className="flex-1 text-center hover:opacity-80 transition cursor-pointer"
              >
                <div className="text-base font-bold text-gray-900 leading-tight">
                  {favorites.length}
                </div>
                <div className="text-[11px] font-medium text-gray-400">Favorites</div>
              </button>
              <div className="w-[1px] h-6 bg-gray-200" />
              <button
                onClick={() => navigate('/creations')}
                className="flex-1 text-center hover:opacity-80 transition cursor-pointer"
              >
                <div className="text-base font-bold text-gray-900 leading-tight">
                  {downloadsCount}
                </div>
                <div className="text-[11px] font-medium text-gray-400">Downloads</div>
              </button>
            </div>

          </div>
        </div>

        {/* ── REAL APP COHESIVE GROUPED LIST ─────────────────────────────────── */}
        <div className="px-4 pt-5 pb-6 space-y-4">
          
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <div className="px-2 text-xs font-semibold text-gray-400">
                {sec.heading}
              </div>

              {/* Grouped Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] divide-y divide-gray-100/80 overflow-hidden">
                {sec.items.map((item: any, idx: number) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (item.action) item.action();
                        else if (item.path) navigate(item.path);
                      }}
                      className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 active:bg-gray-100/80 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${item.iconColor} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold text-gray-900">
                            {item.label}
                          </div>
                          <div className="text-[12px] text-gray-400 font-normal">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.extra}
                        {item.badge && (
                          <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                            {item.badge}
                          </span>
                        )}
                        {item.isToggle && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotificationsEnabled(!notificationsEnabled);
                            }}
                            className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                              notificationsEnabled ? 'bg-purple-600' : 'bg-gray-200'
                            }`}
                          >
                            <div
                              className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform ${
                                notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        )}
                        {!item.isToggle && (
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Log Out Group */}
          <div className="pt-2">
            <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-rose-50/50 active:bg-rose-100/50 transition text-left text-rose-600"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-rose-600">Log Out</div>
                    <div className="text-[12px] text-rose-400 font-normal">Sign out of your account</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-300" />
              </button>
            </div>
          </div>

        </div>

        {/* ── EDIT PROFILE MODAL ─────────────────────────────────────────────── */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Edit Profile</h3>
                  <p className="text-xs text-gray-400 font-medium">Update your name, handle & faith feed</p>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">First Name</label>
                  <input
                    type="text"
                    placeholder="Enter First Name"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Last Name</label>
                  <input
                    type="text"
                    placeholder="Enter Last Name"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">User ID / Handle</label>
                  <input
                    type="text"
                    placeholder="Enter User ID (e.g. rohit_01)"
                    value={editUsername ? (editUsername.startsWith('@') ? editUsername : `@${editUsername}`) : ''}
                    onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-medium"
                  />
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-xs font-semibold text-gray-700">Faith Community (Feeds & Templates)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['hindu', 'muslim', 'sikh', 'christian'] as ReligionType[]).map((rel) => {
                      const r = religionLabels[rel];
                      const isSel = editReligion === rel;
                      return (
                        <button
                          type="button"
                          key={rel}
                          onClick={() => setEditReligion(rel)}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            isSel
                              ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs ring-1 ring-purple-500'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base">{r.icon}</span>
                            {isSel && <Check className="w-3.5 h-3.5 text-purple-600" />}
                          </div>
                          <div className="text-xs font-bold mt-1">{r.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-1/3 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#9B26B6] to-[#2188FF] text-white text-xs font-bold shadow-sm hover:opacity-95 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
