import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  FlatList, 
  TouchableWithoutFeedback 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setActiveStoreId } from '../../store/slices/authSlice';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';

const StoreSelector = () => {
  const dispatch = useAppDispatch();
  const { stores, activeStoreId } = useAppSelector(state => state.auth);
  const [modalVisible, setModalVisible] = useState(false);

  if (stores.length <= 1) return null;

  const activeStore = stores.find(s => s.id === activeStoreId) || stores[0];

  const handleSelect = (id) => {
    dispatch(setActiveStoreId(id));
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.selector} 
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.iconCircle}>
          <Icon name="store" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>Active Store</Text>
          <Text style={styles.storeName} numberOfLines={1}>{activeStore.name}</Text>
        </View>
        <Icon name="chevron-down" size={24} color={COLORS.gray} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Store</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Icon name="close" size={24} color={COLORS.dark} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={stores}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[
                        styles.storeOption,
                        item.id === activeStoreId && styles.selectedOption
                      ]}
                      onPress={() => handleSelect(item.id)}
                    >
                      <View style={styles.optionInfo}>
                        <Text style={[
                          styles.optionName,
                          item.id === activeStoreId && styles.selectedOptionText
                        ]}>
                          {item.name}
                        </Text>
                        <Text style={styles.optionAddress}>{item.address}, {item.pincode}</Text>
                      </View>
                      {item.id === activeStoreId && (
                        <Icon name="check-circle" size={24} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.listContent}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.l,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: RADIUS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: COLORS.gray,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 2,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.l,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.l,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl * 2,
  },
  storeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.l,
    borderRadius: RADIUS.card,
    marginBottom: SPACING.m,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  selectedOptionText: {
    color: COLORS.primary,
  },
  optionAddress: {
    fontSize: 12,
    color: COLORS.gray,
  },
});

export default StoreSelector;
