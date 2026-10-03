import { useState, useEffect, useMemo } from 'react';
import type {
  Recipe, RecipePlatform, MealPlan, MealPlanDay, ShoppingItem,
  MainIngredient, ProteinTier,
} from '../types';
import { getItem, setItem } from '../lib/storage';
import { LEGACY_RECIPES } from '../data/legacyRecipes';
import {
  toDateStr, getWeekStart, buildEmptyWeek, computeWeekPlan, isVegDish,
  type PlanResult,
} from '../lib/mealPlan';

const RECIPES_KEY = 'doris_recipes';
const PLAN_KEY = 'doris_meal_plan';
const CHECKED_KEY = 'doris_shopping_checked';

/** 根据链接识别来源平台 */
export function detectPlatform(url: string): RecipePlatform {
  const u = (url || '').toLowerCase();
  if (u.includes('bilibili.com') || u.includes('b23.tv')) return 'bilibili';
  if (u.includes('douyin.com') || u.includes('iesdouyin.com')) return 'douyin';
  if (u.includes('xiaohongshu.com') || u.includes('xhslink.com')) return 'xiaohongshu';
  if (u.includes('weibo.com') || u.includes('weibo.cn')) return 'weibo';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  return 'other';
}

export const PLATFORM_LABEL: Record<RecipePlatform, string> = {
  bilibili: 'B站',
  douyin: '抖音',
  xiaohongshu: '小红书',
  weibo: '微博',
  youtube: 'YouTube',
  legacy: '历史菜谱',
  // 兼容旧数据：2026-10-03 起「手打」并入「历史菜谱」，新数据不再产生这个值
  manual: '手打',
  other: '其他',
};

/**
 * 把旧数据里的 platform: 'manual'（原先单列的「手打」分类）归一成 'legacy'。
 * 用户 2026-10-03 决定：手打的菜跟历史菜谱算一类，筛选里不再单列。
 * 只在载入时跑一次；没有需要改的就原样返回，不做无谓的数组重建。
 */
function normalizePlatforms(list: Recipe[]): Recipe[] {
  if (!list.some((r) => (r.platform as string) === 'manual')) return list;
  return list.map((r) =>
    (r.platform as string) === 'manual' ? { ...r, platform: 'legacy' as RecipePlatform } : r
  );
}

/** 主料（筛选用，也是排菜时轮换蛋白质的依据） */
export const MAIN_INGREDIENT_ORDER: MainIngredient[] = [
  'pork', 'beef', 'lamb', 'chicken', 'duck_goose',
  'fish', 'shellfish', 'egg', 'tofu', 'mushroom', 'leafy', 'other',
];

export const MAIN_INGREDIENT_LABEL: Record<MainIngredient, string> = {
  pork: '猪',
  beef: '牛',
  lamb: '羊',
  chicken: '鸡',
  duck_goose: '鸭鹅',
  fish: '鱼',
  shellfish: '虾蟹贝',
  egg: '蛋',
  tofu: '豆制品',
  mushroom: '菌菇',
  leafy: '叶菜',
  other: '其他',
};

/** 蛋白档位 —— 排菜判断用，卡片上只作角标，不需要用户维护 */
export const PROTEIN_TIER_LABEL: Record<ProteinTier, string> = {
  main: '主荤',
  semi: '半荤',
  veg: '素',
};

/** 主料 → 默认荤素档位（手打加菜时自动带出来，她想改就改） */
export function defaultTierOf(m: MainIngredient): ProteinTier {
  if (m === 'leafy' || m === 'mushroom') return 'veg';
  if (m === 'egg' || m === 'tofu' || m === 'other') return 'semi';
  return 'main';
}

/** 标签池的起步标签 —— 用户随时可以增删 */
export const DEFAULT_TAGS = ['快手', '一锅熟', '容易做', '下饭', '孩子爱吃', '汤'];

