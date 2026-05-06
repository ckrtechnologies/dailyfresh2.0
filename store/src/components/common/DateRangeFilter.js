import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const DateRangeFilter = ({ activeRange, onRangeChange, customRange, onCustomRangeChange }) => {
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const defaultOptions = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Last 7 Days' },
    { id: 'all', label: 'All Time' },
    { id: 'custom', label: 'Custom' },
  ];

  const formatDate = (date) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const onStartChange = (event, selectedDate) => {
    setShowStart(false);
    if (selectedDate) {
      onCustomRangeChange({ ...customRange, start: selectedDate });
    }
  };

  const onEndChange = (event, selectedDate) => {
    setShowEnd(false);
    if (selectedDate) {
      onCustomRangeChange({ ...customRange, end: selectedDate });
    }
  };

  return (
    <View>
      <View style={styles.container}>
        {defaultOptions.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.pill,
              activeRange === opt.id && styles.pillActive
            ]}
            onPress={() => onRangeChange(opt.id)}
          >
            <Text
              style={[
                styles.pillText,
                activeRange === opt.id && styles.pillTextActive
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeRange === 'custom' && (
        <View style={styles.customContainer}>
          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowStart(true)}>
            <Icon name="calendar" size={16} color={COLORS.primary} />
            <Text style={styles.dateText}>{formatDate(customRange?.start)}</Text>
          </TouchableOpacity>
          
          <Icon name="arrow-right" size={16} color={COLORS.gray} />

          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowEnd(true)}>
            <Icon name="calendar" size={16} color={COLORS.primary} />
            <Text style={styles.dateText}>{formatDate(customRange?.end)}</Text>
          </TouchableOpacity>

          {(showStart || showEnd) && (
            <DateTimePicker
              value={(showStart ? customRange?.start : customRange?.end) || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={showStart ? onStartChange : onEndChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.s,
    marginTop: SPACING.m,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  pillTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  customContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginTop: SPACING.m,
    backgroundColor: COLORS.white,
    padding: SPACING.s,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: SPACING.s,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '500',
  }
});

export default DateRangeFilter;
