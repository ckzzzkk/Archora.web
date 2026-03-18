import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { BlueprintWorkspaceScreen } from '../screens/workspace/BlueprintWorkspaceScreen';
import { GenerationScreen } from '../screens/generation/GenerationScreen';
import { SubscriptionScreen } from '../screens/subscription/SubscriptionScreen';
import { TemplateDetailScreen } from '../screens/feed/TemplateDetailScreen';
import { ThemeCustomiserScreen } from '../screens/account/ThemeCustomiserScreen';
import { OnboardingQuizScreen } from '../screens/auth/OnboardingQuizScreen';
import { CompassRoseLoader } from '../components/common/CompassRoseLoader';
import { storage } from '../utils/storage';
import { BASE_COLORS } from '../theme/colors';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function QuizCheckLoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
      <CompassRoseLoader size="large" />
    </View>
  );
}

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // null = still checking, false = quiz pending, true = quiz done
  const [quizDone, setQuizDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      void storage.getString('asoria_quiz_done').then((val) => {
        setQuizDone(val === 'true');
      });
    } else {
      setQuizDone(null);
    }
  }, [isAuthenticated]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : quizDone === null ? (
        <Stack.Screen name="QuizCheckLoading" component={QuizCheckLoadingScreen} />
      ) : quizDone === false ? (
        <>
          <Stack.Screen name="OnboardingQuiz" component={OnboardingQuizScreen} />
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="Workspace"
            component={BlueprintWorkspaceScreen}
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{ presentation: 'modal' }}
          />
        </>
      ) : (
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
      )}
    </Stack.Navigator>
  );
}
