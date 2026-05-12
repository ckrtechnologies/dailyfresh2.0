import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { supabase } from '../api/supabase';
import { setCredentials } from '../store/slices/authSlice';
import { showGlobalAlert } from '../services/alertService';

const EditProfileScreen = ({ navigation }) => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const initialName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.full_name || user?.name || '';
  
  // Filter out sso_ placeholders from the UI
  const rawPhone = user?.phone || user?.user_metadata?.phone || '';
  const initialPhone = rawPhone.startsWith('sso_') ? '' : rawPhone;
  
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!name.trim()) {
      showGlobalAlert('Error', 'Please enter your name', 'error');
      return;
    }
    setLoading(true);
    
    try {
      const { default: authService } = await import('../api/authService');
      const res = await authService.updateProfile({ full_name: name, phone });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update profile');
      }

      // Also update the local auth session so it shows immediately
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: name, phone: phone }
      });

      // Update Redux state with the new user object
      dispatch(setCredentials({ user: data?.user || user, token }));

      showGlobalAlert('Success', 'Profile updated successfully', 'success', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('Update Profile Error:', err);
      showGlobalAlert('Error', err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { overflow: 'hidden' }]}>
              {user?.avatar_url ? (
                <Image 
                  source={{ uri: user.avatar_url }} 
                  style={{ width: '100%', height: '100%' }} 
                />
              ) : (
                <Text style={styles.avatarText}>{name.charAt(0) || 'U'}</Text>
              )}
              <TouchableOpacity style={styles.cameraIcon}>
                <Icon name="camera" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.changeText}>Change Profile Picture</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Icon name="account-outline" size={20} color={COLORS.gray} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputContainer, styles.disabledInput]}>
                <Icon name="email-outline" size={20} color={COLORS.gray} />
                <TextInput
                  style={styles.input}
                  value={email}
                  editable={false}
                  placeholder="Email address"
                />
              </View>
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Icon name="phone-outline" size={20} color={COLORS.gray} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.updateBtn} 
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.updateBtnText}>Update Profile</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={handleDeleteAccount}
            disabled={loading}
          >
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const handleDeleteAccount = () => {
  showGlobalAlert(
    'Delete Account',
    'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
    'warning',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            const { default: authService } = await import('../api/authService');
            const res = await authService.deleteAccount();
            if (res.success) {
              const { logout } = await import('../store/slices/authSlice');
              // logout logic here
              showGlobalAlert('Account Deleted', 'Your account has been successfully removed.', 'success');
            } else {
              throw new Error(res.error);
            }
          } catch (err) {
            showGlobalAlert('Error', err.message || 'Failed to delete account', 'error');
          }
        }
      }
    ]
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: SPACING.s,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 40,
    color: COLORS.white,
    fontWeight: '700',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.dark,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  changeText: {
    marginTop: SPACING.m,
    color: COLORS.primary,
    fontWeight: '600',
  },
  form: {
    marginTop: SPACING.m,
  },
  inputGroup: {
    marginBottom: SPACING.l,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.s,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.m,
    height: 50,
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  input: {
    flex: 1,
    marginLeft: SPACING.s,
    fontSize: 16,
    color: COLORS.dark,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  updateBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.m,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  updateBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  deleteBtn: {
    marginTop: SPACING.xl,
    padding: SPACING.m,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
