const AUTH_KEY = '__auth_password__';
const SESSION_KEY = '__auth_session__';
const LOCAL_TS_PREFIX = '__local_ts_'; // 本地修改时间戳前缀

// 内存缓存，避免每次都请求 Supabase
const cache: Record<string, string | null> = {};

/**
 * 密码管理
 * 密码存在 Supabase app_data 表中，key 为 AUTH_KEY
 * 登录状态用 sessionStorage 保持（关闭浏览器需重新输入）
 */

/** 检查是否已设置密码（需要等 storage 初始化完成） */
export function isPasswordSet(): boolean {
  if (cache[AUTH_KEY]) return true;
  
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      cache[AUTH_KEY] = stored;
      return true;
    }
  } catch (e) {
    console.warn('LocalStorage read in isPasswordSet failed:', e);
  }
  
  return false;
}

/** 验证密码是否正确 */
export async function checkPassword(input: string): Promise<boolean> {
  let stored = cache[AUTH_KEY];
  
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
  
  if (!stored) {
    console.warn('!!! PASSWORD NOT FOUND IN LOCAL STORAGE !!! key:', AUTH_KEY);
    return false;
  }
  
  // 检测脏数据：如果存的是 "[object Object]"，说明被云端同步损坏了，清除它
  if (stored === '[object Object]' || (stored.startsWith('[') && stored.endsWith(']'))) {
    console.warn('!!! CORRUPTED PASSWORD DATA DETECTED, clearing !!!');
    localStorage.removeItem(AUTH_KEY);
    delete cache[AUTH_KEY];
    return false;
  }
  
  try {
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object' && parsed.password) {
      return parsed.password === input;
    }
    return String(parsed) === input;
  } catch {
    return stored === input;
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
      cache[SESSION_KEY] = Date.now().toString();
    }
  } catch (e) {
    console.warn('Failed to set session:', e);
  }
}

export function hasSession(): boolean {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return !!sessionStorage.getItem(SESSION_KEY);
    }
    return !!cache[SESSION_KEY];
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
    delete cache[SESSION_KEY];
  } catch (e) {
    console.warn('Failed to clear session:', e);
  }
}

/**
 * 统一存储层 — localStorage ↔ Supabase
 *
 * 同步策略：
 * - 启动时：先加载 localStorage（立即可用），再异步从云端合并
 * - 写入时：同步写本地 + 异步推送云端（带时间戳）
 * - 冲突解决：last-write-wins based on updated_at timestamp
 * - 云端数据只在 updated_at 更新于本地修改时间时才覆盖本地
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

// 始终启用 Supabase（除非环境变量没配置）
const useSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

if (useSupabase) {
  console.log('Supabase connected:', SUPABASE_URL);
} else {
  console.warn('Supabase not configured, using localStorage only');
}

const supabase = useSupabase ? createClient(SUPABASE_URL!, SUPABASE_KEY!) : null;

let initialized = false;

/** 获取某个 key 的本地修改时间戳 */
function getLocalTimestamp(key: string): string | null {
  try {
    return localStorage.getItem(LOCAL_TS_PREFIX + key);
  } catch {
    return null;
  }
}

/** 设置某个 key 的本地修改时间戳 */
function setLocalTimestamp(key: string): void {
  try {
    localStorage.setItem(LOCAL_TS_PREFIX + key, new Date().toISOString());
  } catch {
    // ignore
  }
}

/** 初始化：先加载 localStorage（立即可用），再异步合并云端数据 */
async function init(): Promise<void> {
  if (initialized) return;
  
  try {
    // 第一步：始终先从 localStorage 加载到缓存（确保页面立即可用）
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith('__')) { // 跳过内部键和时间戳
        const value = localStorage.getItem(key);
        if (value !== null) {
          cache[key] = value;
        }
      }
    }
    
    initialized = true; // 标记为已初始化，让应用可以开始工作
    console.log(`Storage initialized with ${Object.keys(cache).length} items from localStorage`);
    
    // 第二步：异步从云端拉取并智能合并（不阻塞 UI）
    if (useSupabase && supabase) {
      mergeFromCloudAsync();
    }
  } catch (e) {
    console.warn('Storage init failed:', e);
    initialized = true;
  }
}

