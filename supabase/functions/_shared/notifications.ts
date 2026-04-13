/**
 * _shared/notifications.ts
 *
 * Shared helper used by all Edge Functions to send in-app + push notifications.
 *
 * Flow:
 *  1. Check notification_preferences for the user (push_enabled + per-type toggle)
 *  2. Insert into the notifications table (always — in-app)
 *  3. If push enabled and Expo push token exists → send Expo push
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type NotificationType =
  | 'generation_complete' | 'generation_failed'
  | 'ai_furniture_ready' | 'ai_texture_ready' | 'transcription_ready'
  | 'like_received' | 'save_received' | 'follow_received' | 'comment_received'
  | 'design_featured' | 'template_purchased'
  | 'streak_milestone' | 'points_awarded' | 'challenge_ending'
  | 'daily_goal_reached' | 'level_up'
  | 'quota_warning' | 'quota_reached' | 'subscription_new' | 'payment_failed'
  | 'ar_session_complete' | 'project_shared' | 'annotation_added'
  | 'export_ready' | 'design_of_week';

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  pushTitle?: string;
  pushBody?: string;
  /** e.g. { screen: 'Workspace', params: { projectId: 'xxx' }} */
  pushData?: Record<string, string>;
}

// ── Push title/body defaults by type ───────────────────────────────────────────

const DEFAULT_PUSH: Record<NotificationType, { title: string; body: string }> = {
  generation_complete:  { title: 'Your design is ready! 🎨',       body: 'Your AI-generated floor plan is complete.' },
  generation_failed:    { title: 'Generation hit a snag ⚠️',        body: 'Your floor plan couldn\'t be created. Tap to try again.' },
  ai_furniture_ready:  { title: 'Custom furniture ready 🪑',        body: 'Your AI-generated furniture model is ready to place.' },
  ai_texture_ready:    { title: 'Custom texture ready 🎨',          body: 'Your AI-generated texture is applied to your project.' },
  transcription_ready:{ title: 'Voice note transcribed 🎙️',         body: 'Your voice note has been converted to text.' },
  like_received:       { title: 'Someone liked your design ❤️',         body: 'Your design got a new like!' },
  save_received:       { title: 'Your design was saved 🔖',            body: 'Someone saved your design to their collection.' },
  follow_received:     { title: 'New follower 👤',                    body: 'You have a new follower.' },
  comment_received:    { title: 'New comment on your design 💬',        body: 'Someone commented on your design.' },
  design_featured:     { title: 'Your design is trending! 🔥',         body: 'Your design was featured in the community feed.' },
  template_purchased:  { title: 'Template sold! 💰',                   body: 'Someone purchased your template.' },
  streak_milestone:    { title: 'Streak milestone 🔥',                body: 'You reached a new streak milestone!' },
  points_awarded:     { title: 'Points earned ✨',                    body: 'You received points for your activity.' },
  challenge_ending:    { title: 'Challenge ending soon ⏰',             body: 'A daily challenge expires soon — check it out!' },
  daily_goal_reached:  { title: 'Daily goal reached 🎯',               body: 'You completed today\'s editing goal. Keep it up!' },
  level_up:           { title: 'Level up! ⬆️',                     body: 'You\'ve reached a new user level.' },
  quota_warning:       { title: 'Quota running low ⚡',                body: 'You\'ve used 80% of your AI generation quota.' },
  quota_reached:       { title: 'Quota reached 🚫',                    body: 'You\'ve reached your AI generation quota for this month.' },
  subscription_new:     { title: 'Welcome to Asoria Pro! 🚀',           body: 'Your subscription is now active.' },
  payment_failed:      { title: 'Payment issue 💳',                    body: 'We couldn\'t charge your card. Please update your payment details.' },
  ar_session_complete: { title: 'AR scan ready 📐',                   body: 'Your AR room scan has been processed.' },
  project_shared:      { title: 'Project shared with you 📂',          body: 'A collaborator shared a project with you.' },
  annotation_added:     { title: 'New comment on your project 💬',       body: 'A collaborator added an annotation to your blueprint.' },
  export_ready:        { title: 'Export ready ⬇️',                    body: 'Your CAD/PDF export is ready to download.' },
  design_of_week:      { title: 'Design of the Week 🏆',               body: 'Your design was featured as Design of the Week!' },
};

// ── Main function ────────────────────────────────────────────────────────────────

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const expoPushSecret = Deno.env.get('EXPO_PUSH_SECRET');

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const {
    userId,
    type,
    payload,
    pushTitle = DEFAULT_PUSH[type]?.title,
    pushBody = DEFAULT_PUSH[type]?.body,
    pushData = {},
  } = params;

  // 1. Fetch user push token + notification preferences
  const [{ data: userData, error: userErr }, { data: prefsData, error: prefsErr }] = await Promise.all([
    admin.from('users').select('push_token').eq('id', userId).single(),
    admin.from('notification_preferences').select('*').eq('user_id', userId).single(),
  ]);

  if (userErr || !userData) {
    console.warn('[sendNotification] user not found:', userErr?.message);
    return;
  }

  // 2. Always insert in-app notification (preference check is for push only)
  const { error: insertErr } = await admin.from('notifications').insert({
    user_id: userId,
    type,
    payload,
  });
  if (insertErr) {
    console.error('[sendNotification] failed to insert:', insertErr.message);
  }

  // 3. Check preferences for push
  const prefs = prefsData as Record<string, boolean> | null;
  const pushEnabled = prefs?.push_enabled !== false;
  const typeEnabled = prefs?.[type] !== false;

  if (!pushEnabled || !typeEnabled) {
    console.info(`[sendNotification] push disabled for user=${userId} type=${type}`);
    return;
  }

  // 4. Send Expo push if token + secret available
  const pushToken = userData.push_token;
  if (!pushToken || !expoPushSecret) {
    // In-app notification already sent — push token not registered yet, that's fine
    return;
  }

  const pushPayload: unknown[] = [{
    to: pushToken,
    title: pushTitle,
    body: pushBody,
    data: { type, ...pushData },
    sound: 'default',
    priority: 'high',
  }];

  const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${expoPushSecret}`,
    },
    body: JSON.stringify(pushPayload),
  });

  if (!pushRes.ok) {
    const detail = await pushRes.text();
    console.warn('[sendNotification] Expo push failed:', pushRes.status, detail);
  }
}
