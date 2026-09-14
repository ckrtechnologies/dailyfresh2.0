import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, THEMES, SPACING, RADIUS } from '../constants/theme';
import { logout, setCredentials } from '../store/slices/authSlice';
import { clearCart } from '../store/slices/cartSlice';
import { clearLocation } from '../store/slices/locationSlice';
import { clearOrders } from '../store/slices/orderSlice';
import { clearFavorites } from '../store/slices/favoritesSlice';
import authService from '../api/authService';
import { showGlobalAlert } from '../services/alertService';
import { RefreshControl } from 'react-native';

const AccountScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { selectedSlot } = useSelector((state) => state.config);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await authService.getUserProfile();
      if (res.success && res.data) {
        dispatch(setCredentials({ user: res.data, token }));
      }
    } catch (e) {
      console.warn('Error refreshing profile:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Safely extract user details
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.full_name || user?.name || 'Daily Fresh User';
  const userPhone = user?.phone || user?.user_metadata?.phone || 'No phone linked';
  const userInitials = userName !== 'Daily Fresh User' ? userName.charAt(0).toUpperCase() : 'U';

  const handleLogout = () => {
    showGlobalAlert(
      'Logout',
      'Are you sure you want to logout?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await authService.logout();
              dispatch(logout());
              dispatch(clearCart());
              dispatch(clearOrders());
              dispatch(clearFavorites());
              dispatch(clearLocation());
            } catch (error) {
              console.error('Logout error:', error);
              showGlobalAlert('Error', 'Failed to logout. Please try again.', 'error');
            }
          }
        },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Order fresh fish and meat from Daily Fresh! High quality, chemical-free, and delivered in 90 mins. \n\nDownload now: https://dailyfreshkolkata.in',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const menuItems = [
    { icon: 'package-variant', label: 'My Orders', screen: 'Orders' },
    { icon: 'account-cog', label: 'Account Settings', screen: 'EditProfile' },
    { icon: 'map-marker-path', label: 'Saved Addresses', screen: 'SavedAddresses', params: { selectMode: true } },
    { icon: 'share-all', label: 'Invite Friends', action: handleShareApp },
    { icon: 'bell-badge', label: 'Notifications', screen: 'Notifications' },
    { icon: 'headphones', label: 'Help & Support', screen: 'Support' },
    { icon: 'shield-lock-outline', label: 'Privacy Policy', screen: 'PrivacyPolicy' },
    { icon: 'file-refresh-outline', label: 'Return & Refund Policy', screen: 'ReturnPolicy' },
    { icon: 'information-variant', label: 'About Us', screen: 'About' },
  ];

  const renderMenuItem = (item) => {
    return (
      <TouchableOpacity
        key={item.label}
        style={styles.menuItem}
        onPress={() => {
          if (item.action) item.action();
          else if (item.screen) navigation.navigate(item.screen, item.params);
        }}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.iconContainer}>
            <Icon name={item.icon} size={22} color={activeTheme.primary} />
          </View>
          <Text style={styles.menuLabel}>{item.label}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={COLORS.gray} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={activeTheme.primary} />
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainContentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeTheme.primary]} />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={[styles.avatarContainer, { width: 64, height: 64, borderRadius: 32 }]}
              />
            ) : (
              <View style={[styles.avatarContainer, { backgroundColor: activeTheme.primary }]}>
                <Text style={styles.avatarText}>
                  {userInitials}
                </Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userPhone}>{userPhone}</Text>
              {!!user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: activeTheme.primary + '15' }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Icon name="pencil" size={20} color={activeTheme.primary} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map(renderMenuItem)}
        </View>

        <View style={styles.footerContainer}>
          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Icon name="power" size={22} color="#B91C1C" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Daily Fresh v1.0.4 - Premium</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mainContent: {
    flex: 1,
  },
  mainContentInner: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
  },
  userDetails: {
    marginLeft: SPACING.m,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 1,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(125, 180, 52, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuSection: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.m,
    paddingHorizontal: SPACING.l,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '500',
    marginLeft: SPACING.m,
  },
  footerContainer: {
    marginTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.l,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: SPACING.s,
  },
  version: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 12,
    marginTop: SPACING.m,
  },
});

export default AccountScreen;
