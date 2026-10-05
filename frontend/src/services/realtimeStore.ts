import { Template, Category, UserProfile, TrendingTopic } from '../types';
import { db, collection, getDocs, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from '../firebase/firebase';

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

class RealtimeStore {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: { type: string; payload: any }) => void> = new Set();
  private cachedTemplates: Template[] = [];
  private cachedCategories: Category[] = [];
  private cachedTopics: TrendingTopic[] = [];
  private topicsLoaded = false;

  constructor() {
    // Clear ALL stale/demo localStorage data — Firestore is sole source of truth
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
        // Remove all demo-data caches — Firestore replaces them on load
        localStorage.removeItem('craft_ai_templates');
        localStorage.removeItem('craft_ai_trending_topics');
        localStorage.removeItem('craft_ai_metrics');
        localStorage.removeItem('craft_ai_activities');
      }
    } catch {}

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('craft_ai_realtime_channel');
      this.channel.onmessage = (msg) => {
        if (msg.data?.type === 'TOPICS_UPDATED') {
          this.cachedTopics = msg.data.payload || [];
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
        }
      });
    }

    // Start real-time listeners
    this.listenToRealFirestoreUsers();
    this.listenToFirestoreTemplates();
    this.listenToFirestoreCategories();
    this.listenToFirestoreTopics();
  }

  // --- Backend API polling for topics (bypasses Firestore security rules) ---
  private topicsPollTimer: ReturnType<typeof setInterval> | null = null;

  private async fetchTopicsFromAPI() {
    try {
      const res = await fetch('/api/trending');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const topics: TrendingTopic[] = data.data;
          topics.sort((a, b) => (a.order || 0) - (b.order || 0));
          this.cachedTopics = topics;
          this.topicsLoaded = true;
          this.broadcast('TOPICS_UPDATED', topics);
          console.log('[RealtimeStore] Topics synced from API:', topics.length, 'items');
        }
      }
    } catch (e) {
      console.warn('[RealtimeStore] Could not fetch trending topics from API:', e);
    }
  }

  private listenToFirestoreTopics() {
    // Initial fetch
    this.fetchTopicsFromAPI();
    // Poll every 5 seconds for near-real-time sync
    this.topicsPollTimer = setInterval(() => {
      this.fetchTopicsFromAPI();
    }, 5000);
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
        // Sort newest first
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

  // --- Firestore real-time listener for categories ---
  private listenToFirestoreCategories() {
    if (!db) return;
    try {
      onSnapshot(collection(db, 'categories'), (snapshot) => {
        const categories: Category[] = [];
        snapshot.forEach((d) => {
          categories.push({ id: d.id, ...d.data() } as Category);
        });
        categories.sort((a, b) => a.order - b.order);
        this.cachedCategories = categories;
        this.broadcast('CATEGORIES_UPDATED', categories);
      }, (err) => {
        console.warn('[RealtimeStore] Firestore categories listener error:', err.message);
      });
    } catch (e) {
      console.warn('[RealtimeStore] Could not start Firestore categories listener:', e);
    }
  }

  private listenToRealFirestoreUsers() {
    const fetchBackendUsers = async () => {
      try {
        const res = await fetch('/api/users/list');
        if (res.ok) {
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
            // Filter out any mock dummy test IDs
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
    return this.cachedCategories;
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const newCat: Category = {
      ...category,
      id: `cat-${category.slug || Date.now()}`,
    };
    if (db) {
      await setDoc(doc(db, 'categories', newCat.id), newCat);
    } else {
      this.cachedCategories = [...this.cachedCategories, newCat].sort((a, b) => a.order - b.order);
      this.broadcast('CATEGORIES_UPDATED', this.cachedCategories);
    }
    return newCat;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    if (db) {
      await updateDoc(doc(db, 'categories', id), updates as any);
    }
    const idx = this.cachedCategories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.cachedCategories[idx] = { ...this.cachedCategories[idx], ...updates };
      this.cachedCategories.sort((a, b) => a.order - b.order);
      this.broadcast('CATEGORIES_UPDATED', this.cachedCategories);
      return this.cachedCategories[idx];
    }
    return null;
  }

  async deleteCategory(id: string): Promise<boolean> {
    if (db) {
      await deleteDoc(doc(db, 'categories', id));
    }
    const prev = this.cachedCategories.length;
    this.cachedCategories = this.cachedCategories.filter((c) => c.id !== id);
    this.broadcast('CATEGORIES_UPDATED', this.cachedCategories);
    return this.cachedCategories.length < prev;
  }

  // --- TRENDING TOPICS (Firestore is single source of truth) ---
  getTrendingTopics(): TrendingTopic[] {
    // Return in-memory Firestore-synced cache directly
    return this.cachedTopics;
  }

  private getAuthToken(): string | null {
    try {
      // Try to get auth token from localStorage (set by AuthContext)
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

    // Optimistic update for instant UI feedback
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
        console.log('[API] Trending topic created:', created.id);
        // Re-fetch to get real server state
        await this.fetchTopicsFromAPI();
        return created;
      } else {
        console.warn('[API] Failed to create topic:', res.status, await res.text());
      }
    } catch (e) {
      console.warn('[API] Topic create error:', e);
    }

    return optimistic;
  }

  async updateTrendingTopic(id: string, updates: Partial<TrendingTopic>): Promise<TrendingTopic | null> {
    // Optimistic update
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
    } catch (e) {
      console.warn('[API] Topic update error:', e);
    }

    return updated;
  }

  async deleteTrendingTopic(id: string): Promise<boolean> {
    // Optimistic update — remove immediately from cache
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
        console.log('[API] Trending topic deleted:', id);
        // Re-fetch to confirm server state
        await this.fetchTopicsFromAPI();
        return true;
      } else {
        console.warn('[API] Failed to delete topic:', res.status);
      }
    } catch (e) {
      console.warn('[API] Topic delete error:', e);
    }

    return true;
  }

  // --- TEMPLATES (Firestore as source of truth) ---
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
      console.log('[Firestore] Template saved:', newTmpl.id);
    } else {
      // Offline fallback: update cache directly
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
      console.log('[Firestore] Template updated:', id);
    }
    // Update local cache
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
      console.log('[Firestore] Template deleted:', id);
    }
    // Update local cache
    const prev = this.cachedTemplates.length;
    this.cachedTemplates = this.cachedTemplates.filter((t) => t.id !== id);
    this.broadcast('TEMPLATES_UPDATED', this.cachedTemplates);
    return this.cachedTemplates.length < prev;
  }

  // --- USERS (Real Firestore Users) ---
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

    // 1. Save directly to Firebase Firestore client
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
        console.log('[Firestore] User document saved to database:', user.uid);
      }
    } catch (e) {
      console.warn('[Firestore Client] Notice (handled):', e);
    }

    // 2. Also sync to backend Admin SDK
    try {
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch {}

    // 3. Local reactive state update
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
    } catch (e) {
      console.warn('[Firestore] Role update notice:', e);
    }

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
    } catch (e) {
      console.warn('[Firestore] Delete user notice:', e);
    }

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
    } catch (e) {
      console.warn('[Firestore] Clear all users notice:', e);
    }

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
          ...parsed,
          totalUsers: this.getUsers().length,
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

  updateMetrics(delta: Partial<PlatformMetrics>) {
    const current = this.getMetrics();
    const updated = {
      ...current,
      totalTemplates: this.getTemplates().length,
      totalUsers: delta.totalUsers !== undefined ? delta.totalUsers : (current.totalUsers + (delta.totalUsers || 0)),
      totalDownloads: current.totalDownloads + (delta.totalDownloads || 0),
      totalShares: current.totalShares + (delta.totalShares || 0),
      activeNow: Math.max(1, (delta.activeNow !== undefined ? delta.activeNow : current.activeNow)),
    };
    localStorage.setItem('craft_ai_metrics', JSON.stringify(updated));
    this.broadcast('METRICS_UPDATED', updated);
    return updated;
  }

  // --- LIVE ACTIVITY STREAM (Real user actions only) ---
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
