import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { hideAlert } from '../store/slices/uiSlice';
import { COLORS, SPACING, RADIUS, THEMES } from '../constants/theme';

const { width } = Dimensions.get('window');

const CustomAlert = ({ visible, title, message, type, buttons, onClose }) => {
  const selectedSlot = useSelector((state) => state.config.selectedSlot);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return { name: 'check-circle', color: '#10B981' };
      case 'error': return { name: 'alert-circle', color: '#EF4444' };
      case 'warning': return { name: 'alert', color: '#F59E0B' };
      default: return { name: 'information', color: activeTheme.primary };
    }
  };

  const alertIcon = getIcon();
  
  // Default to an "OK" button if none provided
  const finalButtons = buttons && buttons.length > 0 
    ? buttons 
    : [{ text: 'OK', onPress: () => {} }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.alertContainer, 
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: alertIcon.color + '15' }]}>
              <Icon name={alertIcon.name} size={32} color={alertIcon.color} />
            </View>
            
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={[
            styles.buttonContainer,
            finalButtons.length === 1 && { justifyContent: 'center' }
          ]}>
            {finalButtons.map((btn, index) => {
              const isPrimary = index === finalButtons.length - 1;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isPrimary && { backgroundColor: activeTheme.primary },
                    index > 0 && { marginLeft: SPACING.s }
                  ]}
                  onPress={() => {
                    onClose();
                    if (btn.onPress) {
                      setTimeout(() => {
                        btn.onPress();
                      }, 100);
                    }
                  }}
                >
                  <Text style={[
                    styles.buttonText,
                    isPrimary ? { color: COLORS.white } : { color: activeTheme.primary }
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: SPACING.xl,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  content: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  message: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderRadius: 18,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CustomAlert;
