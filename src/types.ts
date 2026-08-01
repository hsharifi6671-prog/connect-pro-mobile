export type Connection = {
  siteUrl: string;
  username: string;
  appPassword: string;
};

export type ThemeTokens = {
  app_name: string;
  primary: string;
  accent: string;
  header_start: string;
  header_end: string;
  surface: string;
  background: string;
  text: string;
  muted: string;
};

export type BootstrapData = {
  success: boolean;
  api_version: string;
  plugin_version: string;
  site: { name: string; url: string; timezone: string; language: string };
  user: { id: number; name: string; email: string; avatar: string };
  permissions: { conversations: boolean; settings: boolean };
  theme: ThemeTokens;
  features: Record<string, boolean>;
  limits: {
    message_chars: number;
    image_mb: number;
    audio_mb: number;
    document_mb: number;
    audio_seconds: number;
  };
};

export type ConversationStatus = 'open' | 'pending' | 'closed';
export type ConversationChannel = 'ai' | 'human' | 'hybrid';

export type FormDataItem = {
  key: string;
  label: string;
  type: 'text' | 'file';
  value: string;
  url: string;
};

export type Conversation = {
  id: number;
  public_id: string;
  name: string;
  email: string;
  phone: string;
  assigned_agent_name: string;
  assigned_department: string;
  status: ConversationStatus;
  channel: ConversationChannel;
  scenario: string;
  scenario_title: string;
  page_title: string;
  page_url: string;
  started_at: string;
  updated_at: string;
  updated_label: string;
  rating: number;
  ai_messages: number;
  human_messages: number;
  conversion_intent: number;
  form_title: string;
  form_data: FormDataItem[];
  unread: boolean;
  last_message_id: number;
  last_message: string;
  last_sender: string;
  last_message_kind: MessageKind;
};

export type MessageKind = 'text' | 'image' | 'audio' | 'document';

export type MessageMedia = {
  url: string;
  mime: string;
  size: number;
  name: string;
  duration: number;
};

export type ReplyPreview = {
  id: number;
  sender: string;
  kind: MessageKind;
  text: string;
};

export type Message = {
  id: number;
  sender: 'visitor' | 'agent' | 'ai' | 'system';
  body: string;
  kind: MessageKind;
  created_at: string;
  reply_to: number;
  helpful: number;
  agent_user_id: number;
  agent_key: string;
  agent_name: string;
  reply?: ReplyPreview | null;
  media?: MessageMedia;
};

export type StatsSummary = {
  total: number;
  closed: number;
  rated: number;
  avg_rating: number;
  satisfaction_rate: number;
  resolution_rate: number;
  ai_assisted: number;
  human_assisted: number;
  conversion_intent: number;
  conversion_rate: number;
  avg_first_response: number;
};

export type AgentStat = {
  user_id: number;
  agent_key: string;
  name: string;
  rated: number;
  positive: number;
  negative: number;
  score: number;
};

export type Agent = {
  index: number;
  key: string;
  active: boolean;
  name: string;
  title: string;
  avatar: string;
  department: string;
  notification_email: string;
  custom_schedule_enabled: boolean;
  schedule_start: string;
  schedule_end: string;
};

export type PluginSettings = {
  enabled: number;
  chat_enabled: number;
  chat_mode: ConversationChannel;
  ai_enabled: number;
  faq_enabled: number;
  chat_email_enabled: number;
  chat_email_admin_new_message: number;
  chat_email_admin_handoff: number;
  chat_email_visitor_new_reply: number;
  chat_email_visitor_summary: number;
  admin_chat_floating_enabled: number;
  offline_mode: string;
  header_title: string;
  header_subtitle: string;
  chat_title: string;
  chat_subtitle: string;
  chat_welcome_message: string;
  chat_placeholder: string;
  primary_color: string;
  accent_color: string;
  header_bg_start: string;
  header_bg_end: string;
  chat_poll_seconds: number;
  schedule: Array<{ enabled: number; start: string; end: string }>;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Chat: { conversationId: number; initial?: Conversation };
};

export type MainTabsParamList = {
  Conversations: undefined;
  Dashboard: undefined;
  Settings: undefined;
};
