import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';
import { storeApi } from '../../services/api';
import Toast from 'react-native-toast-message';
import { supabase } from '../../services/supabase';
import { alertService } from '../../utils/alertService';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const [storeProfile, setStoreProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await storeApi.getStoreProfile();
      if (response.data?.success) {
        setStoreProfile(response.data.data.store);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleToggleStoreStatus = async (currentStatus) => {
    try {
      await storeApi.updateStoreStatus(!currentStatus);
      setStoreProfile({ ...storeProfile, is_active: !currentStatus });
      Toast.show({ type: 'success', text1: !currentStatus ? 'Store is now Online' : 'Store is Offline' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

  const handleLogout = () => {
    alertService.show({
      title: 'Logout',
      message: 'Are you sure you want to log out?',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await supabase.auth.signOut();
            dispatch(logout());
          },
        },
      ]
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* User Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Icon name="storefront" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.name}>{storeProfile?.name || 'Store Manager'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>STORE MANAGER</Text>
          </View>
        </View>

        {/* Store Status Card */}
        {storeProfile && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Icon name="power" size={24} color={storeProfile.is_active ? COLORS.success : COLORS.gray} />
                <Text style={styles.cardTitle}>Store Status</Text>
              </View>
              <Switch
                value={storeProfile.is_active}
                onValueChange={() => handleToggleStoreStatus(storeProfile.is_active)}
                trackColor={{ false: COLORS.border, true: COLORS.success }}
              />
            </View>
            <Text style={styles.statusDescription}>
              {storeProfile.is_active
                ? 'Your store is online and accepting new orders.'
                : 'Your store is currently offline. Customers cannot place new orders.'}
            </Text>
          </View>
        )}

        {/* Operational Details */}
        {storeProfile && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Operational Details</Text>

            <View style={styles.detailRow}>
              <Icon name="map-marker-outline" size={20} color={COLORS.gray} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Store Address</Text>
                <Text style={styles.detailValue}>{storeProfile.address || 'Not specified'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Icon name="map-marker-radius-outline" size={20} color={COLORS.gray} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Primary Pincode</Text>
                <Text style={styles.detailValue}>{storeProfile.pincode}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Icon name="phone-outline" size={20} color={COLORS.gray} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Contact Phone</Text>
                <Text style={styles.detailValue}>{storeProfile.phone || 'Not specified'}</Text>
              </View>
            </View>

          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Store Manager App v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.m },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.dark, marginBottom: 4 },
  email: { fontSize: 14, color: COLORS.gray, marginBottom: SPACING.m },
  roleBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
    borderRadius: RADIUS.badge,
  },
  roleText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.card, padding: SPACING.l, marginBottom: SPACING.m, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.s },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  statusDescription: { fontSize: 13, color: COLORS.gray, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, marginBottom: SPACING.m },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.m },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 2 },
  detailValue: { fontSize: 14, color: COLORS.dark, fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.m, marginLeft: 36 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: RADIUS.button,
    marginTop: SPACING.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutText: { color: COLORS.error, fontWeight: 'bold', fontSize: 16, marginLeft: SPACING.s },
  versionText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 12,
    marginTop: SPACING.xl,
    marginBottom: SPACING.l,
  }
});
