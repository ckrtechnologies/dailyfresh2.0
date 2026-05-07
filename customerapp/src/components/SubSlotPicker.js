import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import apiClient from '../api/apiClient';

const { width } = Dimensions.get('window');

const SubSlotPicker = ({ visible, onClose, onSelect, storeId }) => {
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState({ tomorrow_morning: [], tomorrow_evening: [] });
  const [activeTab, setActiveTab] = useState('tomorrow_morning');

  useEffect(() => {
    if (visible) {
      fetchSlots();
    }
  }, [visible]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/customer/delivery-slots');
      if (response.data.success) {
        setSlots(response.data.data);
        // Default to morning if exists, else evening
        if (response.data.data.tomorrow_morning.length > 0) {
          setActiveTab('tomorrow_morning');
        } else if (response.data.data.tomorrow_evening.length > 0) {
          setActiveTab('tomorrow_evening');
        }
      }
    } catch (error) {
      console.error('Error fetching delivery slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSlot = ({ item }) => (
    <TouchableOpacity
      style={styles.slotItem}
      onPress={() => onSelect(item)}
    >
      <View style={styles.slotIcon}>
        <Icon name="clock-outline" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.slotInfo}>
        <Text style={styles.slotName}>{item.slot_name}</Text>
        {item.start_time && item.end_time && (
          <Text style={styles.slotTime}>
            {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
          </Text>
        )}
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.gray} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Delivery Time Window</Text>
              <Text style={styles.subtitle}>Select a slot for tomorrow's delivery</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <>
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'tomorrow_morning' && styles.activeTab]}
                  onPress={() => setActiveTab('tomorrow_morning')}
                >
                  <Icon 
                    name="weather-sunny" 
                    size={18} 
                    color={activeTab === 'tomorrow_morning' ? COLORS.primary : COLORS.gray} 
                  />
                  <Text style={[styles.tabText, activeTab === 'tomorrow_morning' && styles.activeTabText]}>
                    Morning
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'tomorrow_evening' && styles.activeTab]}
                  onPress={() => setActiveTab('tomorrow_evening')}
                >
                  <Icon 
                    name="weather-night" 
                    size={18} 
                    color={activeTab === 'tomorrow_evening' ? COLORS.primary : COLORS.gray} 
                  />
                  <Text style={[styles.tabText, activeTab === 'tomorrow_evening' && styles.activeTabText]}>
                    Evening
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={slots[activeTab]}
                keyExtractor={(item) => item.id}
                renderItem={renderSlot}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name="clock-alert-outline" size={48} color={COLORS.lightGray} />
                    <Text style={styles.emptyText}>No slots available for this period</Text>
                  </View>
                }
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height: '60%',
    paddingTop: SPACING.l,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.l,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.l,
    gap: 12,
    marginBottom: SPACING.m,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  activeTab: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  slotIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  slotInfo: {
    flex: 1,
  },
  slotName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  slotTime: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 12,
  },
});

export default SubSlotPicker;
