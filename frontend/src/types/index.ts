export type ReligionType = 'hindu' | 'muslim' | 'sikh' | 'christian';

export interface SubjectSlot {
  x: number; // normalized 0 to 1
  y: number; // normalized 0 to 1
  width: number; // normalized 0 to 1
  height: number; // normalized 0 to 1
  fit: 'contain' | 'cover';
  removeBackground: boolean;
  rotation?: number;
  borderRadius?: number;
  shape?: 'circle' | 'rounded' | 'rectangle';
  frameStyle?: 'gold' | 'neon' | 'glass' | 'none';
  maskUrl?: string;
  shadow?: boolean;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  religion?: ReligionType | 'all' | string;
  type: 'image' | 'video';
  format?: 'story' | 'post';
  width: number;
  height: number;
  thumbnailUrl: string;
  assetUrl: string;
  videoUrl?: string;
  duration?: number;
  headline?: string;
  subheadline?: string;
  quote?: string;
  themeColor?: string;
  badgeText?: string;
  subjectSlot: SubjectSlot;
  isPremium: boolean;
  isPublished: boolean;
  tags?: string[];
  downloadsCount?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  backgroundColor: string;
  accentColor: string;
  templateCount: number;
  order: number;
  isPublished: boolean;
  religion?: ReligionType | 'all';
}

export interface TrendingTopic {
  id: string;
  name: string;
  slug: string;
  icon: string;
  isPublished: boolean;
  order: number;
  createdAt?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string; // @username e.g. @aditya_01
  religion?: ReligionType;
  privacyAccepted?: boolean;
  onboardingCompleted?: boolean;
  email: string;
  photoUrl: string;
  processedPhotoUrl?: string;
  role: 'user' | 'admin';
  plan?: string;
  downloadsCount?: number;
  creationsCount?: number;
  favoritesCount?: number;
  favorites?: string[];
  createdAt: string;
  lastLoginAt?: string;
  updatedAt?: string;
}

export interface GeneratedCreative {
  id: string;
  userId: string;
  templateId: string;
  templateName: string;
  category: string;
  outputUrl: string;
  type: 'image' | 'video';
  createdAt: string;
}

