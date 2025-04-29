import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Icon } from 'react-native-paper';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import WorkoutsStack from './stacks/WorkoutsStack';

const Tab = createBottomTabNavigator();

const Stub = () => <View style={{ flex: 1, backgroundColor: '#181818' }} />;

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#181818', borderTopWidth: 0 },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'circle';
          if (route.name === 'Dashboard') iconName = 'view-dashboard';
          if (route.name === 'Workouts') iconName = 'calendar-check';
          if (route.name === 'Add') iconName = 'plus-circle';
          if (route.name === 'Library') iconName = 'book-open-variant';
          if (route.name === 'Profile') iconName = 'account-circle';
          return <Icon source={iconName} color={color} size={size} />;
        },
        tabBarActiveTintColor: '#BB86FC',
        tabBarInactiveTintColor: '#888',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen 
        name="Workouts" 
        component={WorkoutsStack} 
        listeners={{
          tabPress: (e) => {
            console.log('[MainTabNavigator] Workouts tab pressed');
          },
        }}
      />
      <Tab.Screen name="Add" component={Stub} />
      <Tab.Screen name="Library" component={Stub} />
      <Tab.Screen name="Profile">
        {() => <ProfileScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
} 