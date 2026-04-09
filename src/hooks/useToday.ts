import { useState, useCallback, useEffect, useMemo } from 'react';
import type { TodayRecord, Quote, LibraryItem } from '../types';
import { QUOTES, DAILY_QUESTION_SETS, DAILY_SET_KEYS } from '../lib/constants';
import { formatDate, getGreeting, formatDateCN } from '../lib/utils';
import { getItem, setItem } from '../lib/storage';

const TODAY_PREFIX = 'life-os-today-';
const AWARENESS_PREFIX = 'life-os-awareness-';

export function useToday() {
  const [date] = useState(new Date());
  const todayStr = formatDate(date);
  const greeting = getGreeting(date.getHours());
  const dateCN = formatDateCN(todayStr);

  // 从当前用户选择的 set 里取每日一问
  const activeSetKey = (getItem('life-os-reflect-daily-set') as keyof typeof DAILY_QUESTION_SETS) || DAILY_SET_KEYS[0];
  const questions = DAILY_QUESTION_SETS[activeSetKey] || DAILY_QUESTION_SETS[DAILY_SET_KEYS[0]];
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const todayQ = questions[dayOfYear % questions.length];

  const quoteIndex = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  ) % QUOTES.length;

  return { date, todayStr, greeting, dateCN, todayQ, quoteIndex };
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

function hashDateKey(dateStr: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function useQuotes(libraryItems?: LibraryItem[], todayStr?: string) {
  const dateKey = todayStr ?? formatDate(new Date());

  const libraryQuotes = useMemo<Quote[]>(() => {
    if (!libraryItems || libraryItems.length === 0) return [];

    const quotes: Quote[] = [];
    for (const item of libraryItems) {
      if (item.wereadHighlights && item.wereadHighlights.length > 0) {
        for (const h of item.wereadHighlights) {
          const t = h.text?.trim() ?? '';
          if (t.length >= 3) {
            quotes.push({
              text: t,
              book: item.title,
              author: item.creator || '微信读书',
            });
          }
        }
        continue;
      }
      if (!item.note) continue;
      const lines = item.note.split('\n').filter((l) => l.trim());
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          trimmed.startsWith('书评：') ||
          trimmed.startsWith('划线') ||
          trimmed.startsWith('笔记') ||
          trimmed.startsWith('微信读书') ||
          trimmed === '...' ||
          trimmed === '…'
        ) {
          continue;
        }
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

  const allQuotes = useMemo<Quote[]>(() => {
    if (libraryQuotes.length === 0) return [...QUOTES];
    return [...libraryQuotes, ...QUOTES];
  }, [libraryQuotes]);

  const libraryLen = libraryQuotes.length;

  const dailyBase = useMemo(() => {
    if (allQuotes.length === 0) return 0;
    return hashDateKey(dateKey) % allQuotes.length;
  }, [dateKey, allQuotes.length]);

  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
  }, [dateKey, libraryLen, allQuotes.length]);

  const effIndex = (dailyBase + step) % (allQuotes.length || 1);
  const current: Quote = allQuotes[effIndex] ?? QUOTES[0];
  const isFromLibrary = libraryLen > 0 && effIndex < libraryLen;
  const next = () => setStep((s) => s + 1);

  return { current, next, index: effIndex, isFromLibrary, libraryCount: libraryLen };
}
