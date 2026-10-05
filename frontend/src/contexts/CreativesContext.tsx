import React, { createContext, useContext, useState, useEffect } from 'react';
import { GeneratedCreative, Template, Category, TrendingTopic } from '../types';

import { ApiService } from '../services/api';
import { realtimeStore } from '../services/realtimeStore';
import { useAuth } from './AuthContext';

interface CreativesContextType {
  templates: Template[];
  categories: Category[];
  trendingTopics: TrendingTopic[];
  creations: GeneratedCreative[];
  favorites: string[];
  isFavorite: (templateId: string) => boolean;
  toggleFavorite: (templateId: string) => Promise<void>;
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
  const [creations, setCreations] = useState<GeneratedCreative[]>(() => {
    const saved = localStorage.getItem('craft_ai_creations');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('craft_ai_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // Listen to real-time events across tabs & store
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
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    }).catch(() => {});
    ApiService.getTemplates().then((tmpls) => {
      if (tmpls && tmpls.length > 0) {
        setTemplates(tmpls);
      }
    }).catch(() => {});

    if (token) {
      ApiService.getUserCreatives(token).then((data) => {
        if (data && data.length > 0) setCreations(data);
      }).catch(() => {});
    }

    return () => unsubscribe();
  }, [token]);

  const isFavorite = (templateId: string) => favorites.includes(templateId);

  const toggleFavorite = async (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    setFavorites((prev) => {
      const willBeFav = !prev.includes(templateId);
      const next = willBeFav
        ? [...prev, templateId]
        : prev.filter((id) => id !== templateId);
      localStorage.setItem('craft_ai_favorites', JSON.stringify(next));

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
      return next;
    });
  };

  const saveCreation = async (payload: {
    templateId: string;
    templateName: string;
    category: string;
    outputUrl: string;
    type?: 'image' | 'video';
  }) => {
    const savedItem = await ApiService.saveCreative(payload, token || undefined);
    setCreations((prev) => {
      const next = [savedItem, ...prev];
      localStorage.setItem('craft_ai_creations', JSON.stringify(next));
      return next;
    });

    realtimeStore.updateMetrics({ totalDownloads: 1 });
    realtimeStore.addLiveActivity({
      id: `act_${Date.now()}`,
      type: 'download',
      userName: user?.name || 'Aditya Kumar',
      templateName: payload.templateName,
      category: payload.category,
      timestamp: 'Just now',
    });

    return savedItem;
  };

  const deleteCreation = async (id: string) => {
    await ApiService.deleteCreative(id, token || undefined);
    setCreations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem('craft_ai_creations', JSON.stringify(next));
      return next;
    });
  };

  const addTemplate = async (templateData: Omit<Template, 'id' | 'createdAt'>): Promise<Template> => {
    const created = await realtimeStore.addTemplate(templateData);
    return created;
  };

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    await realtimeStore.updateTemplate(id, updates);
  };

  const deleteTemplate = async (id: string) => {
    await realtimeStore.deleteTemplate(id);
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
    const created = await realtimeStore.addCategory(categoryData);
    return created;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await realtimeStore.updateCategory(id, updates);
  };

  const deleteCategory = async (id: string) => {
    await realtimeStore.deleteCategory(id);
  };

  const addTrendingTopic = async (topicData: Omit<TrendingTopic, 'id'>): Promise<TrendingTopic> => {
    const created = await realtimeStore.addTrendingTopic(topicData);
    // State will update via the TOPICS_UPDATED event from onSnapshot
    return created;
  };

  const updateTrendingTopic = async (id: string, updates: Partial<TrendingTopic>) => {
    await realtimeStore.updateTrendingTopic(id, updates);
    // State will update via the TOPICS_UPDATED event from onSnapshot
  };

  const deleteTrendingTopic = async (id: string) => {
    await realtimeStore.deleteTrendingTopic(id);
    // State will update via the TOPICS_UPDATED event from onSnapshot
  };

  return (
    <CreativesContext.Provider
      value={{
        templates,
        categories,
        trendingTopics,
        creations,
        favorites,
        isFavorite,
        toggleFavorite,
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