export function useKitchen() {
  // ---------- 菜谱库 ----------
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = getItem(RECIPES_KEY);
      const parsed: Recipe[] = saved ? JSON.parse(saved) : [];
      return normalizePlatforms(parsed); // 旧的「手打」分类归一到「历史菜谱」
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setItem(RECIPES_KEY, JSON.stringify(recipes));
  }, [recipes]);

  const addRecipe = (input: Omit<Recipe, 'id' | 'createdAt'>) => {
    setRecipes((prev) => [
      { ...input, id: Date.now(), createdAt: Date.now() },
      ...prev,
    ]);
  };

  /** 批量添加：只需菜名 + 链接 */
  const addRecipesByLinks = (links: { title: string; url: string }[]) => {
    setRecipes((prev) => {
      const existing = new Set(prev.map((r) => r.url));
      const base = Date.now();
      const added = links
        .filter((l) => l.url && !existing.has(l.url))
        .map((l, i) => ({
          id: base + i,
          title: l.title || '未命名',
          url: l.url,
          platform: detectPlatform(l.url),
          ingredients: [],
          status: 'want' as const,
          createdAt: base + i,
          source: 'video' as const,
        }));
      return [...added, ...prev];
    });
  };

  /**
   * 导入历史菜谱（种子数据，无视频链接）
   * 按菜名去重，已存在的不重复导入。
   */
  const importLegacyRecipes = (): number => {
    const existing = new Set(recipes.map((r) => r.title));
    const base = Date.now();
    const created: Recipe[] = [];
    LEGACY_RECIPES.forEach((s) => {
      if (existing.has(s.title)) return;
      created.push({
        id: base + created.length,
        title: s.title,
        url: '',
        platform: 'legacy',
        ingredients: s.ingredients,
        cuisine: s.cuisine,
        status: 'want',
        createdAt: base + created.length,
        mainIngredient: s.mainIngredient,
        proteinTier: s.proteinTier,
        isSoup: s.isSoup,
        tags: [],
        source: 'legacy',
      });
    });
    if (created.length === 0) return 0;
    setRecipes((prev) => [...created, ...prev]);
    return created.length;
  };

  const updateRecipe = (id: number, updates: Partial<Recipe>) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  /** 把若干道菜从本周菜单里彻底摘掉（连同「手动」标记） */
  const purgeFromPlan = (ids: Set<number>) => {
    setPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => ({
        ...d,
        recipeIds: d.recipeIds.filter((x) => !ids.has(x)),
        manualIds: (d.manualIds || []).filter((x) => !ids.has(x)),
      })),
    }));
  };

  const deleteRecipe = (id: number) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    purgeFromPlan(new Set([id]));
  };

  /** 批量删除：一次删一批，同时从本周菜单里全部移除。返回实际删掉的条数。 */
  const deleteRecipes = (ids: number[]): number => {
    const set = new Set(ids);
    if (set.size === 0) return 0;
    const removed = recipes.filter((r) => set.has(r.id)).length;
    setRecipes((prev) => prev.filter((r) => !set.has(r.id)));
    purgeFromPlan(set);
    return removed;
  };

  /**
   * 手打一道菜，直接加到某一天。
   *
   * 同时写进菜谱库 —— 所以它以后能被搜到、被排菜排到、能补食材。
   * 库里已经有同名菜就直接用那一条，不再建重复的；这次填的食材会并进已有食材里。
   * 加进菜单时打上「手动」标记，重排时不会被冲掉。
   */
  const addManualDish = (
    date: string,
    input: {
      title: string;
      mainIngredient: MainIngredient;
      proteinTier: ProteinTier;
      ingredients?: string[];
    }
  ): { reused: boolean; alreadyInDay: boolean } | null => {
    const title = input.title.trim();
    if (!title) return null;
    const picked = (input.ingredients || []).map((s) => s.trim()).filter(Boolean);

    const existing = recipes.find((r) => r.title.trim() === title);
    let id: number;

    if (existing) {
      id = existing.id;
      // 库里已有这道菜：把她这次填的食材并进去，不覆盖原有的
      if (picked.length > 0) {
        const merged = Array.from(new Set([...(existing.ingredients || []), ...picked]));
        if (merged.length !== (existing.ingredients || []).length) {
          setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ingredients: merged } : r)));
        }
      }
    } else {
      id = Date.now() + Math.floor(Math.random() * 1000);
      const created: Recipe = {
        id,
        title,
        url: '',
        platform: 'legacy', // 手打的菜归入「历史菜谱」这一类（用户 2026-10-03 决定）
        ingredients: picked,
        status: 'want',
        createdAt: id,
        mainIngredient: input.mainIngredient,
        proteinTier: input.proteinTier,
        tags: [],
        source: 'manual',
        manual: true,
      };
      setRecipes((prev) => [created, ...prev]);
    }

    const day = plan.days.find((d) => d.date === date);
    const alreadyInDay = !!day?.recipeIds.includes(id);

    if (!alreadyInDay) {
      setPlan((prev) => ({
        ...prev,
        days: prev.days.map((d) =>
          d.date === date
            ? {
                ...d,
                recipeIds: [id, ...d.recipeIds],
                manualIds: Array.from(new Set([...(d.manualIds || []), id])),
              }
            : d
        ),
      }));
    }

    return { reused: !!existing, alreadyInDay };
  };

  /** 标记为"做过了" */
  const markCooked = (id: number) => {
    const today = toDateStr(new Date());
    updateRecipe(id, { status: 'cooked', lastCooked: today });
  };

  // ---------- 本周菜单 ----------
  const [plan, setPlan] = useState<MealPlan>(() => {
    try {
      const saved = getItem(PLAN_KEY);
      if (saved) {
        const parsed: MealPlan = JSON.parse(saved);
        // 如果不是本周的，重置为本周
        if (parsed.weekStart === toDateStr(getWeekStart())) return parsed;
      }
    } catch {
      /* ignore */
    }
    return buildEmptyWeek(getWeekStart());
  });

  useEffect(() => {
    setItem(PLAN_KEY, JSON.stringify(plan));
  }, [plan]);

  const setDayRecipes = (date: string, recipeIds: number[]) => {
    setPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => (d.date === date ? { ...d, recipeIds } : d)),
    }));
  };

  /**
   * 加/减某一天的一道菜。
   * 你自己点进来的都会打上「手动」标记 —— 以后重排菜单时不会被冲掉。
   */
  const toggleRecipeInDay = (date: string, recipeId: number) => {
    setPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.date !== date) return d;
        const has = d.recipeIds.includes(recipeId);
        const manual = new Set(d.manualIds || []);
        if (has) manual.delete(recipeId);
        else manual.add(recipeId);
        return {
          ...d,
          recipeIds: has ? d.recipeIds.filter((x) => x !== recipeId) : [...d.recipeIds, recipeId],
          manualIds: Array.from(manual),
        };
      }),
    }));
  };

  const setDayCustomText = (date: string, customText: string) => {
    setPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => (d.date === date ? { ...d, customText } : d)),
    }));
  };

  const clearWeek = () => setPlan(buildEmptyWeek(getWeekStart()));

  const resetToThisWeek = () => setPlan(buildEmptyWeek(getWeekStart()));

  /** 排菜入口 —— 算法本体在 computeWeekPlan（抽出去是为了能拿真实数据直接跑验证） */
  const planWeek = (perDay = 2, onlyDate?: string): PlanResult => {
    const pool = recipes.filter((r) => r.status !== 'never');
    if (pool.length === 0) return { ok: false, kept: 0, added: 0 };
    const weekStart = getWeekStart();
    const { days, kept, added } = computeWeekPlan({
      pool,
      planDays: plan.days,
      perDay,
      onlyDate,
      weekStart,
    });
    setPlan({ weekStart: toDateStr(weekStart), days });
    return { ok: true, kept, added };
  };

  /** 一键排菜：整周重排。每次点结果都不一样，可以反复刷。手加的菜留着不动。 */
  const autoPlan = (perDay = 2) => planWeek(perDay);

  /** 换一批：只重排某一天，其余六天不动。手加的菜留着不动。 */
  const rerollDay = (date: string, perDay = 2) => planWeek(perDay, date);

  /** 把某一天的菜复制到其它日子（会覆盖目标日原有安排，含「手动」标记） */
  const copyDay = (fromDate: string, toDates: string[]): number => {
    const src = plan.days.find((d) => d.date === fromDate);
    if (!src || toDates.length === 0) return 0;
    const targets = new Set(toDates);
    setPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        targets.has(d.date)
          ? { ...d, recipeIds: [...src.recipeIds], manualIds: [...(src.manualIds || [])] }
          : d
      ),
    }));
    return toDates.length;
  };

  // ---------- 采购清单 ----------
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = getItem(CHECKED_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    setItem(CHECKED_KEY, JSON.stringify(checked));
  }, [checked]);

  const toggleChecked = (name: string) => {
    setChecked((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const resetChecked = () => setChecked({});

  const recipeMap = useMemo(() => {
    const m = new Map<number, Recipe>();
    recipes.forEach((r) => m.set(r.id, r));
    return m;
  }, [recipes]);

  /** 本周菜单里所有菜的集合 */
  const plannedRecipes = useMemo(() => {
    const out: Recipe[] = [];
    plan.days.forEach((d) =>
      d.recipeIds.forEach((id) => {
        const r = recipeMap.get(id);
        if (r && !out.find((x) => x.id === r.id)) out.push(r);
      })
    );
    return out;
  }, [plan, recipeMap]);

  /** 采购清单：汇总所有食材 */
  const shoppingList = useMemo<ShoppingItem[]>(() => {
    const map = new Map<string, ShoppingItem>();
    plannedRecipes.forEach((r) => {
      (r.ingredients || []).forEach((raw) => {
        const name = (raw || '').trim();
        if (!name) return;
        const item = map.get(name);
        if (item) {
          if (!item.recipeTitles.includes(r.title)) item.recipeTitles.push(r.title);
        } else {
          map.set(name, { name, recipeTitles: [r.title] });
        }
      });
    });
    return Array.from(map.values()).map((it) => ({ ...it, checked: !!checked[it.name] }));
  }, [plannedRecipes, checked]);

  const stats = useMemo(
    () => ({
      total: recipes.length,
      want: recipes.filter((r) => r.status === 'want').length,
      cooked: recipes.filter((r) => r.status === 'cooked').length,
      never: recipes.filter((r) => r.status === 'never').length,
      planned: plannedRecipes.length,
      pending: recipes.filter((r) => (r.pendingIngredients || []).length > 0).length,
    }),
    [recipes, plannedRecipes]
  );

  /** 标签池：起步标签 + 用户自己用过的所有标签 */
  const tagPool = useMemo(() => {
    const s = new Set<string>(DEFAULT_TAGS);
    recipes.forEach((r) => (r.tags || []).forEach((t) => s.add(t)));
    return Array.from(s);
  }, [recipes]);

  return {
    recipes,
    addRecipe,
    addRecipesByLinks,
    importLegacyRecipes,
    updateRecipe,
    deleteRecipe,
    deleteRecipes,
    addManualDish,
    markCooked,
    plan,
    setDayRecipes,
    toggleRecipeInDay,
    setDayCustomText,
    clearWeek,
    resetToThisWeek,
    autoPlan,
    rerollDay,
    copyDay,
    recipeMap,
    plannedRecipes,
    shoppingList,
    checked,
    toggleChecked,
    resetChecked,
    stats,
    tagPool,
  };
}

/** 这几个原来定义在本文件，已挪到 lib/mealPlan —— 转发出去，外部 import 路径不用改 */
export { toDateStr, getWeekStart, isVegDish };
export type { PlanResult };
