import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notificationService from './src/services/notificationService';

import { useSelector } from 'react-redux';

const App = () => {
  const token = useSelector(state => state.rider.token);

  React.useEffect(() => {
    notificationService.requestUserPermission();
    notificationService.setupListeners(() => {
      // Refresh orders or handle new order logic if needed
    });

    return () => notificationService.removeListeners();
  }, []);

  // Trigger token registration whenever the auth token changes (e.g. after login)
  React.useEffect(() => {
    if (token) {
      console.log('[App] Auth token detected, refreshing FCM registration...');
      notificationService.getToken();
    }
  }, [token]);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
