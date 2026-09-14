import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../../constants/theme';

const CategoryStrip = React.memo(({ 
  categories, 
  activeTheme, 
  navigation,
  onCategoryPress, 
  onViewAllPress 
}) => {
  const handleCategoryPress = useCallback((item) => {
    if (onCategoryPress) {
      onCategoryPress(item);
    } else if (navigation) {
      navigation.navigate('ProductList', {
        categoryId: item.id,
        title: item.name
      });
    }
  }, [onCategoryPress, navigation]);

  const handleViewAll = useCallback(() => {
    if (onViewAllPress) {
      onViewAllPress();
    } else if (navigation) {
      navigation.navigate('Categories');
    }
  }, [onViewAllPress, navigation]);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.imageWrapper, { borderColor: activeTheme.primary + '30' }]}>
        <Image
          source={{ uri: item.image_url || item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: activeTheme.text }]} numberOfLines={1}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  ), [handleCategoryPress, activeTheme]);

  if (!categories || categories.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconCircle, { backgroundColor: activeTheme.primary + '15' }]}>
            <Icon name="grid" size={18} color={activeTheme.primary} />
          </View>
          <Text style={[styles.title, { color: activeTheme.text }]}>Shop by Category</Text>
        </View>
        <TouchableOpacity onPress={handleViewAll} activeOpacity={0.6}>
          <View style={styles.viewAllContainer}>
            <Text style={[styles.viewAll, { color: activeTheme.primary }]}>View All</Text>
            <Icon name="chevron-right" size={18} color={activeTheme.primary} />
          </View>
        </TouchableOpacity>
      </View>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={3}
        removeClippedSubviews={true}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '800',
  },
  listContent: {
    paddingLeft: SPACING.l,
    paddingRight: SPACING.m,
  },
  categoryCard: {
    width: 85,
    marginRight: 15,
    alignItems: 'center',
  },
  imageWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    borderWidth: 2,
    padding: 2, // Tiny gap between border and image
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  info: {
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  name: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
});

export default CategoryStrip;
