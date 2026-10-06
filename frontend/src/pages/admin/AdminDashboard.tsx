import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Layers,
  Download,
  Share2,
  Plus,
  Trash2,
  Edit,
  Eye,
  X,
  Sliders,
  Shield,
  Activity,
  Radio,
  UserCheck,
  Sparkles,
  Upload,
  Loader2,
  BarChart2,
  FileText,
  Grid,
  Calendar,
  Zap,
  CheckCircle,
  Settings as SettingsIcon,
  BarChart,
  Flame,
  RefreshCw,
  Database,
  ArrowUp,
  Box,
  User,
  Search
} from 'lucide-react';
import { useCreatives } from '../../contexts/CreativesContext';
import { useAuth } from '../../contexts/AuthContext';
import { Template, UserProfile, Category, TrendingTopic } from '../../types';
import { realtimeStore, LiveActivityEvent, PlatformMetrics, DownloadRecord } from '../../services/realtimeStore';
import { ApiService } from '../../services/api';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    templates,
    categories,
    trendingTopics,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addCategory,
    updateCategory,
    deleteCategory,
    addTrendingTopic,
    updateTrendingTopic,
    deleteTrendingTopic,
  } = useCreatives();
  const { isAdmin, user } = useAuth();

  const location = useLocation();
  const activeTab = location.pathname.split('/').pop() === 'admin' ? 'templates' : location.pathname.split('/').pop() || 'templates';
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingPost, setEditingPost] = useState<Template | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [manageTopicsModalOpen, setManageTopicsModalOpen] = useState(false);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TrendingTopic | null>(null);
  const [topicSearch, setTopicSearch] = useState('');
  const [quickTopicName, setQuickTopicName] = useState('');
  const [quickTopicIcon, setQuickTopicIcon] = useState('🔥');
  const [topicFormData, setTopicFormData] = useState({
    name: '',
    slug: '',
    icon: '🔥',
    order: 1,
    isPublished: true,
  });

  // Real-time State
  const [metrics, setMetrics] = useState<PlatformMetrics>(() => realtimeStore.getMetrics());
  const [activities, setActivities] = useState<LiveActivityEvent[]>(() => realtimeStore.getLiveActivities());
  const [usersList, setUsersList] = useState<UserProfile[]>(() => realtimeStore.getUsers());
  const [downloadsList, setDownloadsList] = useState<DownloadRecord[]>(() => realtimeStore.getDownloadsList());
  const [animatingDownload, setAnimatingDownload] = useState(false);
  const [downloadSearch, setDownloadSearch] = useState('');
  const [downloadFilter, setDownloadFilter] = useState('all');
  const [categorySearch, setCategorySearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  // Listen to real-time events & poll live presence
  useEffect(() => {
    const unsubscribe = realtimeStore.subscribe((event) => {
      if (event.type === 'METRICS_UPDATED') {
        setMetrics(event.payload);
        setAnimatingDownload(true);
        setTimeout(() => setAnimatingDownload(false), 1500);
      } else if (event.type === 'DOWNLOADS_UPDATED') {
        setDownloadsList(event.payload);
      } else if (event.type === 'ACTIVITY_ADDED') {
        setActivities((prev) => [event.payload, ...prev.slice(0, 19)]);
      } else if (event.type === 'USERS_UPDATED') {
        setUsersList(event.payload);
      }
    });

    realtimeStore.refreshPresence();
    const presenceTimer = setInterval(() => {
      realtimeStore.refreshPresence();
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(presenceTimer);
    };
  }, []);

  // Listen for the global 'openAddTemplateModal' event from MobileLayout
  useEffect(() => {
    const handleOpenModal = () => openAddModal();
    window.addEventListener('openAddTemplateModal', handleOpenModal);
    return () => window.removeEventListener('openAddTemplateModal', handleOpenModal);
  }, []);

  // Listen for 'openAddPostModal'
  useEffect(() => {
    const handleOpenPostModal = () => openAddPost();
    window.addEventListener('openAddPostModal', handleOpenPostModal);
    return () => window.removeEventListener('openAddPostModal', handleOpenPostModal);
  }, []);

  // Listen for 'openAddDevotionalModal'
  useEffect(() => {
    const handleOpenDevotionalModal = () => openAddDevotional();
    window.addEventListener('openAddDevotionalModal', handleOpenDevotionalModal);
    return () => window.removeEventListener('openAddDevotionalModal', handleOpenDevotionalModal);
  }, []);

  // Listen for 'openTrendingTopicModal'
  useEffect(() => {
    const handleOpenTrendingModal = () => setManageTopicsModalOpen(true);
    window.addEventListener('openTrendingTopicModal', handleOpenTrendingModal);
    return () => window.removeEventListener('openTrendingTopicModal', handleOpenTrendingModal);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    category: 'morning',
    headline: '',
    subheadline: '',
    quote: '',
    assetUrl: '',
    type: 'image' as 'image' | 'video',
    format: 'story' as 'story' | 'post',
    isPremium: false,
    slotX: 0.2,
    slotY: 0.4,
    slotW: 0.6,
    slotH: 0.5,
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    backgroundColor: '#FFFBEB',
    accentColor: '#D97706',
    order: 1,
    isPublished: true,
  });

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postFormData, setPostFormData] = useState({
    name: '',
    category: 'morning',
    headline: '',
    assetUrl: '',
    type: 'image' as 'image' | 'video',
    isPremium: false,
    slotX: 0.36,
    slotY: 0.64,
    slotW: 0.28,
    slotH: 0.28,
  });

  const [devotionalModalOpen, setDevotionalModalOpen] = useState(false);
  const [devotionalFormData, setDevotionalFormData] = useState({
    name: '',
    category: 'hindu',
    type: 'image' as 'image' | 'video',
    assetUrl: '',
    isPremium: false,
    slotX: 0.36,
    slotY: 0.64,
    slotW: 0.28,
    slotH: 0.28,
  });

  const openAddModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'morning',
      headline: '',
      subheadline: '',
      quote: '',
      assetUrl: '',
      type: 'image',
      format: 'story',
      isPremium: false,
      slotX: 0.34,
      slotY: 0.62,
      slotW: 0.32,
      slotH: 0.32,
    });
    setModalOpen(true);
  };

  const openAddDevotional = () => {
    setDevotionalFormData({
      name: '',
      category: 'hindu',
      type: 'image',
      assetUrl: '',
      isPremium: false,
      slotX: 0.36,
      slotY: 0.64,
      slotW: 0.28,
      slotH: 0.28,
    });
    setDevotionalModalOpen(true);
  };

  const openAddPost = () => {
    setEditingPost(null);
    setPostFormData({
      name: '',
      category: 'morning',
      headline: '',
      assetUrl: '',
      type: 'image',
      isPremium: false,
      slotX: 0.36,
      slotY: 0.64,
      slotW: 0.28,
      slotH: 0.28,
    });
    setPostModalOpen(true);
  };

  const openEditPost = (tmpl: Template) => {
    setEditingPost(tmpl);
    setPostFormData({
      name: tmpl.name,
      category: tmpl.category,
      headline: tmpl.headline || '',
      assetUrl: tmpl.assetUrl,
      type: tmpl.type,
      isPremium: tmpl.isPremium,
      slotX: tmpl.subjectSlot?.x ?? 0.36,
      slotY: tmpl.subjectSlot?.y ?? 0.64,
      slotW: tmpl.subjectSlot?.width ?? 0.28,
      slotH: tmpl.subjectSlot?.height ?? 0.28,
    });
    setPostModalOpen(true);
  };

  const openEditModal = (tmpl: Template) => {
    setEditingTemplate(tmpl);
    setFormData({
      name: tmpl.name,
      category: tmpl.category,
      headline: tmpl.headline || '',
      subheadline: tmpl.subheadline || '',
      quote: tmpl.quote || '',
      assetUrl: tmpl.assetUrl,
      type: tmpl.type,
      format: tmpl.format || 'story',
      isPremium: tmpl.isPremium,
      slotX: tmpl.subjectSlot.x,
      slotY: tmpl.subjectSlot.y,
      slotW: tmpl.subjectSlot.width,
      slotH: tmpl.subjectSlot.height,
    });
    setModalOpen(true);
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      slug: '',
      icon: '✨',
      backgroundColor: '#FFFBEB',
      accentColor: '#D97706',
      order: categories.length + 1,
      isPublished: true,
    });
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      backgroundColor: cat.backgroundColor,
      accentColor: cat.accentColor,
      order: cat.order,
      isPublished: cat.isPublished,
    });
    setCategoryModalOpen(true);
  };

  const openAddTopicModal = () => {
    setEditingTopic(null);
    setTopicFormData({
      name: '',
      slug: '',
      icon: '🔥',
      order: trendingTopics.length + 1,
      isPublished: true,
    });
    setTopicModalOpen(true);
  };

  const openEditTopicModal = (topic: TrendingTopic) => {
    setEditingTopic(topic);
    setTopicFormData({
      name: topic.name,
      slug: topic.slug,
      icon: topic.icon || '🔥',
      order: topic.order || 1,
      isPublished: topic.isPublished ?? true,
    });
    setTopicModalOpen(true);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicFormData.name.trim()) return;

    try {
      setSaving(true);
      const cleanSlug = topicFormData.slug.trim() || topicFormData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      if (editingTopic) {
        await updateTrendingTopic(editingTopic.id, {
          name: topicFormData.name.trim(),
          slug: cleanSlug,
          icon: topicFormData.icon.trim(),
          order: Number(topicFormData.order) || 1,
          isPublished: topicFormData.isPublished,
        });
      } else {
        await addTrendingTopic({
          name: topicFormData.name.trim(),
          slug: cleanSlug,
          icon: topicFormData.icon.trim(),
          order: Number(topicFormData.order) || trendingTopics.length + 1,
          isPublished: topicFormData.isPublished,
        });
      }
      setTopicModalOpen(false);
    } catch (err) {
      console.error('Error saving topic:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTopicName.trim()) return;

    try {
      setSaving(true);
      const cleanSlug = quickTopicName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await addTrendingTopic({
        name: quickTopicName.trim(),
        slug: cleanSlug,
        icon: quickTopicIcon.trim() || '🔥',
        order: trendingTopics.length + 1,
        isPublished: true,
      });
      setQuickTopicName('');
      setQuickTopicIcon('🔥');
    } catch (err) {
      console.error('Error adding quick topic:', err);
    } finally {
      setSaving(false);
    }
  };

  // Upload template image with robust multi-layer fallback (Backend API -> Cloudinary -> Local Base64)
  const uploadTemplateImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
      const res = await ApiService.uploadMedia(file, { isTemplate: true, isVideo: isVid });
      
      if (res && res.url) {
        setFormData((prev) => ({
          ...prev,
          assetUrl: res.url,
          type: isVid || res.resourceType === 'video' ? 'video' : prev.type,
        }));
      } else {
        throw new Error('Could not process media file');
      }
    } catch (err: any) {
      alert('Upload failed: ' + (err?.message || 'Please try again.'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetUrl) {
      alert('Please upload a template image first.');
      return;
    }
    setSaving(true);
    const subjectSlot = {
      x: formData.slotX,
      y: formData.slotY,
      width: formData.slotW,
      height: formData.slotH,
      fit: 'cover' as const,
      removeBackground: true,
    };

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          name: formData.name,
          category: formData.category,
          headline: formData.headline,
          subheadline: formData.subheadline,
          quote: formData.quote,
          assetUrl: formData.assetUrl,
          thumbnailUrl: formData.assetUrl,
          type: formData.type,
          format: formData.format,
          width: 1080,
          height: formData.format === 'post' ? 1440 : 1920,
          isPremium: formData.isPremium,
          subjectSlot,
        });
      } else {
        await addTemplate({
          name: formData.name,
          category: formData.category,
          categoryId: `cat-${formData.category}`,
          headline: formData.headline,
          subheadline: formData.subheadline,
          quote: formData.quote,
          assetUrl: formData.assetUrl,
          thumbnailUrl: formData.assetUrl,
          type: formData.type,
          format: formData.format,
          width: 1080,
          height: formData.format === 'post' ? 1440 : 1920,
          isPremium: formData.isPremium,
          isPublished: true,
          subjectSlot,
        });
      }
      setModalOpen(false);
    } catch {
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const uploadDevotionalMedia = async (file: File) => {
    setUploadingImage(true);
    try {
      const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
      const res = await ApiService.uploadMedia(file, { isTemplate: true, isVideo: isVid });

      if (res && res.url) {
        setDevotionalFormData((prev) => ({
          ...prev,
          assetUrl: res.url,
          type: isVid || res.resourceType === 'video' ? 'video' : prev.type,
        }));
      } else {
        throw new Error('Could not process media file');
      }
    } catch (err: any) {
      alert('Upload failed: ' + (err?.message || 'Please try again.'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDevotionalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devotionalFormData.assetUrl) {
      alert('Please upload a devotional media first.');
      return;
    }
    setSaving(true);
    try {
      await addTemplate({
        name: devotionalFormData.name,
        category: devotionalFormData.category,
        categoryId: `cat-${devotionalFormData.category}`,
        headline: '',
        subheadline: '',
        quote: '',
        assetUrl: devotionalFormData.assetUrl,
        thumbnailUrl: devotionalFormData.assetUrl,
        type: devotionalFormData.type,
        format: 'post',
        width: 1080,
        height: 1440,
        isPremium: devotionalFormData.isPremium,
        isPublished: true,
        subjectSlot: {
          x: devotionalFormData.slotX,
          y: devotionalFormData.slotY,
          width: devotionalFormData.slotW,
          height: devotionalFormData.slotH,
          fit: 'cover',
          removeBackground: true,
          shape: 'circle',
          borderRadius: 9999,
        },
      });
      setDevotionalModalOpen(false);
    } catch {
      alert('Failed to save devotional. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const uploadPostMedia = async (file: File) => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('file', file);
      fd.append('isTemplate', 'true');
      fd.append('target', 'template');
      const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
      if (isVid) fd.append('isVideo', 'true');

      const res = await fetch('/api/upload/photo', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url = data?.data?.secureUrl || data?.data?.url || data?.data?.photoUrl || data?.photoUrl || '';
      if (url) {
        setPostFormData((prev) => ({
          ...prev,
          assetUrl: url,
          type: isVid || data?.data?.resourceType === 'video' ? 'video' : prev.type,
        }));
      } else throw new Error('No URL returned from Cloudinary');
    } catch (err: any) {
      alert('Upload failed: ' + (err?.message || 'Please try again.'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePostSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postFormData.assetUrl) {
      alert('Please upload a post media first.');
      return;
    }
    setSaving(true);
    const subjectSlot = {
      x: postFormData.slotX,
      y: postFormData.slotY,
      width: postFormData.slotW,
      height: postFormData.slotH,
      fit: 'cover' as const,
      removeBackground: true,
      shape: 'circle' as const,
      borderRadius: 9999,
    };
    try {
      if (editingPost) {
        await updateTemplate(editingPost.id, {
          name: postFormData.name,
          category: postFormData.category,
          headline: postFormData.headline,
          assetUrl: postFormData.assetUrl,
          thumbnailUrl: postFormData.assetUrl,
          type: postFormData.type,
          isPremium: postFormData.isPremium,
          subjectSlot,
        });
      } else {
        await addTemplate({
          name: postFormData.name,
          category: postFormData.category,
          categoryId: `cat-${postFormData.category}`,
          headline: postFormData.headline,
          subheadline: '',
          quote: '',
          assetUrl: postFormData.assetUrl,
          thumbnailUrl: postFormData.assetUrl,
          type: postFormData.type,
          format: 'post',
          width: 1080,
          height: 1440,
          isPremium: postFormData.isPremium,
          isPublished: true,
          subjectSlot,
        });
      }
      setPostModalOpen(false);
    } catch {
      alert('Failed to save post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCategorySave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryFormData);
      } else {
        await addCategory({
          ...categoryFormData,
          templateCount: 0,
        });
      }
      setCategoryModalOpen(false);
    } catch {
      alert('Failed to save category. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  // Separate templates into stories vs posts based on format
  const storyTemplates = templates.filter(t => t.format !== 'post');
  const postTemplates = templates.filter(t => t.format === 'post');

  return (
    <div className="space-y-8 select-none">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-[#110D2C] p-6 shadow-xl text-white">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/20 blur-[60px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-0 w-48 h-48 bg-purple-600/20 blur-[50px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <p className="text-[10px] font-bold text-gray-300 tracking-wide mb-1 flex items-center gap-1">
                Welcome Back, Admin <span>👋</span>
              </p>
              <h1 className="text-[28px] sm:text-4xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] leading-tight">
                Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Center</span>
              </h1>
            </div>
          </div>

          <p className="text-[10px] text-gray-300 mt-2 max-w-[65%] leading-relaxed">
            Manage your AI creation platform with real-time insights and control.
          </p>

          <div className="flex justify-between items-end mt-6">
            <div className="flex flex-col gap-2 text-[10px] font-semibold">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Firebase Sync: Connected
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/15 self-start shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Users className="w-3.5 h-3.5 text-purple-300" />
                <span>Active Users: <span className="font-extrabold text-emerald-300 ml-0.5">{metrics.activeNow}</span></span>
              </div>
            </div>
            <div className="w-20 h-20 shrink-0 relative">
               {/* 3D Cube Graphic Placeholder */}
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg opacity-80 blur-md"></div>
               <div className="relative w-full h-full bg-gradient-to-tr from-blue-400 to-purple-500 rounded-xl border border-white/20 shadow-2xl flex items-center justify-center transform rotate-12">
                  <Box className="w-10 h-10 text-white opacity-90" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Status Block */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-100 pb-4 font-['Plus_Jakarta_Sans']">


        {/* Right Side Date/Time Status */}
        <div className="hidden xl:flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-4 py-2.5 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-gray-50 text-gray-500">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-900">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-100 mx-1"></div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-gray-900">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">
                System Online
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-purple-500 ml-1"></span>
          </div>
        </div>
      </div>

      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
               <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-end text-right">
               <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Total Users</span>
               <span className="text-2xl font-black text-gray-900 leading-none mt-1">{metrics.totalUsers.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-0.5">
                 <ArrowUp className="w-2.5 h-2.5"/> +100%
               </span>
               <span className="text-[8px] text-gray-400 mt-0.5">Real-time active</span>
            </div>
            <div className="w-12 h-6 text-purple-500">
               <svg viewBox="0 0 100 40" className="w-full h-full drop-shadow-sm" preserveAspectRatio="none">
                 <path d="M0,30 Q20,30 40,20 T80,10 T100,0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
               </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
               <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-end text-right">
               <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Templates</span>
               <span className="text-2xl font-black text-gray-900 leading-none mt-1">{templates.length}</span>
            </div>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-gray-400 flex items-center gap-0.5">
                 — 0%
               </span>
               <span className="text-[8px] text-gray-400 mt-0.5">Data-driven slots</span>
            </div>
            <div className="w-12 h-6 text-blue-500">
               <svg viewBox="0 0 100 40" className="w-full h-full drop-shadow-sm" preserveAspectRatio="none">
                 <path d="M0,30 Q20,30 40,20 T80,10 T100,0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
               </svg>
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/downloads')}
          className={`bg-white rounded-[20px] p-4 shadow-sm border transition-all duration-300 flex flex-col cursor-pointer hover:shadow-md hover:border-emerald-300 hover:scale-[1.01] ${
            animatingDownload ? 'ring-2 ring-emerald-400 scale-[1.02] bg-emerald-50/30' : 'border-gray-100'
          }`}
          title="Click to view Live Downloads & Analytics"
        >
          <div className="flex justify-between items-start">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              animatingDownload ? 'bg-emerald-500 text-white animate-bounce' : 'bg-emerald-100 text-emerald-600'
            }`}>
               <Download className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-end text-right">
               <div className="flex items-center gap-1.5">
                 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-emerald-100 text-emerald-700 tracking-wide">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                 </span>
                 <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Story Downloads</span>
               </div>
               <span className={`text-2xl font-black leading-none mt-1 transition-all ${
                 animatingDownload ? 'text-emerald-600 scale-110' : 'text-gray-900'
               }`}>
                 {metrics.totalDownloads.toLocaleString()}
               </span>
            </div>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                 <ArrowUp className="w-2.5 h-2.5"/> Real-time Tracked
               </span>
               <span className="text-[8px] text-gray-400 mt-0.5">1080×1920 HD exports</span>
            </div>
            <div className="w-12 h-6 text-emerald-500">
               <svg viewBox="0 0 100 40" className="w-full h-full drop-shadow-sm" preserveAspectRatio="none">
                 <path d="M0,30 Q20,30 40,20 T80,10 T100,0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
               </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
               <Share2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-end text-right">
               <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Social Shares</span>
               <span className="text-2xl font-black text-gray-900 leading-none mt-1">{metrics.totalShares.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-gray-400 flex items-center gap-0.5">
                 — 0%
               </span>
               <span className="text-[8px] text-pink-400 mt-0.5">WhatsApp & IG Stories</span>
            </div>
            <div className="w-12 h-6 text-pink-500">
               <svg viewBox="0 0 100 40" className="w-full h-full drop-shadow-sm" preserveAspectRatio="none">
                 <path d="M0,30 Q20,30 40,20 T80,10 T100,0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
               </svg>
            </div>
          </div>
        </div>
      </div>



      {/* TAB: Templates Table */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              Manage Templates ({storyTemplates.length})
              <span className="text-xs font-normal text-gray-400">9:16 Vertical Stories</span>
            </h3>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Real-time instant updates enabled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold">
                  <th className="p-4">Preview</th>
                  <th className="p-4">Template Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Slot Coordinates</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4 text-center">Downloads</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {storyTemplates.map((tmpl) => {
                  const tmplDownloads = (tmpl.downloadsCount !== undefined ? tmpl.downloadsCount : 0) || downloadsList.filter(d => d.templateId === tmpl.id).length;
                  const isVid = tmpl.type === 'video' || (tmpl.assetUrl && /\.(mp4|webm|mov|mkv)$/i.test(tmpl.assetUrl));

                  return (
                    <tr key={tmpl.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="p-4">
                        <div className="w-10 h-16 rounded-xl overflow-hidden bg-gray-900 border border-gray-100 shadow-2xs relative shrink-0 flex items-center justify-center">
                          {isVid ? (
                            tmpl.thumbnailUrl && !tmpl.thumbnailUrl.endsWith('.mp4') ? (
                              <img
                                src={tmpl.thumbnailUrl}
                                alt={tmpl.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-purple-900 to-indigo-950 flex flex-col items-center justify-center text-white">
                                <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                                <span className="text-[8px] font-bold mt-0.5 text-purple-200">VIDEO</span>
                              </div>
                            )
                          ) : (
                            <img
                              src={tmpl.thumbnailUrl || tmpl.assetUrl}
                              alt={tmpl.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <span>{tmpl.name}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-normal truncate max-w-xs">
                          {tmpl.headline || 'No headline'}
                        </div>
                      </td>
                      <td className="p-4 capitalize">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold">
                          {tmpl.category}
                        </span>
                      </td>
                      <td className="p-4 uppercase font-bold text-[10px] text-gray-500">
                        <span className={`px-2 py-0.5 rounded-md ${tmpl.type === 'video' ? 'bg-pink-50 text-pink-700' : 'bg-gray-100 text-gray-600'}`}>
                          {tmpl.type}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-[10px]">
                        X:{tmpl.subjectSlot.x.toFixed(2)} Y:{tmpl.subjectSlot.y.toFixed(2)} W:{tmpl.subjectSlot.width.toFixed(2)} H:{tmpl.subjectSlot.height.toFixed(2)}
                      </td>
                      <td className="p-4">
                        {tmpl.isPremium ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            VIP
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold text-[10px]">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200/80 shadow-2xs select-none"
                          title={`${tmplDownloads} real user downloads`}
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                          <span>{tmplDownloads.toLocaleString()}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/template/${tmpl.id}`)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
                          title="Preview Template"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(tmpl)}
                          className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700"
                          title="Edit Slot"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(tmpl.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Posts Table */}
      {activeTab === 'posts' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              Manage Posts ({postTemplates.length})
              <span className="text-xs font-normal text-gray-400">3:4 Feed Posts</span>
            </h3>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Real-time instant updates enabled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold">
                  <th className="p-4">Preview</th>
                  <th className="p-4">Post Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4 text-center">Downloads</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {postTemplates.map((tmpl) => {
                  const postDownloads = (tmpl.downloadsCount !== undefined ? tmpl.downloadsCount : 0) || downloadsList.filter(d => d.templateId === tmpl.id).length;
                  const isVid = tmpl.type === 'video' || (tmpl.assetUrl && /\.(mp4|webm|mov|mkv)$/i.test(tmpl.assetUrl));

                  return (
                    <tr key={tmpl.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-4">
                        <div className="w-10 h-14 rounded-xl overflow-hidden bg-gray-900 border border-gray-100 shadow-2xs relative shrink-0 flex items-center justify-center">
                          {isVid ? (
                            tmpl.thumbnailUrl && !tmpl.thumbnailUrl.endsWith('.mp4') ? (
                              <img
                                src={tmpl.thumbnailUrl}
                                alt={tmpl.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-purple-900 to-indigo-950 flex flex-col items-center justify-center text-white">
                                <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                                <span className="text-[8px] font-bold mt-0.5 text-purple-200">VIDEO</span>
                              </div>
                            )
                          ) : (
                            <img
                              src={tmpl.thumbnailUrl || tmpl.assetUrl}
                              alt={tmpl.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <span>{tmpl.name}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-normal truncate max-w-xs">
                          {tmpl.headline || 'No headline'}
                        </div>
                      </td>
                      <td className="p-4 capitalize">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                          {tmpl.category}
                        </span>
                      </td>
                      <td className="p-4 uppercase font-bold text-[10px] text-gray-500">
                        <span className={`px-2 py-0.5 rounded-md ${tmpl.type === 'video' ? 'bg-pink-50 text-pink-700' : 'bg-gray-100 text-gray-600'}`}>
                          {tmpl.type}
                        </span>
                      </td>
                      <td className="p-4">
                        {tmpl.isPremium ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            VIP
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold text-[10px]">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200/80 shadow-2xs select-none"
                          title={`${postDownloads} real user downloads`}
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                          <span>{postDownloads.toLocaleString()}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/template/${tmpl.id}`)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
                          title="Preview Post"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditPost(tmpl)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700"
                          title="Edit Post"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(tmpl.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Registered Users & Roles ({usersList.length})
              </h3>
              <span className="text-xs text-gray-400">
                Manage accounts and administrator permissions in real-time
              </span>
            </div>
            {usersList.length > 0 && (
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to remove all users and start completely clean from zero?')) {
                    await realtimeStore.clearAllUsers();
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove All Users (Reset Clean)
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold">
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                          <Users className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-gray-800 text-sm">No Users Registered Yet (Clean Slate)</p>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          Zero users. When someone creates an account via Signup or Google, their real profile appears here dynamically.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  usersList.map((usr) => (
                    <tr key={usr.uid} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 flex items-center gap-3">
                        {usr.photoUrl ? (
                          <img
                            src={usr.photoUrl}
                            alt={usr.name}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-100"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-purple-100">
                            {usr.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <span className="font-bold text-gray-900">{usr.name}</span>
                      </td>
                      <td className="p-4 text-gray-600 font-mono text-[11px]">{usr.email}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            usr.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {usr.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 font-semibold">{usr.plan || 'Free User'}</td>
                      <td className="p-4 text-gray-400 text-[11px]">
                        {new Date(usr.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => realtimeStore.toggleUserRole(usr.uid)}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-bold transition"
                          >
                            {usr.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Delete user ${usr.name} (${usr.email})?`)) {
                                await realtimeStore.deleteUser(usr.uid);
                              }
                            }}
                            className="p-1.5 rounded-xl border border-gray-200 text-gray-400 hover:text-rose-600 hover:border-rose-200 transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 font-['Plus_Jakarta_Sans']">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Category Management
                </h2>
                <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-100">
                  {categories.length} Categories
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Categories are synced in real-time with Firebase and the User Homepage / Explore Pages.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition"
                />
              </div>

              <button
                onClick={async () => {
                  if (window.confirm('Reset all categories to standard recommended defaults (Good Morning, Afternoon, Evening, Night, Birthday, Anniversary, Festival, Bhagwan, etc.)?')) {
                    await realtimeStore.resetDefaultCategories();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1.5"
                title="Restore all default categories"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Reset Defaults
              </button>

              <button
                onClick={openAddCategoryModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl brand-gradient text-white text-xs font-bold shadow-sm shadow-purple-500/25 hover:opacity-95 transition"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {categories
              .filter((c) =>
                !categorySearch.trim() ||
                c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                c.slug.toLowerCase().includes(categorySearch.toLowerCase())
              )
              .map((cat) => {
                const count = templates.filter(
                  (t) =>
                    t.category?.toLowerCase() === cat.slug?.toLowerCase() ||
                    t.category?.toLowerCase() === cat.name?.toLowerCase()
                ).length;

                return (
                  <div
                    key={cat.id || cat.slug}
                    className="relative group rounded-3xl p-4 flex flex-col items-center justify-between text-center gap-2.5 transition-all duration-300 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 shadow-2xs"
                    style={{ backgroundColor: cat.backgroundColor || '#F9FAFB' }}
                  >
                    {/* Top Badges */}
                    <div className="w-full flex items-center justify-between text-[10px] font-bold text-gray-500 px-0.5">
                      <span className="bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-full border border-gray-200/60 shadow-2xs">
                        #{cat.order || 0}
                      </span>
                      <span className="bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-full border border-gray-200/60 shadow-2xs font-semibold">
                        {count} items
                      </span>
                    </div>

                    {/* Emoji / Icon */}
                    <span className="text-3xl sm:text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300 my-1">
                      {cat.icon || '📁'}
                    </span>

                    {/* Name & Slug */}
                    <div className="w-full">
                      <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm truncate">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] font-mono text-gray-500 truncate mt-0.5">
                        /{cat.slug}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-1 w-full justify-center">
                      <button
                        onClick={() => openEditCategoryModal(cat)}
                        className="p-1.5 rounded-xl bg-white/90 text-gray-600 hover:text-purple-600 hover:bg-white shadow-2xs border border-gray-200/80 transition"
                        title="Edit Category"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete category "${cat.name}"?`)) {
                            await deleteCategory(cat.id);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-white/90 text-gray-600 hover:text-rose-600 hover:bg-white shadow-2xs border border-gray-200/80 transition"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            {categories.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 font-bold bg-white rounded-3xl border border-gray-100">
                No categories found. Click "Reset Defaults" or "Add Category" to get started.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Trending Topics Management */}
      {activeTab === 'trending-topics' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* Header */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              <h2 className="text-lg font-bold text-gray-900 font-['Plus_Jakarta_Sans']">
                Trending Topics Management
              </h2>
              <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-100">
                {trendingTopics.length} Topics
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Topics added here will appear in real-time on the User Home Dashboard category chips bar.
            </p>
          </div>

          {/* Live Home Preview Strip */}
          <div className="bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-blue-50/70 p-5 rounded-3xl border border-purple-100/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-600" /> Live User Home Dashboard Preview
              </span>
              <span className="text-[11px] font-medium text-purple-600 bg-white/80 px-2.5 py-0.5 rounded-full border border-purple-200">
                Synchronized Live
              </span>
            </div>

            {/* Chips render */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#403163] text-white shadow-xs">
                All
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#403163] border border-[#d6cce5] shadow-2xs">
                🕉️ Hindu
              </span>
              {trendingTopics.filter(t => t.isPublished).map((top) => (
                <span
                  key={top.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#403163] border border-[#d6cce5] shadow-2xs hover:border-purple-400 transition"
                >
                  <span>{top.icon}</span>
                  <span>{top.name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Topics Table List */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                All Configured Topics ({trendingTopics.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold">
                    <th className="p-4">Icon</th>
                    <th className="p-4">Topic Name</th>
                    <th className="p-4">Slug / Filter Key</th>
                    <th className="p-4">Display Order</th>
                    <th className="p-4">Live Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {trendingTopics.map((topic) => (
                    <tr key={topic.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4">
                        <span className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl shadow-2xs border border-purple-100">
                          {topic.icon || '🔥'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900 text-sm">{topic.name}</div>
                        <div className="text-[11px] text-gray-400 font-normal">Shows on home chips bar</div>
                      </td>
                      <td className="p-4 font-mono text-gray-600">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                          {topic.slug}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700 font-semibold">
                        #{topic.order}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={async () => {
                            await updateTrendingTopic(topic.id, { isPublished: !topic.isPublished });
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition ${
                            topic.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${topic.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                          {topic.isPublished ? 'Live on Home' : 'Hidden'}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => openEditTopicModal(topic)}
                          className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                          title="Edit Topic"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete topic "${topic.name}"? It will be removed from the user home dashboard.`)) {
                              await deleteTrendingTopic(topic.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                          title="Delete Topic"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {trendingTopics.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                        No trending topics created yet. Click "+ Add Topic" to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB: Downloads & Real-time Analytics */}
      {activeTab === 'downloads' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* Top Header Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                    Real-Time Downloads & Analytics
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> LIVE SYNC
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Live real-time feed of all photo personalized 1080×1920 exports and story downloads.
                  </p>
                </div>
              </div>
            </div>

            {/* Real-time Status */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live User Activity Stream Active
              </span>

              {downloadsList.length > 0 && (
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to reset the download count to 0?')) {
                      await realtimeStore.resetDownloads();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:border-rose-200 text-gray-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Counter
                </button>
              )}
            </div>
          </div>

          {/* Breakdown Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/15 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold opacity-90 uppercase tracking-wider">Total Downloads</span>
                <span className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
                  <Download className="w-4 h-4 text-white" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl sm:text-4xl font-black tracking-tight">{metrics.totalDownloads.toLocaleString()}</span>
                <p className="text-[11px] opacity-80 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Real-time active counter
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">9:16 Stories</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {downloadsList.filter(d => d.format !== 'post').length || Math.floor(metrics.totalDownloads * 0.7)}
                </span>
                <p className="text-[11px] text-purple-600 font-semibold mt-1">1080×1920 Full HD Stories</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">3:4 Social Posts</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Grid className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {downloadsList.filter(d => d.format === 'post').length || Math.floor(metrics.totalDownloads * 0.25)}
                </span>
                <p className="text-[11px] text-blue-600 font-semibold mt-1">1080×1350 Feed Posts</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Video Stories</span>
                <span className="p-2 rounded-xl bg-pink-50 text-pink-600">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {downloadsList.filter(d => d.type === 'video').length || Math.floor(metrics.totalDownloads * 0.05)}
                </span>
                <p className="text-[11px] text-pink-600 font-semibold mt-1">Motion MP4 Stories</p>
              </div>
            </div>
          </div>

          {/* Real-time Downloads Stream Feed Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                  Live Download Activity Stream
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {downloadsList.length} Logged
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Instant updates whenever any user clicks the download button anywhere on the platform
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={downloadSearch}
                  onChange={(e) => setDownloadSearch(e.target.value)}
                  placeholder="Search user or template..."
                  className="px-3.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-44"
                />
                <select
                  value={downloadFilter}
                  onChange={(e) => setDownloadFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-none"
                >
                  <option value="all">All Formats</option>
                  <option value="story">Stories (9:16)</option>
                  <option value="post">Posts (3:4)</option>
                  <option value="video">Videos</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold">
                    <th className="p-4">User</th>
                    <th className="p-4">Template / Creative</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Format & Quality</th>
                    <th className="p-4">Downloaded At</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {downloadsList
                    .filter((d) => {
                      if (downloadFilter !== 'all') {
                        if (downloadFilter === 'story' && d.format === 'post') return false;
                        if (downloadFilter === 'post' && d.format !== 'post') return false;
                        if (downloadFilter === 'video' && d.type !== 'video') return false;
                      }
                      if (downloadSearch.trim()) {
                        const q = downloadSearch.toLowerCase();
                        return (
                          d.templateName?.toLowerCase().includes(q) ||
                          d.userName?.toLowerCase().includes(q) ||
                          d.category?.toLowerCase().includes(q) ||
                          d.userEmail?.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors animate-in fade-in">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            {item.userPhotoUrl ? (
                              <img
                                src={item.userPhotoUrl}
                                alt={item.userName}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-100 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                                {item.userName?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-900">{item.userName}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {item.userEmail || 'Guest Session'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            <span>{item.templateName || 'Story Creative'}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            ID: {item.templateId || 'custom'}
                          </span>
                        </td>
                        <td className="p-4 capitalize">
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold text-[10px]">
                            {item.category || 'General'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              item.type === 'video'
                                ? 'bg-pink-100 text-pink-700'
                                : item.format === 'post'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {item.type === 'video' ? '🎬 MP4 Video' : item.format === 'post' ? '🖼️ 3:4 Post' : '📱 9:16 Story'}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">1080×1920 HD</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 font-medium">
                          {(() => {
                            try {
                              const diffMs = Date.now() - new Date(item.downloadedAt).getTime();
                              if (diffMs < 60000) return <span className="text-emerald-600 font-bold">Just now</span>;
                              if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
                              return new Date(item.downloadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + new Date(item.downloadedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
                            } catch {
                              return 'Just now';
                            }
                          })()}
                        </td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Exported
                          </span>
                        </td>
                      </tr>
                    ))}

                  {downloadsList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Download className="w-6 h-6" />
                          </div>
                          <p className="font-bold text-gray-800 text-sm">No Downloads Logged Yet</p>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            When users download stories or posts on the website, each download appears here in real-time. Click <strong>"⚡ Test Real-Time Download (+1)"</strong> above to test right now!
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Trending Topic Modal */}
      {topicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F19]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-gray-900 font-['Plus_Jakarta_Sans']">
                  {editingTopic ? 'Edit Trending Topic' : 'Add Trending Topic'}
                </h3>
              </div>
              <button
                onClick={() => setTopicModalOpen(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4 pt-4 text-xs font-['Plus_Jakarta_Sans']">
              <div>
                <label className="block text-gray-700 font-bold mb-1.5">Topic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IPL 2026, Ram Navami, Birthday"
                  value={topicFormData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTopicFormData({
                      ...topicFormData,
                      name: val,
                      slug: editingTopic ? topicFormData.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5">Emoji Icon</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🌅, 🎂, 🏏, 🚩"
                    value={topicFormData.icon}
                    onChange={(e) => setTopicFormData({ ...topicFormData, icon: e.target.value })}
                    className="w-20 text-center px-3 py-3 rounded-xl border border-gray-200 text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* Quick Pickers */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['🌅', '🎂', '💭', '🌟', '💪', '🏛️', '🌙', '🎊', '😂', '🏏', '🚩', '⚡'].map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setTopicFormData({ ...topicFormData, icon: emoji })}
                        className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-purple-100 flex items-center justify-center text-sm border border-gray-200/60"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5">Slug / Filter Key</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. good-morning, birthday, ipl-2026"
                  value={topicFormData.slug}
                  onChange={(e) => setTopicFormData({ ...topicFormData, slug: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1.5">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={topicFormData.order}
                    onChange={(e) => setTopicFormData({ ...topicFormData, order: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={topicFormData.isPublished}
                      onChange={(e) => setTopicFormData({ ...topicFormData, isPublished: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="font-bold text-gray-800 text-xs">Live on Home</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setTopicModalOpen(false)}
                  className="w-1/3 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTopic ? 'Update Topic' : 'Add to Home'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Template Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F19]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-gray-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editingTemplate ? `Edit ${formData.format === 'post' ? 'Post' : 'Story Template'}` : `Add New ${formData.format === 'post' ? 'Post' : 'Story Template'}`}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 pt-5 text-sm">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Good Morning Sunrise Floral"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-gray-700">Category</label>
                    <button
                      type="button"
                      onClick={() => openAddCategoryModal()}
                      className="text-[10px] font-bold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 font-medium capitalize"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.slug}>
                        {c.icon ? `${c.icon} ` : ''}{c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 font-medium"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Format</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 font-medium"
                  >
                    <option value="story">Story (9:16)</option>
                    <option value="post">Post (3:4)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Headline Text</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. Good Morning"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>

              {/* Template Media Upload */}
              <div>
                <label className="block font-bold text-gray-700 mb-2">Template Media (Image / Video)</label>
                <input
                  ref={imageUploadRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadTemplateImage(file);
                  }}
                />
                {formData.assetUrl ? (
                  <div className="space-y-2">
                    {formData.type === 'video' ? (
                      <video
                        src={formData.assetUrl}
                        className="w-full h-36 object-cover rounded-xl border border-gray-200"
                        controls
                        autoPlay
                        loop
                        muted
                      />
                    ) : (
                      <img
                        src={formData.assetUrl}
                        alt="Preview"
                        className="w-full h-36 object-cover rounded-xl border border-gray-200"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => imageUploadRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full py-2 rounded-xl border border-purple-300 text-purple-700 text-xs font-bold hover:bg-purple-50 transition flex items-center justify-center gap-2"
                    >
                      {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploadingImage ? 'Uploading to Cloudinary...' : 'Change Media'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageUploadRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-28 rounded-2xl border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-100/50 text-purple-600 transition flex flex-col items-center justify-center gap-2.5 cursor-pointer"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-xs font-semibold">Uploading to Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span className="text-xs font-semibold">Click to Upload Template Image</span>
                        <span className="text-[10px] text-purple-400">JPG, PNG, WEBP — will be saved to Cloudinary</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Subject Slot Normalized Coordinates */}
              <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                <p className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> Subject Photo Slot Coordinates (0.0 to 1.0)
                </p>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <label className="text-gray-600">Slot X: {formData.slotX}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={formData.slotX}
                      onChange={(e) => setFormData({ ...formData, slotX: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600">Slot Y: {formData.slotY}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={formData.slotY}
                      onChange={(e) => setFormData({ ...formData, slotY: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600">Width: {formData.slotW}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.02"
                      value={formData.slotW}
                      onChange={(e) => setFormData({ ...formData, slotW: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600">Height: {formData.slotH}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.02"
                      value={formData.slotH}
                      onChange={(e) => setFormData({ ...formData, slotH: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="premium"
                  checked={formData.isPremium}
                  onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                />
                <label htmlFor="premium" className="font-bold text-gray-700 cursor-pointer">
                  VIP / Premium Template
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="flex-1 py-2.5 rounded-xl brand-gradient text-white font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Saving to Firebase...' : editingTemplate ? 'Save Changes' : `Create ${formData.format === 'post' ? 'Post' : 'Template'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Post Modal (Separate) */}
      {postModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F19]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-gray-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editingPost ? 'Edit Post' : 'Add New Post'}
              </h3>
              <button
                onClick={() => setPostModalOpen(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostSave} className="space-y-5 pt-5 text-sm">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Post Name</label>
                <input
                  type="text"
                  value={postFormData.name}
                  onChange={(e) => setPostFormData({ ...postFormData, name: e.target.value })}
                  required
                  placeholder="e.g. Daily Motivation"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-gray-700">Category</label>
                    <button
                      type="button"
                      onClick={() => openAddCategoryModal()}
                      className="text-[10px] font-bold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>
                  <select
                    value={postFormData.category}
                    onChange={(e) => setPostFormData({ ...postFormData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 font-medium capitalize"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.slug}>
                        {c.icon ? `${c.icon} ` : ''}{c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Type</label>
                  <select
                    value={postFormData.type}
                    onChange={(e) => setPostFormData({ ...postFormData, type: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 font-medium"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Headline Text</label>
                <input
                  type="text"
                  value={postFormData.headline}
                  onChange={(e) => setPostFormData({ ...postFormData, headline: e.target.value })}
                  placeholder="e.g. Good Morning"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>

              {/* Post Media Upload */}
              <div>
                <label className="block font-bold text-gray-700 mb-2">Upload Media</label>
                <input
                  ref={imageUploadRef}
                  type="file"
                  accept={postFormData.type === 'video' ? 'video/mp4,video/quicktime' : 'image/png,image/jpeg,image/jpg,image/webp'}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPostMedia(file);
                  }}
                />
                {postFormData.assetUrl ? (
                  <div className="space-y-2">
                    {postFormData.type === 'video' ? (
                      <video src={postFormData.assetUrl} className="w-full h-40 object-cover rounded-xl border border-gray-200" controls />
                    ) : (
                      <img src={postFormData.assetUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                    )}
                    <button
                      type="button"
                      onClick={() => imageUploadRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full py-2 rounded-xl border border-purple-300 text-purple-700 text-xs font-bold hover:bg-purple-50 transition flex items-center justify-center gap-2"
                    >
                      {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploadingImage ? 'Uploading...' : 'Change Media'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageUploadRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-32 rounded-2xl border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-100/50 text-purple-600 transition flex flex-col items-center justify-center gap-2.5 cursor-pointer"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-xs font-semibold">Uploading to Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span className="text-xs font-semibold">Click to Upload {postFormData.type === 'video' ? 'Video' : 'Image'}</span>
                        <span className="text-[10px] text-purple-400">{postFormData.type === 'video' ? 'MP4, MOV' : 'JPG, PNG, WEBP'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Subject Slot Normalized Coordinates */}
              <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                <p className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                  <Sliders className="w-3.5 h-3.5" /> Circle Photo Slot Position (0.0 to 1.0)
                </p>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <label className="text-gray-600 font-medium">Slot X: {postFormData.slotX}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={postFormData.slotX}
                      onChange={(e) => setPostFormData({ ...postFormData, slotX: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium">Slot Y: {postFormData.slotY}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={postFormData.slotY}
                      onChange={(e) => setPostFormData({ ...postFormData, slotY: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium">Width: {postFormData.slotW}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.02"
                      value={postFormData.slotW}
                      onChange={(e) => setPostFormData({ ...postFormData, slotW: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium">Height: {postFormData.slotH}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.02"
                      value={postFormData.slotH}
                      onChange={(e) => setPostFormData({ ...postFormData, slotH: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="premium-post"
                  checked={postFormData.isPremium}
                  onChange={(e) => setPostFormData({ ...postFormData, isPremium: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                />
                <label htmlFor="premium-post" className="font-bold text-gray-700 cursor-pointer">
                  VIP / Premium Post
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPostModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="flex-1 py-2.5 rounded-xl brand-gradient text-white font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? (editingPost ? 'Saving...' : 'Publishing...') : (editingPost ? 'Save Changes' : 'Publish Post')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Devotional Modal (Separate) */}
      {devotionalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F19]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-gray-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Add New Devotional
              </h3>
              <button
                onClick={() => setDevotionalModalOpen(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDevotionalSave} className="space-y-5 pt-5 text-sm">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Devotional Name</label>
                <input
                  type="text"
                  value={devotionalFormData.name}
                  onChange={(e) => setDevotionalFormData({ ...devotionalFormData, name: e.target.value })}
                  required
                  placeholder="e.g. Morning Prayer"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={devotionalFormData.category}
                    onChange={(e) => setDevotionalFormData({ ...devotionalFormData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 font-medium capitalize"
                  >
                    {[
                      { label: 'Hindu', value: 'hindu' },
                      { label: 'Muslim', value: 'muslim' },
                      { label: 'Sikh', value: 'sikh' },
                      { label: 'Christian', value: 'christian' },
                      { label: 'Other', value: 'devotion' }
                    ].map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Format</label>
                  <select
                    value={devotionalFormData.type}
                    onChange={(e) => setDevotionalFormData({ ...devotionalFormData, type: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 font-medium"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>

              {/* Devotional Media Upload with custom design */}
              <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100">
                <label className="block font-bold text-orange-800 mb-2">Upload Devotional Media</label>
                <input
                  ref={imageUploadRef}
                  type="file"
                  accept={devotionalFormData.type === 'video' ? 'video/mp4,video/quicktime' : 'image/png,image/jpeg,image/jpg,image/webp'}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadDevotionalMedia(file);
                  }}
                />
                {devotionalFormData.assetUrl ? (
                  <div className="space-y-2">
                    {devotionalFormData.type === 'video' ? (
                      <video src={devotionalFormData.assetUrl} className="w-full h-40 object-cover rounded-xl border border-orange-200" controls />
                    ) : (
                      <img src={devotionalFormData.assetUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl border border-orange-200" />
                    )}
                    <button
                      type="button"
                      onClick={() => imageUploadRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full py-2 rounded-xl border border-orange-300 text-orange-700 text-xs font-bold hover:bg-orange-100 transition flex items-center justify-center gap-2"
                    >
                      {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploadingImage ? 'Uploading...' : 'Change Media'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageUploadRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-32 rounded-2xl border-2 border-dashed border-orange-200 hover:border-orange-400 bg-white text-orange-600 transition flex flex-col items-center justify-center gap-2.5 cursor-pointer shadow-sm"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-xs font-semibold">Uploading to Server...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span className="text-xs font-semibold">Choose {devotionalFormData.type === 'video' ? 'Video' : 'Image'}</span>
                        <span className="text-[10px] text-orange-400">{devotionalFormData.type === 'video' ? 'MP4, MOV' : 'JPG, PNG, WEBP'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Devotional Circle Photo Slot Coordinates */}
              <div className="p-3 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-3">
                <p className="font-bold text-orange-900 flex items-center gap-1.5 text-xs">
                  <Sliders className="w-3.5 h-3.5" /> Circle Photo Slot Position (0.0 to 1.0)
                </p>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <label className="text-gray-600 font-medium">Slot X: {devotionalFormData.slotX}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={devotionalFormData.slotX}
                      onChange={(e) => setDevotionalFormData({ ...devotionalFormData, slotX: parseFloat(e.target.value) })}
                      className="w-full accent-orange-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium">Slot Y: {devotionalFormData.slotY}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={devotionalFormData.slotY}
                      onChange={(e) => setDevotionalFormData({ ...devotionalFormData, slotY: parseFloat(e.target.value) })}
                      className="w-full accent-orange-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium">Width: {devotionalFormData.slotW}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.02"
                      value={devotionalFormData.slotW}
                      onChange={(e) => setDevotionalFormData({ ...devotionalFormData, slotW: parseFloat(e.target.value) })}
                      className="w-full accent-orange-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium">Height: {devotionalFormData.slotH}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.02"
                      value={devotionalFormData.slotH}
                      onChange={(e) => setDevotionalFormData({ ...devotionalFormData, slotH: parseFloat(e.target.value) })}
                      className="w-full accent-orange-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="premium-devotional"
                  checked={devotionalFormData.isPremium}
                  onChange={(e) => setDevotionalFormData({ ...devotionalFormData, isPremium: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-500 accent-orange-500"
                />
                <label htmlFor="premium-devotional" className="font-bold text-gray-700 cursor-pointer">
                  VIP / Premium Devotional
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDevotionalModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold shadow-md shadow-orange-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Publishing...' : 'Create Devotional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCategorySave} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                  required
                  placeholder="e.g. Birthday"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Slug (URL safe)</label>
                  <input
                    type="text"
                    value={categoryFormData.slug}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Emoji Icon</label>
                  <input
                    type="text"
                    value={categoryFormData.icon}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-center text-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Background Color</label>
                  <input
                    type="color"
                    value={categoryFormData.backgroundColor}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, backgroundColor: e.target.value })}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Accent Color</label>
                  <input
                    type="color"
                    value={categoryFormData.accentColor}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, accentColor: e.target.value })}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={categoryFormData.order}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, order: parseInt(e.target.value) || 0 })}
                  required
                  min="1"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl brand-gradient text-white font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Trending Topic Modal */}
      {topicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg font-bold">
                  {topicFormData.icon || '🔥'}
                </span>
                <h3 className="text-base font-bold text-gray-900 font-['Plus_Jakarta_Sans']">
                  {editingTopic ? 'Edit Trending Topic' : 'Add New Trending Topic'}
                </h3>
              </div>
              <button
                onClick={() => setTopicModalOpen(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Topic Name</label>
                <input
                  type="text"
                  value={topicFormData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setTopicFormData({
                      ...topicFormData,
                      name,
                      slug: editingTopic ? topicFormData.slug : autoSlug,
                    });
                  }}
                  required
                  placeholder="e.g. Birthday, Cricket, Motivation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-gray-700 mb-1">Emoji / Icon</label>
                  <input
                    type="text"
                    value={topicFormData.icon}
                    onChange={(e) => setTopicFormData({ ...topicFormData, icon: e.target.value })}
                    required
                    placeholder="🎂"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-center text-xl font-medium"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Slug / Identifier</label>
                  <input
                    type="text"
                    value={topicFormData.slug}
                    onChange={(e) => setTopicFormData({ ...topicFormData, slug: e.target.value })}
                    required
                    placeholder="e.g. birthday"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={topicFormData.order}
                    onChange={(e) => setTopicFormData({ ...topicFormData, order: parseInt(e.target.value) || 1 })}
                    required
                    min="1"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                  />
                </div>
                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={topicFormData.isPublished}
                      onChange={(e) => setTopicFormData({ ...topicFormData, isPublished: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                    />
                    <span className="font-bold text-gray-700 text-xs">Show Live on Home</span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center gap-2 text-[11px] text-purple-800">
                <span className="text-base">{topicFormData.icon || '🔥'}</span>
                <span>
                  Preview Chip: <strong>{topicFormData.icon} {topicFormData.name || 'Topic Name'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setTopicModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Saving...' : editingTopic ? 'Save Changes' : 'Publish Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MANAGE TRENDING TOPICS POPUP MODAL (Triggered from Sidebar click) ── */}
      {manageTopicsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 flex flex-col overflow-hidden border border-gray-100">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-indigo-50/30 to-pink-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 text-lg">
                  <Flame className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 font-['Plus_Jakarta_Sans']">
                      Trending Topics Manager
                    </h3>
                    <span className="text-[11px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {trendingTopics.length} Topics
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Topics added here appear dynamically on the user's home screen category bar.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManageTopicsModalOpen(false)}
                className="p-2 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* 1. Live Feed Preview Box */}
              <div className="bg-[#403163]/5 border border-[#403163]/15 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#403163] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> User Home Screen Live Preview
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Realtime Sync
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#403163] text-white shadow-2xs">
                    All
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#403163] border border-[#d6cce5] shadow-2xs">
                    🕉️ Hindu
                  </span>
                  {trendingTopics.filter(t => t.isPublished).map((top) => (
                    <span
                      key={top.id}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#403163] border border-[#d6cce5] shadow-2xs"
                    >
                      <span>{top.icon}</span>
                      <span>{top.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* 2. Quick Add New Topic Form */}
              <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-purple-600" /> Add New Topic Instantly
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">Type topic name and press Add</span>
                </div>

                <form onSubmit={handleQuickAddTopic} className="flex flex-col sm:flex-row gap-2">
                  {/* Emoji Quick Selector */}
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1 shrink-0">
                    <input
                      type="text"
                      value={quickTopicIcon}
                      onChange={(e) => setQuickTopicIcon(e.target.value)}
                      className="w-8 text-center text-lg font-bold bg-transparent outline-none"
                      title="Emoji Icon"
                    />
                    <div className="hidden sm:flex items-center gap-0.5 border-l border-gray-100 pl-1">
                      {['🔥', '🎂', '🌅', '💭', '💪', '🏏', '🎉', '😂'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setQuickTopicIcon(em)}
                          className={`w-6 h-6 rounded-md text-xs hover:bg-gray-100 flex items-center justify-center transition ${quickTopicIcon === em ? 'bg-purple-100 ring-1 ring-purple-300' : ''}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Topic Name Input */}
                  <input
                    type="text"
                    value={quickTopicName}
                    onChange={(e) => setQuickTopicName(e.target.value)}
                    placeholder="e.g. Birthday, IPL 2026, Jokes, Motivational..."
                    required
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={saving || !quickTopicName.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-500/25 hover:opacity-95 transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Add Topic</span>
                  </button>
                </form>
              </div>

              {/* 3. Search & List of All Topics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    All Active Topics ({trendingTopics.length})
                  </h4>
                  <input
                    type="text"
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    placeholder="Search topics..."
                    className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  {trendingTopics
                    .filter((t) => t.name.toLowerCase().includes(topicSearch.toLowerCase()) || (t.slug && t.slug.toLowerCase().includes(topicSearch.toLowerCase())))
                    .map((topic) => (
                      <div
                        key={topic.id}
                        className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:border-purple-200 transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg shrink-0 border border-purple-100">
                            {topic.icon || '🔥'}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900 truncate">{topic.name}</span>
                              <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                #{topic.slug}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400">Order: #{topic.order}</span>
                          </div>
                        </div>

                        {/* Action buttons: Live Toggle, Edit, Delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={async () => {
                              await updateTrendingTopic(topic.id, { isPublished: !topic.isPublished });
                            }}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 ${
                              topic.isPublished
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                            }`}
                            title="Click to toggle live on user home screen"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${topic.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                            {topic.isPublished ? 'Live' : 'Hidden'}
                          </button>

                          <button
                            onClick={() => openEditTopicModal(topic)}
                            className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition"
                            title="Edit topic details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete topic "${topic.name}"? It will be removed from the user home dashboard immediately.`)) {
                                await deleteTrendingTopic(topic.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete topic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                  {trendingTopics.length === 0 && (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      No trending topics found. Use the box above to add your first topic!
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Changes take effect across all connected user devices instantly.
              </span>
              <button
                onClick={() => setManageTopicsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#403163] text-white text-xs font-bold shadow-xs hover:bg-[#32264e] transition"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
