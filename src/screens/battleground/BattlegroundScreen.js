import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '../../components/AppHeader';
import apiClient from '../../api/client';

const streakBadges = [
  { days: 3 },
  { days: 7 },
  { days: 30 },
];

export default function BattlegroundScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [battlegrounds, setBattlegrounds] = useState([]);
  const [streak, setStreak] = useState({ currentStreak: 0, bestStreak: 0, totalAttempts: 0, totalCorrect: 0 });
  const [submittedSubjects, setSubmittedSubjects] = useState([]);
  const [submittedItemIds, setSubmittedItemIds] = useState([]);
  const [dateKey, setDateKey] = useState('');
  const [classLevel, setClassLevel] = useState('');

  const groupedByClass = useMemo(() => {
    const groups = {};
    battlegrounds.forEach((item) => {
      const key = String(item.classLevel || 'Uncategorized');
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const classOrder = (label) => {
      const txt = String(label || '').toLowerCase();
      const found = txt.match(/(\d+)/);
      if (found) return Number(found[1]);
      if (txt.includes('dropper')) return 99;
      return 100;
    };

    return Object.entries(groups)
      .sort((a, b) => classOrder(a[0]) - classOrder(b[0]))
      .map(([groupClass, items]) => ({ groupClass, items }));
  }, [battlegrounds]);

  useEffect(() => {
    fetchTodayQuiz();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTodayQuiz();
    }, [])
  );

  const fetchTodayQuiz = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiClient.get('/battlegrounds/today');
      const list = res.data?.battlegrounds || res.data?.quizzes || (res.data?.quiz ? [res.data.quiz] : []);
      setBattlegrounds(list);
      setStreak(res.data.streak);
      setSubmittedSubjects(Array.isArray(res.data?.submittedSubjects) ? res.data.submittedSubjects : []);
      setSubmittedItemIds(Array.isArray(res.data?.submittedItemIds) ? res.data.submittedItemIds.map((id) => String(id)) : []);
      setDateKey(res.data.dateKey || '');
      setClassLevel(res.data.classLevel || '');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to load battleground quiz.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  
  const onRefresh = useCallback(() => {
    fetchTodayQuiz(true);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="Battleground"
        navigation={navigation}
        showBack={true}
        right={
          <View style={styles.headerRightWrap}>
            <View style={styles.streakHeaderPill}>
              <MaterialCommunityIcons name="fire" size={14} color="#F97316" />
              <Text style={styles.streakHeaderText}>{streak.currentStreak}</Text>
            </View>

            <TouchableOpacity
              style={styles.helpTopBtn}
              onPress={() => navigation.navigate('BattlegroundPrizes', { currentStreak: streak.currentStreak })}
              activeOpacity={0.85}
            >
              <Text style={styles.helpTopBtnText}>?</Text>
            </TouchableOpacity>

            <Image source={require('../../../assets/icon.png')} style={{ width: 30, height: 30, borderRadius: 8 }} />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.bgOrbOne} />
        <View style={styles.bgOrbTwo} />

        <LinearGradient colors={['#4F46E5', '#312E81']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.heroCard}>
          <View style={styles.heroTagWrap}>
            <Text style={styles.heroTag}>Daily Combat Arena</Text>
          </View>
          <Text style={styles.heroTitle}>Compete, Win, and Build an Unbreakable Streak</Text>
          <Text style={styles.heroSubtitle}>
            Attempt today's subject-wise battleground quiz and keep climbing the leaderboard.
          </Text>
          <View style={styles.heroMetaStrip}>
            <Text style={styles.heroMetaItem}>Class: {classLevel || '-'}</Text>
            <Text style={styles.heroMetaDot}>•</Text>
            <Text style={styles.heroMetaItem}>Date: {dateKey || '-'}</Text>
          </View>
        </LinearGradient>

        <View style={styles.statPanel}>
          <Text style={styles.sectionTitle}>Streak Performance</Text>
          <View style={styles.streakBadgeRow}>
            {streakBadges.map((badge) => (
              <View key={badge.days} style={styles.badgePill}>
                <Text style={styles.badgePillEmoji}>🔥</Text>
                <Text style={styles.badgePillText}>{badge.days} Days</Text>
              </View>
            ))}
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.streakStatCard}>
              <Text style={styles.streakStatLabel}>Current</Text>
              <Text style={styles.streakStatValue}>{streak.currentStreak}</Text>
            </View>
            <View style={styles.streakStatCard}>
              <Text style={styles.streakStatLabel}>Best</Text>
              <Text style={styles.streakStatValue}>{streak.bestStreak}</Text>
            </View>
            <View style={styles.streakStatCard}>
              <Text style={styles.streakStatLabel}>Attempts</Text>
              <Text style={styles.streakStatValue}>{streak.totalAttempts}</Text>
            </View>
            <View style={styles.streakStatCard}>
              <Text style={styles.streakStatLabel}>Correct</Text>
              <Text style={styles.streakStatValue}>{streak.totalCorrect}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quizSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Today's Battlegrounds</Text>
            <Text style={styles.sectionSubText}>
              {battlegrounds.length} quiz{battlegrounds.length === 1 ? '' : 'zes'}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#1D4ED8" />
          ) : groupedByClass.length ? (
            groupedByClass.map((group) => (
              <View key={group.groupClass} style={styles.classBlock}>
                <View style={styles.classTitleWrap}>
                  <Text style={styles.classHeading}>{group.groupClass}</Text>
                  <Text style={styles.classCount}>{group.items.length} Subjects</Text>
                </View>

                {group.items.map((item) => {
                  const itemId = String(item._id || '');
                  const isSubmitted = submittedSubjects.includes(item.subjectKey) || submittedItemIds.includes(itemId);

                  return (
                    <View key={itemId} style={styles.quizCard}>
                      <View style={styles.quizAccent} />
                      <View style={styles.rowHeader}>
                        <View>
                          <Text style={styles.subjectChip}>{String(item.subjectKey || 'subject').toUpperCase()}</Text>
                          <Text style={styles.subjectHint}>
                            {isSubmitted ? 'Already attempted today' : "Ready for today's challenge"}
                          </Text>
                        </View>
                        {isSubmitted ? (
                          <Text style={styles.doneText}>Attempted</Text>
                        ) : (
                          <TouchableOpacity
                            style={styles.attemptBtn}
                            onPress={() => navigation.navigate('BattlegroundAttempt', { item })}
                          >
                            <Text style={styles.attemptBtnText}>Attempt</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No Battleground Today</Text>
              <Text style={styles.emptyText}>Fresh quiz drops soon. Check back after some time.</Text>
            </View>
          )}
        </View>

        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 36, position: 'relative' },
  headerRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  streakHeaderText: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '800',
  },
  helpTopBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  helpTopBtnText: {
    color: '#1D4ED8',
    fontSize: 15,
    fontWeight: '800',
  },
  bgOrbOne: {
    position: 'absolute',
    top: 18,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  bgOrbTwo: {
    position: 'absolute',
    top: 210,
    left: -70,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(14, 165, 233, 0.10)',
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#1D4ED8',
    borderWidth: 1,
    borderColor: '#1E40AF',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  heroTagWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  heroTag: { color: '#DBEAFE', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', lineHeight: 31 },
  heroSubtitle: { color: '#E0E7FF', fontSize: 14, marginTop: 10, lineHeight: 21 },
  heroMetaStrip: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroMetaItem: { color: '#DBEAFE', fontWeight: '700', fontSize: 12 },
  heroMetaDot: { color: '#BFDBFE', marginHorizontal: 8, fontWeight: '800' },
  statPanel: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 10, letterSpacing: 0.2 },
  streakBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginRight: 8,
    marginBottom: 8,
  },
  badgePillEmoji: { marginRight: 5, fontSize: 12 },
  badgePillText: { color: '#1D4ED8', fontWeight: '700', fontSize: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  streakStatCard: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  streakStatLabel: { fontSize: 12, color: '#64748B', marginBottom: 3, fontWeight: '700' },
  streakStatValue: { fontSize: 20, color: '#1D4ED8', fontWeight: '800' },
  quizSection: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sectionSubText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },
  classBlock: { marginTop: 8, marginBottom: 10 },
  classTitleWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  classHeading: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  classCount: { fontSize: 12, color: '#1D4ED8', fontWeight: '700' },
  quizCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  quizAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#1D4ED8',
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 6 },
  subjectChip: {
    color: '#1E3A8A',
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: '800',
    fontSize: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  subjectHint: { color: '#64748B', fontSize: 12, marginTop: 7, fontWeight: '600' },
  doneText: {
    color: '#052E16',
    fontWeight: '800',
    fontSize: 12,
    backgroundColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  attemptBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  attemptBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.2 },
  emptyWrap: {
    marginTop: 10,
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyTitle: { color: '#1E293B', fontWeight: '800', fontSize: 15, marginBottom: 5 },
  emptyText: { color: '#64748B', textAlign: 'center', fontSize: 13 },
  refreshBtn: {
    alignSelf: 'center',
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  refreshBtnText: { color: '#1E3A8A', fontWeight: '700' },
});
