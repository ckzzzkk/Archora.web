import { DS } from '../../theme/designSystem';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getNotifications,
  markAllRead,
  markRead,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '../../services/notificationService';
import { useSession } from '../../auth/useSession';
import type { AppNotification } from '../../types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { RootStackParamList } from '../../navigation/types';

const TYPE_ICONS: Record<string, string> = {
  // AI generation
  generation_complete:   '🎨',
  generation_failed:       '⚠️',
  ai_furniture_ready:     '🪑',
  ai_texture_ready:       '🎨',
  transcription_ready:   '🎙️',
  // Social
  like_received:          '❤️',
  save_received:          '🔖',
  follow_received:        '👤',
  comment_received:       '💬',
  design_featured:        '🔥',
  template_purchased:     '💰',
  // Gamification
  streak_milestone:       '🔥',
  points_awarded:         '⭐',
  challenge_ending:       '⏰',
  daily_goal_reached:     '🎯',
  level_up:              '⬆️',
  // Quota & Billing
  quota_warning:          '⚡',
  quota_reached:          '🚫',
  subscription_new:       '🚀',
  payment_failed:        '💳',
  // AR & Collaboration
  ar_session_complete:    '📐',
  project_shared:         '📂',
  annotation_added:        '💬',
  export_ready:           '⬇️',
  design_of_week:         '🏆',
};

