import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import addressService from '../api/addressService';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedAddress, setLocation } from '../store/slices/locationSlice';
import { showGlobalAlert } from '../services/alertService';

const SavedAddressesScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const fetchAddresses = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (addresses.length === 0) setLoading(true);
      const res = await addressService.getAddresses();
      if (res.success) {
        setAddresses(res.data.addresses || []);
    } 
  }
    catch (error) {
      console.log('Fetch addresses error (guest or auth needed):', error?.message);
      setAddresses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchAddresses(true);
  };

  const handleDelete = async (id) => {
    showGlobalAlert(
      'Delete Address',
      'Are you sure you want to remove this address?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            const res = await addressService.deleteAddress(id);
            if (res.success) {
              await fetchAddresses();
            } else {
              showGlobalAlert('Error', res.error || 'Failed to delete address', 'error');
            }
          } catch (error) {
            console.error('Delete address error:', error);
            showGlobalAlert('Error', 'Failed to delete address. Please try again.', 'error');
          } finally {
            setLoading(false);
          }
        }
        }
      ]
    );
  };

  const selectedAddress = useSelector((state) => state.location?.selectedAddress);

  const handleSelect = async (item) => {
    try {
      setLoading(true);
      const { default: apiClient } = await import('../api/apiClient');
      const storeParams = {
        pincode: item.pincode,
        lat: item.latitude || undefined,
        lng: item.longitude || undefined,
      };
      
      let store = null;
      let isDeliverable = false;

      try {
        const storeRes = await apiClient.get('/customer/stores/nearest', { 
          params: storeParams 
        });
        const storeData = storeRes.data?.data;
        store = storeData?.store;
        isDeliverable = storeData?.is_deliverable === true && !!store;
      } catch (storeErr) {
        console.warn('Store nearest check warning:', storeErr);
      }

      // Attach store info to the selected address item before dispatching
      const addressWithStore = {
        ...item,
        store_id: isDeliverable ? store.id : null,
        store_name: isDeliverable ? store.name : null,
        is_serviceable: isDeliverable,
      };

      dispatch(setSelectedAddress(addressWithStore));

      if (!isDeliverable) {
        showGlobalAlert('Outside Service Area', 'We do not deliver to this pincode yet. We are coming near you soon!', 'info');
      }

      const routes = navigation.getState()?.routes || [];
      const prevRoute = routes.length >= 2 ? routes[routes.length - 2]?.name : null;
      
      if (['Cart', 'Checkout'].includes(prevRoute) && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'AppTabs', params: { screen: 'Home' } }],
        });
      }
    } catch (error) {
      console.error('Error resolving store for address:', error);
      showGlobalAlert('Error', 'Failed to select address. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderAddressItem = ({ item }) => {
    const isSelected = !!(
      (selectedAddress?.id && selectedAddress.id === item.id) ||
      (!selectedAddress?.id && selectedAddress?.pincode === item.pincode && selectedAddress?.line1 === item.line1)
    );

    return (
      <TouchableOpacity 
        style={[
          styles.addressCard,
          isSelected && styles.addressCardSelected
        ]} 
        onPress={() => handleSelect(item)}
        activeOpacity={0.75}
      >
        <View style={styles.addressHeader}>
          <View style={styles.labelContainer}>
            <Icon 
              name={item.label === 'Home' ? 'home-outline' : item.label === 'Work' ? 'briefcase-outline' : 'map-marker-outline'} 
              size={20} 
              color={COLORS.primary} 
            />
            <Text style={styles.label}>{item.label}</Text>
            {item.is_default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>DEFAULT</Text>
              </View>
            )}
            {isSelected && (
              <View style={styles.activeDeliveryBadge}>
                <Icon name="check" size={12} color="#15803D" style={{ marginRight: 2 }} />
                <Text style={styles.activeDeliveryText}>DELIVERING HERE</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => {
            showGlobalAlert(
              'Address Options',
              'What would you like to do?',
              'info',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Deliver to this Address', onPress: () => handleSelect(item) },
                { text: 'Edit', onPress: () => navigation.navigate('AddAddress', { editAddress: item }) },
                { text: 'Delete', onPress: () => handleDelete(item.id), style: 'destructive' },
              ]
            );
          }}>
            <Icon name="dots-vertical" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
        <Text style={styles.addressText}>{item.line1}{item.line2 ? `, ${item.line2}` : ''}</Text>
        <Text style={styles.addressSub}>{item.city}, {item.state} - {item.pincode}</Text>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.selectBtn,
              isSelected && styles.selectBtnActive
            ]}
            onPress={() => handleSelect(item)}
            activeOpacity={0.8}
          >
            <Icon 
              name={isSelected ? "check-circle" : "truck-delivery-outline"} 
              size={17} 
              color={isSelected ? '#15803D' : COLORS.white} 
            />
            <Text style={[
              styles.selectBtnText,
              isSelected && styles.selectBtnTextActive
            ]}>
              {isSelected ? 'Delivering to this Address' : 'Deliver Here'}
            </Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AddAddress', { editAddress: item })}
            >
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.vDivider} />
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddressItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListHeaderComponent={
            <TouchableOpacity 
              style={[styles.addBtn, { marginBottom: SPACING.m, borderColor: '#3B82F6', backgroundColor: '#EFF6FF', borderStyle: 'solid' }]}
              onPress={() => navigation.navigate('LocationPicker', { changeLocation: true })}
            >
              <Icon name="crosshairs-gps" size={22} color="#2563EB" />
              <Text style={[styles.addBtnText, { color: '#2563EB' }]}>Detect GPS / Enter New Pincode</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="map-marker-off-outline" size={60} color={COLORS.gray} />
              <Text style={styles.emptyTitle}>No Addresses Found</Text>
              <Text style={styles.emptySubtitle}>You haven't saved any delivery addresses yet.</Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity 
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddAddress')}
            >
              <Icon name="plus" size={24} color={COLORS.primary} />
              <Text style={styles.addBtnText}>Add New Address</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.m,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.s,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
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
  listContent: {
    padding: SPACING.m,
  },
  addressCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginLeft: SPACING.s,
  },
  defaultBadge: {
    backgroundColor: 'rgba(125, 180, 52, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: SPACING.s,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  addressSub: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: '#F7FEE7',
  },
  activeDeliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: SPACING.s,
  },
  activeDeliveryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: SPACING.m,
    paddingTop: SPACING.s,
    gap: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.s,
    alignItems: 'center',
  },
  actionText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  vDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  selectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.s,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 6,
  },
  selectBtnActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  selectBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  selectBtnTextActive: {
    color: '#15803D',
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.l,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    marginTop: SPACING.s,
  },
  addBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: SPACING.s,
  },
});

export default SavedAddressesScreen;
