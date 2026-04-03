# Doris' Life OS — 项目完整交接文档

> 本文档面向未来可能接手此项目的 AI 助手或开发者。阅读本文档后，你应该能够理解项目全貌、避免已知坑点、并独立完成功能迭代和部署。

---

## 1. 项目概况

| 项目 | 说明 |
|------|------|
| 项目名 | Doris' Life OS |
| 定位 | 个人生活管理系统（习惯打卡、日记、记账、目标追踪、觉察反思、阅读管理、旅行规划） |
| 用户 | Doris，40+，广东，国企员工，ISTJ |
| GitHub | https://github.com/carsonyang3-byte/doris-life-os （公开仓库） |
| 线上地址 | https://carsonyang3-byte.github.io/doris-life-os/ |
| 技术栈 | React 19 + Vite 7 + TypeScript 5.9 + Tailwind CSS 3 |
| UI 组件 | shadcn/ui（Radix UI 原语 + CVA） |
| 数据存储 | Supabase（PostgreSQL），表 `app_data`（key-value store，JSONB 列） |
| 部署 | GitHub Pages + GitHub Actions |
| 设计风格 | 温暖米色调（#F7F6F3 背景）、金色强调色（#C9A96E）、衬线字体标题 |

---

## 2. 项目结构

```
doris-life-os/
├── .github/workflows/
│   └── deploy.yml              # CI/CD：构建 + 部署到 GitHub Pages
├── public/
│   └── fonts/                  # 字体文件（如有）
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # 全局布局：Hero Banner + 导航栏 + Footer
│   │   └── ui/                 # shadcn/ui 组件（53个文件，不要手动改）
│   ├── hooks/                  # 业务逻辑 hooks（核心）
│   │   ├── index.ts            # 统一导出
│   │   ├── useHabits.ts        # 习惯打卡
│   │   ├── useToday.ts         # 今日三件事 + 开心小事 + 觉察 + 金句（useQuotes）
│   │   ├── useWeeklyFocus.ts   # 每周焦点
│   │   ├── useGoals.ts         # 目标管理
│   │   ├── useGoalProgress.ts  # 目标自动进度计算（5种规则）
│   │   ├── useMoney.ts         # 记账
│   │   ├── useJournal.ts       # 日记（me + 宸宸）
│   │   ├── useLibrary.ts       # 阅读/观影/播客管理
│   │   ├── useTravel.ts        # 旅行计划/游记
│   │   ├── useScoring.ts       # 维度评分
│   │   ├── useAIInsight.ts     # AI 洞察（Gemini API + fallback）
│   │   └── use-mobile.ts       # 移动端检测
│   ├── lib/
│   │   ├── storage.ts          # 统一存储层（核心！localStorage ↔ Supabase）
│   │   ├── constants.ts        # 所有常量（习惯列表、分类、金句、问题、默认目标等）
│   │   └── utils.ts            # 工具函数
│   ├── pages/                  # 7 个页面
│   │   ├── DashboardPage.tsx   # 首页：问候语 + 今日记录 + 习惯打卡 + 评分 + 金句 + AI 洞察
│   │   ├── ReflectPage.tsx     # 觉察反思：每日/每周问题，回答记录
│   │   ├── GoalsPage.tsx       # 目标追踪：手动/自动进度，5种计算规则
│   │   ├── LibraryPage.tsx     # 阅读/观影/播客管理，微信读书导入
│   │   ├── JournalPage.tsx     # 日记：me + 宸宸（儿子名字是宸宸，不是晨晨）
│   │   ├── TravelPage.tsx      # 旅行：计划/日程/游记/照片
│   │   └── MoneyPage.tsx       # 记账：收入/支出分类，图表统计
│   ├── types/
│   │   └── index.ts            # 所有 TypeScript 类型定义
│   ├── App.tsx                 # 入口：AuthGate（密码认证）+ 页面路由
│   ├── main.tsx                # React 渲染入口
│   └── index.css               # 全局样式 + CSS 变量
├── .env                        # 本地环境变量（不提交 git）
├── .env.example                # 环境变量模板
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── postcss.config.js
```

---

## 3. 核心架构详解

### 3.1 存储层（storage.ts）

这是整个项目最重要的文件。所有数据操作都通过它进行。

**架构**：内存缓存 → Supabase（异步同步）

```
启动时：Supabase → 内存缓存（cache 对象）
写入时：内存缓存（同步） + Supabase（异步，不阻塞 UI）
读取时：内存缓存（同步，无网络延迟）
```

**Supabase 表结构**：`app_data` 表

| 列 | 类型 | 说明 |
|----|------|------|
| key | text (PK) | 存储键名，如 `life-os-habits` |
| value | jsonb | 存储值，可以是 JSON 对象、数组或字符串 |

**关键函数**：

