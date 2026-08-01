import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import type { Agent, PluginSettings } from '../types';
import { departmentLabel } from '../utils/format';

export function SettingsScreen() {
  const { client, theme, bootstrap, setTheme, logout } = useAuth();
  const [settings, setSettings] = useState<PluginSettings | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!client || !bootstrap?.permissions.settings) {
      setLoading(false);
      return;
    }
    try {
      const [settingsResponse, agentsResponse] = await Promise.all([client.getSettings(), client.getAgents()]);
      setSettings(settingsResponse.settings);
      setAgents(agentsResponse.agents);
    } catch (e) {
      Alert.alert('خطا', e instanceof Error ? e.message : 'دریافت تنظیمات انجام نشد.');
    } finally {
      setLoading(false);
    }
  }, [client, bootstrap?.permissions.settings]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const patch = <K extends keyof PluginSettings>(key: K, value: PluginSettings[K]) => {
    setSettings((current) => current ? { ...current, [key]: value } : current);
  };

  const save = async () => {
    if (!client || !settings) return;
    setSaving(true);
    try {
      const data = await client.updateSettings(settings);
      setSettings(data.settings);
      setTheme(data.theme);
      Alert.alert('ذخیره شد', 'تنظیمات کانکت پرو با موفقیت بروزرسانی شد.');
    } catch (e) {
      Alert.alert('ذخیره نشد', e instanceof Error ? e.message : 'ذخیره تنظیمات انجام نشد.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAgent = async (agent: Agent, active: boolean) => {
    if (!client) return;
    setAgents((current) => current.map((item) => item.index === agent.index ? { ...item, active } : item));
    try {
      const response = await client.updateAgent(agent.index, { active });
      setAgents(response.agents);
    } catch (e) {
      setAgents((current) => current.map((item) => item.index === agent.index ? { ...item, active: agent.active } : item));
      Alert.alert('بروزرسانی نشد', e instanceof Error ? e.message : 'وضعیت کارشناس ذخیره نشد.');
    }
  };

  const confirmLogout = () => {
    Alert.alert('قطع اتصال', 'اتصال این دستگاه از سایت حذف شود؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'قطع اتصال', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.header_start, theme.header_end]} style={styles.header}>
        <Text style={styles.headerTitle}>تنظیمات</Text>
        <Text style={styles.headerSubtitle}>مدیریت عملیاتی کانکت پرو از موبایل</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.accountCard}>
          <View style={[styles.userAvatar, { backgroundColor: `${theme.primary}18` }]}>
            <Ionicons name="person-outline" size={26} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{bootstrap?.user.name}</Text>
            <Text style={styles.userMeta}>{bootstrap?.site.name} · نسخه افزونه {bootstrap?.plugin_version}</Text>
          </View>
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.accent} />
        </View>

        {!bootstrap?.permissions.settings ? (
          <View style={styles.warningBox}>
            <Ionicons name="lock-closed-outline" size={24} color="#A15C00" />
            <Text style={styles.warningText}>این حساب اجازه تغییر تنظیمات افزونه را ندارد؛ مدیریت گفتگوها همچنان فعال است.</Text>
          </View>
        ) : settings ? (
          <>
            <Section title="وضعیت سرویس" icon="power-outline">
              <ToggleRow title="فعال بودن ویجت" description="نمایش ویجت کانکت پرو در سایت" value={!!settings.enabled} onChange={(value) => patch('enabled', value ? 1 : 0)} color={theme.primary} />
              <ToggleRow title="گفت‌وگوی آنلاین" description="فعال بودن صندوق گفت‌وگو برای کاربران" value={!!settings.chat_enabled} onChange={(value) => patch('chat_enabled', value ? 1 : 0)} color={theme.primary} />
              <ToggleRow title="دستیار هوشمند" description="پاسخ‌گویی هوش مصنوعی طبق تنظیمات سایت" value={!!settings.ai_enabled} onChange={(value) => patch('ai_enabled', value ? 1 : 0)} color={theme.primary} />
              <ToggleRow title="پرسش‌های متداول" description="نمایش بخش FAQ داخل ویجت" value={!!settings.faq_enabled} onChange={(value) => patch('faq_enabled', value ? 1 : 0)} color={theme.primary} />
            </Section>

            <Section title="حالت پاسخ‌گویی" icon="git-merge-outline">
              <View style={styles.segmentRow}>
                {[
                  { key: 'human', label: 'انسانی' },
                  { key: 'hybrid', label: 'ترکیبی' },
                  { key: 'ai', label: 'هوشمند' },
                ].map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => patch('chat_mode', item.key as PluginSettings['chat_mode'])}
                    style={[styles.segment, settings.chat_mode === item.key && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  >
                    <Text style={[styles.segmentText, settings.chat_mode === item.key && { color: '#FFFFFF' }]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Section>

            <Section title="اعلان‌های ایمیلی" icon="mail-outline">
              <ToggleRow title="فعال بودن اعلان ایمیلی" value={!!settings.chat_email_enabled} onChange={(value) => patch('chat_email_enabled', value ? 1 : 0)} color={theme.primary} />
              <ToggleRow title="پیام جدید برای مدیر" value={!!settings.chat_email_admin_new_message} onChange={(value) => patch('chat_email_admin_new_message', value ? 1 : 0)} color={theme.primary} />
              <ToggleRow title="درخواست ارجاع به کارشناس" value={!!settings.chat_email_admin_handoff} onChange={(value) => patch('chat_email_admin_handoff', value ? 1 : 0)} color={theme.primary} />
              <ToggleRow title="پاسخ جدید برای مشتری" value={!!settings.chat_email_visitor_new_reply} onChange={(value) => patch('chat_email_visitor_new_reply', value ? 1 : 0)} color={theme.primary} />
            </Section>

            <Section title="متن‌های اصلی" icon="text-outline">
              <Field label="عنوان هدر" value={settings.header_title} onChange={(value) => patch('header_title', value)} />
              <Field label="زیرعنوان هدر" value={settings.header_subtitle} onChange={(value) => patch('header_subtitle', value)} multiline />
              <Field label="عنوان گفت‌وگو" value={settings.chat_title} onChange={(value) => patch('chat_title', value)} />
              <Field label="متن خوش‌آمدگویی" value={settings.chat_welcome_message} onChange={(value) => patch('chat_welcome_message', value)} multiline />
              <Field label="متن داخل کادر پیام" value={settings.chat_placeholder} onChange={(value) => patch('chat_placeholder', value)} />
            </Section>

            <Section title="رنگ‌بندی یکپارچه" icon="color-palette-outline">
              <Text style={styles.colorHelp}>رنگ‌های زیر هم در ویجت سایت و هم در اپ استفاده می‌شوند.</Text>
              <ColorField label="رنگ اصلی" value={settings.primary_color} onChange={(value) => patch('primary_color', value)} />
              <ColorField label="رنگ مکمل" value={settings.accent_color} onChange={(value) => patch('accent_color', value)} />
              <ColorField label="شروع گرادیان هدر" value={settings.header_bg_start} onChange={(value) => patch('header_bg_start', value)} />
              <ColorField label="پایان گرادیان هدر" value={settings.header_bg_end} onChange={(value) => patch('header_bg_end', value)} />
            </Section>

            <Section title="کارشناسان" icon="people-outline">
              {agents.map((agent) => (
                <View key={agent.index} style={styles.agentRow}>
                  <View style={[styles.agentAvatar, { backgroundColor: `${theme.primary}18` }]}>
                    <Text style={[styles.agentInitial, { color: theme.primary }]}>{agent.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <Text style={styles.agentMeta}>{agent.title || departmentLabel(agent.department)}</Text>
                  </View>
                  <Switch value={agent.active} onValueChange={(value) => toggleAgent(agent, value)} trackColor={{ false: '#CDD8D4', true: `${theme.primary}88` }} thumbColor={agent.active ? theme.primary : '#FFFFFF'} />
                </View>
              ))}
            </Section>

            <Pressable onPress={save} disabled={saving} style={[styles.saveButton, { backgroundColor: theme.primary }]}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="save-outline" size={21} color="#FFFFFF" />}
              <Text style={styles.saveText}>{saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}</Text>
            </Pressable>
          </>
        ) : null}

        <Pressable onPress={confirmLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#B42318" />
          <Text style={styles.logoutText}>قطع اتصال این دستگاه</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={20} color="#35514A" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ToggleRow({ title, description, value, onChange, color }: { title: string; description?: string; value: boolean; onChange: (value: boolean) => void; color: string }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {description ? <Text style={styles.toggleDescription}>{description}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: '#CED8D5', true: `${color}88` }} thumbColor={value ? color : '#FFFFFF'} />
    </View>
  );
}

function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} multiline={multiline} style={[styles.field, multiline && { minHeight: 78, textAlignVertical: 'top' }]} textAlign="right" />
    </View>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const valid = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <View style={styles.colorRow}>
      <View style={[styles.colorPreview, { backgroundColor: valid ? value : '#D8E1DE' }]} />
      <Text style={styles.colorLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} autoCapitalize="characters" style={styles.colorInput} textAlign="left" maxLength={7} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 24, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', textAlign: 'right' },
  headerSubtitle: { color: '#D9F8EE', fontSize: 11.5, marginTop: 5, textAlign: 'right' },
  content: { padding: 14, paddingBottom: 36 },
  accountCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 19, padding: 14, borderWidth: 1, borderColor: '#E6EEEB' },
  userAvatar: { width: 47, height: 47, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  userName: { color: '#203831', fontSize: 14, fontWeight: '900', textAlign: 'right' },
  userMeta: { color: '#7B8B86', fontSize: 9.8, marginTop: 4, textAlign: 'right' },
  warningBox: { flexDirection: 'row-reverse', gap: 10, alignItems: 'center', backgroundColor: '#FFF8E8', borderRadius: 16, padding: 14, marginTop: 12 },
  warningText: { flex: 1, color: '#805018', fontSize: 11.5, lineHeight: 20, textAlign: 'right' },
  section: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 15, marginTop: 12, borderWidth: 1, borderColor: '#E6EEEB' },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 9 },
  sectionTitle: { color: '#233B34', fontSize: 14, fontWeight: '900' },
  toggleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#EEF3F1' },
  toggleTitle: { color: '#304840', fontSize: 12.5, fontWeight: '800', textAlign: 'right' },
  toggleDescription: { color: '#81908C', fontSize: 9.8, marginTop: 3, textAlign: 'right' },
  segmentRow: { flexDirection: 'row-reverse', gap: 7, marginTop: 4 },
  segment: { flex: 1, borderWidth: 1, borderColor: '#DCE6E2', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  segmentText: { color: '#667872', fontSize: 10.5, fontWeight: '800' },
  fieldWrap: { marginTop: 10 },
  fieldLabel: { color: '#687A74', fontSize: 10.5, fontWeight: '700', marginBottom: 6, textAlign: 'right' },
  field: { minHeight: 46, borderWidth: 1, borderColor: '#DDE6E3', borderRadius: 12, backgroundColor: '#FAFBFB', paddingHorizontal: 12, paddingVertical: 10, color: '#243B34', fontSize: 12 },
  colorHelp: { color: '#7C8C87', fontSize: 10.5, lineHeight: 18, textAlign: 'right', marginBottom: 4 },
  colorRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EEF3F1' },
  colorPreview: { width: 34, height: 34, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 5, elevation: 2 },
  colorLabel: { flex: 1, color: '#3A5049', fontSize: 11.5, fontWeight: '700', textAlign: 'right' },
  colorInput: { width: 92, height: 38, borderWidth: 1, borderColor: '#DCE5E2', borderRadius: 10, paddingHorizontal: 10, color: '#304840', fontSize: 11 },
  agentRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9, paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#EEF3F1' },
  agentAvatar: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  agentInitial: { fontSize: 16, fontWeight: '900' },
  agentName: { color: '#304840', fontSize: 12.5, fontWeight: '800', textAlign: 'right' },
  agentMeta: { color: '#82918C', fontSize: 9.5, marginTop: 3, textAlign: 'right' },
  saveButton: { marginTop: 14, height: 54, borderRadius: 15, flexDirection: 'row-reverse', gap: 8, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '900' },
  logoutButton: { marginTop: 12, height: 50, borderRadius: 14, backgroundColor: '#FEF2F1', flexDirection: 'row-reverse', gap: 8, alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#B42318', fontSize: 12, fontWeight: '900' },
});
