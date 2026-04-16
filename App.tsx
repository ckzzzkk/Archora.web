import 'react-native-gesture-handler';
import './src/styles/global.css';
import React, { useEffect, useState, useRef } from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import { ToastContainer } from './src/components/common/ToastContainer';
import { supabase } from './src/lib/supabase';
// authStore removed — now using AuthProvider
import { AuthProvider } from './src/auth/AuthProvider';
import { navigationRef } from './src/navigation/navigationRef';
import { setupPushListeners } from './src/hooks/useNotifications';

// React Navigation linking config — maps deep link paths to screens.
// Cast to any: RootStackParamList types Auth as undefined (no nested params),
// but the nested screen config is valid at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const linking: any = {
  prefixes: ['asoria://', 'exp.asoria://'],
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

  const [splashDone, setSplashDone] = useState(false);
  const pushListenersRef = useRef<(() => void) | null>(null);

  // Global error handler — surfaces unhandled JS errors in Metro (dev) for debugging
  useEffect(() => {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      if (__DEV__) {
        console.error('[GlobalError]', isFatal ? 'FATAL' : 'error', error?.message ?? error);
      }
      originalHandler(error, isFatal);
    });
  }, []);

  // Handle deep links for Stripe subscription callback only
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      if (url.startsWith('asoria://subscription-success')) {
        // Stripe webhook updated subscription tier — reload session
        // AuthProvider will pick up the new session via onAuthStateChange
        supabase.auth.getSession();
      }
    };
    const sub = Linking.addEventListener('url', handleUrl);
    void Linking.getInitialURL().then((url) => { if (url) handleUrl({ url }); });
    return () => sub.remove();
  }, []);

  const appReady = fontsLoaded;

  if (!splashDone) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ExpoStatusBar style="light" backgroundColor="#1A1A1A" />
          <SplashScreen appReady={appReady} onComplete={() => setSplashDone(true)} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ExpoStatusBar style="light" backgroundColor="#1A1A1A" />
        <AuthProvider>
          <NavigationContainer
            linking={linking}
            ref={(ref) => { navigationRef.current = ref as typeof navigationRef.current; }}
            onReady={() => {
              // Register push listeners only once
              if (pushListenersRef.current) return;
              pushListenersRef.current = setupPushListeners();
            }}
          >
            <ToastContainer />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
