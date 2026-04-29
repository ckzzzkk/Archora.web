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

const VIGAScreen    = lazyScreen(() =>
  import('../screens/viga/VIGAScreen').then((m) => ({ default: m.VIGAScreen })));

const FeedScreen    = lazyScreen(() =>
  import('../screens/feed/FeedScreen').then((m) => ({ default: m.FeedScreen })));

const AccountScreen = lazyScreen(() =>
  import('../screens/account/AccountScreen').then((m) => ({ default: m.AccountScreen })));
import { CustomTabBar } from './CustomTabBar';
import { TabDirectionProvider } from './TabDirectionContext';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const HomeTab     = () => <ErrorBoundary><DashboardScreen /></ErrorBoundary>;
const CreateTab    = () => <ErrorBoundary><SketchScreen /></ErrorBoundary>;
const InspoTab     = () => <ErrorBoundary><FeedScreen /></ErrorBoundary>;
const ARTab         = () => <ErrorBoundary><ARScanScreen /></ErrorBoundary>;
const VIGATab       = () => <ErrorBoundary><VIGAScreen /></ErrorBoundary>;
const AccountTab    = () => <ErrorBoundary><AccountScreen /></ErrorBoundary>;

export function MainNavigator() {
  return (
    <TabDirectionProvider>
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Tab.Screen name="Home" component={HomeTab} />
        <Tab.Screen
          name="Create"
          component={CreateTab}
          options={{ tabBarStyle: { display: 'none' } }}
        />
        <Tab.Screen name="Inspo" component={InspoTab} />
        <Tab.Screen
          name="AR"
          component={ARTab}
          options={{ tabBarStyle: { display: 'none' } }}
        />
        <Tab.Screen
          name="VIGA"
          component={VIGATab}
          options={{ tabBarStyle: { display: 'none' } }}
        />
        <Tab.Screen name="Account" component={AccountTab} />
      </Tab.Navigator>
    </TabDirectionProvider>
  );
}
