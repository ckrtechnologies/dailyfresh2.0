import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert, Image, TextInput, Switch, Modal, ScrollView, Dimensions } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { storeApi } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';
import Toast from 'react-native-toast-message';

import InventoryItem from '../../components/inventory/InventoryItem';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'basics', label: 'Basics', icon: 'information' },
  { id: 'pricing', label: 'Price & Stock', icon: 'currency-inr' },
  { id: 'variants', label: 'Variants', icon: 'layers' },
  { id: 'info', label: 'Guide & Flags', icon: 'star' },
  { id: 'media', label: 'Media', icon: 'image' },
];

export default function InventoryListScreen() {
  const dispatch = useDispatch();
  const { globalFilter } = useSelector(state => state.app);
  const { dateRange, customRange } = globalFilter;

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // CRUD Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [activeTab, setActiveTab] = useState('basics');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const initialForm = {
    name: '',
    description: '',
    price: '',
    discount_price: '',
    express_stock_qty: '0',
    scheduled_stock_qty: '0',
    sku: '',
    category_id: '',
    sub_category_id: '',
    cooking_guide: '',
    is_deal: false,
    is_featured: false,
    is_trending: false,
    is_flash_sale: false,
    delivery_options: ['express', 'today_evening', 'tmrw_morning', 'tmrw_evening'],
    variants: [],
    image_url: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = { _t: Date.now() };
      console.log('[Inventory] Fetching products...');
      const response = await storeApi.getInventory(params);
      console.log('[Inventory] Fetch response:', response.status, response.data?.success ? 'Success' : 'Failure');
      if (response.data?.success) {
        const productData = response.data.data?.products || [];
        setProducts(productData);
        setFilteredProducts(productData);
      }
    } catch (error) {
      console.error('[Inventory] Fetch error:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch inventory' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchClassification = async () => {
    try {
      const catRes = await storeApi.getCategories();
      if (catRes.data?.success) {
        setCategories(catRes.data.data.categories);
      }
    } catch (error) {
      console.error('Classification fetch error', error);
    }
  };

  useEffect(() => {
    fetchClassification();
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      storeApi.getSubCategories(formData.category_id).then(res => {
        if (res.data?.success) {
          setSubCategories(res.data.data.sub_categories);
        }
      });
    } else {
      setSubCategories([]);
    }
  }, [formData.category_id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredProducts(products);
      return;
    }
    const lowerText = text.toLowerCase();
    const filtered = products.filter(p =>
      p.name?.toLowerCase().includes(lowerText) ||
      (p.sku && p.sku.toLowerCase().includes(lowerText))
    );
    setFilteredProducts(filtered);
  };

  const handleToggleActive = async (productId, currentStatus) => {
    try {
      await storeApi.updateProductStatus(productId, !currentStatus);
      const updated = products.map(p => p.id === productId ? { ...p, is_active: !currentStatus } : p);
      setProducts(updated);
      setFilteredProducts(updated.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      ));
      Toast.show({ type: 'success', text1: currentStatus ? 'Product deactivated' : 'Product activated' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

  const handleOpenAdd = () => {
    setEditingProductId(null);
    setSelectedImage(null);
    setFormData(initialForm);
    setActiveTab('basics');
    setModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setEditingProductId(item.id);
    setSelectedImage(null);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price ? item.price.toString() : '',
      discount_price: item.discount_price ? item.discount_price.toString() : '',
      express_stock_qty: item.express_stock_qty ? item.express_stock_qty.toString() : '0',
      scheduled_stock_qty: item.scheduled_stock_qty ? item.scheduled_stock_qty.toString() : '0',
      sku: item.sku || '',
      category_id: item.sub_category?.category_id || '',
      sub_category_id: item.sub_category_id || '',
      cooking_guide: item.cooking_guide || '',
      is_deal: !!item.is_deal,
      is_featured: !!item.is_featured,
      is_trending: !!item.is_trending,
      is_flash_sale: !!item.is_flash_sale,
      delivery_options: item.delivery_options || ['express', 'today_evening', 'tmrw_morning', 'tmrw_evening'],
      variants: item.variants || [],
      image_url: item.image_url || ''
    });
    setActiveTab('basics');
    setModalVisible(true);
  };

  const handleDelete = (productId) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await storeApi.deleteProduct(productId);
            Toast.show({ type: 'success', text1: 'Product deleted' });
            fetchInventory();
          } catch (error) {
            Toast.show({ type: 'error', text1: 'Delete failed' });
          }
        }
      }
    ]);
  };

  const pickVariantImage = (index) => {
    const options = {
      mediaType: 'photo',
      quality: 0.7,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const source = response.assets[0];
        const newVariants = [...formData.variants];
        newVariants[index].imageFile = source;
        newVariants[index].image_url = source.uri; // Preview
        setFormData({ ...formData, variants: newVariants });
      }
    });
  };

  const handleSave = async () => {
    console.log('[Inventory] handleSave called. Mode:', editingProductId ? 'Edit' : 'Add');
    console.log('[Inventory] Form data:', formData);

    if (!formData.name || !formData.price || !formData.sub_category_id) {
      console.log('[Inventory] Validation failed');
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Name, Price and Category are required' });
      setActiveTab('basics');
      return;
    }
    setSaving(true);
    try {
      const payload = new FormData();
      // Append fields to FormData, avoiding duplicates and handling numbers properly
      const fieldsToSkip = ['image_url', 'price', 'discount_price', 'express_stock_qty', 'scheduled_stock_qty', 'variants', 'delivery_options'];

      Object.keys(formData).forEach(key => {
        if (!fieldsToSkip.includes(key) && formData[key] !== null && formData[key] !== undefined) {
          payload.append(key, formData[key].toString());
        }
      });

      // Handle special types
      const variantsToSave = formData.variants.map((v, index) => {
        if (v.imageFile) {
          payload.append(`variant_image_${index}`, {
            uri: v.imageFile.uri,
            type: v.imageFile.type || 'image/jpeg',
            name: v.imageFile.fileName || `variant_${index}_${Date.now()}.jpg`,
          });
        }
        const { imageFile, ...rest } = v;
        return rest;
      });

      payload.append('variants', JSON.stringify(variantsToSave || []));
      payload.append('delivery_options', JSON.stringify(formData.delivery_options || []));

      // Numbers as strings
      payload.append('price', (parseFloat(formData.price) || 0).toString());
      if (formData.discount_price && formData.discount_price !== '') {
        payload.append('discount_price', parseFloat(formData.discount_price).toString());
      }
      payload.append('express_stock_qty', (parseInt(formData.express_stock_qty, 10) || 0).toString());
      payload.append('scheduled_stock_qty', (parseInt(formData.scheduled_stock_qty, 10) || 0).toString());

      // Add the image file if selected
      if (selectedImage) {
        payload.append('image', {
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: selectedImage.fileName || `product_${Date.now()}.jpg`,
        });
      } else if (formData.image_url && formData.image_url.startsWith('http')) {
        payload.append('image_url', formData.image_url);
      }

      console.log('[Inventory] Sending payload to API...');
      if (editingProductId) {
        console.log('[Inventory] Calling updateProduct for ID:', editingProductId);
        await storeApi.updateProduct(editingProductId, payload);
        Toast.show({ type: 'success', text1: 'Product updated' });
      } else {
        console.log('[Inventory] Calling createProduct');
        await storeApi.createProduct(payload);
        Toast.show({ type: 'success', text1: 'Product added' });
      }
      setModalVisible(false);
      fetchInventory();
    } catch (error) {
      console.error('[Inventory] Save error:', error.response?.data || error);
      Toast.show({ type: 'error', text1: 'Save failed', text2: error.response?.data?.message });
    } finally {
      setSaving(false);
    }
  };

  const addVariant = () => {
    const newVariant = {
      id: `temp_${Date.now()}`,
      name: '',
      price: '',
      discount_price: '',
      weight_text: '',
      gross_weight_text: '',
      delivery_info: ['Tomorrow Morning'],
      description: '',
      image_url: ''
    };
    setFormData({ ...formData, variants: [...formData.variants, newVariant] });
  };

  const [selectedImage, setSelectedImage] = useState(null);

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      });

      if (result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        setFormData({ ...formData, image_url: result.assets[0].uri });
      }
    } catch (error) {
      console.log('ImagePicker Error:', error);
      Alert.alert(
        'Feature Restricted',
        'To enable gallery uploads, please install the image picker library:\n\nnpm install react-native-image-picker'
      );
    }
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const removeVariant = (index) => {
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData({ ...formData, variants: newVariants });
  };

  const toggleDeliveryOption = (option) => {
    const options = [...formData.delivery_options];
    const index = options.indexOf(option);
    if (index > -1) options.splice(index, 1);
    else options.push(option);
    setFormData({ ...formData, delivery_options: options });
  };

  const renderBasics = () => (
    <View>
      <Text style={styles.inputLabel}>Product Name *</Text>
      <TextInput style={styles.input} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} placeholder="e.g. Fresh Rohu Fish" />

      <Text style={styles.inputLabel}>Category *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, formData.category_id === cat.id && styles.chipActive]}
            onPress={() => setFormData({ ...formData, category_id: cat.id, sub_category_id: '' })}
          >
            <Text style={[styles.chipText, formData.category_id === cat.id && styles.chipTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.inputLabel}>Sub Category *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {subCategories.length > 0 ? subCategories.map(sub => (
          <TouchableOpacity
            key={sub.id}
            style={[styles.chip, formData.sub_category_id === sub.id && styles.chipActive]}
            onPress={() => setFormData({ ...formData, sub_category_id: sub.id })}
          >
            <Text style={[styles.chipText, formData.sub_category_id === sub.id && styles.chipTextActive]}>{sub.name}</Text>
          </TouchableOpacity>
        )) : (
          <Text style={styles.helperText}>{formData.category_id ? 'No subcategories found' : 'Select a category first'}</Text>
        )}
      </ScrollView>

      <Text style={styles.inputLabel}>SKU (Optional)</Text>
      <TextInput style={styles.input} value={formData.sku} onChangeText={(text) => setFormData({ ...formData, sku: text })} placeholder="e.g. FISH-001" />

      <Text style={styles.inputLabel}>Short Description</Text>
      <TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} placeholder="Brief product summary..." multiline numberOfLines={3} />
    </View>
  );

  const renderPricing = () => (
    <View>
      <View style={styles.rowInputs}>
        <View style={styles.halfInput}>
          <Text style={styles.inputLabel}>Base Price (₹) *</Text>
          <TextInput style={styles.input} value={formData.price} onChangeText={(text) => setFormData({ ...formData, price: text })} placeholder="0.00" keyboardType="numeric" />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.inputLabel}>Discount Price (₹)</Text>
          <TextInput style={styles.input} value={formData.discount_price} onChangeText={(text) => setFormData({ ...formData, discount_price: text })} placeholder="0.00" keyboardType="numeric" />
        </View>
      </View>

      <View style={styles.rowInputs}>
        <View style={styles.halfInput}>
          <Text style={styles.inputLabel}>Express Stock</Text>
          <TextInput style={styles.input} value={formData.express_stock_qty} onChangeText={(text) => setFormData({ ...formData, express_stock_qty: text })} placeholder="0" keyboardType="numeric" />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.inputLabel}>Scheduled Stock</Text>
          <TextInput style={styles.input} value={formData.scheduled_stock_qty} onChangeText={(text) => setFormData({ ...formData, scheduled_stock_qty: text })} placeholder="0" keyboardType="numeric" />
        </View>
      </View>
      
      <Text style={styles.inputLabel}>Weight Unit</Text>
      <TextInput style={styles.input} value={formData.weight_unit} onChangeText={(text) => setFormData({ ...formData, weight_unit: text })} placeholder="e.g. 500g, 1kg" />

      <Text style={styles.inputLabel}>Delivery Options</Text>
      <View style={styles.checkboxContainer}>
        {['express', 'today_evening', 'tmrw_morning', 'tmrw_evening'].map(opt => (
          <TouchableOpacity key={opt} style={[styles.checkbox, formData.delivery_options.includes(opt) && styles.checkboxActive]} onPress={() => toggleDeliveryOption(opt)}>
            <Icon name={formData.delivery_options.includes(opt) ? "checkbox-marked" : "checkbox-blank-outline"} size={20} color={formData.delivery_options.includes(opt) ? COLORS.white : COLORS.gray} />
            <Text style={[styles.checkboxText, formData.delivery_options.includes(opt) && styles.checkboxTextActive]}>{opt.replace(/_/g, ' ').toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderVariants = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Product Variants</Text>
        <TouchableOpacity style={styles.smallAddBtn} onPress={addVariant}>
          <Icon name="plus" size={16} color={COLORS.white} />
          <Text style={styles.smallAddBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {formData.variants.length === 0 ? (
        <Text style={styles.emptyVariantsText}>No variants added yet. Add variants for different cuts or sizes.</Text>
      ) : (
        formData.variants.map((variant, idx) => (
          <View key={variant.id || idx} style={styles.variantCard}>
            <View style={styles.variantHeader}>
              <Text style={styles.variantTitle}>Variant #{idx + 1}</Text>
              <TouchableOpacity onPress={() => removeVariant(idx)}>
                <Icon name="delete" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>

            <Text style={styles.variantLabel}>Variant Name</Text>
            <TextInput style={styles.smallInput} value={variant.name} onChangeText={(v) => updateVariant(idx, 'name', v)} placeholder="e.g. Whole Cleaned, Steak Cut" />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.variantLabel}>Price (₹)</Text>
                <TextInput style={styles.smallInput} value={variant.price?.toString()} onChangeText={(v) => updateVariant(idx, 'price', v)} placeholder="0" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.variantLabel}>Discount Price (₹)</Text>
                <TextInput style={styles.smallInput} value={variant.discount_price?.toString()} onChangeText={(v) => updateVariant(idx, 'discount_price', v)} placeholder="0" keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.variantLabel}>Net Weight Text</Text>
                <TextInput style={styles.smallInput} value={variant.weight_text} onChangeText={(v) => updateVariant(idx, 'weight_text', v)} placeholder="e.g. 500g" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.variantLabel}>Gross Weight Text</Text>
                <TextInput style={styles.smallInput} value={variant.gross_weight_text} onChangeText={(v) => updateVariant(idx, 'gross_weight_text', v)} placeholder="e.g. 750g" />
              </View>
            </View>

            <Text style={styles.variantLabel}>Delivery Slots</Text>
            <View style={styles.variantChipContainer}>
              {['Tomorrow Morning', 'Tomorrow Evening', 'Today Evening', 'Express'].map(slot => {
                const currentSlots = Array.isArray(variant.delivery_info)
                  ? variant.delivery_info
                  : (variant.delivery_info ? variant.delivery_info.split(',').map(s => s.trim()) : []);
                const isActive = currentSlots.includes(slot);

                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.variantChip, isActive && styles.variantChipActive]}
                    onPress={() => {
                      const nextSlots = isActive
                        ? currentSlots.filter(s => s !== slot)
                        : [...currentSlots, slot];
                      updateVariant(idx, 'delivery_info', nextSlots);
                    }}
                  >
                    <Text style={[styles.variantChipText, isActive && styles.variantChipTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.variantLabel}>Tooltip Info / Description</Text>
            <TextInput style={[styles.smallInput, { height: 60 }]} value={variant.description} onChangeText={(v) => updateVariant(idx, 'description', v)} placeholder="e.g. Price based on Gross Weight..." multiline />

            <Text style={styles.variantLabel}>Variant Image</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity style={styles.variantImagePicker} onPress={() => pickVariantImage(idx)}>
                {variant.image_url ? (
                  <Image source={{ uri: variant.image_url }} style={styles.variantImagePreview} />
                ) : (
                  <Icon name="camera-plus" size={20} color={COLORS.gray} />
                )}
              </TouchableOpacity>
              {variant.image_url && (
                <TouchableOpacity onPress={() => updateVariant(idx, 'image_url', null)}>
                  <Text style={{ color: COLORS.danger, fontSize: 12 }}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderInfo = () => (
    <View>
      <Text style={styles.inputLabel}>Cooking Guide / Instructions</Text>
      <TextInput style={[styles.input, styles.textAreaLarge]} value={formData.cooking_guide} onChangeText={(text) => setFormData({ ...formData, cooking_guide: text })} placeholder="Share a recipe or cleaning instructions..." multiline />

      <Text style={styles.inputLabel}>Marketing Flags</Text>
      <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Deal of the Day</Text>
          <Switch value={formData.is_deal} onValueChange={(v) => setFormData({ ...formData, is_deal: v })} trackColor={{ true: COLORS.primary }} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Featured Product</Text>
          <Switch value={formData.is_featured} onValueChange={(v) => setFormData({ ...formData, is_featured: v })} trackColor={{ true: COLORS.primary }} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Trending</Text>
          <Switch value={formData.is_trending} onValueChange={(v) => setFormData({ ...formData, is_trending: v })} trackColor={{ true: COLORS.primary }} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Flash Sale</Text>
          <Switch value={formData.is_flash_sale} onValueChange={(v) => setFormData({ ...formData, is_flash_sale: v })} trackColor={{ true: COLORS.primary }} />
        </View>
      </View>
    </View>
  );

  const renderMedia = () => (
    <View>
      <Text style={styles.inputLabel}>Product Image</Text>

      <View style={styles.mediaActions}>
        <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
          <Icon name="camera-plus" size={24} color={COLORS.primary} />
          <Text style={styles.uploadBtnText}>Upload from Gallery</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.line} /><Text style={styles.orText}>OR</Text><View style={styles.line} />
        </View>

        <TextInput
          style={styles.input}
          value={formData.image_url}
          onChangeText={(text) => {
            setFormData({ ...formData, image_url: text });
            setSelectedImage(null);
          }}
          placeholder="Enter Image URL directly..."
        />
      </View>

      {formData.image_url ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: formData.image_url }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.removeImageBtn} onPress={() => {
            setFormData({ ...formData, image_url: '' });
            setSelectedImage(null);
          }}>
            <Icon name="close-circle" size={24} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholderImage}>
          <Icon name="image-plus" size={48} color={COLORS.gray} />
          <Text style={styles.placeholderText}>Pick an image or enter URL above</Text>
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basics': return renderBasics();
      case 'pricing': return renderPricing();
      case 'variants': return renderVariants();
      case 'info': return renderInfo();
      case 'media': return renderMedia();
      default: return renderBasics();
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Inventory</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
            <Icon name="plus" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.headerSubtitle}>{filteredProducts.length} Items found</Text>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InventoryItem
            item={item}
            onToggleActive={handleToggleActive}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{editingProductId ? 'Edit Product' : 'Add New Product'}</Text>
                <Text style={styles.modalSubtitle}>{formData.name || 'Untitled'}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.tabBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {TABS.map(tab => (
                  <TouchableOpacity key={tab.id} style={[styles.tab, activeTab === tab.id && styles.activeTab]} onPress={() => setActiveTab(tab.id)}>
                    <Icon name={tab.icon} size={20} color={activeTab === tab.id ? COLORS.primary : COLORS.gray} />
                    <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>{tab.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <ScrollView style={styles.modalScroll}>
              {renderTabContent()}
              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save Product</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: SPACING.l, paddingBottom: SPACING.m, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.white },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.dark },
  addBtn: { backgroundColor: COLORS.primary, padding: SPACING.s, borderRadius: RADIUS.button },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: RADIUS.button, paddingHorizontal: SPACING.m, height: 40 },
  searchIcon: { marginRight: SPACING.s },
  searchInput: { flex: 1, height: '100%', fontSize: 14, color: COLORS.dark },
  headerSubtitle: { fontSize: 13, color: COLORS.gray, marginTop: SPACING.m, fontWeight: '500' },
  listContainer: { padding: SPACING.m },
  emptyText: { textAlign: 'center', color: COLORS.gray, marginTop: SPACING.xl },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.card, borderTopRightRadius: RADIUS.card, height: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.l, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  modalSubtitle: { fontSize: 12, color: COLORS.gray },

  tabBar: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.l, paddingVertical: SPACING.m, borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 8 },
  activeTab: { borderBottomColor: COLORS.primary },
  tabLabel: { fontSize: 14, color: COLORS.gray, fontWeight: '500' },
  activeTabLabel: { color: COLORS.primary, fontWeight: 'bold' },
  variantImagePicker: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  variantImagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },

  modalScroll: { padding: SPACING.l },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.dark, marginBottom: SPACING.s, marginTop: SPACING.s },
  input: { backgroundColor: COLORS.lightGray, borderRadius: RADIUS.button, padding: SPACING.m, fontSize: 15, color: COLORS.dark, marginBottom: SPACING.m },
  smallInput: { backgroundColor: COLORS.lightGray, borderRadius: RADIUS.button, padding: SPACING.s, fontSize: 14, color: COLORS.dark, marginBottom: SPACING.s, borderWidth: 1, borderColor: COLORS.border },
  textArea: { height: 80, textAlignVertical: 'top' },
  textAreaLarge: { height: 150, textAlignVertical: 'top' },
  rowInputs: { flexDirection: 'row', gap: SPACING.m },
  halfInput: { flex: 1 },

  chipScroll: { marginBottom: SPACING.m, flexDirection: 'row' },
  chip: { paddingHorizontal: SPACING.m, paddingVertical: SPACING.s, borderRadius: 20, backgroundColor: COLORS.lightGray, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.dark },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  helperText: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic', marginBottom: SPACING.m },

  checkboxContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s, marginBottom: SPACING.m },
  checkbox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, paddingHorizontal: SPACING.m, paddingVertical: SPACING.s, borderRadius: RADIUS.button, gap: 8, borderWidth: 1, borderColor: COLORS.border },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxText: { fontSize: 13, color: COLORS.dark },
  checkboxTextActive: { color: COLORS.white, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m, marginTop: SPACING.s },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  smallAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success, paddingHorizontal: SPACING.m, paddingVertical: 4, borderRadius: RADIUS.button, gap: 4 },
  smallAddBtnText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  variantCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.card, padding: SPACING.m, marginBottom: SPACING.m, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  variantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.s },
  variantTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.gray },
  variantLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 2, marginTop: 4, fontWeight: '500' },
  variantChipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  variantChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: COLORS.lightGray, borderWidth: 1, borderColor: COLORS.border },
  variantChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  variantChipText: { fontSize: 11, color: COLORS.dark },
  variantChipTextActive: { color: COLORS.white, fontWeight: '600' },
  emptyVariantsText: { textAlign: 'center', color: COLORS.gray, fontStyle: 'italic', marginVertical: SPACING.xl },

  switchGroup: { backgroundColor: COLORS.lightGray, borderRadius: RADIUS.card, padding: SPACING.m, gap: SPACING.m },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 14, color: COLORS.dark, fontWeight: '500' },

  imagePreviewContainer: { position: 'relative', marginTop: SPACING.m },
  imagePreview: { width: '100%', height: 200, borderRadius: RADIUS.card, backgroundColor: COLORS.lightGray },
  removeImageBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: COLORS.white, borderRadius: 12 },
  placeholderImage: { width: '100%', height: 200, borderRadius: RADIUS.card, backgroundColor: COLORS.lightGray, borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.gray, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.m },
  placeholderText: { color: COLORS.gray, fontSize: 12, marginTop: SPACING.s },

  mediaActions: { gap: SPACING.m, marginBottom: SPACING.m },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0f2fe', padding: SPACING.m, borderRadius: RADIUS.button, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary, gap: 12 },
  uploadBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  orText: { fontSize: 12, color: COLORS.gray, fontWeight: 'bold' },

  modalActions: { flexDirection: 'row', padding: SPACING.l, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.m, backgroundColor: COLORS.white },
  cancelBtn: { flex: 1, padding: SPACING.m, alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: RADIUS.button },
  cancelBtnText: { color: COLORS.dark, fontWeight: '600', fontSize: 16 },
  saveBtn: { flex: 2, padding: SPACING.m, alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.button },
  saveBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 }
});
