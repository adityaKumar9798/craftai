import { Template, Category, UserProfile, TrendingTopic } from '../types';
import {
  db,
  collection,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  limit,
  orderBy,
  query,
} from '../firebase/firebase';

export interface LiveActivityEvent {
  id: string;
  type: 'download' | 'share' | 'favorite' | 'signup' | 'create';
  userName: string;
  userAvatar?: string;
  templateName?: string;
  category?: string;
  timestamp: string;
}

export interface PlatformMetrics {
  totalUsers: number;
  totalTemplates: number;
  totalDownloads: number;
  totalShares: number;
  activeNow: number;
}

export interface DownloadRecord {
  id: string;
  templateId?: string;
  templateName?: string;
  category?: string;
  type?: 'image' | 'video';
  format?: 'story' | 'post';
  userName: string;
  userEmail?: string;
  userPhotoUrl?: string;
  userId?: string;
  downloadedAt: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-good-morning',
    name: 'Good Morning',
    slug: 'good-morning',
    icon: '🌅',
    backgroundColor: '#FEF3C7',
    accentColor: '#D97706',
    templateCount: 150,
    order: 1,
    isPublished: true,
  },
  {
    id: 'cat-good-afternoon',
    name: 'Good Afternoon',
    slug: 'good-afternoon',
    icon: '☀️',
    backgroundColor: '#FFEDD5',
    accentColor: '#EA580C',
    templateCount: 95,
    order: 2,
    isPublished: true,
  },
  {
    id: 'cat-good-evening',
    name: 'Good Evening',
    slug: 'good-evening',
    icon: '🌇',
    backgroundColor: '#FCE7F3',
    accentColor: '#DB2777',
    templateCount: 80,
    order: 3,
    isPublished: true,
  },
  {
    id: 'cat-good-night',
    name: 'Good Night',
    slug: 'good-night',
    icon: '🌙',
    backgroundColor: '#E0E7FF',
    accentColor: '#4F46E5',
    templateCount: 120,
    order: 4,
    isPublished: true,
  },
  {
    id: 'cat-birthday',
    name: 'Birthday',
    slug: 'birthday',
    icon: '🎂',
    backgroundColor: '#FDF2F8',
    accentColor: '#EC4899',
    templateCount: 200,
    order: 5,
    isPublished: true,
  },
  {
    id: 'cat-anniversary',
    name: 'Anniversary',
    slug: 'anniversary',
    icon: '💍',
    backgroundColor: '#FFF1F2',
    accentColor: '#E11D48',
    templateCount: 75,
    order: 6,
    isPublished: true,
  },
  {
    id: 'cat-special-day',
    name: 'Special Day',
    slug: 'special-day',
    icon: '🌟',
    backgroundColor: '#FEF9C3',
    accentColor: '#CA8A04',
    templateCount: 110,
    order: 7,
    isPublished: true,
  },
  {
    id: 'cat-festival',
    name: 'Festival',
    slug: 'festival',
    icon: '🪔',
    backgroundColor: '#FFEDD5',
    accentColor: '#C2410C',
    templateCount: 180,
    order: 8,
    isPublished: true,
  },
  {
    id: 'cat-bhagwan',
    name: 'Bhagwan / Devotional',
    slug: 'bhagwan',
    icon: '🙏',
    backgroundColor: '#FEF3C7',
    accentColor: '#B45309',
    templateCount: 250,
    order: 9,
    isPublished: true,
  },
  {
    id: 'cat-suvichar',
    name: 'Suvichar',
    slug: 'suvichar',
    icon: '📖',
    backgroundColor: '#ECFDF5',
    accentColor: '#059669',
    templateCount: 140,
    order: 10,
    isPublished: true,
  },
  {
    id: 'cat-motivational',
    name: 'Motivational',
    slug: 'motivational',
    icon: '⚡',
    backgroundColor: '#EDE9FE',
    accentColor: '#7C3AED',
    templateCount: 190,
    order: 11,
    isPublished: true,
  },
  {
    id: 'cat-updesh',
    name: 'Updesh',
    slug: 'updesh',
    icon: '🕉️',
    backgroundColor: '#FFFBEB',
    accentColor: '#D97706',
    templateCount: 65,
    order: 12,
    isPublished: true,
  },
  {
    id: 'cat-islamic-quotes',
    name: 'Islamic Quotes',
    slug: 'islamic-quotes',
    icon: '☪️',
    backgroundColor: '#ECFDF5',
    accentColor: '#047857',
    templateCount: 90,
    order: 13,
    isPublished: true,
  },
  {
    id: 'cat-political',
    name: 'Political',
    slug: 'political',
    icon: '🗳️',
    backgroundColor: '#EFF6FF',
    accentColor: '#2563EB',
    templateCount: 130,
    order: 14,
    isPublished: true,
  },
  {
    id: 'cat-business',
    name: 'Business',
    slug: 'business',
    icon: '💼',
    backgroundColor: '#F1F5F9',
    accentColor: '#475569',
    templateCount: 85,
    order: 15,
    isPublished: true,
  },
  {
    id: 'cat-shayari',
    name: 'Shayari',
    slug: 'shayari',
    icon: '✍️',
    backgroundColor: '#FDF4FF',
    accentColor: '#A21CAF',
    templateCount: 115,
    order: 16,
    isPublished: true,
  },
  {
    id: 'cat-jokes',
    name: 'Jokes',
    slug: 'jokes',
    icon: '😂',
    backgroundColor: '#FEF08A',
    accentColor: '#A16207',
    templateCount: 70,
    order: 17,
    isPublished: true,
  },
  {
    id: 'cat-new',
    name: 'Trending & New',
    slug: 'new',
    icon: '🔥',
    backgroundColor: '#FEE2E2',
    accentColor: '#DC2626',
    templateCount: 220,
    order: 18,
    isPublished: true,
  },
];

