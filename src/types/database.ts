/**
 * Database TypeScript Interfaces
 * Auto-generated from supabase/migrations/*.sql
 * All tables, views, and enums used in the Asoria Supabase database.
 * UUID primary keys, ISO string dates, optional fields where NULL is allowed.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** User subscription tier — maps to subscription_tier PG enum */
export type SubscriptionTier = 'starter' | 'creator' | 'pro' | 'architect';

/** User role for admin access */
export type UserRole = 'user' | 'admin';

/** Building types supported in projects and templates */
export type BuildingType = 'house' | 'apartment' | 'office' | 'studio' | 'villa';

/** Generation type for AI generations */
export type GenerationType = 'floor_plan' | 'furniture' | 'texture';

/** Status of an AI generation job */
export type GenerationStatus = 'pending' | 'complete' | 'failed';

/** Status of an async furniture generation job */
export type FurnitureJobStatus = 'pending' | 'processing' | 'complete' | 'failed';

/** Status of an AR scan reconstruction */
export type ARScanStatus = 'processing' | 'complete' | 'failed';

/** Subscription status from Stripe */
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete';

/** Generation session status (multi-iteration design flow) */
export type GenerationSessionStatus =
  | 'pending'
  | 'generating'
  | 'scoring'
  | 'refining'
  | 'complete'
  | 'error';

/** VIGA reconstruction task status */
export type VigaTaskStatus = 'pending' | 'processing' | 'done' | 'failed';

/** VIGA task mode */
export type VigaTaskMode = 'furniture' | 'room';

/** Render job status */
export type RenderStatus = 'idle' | 'rendering' | 'done' | 'failed';

/** Notification type — all 25 notification types */
export type NotificationType =
  // AI generation (5)
  | 'generation_complete'
  | 'generation_failed'
  | 'ai_furniture_ready'
  | 'ai_texture_ready'
  | 'transcription_ready'
  // Social (6)
  | 'like_received'
  | 'save_received'
  | 'follow_received'
  | 'comment_received'
  | 'design_featured'
  | 'template_purchased'
  // Gamification (5)
  | 'streak_milestone'
  | 'points_awarded'
  | 'challenge_ending'
  | 'daily_goal_reached'
  | 'level_up'
  // Quota & Billing (4)
  | 'quota_warning'
  | 'quota_reached'
  | 'subscription_new'
  | 'payment_failed'
  // AR & Collaboration (5)
  | 'ar_session_complete'
  | 'project_shared'
  | 'annotation_added'
  | 'export_ready'
  | 'design_of_week';

/** Co-project membership role */
export type CoProjectRole = 'owner' | 'editor' | 'viewer';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  ai_generations_used: number;
  ar_scans_used: number;
  quota_reset_date: string;
  stripe_customer_id: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  push_token: string | null;
  streak_count: number;
  last_active_date: string | null;
  daily_edit_seconds_today: number;
  edit_date: string | null;
  renders_used: number;
  ai_edits_used: number;
  viga_requests_used: number;
  architect_generations_used: number;
  architect_wright_used: number;
  architect_hadid_used: number;
  architect_ando_used: number;
  architect_foster_used: number;
  architect_corbusier_used: number;
  architect_zumthor_used: number;
  architect_ingels_used: number;
  architect_kuma_used: number;
  architect_calatrava_used: number;
  architect_carle_used: number;
  architect_kahn_used: number;
  architect_koolhaas_used: number;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  user_id: string;
  name: string;
  building_type: BuildingType;
  blueprint_data: Record<string, unknown>;
  thumbnail_url: string | null;
  is_published: boolean;
  view_count: number;
  room_count: number;
  floor_count: number;
  created_at: string;
  updated_at: string;
  rendered_gltf_url: string | null;
  render_status: RenderStatus;
  render_error: string | null;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  user_id: string;
  version_number: number;
  blueprint_data: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Templates (Community / Inspo)
