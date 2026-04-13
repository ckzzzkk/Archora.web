import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../common/ArchText';
import { OvalButton } from '../common/OvalButton';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import { clipboard } from '../../utils/clipboard';
import type { ClipboardItem } from '../../utils/clipboard';
import { useBlueprint } from '../../hooks/useBlueprint';
import { useUIStore } from '../../stores/uiStore';

const TYPE_ICONS: Record<string, string> = {
  furniture: '🛋',
  room: '🚪',
  layout: '📐',
  style: '🎨',
};

const TYPE_LABELS: Record<string, string> = {
  furniture: 'Furniture',
  room: 'Room',
  layout: 'Layout',
  style: 'Style',
};

function timeAgo(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

interface ClipboardRowProps {
  item: ClipboardItem;
  onPaste: (item: ClipboardItem) => void;
  onDelete: (id: string) => void;
}

function ClipboardRow({ item, onPaste, onDelete }: ClipboardRowProps) {
  const data = item.data as unknown as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name :
    typeof data.category === 'string' ? String(data.category) : TYPE_LABELS[item.type] ?? item.type;

  return (
    <View style={{
      backgroundColor: DS.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: DS.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: 22, marginRight: 10 }}>{TYPE_ICONS[item.type] ?? '📋'}</Text>
      <View style={{ flex: 1 }}>
        <ArchText variant="body" style={{ fontSize: 13, color: DS.colors.primary }} numberOfLines={1}>
          {name}
        </ArchText>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: DS.colors.primaryDim, marginTop: 1 }}>
          {TYPE_LABELS[item.type]} · {timeAgo(item.timestamp)}
        </Text>
      </View>
      <Pressable
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ marginRight: 10 }}
      >
        <Text style={{ color: DS.colors.primaryGhost, fontSize: 16 }}>✕</Text>
      </Pressable>
      <Pressable
        onPress={() => onPaste(item)}
        style={{
          backgroundColor: DS.colors.primary + '20',
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
      >
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: DS.colors.primary }}>Paste</Text>
      </Pressable>
    </View>
  );
}

export function CopyPasteSheet({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [pasting, setPasting] = useState(false);
  const { pasteItem } = useBlueprint();
  const showToast = useUIStore((s) => s.actions.showToast);

  useEffect(() => {
    clipboard.getAll().then(setItems);
  }, []);

  const handlePaste = async (item: ClipboardItem) => {
    setPasting(true);
    try {
      pasteItem(item);
      showToast('Item pasted', 'success');
      onClose();
    } catch {
      showToast('Paste failed', 'error');
    } finally {
      setPasting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await clipboard.remove(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearAll = async () => {
    await clipboard.clear();
    setItems([]);
  };

  return (
    <View style={{
      backgroundColor: DS.colors.surfaceHigh,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingBottom: 40,
      paddingHorizontal: 24,
      maxHeight: '85%',
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <ArchText variant="heading" style={{ fontSize: 18, color: DS.colors.primary }}>
          Clipboard
        </ArchText>
        <Pressable onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ color: DS.colors.primaryGhost, fontSize: 20 }}>✕</Text>
        </Pressable>
      </View>

      {pasting && (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <CompassRoseLoader size="medium" />
          <ArchText variant="body" style={{ color: DS.colors.primary, marginTop: 12 }}>Pasting…</ArchText>
        </View>
      )}

      {!pasting && items.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
          <ArchText variant="body" style={{ color: DS.colors.primaryGhost, textAlign: 'center' }}>
            Nothing copied yet.{'\n'}Select an item in the canvas and tap Copy.
          </ArchText>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: DS.colors.primaryDim, marginTop: 16, textAlign: 'center' }}>
            Select furniture → tap Copy in toolbar{'\n'}Select a room → Copy Room (Creator+){'\n'}Select walls → Copy Layout (Pro+)
          </Text>
        </View>
      )}

      {!pasting && items.length > 0 && (
        <>
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <ClipboardRow
                key={item.id}
                item={item}
                onPaste={handlePaste}
                onDelete={handleDelete}
              />
            ))}
          </ScrollView>

          <View style={{ marginTop: 16, gap: 10 }}>
            <OvalButton variant="ghost" onPress={handleClearAll} label="Clear All" />
            <OvalButton variant="outline" onPress={onClose} label="Done" />
          </View>
        </>
      )}
    </View>
  );
}