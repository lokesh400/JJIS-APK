import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../auth/AuthContext';
import apiClient from '../../api/client';

export default function MyTestsScreen({ navigation }) {
  const { logout } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchBatches = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError('');
      try {
        const response = await apiClient.get('/test-series/my-purchase');
        setBatches(response.data);
      } catch (e) {
        if (e.response?.status === 401) {
          logout();
        } else {
          console.error('Error fetching batches:', e);
          setError('Failed to load batches. Please try again.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [logout]
  );

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBatches(true);
  };

  const totalBatches = batches.length;

  const renderBatch = ({ item }) => (
    <View style={styles.card}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#94A3B8', '#64748B']} style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <MaterialCommunityIcons name="file-document-edit-outline" size={32} color="#FFF" />
          <Text style={styles.cardImagePlaceholderText}>No Cover</Text>
        </LinearGradient>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.batchName}>{item.name || 'Batch'}</Text>
        {!!item.description && (
          <Text style={styles.batchDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <TouchableOpacity
          style={styles.studyButton}
          onPress={() => navigation.navigate('TestSeriesDetail', { item })}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.studyButtonText}>Continue Learning</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#FFF" style={{ marginLeft: 6 }} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <AppHeader
          title="My Tests"
          navigation={navigation}
          showBack={true}
          right={<Image source={require('../../../assets/icon.png')} style={styles.headerLogo} />}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading your batches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <AppHeader
          title="My Tests"
          navigation={navigation}
          showBack={true}
          right={<Image source={require('../../../assets/icon.png')} style={styles.headerLogo} />}
        />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchBatches()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <AppHeader
        title="My Tests"
        navigation={navigation}
        showBack={true}
        right={<Image source={require('../../../assets/icon.png')} style={styles.headerLogo} />}
      />
      <View style={styles.root}>
        <LinearGradient colors={['#1E3A8A', '#3B82F6']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>YOUR STUDY TRACKS</Text>
          <Text style={styles.summaryValue}>{totalBatches}</Text>
          <Text style={styles.summarySubText}>Test Series available to continue</Text>
        </LinearGradient>

        <FlatList
          data={batches}
          keyExtractor={(item, index) => String(item._id ?? item.id ?? index)}
          renderItem={renderBatch}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No test series found.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  summaryValue: { marginTop: 4, fontSize: 32, color: '#FFFFFF', fontWeight: '900' },
  summarySubText: { marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardImage: { width: '100%', height: 170 },
  cardImagePlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginTop: 8 },
  cardBody: { padding: 14 },
  batchName: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  batchDescription: { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 12 },

  studyButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  studyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: { fontSize: 15, color: '#B91C1C', textAlign: 'center', marginBottom: 16 },
  retryButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  emptyText: { fontSize: 15, color: '#94A3B8', fontWeight: '700' },
});
