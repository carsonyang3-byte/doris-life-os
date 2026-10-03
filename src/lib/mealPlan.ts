/**
 * 排菜单的算法层 —— 纯函数，不碰 React，所以可以单独拿真实数据跑验证。
 * （useKitchen 只负责把它接到 state 上）
 */
import type { Recipe, MealPlan, MealPlanDay } from '../types';

export const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/** 一次排菜的结果 —— 用来跟你交代「保留了几道手加的、新排了几道」 */
export type PlanResult = { ok: boolean; kept: number; added: number };

/** 同一种主料一周最多出现几次（避免"一周三天都吃鸡"） */
const MAIN_CAP_PER_WEEK = 2;

/** 本地日期 → YYYY-MM-DD（避免时区偏移） */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 本周周一 */
export function getWeekStart(base = new Date()): Date {
  const d = new Date(base);
  const dow = d.getDay(); // 0=周日
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 距离今天过了多少天（非法值当很久以前） */
function daysSince(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - d.getTime()) / 86400000);
}

/**
 * 带权重的随机排序（Efraimidis–Spirakis 加权随机抽样）。
 * 权重越高越容易排在前面，但同样条件下每次顺序都不同
 * —— 这是「反复点能刷出不同菜单」的来源。
 */
function weightedShuffle<T>(items: T[], weightOf: (x: T) => number): T[] {
  return items
    .map((x) => ({ x, k: Math.random() ** (1 / Math.max(weightOf(x), 1e-4)) }))
    .sort((a, b) => b.k - a.k)
    .map((o) => o.x);
}

/** 判断一道菜是不是纯素：只有明确标了 veg 才算，没标的一律当"未知"放过 */
export const isVegDish = (r: Recipe): boolean => r.proteinTier === 'veg';

export function buildEmptyWeek(weekStart: Date): MealPlan {
  const days: MealPlanDay[] = WEEK_LABELS.map((label, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return { date: toDateStr(d), label, recipeIds: [] };
  });
  return { weekStart: toDateStr(weekStart), days };
}

/**
 * 排菜核心算法。
 *
 * 每次调用都重新随机，所以可以反复点、无限刷。
 *
 * 硬线（池子实在不够时会自动放宽，但正常 135 道池子下不会碰到）：
 *   · 一天里不能两道都是纯素（蛋白不够）
 *   · 一周内同一道菜不重复
 *
 * 软约束（尽量满足，池子不够时自动放宽，不会报错）：
 *   · 想做优先；近 3 天做过的基本不排，近 7 天降权
 *   · 你自己收藏的视频略优先于历史菜谱
 *   · 同一天不重复主料、不重复菜系
 *   · 不在连续两天用同一种主料；同一主料一周不超过 2 次
 *
 * **手动加的菜一律原地保留**：既不参与重排，也从「已用过 / 已占主料」里算数。
 * 每天要几道（perDay）是总量，手加的先把位子占住，AI 只补剩下的空位。
 *
 * @param perDay   每天排几道（含手加的）
 * @param onlyDate 只重排这一天（其余六天原样保留）；不传则整周重排
 */
