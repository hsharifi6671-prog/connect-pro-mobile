import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import type { AgentStat, StatsSummary } from '../types';
import { formatResponseTime } from '../utils/format';

export function DashboardScreen() {
  const { client, theme } = useAuth();
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [agents, setAgents] = useState<AgentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!client) return;
    try {
      const data = await client.getStats(30);
      setSummary(data.summary);
      setAgents(data.agents || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.header_start, theme.header_end]} style={styles.header}>
        <Text style={styles.headerTitle}>گزارش عملکرد</Text>
        <Text style={styles.headerSubtitle}>آمار ۳۰ روز اخیر کانکت پرو</Text>
      </LinearGradient>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.primary} />}
      >
        <View style={styles.grid}>
          <StatCard title="کل گفتگوها" value={summary?.total || 0} icon="chatbubbles-outline" color={theme.primary} />
          <StatCard title="گفتگوهای بسته" value={summary?.closed || 0} icon="checkmark-done-outline" color="#16794F" />
          <StatCard title="رضایت کاربران" value={`${summary?.satisfaction_rate || 0}٪`} icon="happy-outline" color="#8A4EB8" />
          <StatCard title="نرخ حل گفتگو" value={`${summary?.resolution_rate || 0}٪`} icon="shield-checkmark-outline" color="#CB6A16" />
          <StatCard title="میانگین پاسخ اول" value={formatResponseTime(summary?.avg_first_response || 0)} icon="timer-outline" color="#236EB6" />
          <StatCard title="قصد خرید" value={summary?.conversion_intent || 0} icon="cart-outline" color="#B16600" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ترکیب پاسخ‌گویی</Text>
          <View style={styles.compareRow}>
            <View style={styles.compareItem}>
              <Text style={[styles.compareValue, { color: theme.primary }]}>{summary?.human_assisted || 0}</Text>
              <Text style={styles.compareLabel}>با کارشناس انسانی</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.compareItem}>
              <Text style={[styles.compareValue, { color: theme.accent }]}>{summary?.ai_assisted || 0}</Text>
              <Text style={styles.compareLabel}>با دستیار هوشمند</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>عملکرد کارشناسان</Text>
          {agents.length ? agents.map((agent) => (
            <View key={`${agent.agent_key}-${agent.user_id}`} style={styles.agentRow}>
              <View style={[styles.agentAvatar, { backgroundColor: `${theme.primary}18` }]}>
                <Text style={[styles.agentInitial, { color: theme.primary }]}>{agent.name.charAt(0)}</Text>
              </View>
              <View style={styles.agentBody}>
                <View style={styles.agentTop}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={[styles.agentScore, { color: theme.primary }]}>{agent.score}٪</Text>
                </View>
                <View style={styles.progress}><View style={[styles.progressFill, { width: `${Math.min(100, agent.score)}%`, backgroundColor: theme.accent }]} /></View>
                <Text style={styles.agentMeta}>{agent.positive} مثبت · {agent.negative} منفی · {agent.rated} رأی</Text>
              </View>
            </View>
          )) : <Text style={styles.empty}>هنوز بازخوردی برای کارشناسان ثبت نشده است.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 24, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', textAlign: 'right' },
  headerSubtitle: { color: '#DAF8EF', fontSize: 11.5, marginTop: 5, textAlign: 'right' },
  content: { padding: 14, paddingBottom: 36 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E7EEEB', padding: 15, marginTop: 12 },
  sectionTitle: { color: '#18322B', fontSize: 15, fontWeight: '900', textAlign: 'right', marginBottom: 13 },
  compareRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  compareItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  divider: { width: 1, height: 55, backgroundColor: '#E6ECEA' },
  compareValue: { fontSize: 26, fontWeight: '900' },
  compareLabel: { color: '#71817C', fontSize: 10.5, marginTop: 4 },
  agentRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#EDF2F0' },
  agentAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  agentInitial: { fontSize: 17, fontWeight: '900' },
  agentBody: { flex: 1 },
  agentTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  agentName: { color: '#263C35', fontWeight: '800', fontSize: 12.5 },
  agentScore: { fontSize: 12, fontWeight: '900' },
  progress: { height: 5, borderRadius: 5, backgroundColor: '#EAF0EE', marginTop: 7, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  agentMeta: { color: '#82908C', fontSize: 9.5, marginTop: 5, textAlign: 'right' },
  empty: { color: '#7C8D87', fontSize: 11.5, textAlign: 'center', paddingVertical: 20 },
});
