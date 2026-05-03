import React from 'react';
import { View, Text } from 'react-native';

/**
 * A wrapper for array mapping that handles null/undefined data
 * and provides an optional empty state.
 */
const SafeMap = ({ 
  data, 
  renderItem, 
  EmptyComponent, 
  containerStyle,
  keyExtractor = (item, index) => item.id || index.toString()
}) => {
  if (!Array.isArray(data) || data.length === 0) {
    return EmptyComponent || null;
  }

  return (
    <View style={containerStyle}>
      {data.map((item, index) => (
        <React.Fragment key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </View>
  );
};

export default SafeMap;
