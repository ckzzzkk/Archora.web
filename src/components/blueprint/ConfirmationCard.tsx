import React from 'react';
import { View, Pressable } from 'react-native';
import { DS } from '../../theme/designSystem';
import { SUNRISE } from '../../theme/sunrise';
import { ArchText } from '../common/ArchText';
import { diffBlueprints, type BlueprintDiff } from '../../utils/diffBlueprint';
import type { BlueprintData } from '../../types/blueprint';

interface Props {
  original: BlueprintData;
  proposed: BlueprintData;
  aiMessage: string;
  currentFloorIndex?: number;
  onAccept: () => void;
  onReject: () => void;
}

function ChangeChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + '20', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: color + '40', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color }}>{label}</ArchText>
      <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: DS.colors.primaryGhost }}>{value}</ArchText>
    </View>
  );
}

export function ConfirmationCard({ original, proposed, aiMessage, currentFloorIndex = 0, onAccept, onReject }: Props) {
  const diff: BlueprintDiff = diffBlueprints(original, proposed, currentFloorIndex);

  return (
    <View style={{
      backgroundColor: DS.colors.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: `${SUNRISE.amber}50`,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SUNRISE.amber }} />
        <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: SUNRISE.amber, flex: 1 }}>
          Review this change
        </ArchText>
      </View>

      {/* AI message */}
      {aiMessage && (
        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryGhost, marginBottom: 10, lineHeight: 17 }}>
          {aiMessage}
        </ArchText>
      )}

      {/* Change summary chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {diff.roomChanges.added.map((r) => (
          <ChangeChip key={`add-${r}`} label="+Room" value={r} color="#7AB87A" />
        ))}
        {diff.roomChanges.removed.map((r) => (
          <ChangeChip key={`rem-${r}`} label="-Room" value={r} color="#C0604A" />
        ))}
        {diff.roomChanges.resized.map((r) => (
          <ChangeChip key={`res-${r.name}`} label="↔" value={`${r.name} ${r.from}→${r.to}m²`} color={SUNRISE.amber} />
        ))}
        {diff.furnitureChanges.added.map((f) => (
          <ChangeChip key={`fadd-${f}`} label="+Furniture" value={f} color="#7AB87A" />
        ))}
        {diff.furnitureChanges.moved.map((f) => (
          <ChangeChip key={`fmov-${f}`} label="↕" value={f} color={SUNRISE.amber} />
        ))}
        {diff.furnitureChanges.removed.map((f) => (
          <ChangeChip key={`frem-${f}`} label="-Furniture" value={f} color="#C0604A" />
        ))}
        {diff.wallChanges.added > 0 && (
          <ChangeChip label="+Walls" value={`${diff.wallChanges.added}`} color="#7AB87A" />
        )}
        {diff.wallChanges.removed > 0 && (
          <ChangeChip label="-Walls" value={`${diff.wallChanges.removed}`} color="#C0604A" />
        )}
        {diff.floorChanges.added > 0 && (
          <ChangeChip label="+Floor" value={`${diff.floorChanges.added}`} color="#7AB87A" />
        )}
        {diff.floorChanges.removed > 0 && (
          <ChangeChip label="-Floor" value={`${diff.floorChanges.removed}`} color="#C0604A" />
        )}
      </View>

      {/* Accept / Reject buttons */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={onAccept}
          style={{ flex: 1, backgroundColor: '#7AB87A', borderRadius: 20, paddingVertical: 10, alignItems: 'center' }}
        >
          <ArchText variant="body" style={{ fontFamily: 'Inter_600Bold', fontSize: 13, color: '#fff' }}>Accept</ArchText>
        </Pressable>
        <Pressable
          onPress={onReject}
          style={{ flex: 1, backgroundColor: DS.colors.surfaceHigh, borderRadius: 20, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: DS.colors.border }}
        >
          <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: DS.colors.primaryGhost }}>Reject</ArchText>
        </Pressable>
      </View>
    </View>
  );
}