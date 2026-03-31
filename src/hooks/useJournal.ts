import { useState, useCallback, useMemo } from 'react';
import type { JournalEntry } from '../types';
import { getItem, setItem } from '../lib/storage';

const STORAGE_KEY_ME = 'life-os-journal-me';
const STORAGE_KEY_CHENCHEN = 'life-os-journal-chenchen';

function loadEntries(owner: 'me' | 'chenchen'): JournalEntry[] {
  try {
    const key = owner === 'me' ? STORAGE_KEY_ME : STORAGE_KEY_CHENCHEN;
    return JSON.parse(getItem(key) || '[]');
  } catch {
    return [];
  }
}

function saveEntries(owner: 'me' | 'chenchen', entries: JournalEntry[]) {
  const key = owner === 'me' ? STORAGE_KEY_ME : STORAGE_KEY_CHENCHEN;
  setItem(key, JSON.stringify(entries));
}

export function useJournal() {
  const [meEntries, setMeEntries] = useState<JournalEntry[]>(() => loadEntries('me'));
  const [chenchenEntries, setChenchenEntries] = useState<JournalEntry[]>(() => loadEntries('chenchen'));

  const addEntry = useCallback((owner: 'me' | 'chenchen', entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: Date.now(),
      createdAt: Date.now(),
    };
    if (owner === 'me') {
      const updated = [newEntry, ...loadEntries('me')];
      saveEntries('me', updated);
      setMeEntries(updated);
    } else {
      const updated = [newEntry, ...loadEntries('chenchen')];
      saveEntries('chenchen', updated);
      setChenchenEntries(updated);
    }
  }, []);

  const updateEntry = useCallback((owner: 'me' | 'chenchen', id: number, updates: Partial<JournalEntry>) => {
    if (owner === 'me') {
      const updated = loadEntries('me').map((e) => (e.id === id ? { ...e, ...updates } : e));
      saveEntries('me', updated);
      setMeEntries(updated);
    } else {
      const updated = loadEntries('chenchen').map((e) => (e.id === id ? { ...e, ...updates } : e));
      saveEntries('chenchen', updated);
      setChenchenEntries(updated);
    }
  }, []);

  const deleteEntry = useCallback((owner: 'me' | 'chenchen', id: number) => {
    if (owner === 'me') {
      const updated = loadEntries('me').filter((e) => e.id !== id);
      saveEntries('me', updated);
      setMeEntries(updated);
    } else {
      const updated = loadEntries('chenchen').filter((e) => e.id !== id);
      saveEntries('chenchen', updated);
      setChenchenEntries(updated);
    }
  }, []);

  const meStats = useMemo(() => ({
    total: meEntries.length,
    thisMonth: meEntries.filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  }), [meEntries]);

  const chenchenStats = useMemo(() => ({
    total: chenchenEntries.length,
    thisMonth: chenchenEntries.filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  }), [chenchenEntries]);

  return {
    meEntries,
    chenchenEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    meStats,
    chenchenStats,
  };
}
