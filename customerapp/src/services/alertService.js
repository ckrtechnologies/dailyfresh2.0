/**
 * Global service to trigger branded CKR alerts from anywhere in the app
 * (including non-React files like apiClient.js, thunks, listeners)
 */

let alertRef = null;

export const registerAlert = (showAlertFn) => {
  alertRef = showAlertFn;
};

/**
 * Show a standard branded alert dialog
 */
export const showGlobalAlert = (title, message, type = 'info', buttons = [], options = {}) => {
  if (alertRef) {
    alertRef(title, message, type, buttons, options);
  } else {
    console.warn('AlertProvider not registered yet. Message:', message);
  }
};

/**
 * Convenience helper for destructive confirmation dialogs
 * Enforces CKR rule: destructive action explicitly named (never generic "OK")
 */
export const showDestructiveConfirm = (
  title,
  message,
  confirmActionText,
  onConfirm,
  cancelText = 'Cancel',
  onCancel = null
) => {
  showGlobalAlert(
    title,
    message,
    'destructiveConfirm',
    [
      { text: cancelText, onPress: onCancel },
      { text: confirmActionText, onPress: onConfirm, destructive: true },
    ],
    { dismissable: false }
  );
};
