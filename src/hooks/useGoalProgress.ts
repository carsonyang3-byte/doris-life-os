import { useMemo } from 'react';
import type { Goal, AutoCalcRule } from '../types';
import { HABIT_KEYS } from '../lib/constants';
import { formatDate } from '../lib/utils';
import { getItem } from '../lib/storage';

const STORAGE_KEYS = {
  habits: 'life-os-habits',
  library: 'doris_library',
  money: 'life-os-money',
  journalMe: 'life-os-journal-me',
  journalChenchen: 'life-os-journal-chenchen',
  awareness: 'life-os-awareness-',
} as const;

// 从存储层安全读取数据
function loadJSON<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

// 获取最近 N 天的日期字符串列表
function getRecentDates(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}

// 获取当前月的日期前缀，如 "2026-03"
function getCurrentMonthPrefix(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// 根据规则计算进度，返回 { progress: number, reason: string }
function calculateByRule(rule: AutoCalcRule): { progress: number; reason: string } {
  switch (rule.type) {
    case 'habit_rate': {
      // 过去 N 天某习惯的完成率
      const habits = loadJSON<Record<string, Record<string, boolean>>>(STORAGE_KEYS.habits, {});
      const dates = getRecentDates(rule.windowDays);
      const completed = dates.filter((d) => habits[d]?.[rule.habit] === true).length;
      const rate = Math.round((completed / rule.windowDays) * 100);
      return {
        progress: Math.min(rate, 100),
        reason: `过去 ${rule.windowDays} 天完成 ${completed} 天（${rate}%）`,
      };
    }

    case 'library_count': {
      // 已完成数 / 目标数
      const items = loadJSON<any[]>(STORAGE_KEYS.library, []);
      const count = items.filter(
        (i) => i.type === rule.itemType && i.status === rule.statusFilter
      ).length;
      const rate = Math.round((count / rule.target) * 100);
      return {
        progress: Math.min(rate, 100),
        reason: `已完成 ${count}/${rule.target}（${rate}%）`,
      };
    }

    case 'money_monthly': {
      // 本月某类收入/支出 vs 目标
      const records = loadJSON<any[]>(STORAGE_KEYS.money, []);
      const monthPrefix = getCurrentMonthPrefix();
      const total = records
        .filter(
          (r) =>
            r.type === rule.direction &&
            r.category === rule.category &&
            r.date.startsWith(monthPrefix)
        )
        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      const rate = Math.round((total / rule.target) * 100);
      const label = rule.direction === 'income' ? '收入' : '支出';
      return {
        progress: Math.min(rate, 100),
        reason: `本月${label} ¥${total.toLocaleString()} / ¥${rule.target.toLocaleString()}（${rate}%）`,
      };
    }

    case 'journal_monthly': {
      // 本月日记篇数 vs 目标
      const key = rule.owner === 'me' ? STORAGE_KEYS.journalMe : STORAGE_KEYS.journalChenchen;
      const entries = loadJSON<any[]>(key, []);
      const monthPrefix = getCurrentMonthPrefix();
      const count = entries.filter((e) => e.date.startsWith(monthPrefix)).length;
      const rate = Math.round((count / rule.target) * 100);
      return {
        progress: Math.min(rate, 100),
        reason: `本月写了 ${count} 篇 / 目标 ${rule.target} 篇（${rate}%）`,
      };
    }

    case 'reflect_monthly': {
      // 本月觉察篇数 vs 目标
      const prefix = STORAGE_KEYS.awareness;
      const monthPrefix = getCurrentMonthPrefix();
      let count = 0;
      // 扫描最近31天的觉察记录
      for (let i = 0; i < 31; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);
        if (getItem(prefix + dateStr)) count++;
      }
      const rate = Math.round((count / rule.target) * 100);
      return {
        progress: Math.min(rate, 100),
        reason: `本月觉察 ${count} 次 / 目标 ${rule.target} 次（${rate}%）`,
      };
    }

    default:
      return { progress: 0, reason: '未知的计算规则' };
  }
}

// 计算结果类型
export interface GoalCalcResult {
  goals: Goal[];
  // 每个目标的计算结果：autoProgress, autoReason, isManual
  details: {
    progress: number;     // 最终展示的进度
    autoProgress: number; // 自动计算的进度
    autoReason: string;   // 计算说明
    isManual: boolean;    // 是否手动覆盖
  }[];
}

export function useGoalProgress(goals: Goal[]): GoalCalcResult {
  const details = useMemo(() => {
    return goals.map((goal) => {
      if (!goal.autoCalc) {
        // 没有自动计算规则，纯手动
        return {
          progress: goal.progress,
          autoProgress: 0,
          autoReason: '',
          isManual: true,
        };
      }

      const { progress: autoProgress, reason: autoReason } = calculateByRule(goal.autoCalc);

      if (goal.manualOverride) {
        // 用户手动覆盖了，显示手动值
        return {
          progress: goal.progress,
          autoProgress,
          autoReason,
          isManual: true,
        };
      }

      // 使用自动计算值
      return {
        progress: autoProgress,
        autoProgress,
        autoReason,
        isManual: false,
      };
    });
  }, [goals]);

  return { goals, details };
}
