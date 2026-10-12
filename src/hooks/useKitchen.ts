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
const PLANS_KEY = 'doris_meal_plans';
const PLAN_KEY = 'doris_meal_plan'; // 旧 key，仅用于迁移
const CHECKED_KEY = 'doris_shopping_checked';

/** 多周菜单存储：保留最近多少周的 plan（用户要求"起码一个月"，设 8 周 ≈ 两个月，留余量） */
const MAX_WEEKS = 8;

/** 清理过期的周计划，只保留最近 MAX_WEEKS 周 */
function cleanPlans(all: Record<string, MealPlan>): Record<string, MealPlan> {
  const keys = Object.keys(all).sort();
  if (keys.length <= MAX_WEEKS) return all;
  const recent = keys.slice(-MAX_WEEKS);
  const out: Record<string, MealPlan> = {};
  recent.forEach((k) => {
    out[k] = all[k];
  });
  return out;
}

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

/**
 * 尝试读取 YouTube 视频标题。
 * 先走 noembed.com 代理，失败再直连 YouTube oEmbed；失败或超时时返回空字符串。
 */
async function fetchYouTubeTitle(url: string): Promise<string> {
  const fetchJson = async (endpoint: string): Promise<string> => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(t);
      if (!res.ok) return '';
      const data = await res.json();
      return typeof data.title === 'string' ? data.title.trim() : '';
    } catch {
      return '';
    }
  };

  const noembed = await fetchJson(
    `https://noembed.com/embed?url=${encodeURIComponent(url)}&format=json`
  );
  if (noembed) return noembed;

  // fallback：直连 YouTube oEmbed
  return fetchJson(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  );
}

/**
 * 把 YouTube/B站/抖音 等视频标题洗干净，尽量只剩菜名。
 * 规则是启发式，不可能 100% 准确；洗完后太短就返回原标题兜底。
 */
