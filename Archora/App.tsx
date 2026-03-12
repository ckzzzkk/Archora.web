import 'react-native-gesture-handler';
import React, { useCallback, useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  ArchitectsDaughter_400Regular,
} from '@expo-google-fonts/architects-daughter';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { RootNavigator } from './src/navigation/RootNavigator';
import { CompassRoseLoader } from './src/components/common/CompassRoseLoader';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  const [fontsLoaded] = useFonts({
    ArchitectsDaughter_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  const loadSession = useAuthStore((s) => s.actions.loadSession);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
        <CompassRoseLoader size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
