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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../auth/AuthContext';
import apiClient from '../../api/client';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BatchesScreen({ navigation }) {
  const { logout } = useAuth();
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError('');
      try {
        const [pubCoursesRes, pubTestsRes, myCoursesRes, myTestsRes] = await Promise.all([
          apiClient.get('/courses/published?minimal=true'),
          apiClient.get('/test-series/published'),
          apiClient.get('/study/my-courses'),
          apiClient.get('/test-series/my-purchase')
        ]);

        const purchasedCourseIds = new Set((myCoursesRes.data || []).map(c => c.course?._id || c._id).filter(Boolean));
        const purchasedTestIds = new Set((myTestsRes.data || []).map(t => t._id));

        const unpurchasedCourses = (pubCoursesRes.data || [])
          .filter(c => !purchasedCourseIds.has(c._id))
          .map(c => ({ ...c, _type: 'course' }));

        const unpurchasedTests = (pubTestsRes.data || [])
          .filter(t => !purchasedTestIds.has(t._id))
          .map(t => ({ ...t, _type: 'test-series' }));

        setAllItems([...unpurchasedCourses, ...unpurchasedTests]);
      } catch (e) {
        if (e.response?.status === 401) {
          logout();
        } else {
          console.error('Error fetching explore items:', e);
          setError('Failed to load. Please try again.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [logout]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const filteredItems = allItems.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (item.name || '').toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
  });

  const renderItem = ({ item }) => {
    const isCourse = item._type === 'course';
    
    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          navigation.navigate('PurchasePreview', { item, type: isCourse ? 'course' : 'test-series' });
        }}
      >
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>{isCourse ? 'BATCH' : 'TEST SERIES'}</Text>
        </View>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Text style={styles.cardImagePlaceholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.batchName}>{item.name || 'Untitled'}</Text>
          {!!item.description && (
            <Text style={styles.batchDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.priceRow}>
            {item.price > 0 ? (
              <Text style={styles.priceText}>₹{item.price}</Text>
            ) : (
              <Text style={styles.freeText}>FREE</Text>
            )}
            <View style={styles.exploreBtn}>
              <Text style={styles.exploreBtnText}>{item.price > 0 ? 'Purchase Now' : 'Explore'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <AppHeader
          title="Explore"
          navigation={navigation}
          showBack={true}
          right={<Image source={require('../../../assets/icon.png')} style={styles.headerLogo} />}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Finding best batches for you...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <AppHeader
          title="Explore"
          navigation={navigation}
          showBack={true}
          right={<Image source={require('../../../assets/icon.png')} style={styles.headerLogo} />}
        />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <AppHeader
        title="Explore"
        navigation={navigation}
        showBack={true}
        right={<Image source={require('../../../assets/icon.png')} style={styles.headerLogo} />}
      />
      <View style={styles.root}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search batches & test series..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => String(item._id ?? index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No items found matching your search.</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#0F172A',
  },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 18 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    position: 'relative',
  },
  badgeWrap: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  badgeText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardImage: { width: '100%', height: 160 },
  cardImagePlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  cardBody: { padding: 16 },
  batchName: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  batchDescription: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 14 },
  
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  freeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  exploreBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exploreBtnText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },

  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: { fontSize: 15, color: '#B91C1C', textAlign: 'center', marginBottom: 16 },
  retryButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#64748B', fontWeight: '500', textAlign: 'center' },
});
