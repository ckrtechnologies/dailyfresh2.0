import React from 'react';
import { View, Image } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector, useDispatch } from 'react-redux';
import { fetchActiveOrder } from '../store/slices/orderSlice';

export const navigationRef = createNavigationContainerRef();
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/theme';
import MiniCart from '../components/MiniCart';


// Basic Icon Mapping
const ICON_MAP = {
  Home: { active: 'home', inactive: 'home-outline' },
  Favorites: { active: 'heart', inactive: 'heart-outline' },
  Categories: { active: 'view-dashboard', inactive: 'view-dashboard-outline' },
  Cart: { active: 'shopping', inactive: 'shopping-outline' },
  Account: { active: 'account', inactive: 'account-outline' }
};


// Screens
import SplashScreen from '../screens/SplashScreen';
import LocationPickerScreen from '../screens/LocationPickerScreen';
import LoginScreen from '../screens/LoginScreen';
import OTPVerifyScreen from '../screens/OTPVerifyScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import CartScreen from '../screens/CartScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AccountScreen from '../screens/AccountScreen';
import ProductListingScreen from '../screens/ProductListingScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import OrdersScreen from '../screens/OrdersScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SavedAddressesScreen from '../screens/SavedAddressesScreen';
import ReferralsScreen from '../screens/ReferralsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SupportScreen from '../screens/SupportScreen';
import AboutScreen from '../screens/AboutScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import SearchScreen from '../screens/SearchScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import MiniOrderStatus from '../components/MiniOrderStatus';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AppTabs = () => {
  const { items: cartItems } = useSelector((state) => state.cart);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#10b981', // Consistent Emerald Green
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconConfig = ICON_MAP[route.name];
          const iconName = focused ? iconConfig.active : iconConfig.inactive;
          
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} /> 
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen} 
        options={{ 
          tabBarBadge: cartItems.length > 0 ? cartItems.length : null,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.secondary || '#F97316',
            color: COLORS.white,
            fontSize: 10,
          }
        }} 
      />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

import ProductListScreen from '../screens/ProductListScreen';

const MainStack = () => {
  const { isServiceable } = useSelector((state) => state.location);
  
  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={!isServiceable ? "LocationPicker" : "AppTabs"}
    >
      <Stack.Screen name="AppTabs" component={AppTabs} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />
      <Stack.Screen name="ProductListing" component={ProductListingScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="Referrals" component={ReferralsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
    </Stack.Navigator>
  );
};

const linking = {
  prefixes: ['dailyfresh://', 'https://dailyfreshkolkata.in'],
  config: {
    screens: {
      Main: {
        screens: {
          AppTabs: {
            screens: {
              Home: 'home',
              Categories: 'categories',
              Orders: 'orders',
              Account: 'account',
            },
          },
          ProductDetail: 'product/:productId',
          ProductList: 'list/:type/:categoryId?',
          OrderDetail: 'order/:orderId',
          Search: 'search',
        },
      },
      Auth: {
        screens: {
          Login: 'login',
          Signup: 'signup',
        }
      }
    },
  },
};

const RootNavigator = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { activeOrder } = useSelector((state) => state.order);
  const dispatch = useDispatch();
  const [currentRoute, setCurrentRoute] = React.useState(null);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchActiveOrder());
      
      const interval = setInterval(() => {
        dispatch(fetchActiveOrder());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer 
        linking={linking} 
        ref={navigationRef}
        onStateChange={() => {
          const route = navigationRef.getCurrentRoute();
          setCurrentRoute(route?.name);
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthStack} />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainStack} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {isAuthenticated && !['LocationPicker', 'OrderSuccess'].includes(currentRoute) && (
        <>
          <MiniCart />
          <MiniOrderStatus />
        </>
      )}
    </GestureHandlerRootView>
  );
};

export default RootNavigator;
