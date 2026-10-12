/**
 * Kitchen 统计引擎
 *
 * 输入：多周菜单 plans + 菜谱库 recipes
 * 输出：周/月维度的趣味统计
 *
 * 说明：
 * - 食材颜色、抗炎属性基于食材名做规则匹配，不是精准营养分析。
 * - 营养估算只给方向性参考（如"高纤""高蛋白""维生素C丰富"），不做克级计算。
 */

import type { MealPlan, Recipe } from '../types';

export interface IngredientStat {
  name: string;
  count: number;           // 出现次数
  color: string | null;    // 颜色分组
  antiInflammatory: boolean;
  recipes: string[];
  categories: string[];    // 肉 / 海鲜 / 蛋 / 豆制品 / 蔬菜 / 菌菇 / 其它
}

export interface KitchenStats {
  period: { from: string; to: string };
  totalDishes: number;          // 不重复的菜道数
  totalMeals: number;           // 餐次（一道菜算一次）
  uniqueIngredients: number;    // 不重复食材数
  ingredientCount: number;    // 食材总出现次数
  colorGroups: Record<string, number>;
  mainGroups: Record<string, number>;   // 主料分组统计
  cuisineGroups: Record<string, number>;
  proteinTiers: Record<string, number>;
  antiInflammatoryCount: number;
  topIngredients: IngredientStat[];
  tags: Record<string, number>;
  repeats: { recipeId: number; title: string; count: number }[];
}

/** 颜色词库 —— 同一食材可能有多种写法，尽量覆盖 */
const COLOR_RULES: { color: string; keywords: string[] }[] = [
  { color: '红', keywords: ['番茄', '西红柿', '红萝卜', '胡萝卜', '红椒', '红辣椒', '辣椒', '草莓', '西瓜', '红枣', '枸杞', '山楂', '红肉', '牛肉', '猪肝', '猪血'] },
  { color: '橙黄', keywords: ['南瓜', '玉米', '黄椒', '姜黄', '姜', '鸡蛋', '蛋黄', '芒果', '橙子', '番薯', '红薯', '地瓜', '土豆', '马铃薯'] },
  { color: '绿', keywords: ['青菜', '菠菜', '西兰花', '椰菜花', '青瓜', '黄瓜', '苦瓜', '青椒', '葱', '芹菜', '豆角', '莴笋', '生菜', '油麦菜', '菜心', '芥兰', '通菜', '韭菜', '韭黄', '蒜苔', '蒜苗', '荷兰豆', '豌豆', '毛豆', '牛油果'] },
  { color: '白', keywords: ['白萝卜', '洋葱', '蒜', '花椰菜', '白菜', '娃娃菜', '豆腐', '鸡肉', '鸡胸肉', '鱼', '鱼片', '虾', '虾仁', '鱿鱼', '贝', '米饭', '面条', '粉丝', '粉皮', '腐竹', '银耳', '百合'] },
  { color: '紫黑', keywords: ['茄子', '紫甘蓝', '紫薯', '黑米', '黑豆', '黑芝麻', '木耳', '香菇', '蘑菇', '紫菜', '海带'] },
  { color: '粉棕', keywords: ['猪肉', '排骨', '五花肉', '牛肉', '羊肉', '腊肠', '腊肉', '火腿', '培根', '香肠', '肉丸', '鱼丸', '虾饺'] },
];

/** 抗炎食材词库（基于抗炎菜谱数据与常见抗炎食物） */
const ANTI_INFLAMMATORY_KEYWORDS = [
  '三文鱼', '鯖魚', '鲭鱼', '沙丁鱼', '亚麻籽', '奇亚籽', '核桃', '杏仁', '姜黄', '薑黃', '生姜', '薑',
  '菠菜', '羽衣甘蓝', '西兰花', '椰菜花', '番茄', '西红柿', '红萝卜', '胡萝卜', '蓝莓', '草莓', '橙', '柠檬',
  '牛油果', '橄榄', '橄榄油', '蒜', '洋葱', '蘑菇', '香菇', '木耳', '海带', '紫菜', '姜', '绿茶',
  '黑豆', '红豆', '鹰嘴豆', '藜麦', '燕麦', '糙米', '红薯', '紫薯', '南瓜', '芹菜', '苹果', '葡萄',
  '樱桃', '菠萝', '姜', ' turmeric ', '姜黄粉',
];

