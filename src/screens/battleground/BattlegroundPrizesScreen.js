import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';

const PRIZE_MILESTONES = [
  {
    days: 50,
    prize: 'Jeevan Jyoti International School Bottle',
    icon: '🧴',
    note: 'Hydrate while you grind every day.',
  },
  {
    days: 100,
    prize: 'Jeevan Jyoti International School T-Shirt',
    icon: '👕',
    note: 'Wear your streak with pride.',
  },
  {
    days: 200,
    prize: 'Mystery Box',
    icon: '🎁',
    note: 'A surprise reward for elite consistency.',
  },
  {
    days: 365,
    prize: 'Jeevan Jyoti International School Jacket',
    icon: '🧥',
    note: 'Legendary yearly streak unlock.',
  },
];

export default function BattlegroundPrizesScreen({ navigation, route }) {
  const currentStreak = Number(route.params?.currentStreak || 0);

  const nextMilestone = useMemo(
    () => PRIZE_MILESTONES.find((m) => currentStreak < m.days) || null,
    [currentStreak]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Prizes Roadmap" navigation={navigation} showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Battleground Streak Prizes</Text>
          <Text style={styles.heroSubTitle}>Maintain your daily streak and unlock premium rewards.</Text>
          <View style={styles.streakPill}>
            <Text style={styles.streakPillLabel}>Current Streak</Text>
            <Text style={styles.streakPillValue}>{currentStreak} days</Text>
          </View>
          {!!nextMilestone && (
            <Text style={styles.heroHint}>
              {nextMilestone.days - currentStreak} days left for {nextMilestone.prize}
            </Text>
          )}
          {!nextMilestone && (
            <Text style={styles.heroHint}>All milestones unlocked. You are a Battleground legend.</Text>
          )}
        </View>

        <View style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>How Streak Works</Text>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleBullet}>1.</Text>
            <Text style={styles.ruleText}>Attempt your daily battleground quiz to continue your streak.</Text>
          </View>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleBullet}>2.</Text>
            <Text style={styles.ruleText}>Missing a day can break your current streak progress.</Text>
          </View>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleBullet}>3.</Text>
            <Text style={styles.ruleText}>As streak grows, milestones unlock better rewards in roadmap below.</Text>
          </View>
        </View>

        <View style={styles.roadmapWrap}>
          <View style={styles.roadLine} />

          {PRIZE_MILESTONES.map((milestone, index) => {
            const unlocked = currentStreak >= milestone.days;
            const remaining = Math.max(0, milestone.days - currentStreak);
            const side = index % 2 === 0 ? 'left' : 'right';

            return (
              <View key={milestone.days} style={styles.stepRow}>
                <View style={[styles.stepCard, side === 'left' ? styles.stepCardLeft : styles.stepCardRight]}>
                  <Text style={styles.stepDays}>{milestone.days} Days</Text>
                  <Text style={styles.stepPrize}>{milestone.icon} {milestone.prize}</Text>
                  <Text style={styles.stepNote}>{milestone.note}</Text>
                  <Text style={[styles.stepStatus, unlocked ? styles.statusUnlocked : styles.statusPending]}>
                    {unlocked ? 'Unlocked' : `${remaining} days to go`}
                  </Text>
                </View>

                <View style={[styles.node, unlocked ? styles.nodeUnlocked : styles.nodePending]}>
                  <Text style={styles.nodeText}>{unlocked ? '✓' : milestone.days}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingHorizontal: 18, paddingBottom: 36 },

  heroCard: {
    marginTop: 14,
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#0F172A',
  },
  heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  heroSubTitle: { color: '#CBD5E1', marginTop: 6, fontSize: 14 },
  streakPill: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakPillLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  streakPillValue: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  heroHint: { color: '#38BDF8', marginTop: 10, fontSize: 13, fontWeight: '700' },

  howItWorksCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    padding: 12,
  },
  howItWorksTitle: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  ruleBullet: {
    width: 18,
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '800',
  },
  ruleText: {
    flex: 1,
    color: '#1E293B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  roadmapWrap: {
    marginTop: 20,
    paddingBottom: 16,
    position: 'relative',
  },
  roadLine: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    left: '50%',
    width: 3,
    marginLeft: -1.5,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },

  stepRow: {
    minHeight: 130,
    justifyContent: 'center',
    marginBottom: 10,
  },
  stepCard: {
    width: '43%',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  stepCardLeft: { alignSelf: 'flex-start' },
  stepCardRight: { alignSelf: 'flex-end' },

  node: {
    position: 'absolute',
    left: '50%',
    marginLeft: -19,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  nodeUnlocked: { backgroundColor: '#16A34A', borderColor: '#DCFCE7' },
  nodePending: { backgroundColor: '#1D4ED8', borderColor: '#BFDBFE' },
  nodeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  stepDays: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  stepPrize: { fontSize: 15, color: '#0F172A', fontWeight: '800', marginTop: 6 },
  stepNote: { fontSize: 12, color: '#475569', marginTop: 5, lineHeight: 17 },
  stepStatus: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusUnlocked: { backgroundColor: '#DCFCE7', color: '#166534' },
  statusPending: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
});
