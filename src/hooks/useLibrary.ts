import { useState, useEffect, useMemo, useCallback } from 'react';
import type { LibraryItem, WereadHighlightEntry } from '../types';
import type { WereadImportPayload, WereadBookPayload } from '../lib/wereadApi';
import { getItem, setItem } from '../lib/storage';
import { formatDate } from '../lib/utils';

const STORAGE_KEY = 'doris_library';

function mergeHighlights(
  existing: WereadHighlightEntry[] | undefined,
  incoming: WereadHighlightEntry[]
): WereadHighlightEntry[] {
  const seen = new Set<string>();
  const out: WereadHighlightEntry[] = [];
  for (const h of [...(existing ?? []), ...incoming]) {
    const k = h.text.slice(0, 300);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(h);
  }
  return out;
}

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

  const upsertWereadImports = useCallback((payloads: WereadImportPayload[]) => {
    const today = formatDate(new Date());
    setItems((prev) => {
      const next = [...prev];
      const newItems: LibraryItem[] = [];
      let nid = Date.now();
      for (const p of payloads) {
        const idx = next.findIndex(
          (i) => i.wereadBookId === p.bookId || (i.type === 'book' && i.title === p.title && !!p.title)
        );
        const merged = mergeHighlights(idx >= 0 ? next[idx].wereadHighlights : undefined, p.highlights);
        const notePreview =
          `微信读书 · ${merged.length} 条划线\n` + merged.slice(0, 4).map((h) => h.text).join('\n');
        if (idx >= 0) {
          const cur = next[idx];
          next[idx] = {
            ...cur,
            wereadBookId: p.bookId,
            creator: p.author || cur.creator,
            wereadHighlights: merged,
            note: notePreview + (merged.length > 4 ? '\n…' : ''),
            date: cur.date || today,
          };
        } else {
          nid += 1;
          newItems.push({
            id: nid,
            type: 'book',
            title: p.title,
            creator: p.author,
            date: today,
            rating: 0,
            status: 'reading',
            note: notePreview + (merged.length > 4 ? '\n…' : ''),
            wereadBookId: p.bookId,
            wereadHighlights: merged,
          });
        }
      }
      return [...newItems, ...next];
    });
  }, []);

  /** 从微信读书书架同步已读书目（不含划线） */
  const upsertWereadBooks = useCallback((books: WereadBookPayload[]) => {
    const today = formatDate(new Date());
    setItems((prev) => {
      const next = [...prev];
      const newItems: LibraryItem[] = [];
      let nid = Date.now();
      let newCount = 0;
      let updateCount = 0;

      for (const b of books) {
        // 映射微信读书状态到 LibraryItem 状态
        // 1-在读 2-读完 3-想读 4-暂停
        let itemStatus: LibraryItem['status'];
        if (b.readStatus === 2) itemStatus = 'completed';
        else if (b.readStatus === 4) itemStatus = 'abandoned';
        else itemStatus = 'reading';

        const idx = next.findIndex(
          (i) => i.wereadBookId === b.bookId || (i.type === 'book' && i.title === b.title && !!b.title)
        );

        if (idx >= 0) {
          // 已存在 → 更新状态和作者
          const cur = next[idx];
          next[idx] = {
            ...cur,
            type: 'book',
            creator: b.author || cur.creator,
            wereadBookId: b.bookId,
            category: b.category || cur.category,
            date: cur.date || today,
            finishedDate: itemStatus === 'completed' ? (cur.finishedDate || today) : undefined,
            status: cur.status === 'completed' ? 'completed' : itemStatus,
          };
          updateCount++;
        } else {
          nid += 1;
          newItems.push({
            id: nid,
            type: 'book',
            title: b.title,
            creator: b.author,
            date: today,
            rating: 0,
            status: itemStatus,
            wereadBookId: b.bookId,
            category: b.category,
            finishedDate: itemStatus === 'completed' ? today : undefined,
          });
          newCount++;
        }
      }

      console.log(`📚 书库同步完成: ${newCount} 本新书, ${updateCount} 本更新`);
      return [...newItems, ...next];
    });
    return { newCount: 0, updateCount: 0 }; // 实际数量在 setItems callback 里
  }, []);

  return { items, addItem, addItems, updateItem, deleteItem, byType, stats, upsertWereadImports, upsertWereadBooks };
}
