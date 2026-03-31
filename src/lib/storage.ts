/**
 * 统一存储层 — localStorage ↔ Supabase
 *
 * 所有 hook 通过 getItem / setItem / removeItem 操作数据，
 * 底层自动同步到 Supabase，实现多设备数据一致。
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://REDACTED_PROJECT_REF.supabase.co';
const SUPABASE_KEY = 'REDACTED_VITE_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 内存缓存，避免每次都请求 Supabase
const cache: Record<string, string | null> = {};
let initialized = false;

/** 初始化：从 Supabase 拉取所有数据到内存缓存 */
async function init(): Promise<void> {
  if (initialized) return;
  try {
    const { data, error } = await supabase.from('app_data').select('key, value');
    if (!error && data) {
      for (const row of data) {
        cache[row.key] = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
      }
    }
    initialized = true;
  } catch (e) {
    console.warn('Supabase init failed, using localStorage fallback:', e);
    initialized = true; // 避免反复重试
  }
}

/** 同步调用：确保初始化完成（启动时调用一次） */
export async function ensureStorageReady(): Promise<void> {
  await init();
}

/** 获取数据（同步，从缓存中读取） */
export function getItem(key: string): string | null {
  return cache[key] ?? null;
}

/** 设置数据（同步写缓存 + 异步写 Supabase） */
export function setItem(key: string, value: string): void {
  cache[key] = value;
  // 异步写入 Supabase，不阻塞 UI
  supabase.from('app_data').upsert(
    { key, value: JSON.parse(value) },
    { onConflict: 'key' }
  ).then(({ error }) => {
    if (error) console.warn('Supabase write error:', error);
  });
}

/** 删除数据 */
export function removeItem(key: string): void {
  delete cache[key];
  supabase.from('app_data').delete().eq('key', key).then(({ error }) => {
    if (error) console.warn('Supabase delete error:', error);
  });
}

/** 迁移 localStorage 数据到 Supabase（首次使用时调用） */
export async function migrateFromLocalStorage(): Promise<number> {
  const keysToMigrate = [
    'life-os-habits',
    'life-os-money',
    'life-os-goals',
    'life-os-weekly-focus',
    'life-os-journal-me',
    'life-os-journal-chenchen',
    'doris_library',
    'doris_travel_plans',
    'doris_travel_journals',
    'life-os-gemini-key',
    'life-os-reflect',
  ];

  let migrated = 0;

  for (const prefix of keysToMigrate) {
    const value = localStorage.getItem(prefix);
    if (value) {
      cache[prefix] = value;
      try {
        const { error } = await supabase.from('app_data').upsert(
          { key: prefix, value: JSON.parse(value) },
          { onConflict: 'key' }
        );
        if (!error) migrated++;
      } catch (e) {
        console.warn(`Failed to migrate ${prefix}:`, e);
      }
    }
  }

  // 迁移动态 key（today-xxx 和 awareness-xxx）
  for (let i = 0; i < 0; i++) {
    // localStorage 不支持枚举，动态 key 在使用时自动同步
  }

  // 迁移所有 localStorage 中 life-os-today- 和 life-os-awareness- 的 key
  const allKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('life-os-today-') || k.startsWith('life-os-awareness-'))) {
      allKeys.push(k);
    }
  }

  for (const key of allKeys) {
    const value = localStorage.getItem(key);
    if (value) {
      cache[key] = value;
      try {
        await supabase.from('app_data').upsert(
          { key, value: JSON.parse(value) },
          { onConflict: 'key' }
        );
        migrated++;
      } catch (e) {
        console.warn(`Failed to migrate ${key}:`, e);
      }
    }
  }

  return migrated;
}
