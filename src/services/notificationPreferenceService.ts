/**
 * notificationPreferenceService.ts
 *
 * Reads and updates per-user notification preference toggles.
 */

import { supabase } from '../utils/supabaseClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  // AI
  gen_complete:       boolean;
  gen_failed:         boolean;
  ai_furniture:      boolean;
  ai_texture:        boolean;
  transcription:     boolean;
  // Social
  like_received:      boolean;
  save_received:      boolean;
  follow_received:    boolean;
  comment_received:   boolean;
  design_featured:    boolean;
  template_purchased: boolean;
  // Gamification
  streak_milestone:  boolean;
  points_awarded:    boolean;
  challenge_ending:  boolean;
  daily_goal_reached: boolean;
  level_up:          boolean;
  // Quota & Billing
  quota_warning:      boolean;
  quota_reached:      boolean;
  subscription_new:   boolean;
  payment_failed:    boolean;
  // AR & Collaboration
  ar_session_complete: boolean;
  project_shared:     boolean;
  annotation_added:   boolean;
  export_ready:       boolean;
  design_of_week:     boolean;
  // Global
  push_enabled:       boolean;
}

// ── Service ─────────────────────────────────────────────────────────────────────

export const notificationPreferenceService = {
  async getPreferences(): Promise<NotificationPreferences | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;

    // Map snake_case DB columns to camelCase
    return {
      gen_complete:       data.gen_complete       ?? true,
      gen_failed:         data.gen_failed         ?? true,
      ai_furniture:      data.ai_furniture      ?? true,
      ai_texture:        data.ai_texture        ?? true,
      transcription:     data.transcription     ?? true,
      like_received:     data.like_received     ?? true,
      save_received:     data.save_received     ?? true,
      follow_received:   data.follow_received   ?? true,
      comment_received:  data.comment_received  ?? true,
      design_featured:   data.design_featured   ?? true,
      template_purchased: data.template_purchased ?? true,
      streak_milestone: data.streak_milestone  ?? true,
      points_awarded:   data.points_awarded   ?? true,
      challenge_ending: data.challenge_ending ?? true,
      daily_goal_reached: data.daily_goal_reached ?? true,
      level_up:         data.level_up         ?? true,
      quota_warning:     data.quota_warning     ?? true,
      quota_reached:     data.quota_reached     ?? true,
      subscription_new:  data.subscription_new  ?? true,
      payment_failed:   data.payment_failed   ?? true,
      ar_session_complete: data.ar_session_complete ?? true,
      project_shared:    data.project_shared    ?? true,
      annotation_added:  data.annotation_added  ?? true,
      export_ready:      data.export_ready      ?? true,
      design_of_week:    data.design_of_week    ?? true,
      push_enabled:      data.push_enabled     ?? true,
    };
  },

  async updatePreferences(
    updates: Partial<NotificationPreferences>,
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Map camelCase to snake_case for DB
    const dbUpdates: Record<string, boolean> = {};
    const keyMap: Record<string, string> = {
      gen_complete:        'gen_complete',
      gen_failed:          'gen_failed',
      ai_furniture:       'ai_furniture',
      ai_texture:          'ai_texture',
      transcription:       'transcription',
      like_received:       'like_received',
      save_received:       'save_received',
      follow_received:     'follow_received',
      comment_received:    'comment_received',
      design_featured:     'design_featured',
      template_purchased:   'template_purchased',
      streak_milestone:   'streak_milestone',
      points_awarded:     'points_awarded',
      challenge_ending:   'challenge_ending',
      daily_goal_reached: 'daily_goal_reached',
      level_up:           'level_up',
      quota_warning:       'quota_warning',
      quota_reached:       'quota_reached',
      subscription_new:    'subscription_new',
      payment_failed:      'payment_failed',
      ar_session_complete:  'ar_session_complete',
      project_shared:      'project_shared',
      annotation_added:    'annotation_added',
      export_ready:        'export_ready',
      design_of_week:       'design_of_week',
      push_enabled:         'push_enabled',
    };

    for (const [camel, snake] of Object.entries(keyMap)) {
      if (camel in updates) {
        dbUpdates[snake] = updates[camel as keyof NotificationPreferences] as boolean;
      }
    }

    if (Object.keys(dbUpdates).length === 0) return;

    await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...dbUpdates, updated_at: new Date().toISOString() });
  },
};
