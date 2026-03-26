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
  Dashboard: undefined;
  Sketch: undefined;
  Feed: undefined;
  AR: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
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
  HelpFAQ: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
};

export type WelcomeScreenProps           = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
export type OnboardingScreenProps        = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;
export type LoginScreenProps             = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type SignUpScreenProps            = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;
export type EmailVerificationScreenProps = NativeStackScreenProps<AuthStackParamList, 'EmailVerification'>;
export type ForgotPasswordScreenProps    = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;
export type ResetPasswordScreenProps     = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export type DashboardScreenProps   = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Dashboard'>, NativeStackScreenProps<RootStackParamList>>;
export type FeedScreenProps        = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Feed'>, NativeStackScreenProps<RootStackParamList>>;
export type ARScreenProps          = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'AR'>, NativeStackScreenProps<RootStackParamList>>;
export type AccountScreenProps     = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Account'>, NativeStackScreenProps<RootStackParamList>>;
export type SketchScreenProps      = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Sketch'>, NativeStackScreenProps<RootStackParamList>>;

export type WorkspaceScreenProps         = NativeStackScreenProps<RootStackParamList, 'Workspace'>;
export type GenerationScreenProps        = NativeStackScreenProps<RootStackParamList, 'Generation'>;
export type OnboardingQuizScreenProps    = NativeStackScreenProps<RootStackParamList, 'OnboardingQuiz'>;
export type PublishTemplateScreenProps   = NativeStackScreenProps<RootStackParamList, 'PublishTemplate'>;
export type PurchaseTemplateScreenProps  = NativeStackScreenProps<RootStackParamList, 'PurchaseTemplate'>;
export type HelpFAQScreenProps           = NativeStackScreenProps<RootStackParamList, 'HelpFAQ'>;
export type PrivacyPolicyScreenProps     = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;
export type TermsScreenProps             = NativeStackScreenProps<RootStackParamList, 'Terms'>;
