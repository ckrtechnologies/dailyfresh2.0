import React from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import { View, StatusBar, StyleSheet } from 'react-native';
import { COLORS } from './src/theme/theme';

import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import CustomAlert from './src/components/common/CustomAlert';

const AppContent = () => {
  const insets = useSafeAreaInsets();
  
  // Fallback values if insets are not yet available
  const topInset = insets.top || 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar
        backgroundColor={COLORS.primary}
        barStyle="light-content"
        translucent={true}
      />
      {/* Dynamic StatusBar Background */}
      <View style={{ height: topInset, backgroundColor: COLORS.primary }} />
      
      <View style={{ flex: 1 }}>
        <AppNavigator />
      </View>
      <CustomAlert />
      <Toast />
    </View>
  );
};

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
