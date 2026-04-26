import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import authService from '../api/authService';
import { setCredentials, setLoading } from '../store/slices/authSlice';

const OTPVerifyScreen = ({ route, navigation }) => {
  const { loginMethod, value } = route.params || { loginMethod: 'phone', value: '' };
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    dispatch(setLoading(true));
    try {
      const response = await authService.verifyOTP(loginMethod, value, otpValue);
      if (response.success) {
        // response.data = { user, access_token, refresh_token }
        dispatch(setCredentials({ 
          user: response.data.user, 
          token: response.data.access_token 
        }));
        // Navigation will be handled automatically by RootNavigator based on auth state
      } else {
        Alert.alert('Error', response.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error(err);
      // Fallback for demo/dev if API fails
      if (__DEV__) {
        console.warn('API Failed, using mock successful verification for development');
        dispatch(setCredentials({ 
          user: { id: 'mock-id', name: 'Test User' }, 
          token: 'mock-token' 
        }));
      } else {
        Alert.alert('Error', err.message || 'Something went wrong');
      }
    } finally {
      setIsVerifying(false);
      dispatch(setLoading(false));
    }
  };

  const handleResend = () => {
    setTimer(30);
    // API call to resend OTP
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to {value}
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => {
                const newOtp = [...otp];
                newOtp[index] = text;
                setOtp(newOtp);
                // Auto-focus next input
                // ... logic to be added
              }}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.button, isVerifying && styles.disabledButton]} 
          onPress={handleVerify}
          disabled={isVerifying}
        >
          <Text style={styles.buttonText}>
            {isVerifying ? 'Verifying...' : 'Verify & Continue'}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={styles.timerText}>Resend code in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xxl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.lightGray,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    padding: SPACING.l,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  timerText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  resendText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default OTPVerifyScreen;
