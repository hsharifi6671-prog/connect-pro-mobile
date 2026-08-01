import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { openConversationFromNotification } from './src/navigation/navigationRef';

function NotificationBridge() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const id = Number(response.notification.request.content.data?.conversation_id || 0);
      if (id) setTimeout(() => openConversationFromNotification(id), 250);
    });
    return () => subscription.remove();
  }, []);
  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <NotificationBridge />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
