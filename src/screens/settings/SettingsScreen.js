import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';

export default function SettingsScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const stepTitle = useMemo(() => {
    if (step === 1) return 'Step 1: Enter Username or Email';
    if (step === 2) return 'Step 2: Validate OTP';
    return 'Step 3: Set New Password';
  }, [step]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setStep(1);
      setIdentifier('');
      setOtpInput('');
      setGeneratedOtp('');
      setNewPassword('');
      setRefreshing(false);
    }, 1000);
  }, []);

  const sendOtp = () => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter username or email.');
      return;
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    setOtpInput('');
    setStep(2);

    // Simulation step requested by user: OTP is logged in console for now.
    console.log(`[ChangePassword] OTP for ${trimmed}: ${otp}`);
    Alert.alert('OTP Sent', 'OTP has been generated and logged in console.');
  };

  const verifyOtp = () => {
    if (!otpInput.trim()) {
      Alert.alert('Required', 'Please enter OTP.');
      return;
    }

    if (otpInput.trim() !== generatedOtp) {
      Alert.alert('Invalid OTP', 'Entered OTP is incorrect.');
      return;
    }

    setStep(3);
    Alert.alert('OTP Verified', 'Please enter your new password.');
  };

  const updatePassword = () => {
    if (newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters.');
      return;
    }

    Alert.alert('Success', 'Password changed successfully.');
    setStep(1);
    setIdentifier('');
    setOtpInput('');
    setGeneratedOtp('');
    setNewPassword('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <AppHeader
        title="Settings"
        navigation={navigation}
        showBack={true}
        right={<Image source={require('../../../assets/icon.png')} style={styles.headerLogo} />}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.stepTitle}>{stepTitle}</Text>

          {step === 1 && (
            <>
              <Text style={styles.label}>Username or Email</Text>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Enter username or email"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                style={styles.input}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={sendOtp}>
                <Text style={styles.primaryBtnText}>Send OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.label}>Enter OTP</Text>
              <TextInput
                value={otpInput}
                onChangeText={setOtpInput}
                placeholder="6-digit OTP"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
              />
              <View style={styles.rowBtns}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtnHalf} onPress={verifyOtp}>
                  <Text style={styles.primaryBtnText}>Verify OTP</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                style={styles.input}
              />
              <View style={styles.rowBtns}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(2)}>
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtnHalf} onPress={updatePassword}>
                  <Text style={styles.primaryBtnText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  headerLogo: { width: 32, height: 32, borderRadius: 8 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 24,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 21, fontWeight: '800', color: '#1E3A8A' },
  stepTitle: { marginTop: 4, marginBottom: 14, fontSize: 13, color: '#64748B', fontWeight: '700' },
  label: { fontSize: 13, color: '#334155', fontWeight: '700', marginBottom: 6 },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  primaryBtn: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnHalf: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  secondaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  secondaryBtnText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  rowBtns: { flexDirection: 'row', alignItems: 'center' },
});
