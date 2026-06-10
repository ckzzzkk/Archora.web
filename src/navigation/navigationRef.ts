import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = {
  current: null as NavigationContainerRef<RootStackParamList> | null,
};

export function navigate(name: string, params?: Record<string, unknown>) {
  // Callers pass route names from dynamic sources (push notification payloads etc.)
  // so name is typed as string; the cast to keyof RootStackParamList is unavoidable here.
  navigationRef.current?.navigate(name as keyof RootStackParamList, params as never);
}
