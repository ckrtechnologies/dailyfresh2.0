import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { User, Bike, Star, LogOut, ChevronRight, Bell, Shield, Info } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/riderSlice';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
  const { user } = useSelector((state) => state.rider);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const MenuItem = ({ icon: Icon, title, value, color = '#3b82f6', showChevron = true }) => (
    <TouchableOpacity style={styles.menuItem}>
      <View style={[styles.menuIcon, { backgroundColor: `${color}15` }]}>
        <Icon color={color} size={20} />
      </View>
      <View style={styles.menuInfo}>
        <Text style={styles.menuTitle}>{title}</Text>
        {value && <Text style={styles.menuValue}>{value}</Text>}
      </View>
      {showChevron && <ChevronRight color="#94a3b8" size={20} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User color="#3b82f6" size={40} />
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user?.full_name || 'Rider'}</Text>
          <Text style={styles.email}>{user?.email || 'rider@dailyfresh.in'}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Bike color="#3b82f6" size={20} />
              <Text style={styles.statVal}>{user?.total_deliveries || user?.trips || '0'}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
          </View>
        </View>

        {/* SETTINGS GROUPS */}
        <Text style={styles.sectionLabel}>Vehicle Information</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon={Bike} title="Vehicle Type" value={user?.vehicle_type || 'Motorcycle'} color="#10b981" />
          <MenuItem icon={Info} title="Vehicle Number" value={user?.vehicle_number || 'WB 02 AB 1234'} color="#f59e0b" />
        </View>

        <Text style={styles.sectionLabel}>Account Settings</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon={Bell} title="Notifications" color="#8b5cf6" />
          <MenuItem icon={Shield} title="Privacy & Security" color="#ec4899" />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#ef4444" size={20} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.2 (Production)</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#f8f9faff',
    borderBottomWidth: 0,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { color: '#050000ff', fontSize: 24, fontWeight: 'bold' },
  scroll: { padding: 24 },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  editBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  editBtnText: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
  name: { color: '#1e293b', fontSize: 22, fontWeight: 'bold' },
  email: { color: '#64748b', fontSize: 14, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { color: '#1e293b', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  statLabel: { color: '#94a3b8', fontSize: 12 },
  divider: { width: 1, height: '100%', backgroundColor: '#e2e8f0' },
  
  sectionLabel: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuInfo: { flex: 1 },
  menuTitle: { color: '#1e293b', fontSize: 15, fontWeight: '500' },
  menuValue: { color: '#64748b', fontSize: 13, marginTop: 2 },
  
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
  version: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 32,
    marginBottom: 16,
  },
});

export default ProfileScreen;
