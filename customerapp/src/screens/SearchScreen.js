import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import productService from '../api/productService';
import ProductCard from '../components/ProductCard';
import LogoLoader from '../components/LogoLoader';
import ComingSoonScreen from './ComingSoonScreen';

const SearchScreen = ({ navigation }) => {
  const { storeId, isServiceable, pincode } = useSelector((state) => state.location);
  const { selectedSlot } = useSelector((state) => state.config);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced search logic to avoid hitting API too frequently
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        handleSearch(searchQuery);
      } else {
        setProducts([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, storeId, selectedSlot]);

  const handleSearch = async (query) => {
    if (!isServiceable || !storeId) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const res = await productService.getProducts({ 
        search: query, 
        storeId, 
        deliveryType: selectedSlot 
      });
      if (res.success) {
        // Group products by sub_category
        const grouped = res.data.reduce((acc, product) => {
          const subCatName = product.sub_category?.name || 'Other';
          if (!acc[subCatName]) acc[subCatName] = [];
          acc[subCatName].push(product);
          return acc;
        }, {});
        
        // Convert to array of objects for easier mapping
        const sections = Object.keys(grouped).map(name => ({
          title: name,
          data: grouped[name]
        }));
        
        setProducts(sections);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color={COLORS.dark} />
      </TouchableOpacity>
      <View style={styles.searchBarContainer}>
        <Icon name="magnify" size={22} color={COLORS.primary} />
        <TextInput
          placeholder='Search "Chicken", "Fish", "Meat"...'
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          placeholderTextColor={COLORS.gray}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (!isServiceable) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        {renderHeader()}
        <ComingSoonScreen pincode={pincode} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {renderHeader()}
        
        {loading ? (
          <View style={styles.centerContainer}>
            <LogoLoader size={100} />
          </View>
        ) : searchQuery.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="magnify" size={80} color="#F3F4F6" />
            <Text style={styles.emptyTitle}>What are you looking for?</Text>
            <Text style={styles.emptySubtitle}>Search for your favorite fresh meat and fish.</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="emoticon-sad-outline" size={80} color="#F3F4F6" />
            <Text style={styles.emptyTitle}>No Results Found</Text>
            <Text style={styles.emptySubtitle}>Try searching for something else like "Mutton" or "Prawns".</Text>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
            keyboardShouldPersistTaps="handled"
          >
            {products.map((section) => (
              <View key={section.title} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleLine} />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.sectionTitleLine} />
                </View>
                <View style={styles.productGrid}>
                  {section.data.map((item) => (
                    <View key={item.id} style={styles.productWrapper}>
                      <ProductCard
                        product={item}
                        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  backBtn: {
    padding: SPACING.s,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.button,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.dark,
    paddingVertical: 0,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  section: {
    marginTop: SPACING.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  sectionTitleLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gray,
    marginHorizontal: SPACING.m,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.s,
  },
  productWrapper: {
    width: '50%',
    padding: 6,
    display: 'flex',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.m,
    color: COLORS.gray,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.l,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.s,
  },
});

export default SearchScreen;
