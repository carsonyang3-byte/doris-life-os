import { useState, useCallback } from 'react';
import type { HabitData } from '../types';
import { HABIT_KEYS } from '../lib/constants';
import { formatDate } from '../lib/utils';
import { getItem, setItem } from '../lib/storage';

const STORAGE_KEY = 'life-os-habits';
const AWARENESS_PREFIX = 'life-os-awareness-';
export const HABIT_LIST_KEY = 'life-os-habit-list';

function loadHabitData(): HabitData {
  try {
    return JSON.parse(getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveHabitData(data: HabitData) {
  setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadHabitList(): string[] {
  try {
    const stored = getItem(HABIT_LIST_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [...HABIT_KEYS];
}

function saveHabitList(list: string[]) {
  setItem(HABIT_LIST_KEY, JSON.stringify(list));
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function seedHabitData() {
  const existing = loadHabitData();
  // 有数据就跳过，避免重复 seed 堆积
  const hasRealData = Object.values(existing).some((h) => Object.keys(h).length > 0);
  if (hasRealData) return;
  const data: HabitData = {};
  const rand = seededRandom(42);
  const today = new Date();
  for (let i = 59; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const dayIndex = 59 - i;
    const recencyBoost = Math.min(dayIndex / 30, 0.85);
    const baseRate = 0.5 + recencyBoost * 0.35;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const habits: Record<string, boolean> = {};
    HABIT_KEYS.forEach((key) => {
      const rate = isWeekend && key === '阅读' ? baseRate + 0.15 : baseRate;
      habits[key] = rand() < rate;
    });
    data[dateStr] = habits;
  }
  saveHabitData(data);
}

export function useHabits() {
  const [data, setData] = useState<HabitData>(() => {
    seedHabitData();
    return loadHabitData();
  });

  const [habitList, setHabitList] = useState<string[]>(() => loadHabitList());

  const toggleHabit = useCallback((dateStr: string, habit: string) => {
    const current = loadHabitData();
    if (!current[dateStr]) current[dateStr] = {};
    current[dateStr][habit] = !current[dateStr][habit];
    saveHabitData(current);
    setData({ ...current });
  }, []);

  const addHabit = useCallback((habitName: string) => {
    const trimmed = habitName.trim();
    if (!trimmed) return;
    setHabitList((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      saveHabitList(next);
      return next;
    });
  }, []);

  const removeHabit = useCallback((habitName: string) => {
    setHabitList((prev) => {
      const next = prev.filter((h) => h !== habitName);
      saveHabitList(next);
      return next;
    });
    // 清理所有历史记录中的该习惯
    const current = loadHabitData();
    for (const dateStr of Object.keys(current)) {
      if (habitName in current[dateStr]) {
        delete current[dateStr][habitName];
      }
    }
    saveHabitData(current);
    setData({ ...current });
  }, []);

  const renameHabit = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setHabitList((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = prev.map((h) => (h === oldName ? trimmed : h));
      saveHabitList(next);
      return next;
    });
    // 更新所有历史记录中的键名
    const current = loadHabitData();
    for (const dateStr of Object.keys(current)) {
      if (oldName in current[dateStr]) {
        current[dateStr][trimmed] = current[dateStr][oldName];
        delete current[dateStr][oldName];
      }
    }
    saveHabitData(current);
    setData({ ...current });
  }, []);

  // 通用连续天数计算：从昨天开始算（如果今天已打卡则从今天算）
  const getHabitStreak = useCallback((habitName: string): number => {
    const all = loadHabitData();
    const today = new Date();
    let streak = 0;
    // 如果今天已打卡，从今天开始算；否则从昨天开始
    const todayStr = formatDate(today);
    const startFromYesterday = !all[todayStr]?.[habitName];
    const startOffset = startFromYesterday ? 1 : 0;
    for (let i = startOffset; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      if (all[dateStr]?.[habitName]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, []);

  // 兼容旧接口
  const getStreak = useCallback(() => getHabitStreak('冥想'), [getHabitStreak]);

  const getJournalDays = useCallback(() => {
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(new Date());
      d.setDate(d.getDate() - i);
      if (getItem(AWARENESS_PREFIX + formatDate(d))) count++;
    }
    return count;
  }, []);

  // 通用年度习惯计数
  const getHabitYearlyCount = useCallback((habitName: string): number => {
    const all = loadHabitData();
    const year = new Date().getFullYear();
    return Object.entries(all)
      .filter(([dateStr]) => dateStr.startsWith(String(year)))
      .filter(([, h]) => h[habitName]).length;
  }, []);

  // 兼容旧接口
  const getExerciseCount = useCallback(() => getHabitYearlyCount('运动'), [getHabitYearlyCount]);

  const getHeatmapData = useCallback(() => {
    const all = loadHabitData();
    const list = loadHabitList();
    const today = new Date();
    const cells: { date: string; count: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const habits = all[dateStr];
      const count = habits ? list.filter((k) => habits[k]).length : 0;
      cells.push({ date: dateStr, count });
    }
    return cells;
  }, []);

  return {
    data,
    habitList,
    toggleHabit,
    addHabit,
    removeHabit,
    renameHabit,
    getStreak,
    getHabitStreak,
    getJournalDays,
    getExerciseCount,
    getHabitYearlyCount,
    getHeatmapData,
  };
}
