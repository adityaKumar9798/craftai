import React, { createContext, useContext, useState, useEffect } from 'react';
import { GeneratedCreative, Template, Category, TrendingTopic } from '../types';
import { ApiService } from '../services/api';
import { realtimeStore } from '../services/realtimeStore';
import { useAuth } from './AuthContext';
import {
  db,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  deleteDoc,
  isFirebaseConfigured,
} from '../firebase/firebase';

interface CreativesContextType {
  templates: Template[];
  categories: Category[];
  trendingTopics: TrendingTopic[];
  creations: GeneratedCreative[];
  favorites: string[];
  downloadsCount: number;
  isFavorite: (templateId: string) => boolean;
  toggleFavorite: (templateId: string) => Promise<void>;
  recordDownload: (
    target?: string | {
      templateId?: string;
      templateName?: string;
      category?: string;
      type?: 'image' | 'video';
      format?: 'story' | 'post';
    },
    templateName?: string,
    category?: string
  ) => Promise<void>;
  saveCreation: (payload: {
    templateId: string;
    templateName: string;
    category: string;
    outputUrl: string;
    type?: 'image' | 'video';
  }) => Promise<GeneratedCreative>;
  deleteCreation: (id: string) => Promise<void>;
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => Promise<Template>;
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTrendingTopic: (topic: Omit<TrendingTopic, 'id'>) => Promise<TrendingTopic>;
  updateTrendingTopic: (id: string, updates: Partial<TrendingTopic>) => Promise<void>;
  deleteTrendingTopic: (id: string) => Promise<void>;
}

const CreativesContext = createContext<CreativesContextType | undefined>(undefined);

