import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = {
  current: null as NavigationContainerRef<RootStackParamList> | null,
};

export function navigate(name: string, params?: Record<string, unknown>) {
  navigationRef.current?.navigate(name as keyof RootStackParamList, params as any);
}
