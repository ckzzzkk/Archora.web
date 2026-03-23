import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { lazyScreen } from '../utils/lazyScreen';

const SketchScreen  = lazyScreen(() =>
  import('../screens/sketch/SketchScreen').then((m) => ({ default: m.SketchScreen })));

const ARScanScreen  = lazyScreen(() =>
  import('../screens/ar/ARScanScreen').then((m) => ({ default: m.ARScanScreen })));

const FeedScreen    = lazyScreen(() =>
  import('../screens/feed/FeedScreen').then((m) => ({ default: m.FeedScreen })));

const AccountScreen = lazyScreen(() =>
  import('../screens/account/AccountScreen').then((m) => ({ default: m.AccountScreen })));
import { CustomTabBar } from './CustomTabBar';
import { TabDirectionProvider } from './TabDirectionContext';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const DashboardTab  = () => <ErrorBoundary><DashboardScreen /></ErrorBoundary>;
const SketchTab     = () => <ErrorBoundary><SketchScreen /></ErrorBoundary>;
const FeedTab       = () => <ErrorBoundary><FeedScreen /></ErrorBoundary>;
const ARTab         = () => <ErrorBoundary><ARScanScreen /></ErrorBoundary>;
const AccountTab    = () => <ErrorBoundary><AccountScreen /></ErrorBoundary>;

export function MainNavigator() {
  return (
    <TabDirectionProvider>
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Dashboard" component={DashboardTab} />
        <Tab.Screen name="Sketch" component={SketchTab} />
        <Tab.Screen name="Feed" component={FeedTab} />
        <Tab.Screen name="AR" component={ARTab} />
        <Tab.Screen name="Account" component={AccountTab} />
      </Tab.Navigator>
    </TabDirectionProvider>
  );
}
