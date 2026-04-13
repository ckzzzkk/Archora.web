export * from './blueprint';

export type SubscriptionTier = 'starter' | 'creator' | 'pro' | 'architect';
export type ViewMode = '2D' | '3D' | 'FirstPerson';
export type BuildingType = 'house' | 'apartment' | 'office' | 'studio' | 'villa' | 'commercial';
export type ArchStyle =
  // Current 12 styles
  | 'minimalist' | 'modern' | 'rustic' | 'industrial' | 'scandinavian'
  | 'mediterranean' | 'art_deco' | 'japandi' | 'bohemian' | 'coastal'
  | 'traditional' | 'contemporary'
  // Legacy values retained for backward compat with stored blueprints
  | 'luxury' | 'japanese' | 'mid_century_modern' | 'eclectic';

export type NotificationType =
  // AI generation (5)
  | 'generation_complete' | 'generation_failed'
  | 'ai_furniture_ready' | 'ai_texture_ready' | 'transcription_ready'
  // Social (6)
  | 'like_received' | 'save_received' | 'follow_received' | 'comment_received'
  | 'design_featured' | 'template_purchased'
  // Gamification (5)
  | 'streak_milestone' | 'points_awarded' | 'challenge_ending'
  | 'daily_goal_reached' | 'level_up'
  // Quota & Billing (4)
  | 'quota_warning' | 'quota_reached' | 'subscription_new' | 'payment_failed'
  // AR & Collaboration (5)
  | 'ar_session_complete' | 'project_shared' | 'annotation_added'
  | 'export_ready' | 'design_of_week';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export type PointEventKey =
  | 'DAILY_LOGIN'
  | 'CREATE_PROJECT'
  | 'FIRST_AI_GENERATION'
  | 'ONBOARDING_COMPLETE'
  | 'SHARE_DESIGN'
  | 'RECEIVE_LIKE'
  | 'COMPLETE_PROFILE'
  | 'FIRST_AR_SCAN'
  | 'EXPORT_DESIGN'
  | 'STREAK_MILESTONE'
  | 'PUBLISH_TEMPLATE'
  | 'TEMPLATE_SALE'
  | 'REFER_FRIEND';

/** Legacy alias kept for backward compat */
export type PointEvent = PointEventKey;

export interface PointEventPayload {
  event: string;
  delta: number;
}

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
  tier?: string;
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
