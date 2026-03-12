import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth stack
export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
};

// Main tab navigator
export type MainTabParamList = {
  Dashboard: undefined;
  Workspace: { projectId?: string };
  Generate: undefined;
  AR: undefined;
  Feed: undefined;
  Account: undefined;
};

// Root stack (wraps everything)
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Subscription: { feature?: string };
  TemplateDetail: { templateId: string };
  ThemeCustomiser: undefined;
};

// Screen props
export type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
export type OnboardingScreenProps = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;
export type DashboardScreenProps = BottomTabScreenProps<MainTabParamList, 'Dashboard'>;
export type WorkspaceScreenProps = BottomTabScreenProps<MainTabParamList, 'Workspace'>;
export type GenerateScreenProps = BottomTabScreenProps<MainTabParamList, 'Generate'>;
export type ARScreenProps = BottomTabScreenProps<MainTabParamList, 'AR'>;
export type FeedScreenProps = BottomTabScreenProps<MainTabParamList, 'Feed'>;
export type AccountScreenProps = BottomTabScreenProps<MainTabParamList, 'Account'>;