export const CreativesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>(() => realtimeStore.getTemplates());
  const [categories, setCategories] = useState<Category[]>(() => realtimeStore.getCategories());
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);

  // Per-user isolated state
  const [creations, setCreations] = useState<GeneratedCreative[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [downloadsCount, setDownloadsCount] = useState<number>(0);

  // Sync templates, categories and global real-time events
  useEffect(() => {
    const unsubscribe = realtimeStore.subscribe((event) => {
      if (event.type === 'TEMPLATES_UPDATED') {
        setTemplates(event.payload);
      } else if (event.type === 'CATEGORIES_UPDATED') {
        setCategories(event.payload);
      } else if (event.type === 'TOPICS_UPDATED') {
        setTrendingTopics(event.payload);
      }
    });

    ApiService.getCategories().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    }).catch(() => {});

    ApiService.getTemplates().then((tmpls) => {
      if (tmpls && tmpls.length > 0) setTemplates(tmpls);
    }).catch(() => {});

    return () => unsubscribe();
  }, []);

  // Sync user-specific Creations, Favorites & Downloads in Real-time from Firebase
  useEffect(() => {
    if (!user || !user.uid) {
      setCreations([]);
      setFavorites([]);
      setDownloadsCount(0);
      return;
    }

    const uid = user.uid;

    // 1. Initial load from user-specific local cache for instant zero-flicker UI
    try {
      const cachedFavs = localStorage.getItem(`craft_ai_favorites_${uid}`);
      if (cachedFavs) setFavorites(JSON.parse(cachedFavs));
      else setFavorites([]);

      const cachedCreations = localStorage.getItem(`craft_ai_creations_${uid}`);
      if (cachedCreations) setCreations(JSON.parse(cachedCreations));
      else setCreations([]);

      const cachedDownloads = localStorage.getItem(`craft_ai_downloads_${uid}`);
      if (cachedDownloads) setDownloadsCount(Number(cachedDownloads) || 0);
      else setDownloadsCount(0);
    } catch {}

    // 2. Real-time Firebase Firestore User Document Listener (Favorites & Downloads)
    let unsubUserDoc: (() => void) | null = null;
    let unsubCreations: (() => void) | null = null;

    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', uid);
        unsubUserDoc = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data.favorites)) {
              setFavorites(data.favorites);
              localStorage.setItem(`craft_ai_favorites_${uid}`, JSON.stringify(data.favorites));
            }
            if (typeof data.downloadsCount === 'number') {
              setDownloadsCount(data.downloadsCount);
              localStorage.setItem(`craft_ai_downloads_${uid}`, String(data.downloadsCount));
            }
          }
        }, (err) => console.warn('[CreativesContext] User doc listener notice:', err));

        // 3. Real-time Firebase Firestore Creations Listener
        const creationsColRef = collection(db, 'users', uid, 'creations');
        unsubCreations = onSnapshot(creationsColRef, (snapshot) => {
          const items: GeneratedCreative[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() } as GeneratedCreative);
          });
          // Sort newest first
          items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setCreations(items);
          localStorage.setItem(`craft_ai_creations_${uid}`, JSON.stringify(items));
        }, (err) => console.warn('[CreativesContext] Creations listener notice:', err));
      } catch (err) {
        console.warn('[CreativesContext] Firestore setup error:', err);
      }
    }

    // Also fetch from backend API if available
    if (token) {
      ApiService.getUserCreatives(token).then((data) => {
        if (data && Array.isArray(data)) {
          setCreations(data);
          localStorage.setItem(`craft_ai_creations_${uid}`, JSON.stringify(data));
        }
      }).catch(() => {});
    }

    return () => {
      if (unsubUserDoc) unsubUserDoc();
      if (unsubCreations) unsubCreations();
    };
  }, [user?.uid, token]);

  const isFavorite = (templateId: string) => favorites.includes(templateId);

  const toggleFavorite = async (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    const willBeFav = !favorites.includes(templateId);
    const updated = willBeFav
      ? [...favorites, templateId]
      : favorites.filter((id) => id !== templateId);

    setFavorites(updated);

    if (user?.uid) {
      localStorage.setItem(`craft_ai_favorites_${user.uid}`, JSON.stringify(updated));

      // Save directly to Firebase Firestore
      if (isFirebaseConfigured && db) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            favorites: updated,
            favoritesCount: updated.length,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (e) {
          console.warn('[CreativesContext] Failed to sync favorite to Firebase:', e);
        }
      }
    }

    if (willBeFav && tmpl) {
      realtimeStore.addLiveActivity({
        id: `fav_${Date.now()}`,
        type: 'favorite',
        userName: user?.name || 'Creator',
        templateName: tmpl.name,
        category: tmpl.category,
        timestamp: 'Just now',
      });
    }
  };

  const recordDownload = async (
    target?: string | {
      templateId?: string;
      templateName?: string;
      category?: string;
      type?: 'image' | 'video';
      format?: 'story' | 'post';
    },
    explicitName?: string,
    explicitCategory?: string
  ) => {
    let tId = typeof target === 'string' ? target : target?.templateId;
    let tName = typeof target === 'object' ? target.templateName : explicitName;
    let tCat = typeof target === 'object' ? target.category : explicitCategory;
    let tType = typeof target === 'object' ? target.type : 'image';
    let tFormat = typeof target === 'object' ? target.format : 'story';

    // If templateId provided, lookup template for richer metadata
    if (tId && (!tName || !tCat)) {
      const found = templates.find((t) => t.id === tId);
      if (found) {
        tName = tName || found.name;
        tCat = tCat || found.category;
        tType = found.type || tType;
        tFormat = (found.format as any) || tFormat;
      }
    }

    const nextCount = downloadsCount + 1;
    setDownloadsCount(nextCount);

    if (user?.uid) {
      localStorage.setItem(`craft_ai_downloads_${user.uid}`, String(nextCount));

      // Persist to Firebase Firestore under user
      if (isFirebaseConfigured && db) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            downloadsCount: nextCount,
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          const downloadLogRef = doc(collection(db, 'users', user.uid, 'downloads'));
          await setDoc(downloadLogRef, {
            id: downloadLogRef.id,
            templateId: tId || 'custom',
            templateName: tName || 'Custom Creative',
            category: tCat || 'General',
            downloadedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('[CreativesContext] Failed to sync download count to Firebase:', e);
        }
      }
    }

    // Call RealtimeStore to update global metric, live activity, firestore global stats and broadcast to admin
    await realtimeStore.recordDownload({
      templateId: tId,
      templateName: tName || 'Story Creative',
      category: tCat || 'General',
      type: tType as any,
      format: tFormat as any,
      userName: user?.name || 'Guest Creator',
      userEmail: user?.email || '',
      userPhotoUrl: user?.photoUrl || '',
      userId: user?.uid || 'guest',
    });
  };

  const saveCreation = async (payload: {
    templateId: string;
    templateName: string;
    category: string;
    outputUrl: string;
    type?: 'image' | 'video';
  }): Promise<GeneratedCreative> => {
    const tmpl = templates.find((t) => t.id === payload.templateId);
    // Sanitize outputUrl for persistence to avoid QuotaExceededError with 5MB base64 strings
    const safeStorageUrl =
      payload.outputUrl && payload.outputUrl.length < 2000 && !payload.outputUrl.startsWith('blob:')
        ? payload.outputUrl
        : tmpl?.assetUrl || tmpl?.thumbnailUrl || 'custom_creative';

    const creativeId = `crt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newCreative: GeneratedCreative = {
      id: creativeId,
      userId: user?.uid || 'anonymous',
      templateId: payload.templateId,
      templateName: payload.templateName,
      category: payload.category,
      outputUrl: safeStorageUrl,
      type: payload.type || 'image',
      createdAt: new Date().toISOString(),
    };

    // Update state immediately
    setCreations((prev) => {
      const next = [newCreative, ...prev];
      if (user?.uid) {
        try {
          localStorage.setItem(`craft_ai_creations_${user.uid}`, JSON.stringify(next));
        } catch (storageErr) {
          console.warn('[CreativesContext] LocalStorage quota notice:', storageErr);
        }
      }
      return next;
    });

    // Save to Firebase Firestore under user's creations collection
    if (user?.uid && isFirebaseConfigured && db) {
      try {
        const creationDocRef = doc(db, 'users', user.uid, 'creations', creativeId);
        await setDoc(creationDocRef, newCreative);

        // Update creationsCount on user profile
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          creationsCount: creations.length + 1,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (e) {
        console.warn('[CreativesContext] Failed to save creation to Firebase:', e);
      }
    }

    // Call API service as well
    try {
      await ApiService.saveCreative({ ...payload, outputUrl: safeStorageUrl }, token || undefined);
    } catch {}

    realtimeStore.addLiveActivity({
      id: `act_${Date.now()}`,
      type: 'create',
      userName: user?.name || 'Creator',
      templateName: payload.templateName,
      category: payload.category,
      timestamp: 'Just now',
    });

    return newCreative;
  };

  const deleteCreation = async (id: string) => {
    setCreations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (user?.uid) {
        localStorage.setItem(`craft_ai_creations_${user.uid}`, JSON.stringify(next));
      }
      return next;
    });

    if (user?.uid && isFirebaseConfigured && db) {
      try {
        const creationDocRef = doc(db, 'users', user.uid, 'creations', id);
        await deleteDoc(creationDocRef);

        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          creationsCount: Math.max(0, creations.length - 1),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (e) {
        console.warn('[CreativesContext] Failed to delete creation from Firebase:', e);
      }
    }

    try {
      await ApiService.deleteCreative(id, token || undefined);
    } catch {}
  };

  const addTemplate = async (templateData: Omit<Template, 'id' | 'createdAt'>): Promise<Template> => {
    return await realtimeStore.addTemplate(templateData);
  };

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    await realtimeStore.updateTemplate(id, updates);
  };

  const deleteTemplate = async (id: string) => {
    await realtimeStore.deleteTemplate(id);
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
    return await realtimeStore.addCategory(categoryData);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await realtimeStore.updateCategory(id, updates);
  };

  const deleteCategory = async (id: string) => {
    await realtimeStore.deleteCategory(id);
  };

  const addTrendingTopic = async (topicData: Omit<TrendingTopic, 'id'>): Promise<TrendingTopic> => {
    return await realtimeStore.addTrendingTopic(topicData);
  };

  const updateTrendingTopic = async (id: string, updates: Partial<TrendingTopic>) => {
    await realtimeStore.updateTrendingTopic(id, updates);
  };

  const deleteTrendingTopic = async (id: string) => {
    await realtimeStore.deleteTrendingTopic(id);
  };

  return (
    <CreativesContext.Provider
      value={{
        templates,
        categories,
        trendingTopics,
        creations,
        favorites,
        downloadsCount,
        isFavorite,
        toggleFavorite,
        recordDownload,
        saveCreation,
        deleteCreation,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        addCategory,
        updateCategory,
        deleteCategory,
        addTrendingTopic,
        updateTrendingTopic,
        deleteTrendingTopic,
      }}
    >
      {children}
    </CreativesContext.Provider>
  );
};

export const useCreatives = () => {
  const context = useContext(CreativesContext);
  if (!context) throw new Error('useCreatives must be used within a CreativesProvider');
  return context;
};

