# 密码问题修复备份文档

## 备份信息
- **备份标签**: `password-fix-stable`
- **创建时间**: 2026年4月5日 20:42
- **Git提交**: 当前 `main` 分支最新提交
- **问题状态**: 密码刷新问题已修复

## 问题描述
**现象**: 用户第一次设置密码后能正常登录，但刷新页面后显示密码错误。

**根因分析**:
1. `setPassword()` 函数没有设置本地时间戳
2. 页面刷新后，`mergeFromCloudAsync()` 异步执行
3. 云端可能有旧的 `__auth_password__` 记录（如 `[object Object]` 脏数据）
4. 由于没有本地时间戳，代码认为"这是从其他设备创建的"
5. 云端数据覆盖了刚设置的密码

## 修复方案

### 1. 核心修复：添加本地时间戳
修改 `src/lib/storage.ts` 中的 `setPassword()` 函数：

```typescript
/** 设置密码（首次使用时） */
export async function setPassword(password: string): Promise<boolean> {
  cache[AUTH_KEY] = password;
  localStorage.setItem(AUTH_KEY, password);
  // 关键：设置本地时间戳，防止被云端数据覆盖
  setLocalTimestamp(AUTH_KEY);
  return true;
}
```

### 2. 保护层：过滤 `__` 开头的 key
在 `mergeFromCloudAsync()` 中添加过滤逻辑：

```typescript
// 跳过 __ 开头的内部 key（如密码）
if (key.startsWith('__')) {
  console.log(`[merge] Skipping internal key: ${key}`);
  continue;
}
```

### 3. 脏数据清理
在 `checkPassword()` 中添加脏数据检测：

```typescript
/** 检查密码是否正确 */
export async function checkPassword(password: string): Promise<boolean> {
  const stored = localStorage.getItem(AUTH_KEY);
  // 清理可能的脏数据
  if (stored === '[object Object]' || stored === 'null' || stored === 'undefined') {
    localStorage.removeItem(AUTH_KEY);
    return false;
  }
  return stored === password;
}
```

## 技术原理

### 时间戳机制
- 每个 key 都有对应的本地时间戳：`__ts__${key}`
- 合并决策基于时间戳比较：
  - 本地时间戳 > 云端时间戳 → 使用本地数据
  - 本地时间戳 < 云端时间戳 → 使用云端数据
  - 无本地时间戳 → 使用云端数据（问题所在）

### 修复后的决策流程
1. `setPassword("160508")` → 设置密码 + 时间戳
2. 页面刷新 → `init()` → `mergeFromCloudAsync()`
3. 时间戳比较：
   - `localTs = "2026-04-05T20:25:00.000Z"`（刚设置）
   - `cloudTs = "2026-04-05T19:00:00.000Z"`（旧的）
   - `cloudTs > localTs` = false → 保持本地密码

## 恢复指南

### 如果未来再次出现密码问题
1. **检查当前版本**:
   ```bash
   git tag --list
   git log --oneline -5
   ```

2. **恢复到备份点**:
   ```bash
   git checkout password-fix-stable
   ```

3. **重新构建**:
   ```bash
   npm run build
   ```

4. **测试密码功能**:
   - 清除浏览器本地存储
   - 设置新密码
   - 刷新页面验证

### 调试步骤
1. 打开浏览器控制台 (F12)
2. 查看 `mergeFromCloudAsync` 日志
3. 检查时间戳值：
   ```javascript
   localStorage.getItem('__ts____auth_password__')
   ```

## 相关文件
- `src/lib/storage.ts` - 存储层实现
- `src/components/PasswordModal.tsx` - 密码设置界面
- `src/pages/DashboardPage.tsx` - 密码检查入口

## 经验总结
1. **所有 setItem 操作必须设置时间戳**，否则会被云端数据覆盖
2. **内部 key（`__` 开头）需要特殊处理**，避免同步冲突
3. **脏数据清理很重要**，防止 `[object Object]` 等异常值
4. **测试要覆盖刷新场景**，确保异步合并不影响功能

## 部署状态
- ✅ 代码已提交到 `main` 分支
- ✅ 标签已推送到远程仓库
- ✅ GitHub Actions 部署中 (#28)
- ✅ 测试地址: https://carsonyang3-byte.github.io/doris-life-os/

---

*文档更新时间: 2026-04-05 20:42*  
*备份标签: password-fix-stable*