/**
 * 排菜算法验证脚本（用真实的 135 道历史菜谱跑）
 *
 * 跑法（Node 22+）：
 *   node --experimental-strip-types scripts/verify-meal-plan.mjs
 *
 * 重点验四件事：
 *   1. 你手加的菜，整周重排 / 单天「换」之后还在不在
 *   2. 手加的菜会不会被 AI 又排到别的天去（重复）
 *   3. 手加的菜占不占每天的配额
 *   4. 老规矩有没有被破坏：一天不两道全素、一周同一道菜不重复
 */
import { LEGACY_RECIPES } from '../src/data/legacyRecipes.ts';
import { computeWeekPlan, getWeekStart, toDateStr, isVegDish } from '../src/lib/mealPlan.ts';

const BASE = 1700000000000;
const RECIPES = LEGACY_RECIPES.map((s, i) => ({
  id: BASE + i,
  title: s.title,
  url: '',
  platform: 'legacy',
  ingredients: s.ingredients,
  cuisine: s.cuisine,
  status: 'want',
  createdAt: BASE + i,
  mainIngredient: s.mainIngredient,
  proteinTier: s.proteinTier,
  isSoup: s.isSoup,
  tags: [],
  source: 'legacy',
}));

const WEEK_START = getWeekStart(new Date('2026-10-02T00:00:00'));
const DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(WEEK_START);
  d.setDate(d.getDate() + i);
  return toDateStr(d);
});
const LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const idOf = (title) => {
  const r = RECIPES.find((x) => x.title === title);
  if (!r) throw new Error(`找不到菜：${title}`);
  return r.id;
};
const titleOf = (id) => RECIPES.find((r) => r.id === id)?.title ?? '?';

/** 造一个"周三手加了两道菜"的菜单 */
function makePlan({ handTitles, perDaySlots = 2 } = {}) {
  const handIds = handTitles.map(idOf);
  return {
    weekStart: toDateStr(WEEK_START),
    days: DATES.map((date, i) => ({
      date,
      label: LABELS[i],
      recipeIds: i === 2 ? [...handIds] : [],
      manualIds: i === 2 ? [...handIds] : [],
    })),
  };
}

