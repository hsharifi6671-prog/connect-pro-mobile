import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

export function LoginScreen() {
  const { login, theme } = useAuth();
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!siteUrl.trim() || !username.trim() || !appPassword.trim()) {
      setError('آدرس سایت، نام کاربری و رمز برنامه را وارد کنید.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({ siteUrl, username, appPassword });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'اتصال به سایت انجام نشد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[theme.header_start, theme.header_end]} style={styles.background}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.brand}>
              <View style={styles.logo}>
                <Ionicons name="headset" size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>کانکت پرو</Text>
              <Text style={styles.subtitle}>مدیریت گفتگوهای سایت از موبایل</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>اتصال به وردپرس</Text>
              <Text style={styles.help}>
                در پروفایل کاربری وردپرس، بخش «رمزهای برنامه»، یک رمز با نام Connect Pro Mobile بسازید و در اینجا وارد کنید.
              </Text>

              <Text style={styles.label}>آدرس سایت</Text>
              <TextInput
                value={siteUrl}
                onChangeText={setSiteUrl}
                placeholder="https://example.com"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                textAlign="left"
              />

              <Text style={styles.label}>نام کاربری وردپرس</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                textAlign="left"
              />

              <Text style={styles.label}>رمز برنامه</Text>
              <TextInput
                value={appPassword}
                onChangeText={setAppPassword}
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                textAlign="left"
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={20} color="#B42318" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable onPress={submit} disabled={loading} style={[styles.button, { backgroundColor: theme.primary }]}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="link-outline" size={21} color="#FFFFFF" />}
                <Text style={styles.buttonText}>{loading ? 'در حال اتصال…' : 'اتصال امن به سایت'}</Text>
              </Pressable>

              <View style={styles.securityNote}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
                <Text style={styles.securityText}>اطلاعات ورود فقط در فضای امن دستگاه ذخیره می‌شود و اتصال باید روی HTTPS باشد.</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  background: { flex: 1 },
  safe: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 22, paddingBottom: 42 },
  brand: { alignItems: 'center', marginBottom: 22 },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,.65)',
    backgroundColor: 'rgba(255,255,255,.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 14 },
  subtitle: { color: '#E4FFF7', fontSize: 14, marginTop: 5 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 24, elevation: 8 },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#10231F', textAlign: 'right' },
  help: { fontSize: 12.5, lineHeight: 22, color: '#62736E', marginTop: 8, marginBottom: 18, textAlign: 'right' },
  label: { fontSize: 12, fontWeight: '800', color: '#344943', marginBottom: 7, marginTop: 10, textAlign: 'right' },
  input: { height: 52, borderWidth: 1, borderColor: '#D7E2DE', borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#F9FBFA', color: '#10231F', fontSize: 14 },
  errorBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 11, borderRadius: 12, backgroundColor: '#FEF3F2', marginTop: 14 },
  errorText: { flex: 1, color: '#B42318', lineHeight: 20, textAlign: 'right', fontSize: 12 },
  button: { height: 54, borderRadius: 15, marginTop: 18, flexDirection: 'row-reverse', gap: 9, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  securityNote: { flexDirection: 'row-reverse', gap: 8, alignItems: 'center', marginTop: 15 },
  securityText: { flex: 1, fontSize: 11.5, lineHeight: 19, color: '#657771', textAlign: 'right' },
});
