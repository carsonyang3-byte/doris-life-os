// ===== Common Types =====

export interface HabitData {
  [date: string]: {
    [habit: string]: boolean;
  };
}

export interface TodayRecord {
  date: string;
  tasks: string[];
  happy: string;
  awareness: string;
}

export interface MoneyRecord {
  id: number;
  type: 'income' | 'expense';
  category: string;
  categoryLabel: string;
  categoryColor: string;
  amount: number;
  note: string;
  date: string;
}

export interface Goal {
  title: string;
  desc: string;
  progress: number;          // 手动覆盖值，-1 表示使用自动计算
  color: string;
  dimension: string;
  year: number;             // 所属年份
  autoCalc?: AutoCalcRule;   // 自动计算规则
  manualOverride?: boolean;  // 是否手动覆盖了自动值
}

// 自动计算规则类型
export type AutoCalcRule =
  | { type: 'habit_rate'; habit: string; windowDays: number }        // 习惯完成率: 过去N天的完成百分比
  | { type: 'library_count'; itemType: 'book' | 'movie' | 'blog' | 'podcast'; statusFilter: string; target: number }  // 已完成数/目标数
  | { type: 'money_monthly'; category: string; direction: 'income' | 'expense'; target: number }  // 本月某类收入/支出 vs 目标
  | { type: 'journal_monthly'; owner: 'me' | 'chenchen'; target: number }  // 本月日记篇数 vs 目标
  | { type: 'reflect_monthly'; target: number }  // 本月觉察篇数 vs 目标

export interface Project {
  title: string;
  desc: string;
  status: 'active' | 'planning' | 'completed';
  color: string;
  history?: { date: string; status: 'active' | 'planning' | 'completed' }[]; // 状态变更历史
}

export interface VisionDimension {
  label: string;
  color: string;
  current: number;
}

export interface WeeklyFocus {
  [key: string]: string;
}

export interface ReflectAnswer {
  date: string;
  question: string;
  framework: string;
  answer: string;
}

export interface Quote {
  text: string;
  book: string;
  author: string;
}

export type PageType = 'dashboard' | 'reflect' | 'goals' | 'library' | 'journal' | 'money' | 'travel' | 'kitchen' | 'settings';

/** 单条微信读书划线（与 Library 中书关联） */
export interface WereadHighlightEntry {
  text: string;
  /** 展示用时间，如 2025-04-01 */
  time: string;
}

export interface LibraryItem {
  id: number;
  type: 'book' | 'movie' | 'blog' | 'podcast';
  title: string;
  creator?: string;
  date: string;
  rating?: number;
  status: 'reading' | 'completed' | 'abandoned' | 'in_progress';
  note?: string;
  /** 微信读书 bookId，用于同步去重 */
  wereadBookId?: string;
  /** API 导入的划线列表（Daily Quote 优先从此读取） */
  wereadHighlights?: WereadHighlightEntry[];
  /** 书籍分类（如心理学、育儿、理财等），从微信读书同步 */
  category?: string;
  /** 阅读完成日期，从微信读书同步 */
  finishedDate?: string;
}

export interface JournalEntry {
  id: number;
  owner: 'me' | 'chenchen'; // 'me' = Doris的日记, 'chenchen' = 小魔怪宸宸
  date: string;
  title?: string;
  content: string;
  mood?: string; // 心情标签
  tags?: string[];
  createdAt: number;
}

// ===== Travel Types =====

export type TravelStatus = 'planning' | 'completed';

// 每日日程项
export interface ItineraryItem {
  time?: string;           // 时间，如 "09:00"
  activity: string;        // 活动，如 "参观金阁寺"
  place?: string;          // 地点
  note?: string;           // 备注，如 "需要提前预约"
  cost?: number;           // 预计花费
}

// 每日日程
export interface DayPlan {
  date: string;            // 日期
  label?: string;          // 标签，如 "Day 1"、"自由活动日"
  items: ItineraryItem[];
}

