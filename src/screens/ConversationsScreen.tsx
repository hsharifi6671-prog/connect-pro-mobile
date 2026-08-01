import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ConversationRow } from '../components/ConversationRow';
import type { Conversation, RootStackParamList } from '../types';

const states = [
  { key: '', label: 'همه' },
  { key: 'unread', label: 'خوانده‌نشده' },
  { key: 'open', label: 'باز' },
  { key: 'pending', label: 'در انتظار' },
  { key: 'closed', label: 'بسته' },
];

export function ConversationsScreen() {
  const { client, theme, bootstrap } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [state, setState] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unread = useMemo(() => items.filter((item) => item.unread).length, [items]);

  const load = useCallback(async (silent = false) => {
    if (!client) return;
    if (!silent) setError('');
    try {
      const response = await client.getConversations({ perPage: 80, state, search: search.trim() });
      setItems(response.items);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'دریافت گفتگوها انجام نشد.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client, state, search]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(false), 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load(false);
      const timer = setInterval(() => load(true), 10000);
      return () => clearInterval(timer);
    }, [load]),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.header_start, theme.header_end]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>گفتگوها</Text>
            <Text style={styles.headerSubtitle}>{bootstrap?.site.name || 'کانکت پرو'} · {unread} پیام خوانده‌نشده</Text>
          </View>
          <Pressable onPress={() => { setRefreshing(true); load(false); }} style={styles.headerButton}>
            <Ionicons name="refresh-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={20} color="#7A8B86" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="جستجو در نام، شماره، ایمیل یا پیام‌ها"
            placeholderTextColor="#94A29E"
            style={styles.searchInput}
            textAlign="right"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={19} color="#8B9995" />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {states.map((item) => {
            const active = state === item.key;
            return (
              <Pressable
                key={item.key || 'all'}
                onPress={() => setState(item.key)}
                style={[styles.filter, active && { backgroundColor: theme.primary, borderColor: theme.primary }]}
              >
                <Text style={[styles.filterText, active && { color: '#FFFFFF' }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>در حال دریافت گفتگوها…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#A6B2AE" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => load(false)} style={[styles.retry, { backgroundColor: theme.primary }]}>
            <Text style={styles.retryText}>تلاش دوباره</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              theme={theme}
              onPress={() => navigation.navigate('Chat', { conversationId: item.id, initial: item })}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(false); }} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="chatbubbles-outline" size={54} color="#B4C0BC" />
              <Text style={styles.emptyTitle}>گفتگویی پیدا نشد</Text>
              <Text style={styles.emptyText}>فیلتر یا عبارت جستجو را تغییر دهید.</Text>
            </View>
          }
          contentContainerStyle={items.length ? styles.list : styles.emptyList}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 19, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', textAlign: 'right' },
  headerSubtitle: { color: '#D8F8EE', fontSize: 11.5, marginTop: 4, textAlign: 'right' },
  headerButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', alignItems: 'center', justifyContent: 'center' },
  searchWrap: { height: 49, marginTop: 17, paddingHorizontal: 13, borderRadius: 15, backgroundColor: '#FFFFFF', flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, color: '#17312A', fontSize: 12.5 },
  filtersContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E9EFED' },
  filters: { flexDirection: 'row-reverse', paddingHorizontal: 13, paddingVertical: 11, gap: 7 },
  filter: { borderWidth: 1, borderColor: '#DCE6E2', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#FFFFFF' },
  filterText: { color: '#657771', fontSize: 10.5, fontWeight: '800' },
  list: { backgroundColor: '#FFFFFF', paddingBottom: 12 },
  emptyList: { flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  loadingText: { color: '#72827D', marginTop: 12, fontSize: 12 },
  errorText: { color: '#6B7C76', textAlign: 'center', marginTop: 12, lineHeight: 21, fontSize: 12 },
  retry: { paddingHorizontal: 22, paddingVertical: 11, borderRadius: 12, marginTop: 16 },
  retryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  emptyTitle: { color: '#344943', fontWeight: '900', fontSize: 16, marginTop: 14 },
  emptyText: { color: '#84928E', fontSize: 11.5, marginTop: 5 },
});
