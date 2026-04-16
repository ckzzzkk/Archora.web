/**
 * useNotifications hook
 *
 * Combines in-app notifications (Supabase Realtime) + push token registration
 * + unread count badge.
 *
 * For global push tap handling (works from any context), import and call
 * setupPushListeners() from App.tsx instead.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type * as Notifications from 'expo-notifications';
import { useSession } from '../auth/useSession';
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '../services/notificationService';
import {
  pushNotificationService,
  type NotificationRoute,
} from '../services/pushNotificationService';
import { navigate } from '../navigation/navigationRef';
import type { AppNotification } from '../types';

// ── Navigation helper ─────────────────────────────────────────────────────────

function handleNotificationTap(route: NotificationRoute | null) {
  if (!route) return;
  try {
    navigate(route.screen, route.params ?? {});
  } catch (e) {
    console.warn('[useNotifications] navigation failed:', e);
  }
}

// ── Global push listener setup (call from App.tsx) ───────────────────────────

export function setupPushListeners(): () => void {
  // Foreground notification received
  const receivedSub = pushNotificationService.addReceivedListener((notification) => {
    // In a full implementation this would update a global notifications list
    // or show an in-app toast. For now the Realtime subscription handles
    // new notifications for logged-in users.
    console.info('[push] foreground notification:', notification.request.content.title);
  });

  // Notification tap (background → foreground or foreground tap)
  const responseSub = pushNotificationService.addNotificationResponseListener((response) => {
    const route = pushNotificationService.parseRoute(
      response.notification.request.content.data,
    );
    handleNotificationTap(route);
  });

  // Register push token on app launch
  void pushNotificationService.registerToken();

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

// ── Hook (for screen/panel use) ─────────────────────────────────────────────

export function useNotifications() {
  const { user } = useSession();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const channelRef = useRef<ReturnType<typeof subscribeToNotifications> | null>(null);

  // Load initial data
  useEffect(() => {
    if (!user?.id) return;

    void (async () => {
      setIsLoading(true);
      const [notifs, count] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
      setIsLoading(false);

      // Register push token (safe to call every mount — upserts)
      await pushNotificationService.registerToken();
    })();
  }, [user?.id]);

  // Supabase Realtime subscription for in-app notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = subscribeToNotifications(user.id, (newNotif: AppNotification) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromNotifications(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  const markNotificationRead = useCallback(async (id: string) => {
    await markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead: markNotificationRead,
    markAllRead: markAllNotificationsRead,
  };
}