/** 异步从云端合并数据（后台任务） */
async function mergeFromCloudAsync(): Promise<void> {
  try {
    console.log('=== Starting async cloud merge... ===');
    console.log('useSupabase:', useSupabase, 'supabase exists:', !!supabase);
    
    if (!supabase) {
      console.warn('mergeFromCloudAsync: supabase client is null!');
      return;
    }
    
    console.log('=== Sending request to Supabase ===');
    
    const fetchPromise = supabase
      .from('app_data')
      .select('key, value, updated_at');

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Cloud merge timeout after 5s') }), 5000)
    );

    const result = await Promise.race([fetchPromise, timeoutPromise]);
    const { data, error } = result;

    console.log('=== Supabase response ===', { error: error?.message, dataCount: data?.length });

    if (error || !data) {
      console.warn('Cloud merge failed:', error?.message);
      return;
    }

    console.log(`Cloud merge: received ${data.length} items`);
    
    let mergedCount = 0;
    let skippedCount = 0;

    for (const item of data) {
      if (!item.key || item.value === null) continue;
      
      // 跳过内部键（密码、时间戳等），这些不应该从云端同步
      if (item.key.startsWith('__')) {
        skippedCount++;
        continue;
      }
      
      const localTs = getLocalTimestamp(item.key);
      const cloudTs = item.updated_at;
      
      let shouldUseCloudData = false;
      
      if (!localTs) {
        // 本地没有这个 key 的修改记录，说明是从其他设备创建的 → 用云端的
        shouldUseCloudData = true;
      } else if (cloudTs && cloudTs > localTs) {
        // 云端的时间戳比本地更新 → 用云端的
        shouldUseCloudData = true;
      }
      // 否则：本地数据更新或相同 → 保持本地不变
      
      if (shouldUseCloudData) {
        cache[item.key] = item.value;
        try {
          localStorage.setItem(item.key, item.value);
          // 同步更新本地时间戳为云端时间戳，防止下次又覆盖回来
          if (cloudTs) {
            localStorage.setItem(LOCAL_TS_PREFIX + item.key, cloudTs);
          }
          mergedCount++;
        } catch (e) {
          console.warn('Failed to write cloud data to localStorage for key:', item.key, e);
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`Cloud merge complete: ${mergedCount} merged, ${skippedCount} skipped (local is newer)`);
    
    // 更新最后同步时间
    if (data.length > 0) {
      const now = new Date().toLocaleString('zh-CN');
      try {
        localStorage.setItem('last_sync_time', now);
      } catch {}
    }
  } catch (e) {
    console.warn('Cloud merge exception:', e);
  }
}

/** 确保初始化完成 */
export async function ensureStorageReady(): Promise<void> {
  await init();
}

/** 获取数据（同步，从缓存中读取） */
export function getItem(key: string): string | null {
  return cache[key] ?? null;
}

/** 从云端刷新数据（手动触发，强制以云端为准） */
export async function refreshFromCloud(): Promise<void> {
  if (!useSupabase || !supabase) {
    console.log('Supabase not configured, cannot refresh');
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('key, value, updated_at');
    
    if (error || !data) {
      console.warn('Refresh from cloud failed:', error?.message);
      return;
    }

    console.log(`Manual refresh: ${data.length} items from cloud`);
    
    for (const item of data) {
      if (item.key && item.value !== null) {
        cache[item.key] = item.value;
        try {
          localStorage.setItem(item.key, item.value);
          if (item.updated_at) {
            localStorage.setItem(LOCAL_TS_PREFIX + item.key, item.updated_at);
          }
        } catch (e) {
          console.warn('Failed to update localStorage:', e);
        }
      }
    }

    const now = new Date().toLocaleString('zh-CN');
    try {
      localStorage.setItem('last_sync_time', now);
    } catch {}
  } catch (e) {
    console.warn('Refresh exception:', e);
  }
}

/** 导出所有数据 */
export async function exportAllData(): Promise<Record<string, string>> {
  return { ...cache };
}

/** 导入数据 */
export async function importData(data: Record<string, string>): Promise<number> {
  let imported = 0;
  for (const [key, value] of Object.entries(data)) {
    if (key && value !== undefined) {
      setItem(key, value);
      imported++;
    }
  }
  return imported;
}

/** 设置数据（同步写本地，异步推送云端） */
export function setItem(key: string, value: string): void {
  cache[key] = value;
  
  // 1. 同步写 localStorage
  try { 
    localStorage.setItem(key, value); 
  } catch (e) {
    console.warn('Failed to write to localStorage for key:', key, e);
  }
  
  // 2. 记录本地修改时间戳
  setLocalTimestamp(key);
  
  // 3. 异步推送到云端（不阻塞UI）
  syncToCloud(key, value).catch(error => {
    console.warn('Background sync failed for key:', key, error);
  });
}

/** 推送到云端 */
async function syncToCloud(key: string, value: string): Promise<void> {
  if (!useSupabase || !supabase) return;

  // 不同步内部键（密码、时间戳等）
  if (key.startsWith('__')) return;

  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('app_data')
      .upsert({
        key,
        value,
        updated_at: now
      }, {
        onConflict: 'key'
      });
      
    if (error) {
      console.warn('Sync to cloud failed for key:', key, error.message);
    } else {
      // 同步成功后，更新本地时间戳为云端一致的时间
      try {
        localStorage.setItem(LOCAL_TS_PREFIX + key, now);
      } catch {}
      console.log('Synced to cloud:', key);
      
      // 更新最后同步时间
      const timeStr = new Date().toLocaleString('zh-CN');
      try {
        localStorage.setItem('last_sync_time', timeStr);
      } catch {}
    }
  } catch (e) {
    console.warn('Sync to cloud exception for key:', key, e);
  }
}

/** 删除数据 */
export function removeItem(key: string): void {
  delete cache[key];
  
  try { 
    localStorage.removeItem(key);
    localStorage.removeItem(LOCAL_TS_PREFIX + key);
  } catch (e) {
    console.warn('Failed to remove from localStorage for key:', key, e);
  }
  
  deleteFromCloud(key).catch(error => {
    console.warn('Background delete failed for key:', key, error);
  });
}

/** 从云端删除 */
async function deleteFromCloud(key: string): Promise<void> {
  if (!useSupabase || !supabase) return;
  
  try {
    const { error } = await supabase
      .from('app_data')
      .delete()
      .eq('key', key);
    
    if (error) {
      console.warn('Delete from cloud failed for key:', key, error.message);
    } else {
      console.log('Deleted from cloud:', key);
    }
  } catch (e) {
    console.warn('Delete from cloud exception for key:', key, e);
  }
}

/** 迁移旧版 localStorage 数据到缓存（首次使用时调用） */
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

  // 迁移所有 life-os-today- 和 life-os-awareness- 的 key
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
