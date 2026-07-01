import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../auth/AuthContext';
import apiClient from '../../api/client';

const { width } = Dimensions.get('window');

export default function PurchasePreviewScreen({ route, navigation }) {
  const { item, type } = route.params; 
  
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      if (item.price === 0) {
        // Free enrollment
        const res = await apiClient.post('/payments/free-access', {
          itemType: type === 'course' ? 'Course' : 'TestSeries',
          itemId: item._id
        });
        if (res.data?.success) {
          Alert.alert("Success", "You have successfully enrolled for free!");
          navigateToDetail();
        }
      } else {
        // Paid enrollment via Razorpay
        const orderRes = await apiClient.post('/payments/create-order', {
          itemType: type === 'course' ? 'Course' : 'TestSeries',
          itemId: item._id
        });
        
        const { orderId, amount, currency, razorpayKeyId } = orderRes.data;

        const options = {
          description: `Purchase ${item.name}`,
          image: 'https://garudclasses.com/logo.png',
          currency,
          key: razorpayKeyId,
          amount,
          name: 'Garud Classes',
          order_id: orderId,
          prefill: {
            email: user?.email || '',
            contact: user?.mobile || '',
            name: user?.name || ''
          },
          theme: { color: '#6366F1' } // A modern indigo color
        };

        RazorpayCheckout.open(options)
          .then(async (data) => {
            const verifyRes = await apiClient.post('/payments/verify', {
              itemType: type === 'course' ? 'Course' : 'TestSeries',
              itemId: item._id,
              paymentId: data.razorpay_payment_id,
              orderId: data.razorpay_order_id,
              signature: data.razorpay_signature
            });

            if (verifyRes.data?.success) {
              Alert.alert("Success", "Payment successful! You are now enrolled.");
              navigateToDetail();
            }
          })
          .catch((error) => {
            console.log("Payment Error:", error);
            Alert.alert("Payment Failed", `Error: ${error.description || error.message || 'Payment cancelled or failed'}`);
            setLoading(false);
          });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
      } else {
        console.error("Enrollment error:", error.response?.data || error.message);
        Alert.alert("Error", error.response?.data?.message || "Failed to process enrollment");
      }
      setLoading(false);
    }
  };

  const navigateToDetail = () => {
    setLoading(false);
    if (type === 'course') {
      navigation.replace('Study', { screen: 'StudyCourseDetail', params: { courseId: item._id, purchased: true } });
    } else {
      navigation.replace('TestSeriesDetail', { item });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <AppHeader title="Preview" navigation={navigation} showBack={true} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.bannerImage} resizeMode="cover" />
          ) : (
            <View style={[styles.bannerImage, styles.placeholderImage]}>
              <MaterialCommunityIcons name="image-outline" size={48} color="#94A3B8" />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          {/* Gradient overlay for smooth transition */}
          <LinearGradient
            colors={['transparent', 'rgba(15,23,42,0.8)']}
            style={styles.gradientOverlay}
          />
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.headerRow}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              style={styles.badgeWrap}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.badgeText}>{type === 'course' ? 'PREMIUM BATCH' : 'TEST SERIES'}</Text>
            </LinearGradient>
          </View>
          
          <Text style={styles.title}>{item.name}</Text>
          
          <View style={styles.priceContainer}>
            {item.price > 0 ? (
              <Text style={styles.priceText}>₹{item.price}</Text>
            ) : (
              <Text style={styles.freeText}>FREE</Text>
            )}
            <View style={styles.discountTag}>
              <MaterialCommunityIcons name="check-decagram" size={16} color="#059669" />
              <Text style={styles.discountText}>Special Offer</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Premium Features List */}
          <View style={styles.featuresSection}>
            <Text style={styles.descTitle}>What's included</Text>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="video-outline" size={20} color="#6366F1" />
              <Text style={styles.featureText}>High-quality video lectures</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color="#6366F1" />
              <Text style={styles.featureText}>Detailed study materials & notes</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#6366F1" />
              <Text style={styles.featureText}>Comprehensive mock tests</Text>
            </View>
          </View>

          {!!item.description && (
            <View style={styles.descSection}>
              <Text style={styles.descTitle}>About this {type === 'course' ? 'batch' : 'test series'}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          activeOpacity={0.85}
          onPress={handleEnroll}
          disabled={loading}
        >
          <LinearGradient
            colors={item.price === 0 ? ['#10B981', '#059669'] : ['#4F46E5', '#3730A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.enrollBtn, loading && styles.enrollBtnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.enrollBtnText}>
                  {item.price === 0 ? "Direct Enroll Now" : `Purchase Now (₹${item.price})`}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" style={styles.btnIcon} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.secureText}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#64748B" /> Secure Checkout
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 130 },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 280,
  },
  bannerImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#E2E8F0',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  detailsContainer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -40,
    minHeight: 500,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeWrap: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
    lineHeight: 34,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  priceText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
  },
  freeText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#059669',
  },
  discountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  discountText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 24,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#334155',
    marginLeft: 12,
    fontWeight: '500',
  },
  descSection: {
    marginTop: 8,
  },
  descTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  enrollBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  enrollBtnDisabled: {
    opacity: 0.7,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enrollBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnIcon: {
    marginLeft: 8,
  },
  secureText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 12,
  }
});