export function computeWeekPlan(args: {
  pool: Recipe[];
  planDays: MealPlanDay[];
  perDay: number;
  onlyDate?: string;
  weekStart: Date;
}): { days: MealPlanDay[]; kept: number; added: number } {
  const { pool, planDays, perDay, onlyDate, weekStart } = args;

  const n = Math.max(1, Math.min(4, Math.floor(perDay) || 2));
  const vegIds = new Set(pool.filter(isVegDish).map((r) => r.id));
  const byId = new Map(pool.map((r) => [r.id, r]));

  const dates = WEEK_LABELS.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return toDateStr(d);
  });

  const usedInWeek = new Set<number>();
  const mainCount = new Map<string, number>();
  const mainOnDay = new Map<string, Set<string>>();

  /** 这一天有哪些菜要原样留着 —— 就是你手动加的那些（库里还在的） */
  const keptOf = (date: string): number[] => {
    const d = planDays.find((x) => x.date === date);
    return (d?.manualIds || []).filter((id) => byId.has(id));
  };

  // ① 不动的天：单天重排时其余六天原样保留，并成为「已用过」的上下文
  if (onlyDate) {
    planDays
      .filter((d) => d.date !== onlyDate)
      .forEach((d) => {
        const mains = new Set<string>();
        d.recipeIds.forEach((id) => {
          if (!byId.has(id)) return;
          usedInWeek.add(id);
          const m = byId.get(id)?.mainIngredient;
          if (m) {
            mains.add(m);
            mainCount.set(m, (mainCount.get(m) || 0) + 1);
          }
        });
        mainOnDay.set(d.date, mains);
      });
  }

  // ② 手加的菜先占位：跨天去重、主料额度都要把它们算上
  const keptByDate = new Map<string, number[]>();
  let keptTotal = 0;
  let addedTotal = 0;
  dates.forEach((date) => {
    if (onlyDate && date !== onlyDate) return;
    const kept = keptOf(date);
    keptByDate.set(date, kept);
    keptTotal += kept.length;
    const mains = mainOnDay.get(date) || new Set<string>();
    kept.forEach((id) => {
      usedInWeek.add(id);
      const m = byId.get(id)?.mainIngredient;
      if (m) {
        mains.add(m);
        mainCount.set(m, (mainCount.get(m) || 0) + 1);
      }
    });
    mainOnDay.set(date, mains);
  });

  // 单天重排时本天原有的菜降权 —— 保证「换一批」真的换得动
  const currentIds = new Set(
    onlyDate ? planDays.find((d) => d.date === onlyDate)?.recipeIds || [] : []
  );

  const pickOneDay = (prevMains: Set<string>, nextMains: Set<string>, kept: number[]): number[] => {
    const picks: number[] = [...kept];
    const dayMains = new Set<string>();
    const dayCuisines = new Set<string>();

    // 手加的菜已经站好位：它们的主料/菜系算作"这天已占"
    kept.forEach((id) => {
      const r = byId.get(id);
      if (!r) return;
      if (r.mainIngredient) dayMains.add(r.mainIngredient);
      if (r.cuisine) dayCuisines.add(r.cuisine);
    });

    const weightOf = (r: Recipe): number => {
      let w = 1;
      if (r.status === 'want') w *= 3;
      else if (r.status === 'cooked') w *= 0.8;
      if (r.source === 'video') w *= 1.5;

      if (r.lastCooked) {
        const d = daysSince(r.lastCooked);
        if (d < 3) w *= 0.08;
        else if (d < 7) w *= 0.35;
        else if (d < 14) w *= 0.7;
      }

      if (currentIds.has(r.id)) w *= 0.05;
      else if (usedInWeek.has(r.id)) w *= 0.12;

      const m = r.mainIngredient;
      if (m) {
        if (dayMains.has(m)) w *= 0.04;
        if (prevMains.has(m) || nextMains.has(m)) w *= 0.12;
        const c = mainCount.get(m) || 0;
        if (c >= 2) w *= 0.04;
        else if (c === 1) w *= 0.5;
      }
      if (r.cuisine && dayCuisines.has(r.cuisine)) w *= 0.15;
      return w;
    };

    const take = (excludeVeg: boolean): boolean => {
      const base = pool.filter(
        (r) => !picks.includes(r.id) && !(excludeVeg && vegIds.has(r.id))
      );
      if (base.length === 0) return false;

      // 约束分三级回退，池子不够时自动放宽，不会排不满：
      //   strict = 主料额度 + 不连续两天同主料 + 本周没排过这道菜
      //   loose  = 只保证"同一天不重复主料"
      //   base   = 全放开
      const mainOk = (r: Recipe, strict: boolean): boolean => {
        const m = r.mainIngredient;
        if (!m) return true;
        if (dayMains.has(m)) return false;
        if (!strict) return true;
        if ((mainCount.get(m) || 0) >= MAIN_CAP_PER_WEEK) return false;
        if (prevMains.has(m) || nextMains.has(m)) return false;
        return true;
      };

      const strict = base.filter((r) => mainOk(r, true) && !usedInWeek.has(r.id));
      const loose = base.filter((r) => mainOk(r, false));
      const finalists = strict.length > 0 ? strict : loose.length > 0 ? loose : base;

      const r = weightedShuffle(finalists, weightOf)[0];
      picks.push(r.id);
      usedInWeek.add(r.id);
      if (r.mainIngredient) {
        dayMains.add(r.mainIngredient);
        mainCount.set(r.mainIngredient, (mainCount.get(r.mainIngredient) || 0) + 1);
      }
      if (r.cuisine) dayCuisines.add(r.cuisine);
      return true;
    };

    // 一道都没有时，第一道优先非素 —— 保证这一顿有蛋白来源
    if (picks.length === 0) {
      if (!take(true)) take(false);
    }
    // 剩下的空位才由 AI 补（手加的已经先占住位子了）
    while (picks.length < n) {
      const allVeg = picks.length > 0 && picks.every((id) => vegIds.has(id));
      if (!take(allVeg)) break;
    }
    return picks;
  };

  const days: MealPlanDay[] = dates.map((date, i) => {
    const label = WEEK_LABELS[i];
    const old = planDays.find((d) => d.date === date);

    if (onlyDate && date !== onlyDate) {
      return old ? { ...old, label, date } : { date, label, recipeIds: [], manualIds: [] };
    }

    const prevMains = (i > 0 && mainOnDay.get(dates[i - 1])) || new Set<string>();
    const nextMains = (i < dates.length - 1 && mainOnDay.get(dates[i + 1])) || new Set<string>();
    const kept = keptByDate.get(date) || [];
    const recipeIds = pickOneDay(prevMains, nextMains, kept);
    addedTotal += recipeIds.length - kept.length;

    const mains = new Set<string>();
    recipeIds.forEach((id) => {
      const m = byId.get(id)?.mainIngredient;
      if (m) mains.add(m);
    });
    mainOnDay.set(date, mains);

    return { date, label, recipeIds, manualIds: kept, customText: old?.customText };
  });

  return { days, kept: keptTotal, added: addedTotal };
}
