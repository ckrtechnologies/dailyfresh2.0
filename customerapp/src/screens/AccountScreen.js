import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Share,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { logout } from '../store/slices/authSlice';
import { clearCart } from '../store/slices/cartSlice';
import { clearLocation } from '../store/slices/locationSlice';

const AccountScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            dispatch(clearCart());
            dispatch(clearLocation());
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
    { icon: 'package-variant-closed', label: 'My Orders', screen: 'Orders' },
    { icon: 'account-edit-outline', label: 'Edit Profile', screen: 'EditProfile' },
    { icon: 'map-marker-radius-outline', label: 'Saved Addresses', screen: 'SavedAddresses' },
    { icon: 'share-variant-outline', label: 'Share App', action: handleShareApp },
    { icon: 'ticket-percent-outline', label: 'Refer & Earn', screen: 'Referrals' },
    { icon: 'bell-ring-outline', label: 'Notifications', screen: 'Notifications' },
    { icon: 'chat-question-outline', label: 'Help & Support', screen: 'Support' },
    { icon: 'information-outline', label: 'About Daily Fresh', screen: 'About' },
  ];

  const renderMenuItem = (item) => {
    return (
      <TouchableOpacity 
        key={item.label} 
        style={styles.menuItem}
        onPress={() => {
          if (item.action) item.action();
          else if (item.screen) navigation.navigate(item.screen);
        }}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.iconContainer}>
            <Icon name={item.icon} size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.menuLabel}>{item.label}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={COLORS.gray} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.full_name || user?.name || 'Daily Fresh User'}</Text>
              <Text style={styles.userPhone}>{user?.phone || 'No phone linked'}</Text>
              {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Icon name="pencil-box-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="power" size={22} color="#B91C1C" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Daily Fresh v1.0.4 - Premium</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginTop: SPACING.xl,
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
    marginTop: SPACING.xl,
  },
});

export default AccountScreen;