export interface TravelPlan {
  id: number;
  title: string;           // 旅行名称，如 "日本关西之旅"
  destination: string;     // 目的地，如 "日本·大阪/京都"
  status: TravelStatus;
  startDate: string;       // 开始日期
  endDate?: string;        // 结束日期
  coverImg?: string;       // 封面图（base64）
  budget?: number;         // 预算
  companions?: string;     // 同行人
  notes?: string;          // 备注/想法
  checklist?: string[];    // 待办清单
  itinerary?: DayPlan[];   // 每日日程
  createdAt: number;
}

export interface TravelJournalEntry {
  id: number;
  tripId: number;          // 关联的 TravelPlan id
  date: string;            // 当天日期
  title?: string;          // 当天标题，如 "Day 1: 抵达大阪"
  content: string;         // 游记正文（Markdown）
  mood?: string;           // 心情
  photos: string[];        // 照片（base64 数组）
  rating?: number;         // 当天评分 1-5
  createdAt: number;
}

// ===== Kitchen Types =====

/**
 * 视频来源平台。
 *
 * 注：`'manual'`（自己手打的菜）已并入 `'legacy'` —— 2026-10-03 用户决定，
 * 手打的菜跟历史菜谱算一类，不单列一个分类。
 * 保留这个值只为兼容旧数据，载入时会自动归一；新数据不再产生。
 */
export type RecipePlatform = 'bilibili' | 'douyin' | 'xiaohongshu' | 'weibo' | 'youtube' | 'legacy' | 'manual' | 'other';

/** 菜谱状态：想做 / 做过 / 不要再提 */
export type RecipeStatus = 'want' | 'cooked' | 'never';

/** 主料（筛选维度，也是 AI 排菜时轮换蛋白质的依据） */
export type MainIngredient =
  | 'pork' | 'beef' | 'lamb' | 'chicken' | 'duck_goose'
  | 'fish' | 'shellfish' | 'egg' | 'tofu' | 'mushroom' | 'leafy' | 'other';

/** 蛋白档位：主荤 / 半荤 / 素 —— 排菜判断用，卡片角标显示 */
export type ProteinTier = 'main' | 'semi' | 'veg';

/** 解析状态 */
export type ParseStatus = 'pending' | 'parsed' | 'partial' | 'failed' | 'manual';

/** 菜谱来源：用户收藏的视频 / 历史菜谱池 / 自己手打 */
export type RecipeSource = 'video' | 'legacy' | 'manual';

export interface Recipe {
  id: number;
  title: string;              // 菜名
  url: string;                // 视频链接
  platform: RecipePlatform;   // 来源平台
  ingredients: string[];      // 已确认食材（采购清单只认它）
  cuisine?: string;           // 菜系：粤式/日式/西式...
  status: RecipeStatus;       // 状态
  lastCooked?: string;        // 上次做的日期 YYYY-MM-DD
  note?: string;              // 备注（AI 排菜会读）
  createdAt: number;

  // ---- 以下为新增字段，全部 optional，老数据无需迁移 ----
  mainIngredient?: MainIngredient;  // 主料
  proteinTier?: ProteinTier;        // 蛋白档位
  isSoup?: boolean;                 // 是否汤羹（广式滚汤算一道菜、算蛋白来源）
  tags?: string[];                  // 自由标签：容易做 / 一锅熟 / 下饭 …
  source?: RecipeSource;            // 来源
  parseStatus?: ParseStatus;        // 解析状态
  parsedAt?: number;                // 解析时间
  thumbnail?: string;               // 视频封面
  pendingIngredients?: string[];    // 待确认食材（标黄，不进采购清单）
  manual?: boolean;                 // 用户手加的菜，AI 重排时不覆盖
}

/** 菜单中的一天 */
export interface MealPlanDay {
  date: string;               // YYYY-MM-DD
  label: string;              // 周一 / 周二 ...
  recipeIds: number[];        // 当天安排的菜谱 id
  manualIds?: number[];       // 我手动加进这一天的菜 —— 重排时保留、不覆盖
  customText?: string;        // 手写补充（外卖、外出吃等）
}

export interface MealPlan {
  weekStart: string;          // 该周周一 YYYY-MM-DD
  days: MealPlanDay[];
}

/** 采购清单条目 */
export interface ShoppingItem {
  name: string;               // 食材名
  recipeTitles: string[];     // 来自哪些菜
  checked?: boolean;          // 是否已买
}
