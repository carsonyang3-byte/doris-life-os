import { useState, useCallback } from 'react';
import type { Goal, Project, AutoCalcRule } from '../types';
import { DEFAULT_GOALS, DEFAULT_PROJECTS } from '../lib/constants';
import { getItem, setItem } from '../lib/storage';
import { formatDate } from '../lib/utils';

const GOALS_KEY = 'life-os-goals';
const PROJECTS_KEY = 'life-os-projects';
const now = new Date();
const CURRENT_YEAR = now.getFullYear();

// ── autoCalc 辅助函数（从 useGoalProgress 迁移） ──

const STORAGE_KEYS = {
  habits: 'life-os-habits',
  library: 'doris_library',
  money: 'life-os-money',
  journalMe: 'life-os-journal-me',
  journalChenchen: 'life-os-journal-chenchen',
  awareness: 'life-os-awareness-',
} as const;

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
function getRecentDates(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}
function getCurrentMonthPrefix(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function calcByRule(rule: AutoCalcRule): number {
  switch (rule.type) {
    case 'habit_rate': {
      const habits = loadJSON<Record<string, Record<string, boolean>>>(STORAGE_KEYS.habits, {});
      const dates = getRecentDates(rule.windowDays);
      const completed = dates.filter((d) => habits[d]?.[rule.habit] === true).length;
      return Math.min(Math.round((completed / rule.windowDays) * 100), 100);
    }
    case 'library_count': {
      const items = loadJSON<any[]>(STORAGE_KEYS.library, []);
      const count = items.filter((i) => i.type === rule.itemType && i.status === rule.statusFilter).length;
      return Math.min(Math.round((count / rule.target) * 100), 100);
    }
    case 'money_monthly': {
      const records = loadJSON<any[]>(STORAGE_KEYS.money, []);
      const month = getCurrentMonthPrefix();
      const total = records
        .filter((r) => r.type === rule.direction && r.category === rule.category && r.date.startsWith(month))
        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      return Math.min(Math.round((total / rule.target) * 100), 100);
    }
    case 'journal_monthly': {
      const key = rule.owner === 'me' ? STORAGE_KEYS.journalMe : STORAGE_KEYS.journalChenchen;
      const entries = loadJSON<any[]>(key, []);
      const month = getCurrentMonthPrefix();
      const count = entries.filter((e) => e.date.startsWith(month)).length;
      return Math.min(Math.round((count / rule.target) * 100), 100);
    }
    case 'reflect_monthly': {
      const prefix = STORAGE_KEYS.awareness;
      let count = 0;
      for (let i = 0; i < 31; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        if (getItem(prefix + formatDate(d))) count++;
      }
      return Math.min(Math.round((count / rule.target) * 100), 100);
    }
    default: return 0;
  }
}

// 同步自动计算的进度到存储
function syncAutoProgress(goals: Goal[]): Goal[] {
  let changed = false;
  const updated = goals.map((g) => {
    if (g.autoCalc && !g.manualOverride) {
      const newProgress = calcByRule(g.autoCalc);
      if (newProgress !== g.progress) {
        changed = true;
        return { ...g, progress: newProgress };
      }
    }
    return g;
  });
  if (changed) saveGoals(updated);
  return updated;
}

function loadGoals(): Goal[] {
  try {
    const saved = getItem(GOALS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return syncAutoProgress([...DEFAULT_GOALS]);
      const migrated = parsed.map((g: Goal) => g.year ? g : { ...g, year: CURRENT_YEAR });
      return syncAutoProgress(migrated);
    }
    return syncAutoProgress([...DEFAULT_GOALS]);
  } catch {
    return syncAutoProgress([...DEFAULT_GOALS]);
  }
}

function saveGoals(goals: Goal[]) {
  setItem(GOALS_KEY, JSON.stringify(goals));
}

function loadProjects(): Project[] {
  try {
    const saved = getItem(PROJECTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [...DEFAULT_PROJECTS];
      return parsed;
    }
    return [...DEFAULT_PROJECTS];
  } catch {
    return [...DEFAULT_PROJECTS];
  }
}

function saveProjects(projects: Project[]) {
  setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>(loadGoals);
  const [projects, setProjects] = useState<Project[]>(loadProjects);

  const updateProgress = useCallback((index: number, progress: number, manualOverride: boolean = true) => {
    const updated = loadGoals();
    updated[index].progress = Math.max(0, Math.min(100, progress));
    if (updated[index].autoCalc) {
      updated[index].manualOverride = manualOverride;
    }
    saveGoals(updated);
    setGoals([...updated]);
  }, []);

  const addGoal = useCallback((title: string, desc?: string, color?: string, dimension?: string, year?: number, autoCalc?: Goal['autoCalc']) => {
    const updated = loadGoals();
    updated.push({ 
      title, 
      desc: desc || 'Click Edit to update', 
      progress: 0, 
      color: color || '#C9A96E', 
      dimension: dimension || 'growth', 
      year: year || CURRENT_YEAR,
      autoCalc
    });
    saveGoals(updated);
    setGoals([...updated]);
  }, []);

  const deleteGoal = useCallback((title: string) => {
    const updated = loadGoals();
    const next = updated.filter((g) => g.title !== title);
    saveGoals(next);
    setGoals([...next]);
  }, []);

  const addProject = useCallback((title: string) => {
    setProjects((prev) => {
      const next = [...prev, { title, desc: 'New project', status: 'planning' as const, color: '#9B8FD6' }];
      saveProjects(next);
      return next;
    });
  }, []);

  const deleteProject = useCallback((title: string) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.title !== title);
      saveProjects(next);
      return next;
    });
  }, []);

  const updateProjectTitle = useCallback((oldTitle: string, newTitle: string) => {
    setProjects((prev) => {
      const next = prev.map((p) => p.title === oldTitle ? { ...p, title: newTitle } : p);
      saveProjects(next);
      return next;
    });
  }, []);

  const updateProjectStatus = useCallback((title: string, status: 'planning' | 'active' | 'completed') => {
    setProjects((prev) => {
      const nowStr = new Date().toISOString().slice(0, 10);
      const next = prev.map((p) => {
        if (p.title !== title) return p;
        return {
          ...p,
          status,
          history: [
            { date: nowStr, status },
            ...(p.history || []),
          ],
        };
      });
      saveProjects(next);
      return next;
    });
  }, []);

  return { goals, projects, updateProgress, addGoal, deleteGoal, addProject, deleteProject, updateProjectTitle, updateProjectStatus };
}