| 函数 | 说明 |
|------|------|
| `ensureStorageReady()` | 启动时调用，从 Supabase 拉取所有数据到内存 |
| `getItem(key)` | 同步读取（从缓存） |
| `setItem(key, value)` | 写缓存 + 异步写 Supabase |
| `removeItem(key)` | 删缓存 + 异步删 Supabase |
| `migrateFromLocalStorage()` | 首次使用时迁移旧 localStorage 数据 |
| `supabaseUpsert(key, value)` | 用原生 fetch 写入 Supabase（绕过 SDK 序列化问题） |

**存储 key 命名规则**：

| Key | 内容类型 |
|-----|---------|
| `life-os-habits` | 习惯打卡数据 |
| `life-os-money` | 记账记录 |
| `life-os-goals` | 目标列表 |
| `life-os-weekly-focus` | 每周焦点 |
| `life-os-journal-me` | Doris 的日记 |
| `life-os-journal-chenchen` | 宸宸的日记 |
| `doris_library` | 阅读/观影列表 |
| `doris_travel_plans` | 旅行计划 |
| `doris_travel_journals` | 旅行游记 |
| `life-os-today-{YYYY-MM-DD}` | 每日三件事/开心小事/觉察 |
| `life-os-awareness-{YYYY-MM-DD}` | 觉察完成标记 |
| `life-os-reflect` | 觉察回答历史 |
| `life-os-gemini-key` | Gemini API Key |
| `__auth_password__` | 登录密码 |

### 3.2 密码认证（App.tsx 中的 AuthGate）

**认证流程**：

1. 首次打开：`isPasswordSet()` 检查 `__auth_password__` 是否存在
2. 不存在 → 显示「设置密码」页面（至少 6 位）
3. 已存在 → 显示「登录」页面
4. 登录成功 → `sessionStorage` 保持登录状态（关闭浏览器需重新输入）

**密码存储格式**：
- 新版代码：直接存纯字符串（如 `160508`）
- 旧版代码：存 JSON 对象 `{"password":"160508","createdAt":1774974971013}`
- `checkPassword()` 兼容两种格式：先尝试 `JSON.parse`，失败则直接字符串比较

**安全说明**：
- 密码认证仅在前端层面拦截，不等于真正的安全
- Supabase RLS 策略仍然是 `USING (true) WITH CHECK (true)`（完全开放）
- anon key 打包在 JS bundle 中，懂技术的人可以绕过前端密码验证
- 如需真正安全，需启用 Supabase RLS 策略

### 3.3 目标自动进度（useGoalProgress.ts）

支持 5 种自动计算规则：

| 规则类型 | 说明 | 数据来源 |
|---------|------|---------|
| `habit_rate` | 过去 N 天某习惯的完成率 | `life-os-habits` |
| `library_count` | 已完成数 / 目标数 | `doris_library` |
| `money_monthly` | 本月某类收入/支出 vs 目标 | `life-os-money` |
| `journal_monthly` | 本月日记篇数 vs 目标 | `life-os-journal-me` 或 `chenchen` |
| `reflect_monthly` | 本月觉察篇数 vs 目标 | `life-os-awareness-*` |

每个目标可以设置 `manualOverride: true` 手动覆盖自动计算的进度值。

### 3.4 AI 洞察（useAIInsight.ts）

- 接入 Gemini 2.0 Flash API
- 4 个视角：近期（7天）、月度、年度、财务
- 从 Supabase 收集真实数据生成个性化洞察
- 没有 API key 时用预设文本 fallback（`constants.ts` 中的 `INSIGHTS`）
- 打字机效果输出

### 3.5 金句系统（useToday.ts 中的 useQuotes）

- 从 Library 导入的书籍笔记中提取划线/笔记作为金句
- Library 金句 + 默认金句（`constants.ts` 中的 `QUOTES`）合并
- 每天根据日期自动切换
- 无 Library 数据时 fallback 到默认金句

---

## 4. 各页面功能

### Dashboard（首页）
- 问候语（根据时间自动切换：早上好/下午好/晚上好）
- 今日三件事 + 开心小事 + 觉察记录
- 习惯打卡（6 个默认习惯：冥想、运动、阅读、早睡、喝水、反思）
- 生命之花维度评分（6 维度：身体健康、内在稳定、家庭关系、财务自由、个人成长、生活品质）
- 金句展示（来自 Library 或默认）
- AI 洞察卡片（4 个 tab）

### Reflect（觉察反思）
- 每日觉察问题（7 个，按日期轮换，来源：Gratitude/Reflection/Deep Work 等）
- 每周觉察问题（7 个，来源：KPT/Self-Review 等）
- 回答历史记录

### Goals（目标追踪）
- 手动设置目标和进度
- 自动计算规则（5 种类型，见 3.3）
- 手动覆盖自动值
- 维度标签（Energy/Inner/Family/Work/Growth）

