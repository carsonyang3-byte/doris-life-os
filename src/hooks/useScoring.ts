/**
 * 积分机制 -- 核心逻辑
 *
 * 每个行为赋予积分，按维度汇总，近30天计算百分比。
 *
 * 行为 → 积分 → 维度映射:
 *   冥想  +3 → energy
 *   运动  +3 → energy
 *   早睡  +2 → energy
 *   阅读  +2 → growth
 *   反思  +2 → inner
 *   喝水  +1 → energy
 *   写了3件事    +2 → workMoney
 *   写了开心小事  +1 → family
 *   写了觉察     +3 → inner
 *   全勤日（6项全完成）+2 → 每维度各+2
 */
import { useMemo } from 'react';
import { HABIT_KEYS } from '../lib/constants';
import { formatDate } from '../lib/utils';

// ---- 积分规则定义 ----

interface ScoreRule {
  points: number;
  dimension: keyof typeof DIMENSION_MAX;
}

/** 每个习惯打卡的积分 */
const HABIT_SCORES: Record<string, ScoreRule> = {
  '冥想': { points: 3, dimension: 'energy' },
  '运动': { points: 3, dimension: 'energy' },
  '早睡': { points: 2, dimension: 'energy' },
  '阅读': { points: 2, dimension: 'growth' },
  '反思': { points: 2, dimension: 'inner' },
  '喝水': { points: 1, dimension: 'energy' },
};

/** 每日记录的额外积分 */
const TODAY_SCORES = {
  tasks: { points: 2, dimension: 'workMoney' as const },
  happy: { points: 1, dimension: 'family' as const },
  awareness: { points: 3, dimension: 'inner' as const },
  allHabits: { points: 2 }, // 全勤加分，每维度各加
};

/** 每维度近30天理论满分 */
const DIMENSION_MAX = {
  energy: 330,   // (冥想3+运动3+早睡2+喝水1+全勤2) * 30 = 330
  inner: 210,    // (反思2+觉察3+全勤2) * 30 = 210
  family: 90,    // (开心1+全勤2) * 30 = 90
  workMoney: 120, // (三件事2+全勤2) * 30 = 120
  growth: 120,   // (阅读2+全勤2) * 30 = 120
};

/** 维度显示名 */
const DIMENSION_LABELS: Record<string, { label: string; color: string }> = {
  energy: { label: '身体健康', color: '#5BAD6F' },
  inner: { label: '内在稳定', color: '#5B9BD5' },
  family: { label: '家庭关系', color: '#E8963F' },
  workMoney: { label: '财务自由', color: '#C9A96E' },
  growth: { label: '个人成长', color: '#9B8FD6' },
};

export interface DimensionScore {
  key: string;
  label: string;
  color: string;
  score: number;
  max: number;
  percent: number;
}

// ---- localStorage 读取辅助 ----

const HABIT_STORAGE = 'life-os-habits';
const TODAY_PREFIX = 'life-os-today-';

function getHabitsForDate(dateStr: string): Record<string, boolean> | null {
  try {
    const all = JSON.parse(localStorage.getItem(HABIT_STORAGE) || '{}');
    return all[dateStr] || null;
  } catch { return null; }
}

function getTodayRecord(dateStr: string): { tasks: string[]; happy: string; awareness: string } | null {
  try {
    return JSON.parse(localStorage.getItem(TODAY_PREFIX + dateStr) || 'null');
  } catch { return null; }
}

// ---- Hook ----

export function useScoring() {
  const dimensions = useMemo(() => {
    const scores: Record<string, number> = {
      energy: 0, inner: 0, family: 0, workMoney: 0, growth: 0,
    };
    const today = new Date();
    let totalDays = 0;

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);

      const habits = getHabitsForDate(dateStr);
      const record = getTodayRecord(dateStr);
      if (!habits && !record) continue; // 完全没有数据的日期跳过
      totalDays++;

      // 习惯打卡积分
      if (habits) {
        let completedCount = 0;
        for (const key of HABIT_KEYS) {
          if (habits[key]) {
            const rule = HABIT_SCORES[key];
            if (rule) scores[rule.dimension] += rule.points;
            completedCount++;
          }
        }
        // 全勤日加分
        if (completedCount === HABIT_KEYS.length) {
          for (const dim of Object.keys(scores)) {
            scores[dim] += TODAY_SCORES.allHabits.points;
          }
        }
      }

      // 每日记录积分
      if (record) {
        if (record.tasks && record.tasks.filter(t => t.trim()).length > 0) {
          scores[TODAY_SCORES.tasks.dimension] += TODAY_SCORES.tasks.points;
        }
        if (record.happy && record.happy.trim()) {
          scores[TODAY_SCORES.happy.dimension] += TODAY_SCORES.happy.points;
        }
        if (record.awareness && record.awareness.trim()) {
          scores[TODAY_SCORES.awareness.dimension] += TODAY_SCORES.awareness.points;
        }
      }
    }

    // 计算百分比，基于有效天数动态计算满分（更公平）
    return Object.keys(scores).map(key => {
      const info = DIMENSION_LABELS[key];
      const maxPerDay = DIMENSION_MAX[key] / 30;
      const effectiveMax = Math.round(maxPerDay * totalDays) || 1;
      const percent = Math.min(100, Math.round((scores[key] / effectiveMax) * 100));
      return {
        key,
        label: info.label,
        color: info.color,
        score: scores[key],
        max: effectiveMax,
        percent,
      } as DimensionScore;
    });
  }, []);

  /** 获取今日积分（用于展示今日获得分数） */
  const todayScore = useMemo(() => {
    const todayStr = formatDate(new Date());
    const habits = getHabitsForDate(todayStr);
    const record = getTodayRecord(todayStr);
    let score = 0;
    if (habits) {
      for (const key of HABIT_KEYS) {
        if (habits[key]) {
          const rule = HABIT_SCORES[key];
          if (rule) score += rule.points;
        }
      }
      const completedCount = HABIT_KEYS.filter(k => habits[k]).length;
      if (completedCount === HABIT_KEYS.length) score += 2;
    }
    if (record) {
      if (record.tasks?.filter(t => t.trim()).length > 0) score += 2;
      if (record.happy?.trim()) score += 1;
      if (record.awareness?.trim()) score += 3;
    }
    return score;
  }, []);

  return { dimensions, todayScore, DIMENSION_MAX };
}
