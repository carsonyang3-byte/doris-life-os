import { useState, useCallback } from 'react';
import type { HabitData } from '../types';
import { HABIT_KEYS } from '../lib/constants';
import { formatDate } from '../lib/utils';

const STORAGE_KEY = 'life-os-habits';
const AWARENESS_PREFIX = 'life-os-awareness-';

function loadHabitData(): HabitData {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveHabitData(data: HabitData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
  if (Object.keys(existing).length > 0) return;
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

  const toggleHabit = useCallback((dateStr: string, habit: string) => {
    const current = loadHabitData();
    if (!current[dateStr]) current[dateStr] = {};
    current[dateStr][habit] = !current[dateStr][habit];
    saveHabitData(current);
    setData({ ...current });
  }, []);

  const getStreak = useCallback(() => {
    const all = loadHabitData();
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      if (all[dateStr]?.['冥想']) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, []);

  const getJournalDays = useCallback(() => {
    const all = loadHabitData();
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(new Date());
      d.setDate(d.getDate() - i);
      if (localStorage.getItem(AWARENESS_PREFIX + formatDate(d))) count++;
    }
    return count;
  }, []);

  const getExerciseCount = useCallback(() => {
    const all = loadHabitData();
    return Object.values(all).filter((h) => h['运动']).length;
  }, []);

  const getHeatmapData = useCallback(() => {
    const all = loadHabitData();
    const today = new Date();
    const cells: { date: string; count: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const habits = all[dateStr];
      const count = habits ? HABIT_KEYS.filter((k) => habits[k]).length : 0;
      cells.push({ date: dateStr, count });
    }
    return cells;
  }, []);

  return { data, toggleHabit, getStreak, getJournalDays, getExerciseCount, getHeatmapData };
}
