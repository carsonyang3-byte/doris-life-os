import { useState, useCallback } from 'react';
import type { WeeklyFocus } from '../types';
import { DIMENSIONS } from '../lib/constants';
import { getItem, setItem } from '../lib/storage';

const FOCUS_KEY = 'life-os-weekly-focus';

function loadFocus(): WeeklyFocus {
  try {
    return JSON.parse(getItem(FOCUS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function useWeeklyFocus() {
  const [focus, setFocus] = useState<WeeklyFocus>(loadFocus);

  const updateFocus = useCallback((key: string, value: string) => {
    const updated = { ...loadFocus(), [key]: value };
    setItem(FOCUS_KEY, JSON.stringify(updated));
    setFocus(updated);
  }, []);

  return { focus, dimensions: DIMENSIONS, updateFocus };
}
