import { DS } from '../theme/designSystem';
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

const PublishTemplateScreen = lazyScreen(() =>
  import('../screens/feed/PublishTemplateScreen')
    .then((m) => ({ default: m.PublishTemplateScreen })));

const PurchaseTemplateScreen = lazyScreen(() =>
  import('../screens/feed/PurchaseTemplateScreen')
    .then((m) => ({ default: m.PurchaseTemplateScreen })));

const OnboardingQuizScreen = lazyScreen(() =>
  import('../screens/auth/OnboardingQuizScreen')
    .then((m) => ({ default: m.OnboardingQuizScreen })));

const OnboardingScreen = lazyScreen(() =>
  import('../screens/onboarding/OnboardingScreen')
    .then((m) => ({ default: m.OnboardingScreen })));

const AcceptPrivacyScreen = lazyScreen(() =>
  import('../screens/AcceptPrivacyScreen')
    .then((m) => ({ default: m.AcceptPrivacyScreen })));

const HelpFAQScreen = lazyScreen(() =>
  import('../screens/account/HelpFAQScreen')
    .then((m) => ({ default: m.HelpFAQScreen })));

const PrivacyPolicyScreen = lazyScreen(() =>
  import('../screens/account/PrivacyPolicyScreen')
    .then((m) => ({ default: m.PrivacyPolicyScreen })));

const TermsScreen = lazyScreen(() =>
  import('../screens/account/TermsScreen')
    .then((m) => ({ default: m.TermsScreen })));

const NotificationPreferencesScreen = lazyScreen(() =>
  import('../screens/account/NotificationPreferencesScreen')
    .then((m) => ({ default: m.NotificationPreferencesScreen })));
import { CompassRoseLoader } from '../components/common/CompassRoseLoader';
import { Storage } from '../utils/storage';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function QuizCheckLoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <CompassRoseLoader size="large" />
    </View>
  );
}

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  // null = still checking, false = quiz pending, true = quiz done
  const [quizDone, setQuizDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const val = Storage.getString('asoria_quiz_done');
      setQuizDone(val === 'true');
    } else {
      setQuizDone(null);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <CompassRoseLoader size="large" />
      </View>
    );
  }

  const privacyAccepted = Storage.getString('privacyPolicyAccepted');

  // Show privacy policy for brand new users who haven't accepted
  if (!privacyAccepted) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200, contentStyle: { backgroundColor: '#1A1A1A' } }}>
        <Stack.Screen name="AcceptPrivacy" component={AcceptPrivacyScreen} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={MainNavigator} />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ animation: 'fade', animationDuration: 150 }}
        />
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
          options={{ animation: 'fade', animationDuration: 150 }}
        />
      </Stack.Navigator>
    );
  }

  // Show onboarding slides after first sign-up, before the quiz
  const onboardingSeen = Storage.getString('onboarding_seen');
  if (isAuthenticated && onboardingSeen == null) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200, contentStyle: { backgroundColor: '#1A1A1A' } }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200, contentStyle: { backgroundColor: '#1A1A1A' } }}>
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
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
              animationDuration: 150,
            }}
          />
          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="HelpFAQ"
            component={HelpFAQScreen}
            options={{ animation: 'fade', animationDuration: 150 }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{ animation: 'fade', animationDuration: 150 }}
          />
          <Stack.Screen
            name="Terms"
            component={TermsScreen}
            options={{ animation: 'fade', animationDuration: 150 }}
          />
          <Stack.Screen
            name="NotificationPreferences"
            component={NotificationPreferencesScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="Workspace"
            component={BlueprintWorkspaceScreen}
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
              animationDuration: 150,
            }}
          />
          <Stack.Screen
            name="Generation"
            component={GenerationScreen}
            options={{
              presentation: 'modal',
              animation: 'fade',
              animationDuration: 150,
            }}
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
          <Stack.Screen
            name="PublishTemplate"
            component={PublishTemplateScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="PurchaseTemplate"
            component={PurchaseTemplateScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="HelpFAQ"
            component={HelpFAQScreen}
            options={{ animation: 'fade', animationDuration: 150 }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{ animation: 'fade', animationDuration: 150 }}
          />
          <Stack.Screen
            name="Terms"
            component={TermsScreen}
            options={{ animation: 'fade', animationDuration: 150 }}
          />
          <Stack.Screen
            name="NotificationPreferences"
            component={NotificationPreferencesScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
