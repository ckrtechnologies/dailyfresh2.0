import { store } from '../store/store';
import { showAlert, hideAlert } from '../store/slices/uiSlice';

export const alertService = {
  show: (options) => {
    store.dispatch(showAlert(options));
  },
  hide: () => {
    store.dispatch(hideAlert());
  },
  success: (title, message, buttons) => {
    store.dispatch(showAlert({ title, message, type: 'success', buttons }));
  },
  error: (title, message, buttons) => {
    store.dispatch(showAlert({ title, message, type: 'error', buttons }));
  },
  info: (title, message, buttons) => {
    store.dispatch(showAlert({ title, message, type: 'info', buttons }));
  },
  warning: (title, message, buttons) => {
    store.dispatch(showAlert({ title, message, type: 'warning', buttons }));
  }
};