// ---------------------------------------------------------------------------

export interface Template {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  is_featured: boolean;
  download_count: number;
  building_type: BuildingType;
  style: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Social Tables
// ---------------------------------------------------------------------------

export interface Like {
  id: string;
  user_id: string;
  template_id: string;
  created_at: string;
}

export interface Save {
  id: string;
  user_id: string;
  template_id: string;
  created_at: string;
}

export interface Rating {
  id: string;
  user_id: string;
  template_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  template_id: string;
  parent_id: string | null;
  body: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// AR Scans
// ---------------------------------------------------------------------------

export interface ARScan {
  id: string;
  user_id: string;
  scan_data: Record<string, unknown>;
  room_type: string | null;
  dimensions: Record<string, unknown> | null;
  reconstructed_scene_url: string | null;
  created_at: string;
  frame_urls: string[];
  detected_objects: Record<string, unknown>[];
  meshy_task_id: string | null;
  mesh_url: string | null;
  room_dimensions: { width: number; height: number; depth: number };
  status: ARScanStatus;
  blueprint_data: Record<string, unknown> | null;
  label: string | null;
}

// ---------------------------------------------------------------------------
// Subscriptions (Stripe)
// ---------------------------------------------------------------------------

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// AI Generations & Furniture Jobs
// ---------------------------------------------------------------------------

export interface AIGeneration {
  id: string;
  user_id: string;
  project_id: string | null;
  generation_type: GenerationType;
  prompt: string;
  enriched_prompt: string | null;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  duration_ms: number | null;
  status: GenerationStatus;
  error_message: string | null;
  result_data: Record<string, unknown> | null;
  created_at: string;
}

export interface FurnitureJob {
  id: string;
  user_id: string;
  generation_id: string | null;
  room_id: string;
  meshy_task_id: string | null;
  status: FurnitureJobStatus;
  mesh_url: string | null;
  thumbnail_url: string | null;
  prompt: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Gamification — Points & Streaks
// ---------------------------------------------------------------------------

export interface UserPoints {
  user_id: string;
  total: number;
  updated_at: string;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  event: string;
  delta: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  gen_complete: boolean;
  gen_failed: boolean;
  ai_furniture: boolean;
  ai_texture: boolean;
  transcription: boolean;
  like_received: boolean;
  save_received: boolean;
  follow_received: boolean;
  comment_received: boolean;
  design_featured: boolean;
  template_purchased: boolean;
  streak_milestone: boolean;
  points_awarded: boolean;
  challenge_ending: boolean;
  daily_goal_reached: boolean;
  level_up: boolean;
  quota_warning: boolean;
  quota_reached: boolean;
  subscription_new: boolean;
  payment_failed: boolean;
  ar_session_complete: boolean;
  project_shared: boolean;
  annotation_added: boolean;
  export_ready: boolean;
  design_of_week: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Tier Gate Analytics
// ---------------------------------------------------------------------------

export interface TierGateAttempt {
  id: string;
  user_id: string;
  feature: string;
  attempted_at: string;
}

// ---------------------------------------------------------------------------
// Collaborative Projects
// ---------------------------------------------------------------------------

export interface CoProject {
  id: string;
  name: string;
  description: string | null;
  blueprint_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: CoProjectRole;
  invited_by: string | null;
  joined_at: string;
}

export interface CoProjectActivity {
  id: string;
  project_id: string;
  user_id: string | null;
  action:
    | 'created'
    | 'edited'
    | 'deleted'
    | 'commented'
    | 'invited'
    | 'joined'
    | 'left'
    | 'architect_suggestion';
  entity_type: string | null;
  entity_id: string | null;
  entity_snapshot: Record<string, unknown> | null;
  architect_insights: string[] | null;
  created_at: string;
}

export interface BlueprintState {
  project_id: string;
  floor_index: number;
  state: Record<string, unknown>;
  version: number;
  updated_at: string;
  updated_by: string | null;
}

// ---------------------------------------------------------------------------
// Generation Sessions (multi-iteration AI design flow)
// ---------------------------------------------------------------------------

export interface GenerationSession {
  id: string;
  user_id: string;
  status: GenerationSessionStatus;
  iteration: number;
  total_iterations: number;
  current_message: string | null;
  iteration_scores: number[];
  final_score: number | null;
  blueprint_data: Record<string, unknown> | null;
  error_message: string | null;
  consultation_session_id: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Consultation Sessions (7-step designer interview)
// ---------------------------------------------------------------------------

export interface ConsultationSession {
  id: string;
  user_id: string;
  generation_session_id: string | null;
  tier: SubscriptionTier;
  architect_id: string | null;
  conversation_history: unknown[];
  current_category: string;
  questions_asked: number;
  is_complete: boolean;
  consultation_summary: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Renders (Blender photorealistic output)
// ---------------------------------------------------------------------------

export interface Render {
  id: string;
  user_id: string;
  project_id: string | null;
  render_url: string;
  atmosphere: string;
  view_type: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Custom Furniture (Pro+ AI furniture from photos)
// ---------------------------------------------------------------------------

export interface CustomFurniture {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  category: string;
  mesh_url: string | null;
  thumbnail_url: string | null;
  source_image_url: string | null;
  dimensions: { x: number; y: number; z: number };
  style_tags: string[];
  viga_task_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// VIGA Tasks (image → 3D reconstruction)
// ---------------------------------------------------------------------------

export interface VigaTask {
  id: string;
  user_id: string;
  project_id: string | null;
  task_id: string;
  mode: VigaTaskMode;
  status: VigaTaskStatus;
  source_image_url: string | null;
  gltf_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// User AI Preferences
// ---------------------------------------------------------------------------

export interface UserAIPreferences {
  user_id: string;
  building_type: BuildingType | null;
  style_id: string | null;
  plot_size: number | null;
  plot_unit: string;
  bedrooms: number;
  bathrooms: number;
  has_pool: boolean;
  has_garden: boolean;
  has_garage: boolean;
  has_home_office: boolean;
  has_utility_room: boolean;
  last_used_at: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Onboarding Quiz
// ---------------------------------------------------------------------------

export interface UserQuizAnswer {
  id: string;
  user_id: string;
  answers: Record<string, unknown>;
  completed_at: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Contact Messages
// ---------------------------------------------------------------------------

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Tier Limits (single source of truth for quotas)
// ---------------------------------------------------------------------------

export interface TierLimit {
  tier: SubscriptionTier;
  ai_generations_per_month: number;
  ai_edits_per_month: number;
  renders_per_month: number;
  ar_scans_per_month: number;
  max_undo_steps: number;
  auto_save_seconds: number;
  viga_requests_per_month: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Architect Tiers
// ---------------------------------------------------------------------------

export interface ArchitectTier {
  architect_id: string;
  tier_required: SubscriptionTier;
  token_multiplier: number;
}

// ---------------------------------------------------------------------------
// Table Registry
// ---------------------------------------------------------------------------

export const DATABASE_TABLES: string[] = [
  'users',
  'projects',
  'project_versions',
  'templates',
  'likes',
  'saves',
  'ratings',
  'comments',
  'ar_scans',
  'subscriptions',
  'ai_generations',
  'furniture_jobs',
  'audit_logs',
  'user_points',
  'points_history',
  'notifications',
  'notification_preferences',
  'tier_gate_attempts',
  'co_projects',
  'co_project_members',
  'co_project_activity',
  'blueprint_state',
  'generation_sessions',
  'consultation_sessions',
  'renders',
  'custom_furniture',
  'viga_tasks',
  'user_ai_preferences',
  'user_quiz_answers',
  'contact_messages',
  'tier_limits',
  'architect_tiers',
];