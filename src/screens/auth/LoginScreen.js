import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Show a confirmation after returning from successful registration.
  const justRegistered = route?.params?.registered === true;
  const resetDone = route?.params?.resetDone === true;

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      // Navigation is automatic: isAuthenticated flips to true in AuthContext,
      // RootNavigator in App.js re-renders and shows AppTabs.
    } catch (e) {
      const status = e.response?.status;
      if (status === 401) {
        setError('Incorrect username or password');
      } else {
        console.log(e);
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
          <Text style={styles.appName}>Jeevan Jyoti International School</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          {justRegistered && (
            <Text style={styles.successText}>
              Account created! Please log in.
            </Text>
          )}

          {resetDone && (
            <Text style={styles.successText}>
              Password updated. Please log in with your new password.
            </Text>
          )}
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetLink}
            onPress={() => navigation.navigate('ResetPassword', { identifier: username.trim() })}
            activeOpacity={0.7}
          >
            <Text style={styles.resetLinkText}>Reset Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.7}
          >
            <Text style={styles.signupLinkText}>
              Don't have an account?{' '}
              <Text style={styles.signupLinkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EEF2FF' },
  root: { flex: 1, backgroundColor: '#EEF2FF' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  eyeIcon: {
    padding: 12,
  },
  button: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resetLink: { marginTop: 12, alignItems: 'center' },
  resetLinkText: { color: '#1E3A8A', fontSize: 14, fontWeight: '700' },
  errorText: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    fontSize: 13,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    textAlign: 'center',
  },
  successText: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    fontSize: 13,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    textAlign: 'center',
  },
  signupLink: { marginTop: 20, alignItems: 'center' },
  signupLinkText: { fontSize: 14, color: '#6B7280' },
  signupLinkBold: { color: '#1E3A8A', fontWeight: '700' },
});
