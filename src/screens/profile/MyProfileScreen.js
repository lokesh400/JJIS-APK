import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../../api/client';

const TARGET_EXAMS = ['JEE', 'NEET', 'FOUNDATION', 'CUET', 'NDA'];

export default function MyProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', class: '', targetExam: '', mobile: '', address: '' });
  const [exams, setExams] = useState(TARGET_EXAMS);

  
  const fetchProfile = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await apiClient.get('/auth/m/me');
      setProfile(res.data);
      setForm({
        name: res.data.name || '',
        class: res.data.class || '',
        targetExam: res.data.targetExam || '',
        mobile: res.data.mobile || '',
        address: res.data.address || '',
      });
      setError(null);
    } catch(err) {
      setError('Failed to load profile');
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = () => {
    fetchProfile(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/auth/student/profile', {
        name: form.name,
        class: form.class,
        targetExam: form.targetExam,
        mobile: form.mobile,
        address: form.address,
      });
      setProfile({ ...profile, ...form });
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile.');
    }
    setSaving(false);
  };

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        {/* Top Navbar */}
        
        <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation && navigation.goBack && navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: '#FFF' }]}>My Profile</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(e => !e)}>
              <MaterialCommunityIcons name={editMode ? 'close' : 'pencil'} size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Image
            source={require('../../../assets/icon.png')}
            style={[styles.avatar, { marginTop: 20 }]}
            resizeMode="contain"
          />
          {loading ? (
            <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 24 }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : profile ? (
            <View style={styles.card}>
              {editMode ? (
                <>
                  <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="account" size={20} color="#1D4ED8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputModern}
                      value={form.name}
                      onChangeText={v => handleChange('name', v)}
                      placeholder="Name"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="school" size={20} color="#1D4ED8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputModern}
                      value={form.class}
                      onChangeText={v => handleChange('class', v)}
                      placeholder="Class"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="target" size={20} color="#1D4ED8" style={styles.inputIcon} />
                    <View style={{ flex: 1 }}>
                      <Picker
                        selectedValue={form.targetExam}
                        onValueChange={v => handleChange('targetExam', v)}
                        style={styles.picker}
                        dropdownIconColor="#1D4ED8"
                      >
                        <Picker.Item label="Select Target Exam" value="" color="#94A3B8" />
                        {exams.map((exam) => (
                          <Picker.Item key={exam} label={exam} value={exam} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="phone" size={20} color="#1D4ED8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputModern}
                      value={form.mobile}
                      onChangeText={v => handleChange('mobile', v)}
                      placeholder="Mobile"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="map-marker" size={20} color="#1D4ED8" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.inputModern, { minHeight: 44 }]}
                      value={form.address}
                      onChangeText={v => handleChange('address', v)}
                      placeholder="Address"
                      placeholderTextColor="#94A3B8"
                      multiline
                    />
                  </View>
                  <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                    <MaterialCommunityIcons name="content-save" size={20} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                </>
               
              ) : (
                <View style={styles.profileInfoContainer}>
                  <Text style={styles.name}>{profile.name}</Text>
                  <Text style={styles.email}>{profile.email}</Text>

                  <View style={styles.divider} />

                  <Text style={styles.sectionHeader}>Personal Details</Text>
                  <View style={styles.detailGrid}>
                    <View style={styles.gridItem}>
                      <View style={styles.gridIconWrap}>
                        <MaterialCommunityIcons name="account" size={20} color="#1D4ED8" />
                      </View>
                      <Text style={styles.gridLabel}>Role</Text>
                      <Text style={styles.gridValue}>{profile.role}</Text>
                    </View>
                    
                    <View style={styles.gridItem}>
                      <View style={styles.gridIconWrap}>
                        <MaterialCommunityIcons name="school" size={20} color="#1D4ED8" />
                      </View>
                      <Text style={styles.gridLabel}>Class</Text>
                      <Text style={styles.gridValue}>{profile.class || '-'}</Text>
                    </View>

                    <View style={styles.gridItem}>
                      <View style={styles.gridIconWrap}>
                        <MaterialCommunityIcons name="target" size={20} color="#1D4ED8" />
                      </View>
                      <Text style={styles.gridLabel}>Target Exam</Text>
                      <Text style={styles.gridValue}>{profile.targetExam || '-'}</Text>
                    </View>

                    <View style={styles.gridItem}>
                      <View style={styles.gridIconWrap}>
                        <MaterialCommunityIcons name="phone" size={20} color="#1D4ED8" />
                      </View>
                      <Text style={styles.gridLabel}>Mobile</Text>
                      <Text style={styles.gridValue}>{profile.mobile || '-'}</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionHeader}>Account Information</Text>
                  <View style={styles.listRow}>
                    <View style={styles.listIconWrap}>
                      <MaterialCommunityIcons name="map-marker" size={18} color="#64748B" />
                    </View>
                    <View style={styles.listTextWrap}>
                      <Text style={styles.listLabel}>Address</Text>
                      <Text style={styles.listValue}>{profile.address || '-'}</Text>
                    </View>
                  </View>

                  <View style={styles.listRow}>
                    <View style={styles.listIconWrap}>
                      <MaterialCommunityIcons name="cart-outline" size={18} color="#64748B" />
                    </View>
                    <View style={styles.listTextWrap}>
                      <Text style={styles.listLabel}>Purchased Series</Text>
                      <Text style={styles.listValue}>{Array.isArray(profile.purchasedSeries) ? profile.purchasedSeries.length : 0}</Text>
                    </View>
                  </View>

                  <View style={styles.listRow}>
                    <View style={styles.listIconWrap}>
                      <MaterialCommunityIcons name="calendar" size={18} color="#64748B" />
                    </View>
                    <View style={styles.listTextWrap}>
                      <Text style={styles.listLabel}>Joined On</Text>
                      <Text style={styles.listValue}>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  headerGradient: { paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20 },
  headerTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  backBtnPlaceholder: {
    width: 36,
    height: 36,
  },
    input: {
      backgroundColor: '#fff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 10,
      fontSize: 15,
      minHeight: 40,
      marginBottom: 10,
      color: '#0F172A',
    },
    editLabel: {
      fontSize: 14,
      color: '#64748B',
      marginBottom: 2,
      marginTop: 6,
      fontWeight: '700',
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1D4ED8',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 18,
      marginTop: 10,
    },
    saveBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
  scrollContent: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginTop: 10,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileInfoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  name: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 4, textAlign: 'center' },
  email: { fontSize: 15, color: '#64748B', marginBottom: 20, textAlign: 'center', fontWeight: '500' },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '800',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  listIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  listTextWrap: {
    flex: 1,
  },
  listLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  listValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
  error: { color: '#DC2626', fontSize: 16, marginTop: 20 },
   inputRow: {
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  marginBottom: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                },
                inputIcon: {
                  marginRight: 8,
                },
                inputModern: {
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#0F172A',
                  fontSize: 15,
                  paddingVertical: 10,
                  borderWidth: 0,
                },
                picker: {
                      backgroundColor: 'transparent',
                      color: '#0F172A',
                      fontSize: 15,
                      flex: 1,
                      marginLeft: -8,
                      marginRight: -8,
                      minHeight: 44,
                    },
});