let pass = 0;
let fail = 0;
function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail ? ' —— ' + detail : ''}`);
  }
}

const HAND = ['洋葱排骨', '包菜炒蛋'];

/* ---------------- 1. 整周重排，手加的还在吗 ---------------- */
console.log('\n[1] 整周「一键排菜」20 次，周三手加的两道菜是否原位保留');
{
  let keepAll = 0;
  let vanished = [];
  const samples = [];
  for (let t = 0; t < 20; t++) {
    const plan = makePlan({ handTitles: HAND });
    const { days, kept } = computeWeekPlan({
      pool: RECIPES, planDays: plan.days, perDay: 2, weekStart: WEEK_START,
    });
    const wed = days[2].recipeIds;
    const ok = HAND.every((h) => wed.includes(idOf(h)));
    if (ok) keepAll++;
    else vanished.push(days[2].recipeIds.map(titleOf).join('/'));
    if (t < 3) samples.push(days[2].recipeIds.map(titleOf).join(' + '));
    if (kept !== 2) vanished.push(`kept=${kept}`);
  }
  check('20/20 都保留了', keepAll === 20, `只有 ${keepAll}/20；丢失样例：${vanished[0] || ''}`);
  console.log('     周三样例：' + samples.join(' | '));
}

/* ---------------- 2. 单天「换」，手加的还在吗 + 其他天有没有被动 ---------------- */
console.log('\n[2] 单天「换」20 次，手加的菜是否保留、其他天是否原封不动');
{
  let keepAll = 0;
  let othersUntouched = 0;
  const samples = [];
  for (let t = 0; t < 20; t++) {
    const plan = makePlan({ handTitles: HAND });
    // 先整周排一次，其他天有内容
    const first = computeWeekPlan({ pool: RECIPES, planDays: plan.days, perDay: 2, weekStart: WEEK_START });
    const snapshot = first.days.map((d) => d.recipeIds.join(','));

    const rerolled = computeWeekPlan({
      pool: RECIPES, planDays: first.days, perDay: 2, onlyDate: DATES[2], weekStart: WEEK_START,
    });
    const wed = rerolled.days[2].recipeIds;
    if (HAND.every((h) => wed.includes(idOf(h)))) keepAll++;
    if (t < 3) samples.push(wed.map(titleOf).join(' + '));

    const othersSame = rerolled.days.every(
      (d, i) => i === 2 || d.recipeIds.join(',') === snapshot[i]
    );
    if (othersSame) othersUntouched++;
  }
  check('20/20 都保留了', keepAll === 20, `只有 ${keepAll}/20`);
  check('20/20 其他六天没被动过', othersUntouched === 20, `只有 ${othersUntouched}/20`);
  console.log('     周三样例：' + samples.join(' | '));
}

/* ---------------- 3. 手加的菜占不占配额 ---------------- */
console.log('\n[3] 手加 2 道 + perDay=2，周三还会不会被塞第 3 道');
{
  let exact = true;
  let seen = '';
  for (let t = 0; t < 20; t++) {
    const plan = makePlan({ handTitles: HAND });
    const { days, added, kept } = computeWeekPlan({
      pool: RECIPES, planDays: plan.days, perDay: 2, weekStart: WEEK_START,
    });
    const wed = days[2].recipeIds;
    const wedOk = wed.length === 2 && HAND.every((h) => wed.includes(idOf(h)));
    const othersOk = days.every((d, i) => i === 2 || d.recipeIds.length === 2);
    const addedOk = added === 12; // 其余六天各 2 道，周三一道没补
    if (!wedOk || !othersOk || !addedOk) {
      exact = false;
      seen = `周三是 ${wed.length} 道 / added=${added} / kept=${kept}`;
    }
  }
  check('周三恰好 2 道（就是手加的那两道），AI 一道没补', exact, seen);
}

console.log('\n[3b] 手加 1 道 + perDay=2，周三应该是 2 道（1 手加 + 1 AI）');
{
  let allOk = true;
  const samples = [];
  for (let t = 0; t < 20; t++) {
    const plan = makePlan({ handTitles: ['洋葱排骨'] });
    const { days } = computeWeekPlan({
      pool: RECIPES, planDays: plan.days, perDay: 2, weekStart: WEEK_START,
    });
    const wed = days[2].recipeIds;
    if (t < 3) samples.push(wed.map(titleOf).join(' + '));
    if (wed.length !== 2 || !wed.includes(idOf('洋葱排骨'))) allOk = false;
  }
  check('周三恰好 2 道：手加的在，AI 补了 1 道', allOk);
  console.log('     周三样例：' + samples.join(' | '));
}

/* ---------------- 4. 手加的菜会被 AI 排到别的天吗 ---------------- */
console.log('\n[4] 手加的菜会不会被 AI 又排到别的天（重复）');
{
  let dup = 0;
  const samples = [];
  for (let t = 0; t < 50; t++) {
    const plan = makePlan({ handTitles: HAND });
    const { days } = computeWeekPlan({
      pool: RECIPES, planDays: plan.days, perDay: 2, weekStart: WEEK_START,
    });
    for (const h of HAND) {
      const where = days.filter((d) => d.recipeIds.includes(idOf(h))).map((d) => d.label);
      if (where.length > 1) {
        dup++;
        if (samples.length < 3) samples.push(`${h} 出现在 ${where.join('、')}`);
      }
    }
  }
  check('50 次都没重复', dup === 0, samples.join('; '));
}

/* ---------------- 5. 老规矩回归：全素 / 重复 ---------------- */
console.log('\n[5] 老规矩回归（2000 次整周重排，perDay=2）');
{
  let allVegDays = 0;
  let dupDish = 0;
  let overCap = 0;
  let sample = '';
  const CAP = 2; // 同一种主料一周上限

  for (let t = 0; t < 2000; t++) {
    const plan = makePlan({ handTitles: [] });
    const { days } = computeWeekPlan({
      pool: RECIPES, planDays: plan.days, perDay: 2, weekStart: WEEK_START,
    });
    for (const d of days) {
      const dishes = d.recipeIds.map((id) => RECIPES.find((r) => r.id === id));
      if (dishes.length >= 2 && dishes.every((r) => isVegDish(r))) {
        allVegDays++;
        if (!sample) sample = d.label + '：' + dishes.map((r) => r.title).join(' + ');
      }
    }
    const all = days.flatMap((d) => d.recipeIds);
    if (new Set(all).size !== all.length) dupDish++;

    const mainCnt = {};
    days.forEach((d) => d.recipeIds.forEach((id) => {
      const m = RECIPES.find((r) => r.id === id)?.mainIngredient;
      if (m) mainCnt[m] = (mainCnt[m] || 0) + 1;
    }));
    if (Object.values(mainCnt).some((c) => c > CAP)) overCap++;
  }
  check('一天两道全素：0 次', allVegDays === 0, `出现 ${allVegDays} 次，例：${sample}`);
  check(`同一主料一周超过 ${CAP} 次：0 次`, overCap === 0, `出现 ${overCap} 次`);
  check('一周内同一道菜重复：0 次', dupDish === 0, `出现 ${dupDish}/2000 次`);
}

/* ---------------- 6. 库为空 / 菜被删 ---------------- */
console.log('\n[6] 边界');
{
  const plan = makePlan({ handTitles: HAND });
  // 手加的菜被删了（不在 pool 里）
  const poolWithoutHand = RECIPES.filter((r) => !HAND.includes(r.title));
  const { days } = computeWeekPlan({
    pool: poolWithoutHand, planDays: plan.days, perDay: 2, weekStart: WEEK_START,
  });
  check('手加的菜已从库里删掉时，不会残留幽灵 id', days[2].recipeIds.every((id) => id !== idOf('洋葱排骨')));
  check('周三照样能排满 2 道', days[2].recipeIds.length === 2);
}

/* ---------------- 7. 随机性回归 ---------------- */
console.log('\n[7] 随机性回归：连点 5 次「一键排菜」，结果应互不相同');
{
  const sigs = new Set();
  for (let t = 0; t < 5; t++) {
    const plan = makePlan({ handTitles: [] });
    const { days } = computeWeekPlan({
      pool: RECIPES, planDays: plan.days, perDay: 2, weekStart: WEEK_START,
    });
    sigs.add(days.map((d) => d.recipeIds.join(',')).join('|'));
  }
  check('5 次结果互不相同', sigs.size === 5, `只有 ${sigs.size} 种`);
}

/* ---------------- 8. 池子不够时不能排空 ---------------- */
console.log('\n[8] 池子只剩 5 道菜，仍要排满 7 天（约束自动放宽，不能排空）');
{
  const small = RECIPES.slice(0, 5);
  let minPerDay = 99;
  for (let t = 0; t < 20; t++) {
    const plan = makePlan({ handTitles: [] });
    const { days } = computeWeekPlan({
      pool: small, planDays: plan.days, perDay: 2, weekStart: WEEK_START,
    });
    for (const d of days) minPerDay = Math.min(minPerDay, d.recipeIds.length);
  }
  check('每天都排满了 2 道', minPerDay === 2, `最少的一天只有 ${minPerDay} 道`);
}

console.log(`\n===== 通过 ${pass} / 失败 ${fail} =====`);
process.exit(fail === 0 ? 0 : 1);