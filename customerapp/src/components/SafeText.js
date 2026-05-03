import React from 'react';
import { Text } from 'react-native';

/**
 * A wrapper for Text that handles null/undefined values
 * and provides a fallback string.
 */
const SafeText = ({ 
  children, 
  fallback = '-', 
  ...props 
}) => {
  const content = (children === null || children === undefined || children === '') 
    ? fallback 
    : children;

  return <Text {...props}>{content}</Text>;
};

export default SafeText;
