import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
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

export function MainNavigator() {
  return (
    <TabDirectionProvider>
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Sketch" component={SketchScreen} />
        <Tab.Screen name="Feed" component={FeedScreen} />
        <Tab.Screen name="AR" component={ARScanScreen} />
        <Tab.Screen name="Account" component={AccountScreen} />
      </Tab.Navigator>
    </TabDirectionProvider>
  );
}
