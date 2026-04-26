/**
 * SkiaFontLoader — a thin component that pre-loads Skia-compatible fonts
 * by calling useFont with the same font sources that expo-font loaded in App.tsx.
 *
 * Must be rendered above Canvas2D (in the component tree, not just visually).
 * Canvas2D reads fonts via useSkiaFonts() hook.
 */
import React, { createContext, useContext } from 'react';
import { useFont } from '@shopify/react-native-skia';
import {
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';
import {
  ArchitectsDaughter_400Regular,
} from '@expo-google-fonts/architects-daughter';
import {
  JetBrainsMono_400Regular,
} from '@expo-google-fonts/jetbrains-mono';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SkiaFont = ReturnType<typeof useFont> | null;

export interface SkiaFonts {
  interRegular: SkiaFont;
  interMedium: SkiaFont;
  architectsDaughter: SkiaFont;
  jetbrainsMono: SkiaFont;
  dimFont: SkiaFont; // JetBrainsMono 10px (dimensions)
  roomFont: SkiaFont; // Inter 12px (room labels)
  labelFont: SkiaFont; // Inter 11px (general labels)
}

const SkiaFontContext = createContext<SkiaFonts>({
  interRegular: null,
  interMedium: null,
  architectsDaughter: null,
  jetbrainsMono: null,
  dimFont: null,
  roomFont: null,
  labelFont: null,
});

export function useSkiaFonts(): SkiaFonts {
  return useContext(SkiaFontContext);
}

export function SkiaFontLoader({ children }: { children: React.ReactNode }) {
  // All these fonts are already loaded into the system by expo-font in App.tsx.
  // We pass the same modules to Skia's useFont to get the Skia Font object.
  const interRegular = useFont(Inter_400Regular, 12);
  const interMedium = useFont(Inter_500Medium, 14);
  const architectsDaughter = useFont(ArchitectsDaughter_400Regular, 16);
  const jetbrainsMono = useFont(JetBrainsMono_400Regular, 12);
  const dimFont = useFont(JetBrainsMono_400Regular, 10);
  const roomFont = useFont(Inter_400Regular, 12);
  const labelFont = useFont(Inter_400Regular, 11);

  return (
    <SkiaFontContext.Provider
      value={{ interRegular, interMedium, architectsDaughter, jetbrainsMono, dimFont, roomFont, labelFont }}
    >
      {children}
    </SkiaFontContext.Provider>
  );
}