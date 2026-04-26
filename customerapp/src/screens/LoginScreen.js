import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import authService from '../api/authService';
import { setCredentials, setLoading } from '../store/slices/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    dispatch(setLoading(true));
    try {
      const response = await authService.loginWithEmail(email, password);
      if (response.success) {
        dispatch(setCredentials({
          user: response.data.user,
          token: response.data.access_token
        }));
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Login Failed', err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
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
            style={styles.googleButton}
            onPress={() => authService.signInWithGoogle()}
          >
            <Image
              source={require('../assets/icons/google_logo.png')}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  logo: {
    width: width * 0.6,
    height: width * 0.4,
  },
  form: {
    marginTop: SPACING.m,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: SPACING.l,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    padding: SPACING.m,
    fontSize: 16,
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
