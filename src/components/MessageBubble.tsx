import React, { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import type { Message, ThemeTokens } from '../types';
import { formatDuration } from '../utils/format';

export function MessageBubble({
  message,
  theme,
  onReply,
}: {
  message: Message;
  theme: ThemeTokens;
  onReply: (message: Message) => void;
}) {
  const isAgent = message.sender === 'agent';
  const isCenter = message.sender === 'system' || message.sender === 'ai';
  const [playing, setPlaying] = useState(false);

  const playAudio = async () => {
    if (!message.media?.url || playing) return;
    setPlaying(true);
    try {
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: message.media.url }, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync().catch(() => undefined);
        }
      });
    } catch {
      setPlaying(false);
    }
  };

  if (isCenter) {
    return (
      <View style={styles.centerWrap}>
        <View style={[styles.centerBubble, message.sender === 'ai' && { backgroundColor: '#EEF7FF' }]}>
          <Ionicons name={message.sender === 'ai' ? 'sparkles-outline' : 'information-circle-outline'} size={15} color="#60736D" />
          <Text style={styles.centerText}>{message.body}</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable onLongPress={() => onReply(message)} style={[styles.row, isAgent ? styles.agentRow : styles.visitorRow]}>
      <View style={[styles.bubble, isAgent ? { backgroundColor: theme.primary, borderBottomRightRadius: 5 } : styles.visitorBubble]}>
        {message.reply ? (
          <View style={[styles.replyBox, isAgent ? styles.replyAgent : styles.replyVisitor]}>
            <Text numberOfLines={1} style={[styles.replyText, isAgent && { color: '#E6FFF7' }]}>{message.reply.text}</Text>
          </View>
        ) : null}

        {message.kind === 'image' && message.media?.url ? (
          <Pressable onPress={() => Linking.openURL(message.media!.url)}>
            <Image source={{ uri: message.media.url }} style={styles.image} resizeMode="cover" />
          </Pressable>
        ) : null}

        {message.kind === 'audio' && message.media?.url ? (
          <Pressable onPress={playAudio} style={styles.audioRow}>
            <Ionicons name={playing ? 'pause-circle' : 'play-circle'} size={36} color={isAgent ? '#FFFFFF' : theme.primary} />
            <View style={styles.audioLine}>
              <View style={[styles.audioProgress, { backgroundColor: isAgent ? 'rgba(255,255,255,.75)' : theme.accent }]} />
            </View>
            <Text style={[styles.duration, isAgent && { color: '#E6FFF7' }]}>{formatDuration(message.media.duration)}</Text>
          </Pressable>
        ) : null}

        {message.kind === 'document' && message.media?.url ? (
          <Pressable onPress={() => Linking.openURL(message.media!.url)} style={styles.documentRow}>
            <View style={[styles.documentIcon, { backgroundColor: isAgent ? 'rgba(255,255,255,.16)' : '#E7F5F0' }]}>
              <Ionicons name="document-text-outline" size={24} color={isAgent ? '#FFFFFF' : theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[styles.documentName, isAgent && { color: '#FFFFFF' }]}>{message.media.name || 'فایل پیوست'}</Text>
              <Text style={[styles.documentHint, isAgent && { color: '#D9F8EF' }]}>برای مشاهده لمس کنید</Text>
            </View>
          </Pressable>
        ) : null}

        {message.kind === 'text' ? <Text style={[styles.body, isAgent && { color: '#FFFFFF' }]}>{message.body}</Text> : null}
        <View style={styles.footer}>
          {isAgent && message.agent_name ? <Text style={styles.agentName}>{message.agent_name}</Text> : null}
          <Text style={[styles.time, isAgent && { color: '#CDEFE5' }]}>{new Date(message.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, marginVertical: 4 },
  agentRow: { alignItems: 'flex-end' },
  visitorRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '84%', minWidth: 84, borderRadius: 18, padding: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 7, elevation: 1 },
  visitorBubble: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5ECE9', borderBottomLeftRadius: 5 },
  body: { color: '#243832', fontSize: 13.5, lineHeight: 23, textAlign: 'right' },
  footer: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 5 },
  time: { fontSize: 9.5, color: '#82928D' },
  agentName: { fontSize: 9.5, color: '#E6FFF7', fontWeight: '700' },
  replyBox: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, marginBottom: 7, borderRightWidth: 3 },
  replyAgent: { backgroundColor: 'rgba(255,255,255,.12)', borderRightColor: '#FFFFFF' },
  replyVisitor: { backgroundColor: '#F0F5F3', borderRightColor: '#17B897' },
  replyText: { fontSize: 10.5, color: '#60736D', textAlign: 'right' },
  image: { width: 230, height: 180, borderRadius: 13, backgroundColor: '#E8EFEC' },
  audioRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, minWidth: 220 },
  audioLine: { flex: 1, height: 4, borderRadius: 4, backgroundColor: 'rgba(127,143,138,.25)', overflow: 'hidden' },
  audioProgress: { width: '62%', height: '100%', borderRadius: 4 },
  duration: { fontSize: 10, color: '#6D817A' },
  documentRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9, minWidth: 220 },
  documentIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  documentName: { color: '#243832', fontSize: 12.5, fontWeight: '800', textAlign: 'right' },
  documentHint: { color: '#7C8C87', fontSize: 9.5, textAlign: 'right', marginTop: 3 },
  centerWrap: { alignItems: 'center', paddingHorizontal: 32, marginVertical: 7 },
  centerBubble: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#EEF3F1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  centerText: { color: '#60736D', fontSize: 10.5, lineHeight: 17, textAlign: 'center' },
});
