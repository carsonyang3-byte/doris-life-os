import { useState, useCallback, useEffect, useMemo } from 'react';
import type { TodayRecord, Quote, LibraryItem } from '../types';
import { QUOTES, DAILY_QUESTION_SETS, DAILY_SET_KEYS } from '../lib/constants';
import { formatDate, getGreeting, formatDateCN } from '../lib/utils';
import { getItem, setItem } from '../lib/storage';

const TODAY_PREFIX = 'life-os-today-';
const AWARENESS_PREFIX = 'life-os-awareness-';

// ── 自动轮换：按 dayOfYear 决定当天用哪套 daily set ──
function getAutoDailySet(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_SET_KEYS[dayOfYear % DAILY_SET_KEYS.length];
}

export function useToday() {
  const [date] = useState(new Date());
  const todayStr = formatDate(date);
  const greeting = getGreeting(date.getHours());
  const dateCN = formatDateCN(todayStr);

  // 从自动轮换的 set 中取今天的每日一题
  const todayQ = useMemo(() => {
    const autoSetKey = getAutoDailySet(todayStr);
    const questions = DAILY_QUESTION_SETS[autoSetKey as keyof typeof DAILY_QUESTION_SETS];
    if (!questions || questions.length === 0) return { q: '今天有什么值得记录的？', framework: 'Daily' };
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    return questions[dayOfYear % questions.length];
  }, [todayStr, date]);

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
    const seen = new Set<string>();

    // 元数据关键词黑名单 — 这些行的内容绝不可能是金句
    const META_KEYWORDS = ['开始时间', '结束时间', '阅读周期', '阅读时长', '个笔记', '<hr', '---'];

    for (const item of libraryItems) {
      const author = item.creator || '微信读书';

      // ── 优先从 wereadHighlights 读取（这是解析器专门提取的干净划线）─
      if (item.wereadHighlights && item.wereadHighlights.length > 0) {
        for (const h of item.wereadHighlights) {
          const t = h.text?.trim() ?? '';
          if (t && t.length >= 4 && !seen.has(t)) {
            seen.add(t);
            quotes.push({ text: t, book: item.title, author });
          }
        }
        continue;  // 有 wereadHighlights 就不从 note 里捞了
      }

      // ── fallback: 从 note 提取（严格过滤元数据）──
      if (!item.note) continue;
      const lines = item.note.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // 跳过空行、省略号、URL、纯数字时间、含元数据关键字的行
        if (!trimmed || trimmed === '...' || trimmed === '\u2026' ||
            trimmed.startsWith('http') ||
            META_KEYWORDS.some(k => trimmed.includes(k)) ||
            seen.has(trimmed)) continue;
        // 至少4个字符才保留为金句
        if (trimmed.length >= 4 && !/^[\d\s:\-\/]+$/.test(trimmed)) {
          seen.add(trimmed);
          quotes.push({ text: trimmed, book: item.title, author });
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
