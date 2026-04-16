/**
 * pushNotificationService.ts
 *
 * Handles Expo Push Notification lifecycle:
 * - Permission request
 * - Token registration with backend
 * - Notification received / tap routing
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Must be set before using the service
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Types ────────────────────────────────────────────────────────────────────

export interface NotificationRoute {
  screen: string;
  params?: Record<string, string | number | boolean>;
}

const ROUTE_MAP: Record<string, NotificationRoute> = {
  generation_complete:  { screen: 'Workspace' },
  generation_failed:    { screen: 'Generation' },
  ai_furniture_ready:  { screen: 'Workspace' },
  ai_texture_ready:    { screen: 'Workspace' },
  transcription_ready:  { screen: 'Generation' },
  like_received:       { screen: 'TemplateDetail' },
  save_received:       { screen: 'TemplateDetail' },
  follow_received:     { screen: 'Feed' },
  comment_received:    { screen: 'TemplateDetail' },
  design_featured:     { screen: 'Feed' },
  template_purchased:  { screen: 'Account' },
  streak_milestone:  { screen: 'Account' },
  points_awarded:     { screen: 'Account' },
  challenge_ending:   { screen: 'Dashboard' },
  daily_goal_reached: { screen: 'Dashboard' },
  level_up:           { screen: 'Account' },
  quota_warning:      { screen: 'Subscription' },
  quota_reached:      { screen: 'Subscription' },
  subscription_new:   { screen: 'Account' },
  payment_failed:     { screen: 'Subscription' },
  ar_session_complete:{ screen: 'Workspace' },
  project_shared:     { screen: 'Workspace' },
  annotation_added:   { screen: 'Workspace' },
  export_ready:       { screen: 'Workspace' },
  design_of_week:     { screen: 'Feed' },
};

// ── Service ─────────────────────────────────────────────────────────────────────

export const pushNotificationService = {
  /**
   * Request notification permission (call on app mount or first bell tap).
   * Returns true if granted.
   */
  async requestPermission(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;

    const { status: requested } = await Notifications.requestPermissionsAsync();
    return requested === 'granted';
  },

  /**
   * Get the Expo push token for this device.
   */
  async getPushToken(): Promise<string | null> {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '1697aad8-bba0-442d-ac24-275a5ddd8e74',
      });
      return tokenData.data ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Register the device push token with the backend.
   * Safe to call repeatedly — upserts on conflict.
   */
  async registerToken(): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    const token = await this.getPushToken();
    if (!token) return;

    try {
      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/register-push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ token }),
      });
    } catch (e) {
      console.warn('[pushNotificationService] token registration failed:', e);
    }
  },

  /**
   * Parse notification data payload into a navigation route.
   */
  parseRoute(
    data: Notifications.Notification['request']['content']['data'],
  ): NotificationRoute | null {
    const type = data?.type as string | undefined;
    if (!type) return null;

    const route = ROUTE_MAP[type];
    if (!route) return null;

    return {
      ...route,
      params: {
        ...route.params,
        ...(data as Record<string, string | number | boolean>),
      },
    };
  },

  /**
   * Add listener for foreground notification received.
   * Returns unsubscriber.
   */
  addReceivedListener(
    callback: (notification: Notifications.Notification) => void,
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Add listener for notification tap (background → foreground).
   * Returns unsubscriber.
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void,
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },
};
