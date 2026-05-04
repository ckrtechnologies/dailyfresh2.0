import React, { useRef, useState, useCallback } from 'react';
import { View, Image, TouchableOpacity, FlatList, Dimensions, StyleSheet } from 'react-native';
import { SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - SPACING.l * 2;
const BANNER_SNAP = BANNER_WIDTH + SPACING.s;

const BannerSlider = React.memo(({ banners, onBannerPress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const data = banners && banners.length > 0
    ? banners
    : [{ id: 'placeholder', image_url: 'https://via.placeholder.com/800x400' }];

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.bannerWrapper}
      onPress={() => onBannerPress(item)}
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.bannerImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  ), [onBannerPress]);

  const onMomentumScrollEnd = useCallback((e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_SNAP);
    setCurrentIndex(index);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_SNAP}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={renderItem}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={2}
        removeClippedSubviews={true}
      />
      {data.length > 1 && (
        <View style={styles.dotsContainer}>
          {data.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.m,
    marginBottom: 0,
  },
  listContent: {
    paddingLeft: SPACING.l,
    paddingRight: SPACING.s,
  },
  bannerWrapper: {
    width: BANNER_WIDTH,
    height: BANNER_WIDTH * 0.5,
    marginRight: SPACING.s,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 3,
  },
  dotActive: {
    width: 16,
    backgroundColor: '#9CA3AF',
  },
});

export default BannerSlider;
