import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { DS } from '../../../theme/designSystem';
import { GridBackground } from '../../../components/common/GridBackground';
import { ArchText } from '../../../components/common/ArchText';
import { ConsultationChat } from '../../../components/consultation/ConsultationChat';
import type { GenerationPayload, ConsultationSummary } from '../../../types/generation';
import type { Tier } from '../../../utils/tierLimits';

interface Props {
  tier: Tier;
  architectId: string | null;
  structuredPayload: {
    buildingType?: GenerationPayload['buildingType'];
    plotSize?: number;
    plotUnit?: 'm2' | 'ft2';
    bedrooms?: number;
    bathrooms?: number;
    livingAreas?: number;
    hasGarage?: boolean;
    hasGarden?: boolean;
    hasPool?: boolean;
    poolSize?: 'small' | 'medium' | 'large';
    hasHomeOffice?: boolean;
    hasUtilityRoom?: boolean;
    style?: string;
    referenceImageUrl?: string;
    additionalNotes?: string;
    transcript?: string;
  };
  onComplete: (summary: ConsultationSummary, updatedPayload: GenerationPayload) => void;
  onBack: () => void;
}

export function Step6Notes({ tier, architectId, structuredPayload, onComplete, onBack }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1 }}>
      <GridBackground />

      <View style={{ flex: 1 }}>
        <ConsultationChat
          tier={tier}
          architectId={architectId}
          structuredPayload={structuredPayload}
          onComplete={onComplete}
          onBack={onBack}
        />
      </View>
    </Animated.View>
  );
}
