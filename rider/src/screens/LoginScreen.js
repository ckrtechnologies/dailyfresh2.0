import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar
} from 'react-native';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { setProfile } from '../store/riderSlice';

import axios from 'axios';
import { Config } from 'react-native-config';

const API_URL = Config.API_URL || 'http://localhost:5000/api';

import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        role: 'rider'
      });

      if (response.data && response.data.success) {
        // response.data.data contains { user, access_token, refresh_token }
        dispatch(setProfile(response.data.data));
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid credentials or server error.';
      Alert.alert('Login Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Image 
              source={{ uri: 'https://dailyfreshkolkata.in/assets/logo.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Daily Fresh</Text>
            <Text style={styles.subtitle}>RIDER PARTNER</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail color="#64748b" size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock color="#64748b" size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginText}>Sign In</Text>
                  <LogIn color="#fff" size={20} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Not a partner yet? </Text>
            <TouchableOpacity>
              <Text style={styles.registerText}>Apply Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    color: '#1e293b',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#1e293b',
    fontSize: 16,
  },
  loginBtn: {
    backgroundColor: '#3b82f6',
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotBtn: {
    alignItems: 'center',
    marginTop: 8,
  },
  forgotText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  registerText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
