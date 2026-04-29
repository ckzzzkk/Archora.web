import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  EmailVerification: { email: string };
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Create: undefined;
  Inspo: undefined;
  AR: undefined;
  VIGA: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  AcceptPrivacy: undefined;
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  OnboardingQuiz: undefined;
  QuizCheckLoading: undefined;
  // Workspace and Generation are modals from root stack
  Workspace: { projectId?: string; fromAR?: boolean } | undefined;
  Generation: undefined;
  Subscription: { feature?: string } | undefined;
  TemplateDetail: { templateId: string };
  ThemeCustomiser: undefined;
  PublishTemplate: { projectId: string };
  PurchaseTemplate: { templateId: string };
  CoProjects: undefined;
  CoProjectDetail: { projectId: string };
  CodesignSession: { sessionId?: string };
  HelpFAQ: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
  NotificationPreferences: undefined;
};

export type WelcomeScreenProps           = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
export type OnboardingScreenProps        = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;
export type LoginScreenProps             = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type SignUpScreenProps            = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;
export type EmailVerificationScreenProps = NativeStackScreenProps<AuthStackParamList, 'EmailVerification'>;
export type ForgotPasswordScreenProps    = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;
export type ResetPasswordScreenProps     = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export type DashboardScreenProps   = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Home'>, NativeStackScreenProps<RootStackParamList>>;
export type FeedScreenProps        = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Inspo'>, NativeStackScreenProps<RootStackParamList>>;
export type ARScreenProps          = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'AR'>, NativeStackScreenProps<RootStackParamList>>;
export type VIGAScreenProps        = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'VIGA'>, NativeStackScreenProps<RootStackParamList>>;
export type AccountScreenProps     = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Account'>, NativeStackScreenProps<RootStackParamList>>;
export type SketchScreenProps      = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Create'>, NativeStackScreenProps<RootStackParamList>>;

export type WorkspaceScreenProps         = NativeStackScreenProps<RootStackParamList, 'Workspace'>;
export type GenerationScreenProps        = NativeStackScreenProps<RootStackParamList, 'Generation'>;
export type OnboardingQuizScreenProps    = NativeStackScreenProps<RootStackParamList, 'OnboardingQuiz'>;
export type RootOnboardingScreenProps   = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
export type PublishTemplateScreenProps   = NativeStackScreenProps<RootStackParamList, 'PublishTemplate'>;
export type PurchaseTemplateScreenProps  = NativeStackScreenProps<RootStackParamList, 'PurchaseTemplate'>;
export type HelpFAQScreenProps           = NativeStackScreenProps<RootStackParamList, 'HelpFAQ'>;
export type PrivacyPolicyScreenProps     = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;
export type TermsScreenProps             = NativeStackScreenProps<RootStackParamList, 'Terms'>;
export type NotificationPreferencesScreenProps = NativeStackScreenProps<RootStackParamList, 'NotificationPreferences'>;
export type CoProjectsScreenProps        = NativeStackScreenProps<RootStackParamList, 'CoProjects'>;
export type CoProjectDetailScreenProps   = NativeStackScreenProps<RootStackParamList, 'CoProjectDetail'>;
export type CodesignSessionScreenProps     = NativeStackScreenProps<RootStackParamList, 'CodesignSession'>;