### Library（阅读管理）
- 支持 book / movie / blog / podcast 四种类型
- 从微信读书导入笔记（支持粘贴文本、Markdown、JSON 三种格式）
- 入口在 Library 页面顶部的「导入笔记」和「导入文件」按钮

### Journal（日记）
- 两种 owner：me（Doris）和 chenchen（宸宸）
- 支持标题、内容、心情、标签

### Travel（旅行）
- 旅行计划：目的地/日期/预算/同行人/状态
- 准备清单：可勾选
- 每日日程（Day Plan）：根据出发和返回日期自动生成日期标签页，每天可添加多个活动项（时间/活动/地点/花费/备注）
- 旅行游记：按天记录，支持心情/评分/照片（base64 存 Supabase）
- **重要**：日程安排、写游记的入口按钮必须直接放在旅行卡片上，不能藏在详情页里

### Money（记账）
- 收入/支出分类（中文分类，见 `constants.ts`）
- 日期筛选、分类统计

---

## 5. 环境变量配置

`.env` 文件（本地开发用，不提交 git）：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

GitHub Secrets 中也需配置相同变量：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

---

## 6. 部署

### 6.1 GitHub Actions 部署流程

`.github/workflows/deploy.yml` 定义了两个 job：

1. **build**：checkout → setup node 20 → npm ci → npm run build（注入 secrets） → upload pages artifact
2. **deploy**：deploy to github-pages environment

触发条件：push 到 main 分支，或手动 `workflow_dispatch`。

### 6.2 已知部署问题（重要！）

**问题**：GitHub Actions 构建成功 + Deployment API 显示 success，但线上文件始终是旧版本。具体表现为线上 JS 文件名一直是 `index-DL2oNmja.js`（旧代码，包含 `createdAt: Date.now()`），新代码从未被实际部署。

**当前状态**：
- 线上运行的是旧版代码
- 旧版代码的 `setPassword` 用 `JSON.stringify({ password, createdAt })` 存 JSON 对象
- 密码已通过脚本直接写入 Supabase，格式兼容旧代码：`{"password":"160508","createdAt":1774974971013}`
- 用户当前密码：`160508`

**临时解决方案**：
密码以旧代码兼容的 JSON 格式存入 Supabase，旧代码可以正常读取。新代码的修改（如 `supabaseUpsert` 使用 `resolution=merge-duplicates`）已在本地但未部署。

**后续修复方向**：
1. 改用 gh-pages 分支部署（手动 `npm run build` 后推 dist 到 gh-pages 分支，把 Pages Source 从 Actions 改成 Deploy from a branch）
2. 或排查 GitHub Pages deployment artifact 为什么没更新
3. 修复后记得在 GitHub Settings → Pages 把 Source 切回正确选项

### 6.3 Git 代理

推送到 GitHub 必须走代理：
```
http.proxy=http://127.0.0.1:7897
```

本地构建命令：
```bash
cd C:\Users\carso\Desktop\doris-life-os
npm install
npm run build
# 产物在 dist/ 目录
```

---

## 7. 踩坑经验汇总

以下是开发过程中遇到的所有问题和解决方案，新接手的开发者务必先阅读。

### 密码存储
- **问题**：`setPassword` 最初用 `JSON.stringify({ password, createdAt })` 存 JSON 对象到 Supabase JSONB 列导致写入失败
- **解决**：新版代码改用原生 `fetch` 调 Supabase REST API，直接存纯字符串
- **注意**：`supabaseUpsert` 函数使用 `Prefer: resolution=merge-duplicates` header 来实现 upsert

### 密码兼容性
- **问题**：线上是旧代码（JSON 格式），本地新代码（纯字符串格式），两边不兼容
- **解决**：新代码的 `checkPassword()` 先尝试 `JSON.parse`，失败则直接字符串比较。密码以旧格式写入 Supabase 兼容线上旧代码

### 数据迁移
- `migrateFromLocalStorage()` 在首次加载时自动迁移旧 localStorage 数据到 Supabase
- 迁移的 key 列表在函数内硬编码，新增存储 key 时记得同步更新

### setItem 的异步写入
- `setItem()` 使用 Supabase SDK 的 `upsert` 方法异步写入
- 注意 `value` 参数被 `JSON.parse` 后传入 SDK——这意味着传入的 value 必须是 JSON 字符串
- `supabaseUpsert()` 则用原生 fetch 直接传对象，避免 SDK 的二次序列化

### Travel 功能入口
- 日程安排和写游记的入口（📅✏️按钮）必须直接放在旅行卡片上
- 不能藏在详情页里，否则用户找不到（已验证）

