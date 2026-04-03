import { useState, useCallback } from 'react';
import type { MoneyRecord } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/constants';
import { formatDate } from '../lib/utils';
import { getItem, setItem } from '../lib/storage';

const STORAGE_KEY = 'life-os-money';

function loadRecords(): MoneyRecord[] {
  try {
    return JSON.parse(getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecords(records: MoneyRecord[]) {
  setItem(STORAGE_KEY, JSON.stringify(records));
}

function seedMoneyData() {
  // 旧版为了演示会在“空数据”时自动生成样例记录，这会导致看起来像是“自动加了数据且没有清理”。
  // 改为：不再自动 seed；初始保持空数组。
  const existing = loadRecords();
  if (existing.length > 0) return;
  saveRecords([]);
  return;

  // --- legacy demo seed (disabled) ---
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

  const clearRecords = useCallback(() => {
    saveRecords([]);
    setRecords([]);
  }, []);

  const deleteRecord = useCallback((id: number) => {
    const updated = loadRecords().filter(r => r.id !== id);
    saveRecords(updated);
    setRecords(updated);
  }, []);

  const removeDemoData = useCallback(() => {
    // 移除所有看起来像演示数据的记录
    const allRecords = loadRecords();
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    // 演示数据通常有特定的模式：id较小，且记录数量多
    // 保留用户手动添加的记录（id较大）和最近一周的记录
    const realRecords = allRecords.filter(record => {
      // 如果记录是最近一周内添加的，保留
      if (record.id > oneWeekAgo) return true;
      
      // 如果记录日期是最近一周的，保留
      const recordDate = new Date(record.date).getTime();
      if (recordDate > oneWeekAgo) return true;
      
      // 否则很可能是旧的演示数据
      return false;
    });
    
    saveRecords(realRecords);
    setRecords(realRecords);
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

  return { records, addRecord, clearRecords, deleteRecord, removeDemoData, getWeeklyData };
}
