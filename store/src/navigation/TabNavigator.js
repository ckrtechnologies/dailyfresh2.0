import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import OrdersStackNavigator from './OrdersStackNavigator';
import InventoryListScreen from '../screens/inventory/InventoryListScreen';
import CustomerListScreen from '../screens/customers/CustomerListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'view-dashboard';
          else if (route.name === 'Orders') iconName = 'shopping';
          else if (route.name === 'Inventory') iconName = 'package-variant-closed';
          else if (route.name === 'Customers') iconName = 'account-group';
          else if (route.name === 'Profile') iconName = 'account';
          
          return <Icon name={iconName} color={color} size={size} />;
        },
        tabBarActiveTintColor: '#10b981', // emerald-500
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen 
        name="Orders" 
        component={OrdersStackNavigator} 
        options={{ 
          headerShown: false,
          unmountOnBlur: true 
        }} 
      />
      <Tab.Screen name="Inventory" component={InventoryListScreen} />
      <Tab.Screen name="Customers" component={CustomerListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
