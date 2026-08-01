import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function openConversationFromNotification(conversationId: number) {
  if (!conversationId || !navigationRef.isReady()) return;
  navigationRef.navigate('Chat', { conversationId });
}
