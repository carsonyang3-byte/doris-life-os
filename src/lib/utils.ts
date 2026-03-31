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
  const dow = getDay(d) || 7;
  const start = new Date(d);
  start.setDate(d.getDate() - dow + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
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
