import { DS } from '../../theme/designSystem';
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { clipboard } from '../../utils/clipboard';
import type { ClipboardItem } from '../../utils/clipboard';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPaste: (item: ClipboardItem) => void;
}

const TYPE_ICONS: Record<ClipboardItem['type'], string> = {
  furniture: '⊕',
  room:      '⬜',
  layout:    '⊞',
  style:     '◈',
};

const TYPE_LABELS: Record<ClipboardItem['type'], string> = {
  furniture: 'Furniture',
  room:      'Room',
  layout:    'Layout',
  style:     'Style',
};

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function ClipboardPanel({ visible, onClose, onPaste }: Props) {
  const [items, setItems] = useState<ClipboardItem[]>([]);

  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      void clipboard.getAll().then(setItems);
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 150 });
    } else {
      translateY.value = withTiming(300, { duration: 200 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleRemove = (id: string) => {
    void clipboard.remove(id).then(() => clipboard.getAll()).then(setItems);
  };

  const handleClear = () => {
    void clipboard.clear();
    setItems([]);
  };

  if (!visible) return null;

  return (
    <>
      <Pressable
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }}
        onPress={onClose}
      />
      <Animated.View
        style={[
          animStyle,
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: DS.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderTopWidth: 1,
            borderColor: DS.colors.border,
            paddingBottom: 24,
            maxHeight: 380,
          },
        ]}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: DS.colors.border }}>
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: DS.colors.primary, flex: 1 }}>
            Clipboard
          </Text>
          {items.length > 0 && (
            <Pressable onPress={handleClear} style={{ marginRight: 12 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryGhost }}>Clear all</Text>
            </Pressable>
          )}
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 16, color: DS.colors.primaryGhost }}>✕</Text>
          </Pressable>
        </View>

        {items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost }}>
              Nothing copied yet
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {items.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: DS.colors.surfaceHigh,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: DS.colors.border,
                  padding: 12,
                  gap: 12,
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: DS.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: DS.colors.border }}>
                  <Text style={{ fontSize: 16, color: DS.colors.primaryDim }}>{TYPE_ICONS[item.type]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: DS.colors.primary }}>
                    {TYPE_LABELS[item.type]}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: DS.colors.primaryGhost }}>
                    {relativeTime(item.timestamp)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => { onPaste(item); onClose(); }}
                  style={{ backgroundColor: DS.colors.primary + '20', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                >
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: DS.colors.primary }}>Paste</Text>
                </Pressable>
                <Pressable onPress={() => handleRemove(item.id)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 14, color: DS.colors.primaryGhost }}>✕</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </>
  );
}
