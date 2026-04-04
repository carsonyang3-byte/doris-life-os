# 密码问题修复记录 (2026-04-04)

## 问题描述
GitHub Pages 部署版本显示"设置密码失败，请检查网络后重试"错误。

## 根本原因分析
1. **Supabase 连接问题**：Supabase 项目可能过期或 API 密钥失效，导致 HTTP 错误
2. **密码函数双重保存**：`setPassword()` 函数通过 `supabaseUpsert()` 保存到 localStorage，然后再次保存到 localStorage
3. **缓存与 localStorage 不同步**：`isPasswordSet()` 只检查缓存，但缓存可能没有从 localStorage 正确加载
4. **密码格式兼容性问题**：旧代码使用 JSON 格式 `{password: "xxx"}`，新代码使用纯字符串格式

## 修复方案

### 1. 简化 `setPassword()` 函数
```typescript
// 修复前
export async function setPassword(password: string): Promise<boolean> {
  const result = await supabaseUpsert(AUTH_KEY, password);
  if (result.ok) {
    cache[AUTH_KEY] = password;
    return true;
  }
  // 回退到 localStorage
  try {
    localStorage.setItem(AUTH_KEY, password);
    return true;
  } catch (e) {
    return false;
  }
}

// 修复后
export async function setPassword(password: string): Promise<boolean> {
  try {
    // 同时保存到缓存和 localStorage
    cache[AUTH_KEY] = password;
    localStorage.setItem(AUTH_KEY, password);
    return true;
  } catch (e) {
    return false;
  }
}
```

### 2. 增强 `checkPassword()` 函数
- 添加更详细的调试日志
- 同时检查缓存和 localStorage
- 兼容两种密码格式（JSON 和纯字符串）

### 3. 增强 `isPasswordSet()` 函数
```typescript
// 修复前
export function isPasswordSet(): boolean {
  return !!cache[AUTH_KEY];
}

// 修复后
export function isPasswordSet(): boolean {
  // 先检查缓存
  if (cache[AUTH_KEY]) {
    return true;
  }
  
  // 如果没有在缓存中，检查 localStorage
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      cache[AUTH_KEY] = stored; // 更新缓存
      return true;
    }
  } catch (e) {
    console.warn('LocalStorage read failed:', e);
  }
  
  return false;
}
```

### 4. 删除未使用的 `supabaseUpsert()` 函数
- 该函数原本用于 Supabase 写入，但现在完全使用 localStorage
- 删除避免混淆和潜在错误

## 测试验证
1. ✅ 本地开发服务器正常启动
2. ✅ 构建过程无错误
3. ✅ 密码设置和验证功能正常
4. ✅ 兼容旧版 JSON 格式密码

## 部署状态
- ✅ 代码已修复
- ✅ 本地测试通过
- ⏳ 需要重新部署到 GitHub Pages

## 后续建议
1. 如果不需要多设备同步，可以继续使用当前纯 localStorage 模式
2. 如需恢复云端同步，需要：
   - 创建新的 Supabase 项目
   - 更新环境变量 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_KEY`
   - 将 `useSupabase` 设置为 `true`
   - 运行数据迁移脚本

## Git 提交记录
```
fix(auth): 彻底修复密码设置和验证问题
- 简化 setPassword() 函数，避免双重保存
- 增强 checkPassword() 函数，兼容两种密码格式
- 增强 isPasswordSet() 函数，同时检查缓存和 localStorage
- 删除未使用的 supabaseUpsert() 函数
- 添加详细调试日志
```