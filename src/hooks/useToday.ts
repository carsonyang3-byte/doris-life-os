import { useState, useCallback, useEffect, useMemo } from 'react';
import type { TodayRecord, Quote, LibraryItem } from '../types';
import { QUOTES, DAILY_QUESTIONS } from '../lib/constants';
import { formatDate, getGreeting } from '../lib/utils';
import { getItem, setItem } from '../lib/storage';

const TODAY_PREFIX = 'life-os-today-';
const AWARENESS_PREFIX = 'life-os-awareness-';

export function useToday() {
  const [date] = useState(new Date());
  const todayStr = formatDate(date);
  const greeting = getGreeting(date.getHours());
  const dateCN = formatDateCN(todayStr);

  const todayQ = DAILY_QUESTIONS[
    Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000) % DAILY_QUESTIONS.length
  ];

  const quoteIndex = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  ) % QUOTES.length;

  return { date, todayStr, greeting, dateCN, todayQ, quoteIndex };
}

function formatDateCN(dateStr: string): string {
  const d = new Date(dateStr);
  const weeks = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weeks[d.getDay()]}`;
}

export function useTodayData() {
  const todayStr = formatDate(new Date());

  const [tasks, setTasks] = useState<string[]>(['', '', '']);
  const [happy, setHappy] = useState('');
  const [awareness, setAwareness] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const data: TodayRecord | null = JSON.parse(getItem(TODAY_PREFIX + todayStr) || 'null');
      if (data) {
        setTasks(data.tasks.length >= 3 ? data.tasks : [...data.tasks, ...Array(3 - data.tasks.length).fill('')]);
        setHappy(data.happy);
        setAwareness(data.awareness);
      }
    } catch { /* ignore */ }
  }, [todayStr]);

  const save = useCallback(() => {
    const data: TodayRecord = {
      date: todayStr,
      tasks: tasks.filter((t) => t.trim()),
      happy,
      awareness,
    };
    setItem(TODAY_PREFIX + todayStr, JSON.stringify(data));
    if (awareness) setItem(AWARENESS_PREFIX + todayStr, '1');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [todayStr, tasks, happy, awareness]);

  return { tasks, setTasks, happy, setHappy, awareness, setAwareness, save, saved };
}

export function useQuotes(libraryItems?: LibraryItem[]) {
  // 从 Library 的笔记中提取金句
  const libraryQuotes = useMemo<Quote[]>(() => {
    if (!libraryItems || libraryItems.length === 0) return [];

    const quotes: Quote[] = [];
    for (const item of libraryItems) {
      if (!item.note) continue;
      // 从笔记中提取划线和笔记内容
      const lines = item.note.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const trimmed = line.trim();
        // 跳过元信息行（书评：、划线 X 条、笔记 X 条）
        if (trimmed.startsWith('书评：') || trimmed.startsWith('划线') || trimmed.startsWith('笔记') || trimmed === '...') continue;
        // 只要长度够的行就算金句
        if (trimmed.length >= 10 && !trimmed.startsWith('http')) {
          quotes.push({
            text: trimmed,
            book: item.title,
            author: item.creator || '微信读书',
          });
        }
      }
    }
    return quotes;
  }, [libraryItems]);

  // 合并：Library 金句在前，默认金句在后
  const allQuotes = useMemo<Quote[]>(() => {
    if (libraryQuotes.length === 0) return [...QUOTES];
    return [...libraryQuotes, ...QUOTES];
  }, [libraryQuotes]);

  const [index, setIndex] = useState(() => {
    // 根据日期初始化，每天看到不同的
    return Math.floor(Date.now() / 86400000) % allQuotes.length;
  });

  const current: Quote = allQuotes[index % allQuotes.length];
  const isFromLibrary = index < libraryQuotes.length && libraryQuotes.length > 0;
  const next = () => setIndex((i) => (i + 1) % allQuotes.length);

  return { current, next, index, isFromLibrary, libraryCount: libraryQuotes.length };
}