function cleanVideoTitle(raw: string): string {
  if (!raw) return '';
  let s = raw;

  // 1. 去掉成对括号及里面内容（UP主/频道名、标签、字幕说明等）
  s = s.replace(/\[[^\]]*\]/g, ' ');
  s = s.replace(/【[^】]*】/g, ' ');
  s = s.replace(/\([^)]*\)/g, ' ');
  s = s.replace(/（[^）]*）/g, ' ');
  s = s.replace(/「[^」]*」/g, ' ');
  s = s.replace(/『[^』]*』/g, ' ');

  // 2. 按常见分隔符切分，优先保留中文字符最多的那一段（双语标题时更准）
  const parts = s.split(/[,，。；;、|/·]/).map((p) => p.trim()).filter(Boolean);
  const mainPart = (parts.length > 1
    ? parts.reduce((a, b) => {
        const ca = (a.match(/[\u4e00-\u9fa5]/g) || []).length;
        const cb = (b.match(/[\u4e00-\u9fa5]/g) || []).length;
        if (ca !== cb) return ca > cb ? a : b;
        return a.length >= b.length ? a : b;
      })
    : parts[0]) || s;

  // 3. 去掉开头的频道名前缀（小高姐： / 老饭骨· / XXX | ）
  let t = mainPart.replace(/^[^\u4e00-\u9fa5a-zA-Z]*[^:：·|/]+[:：·|/]+/u, '');

  // 4. 去掉常见英文前缀/后缀
  const enJunk = ['how to make', 'how to cook', 'easy', 'simple', 'homemade', 'cooking', 'cook', 'recipe', 'recipes', 'tutorial', 'eng sub', 'chinese food', 'chinese', 'full video', 'hd', '4k', 'vlog'];
  const enRe = new RegExp(`\\b(${enJunk.join('|')})\\b`, 'gi');
  t = t.replace(enRe, ' ');

  // 5. 去掉常见中文前缀/后缀
  const cnJunk = ['食谱', '菜谱', '做法', '教程', '怎么做', '如何做', '家常', '简单', '正宗', '传统', '美食', '中式', '台式', '港式', '日式', '韩式', '越式', '泰式', '川式', '广式', '西式', '滇式', '湘式', '鲁式', '苏式', '浙式', '闽式', '徽式', '京式', '东北式'];
  const cnRe = new RegExp(`(${cnJunk.join('|')})`, 'gi');
  t = t.replace(cnRe, ' ');

  // 6. 合并连续重复词（常见标题重复菜名：「葱油拌面 如何做葱油拌面」）
  const tokens = t.split(/\s+/).filter(Boolean);
  const seen = new Set<string>();
  const deduped: string[] = [];
  tokens.forEach((tok) => {
    const key = tok.toLowerCase().replace(/[\-·.,]/g, '');
    if (!key || seen.has(key)) return;
    seen.add(key);
    deduped.push(tok);
  });

  // 6. 去掉末尾无意义符号
  let out = deduped.join(' ').replace(/[\-\s·|/,：；;]+$/g, '').trim();

  // 7. 兜底：如果洗完后少于 2 个字符，返回原标题
  if (!out || out.length < 2) out = raw.trim();
  return out;
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

  /** 把链接解析成待确认的菜谱预览（不保存），YouTube 会自动读标题并清洗。 */
  const previewRecipesByLinks = async (
    links: { title: string; url: string }[]
  ): Promise<Omit<Recipe, 'id' | 'createdAt'>[]> => {
    const existing = new Set(recipes.map((r) => r.url));
    const newLinks = links.filter((l) => l.url && !existing.has(l.url));

    const titles = await Promise.all(
      newLinks.map(async (l) => {
        if (l.title.trim()) return l.title.trim();
        if (detectPlatform(l.url) === 'youtube') {
          const fetched = await fetchYouTubeTitle(l.url);
          return cleanVideoTitle(fetched) || l.title.trim() || '未命名';
        }
        return l.title.trim() || '未命名';
      })
    );

    return newLinks.map((l, i) => ({
      title: titles[i],
      url: l.url,
      platform: detectPlatform(l.url),
      ingredients: [],
      status: 'want' as const,
      source: 'video' as const,
    }));
  };

  /** 批量保存预览后的菜谱（点「确认保存」时才调用） */
  const addRecipePreviews = (previews: Omit<Recipe, 'id' | 'createdAt'>[]): number => {
    if (previews.length === 0) return 0;
    const base = Date.now();
    const added: Recipe[] = previews.map((p, i) => ({
      ...p,
      id: base + i,
      createdAt: base + i,
    }));
    setRecipes((prev) => [...added, ...prev]);
    return added.length;
  };

  /** 批量添加：只需菜名 + 链接。YouTube 链接会自动读取标题。
   * 现在内部走 preview + addRecipePreviews，保持旧接口不变。
   */
  const addRecipesByLinks = async (links: { title: string; url: string }[]) => {
    const previews = await previewRecipesByLinks(links);
    return addRecipePreviews(previews);
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

  /** 把若干道菜从当前周菜单里彻底摘掉（连同「手动」标记） */
  const purgeFromPlan = (ids: Set<number>) => {
    updateCurrentPlan((prev) => ({
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
      updateCurrentPlan((prev) => ({
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

  // ---------- 多周菜单 ----------
  const thisWeekStart = toDateStr(getWeekStart());

  const [plans, setPlans] = useState<Record<string, MealPlan>>(() => {
    try {
      const saved = getItem(PLANS_KEY);
      if (saved) {
        const parsed: Record<string, MealPlan> = JSON.parse(saved);
        const cleaned = cleanPlans(parsed);
        if (!cleaned[thisWeekStart]) {
          cleaned[thisWeekStart] = buildEmptyWeek(getWeekStart());
        }
        return cleaned;
      }
      // 兼容旧版单周数据
      const old = getItem(PLAN_KEY);
      if (old) {
        const parsed: MealPlan = JSON.parse(old);
        const migrated: Record<string, MealPlan> = {};
        if (parsed.weekStart) migrated[parsed.weekStart] = parsed;
        if (!migrated[thisWeekStart]) {
          migrated[thisWeekStart] = buildEmptyWeek(getWeekStart());
        }
        return migrated;
      }
    } catch {
      /* ignore */
    }
    return { [thisWeekStart]: buildEmptyWeek(getWeekStart()) };
  });

  const [currentWeek, setCurrentWeek] = useState<string>(thisWeekStart);

  const plan = useMemo(
    () => plans[currentWeek] || buildEmptyWeek(new Date(`${currentWeek}T00:00:00`)),
    [plans, currentWeek]
  );

  useEffect(() => {
    setItem(PLANS_KEY, JSON.stringify(plans));
  }, [plans]);

  /** 更新当前周的 plan，并写回 plans 字典 */
  const updateCurrentPlan = (updater: (prev: MealPlan) => MealPlan) => {
    setPlans((prev) => {
      const existing = prev[currentWeek] || buildEmptyWeek(new Date(`${currentWeek}T00:00:00`));
      const next = updater(existing);
      return { ...prev, [currentWeek]: next };
    });
  };

  const setDayRecipes = (date: string, recipeIds: number[]) => {
    updateCurrentPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => (d.date === date ? { ...d, recipeIds } : d)),
    }));
  };

  /**
   * 把一道菜谱库里的菜，主动加进当前周的某一天。
   * 只加不删；如果已经在那天了就返回 false。
   * 加进去的菜会打上「手动」标记，以后重排不会被冲掉。
   */
  const addRecipeToDay = (date: string, recipeId: number): boolean => {
    const day = plan.days.find((d) => d.date === date);
    if (!day) return false;
    if (day.recipeIds.includes(recipeId)) return false;

    updateCurrentPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.date === date
          ? {
              ...d,
              recipeIds: [...d.recipeIds, recipeId],
              manualIds: Array.from(new Set([...(d.manualIds || []), recipeId])),
            }
          : d
      ),
    }));
    return true;
  };

  /**
   * 加/减某一天的一道菜。
   * 你自己点进来的都会打上「手动」标记 —— 以后重排菜单时不会被冲掉。
   */
  const toggleRecipeInDay = (date: string, recipeId: number) => {
    updateCurrentPlan((prev) => ({
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
    updateCurrentPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => (d.date === date ? { ...d, customText } : d)),
    }));
  };

  /** 清空当前显示的这一周 */
  const clearWeek = () => updateCurrentPlan(() => buildEmptyWeek(new Date(`${currentWeek}T00:00:00`)));

  /** 跳回本周并清空 */
  const resetToThisWeek = () => {
    const ws = toDateStr(getWeekStart());
    setCurrentWeek(ws);
    setPlans((prev) => ({ ...prev, [ws]: buildEmptyWeek(getWeekStart()) }));
  };

  /** 切到任意一周（没有就创建空周） */
  const setWeekStart = (dateStr: string) => {
    setPlans((prev) => {
      if (prev[dateStr]) return prev;
      return { ...prev, [dateStr]: buildEmptyWeek(new Date(`${dateStr}T00:00:00`)) };
    });
    setCurrentWeek(dateStr);
  };

  /** 把一道菜从某天移到另一天，手动标记跟着走 */
  const moveRecipe = (fromDate: string, toDate: string, recipeId: number): boolean => {
    const srcDay = plan.days.find((d) => d.date === fromDate);
    if (!srcDay || !srcDay.recipeIds.includes(recipeId)) return false;
    if (fromDate === toDate) return true;

    updateCurrentPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.date === fromDate) {
          return {
            ...d,
            recipeIds: d.recipeIds.filter((x) => x !== recipeId),
            manualIds: (d.manualIds || []).filter((x) => x !== recipeId),
          };
        }
        if (d.date === toDate) {
          const recipeIds = d.recipeIds.includes(recipeId) ? d.recipeIds : [...d.recipeIds, recipeId];
          const manual = new Set(d.manualIds || []);
          manual.add(recipeId);
          return { ...d, recipeIds, manualIds: Array.from(manual) };
        }
        return d;
      }),
    }));
    return true;
  };

  /** 排菜入口 —— 算法本体在 computeWeekPlan（抽出去是为了能拿真实数据直接跑验证） */
  const planWeek = (perDay = 2, onlyDate?: string): PlanResult => {
    const pool = recipes.filter((r) => r.status !== 'never');
    if (pool.length === 0) return { ok: false, kept: 0, added: 0 };
    const weekStart = new Date(`${currentWeek}T00:00:00`);
    const { days, kept, added } = computeWeekPlan({
      pool,
      planDays: plan.days,
      perDay,
      onlyDate,
      weekStart,
    });
    updateCurrentPlan(() => ({ weekStart: toDateStr(weekStart), days }));
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
    updateCurrentPlan((prev) => ({
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
    previewRecipesByLinks,
    addRecipePreviews,
    importLegacyRecipes,
    updateRecipe,
    deleteRecipe,
    deleteRecipes,
    addManualDish,
    markCooked,
    plan,
    plans,
    currentWeek,
    setWeekStart,
    setDayRecipes,
    toggleRecipeInDay,
    addRecipeToDay,
    setDayCustomText,
    clearWeek,
    resetToThisWeek,
    autoPlan,
    rerollDay,
    copyDay,
    moveRecipe,
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
