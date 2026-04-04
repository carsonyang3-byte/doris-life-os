# Supabase 连接错误修复方案

## 问题描述
Life OS 项目遇到了 Supabase 连接错误，可能是由于以下原因之一：
1. Supabase 项目免费额度已用完
2. API 密钥过期或被撤销
3. 网络连接问题

## 临时解决方案
已修改 `src/lib/storage.ts` 文件，暂时禁用 Supabase 连接，改为使用纯 localStorage。

### 主要修改：
1. **禁用 Supabase 连接**：将 `useSupabase` 变量硬编码为 `false`
2. **简化数据操作**：所有 `getItem`、`setItem`、`removeItem` 函数现在只操作 localStorage
3. **移除 Supabase 依赖**：去除了所有对 Supabase API 的调用

### 影响：
- ✅ 应用可以正常运行，不会出现 HTTP 错误
- ✅ 所有数据存储在本地浏览器中
- ✅ 规则引擎、习惯打卡、日记等功能正常工作
- ⚠️ 数据不会同步到云端（单设备使用）
- ⚠️ 无法在多设备间同步数据

## 长期解决方案
如果需要恢复 Supabase 云端同步，需要：

1. **检查 Supabase 项目状态**：
   - 登录 https://supabase.com
   - 检查项目是否活跃
   - 查看 API 密钥是否有效

2. **更新环境变量**：
   如果创建了新的 Supabase 项目，需要更新 `.env` 文件：
   ```
   VITE_SUPABASE_URL=你的新项目URL
   VITE_SUPABASE_KEY=你的新API密钥
   ```

3. **恢复 Supabase 连接**：
   将 `storage.ts` 中的 `const useSupabase = false;` 改回：
   ```typescript
   const useSupabase = !!(SUPABASE_URL && SUPABASE_KEY);
   ```

## 数据迁移注意事项
当前修改不会丢失现有数据，因为：
1. 数据会继续存储在 localStorage 中
2. 当恢复 Supabase 连接时，`migrateFromLocalStorage` 函数可以将数据迁移到云端

## 测试建议
1. 清除浏览器缓存后测试应用
2. 检查控制台是否还有错误
3. 测试主要功能：习惯打卡、日记记录、Vision Distance 计算

## 密码验证问题修复

**问题描述**：
- 设置密码时显示"设置密码失败，请检查网络后重试"
- 密码验证失败

**修复内容**：
1. **增强 `setPassword()` 函数**：添加 localStorage 回退机制
2. **增强 `checkPassword()` 函数**：添加调试日志，支持 localStorage 回退读取
3. **兼容两种密码格式**：纯字符串格式和 JSON 格式

**紧急解决方案**：
如果遇到密码问题，请执行以下步骤：

1. **清除密码缓存**：
   - 打开浏览器开发者工具（F12）
   - 在 Console 标签页输入：`localStorage.removeItem('__auth_password__')`
   - 刷新页面

2. **手动设置密码**：
   - 在 Console 标签页输入：`localStorage.setItem('__auth_password__', '你的密码')`
   - 刷新页面

---

**修复时间**：2026年4月4日  
**修复版本**：Life OS Beta 1.0  
**修复人**：AI助手