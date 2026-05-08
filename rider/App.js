import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notificationService from './src/services/notificationService';
import { navigationRef } from './src/navigation/RootNavigation';

import { useSelector } from 'react-redux';

const AppContent = () => {
  const token = useSelector(state => state.rider.token);

  React.useEffect(() => {
    notificationService.requestUserPermission();
    notificationService.setupListeners((data) => {
      console.log('[AppContent] New order notification received:', data);
      // Logic to refresh orders can go here
    });

    return () => notificationService.removeListeners();
  }, []);

  // Trigger token registration whenever the auth token changes
  React.useEffect(() => {
    if (token) {
      console.log('[AppContent] Auth token detected, refreshing FCM registration...');
      notificationService.getToken();
    }
  }, [token]);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      <AppNavigator />
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