const TYPE_LABELS: Record<string, string> = {
  // AI generation
  generation_complete:   'Your AI floor plan is ready!',
  generation_failed:     'Floor plan generation failed',
  ai_furniture_ready:  'Custom furniture model is ready!',
  ai_texture_ready:     'Custom texture is applied!',
  transcription_ready: 'Voice note transcribed',
  // Social
  like_received:        'liked your design',
  save_received:        'saved your design',
  follow_received:      'started following you',
  comment_received:     'commented on your design',
  design_featured:      'Your design is trending!',
  template_purchased:    'Someone purchased your template!',
  // Gamification
  streak_milestone:     'Streak milestone reached!',
  points_awarded:       'Points earned!',
  challenge_ending:      'Challenge ending soon',
  daily_goal_reached:    'Daily editing goal completed!',
  level_up:             'You leveled up!',
  // Quota & Billing
  quota_warning:         '80% of your AI quota used',
  quota_reached:        'AI quota exhausted',
  subscription_new:     'Subscription activated',
  payment_failed:       'Payment failed — update your card',
  // AR & Collaboration
  ar_session_complete:   'AR scan processed!',
  project_shared:        'shared a project with you',
  annotation_added:      'Added an annotation to your project',
  export_ready:         'Export is ready to download',
  design_of_week:       'Design of the Week — you\'re featured!',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface NotificationRowProps {
  notification: AppNotification;
  onPress: (n: AppNotification) => void;
}

function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const icon = TYPE_ICONS[notification.type] ?? '📌';
  const label = TYPE_LABELS[notification.type] ?? notification.type;

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: notification.read ? 'transparent' : DS.colors.surfaceHigh,
        borderBottomWidth: 1,
        borderBottomColor: DS.colors.border + '55',
      }}
    >
      <Text style={{ fontSize: 22, marginRight: 12, marginTop: 2 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: notification.read ? 'Inter_400Regular' : 'Inter_600SemiBold',
            fontSize: 13,
            color: DS.colors.primary,
          }}
        >
          {label}
        </Text>
        {notification.payload?.message != null && (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 12,
              color: DS.colors.primaryDim,
              marginTop: 2,
            }}
          >
            {String(notification.payload.message)}
          </Text>
        )}
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 11,
            color: DS.colors.primaryDim,
            marginTop: 4,
          }}
        >
          {timeAgo(notification.createdAt)}
        </Text>
      </View>
      {!notification.read && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: DS.colors.success,
            marginTop: 6,
          }}
        />
      )}
    </Pressable>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationPanel({ visible, onClose }: Props) {
  const { user } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = React.useRef<RealtimeChannel | null>(null);

  const translateY = useSharedValue(-300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 22, stiffness: 280 });
      opacity.value = withTiming(1, { duration: 200 });
      loadNotifications();
      if (user?.id) {
        channelRef.current = subscribeToNotifications(user.id, (n) => {
          setNotifications((prev) => [n, ...prev]);
        });
      }
    } else {
      translateY.value = withTiming(-300, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      if (channelRef.current) {
        unsubscribeFromNotifications(channelRef.current);
        channelRef.current = null;
      }
    }
    return () => {
      if (channelRef.current) {
        unsubscribeFromNotifications(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const loadNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationPress = async (notification: AppNotification) => {
    if (!notification.read) {
      await markRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }

    onClose();

    // Navigate based on type — tabs are inside Main navigator
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigation as any;
    switch (notification.type) {
      // Social → Feed / TemplateDetail
      case 'like_received':
      case 'save_received':
      case 'comment_received':
      case 'follow_received':
      case 'design_featured':
      case 'template_purchased':
      case 'design_of_week':
        nav.navigate('Main', { screen: 'Feed' });
        break;
      // Gamification / Billing → Account
      case 'streak_milestone':
      case 'points_awarded':
      case 'level_up':
      case 'subscription_new':
      case 'payment_failed':
        nav.navigate('Main', { screen: 'Account' });
        break;
      // Challenges / goals → Dashboard
      case 'challenge_ending':
      case 'daily_goal_reached':
        nav.navigate('Main', { screen: 'Home' });
        break;
      // Quota → Subscription upgrade
      case 'quota_warning':
      case 'quota_reached':
        nav.navigate('Subscription');
        break;
      // AI generation / AR / Workspace → open last project or Generation
      case 'generation_complete':
      case 'generation_failed':
      case 'ai_furniture_ready':
      case 'ai_texture_ready':
      case 'transcription_ready':
      case 'ar_session_complete':
      case 'export_ready':
      case 'project_shared':
      case 'annotation_added':
        nav.navigate('Main', { screen: 'Home' });
        break;
      default:
        break;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: DS.colors.overlay }}
        onPress={onClose}
        accessibilityLabel="Close notifications panel"
        accessibilityRole="button"
        accessibilityHint="Tap to dismiss the notifications panel"
      />

      <Animated.View
        style={[
          panelStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            maxHeight: '60%',
            backgroundColor: DS.colors.surface,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 12,
          },
        ]}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: Math.max(60, insets.top + 16),
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: DS.colors.border,
          }}
        >
          <Text
            style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 20,
              color: DS.colors.primary,
              flex: 1,
            }}
          >
            Notifications
            {unreadCount > 0 && (
              <Text style={{ color: DS.colors.success, fontSize: 14 }}>  {unreadCount} new</Text>
            )}
          </Text>
          {unreadCount > 0 && (
            <Pressable
              onPress={handleMarkAllRead}
              accessibilityLabel={`Mark all ${unreadCount} notifications as read`}
              accessibilityRole="button"
              style={{ marginRight: 16 }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 12,
                  color: DS.colors.primaryDim,
                }}
              >
                Mark all read
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close notifications"
            accessibilityRole="button"
            accessibilityHint="Closes the notifications panel"
            hitSlop={8}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M5 5 L19 19 M19 5 L5 19"
                stroke={DS.colors.primaryDim}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
        </View>

        {/* List */}
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: DS.colors.primaryDim, fontFamily: 'Inter_400Regular' }}>
              Loading…
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Svg width={80} height={72} viewBox="0 0 80 72" style={{ marginBottom: 20 }}>
              {/* Notice board rectangle */}
              <Path
                d="M6 12 L6 64 L74 64 L74 12 Z"
                stroke="#C8C8C8" strokeWidth="1.5" fill="none"
                strokeLinecap="round" strokeLinejoin="round"
              />
              {/* Board top bar */}
              <Path d="M4 10 L76 10" stroke="#C8C8C8" strokeWidth="2" strokeLinecap="round" />
              {/* Blank paper */}
              <Path
                d="M18 22 L18 56 L62 56 L62 22 Z"
                stroke="#5A5550" strokeWidth="1" fill="none"
                strokeLinecap="round" strokeLinejoin="round"
              />
              {/* Drawing pin circle */}
              <Circle cx="40" cy="20" r="4" stroke="#C8C8C8" strokeWidth="1.5" fill="none" />
              {/* Pin shaft */}
              <Path d="M40 24 L40 28" stroke="#C8C8C8" strokeWidth="1.5" strokeLinecap="round" />
              {/* Ruled lines on paper */}
              <Path d="M24 32 H56" stroke="#333333" strokeWidth="1" strokeLinecap="round" />
              <Path d="M24 38 H56" stroke="#333333" strokeWidth="1" strokeLinecap="round" />
              <Path d="M24 44 H50" stroke="#333333" strokeWidth="1" strokeLinecap="round" />
            </Svg>
            <Text style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 16,
              color: DS.colors.primary,
              textAlign: 'center',
              marginBottom: 8,
            }}>
              No notifications yet
            </Text>
            <Text style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              color: DS.colors.primaryDim,
              textAlign: 'center',
            }}>
              Likes, saves and follows will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationRow notification={item} onPress={handleNotificationPress} />
            )}
          />
        )}
      </Animated.View>
    </Modal>
  );
}
