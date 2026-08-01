import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
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
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { MessageBubble } from '../components/MessageBubble';
import type { Conversation, Message, RootStackParamList } from '../types';
import { departmentLabel, statusLabel } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

type FilterOption = { key: string; label: string };

export function ChatScreen({ route, navigation }: Props) {
  const { client, theme, bootstrap } = useAuth();
  const id = route.params.conversationId;
  const [conversation, setConversation] = useState<Conversation | null>(route.params.initial || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const listRef = useRef<FlatList<Message>>(null);
  const recordTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const lastId = useMemo(() => messages.length ? Math.max(...messages.map((item) => item.id)) : 0, [messages]);

  const load = useCallback(async () => {
    if (!client) return;
    try {
      const data = await client.getConversation(id);
      setConversation(data.conversation);
      setMessages(data.messages);
      navigation.setOptions({
        title: data.conversation.name || 'گفتگو',
        headerRight: () => (
          <Pressable onPress={() => setManageOpen(true)} style={{ padding: 7 }}>
            <Ionicons name="ellipsis-vertical" size={21} color={theme.primary} />
          </Pressable>
        ),
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (e) {
      Alert.alert('خطا', e instanceof Error ? e.message : 'دریافت گفتگو انجام نشد.');
    } finally {
      setLoading(false);
    }
  }, [client, id, navigation, theme.primary]);

  useEffect(() => {
    load();
    client?.getFilters().then((data) => {
      setFilters(Object.entries(data.agent_filters).map(([key, label]) => ({ key, label })));
    }).catch(() => undefined);
  }, [load, client]);

  useEffect(() => {
    if (!client || loading) return;
    const timer = setInterval(async () => {
      try {
        const data = await client.getMessages(id, lastId);
        if (data.messages.length) {
          setMessages((current) => {
            const known = new Set(current.map((item) => item.id));
            return [...current, ...data.messages.filter((item) => !known.has(item.id))];
          });
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
        }
      } catch {
        // Silent polling failure. The next cycle retries automatically.
      }
    }, Math.max(3000, (bootstrap?.limits ? 4 : 5) * 1000));
    return () => clearInterval(timer);
  }, [client, id, lastId, loading, bootstrap]);

  useEffect(() => () => {
    if (recordTimer.current) clearInterval(recordTimer.current);
    if (recording) recording.stopAndUnloadAsync().catch(() => undefined);
  }, [recording]);

  const appendMessage = (next: Message, nextConversation?: Conversation) => {
    setMessages((current) => current.some((item) => item.id === next.id) ? current : [...current, next]);
    if (nextConversation) setConversation(nextConversation);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
  };

  const send = async () => {
    const body = message.trim();
    if (!client || !body || sending) return;
    setSending(true);
    try {
      const data = await client.sendMessage(id, body, replyTo?.id || 0);
      appendMessage(data.message, data.conversation);
      setMessage('');
      setReplyTo(null);
    } catch (e) {
      Alert.alert('ارسال نشد', e instanceof Error ? e.message : 'ارسال پیام انجام نشد.');
    } finally {
      setSending(false);
    }
  };

  const upload = async (
    file: { uri: string; name: string; type: string },
    kind: 'image' | 'audio' | 'document',
    duration = 0,
  ) => {
    if (!client || uploading) return;
    setUploading(true);
    setAttachOpen(false);
    try {
      const data = await client.uploadMedia(id, file, kind, duration, replyTo?.id || 0);
      appendMessage(data.message, data.conversation);
      setReplyTo(null);
    } catch (e) {
      Alert.alert('بارگذاری نشد', e instanceof Error ? e.message : 'ارسال فایل انجام نشد.');
    } finally {
      setUploading(false);
    }
  };

  const chooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('دسترسی لازم است', 'برای انتخاب تصویر، دسترسی گالری را فعال کنید.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await upload({ uri: asset.uri, name: asset.fileName || `image-${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' }, 'image');
  };

  const chooseDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await upload({ uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' }, 'document');
  };

  const startRecording = async () => {
    setAttachOpen(false);
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('دسترسی لازم است', 'برای ضبط پیام صوتی، دسترسی میکروفن را فعال کنید.');
      return;
    }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const created = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(created.recording);
      setRecordSeconds(0);
      recordTimer.current = setInterval(() => setRecordSeconds((value) => value + 1), 1000);
    } catch {
      Alert.alert('خطا', 'شروع ضبط صدا انجام نشد.');
    }
  };

  const stopRecording = async (cancel = false) => {
    if (!recording) return;
    if (recordTimer.current) clearInterval(recordTimer.current);
    recordTimer.current = null;
    const current = recording;
    setRecording(null);
    try {
      await current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = current.getURI();
      if (!cancel && uri) {
        await upload({ uri, name: `voice-${Date.now()}.m4a`, type: 'audio/m4a' }, 'audio', recordSeconds);
      }
    } catch {
      if (!cancel) Alert.alert('خطا', 'ذخیره پیام صوتی انجام نشد.');
    } finally {
      setRecordSeconds(0);
    }
  };

  const patchConversation = async (patch: Record<string, unknown>) => {
    if (!client) return;
    try {
      const data = await client.updateConversation(id, patch);
      setConversation(data.conversation);
      setManageOpen(false);
    } catch (e) {
      Alert.alert('بروزرسانی نشد', e instanceof Error ? e.message : 'تغییرات ذخیره نشد.');
    }
  };

  const assign = (key: string) => {
    if (key.startsWith('agent:')) patchConversation({ agent_key: key.slice(6) });
    else if (key.startsWith('department:')) patchConversation({ agent_key: '', department: key.slice(11) });
    else if (key === 'unassigned') patchConversation({ agent_key: '', department: '' });
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {conversation ? (
          <Pressable onPress={() => setManageOpen(true)} style={styles.infoBar}>
            <View style={[styles.avatar, { backgroundColor: `${theme.primary}18` }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>{conversation.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoName}>{conversation.name}</Text>
              <Text style={styles.infoMeta}>{conversation.phone || conversation.email || conversation.scenario_title || 'کاربر سایت'}</Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: conversation.status === 'pending' ? '#FFF4DB' : conversation.status === 'closed' ? '#EDF1F0' : '#E4F6F0' }]}>
              <Text style={[styles.statusText, { color: conversation.status === 'pending' ? '#9C5B00' : conversation.status === 'closed' ? '#657771' : theme.primary }]}>{statusLabel(conversation.status)}</Text>
            </View>
          </Pressable>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <MessageBubble message={item} theme={theme} onReply={setReplyTo} />}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={conversation?.form_data?.length ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{conversation.form_title || 'اطلاعات ثبت‌شده'}</Text>
              {conversation.form_data.map((item) => (
                <Pressable key={item.key} onPress={() => item.url && Linking.openURL(item.url)} style={styles.formRow}>
                  <Text style={styles.formLabel}>{item.label}</Text>
                  <Text numberOfLines={2} style={[styles.formValue, item.url && { color: theme.primary }]}>{item.value}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        />

        {replyTo ? (
          <View style={styles.replyComposer}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.replyComposerTitle, { color: theme.primary }]}>پاسخ به پیام</Text>
              <Text numberOfLines={1} style={styles.replyComposerText}>{replyTo.kind === 'text' ? replyTo.body : replyTo.kind === 'image' ? 'تصویر' : replyTo.kind === 'audio' ? 'پیام صوتی' : 'فایل پیوست'}</Text>
            </View>
            <Pressable onPress={() => setReplyTo(null)}><Ionicons name="close-circle" size={23} color="#7D8D88" /></Pressable>
          </View>
        ) : null}

        {recording ? (
          <View style={styles.recordingBar}>
            <Pressable onPress={() => stopRecording(true)} style={styles.recordCancel}><Ionicons name="trash-outline" size={21} color="#B42318" /></Pressable>
            <View style={styles.recordCenter}><View style={styles.recordDot} /><Text style={styles.recordText}>در حال ضبط · {recordSeconds} ثانیه</Text></View>
            <Pressable onPress={() => stopRecording(false)} style={[styles.recordSend, { backgroundColor: theme.primary }]}><Ionicons name="send" size={19} color="#FFFFFF" /></Pressable>
          </View>
        ) : (
          <View style={styles.composer}>
            <Pressable onPress={() => setAttachOpen(true)} disabled={uploading} style={styles.attachButton}>
              {uploading ? <ActivityIndicator size="small" color={theme.primary} /> : <Ionicons name="add" size={27} color={theme.primary} />}
            </Pressable>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="پیام خود را بنویسید…"
              placeholderTextColor="#8A9994"
              style={styles.input}
              multiline
              textAlign="right"
              maxLength={bootstrap?.limits.message_chars || 2000}
            />
            <Pressable onPress={send} disabled={!message.trim() || sending} style={[styles.sendButton, { backgroundColor: message.trim() ? theme.primary : '#C7D2CE' }]}>
              {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={19} color="#FFFFFF" />}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal transparent visible={attachOpen} animationType="fade" onRequestClose={() => setAttachOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAttachOpen(false)}>
          <Pressable style={styles.actionSheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>ارسال پیوست</Text>
            <SheetAction icon="image-outline" title="انتخاب تصویر" color="#2775B6" onPress={chooseImage} />
            <SheetAction icon="document-text-outline" title="ارسال فایل PDF یا Word" color="#8A4EB8" onPress={chooseDocument} />
            <SheetAction icon="mic-outline" title="ضبط پیام صوتی" color={theme.primary} onPress={startRecording} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={manageOpen} animationType="slide" onRequestClose={() => setManageOpen(false)}>
        <View style={styles.modalBackdropBottom}>
          <View style={styles.manageSheet}>
            <View style={styles.sheetHandle} />
            <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
              <Text style={styles.manageTitle}>مدیریت گفتگو</Text>
              <Text style={styles.manageLabel}>وضعیت گفتگو</Text>
              <View style={styles.statusActions}>
                {(['open', 'pending', 'closed'] as const).map((status) => (
                  <Pressable key={status} onPress={() => patchConversation({ status })} style={[styles.statusAction, conversation?.status === status && { borderColor: theme.primary, backgroundColor: `${theme.primary}0D` }]}>
                    <Text style={[styles.statusActionText, conversation?.status === status && { color: theme.primary }]}>{statusLabel(status)}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.manageLabel}>شیوه پاسخ‌گویی</Text>
              <View style={styles.statusActions}>
                {[
                  { key: 'human', label: 'انسانی' },
                  { key: 'hybrid', label: 'ترکیبی' },
                  { key: 'ai', label: 'هوشمند' },
                ].map((item) => (
                  <Pressable key={item.key} onPress={() => patchConversation({ channel: item.key })} style={[styles.statusAction, conversation?.channel === item.key && { borderColor: theme.primary, backgroundColor: `${theme.primary}0D` }]}>
                    <Text style={[styles.statusActionText, conversation?.channel === item.key && { color: theme.primary }]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.manageLabel}>تخصیص به کارشناس یا واحد</Text>
              {filters.filter((item) => item.key).map((item) => (
                <Pressable key={item.key} onPress={() => assign(item.key)} style={styles.assignRow}>
                  <Ionicons name={item.key.startsWith('agent:') ? 'person-outline' : item.key.startsWith('department:') ? 'people-outline' : 'remove-circle-outline'} size={20} color={theme.primary} />
                  <Text style={styles.assignText}>{item.label}</Text>
                  <Ionicons name="chevron-back" size={18} color="#9AA7A3" />
                </Pressable>
              ))}

              {conversation?.page_url ? (
                <Pressable onPress={() => Linking.openURL(conversation.page_url)} style={[styles.pageButton, { borderColor: theme.primary }]}>
                  <Ionicons name="open-outline" size={20} color={theme.primary} />
                  <Text style={[styles.pageButtonText, { color: theme.primary }]}>بازکردن صفحه شروع گفتگو</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setManageOpen(false)} style={styles.closeSheet}><Text style={styles.closeSheetText}>بستن</Text></Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SheetAction({ icon, title, color, onPress }: { icon: string; title: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.sheetAction}>
      <View style={[styles.sheetIcon, { backgroundColor: `${color}18` }]}><Ionicons name={icon as any} size={23} color={color} /></View>
      <Text style={styles.sheetActionText}>{title}</Text>
      <Ionicons name="chevron-back" size={19} color="#9BA8A4" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  infoBar: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5ECE9' },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 9 },
  avatarText: { fontSize: 16, fontWeight: '900' },
  infoName: { color: '#203831', fontWeight: '900', fontSize: 13, textAlign: 'right' },
  infoMeta: { color: '#7D8D88', fontSize: 9.8, marginTop: 3, textAlign: 'right' },
  statusChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 9.5, fontWeight: '900' },
  messages: { paddingVertical: 12, flexGrow: 1 },
  formCard: { marginHorizontal: 13, marginBottom: 12, padding: 12, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4ECE9' },
  formTitle: { color: '#233B34', fontSize: 12.5, fontWeight: '900', textAlign: 'right', marginBottom: 7 },
  formRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 14, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#F0F4F2' },
  formLabel: { color: '#7A8B86', fontSize: 10.5 },
  formValue: { flex: 1, color: '#334A43', fontSize: 10.5, fontWeight: '700', textAlign: 'left' },
  replyComposer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: '#F4F8F6', borderTopWidth: 1, borderTopColor: '#DDE7E3' },
  replyComposerTitle: { fontSize: 10.5, fontWeight: '900', textAlign: 'right' },
  replyComposerText: { color: '#74847F', fontSize: 10, marginTop: 2, textAlign: 'right' },
  composer: { flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 8, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#DEE7E4' },
  attachButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EDF5F2', alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 42, maxHeight: 110, borderRadius: 15, backgroundColor: '#F4F7F6', paddingHorizontal: 13, paddingVertical: 10, color: '#203831', fontSize: 13 },
  sendButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  recordingBar: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#DEE7E4' },
  recordCancel: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FEF1F0', alignItems: 'center', justifyContent: 'center' },
  recordCenter: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  recordDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#D92D20' },
  recordText: { color: '#4B5F58', fontSize: 12, fontWeight: '700' },
  recordSend: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(12,28,23,.45)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  actionSheet: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16 },
  sheetTitle: { color: '#1F3730', fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: 10 },
  sheetAction: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#EFF3F1' },
  sheetIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sheetActionText: { flex: 1, color: '#2E453E', fontSize: 13, fontWeight: '800', textAlign: 'right' },
  modalBackdropBottom: { flex: 1, backgroundColor: 'rgba(12,28,23,.45)', justifyContent: 'flex-end' },
  manageSheet: { maxHeight: '85%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 10 },
  sheetHandle: { width: 46, height: 5, borderRadius: 5, backgroundColor: '#D5DFDB', alignSelf: 'center', marginBottom: 13 },
  manageTitle: { color: '#1F3730', fontSize: 19, fontWeight: '900', textAlign: 'right' },
  manageLabel: { color: '#60736D', fontSize: 11.5, fontWeight: '800', textAlign: 'right', marginTop: 18, marginBottom: 8 },
  statusActions: { flexDirection: 'row-reverse', gap: 7 },
  statusAction: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#DDE6E3', alignItems: 'center' },
  statusActionText: { color: '#657771', fontSize: 10.5, fontWeight: '800' },
  assignRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9, paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#EDF2F0' },
  assignText: { flex: 1, color: '#314841', fontSize: 12.5, fontWeight: '700', textAlign: 'right' },
  pageButton: { marginTop: 18, borderWidth: 1, borderRadius: 14, paddingVertical: 12, flexDirection: 'row-reverse', gap: 8, alignItems: 'center', justifyContent: 'center' },
  pageButtonText: { fontSize: 11.5, fontWeight: '900' },
  closeSheet: { marginTop: 10, backgroundColor: '#EDF2F0', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  closeSheetText: { color: '#5D706A', fontSize: 12, fontWeight: '800' },
});
