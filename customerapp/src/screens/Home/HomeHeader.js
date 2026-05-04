import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../../constants/theme';

const HomeHeader = React.memo(({ 
  location, 
  address, 
  selectedSlot, 
  unreadCount, 
  activeTheme,
  headerColor,
  progress = 0,
  headerHeight = 60,
  headerOpacity = 1,
  onLocationPress,
  onSlotPress,
  onNotificationPress
}) => {
  if (headerHeight <= 0) return null;

  return (
    <View style={[styles.headerContainer, { 
      backgroundColor: headerColor || activeTheme.primary,
      height: headerHeight,
      overflow: 'hidden',
      opacity: headerOpacity
    }]}>
      <View style={[styles.headerTop, { height: headerHeight }]}>
        <TouchableOpacity 
          style={styles.locationContent} 
          onPress={onLocationPress}
        >
          <View style={[styles.locationIconWrapper, { 
            width: 34 - (progress * 4), 
            height: 34 - (progress * 4) 
          }]}>
            <Icon name="map-marker" size={18 - (progress * 2)} color={activeTheme.primary} />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={[styles.locationTitle, { fontSize: 14 - (progress * 1) }]}>
              {location.selectedAddress?.label || address?.split(',')[0] || 'Pick Location'}
            </Text>
            {progress < 0.8 && (
              <Text style={[styles.addressText, { opacity: 1 - (progress * 1.2) }]} numberOfLines={1}>
                {location.selectedAddress
                  ? `${location.selectedAddress.line1}${location.selectedAddress.line2 ? ', ' + location.selectedAddress.line2 : ''}`
                  : address || 'Select your delivery address'}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {selectedSlot && (
          <TouchableOpacity 
            style={styles.slotContainer}
            onPress={onSlotPress}
          >
            <View style={[styles.slotBadge, { 
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingVertical: 5 - (progress * 2),
              paddingHorizontal: 10 - (progress * 2)
            }]}>
              <Text style={[styles.slotBadgeText, { fontSize: 11 - (progress * 1) }]}>
                {selectedSlot === 'express' ? '⚡ Express' :
                  selectedSlot === 'today_evening' || selectedSlot === 'afternoon' ? '📅 Today' :
                    selectedSlot === 'tmrw_morning' || selectedSlot === 'morning' ? '📅 Tom.' :
                      '📅 Tom. Eve'}
              </Text>
              <Icon name="chevron-down" size={12 - (progress * 2)} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={onNotificationPress}
        >
          <Icon name="bell-outline" size={24 - (progress * 2)} color={COLORS.white} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadgeContainer}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: SPACING.l,
    paddingTop: 0,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
  },
  locationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  locationIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.s,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  addressText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginTop: -2,
  },
  slotContainer: {
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  slotBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4B6E',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default HomeHeader;
