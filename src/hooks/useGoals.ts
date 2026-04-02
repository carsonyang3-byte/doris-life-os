import { useState, useCallback } from 'react';
import type { Goal, Project } from '../types';
import { DEFAULT_GOALS, DEFAULT_PROJECTS } from '../lib/constants';
import { getItem, setItem, removeItem } from '../lib/storage';

const GOALS_KEY = 'life-os-goals';
const PROJECTS_KEY = 'life-os-projects';
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

  const addGoal = useCallback((title: string) => {
    const updated = loadGoals();
    updated.push({ title, desc: 'Click Edit to update', progress: 0, color: '#C9A96E', dimension: 'growth', year: CURRENT_YEAR });
    saveGoals(updated);
    setGoals([...updated]);
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

  return { goals, projects, updateProgress, addGoal, addProject, deleteProject, updateProjectTitle, updateProjectStatus };
}
