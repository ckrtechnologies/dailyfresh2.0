import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import addressService from '../api/addressService';
import { useDispatch } from 'react-redux';
import { setSelectedAddress } from '../store/slices/locationSlice';
import { showGlobalAlert } from '../services/alertService';

const SavedAddressesScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await addressService.getAddresses();
      if (res.success) {
        setAddresses(res.data.addresses);
      }
    } catch (error) {
      console.error('Fetch addresses error:', error);
      showGlobalAlert('Error', 'Failed to load saved addresses', 'error');
    } finally {
      setLoading(false);
    }
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

  // Determine if we're in address-selection mode
  const isSelectMode = !!(
    route.params?.selectMode ||
    navigation.getState().routes.some(r => ['Cart', 'Checkout', 'LocationPicker'].includes(r.name))
  );

  const handleSelect = async (item) => {
    try {
      setLoading(true);
      const { default: apiClient } = await import('../api/apiClient');
      const storeRes = await apiClient.get('/customer/stores/nearest', { 
        params: { pincode: item.pincode, lat: item.latitude, lng: item.longitude } 
      });
      const store = storeRes.data?.data?.store;

      if (!store) {
        showGlobalAlert('Not Serviceable', 'Sorry, we do not currently deliver to this address.', 'warning');
        return;
      }

      // Attach store info to the selected address item before dispatching
      const addressWithStore = {
        ...item,
        store_id: store.id,
        store_name: store.name
      };

      dispatch(setSelectedAddress(addressWithStore));
      
      // If we came from Cart or Checkout, go back. 
      // Otherwise (like from Splash/Login flow), go to DeliveryMode as intended.
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('DeliveryMode');
      }
    } catch (error) {
      console.error('Error resolving store for address:', error);
      showGlobalAlert('Error', 'Failed to select address. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderAddressItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.addressCard} 
      onPress={isSelectMode ? () => handleSelect(item) : undefined}
      activeOpacity={isSelectMode ? 0.7 : 1}
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
        </View>
        <TouchableOpacity onPress={() => {
          showGlobalAlert(
            'Address Options',
            'What would you like to do?',
            'info',
            [
              { text: 'Cancel', style: 'cancel' },
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
        {isSelectMode ? (
          // In selection mode: show a clear primary CTA
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => handleSelect(item)}
          >
            <Icon name="check-circle-outline" size={16} color={COLORS.white} />
            <Text style={styles.selectBtnText}>Deliver Here</Text>
          </TouchableOpacity>
        ) : (
          // In browse mode: show Edit / Remove
          <>
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
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSelectMode ? 'Choose Delivery Address' : 'Saved Addresses'}
        </Text>
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
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: SPACING.m,
    paddingTop: SPACING.s,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.s,
  },
  actionText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  vDivider: {
    width: 1,
    backgroundColor: '#F3F4F6',
  },
  selectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.s,
    paddingVertical: 10,
    gap: 6,
  },
  selectBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
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
