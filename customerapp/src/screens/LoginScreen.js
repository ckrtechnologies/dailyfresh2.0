import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import authService from '../api/authService';
import { setCredentials, setLoading } from '../store/slices/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from 'react-native';
import { setLocation } from '../store/slices/locationSlice';
import apiClient from '../api/apiClient';
import { showGlobalAlert } from '../services/alertService';
import { autoAssignNearestStore } from '../services/locationHelper';
import { signInWithGoogleNative, openGoogleBrowserLogin } from '../services/googleAuth';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const dispatch = useDispatch();

  const logoAnim = React.useRef(new Animated.Value(0)).current;
  const logoScale = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(logoAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showGlobalAlert('Error', 'Please enter both email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    dispatch(setLoading(true));
    try {
      const response = await authService.loginWithEmail(email, password);
      if (response.success) {
        // Seamlessly assign nearest store like Blinkit
        try {
          await autoAssignNearestStore(dispatch, { isAuthenticated: true });
        } catch (locErr) {
          console.log('Location initialization error:', locErr);
        }

        dispatch(setCredentials({
          user: response.data.user,
          token: response.data.access_token
        }));
      }
    } catch (err) {
      console.error(err);
      showGlobalAlert('Login Failed', err.message || 'Invalid email or password', 'error');
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleSubmitting(true);
      const googleRes = await signInWithGoogleNative();

      if (googleRes.cancelled) {
        return;
      }

      if (googleRes.success) {
        dispatch(setLoading(true));
        const res = await authService.signInWithGoogle(googleRes);

        if (res.success) {
          try {
            await autoAssignNearestStore(dispatch, { isAuthenticated: true });
          } catch (locErr) {
            console.log('Location assignment error:', locErr);
          }

          dispatch(setCredentials({
            user: res.data.user,
            token: res.data.access_token,
          }));
          return;
        }
      }

      // Seamless fallback: browser-based Google SSO
      console.log('[LoginScreen] Native Google sign-in bypassed or failed, launching browser SSO...');
      await openGoogleBrowserLogin();
    } catch (err) {
      console.error('Google Sign-In error:', err);
      await openGoogleBrowserLogin();
    } finally {
      setIsGoogleSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#012a21" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <Animated.View style={[
              styles.logoContainer,
              { opacity: logoAnim, transform: [{ scale: logoScale }] }
            ]}>
              <View style={styles.logoCircle}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandName}>DAILY FRESH</Text>
              <Text style={styles.brandTagline}>Premium Meat & Seafood</Text>
            </Animated.View>
          </View>

          <View style={styles.form}>
            <Text style={styles.welcomeText}>Login to your account</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="example@mail.com"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isSubmitting && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.loginButtonText}>LOGIN</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, isGoogleSubmitting && styles.disabledButton]}
              onPress={handleGoogleLogin}
              disabled={isGoogleSubmitting || isSubmitting}
            >
              {isGoogleSubmitting ? (
                <ActivityIndicator color="#1F2937" />
              ) : (
                <>
                  <Image
                    source={require('../assets/icons/google_logo.jpg')}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSection: {
    height: height * 0.32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#012a21', // Deep Emerald to match Splash
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    marginBottom: SPACING.l,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 40 : 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    padding: 15,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 10,
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 1,
  },
  form: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.m,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.m,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: SPACING.m,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    padding: SPACING.s,
    fontSize: 14,
    color: COLORS.dark,
    backgroundColor: COLORS.lightGray,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.xl,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    padding: SPACING.l,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.m,
    color: COLORS.gray,
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.button,
    padding: SPACING.l,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    marginLeft: SPACING.m,
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
