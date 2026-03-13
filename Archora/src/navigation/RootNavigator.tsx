import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { BlueprintWorkspaceScreen } from '../screens/workspace/BlueprintWorkspaceScreen';
import { GenerationScreen } from '../screens/generation/GenerationScreen';
import { SubscriptionScreen } from '../screens/subscription/SubscriptionScreen';
import { TemplateDetailScreen } from '../screens/feed/TemplateDetailScreen';
import { ThemeCustomiserScreen } from '../screens/account/ThemeCustomiserScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="Workspace"
            component={BlueprintWorkspaceScreen}
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="Generation"
            component={GenerationScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="TemplateDetail"
            component={TemplateDetailScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="ThemeCustomiser"
            component={ThemeCustomiserScreen}
            options={{ presentation: 'modal' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
