import { useState, useCallback } from 'react';
import type { MoneyRecord } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/constants';
import { formatDate } from '../lib/utils';

const STORAGE_KEY = 'life-os-money';

function loadRecords(): MoneyRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecords(records: MoneyRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function seedMoneyData() {
  if (localStorage.getItem(STORAGE_KEY)) return;
  const records: MoneyRecord[] = [];
  const rand = (() => {
    let s = 777;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  })();
  const sampleExp = [
    { cat: 'food', note: '午餐', range: [15, 45] },
    { cat: 'food', note: '咖啡', range: [12, 35] },
    { cat: 'transport', note: '打车', range: [10, 30] },
    { cat: 'shopping', note: '日用品', range: [20, 80] },
    { cat: 'health', note: '体检', range: [200, 500] },
    { cat: 'child', note: '兴趣班', range: [100, 300] },
    { cat: 'entertainment', note: '电影', range: [40, 80] },
    { cat: 'education', note: '课程', range: [50, 200] },
    { cat: 'food', note: '外卖', range: [20, 50] },
    { cat: 'housing', note: '水电', range: [100, 300] },
  ];
  const sampleInc = [
    { cat: 'salary', note: '工资', range: [8000, 12000] },
    { cat: 'bonus', note: '季度奖金', range: [2000, 5000] },
  ];
  const today = new Date();
  for (let i = 59; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const cnt = 1 + Math.floor(rand() * 3);
    for (let j = 0; j < cnt; j++) {
      const s = sampleExp[Math.floor(rand() * sampleExp.length)];
      const catObj = EXPENSE_CATEGORIES.find((c) => c.key === s.cat);
      records.push({
        id: Date.now() - i * 100000 - j * 1000,
        type: 'expense',
        category: s.cat,
        categoryLabel: catObj?.label || s.cat,
        categoryColor: catObj?.color || '#A0A0A0',
        amount: Math.round((s.range[0] + rand() * (s.range[1] - s.range[0])) * 100) / 100,
        note: s.note,
        date: dateStr,
      });
    }
    if (date.getDate() === 1 || date.getDate() === 15) {
      const s = sampleInc[Math.floor(rand() * sampleInc.length)];
      const catObj = INCOME_CATEGORIES.find((c) => c.key === s.cat);
      records.push({
        id: Date.now() - i * 100000 - 99,
        type: 'income',
        category: s.cat,
        categoryLabel: catObj?.label || s.cat,
        categoryColor: catObj?.color || '#A0A0A0',
        amount: Math.round((s.range[0] + rand() * (s.range[1] - s.range[0])) * 100) / 100,
        note: s.note,
        date: dateStr,
      });
    }
  }
  saveRecords(records);
}

export function useMoney() {
  const [records, setRecords] = useState<MoneyRecord[]>(() => {
    seedMoneyData();
    return loadRecords();
  });

  const addRecord = useCallback((record: Omit<MoneyRecord, 'id'>) => {
    const newRecord: MoneyRecord = { ...record, id: Date.now() };
    const updated = [newRecord, ...loadRecords()];
    saveRecords(updated);
    setRecords(updated);
  }, []);

  const getWeeklyData = useCallback(() => {
    const all = loadRecords();
    const today = new Date();
    const weeks: { label: string; income: number; expense: number; net: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      const weekRecords = all.filter((r) => {
        const d = new Date(r.date);
        return d >= weekStart && d <= weekEnd;
      });
      const income = weekRecords.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
      const expense = weekRecords.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
      weeks.push({
        label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        income,
        expense,
        net: income - expense,
      });
    }
    return weeks;
  }, []);

  return { records, addRecord, getWeeklyData };
}
