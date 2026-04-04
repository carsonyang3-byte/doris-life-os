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

export type PageType = 'dashboard' | 'reflect' | 'goals' | 'library' | 'journal' | 'money' | 'travel';

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
