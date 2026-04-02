// ===== Utility Functions =====
import { format, getDay, startOfWeek } from 'date-fns';

export function formatDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function formatDateCN(dateStr: string): string {
  const d = new Date(dateStr);
  const weeks = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weeks[d.getDay()]}`;
}

export function getWeekRange(d: Date): { start: Date; end: Date } {
  // 用 UTC 避免时区偏移导致月末 setDate 溢出（如 3月31日-6天变成4月）
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dow = utc.getUTCDay() || 7; // 周一=1 ... 周日=7
  const startUTC = new Date(utc);
  startUTC.setUTCDate(utc.getUTCDate() - dow + 1);
  const endUTC = new Date(startUTC);
  endUTC.setUTCDate(startUTC.getUTCDate() + 6);
  return { start: startUTC, end: endUTC };
}

export function getWeekKey(d: Date): string {
  const ws = startOfWeek(d, { weekStartsOn: 1 });
  return formatDate(ws);
}

export function getGreeting(hour: number): string {
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