class RealtimeStore {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: { type: string; payload: any }) => void> = new Set();
  private cachedTemplates: Template[] = [];
  private cachedCategories: Category[] = [];
  private cachedTopics: TrendingTopic[] = [];
  private cachedDownloads: DownloadRecord[] = [];
  private topicsLoaded = false;

  constructor() {
    // Initialize cached categories from local storage or rich defaults
    try {
      if (typeof window !== 'undefined') {
        const rawCats = localStorage.getItem('craft_ai_categories');
        if (rawCats) {
          const parsed = JSON.parse(rawCats);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cachedCategories = parsed;
          } else {
            this.cachedCategories = [...DEFAULT_CATEGORIES];
            localStorage.setItem('craft_ai_categories', JSON.stringify(DEFAULT_CATEGORIES));
          }
        } else {
          this.cachedCategories = [...DEFAULT_CATEGORIES];
          localStorage.setItem('craft_ai_categories', JSON.stringify(DEFAULT_CATEGORIES));
        }
      }
    } catch {
      this.cachedCategories = [...DEFAULT_CATEGORIES];
    }

    // Clear stale demo data only (preserve real metric counts)
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('craft_ai_users_list');
        if (raw) {
          const parsed = JSON.parse(raw);
          const cleaned = Array.isArray(parsed)
            ? parsed.filter((u: any) => u && !u.uid?.startsWith('usr_'))
            : [];
          localStorage.setItem('craft_ai_users_list', JSON.stringify(cleaned));
        }
      }
    } catch {}

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('craft_ai_realtime_channel');
      this.channel.onmessage = (msg) => {
        if (msg.data?.type === 'TOPICS_UPDATED') {
          this.cachedTopics = msg.data.payload || [];
        } else if (msg.data?.type === 'DOWNLOADS_UPDATED') {
          this.cachedDownloads = msg.data.payload || [];
        } else if (msg.data?.type === 'CATEGORIES_UPDATED') {
          this.cachedCategories = msg.data.payload || [];
        }
        this.notifyListeners(msg.data);
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'craft_ai_trending_topics' && e.newValue) {
          try {
            const updated = JSON.parse(e.newValue);
            this.cachedTopics = updated;
            this.notifyListeners({ type: 'TOPICS_UPDATED', payload: updated });
          } catch {}
        } else if (e.key === 'craft_ai_categories' && e.newValue) {
          try {
            const updated = JSON.parse(e.newValue);
            this.cachedCategories = updated;
            this.notifyListeners({ type: 'CATEGORIES_UPDATED', payload: updated });
          } catch {}
        } else if (e.key === 'craft_ai_metrics' && e.newValue) {
          try {
            const updated = JSON.parse(e.newValue);
            this.notifyListeners({ type: 'METRICS_UPDATED', payload: updated });
          } catch {}
        } else if (e.key === 'craft_ai_downloads_history' && e.newValue) {
          try {
            const updated = JSON.parse(e.newValue);
            this.cachedDownloads = updated;
            this.notifyListeners({ type: 'DOWNLOADS_UPDATED', payload: updated });
          } catch {}
        }
      });
    }

    // Start real-time listeners
    this.listenToRealFirestoreUsers();
    this.listenToFirestoreTemplates();
    this.listenToFirestoreCategories();
    this.listenToFirestoreTopics();
    this.listenToFirestoreMetrics();
    this.listenToFirestoreDownloads();
    this.listenToFirestorePresence();
    this.initPresenceTracking();
  }

  // --- Real-time Presence Heartbeat ---
  private sessionId = '';

  private initPresenceTracking() {
    if (typeof window === 'undefined') return;

    try {
      let sId = sessionStorage.getItem('craft_presence_session_id');
      if (!sId) {
        sId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('craft_presence_session_id', sId);
      }
      this.sessionId = sId;

      const sendHeartbeat = async () => {
        try {
          const res = await fetch('/api/presence/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: this.sessionId,
              path: window.location.pathname,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && typeof data.activeCount === 'number') {
              const current = this.getMetrics();
              if (current.activeNow !== data.activeCount) {
                const updated: PlatformMetrics = {
                  ...current,
                  activeNow: data.activeCount,
                };
                localStorage.setItem('craft_ai_metrics', JSON.stringify(updated));
                this.broadcast('METRICS_UPDATED', updated);
              }
            }
          }
        } catch {}
      };

      // Immediate heartbeat on mount
      sendHeartbeat();

      // Continuous pulse heartbeat every 6 seconds
      setInterval(sendHeartbeat, 6000);

      // On tab closing / page unload, immediately notify backend
      const notifyLeave = () => {
        try {
          const payload = JSON.stringify({ sessionId: this.sessionId });
          if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon('/api/presence/leave', blob);
          } else {
            fetch('/api/presence/leave', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload,
              keepalive: true,
            }).catch(() => {});
          }
        } catch {}
      };

      window.addEventListener('beforeunload', notifyLeave);
      window.addEventListener('pagehide', notifyLeave);
    } catch {}
  }

  private listenToFirestorePresence() {
    if (db) {
      try {
        onSnapshot(collection(db, 'active_sessions'), (snap) => {
          const cutoff = Date.now() - 15000;
          let count = 0;
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            if (d.lastSeen && d.lastSeen >= cutoff) {
              count++;
            }
          });
          if (count > 0) {
            const current = this.getMetrics();
            if (current.activeNow !== count) {
              const updated = { ...current, activeNow: count };
              localStorage.setItem('craft_ai_metrics', JSON.stringify(updated));
              this.broadcast('METRICS_UPDATED', updated);
            }
          }
        }, () => {});
      } catch {}
    }
  }

  // --- Backend API polling for metrics & topics ---
  private async fetchTopicsFromAPI() {
    try {
      const res = await fetch('/api/trending');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const topics: TrendingTopic[] = data.data;
          topics.sort((a, b) => (a.order || 0) - (b.order || 0));
          this.cachedTopics = topics;
          this.topicsLoaded = true;
          this.broadcast('TOPICS_UPDATED', topics);
        }
      }
    } catch {}
  }

  private async fetchMetricsFromAPI() {
    try {
      const res = await fetch('/api/metrics');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.data) {
          const current = this.getMetrics();
          const merged = {
            ...current,
            totalDownloads: Math.max(current.totalDownloads, data.data.totalDownloads || 0),
            totalShares: Math.max(current.totalShares, data.data.totalShares || 0),
            activeNow: typeof data.data.activeNow === 'number' ? data.data.activeNow : current.activeNow,
          };
          localStorage.setItem('craft_ai_metrics', JSON.stringify(merged));
          this.broadcast('METRICS_UPDATED', merged);
        }
      }
    } catch {}
  }

  private async fetchDownloadsFromAPI() {
    try {
      const res = await fetch('/api/metrics/downloads');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          this.cachedDownloads = data.data;
          localStorage.setItem('craft_ai_downloads_history', JSON.stringify(data.data));
          this.broadcast('DOWNLOADS_UPDATED', data.data);
        }
      }
    } catch {}
  }

  // --- Real-time Metrics Firestore Listener ---
  private listenToFirestoreMetrics() {
    if (db) {
      try {
        onSnapshot(doc(db, 'platform_stats', 'metrics'), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const current = this.getMetrics();
            const updated: PlatformMetrics = {
              ...current,
              totalDownloads: typeof data.totalDownloads === 'number' ? data.totalDownloads : current.totalDownloads,
              totalShares: typeof data.totalShares === 'number' ? data.totalShares : current.totalShares,
              totalUsers: this.getUsers().length,
              totalTemplates: this.getTemplates().length,
            };
            localStorage.setItem('craft_ai_metrics', JSON.stringify(updated));
            this.broadcast('METRICS_UPDATED', updated);
          }
        }, () => {});
      } catch (e) {}
    }
    this.fetchMetricsFromAPI();
  }

  // --- Real-time Downloads List Firestore Listener ---
  private listenToFirestoreDownloads() {
    if (db) {
      try {
        const q = query(collection(db, 'downloads'), orderBy('downloadedAt', 'desc'), limit(50));
        onSnapshot(q, (snapshot) => {
          const downloads: DownloadRecord[] = [];
          snapshot.forEach((d) => {
            downloads.push({ id: d.id, ...d.data() } as DownloadRecord);
          });
          if (downloads.length > 0) {
            this.cachedDownloads = downloads;
            localStorage.setItem('craft_ai_downloads_history', JSON.stringify(downloads));
            this.broadcast('DOWNLOADS_UPDATED', downloads);
            // Also update download count if higher
            const current = this.getMetrics();
            if (downloads.length > current.totalDownloads) {
              this.updateMetrics({ totalDownloads: downloads.length - current.totalDownloads });
            }
          }
        }, () => {});
      } catch (e) {}
    }
    this.fetchDownloadsFromAPI();
  }

  private listenToFirestoreTopics() {
    if (db) {
      try {
        onSnapshot(collection(db, 'trending_topics'), (snapshot) => {
          const topics: TrendingTopic[] = [];
          snapshot.forEach((d) => {
            topics.push({ id: d.id, ...d.data() } as TrendingTopic);
          });
          if (topics.length > 0) {
            topics.sort((a, b) => (a.order || 0) - (b.order || 0));
            this.cachedTopics = topics;
            this.topicsLoaded = true;
            this.broadcast('TOPICS_UPDATED', topics);
          }
        }, () => {});
      } catch (e) {}
    }
    this.fetchTopicsFromAPI();
  }

  // --- Firestore real-time listener for templates ---
  private listenToFirestoreTemplates() {
    if (!db) return;
    try {
      onSnapshot(collection(db, 'templates'), (snapshot) => {
        const templates: Template[] = [];
        snapshot.forEach((d) => {
          templates.push({ id: d.id, ...d.data() } as Template);
        });
        templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.cachedTemplates = templates;
        this.broadcast('TEMPLATES_UPDATED', templates);
        this.updateMetrics({ totalTemplates: templates.length } as any);
      }, (err) => {
        console.warn('[RealtimeStore] Firestore templates listener error:', err.message);
      });
    } catch (e) {
      console.warn('[RealtimeStore] Could not start Firestore templates listener:', e);
    }
  }

  private async fetchCategoriesFromAPI() {
    try {
      const res = await fetch('/api/categories');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const cats: Category[] = data.data;
          cats.sort((a, b) => (a.order || 0) - (b.order || 0));
          this.cachedCategories = cats;
          localStorage.setItem('craft_ai_categories', JSON.stringify(cats));
          this.broadcast('CATEGORIES_UPDATED', cats);
        }
      }
    } catch {}
  }

  // --- Firestore real-time listener for categories ---
  private listenToFirestoreCategories() {
    if (db) {
      try {
        onSnapshot(collection(db, 'categories'), (snapshot) => {
          const categories: Category[] = [];
          snapshot.forEach((d) => {
            categories.push({ id: d.id, ...d.data() } as Category);
          });
          if (categories.length > 0) {
            categories.sort((a, b) => (a.order || 0) - (b.order || 0));
            this.cachedCategories = categories;
            localStorage.setItem('craft_ai_categories', JSON.stringify(categories));
            this.broadcast('CATEGORIES_UPDATED', categories);
          }
        }, (err) => {
          console.warn('[RealtimeStore] Firestore categories listener error:', err.message);
        });
      } catch (e) {
        console.warn('[RealtimeStore] Could not start Firestore categories listener:', e);
      }
    }
    this.fetchCategoriesFromAPI();
  }

  private listenToRealFirestoreUsers() {
    const fetchBackendUsers = async () => {
      try {
        const res = await fetch('/api/users/list');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const realUsers = data.data.filter((u: any) => !u.uid?.startsWith('usr_'));
            localStorage.setItem('craft_ai_users_list', JSON.stringify(realUsers));
            this.broadcast('USERS_UPDATED', realUsers);
            this.updateMetrics({ totalUsers: realUsers.length });
          }
        }
      } catch {}
    };

    fetchBackendUsers();

    try {
      if (db) {
        onSnapshot(collection(db, 'users'), (snapshot) => {
          const realUsers: UserProfile[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            if (d.id.startsWith('usr_') && !d.id.includes('-')) return;

            realUsers.push({
              uid: d.id,
              name: data.name || 'User',
              email: data.email || '',
              photoUrl: data.photoUrl || '',
              role: data.role || 'user',
              plan: data.plan || (data.role === 'admin' ? 'Administrator' : 'Free User'),
              createdAt: data.createdAt || new Date().toISOString(),
            });
          });

          localStorage.setItem('craft_ai_users_list', JSON.stringify(realUsers));
          this.broadcast('USERS_UPDATED', realUsers);
          this.updateMetrics({ totalUsers: realUsers.length });
        }, (err) => {
          console.warn('[RealtimeStore] Firestore client rules restricted; synced via Admin SDK:', err.message);
          fetchBackendUsers();
        });
      }
    } catch (e) {
      console.warn('[RealtimeStore] Fallback to Admin SDK users:', e);
      fetchBackendUsers();
    }
  }

  // --- Real-time Event Subscription ---
  subscribe(listener: (event: { type: string; payload: any }) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: { type: string; payload: any }) {
    this.listeners.forEach((fn) => fn(event));
  }

  private broadcast(type: string, payload: any) {
    const event = { type, payload };
    this.notifyListeners(event);
    if (this.channel) {
      this.channel.postMessage(event);
    }
  }

  // --- CATEGORIES (Firestore as source of truth) ---
  getCategories(): Category[] {
    if (this.cachedCategories.length > 0) return this.cachedCategories;
    return DEFAULT_CATEGORIES;
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const slug = (category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();
    const newCat: Category = {
      ...category,
      slug,
      id: `cat-${slug}`,
      order: typeof category.order === 'number' ? category.order : this.cachedCategories.length + 1,
      isPublished: category.isPublished !== undefined ? category.isPublished : true,
      templateCount: category.templateCount || 0,
      backgroundColor: category.backgroundColor || '#F3F4F6',
      accentColor: category.accentColor || '#6B7280',
      icon: category.icon || '📁',
    };

    const updated = [...this.cachedCategories.filter((c) => c.id !== newCat.id && c.slug !== newCat.slug), newCat];
    updated.sort((a, b) => (a.order || 0) - (b.order || 0));
    this.cachedCategories = updated;
    localStorage.setItem('craft_ai_categories', JSON.stringify(updated));
    this.broadcast('CATEGORIES_UPDATED', updated);

    if (db) {
      try {
        await setDoc(doc(db, 'categories', newCat.id), newCat);
      } catch (e) {}
    }

    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat),
      });
    } catch {}

    return newCat;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const idx = this.cachedCategories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const merged = { ...this.cachedCategories[idx], ...updates };
      this.cachedCategories[idx] = merged;
      this.cachedCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
      localStorage.setItem('craft_ai_categories', JSON.stringify(this.cachedCategories));
      this.broadcast('CATEGORIES_UPDATED', this.cachedCategories);

      if (db) {
        try {
          await updateDoc(doc(db, 'categories', id), updates as any);
        } catch {}
      }

      try {
        await fetch(`/api/categories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
      } catch {}

      return merged;
    }
    return null;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const prev = this.cachedCategories.length;
    this.cachedCategories = this.cachedCategories.filter((c) => c.id !== id);
    localStorage.setItem('craft_ai_categories', JSON.stringify(this.cachedCategories));
    this.broadcast('CATEGORIES_UPDATED', this.cachedCategories);

    if (db) {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch {}
    }

    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    } catch {}

    return this.cachedCategories.length < prev;
  }

  async resetDefaultCategories(): Promise<Category[]> {
    this.cachedCategories = [...DEFAULT_CATEGORIES];
    localStorage.setItem('craft_ai_categories', JSON.stringify(DEFAULT_CATEGORIES));
    this.broadcast('CATEGORIES_UPDATED', DEFAULT_CATEGORIES);

    if (db) {
      for (const cat of DEFAULT_CATEGORIES) {
        try {
          await setDoc(doc(db, 'categories', cat.id), cat);
        } catch {}
      }
    }

    for (const cat of DEFAULT_CATEGORIES) {
      try {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cat),
        });
      } catch {}
    }

    return DEFAULT_CATEGORIES;
  }

  // --- TRENDING TOPICS ---
  getTrendingTopics(): TrendingTopic[] {
    return this.cachedTopics;
  }

  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('craft_ai_token');
    } catch {
      return null;
    }
  }

  async addTrendingTopic(topic: Omit<TrendingTopic, 'id'>): Promise<TrendingTopic> {
    const optimisticId = `top_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const optimistic: TrendingTopic = {
      ...topic,
      id: optimisticId,
      createdAt: new Date().toISOString(),
    };

    this.cachedTopics = [...this.cachedTopics, optimistic].sort((a, b) => (a.order || 0) - (b.order || 0));
    this.broadcast('TOPICS_UPDATED', this.cachedTopics);

    try {
      const token = this.getAuthToken();
      const res = await fetch('/api/trending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(topic),
      });
      if (res.ok) {
        const data = await res.json();
        const created: TrendingTopic = data.data || optimistic;
        await this.fetchTopicsFromAPI();
        return created;
      }
    } catch (e) {}

    return optimistic;
  }

  async updateTrendingTopic(id: string, updates: Partial<TrendingTopic>): Promise<TrendingTopic | null> {
    const idx = this.cachedTopics.findIndex((t) => t.id === id);
    let updated: TrendingTopic | null = null;
    if (idx !== -1) {
      this.cachedTopics[idx] = { ...this.cachedTopics[idx], ...updates };
      updated = this.cachedTopics[idx];
      this.cachedTopics.sort((a, b) => (a.order || 0) - (b.order || 0));
      this.broadcast('TOPICS_UPDATED', [...this.cachedTopics]);
    }

    try {
      const token = this.getAuthToken();
      await fetch(`/api/trending/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });
      await this.fetchTopicsFromAPI();
    } catch (e) {}

    return updated;
  }

  async deleteTrendingTopic(id: string): Promise<boolean> {
    this.cachedTopics = this.cachedTopics.filter((t) => t.id !== id);
    this.broadcast('TOPICS_UPDATED', [...this.cachedTopics]);

    try {
      const token = this.getAuthToken();
      const res = await fetch(`/api/trending/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        await this.fetchTopicsFromAPI();
        return true;
      }
    } catch (e) {}

    return true;
  }

  // --- TEMPLATES ---
  getTemplates(): Template[] {
    return this.cachedTemplates;
  }

  async addTemplate(template: Omit<Template, 'id' | 'createdAt'>): Promise<Template> {
    const newTmpl: Template = {
      ...template,
      id: `tmpl_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await setDoc(doc(db, 'templates', newTmpl.id), newTmpl);
    } else {
      this.cachedTemplates = [newTmpl, ...this.cachedTemplates];
      this.broadcast('TEMPLATES_UPDATED', this.cachedTemplates);
    }

    this.addLiveActivity({
      id: `act_${Date.now()}`,
      type: 'create',
      userName: 'Admin',
      templateName: newTmpl.name,
      category: newTmpl.category,
      timestamp: 'Just now',
    });

    return newTmpl;
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template | null> {
    if (db) {
      await updateDoc(doc(db, 'templates', id), updates as any);
    }
    const idx = this.cachedTemplates.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.cachedTemplates[idx] = { ...this.cachedTemplates[idx], ...updates };
      this.broadcast('TEMPLATES_UPDATED', this.cachedTemplates);
      return this.cachedTemplates[idx];
    }
    return null;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    if (db) {
      await deleteDoc(doc(db, 'templates', id));
    }
    const prev = this.cachedTemplates.length;
    this.cachedTemplates = this.cachedTemplates.filter((t) => t.id !== id);
    this.broadcast('TEMPLATES_UPDATED', this.cachedTemplates);
    return this.cachedTemplates.length < prev;
  }

  // --- USERS ---
  getUsers(): UserProfile[] {
    const raw = localStorage.getItem('craft_ai_users_list');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((u: UserProfile) => u && !u.uid?.startsWith('usr_'))
        : [];
    } catch {
      return [];
    }
  }

  async saveUser(user: UserProfile) {
    if (!user || !user.uid) return;

    try {
      if (db && user.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.name,
          email: user.email,
          photoUrl: user.photoUrl,
          role: user.role,
          plan: user.plan || (user.role === 'admin' ? 'Administrator' : 'Free User'),
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdAt: user.createdAt || new Date().toISOString(),
        }, { merge: true });
      }
    } catch (e) {}

    try {
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch {}

    const users = this.getUsers().filter((u) => u.uid !== user.uid && u.email !== user.email);
    users.unshift(user);
    localStorage.setItem('craft_ai_users_list', JSON.stringify(users));
    this.broadcast('USERS_UPDATED', users);
    this.updateMetrics({ totalUsers: users.length });
  }

  async toggleUserRole(uid: string): Promise<UserProfile | null> {
    const users = this.getUsers();
    const user = users.find((u) => u.uid === uid);
    if (!user) return null;
    user.role = user.role === 'admin' ? 'user' : 'admin';
    user.plan = user.role === 'admin' ? 'Administrator' : 'Free User';

    try {
      if (db) {
        await updateDoc(doc(db, 'users', uid), {
          role: user.role,
          plan: user.plan,
        });
      }
    } catch (e) {}

    try {
      await fetch('/api/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role: user.role, plan: user.plan }),
      });
    } catch {}

    localStorage.setItem('craft_ai_users_list', JSON.stringify(users));
    this.broadcast('USERS_UPDATED', users);
    return user;
  }

  async deleteUser(uid: string): Promise<boolean> {
    const current = this.getUsers();
    const updated = current.filter((u) => u.uid !== uid);

    try {
      if (db) {
        await deleteDoc(doc(db, 'users', uid));
      }
    } catch (e) {}

    try {
      await fetch(`/api/users/${uid}`, { method: 'DELETE' });
    } catch {}

    localStorage.setItem('craft_ai_users_list', JSON.stringify(updated));
    this.broadcast('USERS_UPDATED', updated);
    this.updateMetrics({ totalUsers: updated.length });
    return true;
  }

  async clearAllUsers(): Promise<void> {
    try {
      if (db) {
        const snap = await getDocs(collection(db, 'users'));
        for (const d of snap.docs) {
          try {
            await deleteDoc(d.ref);
          } catch {}
        }
      }
    } catch (e) {}

    try {
      await fetch('/api/users/clear-all', { method: 'POST' });
    } catch {}

    localStorage.setItem('craft_ai_users_list', JSON.stringify([]));
    this.broadcast('USERS_UPDATED', []);
    this.updateMetrics({ totalUsers: 0 });
  }

  // --- REAL-TIME METRICS ---
  getMetrics(): PlatformMetrics {
    const raw = localStorage.getItem('craft_ai_metrics');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          totalUsers: this.getUsers().length,
          totalTemplates: this.getTemplates().length,
          totalDownloads: Number(parsed.totalDownloads) || 0,
          totalShares: Number(parsed.totalShares) || 0,
          activeNow: Number(parsed.activeNow) || 1,
        };
      } catch {}
    }

    const defaultMetrics: PlatformMetrics = {
      totalUsers: this.getUsers().length,
      totalTemplates: this.getTemplates().length,
      totalDownloads: 0,
      totalShares: 0,
      activeNow: 1,
    };
    localStorage.setItem('craft_ai_metrics', JSON.stringify(defaultMetrics));
    return defaultMetrics;
  }

  updateMetrics(delta: Partial<PlatformMetrics>): PlatformMetrics {
    const current = this.getMetrics();
    const updated: PlatformMetrics = {
      totalTemplates: this.getTemplates().length,
      totalUsers: delta.totalUsers !== undefined ? delta.totalUsers : current.totalUsers,
      totalDownloads: current.totalDownloads + (delta.totalDownloads || 0),
      totalShares: current.totalShares + (delta.totalShares || 0),
      activeNow: delta.activeNow !== undefined ? delta.activeNow : current.activeNow,
    };
    localStorage.setItem('craft_ai_metrics', JSON.stringify(updated));
    this.broadcast('METRICS_UPDATED', updated);
    return updated;
  }

  async refreshPresence(): Promise<number> {
    try {
      const res = await fetch('/api/presence/count');
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.activeCount === 'number') {
          const current = this.getMetrics();
          if (current.activeNow !== data.activeCount) {
            const updated = { ...current, activeNow: data.activeCount };
            localStorage.setItem('craft_ai_metrics', JSON.stringify(updated));
            this.broadcast('METRICS_UPDATED', updated);
            return data.activeCount;
          }
          return current.activeNow;
        }
      }
    } catch {}
    return this.getMetrics().activeNow;
  }

  // --- REAL-TIME DOWNLOADS STREAM ---
  getDownloadsList(): DownloadRecord[] {
    if (this.cachedDownloads.length > 0) return this.cachedDownloads;
    const raw = localStorage.getItem('craft_ai_downloads_history');
    if (raw) {
      try {
        this.cachedDownloads = JSON.parse(raw);
        return this.cachedDownloads;
      } catch {}
    }
    return [];
  }

  async recordDownload(info: {
    templateId?: string;
    templateName?: string;
    category?: string;
    type?: 'image' | 'video';
    format?: 'story' | 'post';
    userName?: string;
    userEmail?: string;
    userPhotoUrl?: string;
    userId?: string;
  }): Promise<void> {
    const record: DownloadRecord = {
      id: `dl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      templateId: info.templateId || 'custom',
      templateName: info.templateName || 'Story Creative',
      category: info.category || 'General',
      type: info.type || 'image',
      format: info.format || 'story',
      userName: info.userName || 'Guest Creator',
      userEmail: info.userEmail || '',
      userPhotoUrl: info.userPhotoUrl || '',
      userId: info.userId || 'guest',
      downloadedAt: new Date().toISOString(),
    };

    // 1. Instant optimistic state update
    const currentMetrics = this.getMetrics();
    const newMetrics = {
      ...currentMetrics,
      totalDownloads: currentMetrics.totalDownloads + 1,
    };
    localStorage.setItem('craft_ai_metrics', JSON.stringify(newMetrics));
    this.broadcast('METRICS_UPDATED', newMetrics);

    const prevDownloads = this.getDownloadsList();
    const updatedDownloads = [record, ...prevDownloads.slice(0, 49)];
    this.cachedDownloads = updatedDownloads;
    localStorage.setItem('craft_ai_downloads_history', JSON.stringify(updatedDownloads));
    this.broadcast('DOWNLOADS_UPDATED', updatedDownloads);

    // 2. Increment template-specific download count in cache
    if (record.templateId && record.templateId !== 'custom') {
      const idx = this.cachedTemplates.findIndex((t) => t.id === record.templateId);
      if (idx !== -1) {
        this.cachedTemplates[idx] = {
          ...this.cachedTemplates[idx],
          downloadsCount: (this.cachedTemplates[idx].downloadsCount || 0) + 1,
        };
        this.broadcast('TEMPLATES_UPDATED', [...this.cachedTemplates]);
      }
    }

    // 3. Add to live activity feed
    this.addLiveActivity({
      id: `act_${Date.now()}`,
      type: 'download',
      userName: record.userName,
      userAvatar: record.userPhotoUrl,
      templateName: record.templateName,
      category: record.category,
      timestamp: 'Just now',
    });

    // 4. Persist atomically to Firebase Firestore
    if (db) {
      try {
        await setDoc(
          doc(db, 'platform_stats', 'metrics'),
          {
            totalDownloads: increment(1),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        await setDoc(doc(db, 'downloads', record.id), record);

        if (record.templateId && record.templateId !== 'custom') {
          await setDoc(
            doc(db, 'templates', record.templateId),
            {
              downloadsCount: increment(1),
            },
            { merge: true }
          );
        }
      } catch (dbErr) {
        console.warn('[RealtimeStore] Firestore download record note:', dbErr);
      }
    }

    // 5. Sync with Backend API
    try {
      await fetch('/api/metrics/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    } catch {}
  }

  async resetDownloads(): Promise<void> {
    const current = this.getMetrics();
    const updated = { ...current, totalDownloads: 0 };
    localStorage.setItem('craft_ai_metrics', JSON.stringify(updated));
    localStorage.setItem('craft_ai_downloads_history', JSON.stringify([]));
    this.cachedDownloads = [];
    this.broadcast('METRICS_UPDATED', updated);
    this.broadcast('DOWNLOADS_UPDATED', []);

    if (db) {
      try {
        await setDoc(
          doc(db, 'platform_stats', 'metrics'),
          { totalDownloads: 0, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        const snap = await getDocs(collection(db, 'downloads'));
        for (const d of snap.docs) {
          try {
            await deleteDoc(d.ref);
          } catch {}
        }
      } catch {}
    }

    try {
      await fetch('/api/metrics/reset-downloads', { method: 'POST' });
    } catch {}
  }

  // --- LIVE ACTIVITY STREAM ---
  getLiveActivities(): LiveActivityEvent[] {
    const raw = localStorage.getItem('craft_ai_activities');
    return raw ? JSON.parse(raw) : [];
  }

  addLiveActivity(act: LiveActivityEvent) {
    const current = this.getLiveActivities();
    const updated = [act, ...current.slice(0, 24)];
    localStorage.setItem('craft_ai_activities', JSON.stringify(updated));
    this.broadcast('ACTIVITY_ADDED', act);
  }
}

export const realtimeStore = new RealtimeStore();
