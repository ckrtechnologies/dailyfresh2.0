import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setDateRange } from '../store/dateRangeSlice';

const DateRangePicker = () => {
  const dispatch = useDispatch();
  const currentLabel = useSelector((state) => state.dateRange.label);

  const ranges = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'This Month', days: 30 },
  ];

  const handleSelect = (range) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - range.days);

    dispatch(setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      label: range.label,
    }));
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {ranges.map((r) => (
          <TouchableOpacity
            key={r.label}
            style={[
              styles.chip,
              currentLabel === r.label && styles.activeChip
            ]}
            onPress={() => handleSelect(r)}
          >
            <Text style={[
              styles.chipText,
              currentLabel === r.label && styles.activeChipText
            ]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scroll: {
    paddingHorizontal: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeChip: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  activeChipText: {
    color: '#fff',
  },
});

export default DateRangePicker;
