export * from './blueprint';

export type SubscriptionTier = 'starter' | 'creator' | 'architect';
export type ViewMode = '2D' | '3D' | 'FirstPerson';
export type BuildingType = 'house' | 'apartment' | 'office' | 'studio' | 'villa';
export type ArchStyle =
  | 'minimalist' | 'modern' | 'scandinavian' | 'industrial'
  | 'bohemian' | 'luxury' | 'rustic' | 'coastal'
  | 'japanese' | 'art_deco' | 'mid_century_modern' | 'eclectic'
  | 'traditional' | 'mediterranean'; // legacy values retained

export type NotificationType =
  | 'like_received'
  | 'save_received'
  | 'follow_received'
  | 'comment_received'
  | 'streak_milestone'
  | 'points_awarded'
  | 'quota_warning'
  | 'quota_reached'
  | 'design_of_week'
  | 'challenge_ending';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export type PointEvent =
  | 'DAILY_LOGIN'
  | 'CREATE_PROJECT'
  | 'COMPLETE_PROJECT'
  | 'PUBLISH_TEMPLATE'
  | 'RECEIVE_LIKE'
  | 'RECEIVE_SAVE'
  | 'RATE_DESIGN'
  | 'COMPLETE_ONBOARDING'
  | 'STREAK_7_DAY'
  | 'STREAK_30_DAY'
  | 'FIRST_AI_GENERATION'
  | 'FIRST_AR_SCAN'
  | 'FIRST_WALKTHROUGH';

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
  pointsTotal: number;
  streakCount: number;
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
