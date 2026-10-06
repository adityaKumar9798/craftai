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
  type: 'image' | 'video';
  width: number;
  height: number;
  thumbnailUrl: string;
  assetUrl: string;
  videoUrl?: string;
  duration?: number;
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
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
  processedPhotoUrl?: string;
  role: 'user' | 'admin';
  createdAt: string;
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

export interface Favorite {
  id: string;
  userId: string;
  templateId: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
