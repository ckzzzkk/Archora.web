export * from './blueprint';

export type SubscriptionTier = 'starter' | 'creator' | 'architect';
export type ViewMode = '2D' | '3D' | 'FirstPerson';
export type BuildingType = 'house' | 'apartment' | 'office' | 'studio' | 'villa';
export type ArchStyle =
  | 'modern' | 'traditional' | 'scandinavian'
  | 'industrial' | 'minimalist' | 'mediterranean';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  subscriptionTier: SubscriptionTier;
  aiGenerationsUsed: number;
  arScansUsed: number;
  quotaResetDate: string;
  stripeCustomerId: string | null;
  role: 'user' | 'admin';
}

export interface Template {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  price: number;
  isFeatured: boolean;
  downloadCount: number;
  buildingType: string;
  style: string | null;
  likeCount: number;
  saveCount: number;
  avgRating: number;
  ratingCount: number;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  isLiked: boolean;
  isSaved: boolean;
  userRating: number | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  templateId: string;
  parentId: string | null;
  body: string;
  isDeleted: boolean;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  buildingType: BuildingType;
  blueprintData: import('./blueprint').BlueprintData;
  thumbnailUrl: string | null;
  isPublished: boolean;
  viewCount: number;
  roomCount: number;
  createdAt: string;
  updatedAt: string;
}
