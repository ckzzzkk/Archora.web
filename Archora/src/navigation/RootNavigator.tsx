import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { lazyScreen } from '../utils/lazyScreen';

const BlueprintWorkspaceScreen = lazyScreen(() =>
  import('../screens/workspace/BlueprintWorkspaceScreen')
    .then((m) => ({ default: m.BlueprintWorkspaceScreen })));

const GenerationScreen = lazyScreen(() =>
  import('../screens/generation/GenerationScreen')
    .then((m) => ({ default: m.GenerationScreen })));

const SubscriptionScreen = lazyScreen(() =>
  import('../screens/subscription/SubscriptionScreen')
    .then((m) => ({ default: m.SubscriptionScreen })));

const TemplateDetailScreen = lazyScreen(() =>
  import('../screens/feed/TemplateDetailScreen')
    .then((m) => ({ default: m.TemplateDetailScreen })));

const ThemeCustomiserScreen = lazyScreen(() =>
  import('../screens/account/ThemeCustomiserScreen')
    .then((m) => ({ default: m.ThemeCustomiserScreen })));

const OnboardingQuizScreen = lazyScreen(() =>
  import('../screens/auth/OnboardingQuizScreen')
    .then((m) => ({ default: m.OnboardingQuizScreen })));
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
