import AsyncStorage from '@react-native-async-storage/async-storage';

const storage = {
  setItem: async (key, value) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (e) {
      console.error('Error saving to storage', e);
    }
  },

  getItem: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (e) {
      console.error('Error reading from storage', e);
      return null;
    }
  },

  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing from storage', e);
    }
  },

  // Synchronous-like access for things already in memory (not recommended for large data)
  // We will handle this via Redux hydration
};

export default storage;
