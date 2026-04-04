const AUTH_KEY = '__auth_password__';
const SESSION_KEY = '__auth_session__';

/**
 * 密码管理
 * 密码存在 Supabase app_data 表中，key 为 AUTH_KEY
 * 登录状态用 sessionStorage 保持（关闭浏览器需重新输入）
 */

/** 检查是否已设置密码（需要等 storage 初始化完成） */
export function isPasswordSet(): boolean {
  console.log('isPasswordSet called');
  console.log('AUTH_KEY:', AUTH_KEY);
  console.log('cache[AUTH_KEY]:', cache[AUTH_KEY]);
  
  // 先检查缓存
  if (cache[AUTH_KEY]) {
    console.log('Password found in cache');
    return true;
  }
  
  // 如果没有在缓存中，检查 localStorage
  try {
    console.log('Checking localStorage for key:', AUTH_KEY);
    const stored = localStorage.getItem(AUTH_KEY);
    console.log('localStorage.getItem result:', stored);
    if (stored) {
      cache[AUTH_KEY] = stored; // 更新缓存
      console.log('Updated cache, password is set');
      return true;
    } else {
      console.log('No password found in localStorage');
    }
  } catch (e) {
    console.warn('LocalStorage read in isPasswordSet failed:', e);
  }
  
  console.log('Password not set');
  return false;
}

/** 验证密码是否正确 */
export async function checkPassword(input: string): Promise<boolean> {
  console.log('checkPassword called with input:', input);
  console.log('AUTH_KEY:', AUTH_KEY);
  console.log('cache[AUTH_KEY]:', cache[AUTH_KEY]);
  
  // 先从缓存读取
  let stored = cache[AUTH_KEY];
  
  // 如果缓存没有，尝试从 localStorage 读取
  if (!stored) {
    try {
      console.log('Checking localStorage for key:', AUTH_KEY);
      stored = localStorage.getItem(AUTH_KEY);
      console.log('localStorage.getItem result:', stored);
      if (stored) {
        cache[AUTH_KEY] = stored;
        console.log('Updated cache with localStorage value');
      }
    } catch (e) {
      console.warn('LocalStorage read failed:', e);
    }
  }
  
  if (!stored) {
    console.log('No password found in cache or localStorage');
    // 检查 localStorage 中所有键
    try {
      console.log('All localStorage keys:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`  ${key}: ${localStorage.getItem(key)?.substring(0, 20)}...`);
      }
    } catch (e) {
      console.log('Cannot list localStorage:', e);
    }
    return false;
  }
  
  console.log('Checking password, stored value:', stored, 'input:', input);
  
  // 存储的可能是纯字符串密码，也可能是旧版 JSON 格式
  try {
    const parsed = JSON.parse(stored);
    console.log('Parsed as JSON:', parsed);
    // 检查是否是旧版格式 { password: "xxx" }
    if (parsed && typeof parsed === 'object' && parsed.password) {
      const match = parsed.password === input;
      console.log('Compared JSON password, match:', match);
      return match;
    }
    // 如果不是标准格式，尝试直接比较
    const match = String(parsed) === input;
    console.log('Compared as stringified JSON, match:', match);
    return match;
  } catch {
    // 不是 JSON，直接当字符串比较
    const match = stored === input;
    console.log('Compared as strings, match:', match);
    return match;
  }
}

/** 设置密码（首次使用时） */
export async function setPassword(password: string): Promise<boolean> {
  cache[AUTH_KEY] = password;
  localStorage.setItem(AUTH_KEY, password);
  return true;
}

/** 设置/检查 sessionStorage 登录状态 */
export function setSession(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());
    } else {
      console.warn('sessionStorage is not available, using memory session');
      // 在内存中模拟 session
      cache[SESSION_KEY] = Date.now().toString();
    }
  } catch (e) {
    console.warn('Failed to set session:', e);
    // 即使 sessionStorage 失败，也继续
  }
}

export function hasSession(): boolean {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return !!sessionStorage.getItem(SESSION_KEY);
    } else {
      // 检查内存中的 session
      return !!cache[SESSION_KEY];
    }
  } catch (e) {
    console.warn('Failed to check session:', e);
    return false;
  }
}

/** 清除登录状态 */
export function clearSession(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
    }
    // 同时清除内存中的 session
    delete cache[SESSION_KEY];
  } catch (e) {
    console.warn('Failed to clear session:', e);
  }
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
