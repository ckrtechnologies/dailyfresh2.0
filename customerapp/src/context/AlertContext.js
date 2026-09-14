import React, { createContext, useContext, useState, useCallback } from 'react';
import AppAlert from '../shared/components/ui/AppAlert';
import { registerAlert } from '../services/alertService';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [config, setConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
    dismissable: true,
  });

  const showAlert = useCallback((title, message, type = 'info', buttons = [], options = {}) => {
    setConfig({
      visible: true,
      title,
      message,
      type,
      buttons,
      dismissable: options?.dismissable !== undefined ? options.dismissable : true,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setConfig(prev => ({ ...prev, visible: false }));
  }, []);

  // Register the global alert reference
  React.useEffect(() => {
    registerAlert(showAlert);
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <AppAlert 
        visible={config.visible}
        title={config.title}
        message={config.message}
        type={config.type}
        buttons={config.buttons}
        dismissable={config.dismissable}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
