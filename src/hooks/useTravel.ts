import { useState, useEffect, useMemo } from 'react';
import type { TravelPlan, TravelJournalEntry } from '../types';

const PLANS_KEY = 'doris_travel_plans';
const JOURNALS_KEY = 'doris_travel_journals';

export function useTravel() {
  const [plans, setPlans] = useState<TravelPlan[]>(() => {
    try {
      const saved = localStorage.getItem(PLANS_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      // 兼容旧数据：把 upcoming/ongoing 统一归为 planning
      return parsed.map((p: TravelPlan) => {
        if (p.status === 'upcoming' || p.status === 'ongoing') return { ...p, status: 'planning' as const };
        return p;
      });
    } catch {
      return [];
    }
  });

  const [journals, setJournals] = useState<TravelJournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(JOURNALS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem(JOURNALS_KEY, JSON.stringify(journals));
  }, [journals]);

  // ===== Plan CRUD =====

  const addPlan = (plan: Omit<TravelPlan, 'id' | 'createdAt'>) => {
    const id = Date.now();
    setPlans((prev) => [{ ...plan, id, createdAt: id }, ...prev]);
    return id;
  };

  const updatePlan = (id: number, updates: Partial<TravelPlan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePlan = (id: number) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    // 同时删除关联的游记
    setJournals((prev) => prev.filter((j) => j.tripId !== id));
  };

  // ===== Journal CRUD =====

  const addJournal = (entry: Omit<TravelJournalEntry, 'id' | 'createdAt'>) => {
    const id = Date.now();
    setJournals((prev) => [{ ...entry, id, createdAt: id }, ...prev]);
  };

  const updateJournal = (id: number, updates: Partial<TravelJournalEntry>) => {
    setJournals((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
  };

  const deleteJournal = (id: number) => {
    setJournals((prev) => prev.filter((j) => j.id !== id));
  };

  // ===== Getters =====

  const getJournalsForTrip = (tripId: number) => {
    return journals
      .filter((j) => j.tripId === tripId)
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // ===== Stats =====

  const stats = useMemo(() => {
    const now = new Date().toISOString().slice(0, 10);
    return {
      totalTrips: plans.length,
      planning: plans.filter((p) => p.status === 'planning').length,
      completed: plans.filter((p) => p.status === 'completed').length,
      totalJournals: journals.length,
      nextTrip: plans
        .filter((p) => p.status !== 'completed')
        .sort((a, b) => a.startDate.localeCompare(b.startDate))[0],
      destinations: [...new Set(plans.map((p) => p.destination))].length,
    };
  }, [plans, journals]);

  return {
    plans,
    journals,
    addPlan,
    updatePlan,
    deletePlan,
    addJournal,
    updateJournal,
    deleteJournal,
    getJournalsForTrip,
    stats,
  };
}
