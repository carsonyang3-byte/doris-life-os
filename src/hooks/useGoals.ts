import { useState, useCallback } from 'react';
import type { Goal, Project } from '../types';
import { DEFAULT_GOALS, DEFAULT_PROJECTS } from '../lib/constants';
import { getItem, setItem, removeItem } from '../lib/storage';

const GOALS_KEY = 'life-os-goals';

function loadGoals(): Goal[] {
  try {
    const saved = getItem(GOALS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 迁移检查：如果旧数据没有 autoCalc 字段，用新默认值替换
      if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0].autoCalc && DEFAULT_GOALS.some(g => g.autoCalc)) {
        removeItem(GOALS_KEY);
        return [...DEFAULT_GOALS];
      }
      return parsed;
    }
    return [...DEFAULT_GOALS];
  } catch {
    return [...DEFAULT_GOALS];
  }
}

function saveGoals(goals: Goal[]) {
  setItem(GOALS_KEY, JSON.stringify(goals));
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>(loadGoals);
  const [projects, setProjects] = useState<Project[]>([...DEFAULT_PROJECTS]);

  const updateProgress = useCallback((index: number, progress: number, manualOverride: boolean = true) => {
    const updated = loadGoals();
    updated[index].progress = Math.max(0, Math.min(100, progress));
    // 如果目标有自动计算规则，标记为手动覆盖
    if (updated[index].autoCalc) {
      updated[index].manualOverride = manualOverride;
    }
    saveGoals(updated);
    setGoals([...updated]);
  }, []);

  const addGoal = useCallback((title: string) => {
    const updated = loadGoals();
    updated.push({ title, desc: 'Click Edit to update', progress: 0, color: '#C9A96E', dimension: 'growth' });
    saveGoals(updated);
    setGoals([...updated]);
  }, []);

  const addProject = useCallback((title: string) => {
    setProjects((prev) => [...prev, { title, desc: 'New project', status: 'planning', color: '#9B8FD6' }]);
  }, []);

  return { goals, projects, updateProgress, addGoal, addProject };
}
