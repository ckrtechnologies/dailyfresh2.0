// Global service to trigger branded alerts from anywhere (even non-React files like apiClient.js)

let alertRef = null;

export const registerAlert = (showAlertFn) => {
  alertRef = showAlertFn;
};

export const showGlobalAlert = (title, message, type = 'info', buttons = []) => {
  if (alertRef) {
    alertRef(title, message, type, buttons);
  } else {
    // Fallback to console if provider isn't ready
    console.warn('AlertProvider not registered yet. Msg:', message);
  }
};
