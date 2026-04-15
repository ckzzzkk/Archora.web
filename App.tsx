import 'react-native-gesture-handler';
import './src/styles/global.css';
import React, { useEffect, useState, useRef } from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { InteractionManager, Linking } from 'react-native';
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
import { useUIStore } from './src/stores/uiStore';
import { useAuthStore } from './src/stores/authStore';
import { supabase } from './src/utils/supabaseClient';
import { navigationRef } from './src/navigation/navigationRef';
import { setupPushListeners } from './src/hooks/useNotifications';

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
  const pushListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void loadSession();
    });
    return () => task.cancel();
  }, [loadSession]);

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

  // Handle deep links for subscription callbacks
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      if (url.startsWith('asoria://subscription-success')) {
        // Reload user session to pick up updated subscription tier from Stripe webhook
        void loadSession();
      } else if (url.includes('auth/callback')) {
        void (async () => {
          const params = new URL(url).searchParams;
          const error = params.get('error');
          const errorDescription = params.get('error_description');
          const code = params.get('code');

          if (error) {
            useUIStore.getState().actions.showToast(
              errorDescription || 'Google sign in failed',
              'error'
            );
            return;
          }

          if (code) {
            const { data } = await supabase.auth.exchangeCodeForSession(code);
            if (data?.session) {
              useAuthStore.getState().actions.refreshSession();
            }
          }
        })();
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
