// This file is intentionally empty.
// All data (templates, categories, trending topics) is loaded from Firebase Firestore.
// No demo/hardcoded data — Firestore is the single source of truth.

import { Category, Template, TrendingTopic } from '../types';

export const INITIAL_CATEGORIES: Category[] = [];
export const INITIAL_TRENDING_TOPICS: TrendingTopic[] = [];
export const INITIAL_TEMPLATES: Template[] = [];

export const DEFAULT_USER_PHOTO = '';
