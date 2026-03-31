import { useState, useEffect, useMemo } from 'react';
import type { LibraryItem } from '../types';
import { getItem, setItem } from '../lib/storage';

const STORAGE_KEY = 'doris_library';

export function useLibrary() {
  const [items, setItems] = useState<LibraryItem[]>(() => {
    try {
      const saved = getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<LibraryItem, 'id'>) => {
    const id = Date.now();
    setItems((prev) => [{ ...item, id }, ...prev]);
  };

  const updateItem = (id: number, updates: Partial<LibraryItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 批量导入
  const addItems = (newItems: Omit<LibraryItem, 'id'>[]) => {
    const baseId = Date.now();
    const itemsWithIds = newItems.map((item, i) => ({
      ...item,
      id: baseId + i,
    }));
    setItems((prev) => [...itemsWithIds, ...prev]);
  };

  const byType = useMemo(() => {
    const result: Record<string, LibraryItem[]> = {
      book: [],
      movie: [],
      blog: [],
      podcast: [],
    };
    items.forEach((item) => {
      if (result[item.type]) result[item.type].push(item);
    });
    return result;
  }, [items]);

  const stats = useMemo(() => ({
    total: items.length,
    books: items.filter((i) => i.type === 'book').length,
    movies: items.filter((i) => i.type === 'movie').length,
    blogs: items.filter((i) => i.type === 'blog').length,
    podcasts: items.filter((i) => i.type === 'podcast').length,
    completed: items.filter((i) => i.status === 'completed').length,
    reading: items.filter((i) => i.status === 'reading' || i.status === 'in_progress').length,
  }), [items]);

  return { items, addItem, addItems, updateItem, deleteItem, byType, stats };
}
