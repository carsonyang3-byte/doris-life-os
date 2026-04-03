import { useState, useCallback } from 'react';
import type { Goal, Project } from '../types';
import { DEFAULT_GOALS, DEFAULT_PROJECTS, DISTANCE_DIMS_DEFAULT } from '../lib/constants';
import { getItem, setItem, removeItem } from '../lib/storage';

const GOALS_KEY = 'life-os-goals';
const PROJECTS_KEY = 'life-os-projects';
const VISION_KEY = 'life-os-vision-distance';
const now = new Date();
const CURRENT_YEAR = now.getFullYear();

function loadGoals(): Goal[] {
  try {
    const saved = getItem(GOALS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [...DEFAULT_GOALS];
      // 迁移旧数据：补充 year 字段
      const migrated = parsed.map((g: Goal) => g.year ? g : { ...g, year: CURRENT_YEAR });
      if (migrated.some((g: Goal) => !g.year)) {
        saveGoals(migrated.map((g: Goal) => g.year ? g : { ...g, year: CURRENT_YEAR }));
      }
      return migrated;
    }
    return [...DEFAULT_GOALS];
  } catch {
    return [...DEFAULT_GOALS];
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

function loadVisionDistance() {
  try {
    const saved = getItem(VISION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === DISTANCE_DIMS_DEFAULT.length) {
        return parsed;
      }
    }
  } catch {}
  // 返回默认值
  return [...DISTANCE_DIMS_DEFAULT];
}

function saveVisionDistance(data: typeof DISTANCE_DIMS_DEFAULT) {
  setItem(VISION_KEY, JSON.stringify(data));
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>(loadGoals);
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [visionDistance, setVisionDistance] = useState(loadVisionDistance);

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

  const updateVisionDistance = useCallback((index: number, value: number) => {
    setVisionDistance(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], current: Math.max(0, Math.min(100, value)) };
      saveVisionDistance(updated);
      return updated;
    });
  }, []);

  const resetVisionDistance = useCallback(() => {
    const defaultData = [...DISTANCE_DIMS_DEFAULT];
    saveVisionDistance(defaultData);
    setVisionDistance(defaultData);
  }, []);

  return { goals, projects, visionDistance, updateProgress, addGoal, deleteGoal, addProject, deleteProject, updateProjectTitle, updateProjectStatus, updateVisionDistance, resetVisionDistance };
}