### CSS 变量设计系统
- 主背景色：`#F7F6F3`（温暖米色）
- 强调色：`var(--accent)` = `#C9A96E`（金色）
- 标题字体：`'Cormorant Garamond', 'Noto Serif SC', Georgia, serif`
- 正文字体：`'Inter', sans-serif`
- UI 组件用 CSS 变量控制颜色，变量定义在 `index.css` 中

### vite.svg 404
- 旧 favicon 引用导致 404，不影响功能，可忽略

---

## 8. 设计规范

### 色彩
| 用途 | 颜色 |
|------|------|
| 页面背景 | `#F7F6F3` |
| 卡片背景 | `var(--bg-card)` |
| 强调色 | `#C9A96E`（金色） |
| 文字主色 | `var(--text-primary)` |
| 文字次色 | `var(--text-secondary)` |
| 文字弱色 | `var(--text-muted)` |
| 危险色 | `var(--danger)` |

### 字体
- 标题：Cormorant Garamond / Noto Serif SC / Georgia
- 正文：Inter
- 导航标签：12px，tracking-wide
- 小文字：10-11px

### 组件风格
- 圆角：xl（`calc(var(--radius) + 4px)`）
- 卡片阴影：极浅
- 整体风格：简洁、温暖、留白充足

---

## 9. 依赖说明

### 核心依赖
| 包 | 用途 |
|----|------|
| `react` 19 | UI 框架 |
| `vite` 7 | 构建工具 |
| `tailwindcss` 3 | 样式 |
| `@supabase/supabase-js` | Supabase 客户端 |
| `date-fns` | 日期处理 |
| `recharts` | 图表（Money 页面统计） |
| `lucide-react` | 图标 |
| `zod` + `react-hook-form` | 表单验证（部分组件使用） |
| `sonner` | Toast 通知 |
| `radix-ui/*` | 无障碍 UI 原语 |

### shadcn/ui 组件
`src/components/ui/` 目录下有 53 个组件文件，基于 Radix UI + CVA（class-variance-authority）构建。这些是标准 shadcn/ui 组件，一般不需要修改。

---

## 10. 未来可能的改进方向

1. **修复 GitHub Pages 部署**：改用 gh-pages 分支或排查 artifact 问题
2. **启用 Supabase RLS**：当前数据完全开放，需要真正的安全策略
3. **PWA 支持**：添加 Service Worker 实现离线使用
4. **数据导出**：支持导出所有数据为 JSON/CSV
5. **图表增强**：Money 页面可以添加更丰富的可视化
6. **多语言**：目前全中文，可以考虑英文支持
7. **自动化洞察**：通过定时任务自动生成每日洞察（类似 Flomo）

---

## 11. 快速上手指南

如果你是接手此项目的 AI 助手，按以下步骤操作：

### 第一次接触项目

1. 阅读本文档（你已经读完了）
2. 克隆仓库：`git clone https://github.com/carsonyang3-byte/doris-life-os.git`
3. 安装依赖：`npm install`
4. 配置 `.env` 文件（需要向用户索要 Supabase URL 和 anon key）
5. 启动开发服务器：`npm run dev`
6. 浏览各个页面了解功能

### 修改功能

1. 确认要修改的文件（参考第 2 节项目结构）
2. 如果改存储逻辑 → `src/lib/storage.ts`
3. 如果改业务逻辑 → 对应的 `src/hooks/useXxx.ts`
4. 如果改页面 UI → 对应的 `src/pages/XxxPage.tsx`
5. 如果改常量（习惯列表、分类、默认金句等）→ `src/lib/constants.ts`
6. 本地 `npm run dev` 测试

### 部署更新

1. `npm run build` 本地构建
2. 确认构建产物在 `dist/` 目录
3. 提交代码到 main 分支（`git push` 需走代理 `http://127.0.0.1:7897`）
4. 等待 GitHub Actions 自动部署
5. **注意**：当前部署有问题（见第 6.2 节），可能需要手动部署

### 修改密码

密码存储在 Supabase `app_data` 表中，key 为 `__auth_password__`。可以用 Supabase Dashboard 直接修改，或用脚本：

```javascript
// 设置密码（新版格式：纯字符串）
await supabaseUpsert('__auth_password__', '新密码');

// 设置密码（旧版格式：兼容线上旧代码）
await supabaseUpsert('__auth_password__', JSON.stringify({ password: '新密码', createdAt: Date.now() }));
```

---

## 12. 联系与上下文

- GitHub 用户：carsonyang3-byte
- 项目用户：Doris
- 开发助手：WorkBuddy AI（文档作者）
- 本文档创建时间：2026-04-01
- 项目初始创建时间：2025年（具体日期见 git log）

如需了解更多项目上下文（用户的偏好、之前的功能讨论等），可以查看 WorkBuddy 的工作记忆文件（`MEMORY.md`）。
