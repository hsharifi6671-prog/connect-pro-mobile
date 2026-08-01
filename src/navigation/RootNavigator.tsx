import React from 'react';
import { I18nManager, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { ConversationsScreen } from '../screens/ConversationsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { MainTabsParamList, RootStackParamList } from '../types';
import { navigationRef } from './navigationRef';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabsParamList>();

function MainTabs() {
  const { theme } = useAuth();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: '#7B8B87',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', paddingBottom: 4 },
        tabBarStyle: { height: 66, paddingTop: 7, borderTopColor: '#E4ECE9', backgroundColor: '#FFFFFF' },
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'Conversations'
              ? 'chatbubbles-outline'
              : route.name === 'Dashboard'
                ? 'stats-chart-outline'
                : 'settings-outline';
          return <Ionicons name={name as any} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="Conversations" component={ConversationsScreen} options={{ title: 'گفتگوها' }} />
      <Tabs.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'گزارش‌ها' }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ title: 'تنظیمات' }} />
    </Tabs.Navigator>
  );
}

function LoadingScreen() {
  const { theme } = useAuth();
  return (
    <LinearGradient colors={[theme.header_start, theme.header_end]} style={styles.loading}>
      <View style={styles.logoCircle}>
        <Ionicons name="headset" size={58} color="#FFFFFF" />
      </View>
      <Text style={styles.loadingTitle}>کانکت پرو</Text>
      <ActivityIndicator color="#FFFFFF" size="large" style={{ marginTop: 24 }} />
    </LinearGradient>
  );
}

export function RootNavigator() {
  const { loading, connection, theme } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!connection) return <LoginScreen />;

  const navTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, primary: theme.primary, background: theme.background, card: theme.surface },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: 'گفتگو', headerBackTitle: 'بازگشت', headerTitleAlign: 'center' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoCircle: {
    width: 124,
    height: 124,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,.7)',
    backgroundColor: 'rgba(255,255,255,.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 22 },
});
