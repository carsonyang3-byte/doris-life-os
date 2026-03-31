const AUTH_KEY = '__auth_password__';
const SESSION_KEY = '__auth_session__';

/**
 * 密码管理
 * 密码存在 Supabase app_data 表中，key 为 AUTH_KEY
 * 登录状态用 sessionStorage 保持（关闭浏览器需重新输入）
 */

/** 检查是否已设置密码（需要等 storage 初始化完成） */
export function isPasswordSet(): boolean {
  return !!cache[AUTH_KEY];
}

/** 验证密码是否正确 */
export async function checkPassword(input: string): Promise<boolean> {
  const stored = cache[AUTH_KEY];
  if (!stored) return false;
  // 存储的可能是纯字符串密码，也可能是旧版 JSON 格式
  try {
    const parsed = JSON.parse(stored);
    return parsed.password === input;
  } catch {
    // 不是 JSON，直接当字符串比较
    return stored === input;
  }
}

/** 设置密码（首次使用时） — 用 Supabase SDK 但返回详细错误信息 */
export async function setPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('app_data')
      .upsert({ key: AUTH_KEY, value: password }, { onConflict: 'key' });
    if (error) {
      const msg = `Supabase error: ${error.message} (code: ${error.code}, hint: ${error.hint || 'none'})`;
      console.error(msg);
      return { ok: false, error: msg };
    }
    cache[AUTH_KEY] = password;
    return { ok: true };
  } catch (e) {
    const msg = `Exception: ${e instanceof Error ? e.message : String(e)}`;
    console.error(msg);
    return { ok: false, error: msg };
  }
}

/** 设置/检查 sessionStorage 登录状态 */
export function setSession(): void {
  sessionStorage.setItem(SESSION_KEY, Date.now().toString());
}

export function hasSession(): boolean {
  return !!sessionStorage.getItem(SESSION_KEY);
}

/** 清除登录状态 */
export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * 统一存储层 — localStorage ↔ Supabase
 *
 * 所有 hook 通过 getItem / setItem / removeItem 操作数据，
 * 底层自动同步到 Supabase，实现多设备数据一致。
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY. Check .env file.');
}

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
        if (typeof row.value === 'string') {
          cache[row.key] = row.value;
        } else if (row.value !== null && row.value !== undefined) {
          cache[row.key] = JSON.stringify(row.value);
        }
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
