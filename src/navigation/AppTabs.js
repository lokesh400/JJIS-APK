import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import BatchesStack from './BatchesStack';
import MyTestsStack from './MyTestsStack';
import DashboardStack from './DashboardStack';
import StudyTabs from './StudyTabs';
import BattlegroundStack from './BattlegroundStack';

const Tab = createBottomTabNavigator();

const baseTabBarStyle = {
  backgroundColor: '#FFFFFF',
  borderTopColor: '#E5E7EB',
  borderTopWidth: 1,
  height: 60,
  paddingBottom: 8,
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
};

export default function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1D4ED8',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: baseTabBarStyle,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? 'view-dashboard' : 'view-dashboard-outline'} size={28} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Batches"
        component={BatchesStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) || 'BatchesList';
          const hideTabBar = routeName === 'TestAttempt' || routeName === 'AttachmentViewer' || routeName === 'PurchasePreview';

          return {
            tabBarLabel: 'Batches',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons name={focused ? 'book-open-variant' : 'book-outline'} size={28} color={color} />
            ),
            popToTopOnBlur: true,
            unmountOnBlur: true,
            tabBarStyle: hideTabBar
              ? { ...baseTabBarStyle, display: 'none' }
              : baseTabBarStyle,
          };
        }}
      />
      <Tab.Screen
        name="Study"
        component={StudyTabs}
        options={{
          tabBarLabel: 'Study',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? 'school' : 'school-outline'} size={28} color={color} />
          ),
          unmountOnBlur: true,
          popToTopOnBlur: true,
          tabBarStyle: { ...baseTabBarStyle, display: 'none' },
        }}
      />
      <Tab.Screen
        name="Battleground"
        component={BattlegroundStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) || 'BattlegroundMain';
          const hideTabBar = routeName === 'BattlegroundAttempt';

          return {
            tabBarLabel: 'Battleground',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons name={focused ? 'sword-cross' : 'sword'} size={28} color={color} />
            ),
            tabBarStyle: hideTabBar
              ? { ...baseTabBarStyle, display: 'none' }
              : baseTabBarStyle,
          };
        }}
      />
      <Tab.Screen
        name="MyTests"
        component={MyTestsStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) || 'MyTestsList';
          const hideTabBar = routeName === 'TestAttempt' || routeName === 'AttachmentViewer';

          return {
            tabBarLabel: 'My Tests',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons name={focused ? 'clipboard-text' : 'clipboard-text-outline'} size={28} color={color} />
            ),
            popToTopOnBlur: true,
            unmountOnBlur: true,
            tabBarStyle: hideTabBar
              ? { ...baseTabBarStyle, display: 'none' }
              : baseTabBarStyle,
          };
        }}
      />
    </Tab.Navigator>
  );
}
