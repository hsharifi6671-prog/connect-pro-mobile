import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { ApiClient } from '../api/client';
import type { BootstrapData, Connection, ThemeTokens } from '../types';

const STORAGE_KEY = 'connect_pro_connection_v1';
const PUSH_TOKEN_KEY = 'connect_pro_push_token_v1';

const fallbackTheme: ThemeTokens = {
  app_name: 'کانکت پرو',
  primary: '#0C5849',
  accent: '#17B897',
  header_start: '#0C5849',
  header_end: '#17B897',
  surface: '#FFFFFF',
  background: '#F4F7F8',
  text: '#10231F',
  muted: '#64748B',
};

type AuthValue = {
  loading: boolean;
  connection: Connection | null;
  bootstrap: BootstrapData | null;
  client: ApiClient | null;
  theme: ThemeTokens;
  login: (connection: Connection) => Promise<void>;
  logout: () => Promise<void>;
  refreshBootstrap: () => Promise<void>;
  setTheme: (theme: ThemeTokens) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPush(client: ApiClient): Promise<void> {
  if (!Device.isDevice) return;

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('connect-pro-messages', {
      name: 'پیام‌های کانکت پرو',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#17B897',
      sound: 'default',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    (Constants.easConfig as { projectId?: string } | null)?.projectId;
  if (!projectId) return;

  const result = await Notifications.getExpoPushTokenAsync({ projectId });
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, result.data);
  await client.registerDevice(result.data, Platform.OS, Device.deviceName || 'Connect Pro Mobile');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [theme, setTheme] = useState<ThemeTokens>(fallbackTheme);

  const client = useMemo(() => (connection ? new ApiClient(connection) : null), [connection]);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Connection;
      const api = new ApiClient(saved);
      const data = await api.getBootstrap();
      setConnection(saved);
      setBootstrap(data);
      setTheme(data.theme || fallbackTheme);
      registerForPush(api).catch(() => undefined);
    } catch {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      setConnection(null);
      setBootstrap(null);
      setTheme(fallbackTheme);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restore();
  }, [restore]);

  const login = useCallback(async (nextConnection: Connection) => {
    const api = new ApiClient(nextConnection);
    const data = await api.getBootstrap();
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(api.connection));
    setConnection(api.connection);
    setBootstrap(data);
    setTheme(data.theme || fallbackTheme);
    registerForPush(api).catch(() => undefined);
  }, []);

  const logout = useCallback(async () => {
    if (client) {
      const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
      if (token) {
        await client.removeDevice(token).catch(() => undefined);
      }
    }
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
    setConnection(null);
    setBootstrap(null);
    setTheme(fallbackTheme);
  }, [client]);

  const refreshBootstrap = useCallback(async () => {
    if (!client) return;
    const data = await client.getBootstrap();
    setBootstrap(data);
    setTheme(data.theme || fallbackTheme);
  }, [client]);

  const value = useMemo<AuthValue>(
    () => ({ loading, connection, bootstrap, client, theme, login, logout, refreshBootstrap, setTheme }),
    [loading, connection, bootstrap, client, theme, login, logout, refreshBootstrap],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
