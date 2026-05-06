import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Share, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';
import { storeApi } from '../../services/api';

const ExportButton = ({ type, params, title = 'Export CSV' }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      let response;
      if (type === 'inventory') {
        response = await storeApi.exportInventoryCSV(params);
      } else if (type === 'orders') {
        response = await storeApi.exportOrdersCSV(params);
      }

      if (response && response.data) {
        await Share.share({
          message: response.data,
          title: `${type}_export.csv`,
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Could not generate export file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handleExport}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <>
          <Icon name="file-export-outline" size={18} color={COLORS.primary} />
          <Text style={styles.text}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 6,
  },
  text: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ExportButton;
