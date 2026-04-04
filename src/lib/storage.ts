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
  // 先从缓存读取
  let stored = cache[AUTH_KEY];
  
  // 如果缓存没有，尝试从 localStorage 读取
  if (!stored) {
    try {
      stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        cache[AUTH_KEY] = stored;
      }
    } catch (e) {
      console.warn('LocalStorage read failed:', e);
    }
  }
  
  if (!stored) return false;
  
  console.log('Checking password, stored value:', stored);
  console.log('Input password:', input);
  
  // 存储的可能是纯字符串密码，也可能是旧版 JSON 格式
  try {
    const parsed = JSON.parse(stored);
    console.log('Parsed as JSON:', parsed);
    return parsed.password === input;
  } catch {
    // 不是 JSON，直接当字符串比较
    console.log('Compared as strings:', stored === input);
    return stored === input;
  }
}

/** 设置密码（首次使用时） */
export async function setPassword(password: string): Promise<boolean> {
  const result = await supabaseUpsert(AUTH_KEY, password);
  if (result.ok) {
    cache[AUTH_KEY] = password;
    console.log('Password saved successfully');
    return true;
  }
  console.error('SetPassword failed:', result.error);
  // 如果写入失败，也保存到 localStorage 作为回退
  try {
    localStorage.setItem(AUTH_KEY, password);
    return true;
  } catch (e) {
    console.error('LocalStorage fallback also failed:', e);
    return false;
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

// 暂时禁用 Supabase，使用 localStorage 回退
const useSupabase = false; // !!(SUPABASE_URL && SUPABASE_KEY);

if (useSupabase) {
  console.log('Supabase connected:', SUPABASE_URL);
} else {
  console.warn('Supabase not configured, using localStorage fallback');
}

const supabase = useSupabase ? createClient(SUPABASE_URL!, SUPABASE_KEY!) : null;

/** 直接用 fetch 调 Supabase REST API 写入（绕过 SDK 可能的序列化问题） */
async function supabaseUpsert(key: string, value: unknown): Promise<{ ok: boolean; error?: string }> {
  // 暂时完全使用 localStorage
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// 内存缓存，避免每次都请求 Supabase
const cache: Record<string, string | null> = {};
let initialized = false;

/** 初始化：从 localStorage 加载数据到内存缓存 */
async function init(): Promise<void> {
  if (initialized) return;
  try {
    // 从 localStorage 加载数据
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          cache[key] = value;
        }
      }
    }
    initialized = true;
  } catch (e) {
    console.warn('LocalStorage init failed:', e);
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

/** 设置数据（同步写缓存 + localStorage） */
export function setItem(key: string, value: string): void {
  cache[key] = value;
  // 同步写 localStorage 作为备用
  try { localStorage.setItem(key, value); } catch {}
  // 暂时禁用 Supabase 写入
}

/** 删除数据 */
export function removeItem(key: string): void {
  delete cache[key];
  try { localStorage.removeItem(key); } catch {}
  // 暂时禁用 Supabase 删除
}

/** 迁移 localStorage 数据到缓存（首次使用时调用） */
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
      migrated++;
    }
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
      migrated++;
    }
  }

  return migrated;
}
