import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import addressService from '../api/addressService';

const AddAddressScreen = ({ route, navigation }) => {
  const { locationData, editAddress } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: editAddress?.label || 'Home',
    full_name: editAddress?.full_name || '',
    phone: editAddress?.phone || '',
    line1: editAddress?.line1 || locationData?.address || '',
    line2: editAddress?.line2 || '',
    city: editAddress?.city || locationData?.city || 'Kolkata',
    state: editAddress?.state || locationData?.state || 'West Bengal',
    pincode: editAddress?.pincode || locationData?.pincode || '',
    latitude: editAddress?.latitude || locationData?.coords?.lat,
    longitude: editAddress?.longitude || locationData?.coords?.lng,
    is_default: editAddress?.is_default || false,
  });

  const handleSave = async () => {
    if (!formData.full_name || !formData.phone || !formData.line1 || !formData.pincode) {
      Alert.alert('Missing Info', 'Please fill all required fields marked with *');
      return;
    }

    try {
      setLoading(true);
      let res;
      if (editAddress) {
        res = await addressService.updateAddress(editAddress.id, formData);
      } else {
        res = await addressService.addAddress(formData);
      }

      if (res.success) {
        Alert.alert('Success', editAddress ? 'Address updated' : 'Address saved successfully');
        navigation.navigate('SavedAddresses');
      }
    } catch (error) {
      console.error('Save address error:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderLabelOption = (label) => (
    <TouchableOpacity 
      style={[
        styles.labelOption, 
        formData.label === label && styles.labelOptionActive
      ]}
      onPress={() => setFormData({ ...formData, label })}
    >
      <Icon 
        name={label === 'Home' ? 'home' : label === 'Work' ? 'briefcase' : 'map-marker'} 
        size={20} 
        color={formData.label === label ? COLORS.white : COLORS.gray} 
      />
      <Text style={[
        styles.labelOptionText,
        formData.label === label && styles.labelOptionTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editAddress ? 'Edit Address' : 'Add Address Details'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>SAVE ADDRESS AS</Text>
          <View style={styles.labelRow}>
            {renderLabelOption('Home')}
            {renderLabelOption('Work')}
            {renderLabelOption('Other')}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receiver's Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              value={formData.full_name}
              onChangeText={(val) => setFormData({ ...formData, full_name: val })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(val) => setFormData({ ...formData, phone: val })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>House No. / Building Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="House No, Floor, Building Name"
              value={formData.line1}
              onChangeText={(val) => setFormData({ ...formData, line1: val })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Area / Sector / Locality</Text>
            <TextInput
              style={styles.input}
              placeholder="Nearby Landmark, Sector etc."
              value={formData.line2}
              onChangeText={(val) => setFormData({ ...formData, line2: val })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.s }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.city}
                editable={false}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.s }]}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.pincode}
                editable={false}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.defaultRow}
            onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
          >
            <Icon 
              name={formData.is_default ? "checkbox-marked" : "checkbox-blank-outline"} 
              size={24} 
              color={formData.is_default ? COLORS.primary : COLORS.gray} 
            />
            <Text style={styles.defaultText}>Set as default delivery address</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveBtn, loading && styles.disabledBtn]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>{editAddress ? 'UPDATE ADDRESS' : 'SAVE ADDRESS'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    padding: SPACING.l,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray,
    letterSpacing: 1,
    marginBottom: SPACING.m,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  labelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.m,
    marginRight: SPACING.m,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  labelOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  labelOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    marginLeft: 6,
  },
  labelOptionTextActive: {
    color: COLORS.white,
  },
  inputGroup: {
    marginBottom: SPACING.l,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    fontSize: 15,
    color: COLORS.dark,
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  row: {
    flexDirection: 'row',
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.m,
  },
  defaultText: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: SPACING.s,
    fontWeight: '500',
  },
  footer: {
    padding: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.l,
    borderRadius: RADIUS.m,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default AddAddressScreen;
