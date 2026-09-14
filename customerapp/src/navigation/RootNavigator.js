import React from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector, useDispatch } from 'react-redux';
import { fetchActiveOrder } from '../store/slices/orderSlice';

export const navigationRef = createNavigationContainerRef();
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, THEMES } from '../constants/theme';
// Components & Config
import MiniCart from '../components/MiniCart';
import MiniOrderStatus from '../components/MiniOrderStatus';
import notificationService from '../services/notificationService';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LocationPickerScreen from '../screens/LocationPickerScreen';
import LoginScreen from '../screens/LoginScreen';
import OTPVerifyScreen from '../screens/OTPVerifyScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/Home';
import CategoriesScreen from '../screens/CategoriesScreen';
import CartScreen from '../screens/CartScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AccountScreen from '../screens/AccountScreen';
import ProductListingScreen from '../screens/ProductListingScreen';
import ProductListScreen from '../screens/ProductListScreen';
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
import DeliveryModeScreen from '../screens/DeliveryModeScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import ReturnPolicyScreen from '../screens/ReturnPolicyScreen';

// Navigation Config
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// High-Contrast iOS Standard Icon Mapping (Solid filled active, clean weighted inactive)
const ICON_MAP = {
  Home: { active: 'home', inactive: 'home-outline' },
  Favorites: { active: 'heart', inactive: 'heart-outline' },
  Categories: { active: 'view-grid', inactive: 'view-grid-outline' },
  Cart: { active: 'cart', inactive: 'cart-outline' },
  Account: { active: 'account-circle', inactive: 'account-circle-outline' }
};

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
  const { selectedSlot } = useSelector((state) => state.config);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const tabHeight = 56 + (bottomInset > 0 ? bottomInset : 10);
  const paddingBottom = bottomInset > 0 ? bottomInset + 4 : 8;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: activeTheme.primary, 
        tabBarInactiveTintColor: '#334155', // Dark solid slate for crisp iOS contrast
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          elevation: 12,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          height: tabHeight,
          paddingTop: 6,
          paddingBottom: paddingBottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: -0.2,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarIcon: ({ color, focused }) => {
          const iconConfig = ICON_MAP[route.name];
          const iconName = focused ? iconConfig.active : iconConfig.inactive;
          
          return <Icon name={iconName} size={24} color={color} />;
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
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '800',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            lineHeight: 16,
            textAlign: 'center',
          }
        }} 
      />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};



const MainStack = () => {
  const { isServiceable } = useSelector((state) => state.location);
  
  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={isServiceable ? 'AppTabs' : 'LocationPicker'}
    >
      {/* LocationPicker is ALWAYS registered so it can be navigated to at any time */}
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />
      <Stack.Screen name="DeliveryMode" component={DeliveryModeScreen} />
      <Stack.Screen name="AppTabs" component={AppTabs} />
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
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="ReturnPolicy" component={ReturnPolicyScreen} />
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
              Favorites: 'favorites',
              Categories: 'categories',
              Cart: 'cart',
              Account: 'account',
            },
          },
          Orders: 'orders',
          OrderDetail: 'order/:orderId',
          ProductDetail: 'product/:productId',
          ProductList: 'list/:type/:categoryId?',
          Search: 'search',
          Notifications: 'notifications',
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
    }
  }, [isAuthenticated, user]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer 
        linking={linking} 
        ref={navigationRef}
        onReady={() => {
          const route = navigationRef.getCurrentRoute();
          setCurrentRoute(route?.name);
          notificationService.flushPendingDeepLink();
        }}
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
      {isAuthenticated && currentRoute && !['LocationPicker', 'OrderSuccess', 'Cart', 'Checkout', 'Account', 'EditProfile', 'SavedAddresses', 'AddAddress', 'Orders', 'OrderDetail', 'Referrals', 'Notifications', 'Support', 'About'].includes(currentRoute) && (
        <>
          <MiniCart />
          <MiniOrderStatus />
        </>
      )}
    </GestureHandlerRootView>
  );
};

export default RootNavigator;
