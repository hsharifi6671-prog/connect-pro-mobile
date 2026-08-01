export function statusLabel(status: string): string {
  if (status === 'open') return 'باز';
  if (status === 'pending') return 'در انتظار';
  if (status === 'closed') return 'بسته';
  return status;
}

export function departmentLabel(value: string): string {
  const map: Record<string, string> = {
    sales: 'فروش',
    support: 'پشتیبانی',
    hr: 'منابع انسانی',
    general: 'عمومی',
  };
  return map[value] || value || 'تخصیص‌نیافته';
}

export function messageKindLabel(kind: string): string {
  if (kind === 'image') return 'تصویر';
  if (kind === 'audio') return 'پیام صوتی';
  if (kind === 'document') return 'فایل پیوست';
  return '';
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatResponseTime(seconds: number): string {
  if (!seconds) return '۰ دقیقه';
  if (seconds < 60) return `${seconds} ثانیه`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} دقیقه`;
  return `${(seconds / 3600).toFixed(1)} ساعت`;
}
