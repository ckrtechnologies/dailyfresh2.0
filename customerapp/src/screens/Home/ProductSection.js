import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ProductCard from '../../components/ProductCard';
import { COLORS, SPACING } from '../../constants/theme';

const ProductSection = React.memo(({ 
  title, 
  products, 
  activeTheme, 
  navigation, 
  timer = null, 
  type = 'all', 
  extraParams = {} 
}) => {
  const renderItem = useCallback(({ item }) => (
    <ProductCard
      product={item}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      horizontal={true}
      size="small"
    />
  ), [navigation]);

  if (!products || products.length === 0) return null;

  const getSectionIcon = (title) => {
    const t = title.toLowerCase();
    if (t.includes('flash')) return 'lightning-bolt';
    if (t.includes('deal')) return 'tag-heart';
    if (t.includes('frozen')) return 'snowflake';
    if (t.includes('exclusive')) return 'crown';
    if (t.includes('trending')) return 'trending-up';
    if (t.includes('new')) return 'star-face';
    if (t.includes('fresh')) return 'fish';
    return 'star';
  };

  const iconName = getSectionIcon(title);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIconCircle, { backgroundColor: activeTheme.primary + '10' }]}>
            <Icon name={iconName} size={18} color={activeTheme.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: activeTheme.text }]}>{title}</Text>
          {timer && (
            <View style={styles.timerBadge}>
              <Icon name="timer-outline" size={14} color={COLORS.white} />
              <Text style={styles.timerText}>{timer}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ProductList', {
          title,
          type,
          initialProducts: products,
          ...extraParams
        })}>
          <View style={styles.viewAllContainer}>
            <Text style={[styles.viewAll, { color: activeTheme.primary }]}>View All</Text>
            <Icon name="chevron-right" size={18} color={activeTheme.primary} />
          </View>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.horizontalList}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        renderItem={renderItem}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginVertical: SPACING.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4B6E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginLeft: 8,
  },
  timerText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  horizontalList: {
    paddingLeft: SPACING.l,
    paddingRight: SPACING.s,
  },
});

export default ProductSection;
