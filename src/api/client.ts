import type {
  Agent,
  BootstrapData,
  Connection,
  Conversation,
  Message,
  PluginSettings,
} from '../types';

const API_PATH = '/wp-json/wspc-mobile/v1';

function normalizeSiteUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function encodeBasic(value: string): string {
  const bytes = unescape(encodeURIComponent(value));
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(bytes);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < bytes.length) {
    const chr1 = bytes.charCodeAt(i++);
    const chr2 = bytes.charCodeAt(i++);
    const chr3 = bytes.charCodeAt(i++);
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;
    if (Number.isNaN(chr2)) enc3 = enc4 = 64;
    else if (Number.isNaN(chr3)) enc4 = 64;
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 0, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export class ApiClient {
  readonly connection: Connection;
  readonly baseUrl: string;

  constructor(connection: Connection) {
    this.connection = { ...connection, siteUrl: normalizeSiteUrl(connection.siteUrl) };
    this.baseUrl = `${this.connection.siteUrl}${API_PATH}`;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Basic ${encodeBasic(`${this.connection.username}:${this.connection.appPassword}`)}`,
      ...(init.headers as Record<string, string> | undefined),
    };

    if (init.body && !(init.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    } catch (error) {
      throw new ApiError('ارتباط با سایت برقرار نشد. آدرس سایت، اینترنت و HTTPS را بررسی کنید.');
    }

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || 'پاسخ نامعتبر از سرور دریافت شد.' };
    }

    if (!response.ok) {
      throw new ApiError(data?.message || 'درخواست انجام نشد.', response.status, data?.code);
    }
    return data as T;
  }

  getBootstrap(): Promise<BootstrapData> {
    return this.request('/bootstrap');
  }

  getConversations(params: {
    page?: number;
    perPage?: number;
    state?: string;
    agentFilter?: string;
    search?: string;
  } = {}): Promise<{ success: boolean; items: Conversation[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.perPage) query.set('per_page', String(params.perPage));
    if (params.state) query.set('state', params.state);
    if (params.agentFilter) query.set('agent_filter', params.agentFilter);
    if (params.search) query.set('search', params.search);
    return this.request(`/conversations?${query.toString()}`);
  }

  getConversation(id: number): Promise<{ success: boolean; conversation: Conversation; messages: Message[] }> {
    return this.request(`/conversations/${id}`);
  }

  getMessages(id: number, afterId = 0): Promise<{ success: boolean; messages: Message[] }> {
    return this.request(`/conversations/${id}/messages?after_id=${afterId}`);
  }

  sendMessage(id: number, message: string, replyTo = 0): Promise<{ success: boolean; message: Message; conversation: Conversation }> {
    return this.request(`/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, reply_to: replyTo || undefined }),
    });
  }

  async uploadMedia(
    id: number,
    file: { uri: string; name: string; type: string },
    kind: 'image' | 'audio' | 'document',
    duration = 0,
    replyTo = 0,
  ): Promise<{ success: boolean; message: Message; conversation: Conversation }> {
    const form = new FormData();
    form.append('kind', kind);
    form.append('duration', String(duration));
    if (replyTo) form.append('reply_to', String(replyTo));
    form.append('file', file as any);
    return this.request(`/conversations/${id}/media`, { method: 'POST', body: form });
  }

  updateConversation(id: number, patch: Record<string, unknown>): Promise<{ success: boolean; conversation: Conversation }> {
    return this.request(`/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  getFilters(): Promise<{ success: boolean; agent_filters: Record<string, string>; states: Record<string, string> }> {
    return this.request('/filters');
  }

  getStats(days = 30): Promise<{ success: boolean; days: number; summary: any; agents: any[] }> {
    return this.request(`/stats?days=${days}`);
  }

  getSettings(): Promise<{ success: boolean; settings: PluginSettings }> {
    return this.request('/settings');
  }

  updateSettings(settings: Partial<PluginSettings>): Promise<{ success: boolean; settings: PluginSettings; theme: any }> {
    return this.request('/settings', { method: 'PATCH', body: JSON.stringify(settings) });
  }

  getAgents(): Promise<{ success: boolean; agents: Agent[] }> {
    return this.request('/agents');
  }

  updateAgent(index: number, patch: Partial<Agent>): Promise<{ success: boolean; agents: Agent[] }> {
    return this.request(`/agents/${index}`, { method: 'PATCH', body: JSON.stringify(patch) });
  }

  registerDevice(token: string, platform: string, deviceName: string): Promise<{ success: boolean }> {
    return this.request('/devices', {
      method: 'POST',
      body: JSON.stringify({ token, platform, device_name: deviceName }),
    });
  }

  removeDevice(token: string): Promise<{ success: boolean }> {
    return this.request('/devices', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    });
  }
}

export { normalizeSiteUrl };
