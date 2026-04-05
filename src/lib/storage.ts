const AUTH_KEY = '__auth_password__';
const SESSION_KEY = '__auth_session__';

// 内存缓存，避免每次都请求 Supabase
const cache: Record<string, string | null> = {};

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

// 检测是否在 GitHub Pages 上运行
const isGitHubPagesEnv = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

// 启用 Supabase 云端同步（GitHub Pages 上禁用，避免数据覆盖问题）
const useSupabase = !!(SUPABASE_URL && SUPABASE_KEY) && !isGitHubPagesEnv;

if (useSupabase) {
  console.log('Supabase connected:', SUPABASE_URL);
} else {
  console.warn('Supabase not configured, using localStorage fallback');
}

const supabase = useSupabase ? createClient(SUPABASE_URL!, SUPABASE_KEY!) : null;



let initialized = false;

/** 初始化：从云端加载数据到内存缓存 */
async function init(): Promise<void> {
  if (initialized) return;
  
  try {
    // 1. 先尝试从云端加载数据（5秒超时，避免网络问题导致永久卡住）
    if (useSupabase && supabase) {
      try {
        const fetchPromise = supabase
          .from('app_data')
          .select('key, value')
          .eq('user_id', 'default_user');

        const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error('Supabase timeout after 5s') }), 5000)
        );

        const result = await Promise.race([fetchPromise, timeoutPromise]);
        const { data, error } = result;

        if (!error && data) {
          console.log(`Loaded ${data.length} items from Supabase`);
          for (const item of data) {
            if (item.key && item.value !== null) {
              cache[item.key] = item.value;
              // 同时更新 localStorage 作为备份
              try {
                localStorage.setItem(item.key, item.value);
              } catch (e) {
                console.warn('Failed to update localStorage for key:', item.key, e);
              }
            }
          }
        } else if (error) {
          console.warn('Supabase load failed, using localStorage:', error.message);
        }
      } catch (supabaseError) {
        console.warn('Supabase connection failed, falling back to localStorage:', supabaseError);
      }
    }
    
    // 2. 如果云端没有或失败，从 localStorage 加载
    if (Object.keys(cache).length === 0) {
      console.log('No data from Supabase, loading from localStorage');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            cache[key] = value;
          }
        }
      }
    }
    
    initialized = true;
    console.log(`Storage initialized with ${Object.keys(cache).length} items`);
  } catch (e) {
    console.warn('Storage init failed:', e);
    initialized = true; // 避免反复重试
  }
}

/** 同步调用：确保初始化完成（启动时调用一次） */
export async function ensureStorageReady(): Promise<void> {
  // GitHub Pages 上也使用标准初始化流程（Supabase 已在上面禁用）
  await init();
}

/** 获取数据（同步，从缓存中读取） */
export function getItem(key: string): string | null {
  return cache[key] ?? null;
}

/** 从云端刷新数据（用于手动同步） */
export async function refreshFromCloud(): Promise<void> {
  if (!useSupabase || !supabase) {
    console.log('Supabase not configured, cannot refresh from cloud');
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('key, value')
      .eq('user_id', 'default_user');
      
    if (!error && data) {
      console.log(`Refreshed ${data.length} items from cloud`);
      for (const item of data) {
        if (item.key && item.value !== null) {
          cache[item.key] = item.value;
          // 更新 localStorage
          try {
            localStorage.setItem(item.key, item.value);
          } catch (e) {
            console.warn('Failed to update localStorage for key:', item.key, e);
          }
        }
      }
      // 更新最后同步时间
      const now = new Date().toLocaleString('zh-CN');
      try {
        localStorage.setItem('last_sync_time', now);
        console.log('Updated last_sync_time after refresh to:', now);
      } catch (e) {
        console.warn('Failed to update last_sync_time in localStorage:', e);
      }
    } else if (error) {
      console.warn('Failed to refresh from cloud:', error.message);
    }
  } catch (e) {
    console.warn('Refresh from cloud failed:', e);
  }
}

/** 导出所有数据为 JSON（用于备份或迁移） */
export async function exportAllData(): Promise<Record<string, string>> {
  // 优先从缓存获取最新数据
  return { ...cache };
}

/** 导入数据（用于恢复或迁移） */
export async function importData(data: Record<string, string>): Promise<number> {
  let imported = 0;
  
  for (const [key, value] of Object.entries(data)) {
    if (key && value !== undefined) {
      setItem(key, value); // 同步调用，后台异步同步到云端
      imported++;
    }
  }
  
  console.log(`Imported ${imported} items from backup`);
  return imported;
}

/** 设置数据（同步写缓存 + localStorage，异步同步到云端） */
export function setItem(key: string, value: string): void {
  cache[key] = value;
  
  // 1. 同步写 localStorage 作为备份
  try { 
    localStorage.setItem(key, value); 
  } catch (e) {
    console.warn('Failed to write to localStorage for key:', key, e);
  }
  
  // 2. 异步同步到云端（不阻塞UI）
  syncToCloud(key, value).catch(error => {
    console.warn('Background sync failed for key:', key, error);
  });
}

/** 异步同步到云端（后台任务） */
async function syncToCloud(key: string, value: string): Promise<void> {
  if (!useSupabase || !supabase) return;

  try {
    // 在 GitHub Pages 上，也尝试同步到云端
    const { error } = await supabase
      .from('app_data')
      .upsert({
        user_id: 'default_user',
        key,
        value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,key'
      });
      
    if (error) {
      console.warn('Failed to sync to Supabase for key:', key, error.message);
    } else {
      console.log('Synced to Supabase for key:', key);
      // 自动更新最后同步时间
      const now = new Date().toLocaleString('zh-CN');
      try {
        localStorage.setItem('last_sync_time', now);
        console.log('Updated last_sync_time to:', now);
      } catch (e) {
        console.warn('Failed to update last_sync_time in localStorage:', e);
      }
    }
  } catch (e) {
    console.warn('Supabase sync failed for key:', key, e);
  }
}

/** 删除数据 */
export function removeItem(key: string): void {
  delete cache[key];
  
  // 1. 删除 localStorage 备份
  try { 
    localStorage.removeItem(key); 
  } catch (e) {
    console.warn('Failed to remove from localStorage for key:', key, e);
  }
  
  // 2. 异步从云端删除（不阻塞UI）
  deleteFromCloud(key).catch(error => {
    console.warn('Background delete failed for key:', key, error);
  });
}

/** 异步从云端删除（后台任务） */
async function deleteFromCloud(key: string): Promise<void> {
  if (!useSupabase || !supabase) return;
  
  try {
    const { error } = await supabase
      .from('app_data')
      .delete()
      .eq('user_id', 'default_user')
      .eq('key', key);
      
    if (error) {
      console.warn('Failed to delete from Supabase for key:', key, error.message);
    } else {
      console.log('Deleted from Supabase for key:', key);
    }
  } catch (e) {
    console.warn('Supabase delete failed for key:', key, e);
  }
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

/** 判断云端数据是否比本地数据更新（简单实现） */
function isCloudDataNewer(key: string, cloudUpdatedAt: string): boolean {
  // 这里简单实现：总是返回true，因为云端数据通常应该更可靠
  // 在实际应用中，可以比较时间戳，但这里简化处理
  return true;
}
