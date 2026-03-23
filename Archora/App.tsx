import 'react-native-gesture-handler';
import './src/styles/global.css';
import React, { useEffect, useState } from 'react';
import { StatusBar, InteractionManager, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  ArchitectsDaughter_400Regular,
} from '@expo-google-fonts/architects-daughter';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { useAuthStore } from './src/stores/authStore';

// React Navigation linking config — maps deep link paths to screens.
// Cast to any: RootStackParamList types Auth as undefined (no nested params),
// but the nested screen config is valid at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const linking: any = {
  prefixes: ['asoria://'],
  config: {
    screens: {
      Auth: {
        screens: {
          ResetPassword: 'reset-password',
        },
      },
    },
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    ArchitectsDaughter_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  const loadSession = useAuthStore((s) => s.actions.loadSession);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void loadSession();
    });
    return () => task.cancel();
  }, [loadSession]);

  // Handle deep links for subscription callbacks
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      if (url.startsWith('asoria://subscription-success')) {
        // Reload user session to pick up updated subscription tier from Stripe webhook
        void loadSession();
      }
      // asoria://reset-password is handled by the linking config above via NavigationContainer
    };

    const sub = Linking.addEventListener('url', handleUrl);
    // Handle cold-start URL (app was closed when the link was opened)
    void Linking.getInitialURL().then((url) => { if (url) handleUrl({ url }); });

    return () => sub.remove();
  }, [loadSession]);

  const appReady = fontsLoaded;

  if (!splashDone) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        <SplashScreen appReady={appReady} onComplete={() => setSplashDone(true)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <NavigationContainer linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
