import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Modal,
} from 'react-native';
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
} from '../../services/notificationService';
import { useAuthStore } from '../../stores/authStore';
import { BASE_COLORS } from '../../theme/colors';
import type { AppNotification } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

const TYPE_ICONS: Record<string, string> = {
  like_received: '❤️',
  save_received: '🔖',
  follow_received: '👤',
  comment_received: '💬',
  streak_milestone: '🔥',
  points_awarded: '⭐',
  quota_warning: '⚠️',
  quota_reached: '🚫',
  design_of_week: '🏆',
  challenge_ending: '⏰',
};

const TYPE_LABELS: Record<string, string> = {
  like_received: 'liked your design',
  save_received: 'saved your design',
  follow_received: 'is following you',
  comment_received: 'commented on your design',
  streak_milestone: 'Streak milestone reached!',
  points_awarded: 'Points awarded',
  quota_warning: 'Usage warning',
  quota_reached: 'Usage limit reached',
  design_of_week: 'Design of the week!',
  challenge_ending: 'Challenge ending soon',
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
  const icon = TYPE_ICONS[notification.type] ?? '🔔';
  const label = TYPE_LABELS[notification.type] ?? notification.type;

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: notification.read ? 'transparent' : BASE_COLORS.surfaceHigh,
        borderBottomWidth: 1,
        borderBottomColor: BASE_COLORS.border + '55',
      }}
    >
      <Text style={{ fontSize: 22, marginRight: 12, marginTop: 2 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: notification.read ? 'Inter_400Regular' : 'Inter_600SemiBold',
            fontSize: 13,
            color: BASE_COLORS.textPrimary,
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
              color: BASE_COLORS.textSecondary,
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
            color: BASE_COLORS.textDim,
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
            backgroundColor: '#4CAF50',
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
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const translateY = useSharedValue(-300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 22, stiffness: 280 });
      opacity.value = withTiming(1, { duration: 200 });
      loadNotifications();
    } else {
      translateY.value = withTiming(-300, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
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

    // Navigate based on type
    // Navigate based on type — use type assertion since Feed/Account are in nested tab navigator
    const nav = navigation as unknown as { navigate: (screen: string) => void };
    switch (notification.type) {
      case 'like_received':
      case 'save_received':
      case 'comment_received':
        nav.navigate('Feed');
        break;
      case 'streak_milestone':
      case 'points_awarded':
        nav.navigate('Account');
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
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
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
            backgroundColor: BASE_COLORS.surface,
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
            paddingTop: 60,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: BASE_COLORS.border,
          }}
        >
          <Text
            style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 20,
              color: BASE_COLORS.textPrimary,
              flex: 1,
            }}
          >
            Notifications
            {unreadCount > 0 && (
              <Text style={{ color: '#4CAF50', fontSize: 14 }}>  {unreadCount} new</Text>
            )}
          </Text>
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllRead} style={{ marginRight: 16 }}>
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 12,
                  color: BASE_COLORS.textSecondary,
                }}
              >
                Mark all read
              </Text>
            </Pressable>
          )}
          <Pressable onPress={onClose}>
            <Text style={{ color: BASE_COLORS.textSecondary, fontSize: 18 }}>✕</Text>
          </Pressable>
        </View>

        {/* List */}
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: BASE_COLORS.textDim, fontFamily: 'Inter_400Regular' }}>
              Loading…
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>🔔</Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: BASE_COLORS.textDim,
                textAlign: 'center',
              }}
            >
              No notifications yet
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