/** 食材类别 */
const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  { category: '肉类', keywords: ['猪', '牛', '羊', '鸡', '鸭', '鹅', '肉', '排骨', '五花', '里脊', '腿肉', '肉末', '肉丸', '腊肉', '腊肠', '火腿', '培根', '香肠'] },
  { category: '海鲜', keywords: ['鱼', '虾', '蟹', '贝', '鱿', '蚝', '蛤', '鲍', '参', '翅', '三文鱼', '鲭鱼', '沙丁鱼', '鳕鱼', '鲈鱼', '黄花鱼', '带鱼'] },
  { category: '蛋类', keywords: ['蛋', '鸡蛋', '鸭蛋', '皮蛋', '咸蛋'] },
  { category: '豆制品', keywords: ['豆腐', '豆干', '豆皮', '腐竹', '豆浆', '毛豆', '豌豆', '豆角', '黄豆', '黑豆', '红豆', '绿豆', '鹰嘴豆', '芸豆'] },
  { category: '蔬菜', keywords: ['菜', '瓜', '茄', '椒', '菇', '菌', '笋', '藕', '薯', '芋', '玉米', '胡萝卜', '萝卜', '洋葱', '蒜', '葱', '芹菜', '韭菜', '生菜', '菠菜', '西兰花', '花菜', '番茄'] },
  { category: '菌菇', keywords: ['菇', '菌', '蘑', '香菇', '平菇', '金针菇', '杏鲍菇', '口蘑', '茶树菇', '木耳', '银耳'] },
  { category: '主食', keywords: ['饭', '面', '粉', '米', '粥', '饼', '馒头', '包子', '饺子', '馄饨', '云吞', '年糕', '河粉', '米粉', '意面', '通心粉', '荞麦', '燕麦', '藜麦'] },
  { category: '水果', keywords: ['果', '苹果', '橙', '柠檬', '莓', '葡萄', '西瓜', '芒果', '菠萝', '梨', '桃', '李', '柿', '枣', '香蕉', '牛油果'] },
];

function normalizeIngredient(name: string): string {
  return name
    .replace(/[\s·•]+/g, '')
    .replace(/[（(].*?[）)]/g, '')
    .replace(/\d+[克g斤个条片块根粒]/g, '')
    .trim();
}

export function guessColor(name: string): string | null {
  const n = normalizeIngredient(name);
  for (const rule of COLOR_RULES) {
    if (rule.keywords.some((k) => n.includes(k))) return rule.color;
  }
  return null;
}

export function isAntiInflammatory(name: string): boolean {
  const n = normalizeIngredient(name);
  return ANTI_INFLAMMATORY_KEYWORDS.some((k) => n.includes(k));
}

export function guessCategories(name: string): string[] {
  const n = normalizeIngredient(name);
  const cats: string[] = [];
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => n.includes(k))) cats.push(rule.category);
  }
  return cats.length ? Array.from(new Set(cats)) : ['其它'];
}

/** 主料 → 统计分组 */
export function mainGroup(main: string | undefined): string {
  if (!main) return '其它';
  if (['pork', 'beef', 'lamb', 'chicken', 'duck_goose'].includes(main)) return '肉禽';
  if (['fish', 'shellfish'].includes(main)) return '海鲜';
  if (main === 'egg') return '蛋';
  if (main === 'tofu') return '豆制品';
  if (main === 'mushroom') return '菌菇';
  if (main === 'leafy') return '叶菜';
  return '其它';
}

