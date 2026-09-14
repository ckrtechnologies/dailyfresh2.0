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
  const selectedAddr = location?.selectedAddress;
  let locationTitle = 'Pick Location';
  let addressSubtitle = address || 'Select your delivery address';

  if (selectedAddr) {
    locationTitle = selectedAddr.label ? `Deliver to ${selectedAddr.label}` : (selectedAddr.city || 'Deliver Here');
    const street = [selectedAddr.line1, selectedAddr.line2].filter(Boolean).join(', ');
    addressSubtitle = `${street}${selectedAddr.city ? ', ' + selectedAddr.city : ''}${selectedAddr.pincode ? ' - ' + selectedAddr.pincode : ''}`;
  } else if (address) {
    const parts = address.split(',').map(s => s.trim()).filter(Boolean);
    locationTitle = `Deliver to ${parts[0] || 'Current Location'}`;
    const rest = parts.slice(1).join(', ');
    addressSubtitle = (rest || address) + (location?.pincode && !address.includes(location?.pincode) ? ` - ${location.pincode}` : '');
  } else if (location?.pincode) {
    locationTitle = `Pincode ${location.pincode}`;
    addressSubtitle = location?.storeName ? `Served by ${location.storeName}` : 'Express delivery in 90 mins';
  }

  const getSlotDisplay = (slot) => {
    if (!slot) return '⚡ Express';
    const s = String(slot).toLowerCase();
    if (s === 'express') return '⚡ Express';
    if (s === 'tomorrow') return '📅 Tomorrow';
    if (s === 'tomorrow_morning') return '📅 Tomorrow Morning';
    if (s === 'tomorrow_evening') return '📅 Tomorrow Evening';
    return '📅 ' + (s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '));
  };

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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.locationTitle, { fontSize: 14 - (progress * 1) }]} numberOfLines={1}>
                {locationTitle}
              </Text>
              {!location?.isServiceable && progress < 0.5 && (
                <View style={styles.unserviceableBadge}>
                  <Text style={styles.unserviceableBadgeText}>OUT OF SERVICE</Text>
                </View>
              )}
            </View>
            {progress < 0.8 && (
              <Text style={[styles.addressText, { opacity: 1 - (progress * 1.2) }]} numberOfLines={1}>
                {addressSubtitle}
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
              backgroundColor: 'rgba(0,0,0,0.25)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)',
              paddingVertical: 5 - (progress * 2),
              paddingHorizontal: 10 - (progress * 2)
            }]}>
              <Text style={[styles.slotBadgeText, { fontSize: 11 - (progress * 1), color: '#FFFFFF' }]}>
                {getSlotDisplay(selectedSlot)}
              </Text>
              <Icon name="chevron-down" size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={onNotificationPress}
        >
          <Icon name="bell" size={22 - (progress * 2)} color={COLORS.white} />
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
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  locationIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
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
    marginLeft: 4,
    marginRight: 4,
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
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
  unserviceableBadge: {
    backgroundColor: '#FF4B6E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  unserviceableBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '900',
  },
});

export default HomeHeader;
