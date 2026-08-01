import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Conversation, ThemeTokens } from '../types';
import { departmentLabel, messageKindLabel, statusLabel } from '../utils/format';

export function ConversationRow({
  item,
  theme,
  onPress,
}: {
  item: Conversation;
  theme: ThemeTokens;
  onPress: () => void;
}) {
  const initial = (item.name || 'ک').trim().charAt(0);
  const preview = item.last_message_kind !== 'text' ? messageKindLabel(item.last_message_kind) : item.last_message;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && { opacity: 0.75 }]}>
      <View style={[styles.avatar, { backgroundColor: item.unread ? theme.primary : '#DDE8E4' }]}>
        <Text style={[styles.avatarText, { color: item.unread ? '#FFFFFF' : theme.primary }]}>{initial}</Text>
        {item.unread ? <View style={[styles.onlineDot, { backgroundColor: theme.accent }]} /> : null}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={[styles.name, item.unread && { fontWeight: '900' }]}>{item.name}</Text>
          <Text style={styles.time}>{item.updated_label}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text numberOfLines={1} style={[styles.preview, item.unread && { color: '#273B35', fontWeight: '700' }]}>
            {preview || 'گفتگوی جدید'}
          </Text>
          {item.unread ? <View style={[styles.unread, { backgroundColor: theme.primary }]} /> : null}
        </View>
        <View style={styles.metaRow}>
          <View style={[styles.chip, { backgroundColor: item.status === 'closed' ? '#EEF2F1' : item.status === 'pending' ? '#FFF7E8' : '#E9F8F3' }]}>
            <Text style={[styles.chipText, { color: item.status === 'pending' ? '#A15C00' : item.status === 'closed' ? '#667872' : theme.primary }]}>{statusLabel(item.status)}</Text>
          </View>
          <Text style={styles.metaText}>{item.assigned_agent_name || departmentLabel(item.assigned_department)}</Text>
          {item.conversion_intent ? <Ionicons name="cart-outline" size={14} color="#A15C00" /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EDF2F0' },
  avatar: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginLeft: 12, position: 'relative' },
  avatarText: { fontSize: 20, fontWeight: '900' },
  onlineDot: { position: 'absolute', width: 13, height: 13, borderRadius: 7, bottom: -1, left: -1, borderWidth: 2, borderColor: '#FFFFFF' },
  body: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  name: { flex: 1, color: '#10231F', fontSize: 14.5, fontWeight: '800', textAlign: 'right' },
  time: { color: '#8B9995', fontSize: 10.5 },
  previewRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginTop: 4 },
  preview: { flex: 1, color: '#71817C', fontSize: 12, textAlign: 'right' },
  unread: { width: 8, height: 8, borderRadius: 4 },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginTop: 7 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  chipText: { fontSize: 9.5, fontWeight: '900' },
  metaText: { fontSize: 10.5, color: '#81908C' },
});