/** 统计某个日期范围内的菜单 */
export function computeStats(
  plans: Record<string, MealPlan>,
  recipes: Recipe[],
  from: string,
  to: string
): KitchenStats {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const weeks = Object.values(plans)
    .filter((p) => p.weekStart >= from && p.weekStart <= to)
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  const ingredientMap = new Map<string, IngredientStat>();
  const cuisineMap = new Map<string, number>();
  const proteinTierMap = new Map<string, number>();
  const mainGroupMap = new Map<string, number>();
  const tagMap = new Map<string, number>();
  const recipeCount = new Map<number, number>();
  const dishSet = new Set<number>();
  let totalMeals = 0;

  weeks.forEach((w) => {
    w.days.forEach((d) => {
      d.recipeIds.forEach((id) => {
        const r = recipeMap.get(id);
        if (!r) return;
        dishSet.add(id);
        totalMeals++;
        recipeCount.set(id, (recipeCount.get(id) || 0) + 1);

        // 菜系
        if (r.cuisine) {
          cuisineMap.set(r.cuisine, (cuisineMap.get(r.cuisine) || 0) + 1);
        }
        // 蛋白档位
        if (r.proteinTier) {
          proteinTierMap.set(r.proteinTier, (proteinTierMap.get(r.proteinTier) || 0) + 1);
        }
        // 主料分组
        const mg = mainGroup(r.mainIngredient);
        mainGroupMap.set(mg, (mainGroupMap.get(mg) || 0) + 1);

        // 标签
        (r.tags || []).forEach((t) => {
          tagMap.set(t, (tagMap.get(t) || 0) + 1);
        });

        // 食材
        (r.ingredients || []).forEach((raw) => {
          const name = raw.trim();
          if (!name) return;
          const key = normalizeIngredient(name);
          if (!key) return;
          const existing = ingredientMap.get(key);
          if (existing) {
            existing.count++;
            if (!existing.recipes.includes(r.title)) existing.recipes.push(r.title);
          } else {
            ingredientMap.set(key, {
              name,
              count: 1,
              color: guessColor(name),
              antiInflammatory: isAntiInflammatory(name),
              recipes: [r.title],
              categories: guessCategories(name),
            });
          }
        });
      });
    });
  });

  const topIngredients = Array.from(ingredientMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const colorGroups: Record<string, number> = {};
  ingredientMap.forEach((it) => {
    if (!it.color) return;
    colorGroups[it.color] = (colorGroups[it.color] || 0) + 1;
  });

  const antiInflammatoryCount = Array.from(ingredientMap.values()).filter((it) => it.antiInflammatory).length;

  const repeats = Array.from(recipeCount.entries())
    .filter(([, c]) => c > 1)
    .map(([id, count]) => ({ recipeId: id, title: recipeMap.get(id)?.title || '未知', count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    period: { from, to },
    totalDishes: dishSet.size,
    totalMeals,
    uniqueIngredients: ingredientMap.size,
    ingredientCount: Array.from(ingredientMap.values()).reduce((sum, it) => sum + it.count, 0),
    colorGroups,
    mainGroups: Object.fromEntries(mainGroupMap),
    cuisineGroups: Object.fromEntries(cuisineMap),
    proteinTiers: Object.fromEntries(proteinTierMap),
    antiInflammatoryCount,
    topIngredients,
    tags: Object.fromEntries(tagMap),
    repeats,
  };
}

/** 根据 plans 推断可用的最早/最晚周 */
export function planDateRange(plans: Record<string, MealPlan>): { min: string; max: string } {
  const keys = Object.keys(plans).sort();
  if (keys.length === 0) {
    const today = new Date();
    const ws = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    const s = ws.toISOString().slice(0, 10);
    return { min: s, max: s };
  }
  return { min: keys[0], max: keys[keys.length - 1] };
}
