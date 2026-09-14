import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

const HomeSearch = React.memo(({ activeTheme, onSearchPress, headerColor, progress = 0, marginTop = 5 }) => {
  return (
    <View style={[styles.searchBarContainer, { 
      backgroundColor: headerColor || activeTheme.primary,
      paddingBottom: 4 - (progress * 2)
    }]}>
      <TouchableOpacity
        style={[styles.searchBar, { 
          marginTop: marginTop,
          height: 48 - (progress * 6)
        }]}
        onPress={onSearchPress}
      >
        <View style={styles.searchIconWrapper}>
          <Icon name="magnify" size={22 - (progress * 2)} color={activeTheme.primary} />
        </View>
        <Text style={[styles.searchText, { fontSize: 14 - (progress * 1) }]}>Search "Chicken" or "Fish"</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  searchBarContainer: {
    paddingHorizontal: SPACING.l,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.s,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  searchIconWrapper: {
    padding: 8,
  },
  searchText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
});

export default HomeSearch;
