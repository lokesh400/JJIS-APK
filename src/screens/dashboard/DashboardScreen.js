import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView, Dimensions, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../auth/AuthContext';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCourse, getCohorts } from '../../api/client';

const { width } = Dimensions.get('window');
const ACTION_GAP = 12;
const ACTION_CARD_WIDTH = (width - 32 - ACTION_GAP) / 2;

export default function DashboardScreen({ navigation }) {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [schedule, setSchedule] = useState({ live: [], upcoming: [], completed: [], cancelled: [] });
  const [cohortsLoading, setCohortsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCohorts();
    setRefreshing(false);
  };
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Load cohorts on mount
  useEffect(() => {
    (async () => {
      setCohortsLoading(true);
      try {
        const response = await getCohorts();
        const data = response.data || [];
        setCohorts(data);
        if (data.length) {
          const persisted = await AsyncStorage.getItem('selectedCohort');
          const matched = data.find(c => c._id === persisted);
          const initial = matched ? persisted : data[0]._id;
          setSelectedCohort(initial);
        }
      } catch (e) {
        console.error('Failed to load cohorts', e);
      } finally {
        setCohortsLoading(false);
      }
    })();
  }, []);

  // Persist cohort selection
  useEffect(() => {
    if (selectedCohort) {
      AsyncStorage.setItem('selectedCohort', selectedCohort);
    }
  }, [selectedCohort]);

  // Load schedule whenever cohort changes
  useEffect(() => {
    if (!selectedCohort) return;
    (async () => {
      setScheduleLoading(true);
      try {
        const data = await getCourse(selectedCohort);
        setSchedule({
          live: data.live || [],
          upcoming: data.upcoming || [],
          completed: data.completed || [],
          cancelled: data.cancelled || [],
        });
      } catch (e) {
        console.error('Failed to load schedule', e);
        setSchedule({ live: [], upcoming: [], completed: [], cancelled: [] });
      } finally {
        setScheduleLoading(false);
      }
    })();
  }, [selectedCohort]);

  const openSoon = (label) => {
    setMenuOpen(false);
    Alert.alert(label, `${label} module will be added with backend integration.`);
  };

  const renderLectureCard = (lecture) => (
    <View key={lecture._id} style={styles.horizontalLectureCard}>
      {lecture.status === 'live' ? (
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>LIVE NOW</Text>
        </View>
      ) : lecture.status === 'cancelled' ? (
        <View style={[styles.livePill, { backgroundColor: '#F1F5F9' }]}>
          <Text style={[styles.livePillText, { color: '#64748B' }]}>CANCELLED</Text>
        </View>
      ) : null}
      <Text style={styles.lectureTitle} numberOfLines={2}>{lecture.title}</Text>
      <Text style={styles.lectureSubtitle} numberOfLines={1}>{lecture.subject}</Text>
      {lecture.scheduledAt && (
        <Text style={styles.lectureTime}>
          {new Date(lecture.scheduledAt).toLocaleString('en-IN', {
            day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit'
          })}
        </Text>
      )}
      <View style={{ flex: 1 }} />
      {lecture.status === 'cancelled' ? (
        <View style={[styles.joinBtn, { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}>
           <Text style={[styles.joinBtnText, { color: '#64748B' }]}>🚫 Class Cancelled</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.joinBtn, lecture.status === 'live' && styles.joinBtnLive]}
          onPress={() => {
            navigation.navigate('Study', {
              screen: 'StudyYoutubeVideoPlayer',
              params: {
                courseId: selectedCohort,
                lectureId: lecture._id,
                lectureTitle: lecture.title,
                status: lecture.status || 'ended',
              }
            });
          }}
        >
          <MaterialCommunityIcons
            name={lecture.status === 'live' ? 'play-circle' : 'play-outline'}
            size={16}
            color="#fff"
          />
          <Text style={styles.joinBtnText}>
            {lecture.status === 'live' ? 'Join Live' : 'Watch Recording'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <View style={styles.bgBlobTop} />
        <View style={styles.bgBlobBottom} />

        <View style={styles.header}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View style={styles.titleContainer} pointerEvents="none">
            <Text style={styles.brandTitle}>Jeevan Jyoti International School</Text>
          </View>

          <TouchableOpacity style={styles.menuBtn} activeOpacity={0.85} onPress={() => setMenuOpen(true)}>
            <MaterialCommunityIcons name="menu" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
                    {/* Cohort Selector */}
          {cohortsLoading ? (
            <View style={styles.cohortLoadingWrap}>
              <ActivityIndicator size="small" color="#1D4ED8" />
              <Text style={styles.cohortLoadingText}>Loading batches…</Text>
            </View>
          ) : cohorts.length === 0 ? (
            <View style={styles.noBatchCard}>
              <MaterialCommunityIcons name="school-outline" size={36} color="#93C5FD" />
              <Text style={styles.noBatchTitle}>Not enrolled in any batch</Text>
              <Text style={styles.noBatchSubText}>
                Ask your admin to enroll you in a batch to see your live classes here.
              </Text>
            </View>
          ) : (
            <>
              {/* Premium Cohort Picker */}
              <View style={styles.premiumPickerCard}>
                <View style={styles.pickerHeader}>
                  <MaterialCommunityIcons name="google-classroom" size={18} color="#1D4ED8" />
                  <Text style={styles.pickerLabel}>My Active Batch</Text>
                </View>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedCohort}
                    onValueChange={(value) => setSelectedCohort(value)}
                    style={styles.picker}
                    dropdownIconColor="#1D4ED8"
                  >
                    {cohorts.map((c) => (
                      <Picker.Item key={c._id} label={c.name ?? 'Unnamed Batch'} value={c._id} color="#0F172A" />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Lecture Sections */}
              {scheduleLoading ? (
                <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 40, marginBottom: 40 }} />
              ) : (
                <>
                  {/* LIVE CLASSES */}
                  <View style={styles.horizontalSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>Live Classes</Text>
                      <View style={styles.badgeBox}><Text style={styles.badgeText}>{schedule.live.length}</Text></View>
                    </View>
                    {schedule.live.length === 0 ? (
                      <View style={styles.emptyHorizontalCard}>
                         <MaterialCommunityIcons name="broadcast" size={24} color="#93C5FD" />
                         <Text style={styles.emptyHorizontalText}>No live classes scheduled</Text>
                      </View>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {schedule.live.map(lecture => renderLectureCard(lecture))}
                      </ScrollView>
                    )}
                  </View>

                  {/* UPCOMING CLASSES */}
                  <View style={styles.horizontalSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>Upcoming Classes</Text>
                      <View style={styles.badgeBox}><Text style={styles.badgeText}>{schedule.upcoming.length}</Text></View>
                    </View>
                    {schedule.upcoming.length === 0 ? (
                      <View style={styles.emptyHorizontalCard}>
                         <MaterialCommunityIcons name="calendar-clock" size={24} color="#93C5FD" />
                         <Text style={styles.emptyHorizontalText}>No upcoming classes scheduled</Text>
                      </View>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {schedule.upcoming.map(lecture => renderLectureCard(lecture))}
                      </ScrollView>
                    )}
                  </View>

                  {/* COMPLETED CLASSES */}
                  <View style={styles.horizontalSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>Completed Classes</Text>
                      <View style={styles.badgeBox}><Text style={styles.badgeText}>{schedule.completed.length}</Text></View>
                    </View>
                    {schedule.completed.length === 0 ? (
                      <View style={styles.emptyHorizontalCard}>
                         <MaterialCommunityIcons name="check-circle-outline" size={24} color="#93C5FD" />
                         <Text style={styles.emptyHorizontalText}>No completed classes</Text>
                      </View>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {schedule.completed.map(lecture => renderLectureCard(lecture))}
                      </ScrollView>
                    )}
                  </View>

                  {/* CANCELLED CLASSES */}
                  <View style={styles.horizontalSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>Cancelled</Text>
                      <View style={styles.badgeBox}><Text style={styles.badgeText}>{schedule.cancelled?.length || 0}</Text></View>
                    </View>
                    {(!schedule.cancelled || schedule.cancelled.length === 0) ? (
                      <View style={styles.emptyHorizontalCard}>
                         <MaterialCommunityIcons name="cancel" size={24} color="#94A3B8" />
                         <Text style={styles.emptyHorizontalText}>No cancelled classes</Text>
                      </View>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {schedule.cancelled.map(lecture => renderLectureCard(lecture))}
                      </ScrollView>
                    )}
                  </View>
                </>
              )}
            </>
          )}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubTitle}>Jump right in</Text>
          </View>

          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardBlue]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Batches', { screen: 'BatchesList' })}
            >
              <View style={styles.actionIconWrap}>
                <MaterialCommunityIcons name="compass-outline" size={26} color="#1D4ED8" />
              </View>
              <Text style={styles.actionTitle}>Explore Store</Text>
              <Text style={styles.actionHint}>Find new courses</Text>
              <View style={styles.actionFooter}>
                <Text style={styles.actionFooterText}>Open</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#1D4ED8" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardGreen]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Batches', { screen: 'Downloads' })}
            >
              <View style={styles.actionIconWrap}>
                <MaterialCommunityIcons name="download-circle-outline" size={26} color="#047857" />
              </View>
              <Text style={styles.actionTitle}>Downloads</Text>
              <Text style={styles.actionHint}>Study offline anytime</Text>
              <View style={styles.actionFooter}>
                <Text style={[styles.actionFooterText, { color: '#047857' }]}>Open</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#047857" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardAmber]}
              activeOpacity={0.88}
              onPress={() => openSoon('Library')}
            >
              <View style={styles.actionIconWrap}>
                <MaterialCommunityIcons name="bookshelf" size={26} color="#B45309" />
              </View>
              <Text style={styles.actionTitle}>Library</Text>
              <Text style={styles.actionHint}>Books and notes</Text>
              <View style={styles.actionFooter}>
                <Text style={[styles.actionFooterText, { color: '#B45309' }]}>Open</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#B45309" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardRose]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Battleground')}
            >
              <View style={styles.actionIconWrap}>
                <MaterialCommunityIcons name="sword-cross" size={26} color="#BE123C" />
              </View>
              <Text style={styles.actionTitle}>Battleground</Text>
              <Text style={styles.actionHint}>Compete and rank up</Text>
              <View style={styles.actionFooter}>
                <Text style={[styles.actionFooterText, { color: '#BE123C' }]}>Open</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#BE123C" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Need Quick Help?</Text>
            <Text style={styles.supportSubTitle}>Access help, settings, or purchases from one place.</Text>

            <View style={styles.supportActionsRow}>
              <TouchableOpacity
                style={styles.supportActionBtn}
                onPress={() => navigation.navigate('HelpSupport')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="lifebuoy" size={16} color="#1D4ED8" />
                <Text style={styles.supportActionText}>Help & Support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.supportActionBtn}
                onPress={() => navigation.navigate('Batches', { screen: 'MyPurchases' })}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="cart-outline" size={16} color="#1D4ED8" />
                <Text style={styles.supportActionText}>My Purchases</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        
        <Modal visible={menuOpen} animationType="slide" transparent={true} onRequestClose={() => setMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.fullScreenDrawer}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuHeaderTitle}>Menu</Text>
                <TouchableOpacity onPress={() => setMenuOpen(false)} style={styles.menuCloseBtn}>
                  <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Account</Text>
                <TouchableOpacity style={styles.menuActionBtn} onPress={() => { setMenuOpen(false); navigation.navigate('MyProfile'); }}>
                  <MaterialCommunityIcons name="account-circle-outline" size={24} color="#1D4ED8" style={{marginRight: 14}} />
                  <Text style={styles.menuActionText}>My Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuActionBtn}
                  onPress={() => {
                    setMenuOpen(false);
                    navigation.navigate('Batches', { screen: 'MyPurchases' });
                  }}
                >
                  <MaterialCommunityIcons name="cart-outline" size={24} color="#1D4ED8" style={{marginRight: 14}} />
                  <Text style={styles.menuActionText}>My Purchases</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Essentials</Text>
                <TouchableOpacity style={styles.menuActionBtn} onPress={() => { setMenuOpen(false); navigation.navigate('HelpSupport'); }}>
                  <MaterialCommunityIcons name="lifebuoy" size={24} color="#1D4ED8" style={{marginRight: 14}} />
                  <Text style={styles.menuActionText}>Help & Support</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuActionBtn} onPress={() => { setMenuOpen(false); navigation.navigate('Settings'); }}>
                  <MaterialCommunityIcons name="cog-outline" size={24} color="#1D4ED8" style={{marginRight: 14}} />
                  <Text style={styles.menuActionText}>Settings</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }} />
              
              <TouchableOpacity
                style={styles.logoutBtnFull}
                onPress={async () => {
                  setMenuOpen(false);
                  await logout();
                }}
              >
                <MaterialCommunityIcons name="logout" size={20} color="#DC2626" style={{marginRight: 8}} />
                <Text style={styles.logoutTextFull}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  premiumPickerCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#0F172A',
  },
  horizontalSection: {
    marginTop: 20,
  },
  horizontalSectionHeader: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  horizontalSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  horizontalLectureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    width: 240,
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyHorizontalCard: {
    marginHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHorizontalText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 4,
  },
  livePillText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  lectureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  lectureSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginVertical: 4,
  },
  lectureTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  joinBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  joinBtnLive: {
    backgroundColor: '#EF4444',
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  badgeBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  sectionHeaderRow: {
    marginTop: 0, // Reset to 0 since container handles it
    marginBottom: 10,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bgBlobTop: {
    position: 'absolute',
    top: -95,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#DBEAFE',
    opacity: 0.35,
  },
  bgBlobBottom: {
    position: 'absolute',
    bottom: -120,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#E0F2FE',
    opacity: 0.45,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'rgba(248,250,252,0.92)',
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  brandTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  brandSubTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 28,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 6,
    overflow: 'hidden',
    backgroundColor: '#1D4ED8',
    borderWidth: 1,
    borderColor: '#1E40AF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(191,219,254,0.45)',
    gap: 4,
  },
  readyPillText: {
    color: '#DBEAFE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -60,
    right: -40,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -38,
    left: -26,
  },
  welcomeGreeting: {
    color: '#BFDBFE',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  welcomeName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  welcomeSubtext: {
    color: '#DBEAFE',
    fontSize: 13,
    fontWeight: '700',
  },
  heroStatRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatPill: {
    width: '31%',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(191,219,254,0.35)',
  },
  heroStatLabel: {
    marginTop: 4,
    color: '#DBEAFE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
  },
  sectionSubTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  actionGrid: {
    marginHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: ACTION_GAP,
  },
  actionCard: {
    width: ACTION_CARD_WIDTH,
    minHeight: 132,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  actionCardBlue: { backgroundColor: '#EEF4FF', borderColor: '#D6E4FF' },
  actionCardGreen: { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  actionCardAmber: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  actionCardRose: { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  actionHint: {
    marginTop: 4,
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  actionFooter: {
    marginTop: 'auto',
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionFooterText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
  },
  supportCard: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  supportTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  supportSubTitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  supportActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  supportActionBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  supportActionText: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  fullScreenDrawer: { backgroundColor: '#F8FAFC', width: '100%', height: '90%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 15 },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 24, borderBottomWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  menuHeaderTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  menuCloseBtn: { padding: 8, backgroundColor: '#E2E8F0', borderRadius: 20 },
  menuSection: { marginBottom: 32 },
  menuSectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  menuActionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  menuActionText: { fontSize: 17, color: '#1E293B', fontWeight: '600' },
  logoutBtnFull: { flexDirection: 'row', backgroundColor: '#FEE2E2', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  logoutTextFull: { color: '#DC2626', fontSize: 16, fontWeight: '800' }
});