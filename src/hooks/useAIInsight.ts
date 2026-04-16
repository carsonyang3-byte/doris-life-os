import { useState, useCallback, useRef } from 'react';
import { INSIGHTS } from '../lib/constants';
import { getItem, setItem } from '../lib/storage';

const API_KEY_STORAGE = 'life-os-gemini-key';

export type InsightTab = 'recent' | 'monthly' | 'yearly' | 'finance';

// ── 统计辅助函数 ──

/** 日期字符串格式 YYYY-MM-DD */
function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 计算 N 天前的日期 */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** 计算某习惯在指定日期范围内的完成率 */
function habitRate(
  habitData: Record<string, Record<string, boolean>>,
  habit: string,
  startDate: string,
  endDate: string
): { done: number; total: number; rate: number } {
  let done = 0;
  let total = 0;
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = dateStr(d);
    if (habitData[key]) {
      total++;
      if (habitData[key][habit]) done++;
    }
  }
  return { done, total, rate: total > 0 ? Math.round((done / total) * 100) : 0 };
}

/** 分析两个习惯之间的关联性（同一天都完成的比率） */
function habitCorrelation(
  habitData: Record<string, Record<string, boolean>>,
  h1: string,
  h2: string,
  days: number
): number {
  const cutoff = dateStr(daysAgo(days));
  let both = 0;
  let either = 0;
  for (const [date, habits] of Object.entries(habitData)) {
    if (date < cutoff) continue;
    const a = habits[h1];
    const b = habits[h2];
    if (a || b) either++;
    if (a && b) both++;
  }
  return either > 0 ? Math.round((both / either) * 100) : 0;
}

// ── 数据收集与预处理 ──

function collectUserData(perspective: InsightTab): string {
  const today = new Date();
  const todayStr = dateStr(today);
  const lines: string[] = [];

  // 习惯数据
  const habitData: Record<string, Record<string, boolean>> = JSON.parse(
    getItem('life-os-habits') || '{}'
  );

  // 提取所有习惯名
  const allHabits = new Set<string>();
  for (const dayHabits of Object.values(habitData)) {
    for (const h of Object.keys(dayHabits)) {
      allHabits.add(h);
    }
  }
  const habitList = Array.from(allHabits);

  // ── 习惯完成率趋势分析 ──
  if (habitList.length > 0) {
    const thisWeekStart = dateStr(daysAgo(6));
    const lastWeekStart = dateStr(daysAgo(13));
    const lastWeekEnd = dateStr(daysAgo(7));

    const trendLines: string[] = [];
    for (const h of habitList) {
      const thisWeek = habitRate(habitData, h, thisWeekStart, todayStr);
      const lastWeek = habitRate(habitData, h, lastWeekStart, lastWeekEnd);
      const diff = thisWeek.rate - lastWeek.rate;
      const arrow = diff > 10 ? '↑' : diff < -10 ? '↓' : '→';
      trendLines.push(`  ${h}：本周${thisWeek.rate}%（${thisWeek.done}/${thisWeek.total}天）vs 上周${lastWeek.rate}% ${arrow}${diff > 0 ? '+' : ''}${diff}pp`);
    }
    lines.push(`【习惯完成率趋势（本周 vs 上周）】\n${trendLines.join('\n')}`);
  }

  // ── 习惯关联性分析 ──
  if (habitList.length >= 2 && (perspective === 'recent' || perspective === 'monthly')) {
    const corrLines: string[] = [];
    for (let i = 0; i < habitList.length; i++) {
      for (let j = i + 1; j < habitList.length; j++) {
        const corr = habitCorrelation(habitData, habitList[i], habitList[j], 30);
        if (corr >= 60) {
          corrLines.push(`  ${habitList[i]} + ${habitList[j]}：${corr}%同天完成`);
        }
      }
    }
    if (corrLines.length) {
      lines.push(`【习惯关联性（近30天同天完成率≥60%）】\n${corrLines.join('\n')}`);
    }
  }

  // ── 本月累计统计 ──
  if (perspective === 'monthly' || perspective === 'yearly') {
    const monthKey = todayStr.slice(0, 7);
    const monthDays = Object.keys(habitData).filter((k) => k.startsWith(monthKey));
    if (monthDays.length) {
      const habitCounts: Record<string, number> = {};
      monthDays.forEach((d) => {
        Object.entries(habitData[d] || {}).forEach(([k, v]) => {
          if (v) habitCounts[k] = (habitCounts[k] || 0) + 1;
        });
      });
      const totalDays = monthDays.length;
      const summaryLines = Object.entries(habitCounts).map(
        ([h, c]) => `  ${h}：${c}/${totalDays}天（${Math.round((c / totalDays) * 100)}%）`
      );
      lines.push(`【本月习惯完成统计（${totalDays}天有记录）】\n${summaryLines.join('\n')}`);
    }
  }

  // ── Today 三件事完成率 ──
  if (perspective === 'recent' || perspective === 'monthly') {
    let completed = 0;
    let total = 0;
    const daysToCheck = perspective === 'recent' ? 7 : 30;
    const taskContent: string[] = [];

    for (let i = 0; i < daysToCheck; i++) {
      const d = daysAgo(i);
      const key = dateStr(d);
      const raw = getItem('life-os-today-' + key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.tasks) {
            const filled = parsed.tasks.filter((t: string) => t.trim());
            if (filled.length > 0) {
              total++;
              // 检查当天习惯是否有打卡作为"完成"的代理指标
              const dayHabits = habitData[key] || {};
              const hasHabit = Object.values(dayHabits).some((v) => v);
              if (hasHabit) completed++;
              taskContent.push(`${key}：${filled.join('、')}`);
            }
          }
        } catch { /* skip */ }
      }
    }
    if (total > 0) {
      lines.push(`【Today 三件事（近${daysToCheck}天）】\n  计划了${total}天，${completed}天有习惯打卡（${Math.round((completed / total) * 100)}%执行率）\n${taskContent.slice(0, 5).map((t) => `  ${t}`).join('\n')}`);
    }
  }

  // ── 开心小事 + 觉察关键词 ──
  if (perspective === 'recent') {
    const happyItems: string[] = [];
    const awarenessItems: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = daysAgo(i);
      const key = dateStr(d);
      const raw = getItem('life-os-today-' + key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.happy?.trim()) happyItems.push(`${key}：${parsed.happy}`);
          if (parsed.awareness?.trim()) awarenessItems.push(`${key}：${parsed.awareness}`);
        } catch { /* skip */ }
      }
    }
    if (happyItems.length) {
      lines.push(`【近7天开心小事】\n${happyItems.map((h) => `  ${h}`).join('\n')}`);
    }
    if (awarenessItems.length) {
      lines.push(`【近7天觉察记录（原文）】\n${awarenessItems.map((a) => `  ${a}`).join('\n')}`);
    }
  }

  // ── 当月完整原始记录（用于月度/年度深度分析）──
  if (perspective === 'monthly' || perspective === 'yearly') {
    const monthKeyRaw = todayStr.slice(0, 7);
    const yearKeyRaw = todayStr.getFullYear().toString();
    const datePrefix = perspective === 'monthly' ? monthKeyRaw : yearKeyRaw;

    // 收集所有 Today 原始内容（三件事、开心小事、觉察）
    const dayRecords: string[] = [];
    // 扫描本月/本年所有可能的日期
    const maxDays = perspective === 'monthly' ? 31 : 366;
    for (let i = 0; i < maxDays; i++) {
      const d = daysAgo(i);
      const ds = dateStr(d);
      if (!ds.startsWith(datePrefix)) continue;
      const raw = getItem('life-os-today-' + ds);
      if (raw) {
        try {
          const p = JSON.parse(raw);
          const parts: string[] = [];
          if (p.tasks && p.tasks.some((t: string) => t.trim())) {
            parts.push(`三件事：${p.tasks.filter((t: string) => t.trim()).join(' | ')}`);
          }
          if (p.happy?.trim()) parts.push(`开心小事：${p.happy}`);
          if (p.awareness?.trim()) parts.push(`觉察：${p.awareness}`);
          if (parts.length) dayRecords.push(`${ds}\n  ${parts.join('\n  ')}`);
        } catch { /* skip */ }
      }
    }
    if (dayRecords.length) {
      lines.push(`【${perspective === 'monthly' ? '本月': '本年'}每日原始记录（共${dayRecords.length}天）】\n${dayRecords.join('\n\n')}`);
    }
  }

  // ── Reflect 觉察记录 ──
  if (perspective !== 'finance') {
    const recentCutoff = dateStr(daysAgo(perspective === 'recent' ? 7 : 30));
    const monthKey5 = todayStr.slice(0, 7);
    const reflectResults: { date: string; q: string; framework: string; answer: string }[] = [];

    // 扫描 daily keys
    const daysToScan = perspective === 'recent' ? 14 : 60;
    for (let i = 0; i < daysToScan; i++) {
      const d = daysAgo(i);
      const ds = dateStr(d);
      const raw = getItem('life-os-reflect-daily-' + ds);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const framework = parsed._framework || 'Daily';
            for (const [q, answer] of Object.entries(parsed)) {
              if (q === '_framework') continue;
              if (typeof answer === 'string' && answer.trim()) {
                reflectResults.push({ date: ds, q, framework, answer });
              }
            }
          }
        } catch { /* skip */ }
      }
    }

    // 扫描 weekly keys（最近8周）
    for (let i = 0; i < 8; i++) {
      const d = daysAgo(i * 7);
      const dow = d.getDay() || 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - dow + 1);
      const weekYear = monday.getFullYear();
      const weekNum = Math.ceil(((monday.getTime() - new Date(weekYear, 0, 4).getTime()) / 86400000 + 4) / 7);
      const weekKey = `${weekYear}-W${String(weekNum).padStart(2, '0')}`;
      const raw = getItem('life-os-reflect-weekly-' + weekKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const framework = parsed._framework || 'Weekly';
            for (const [q, answer] of Object.entries(parsed)) {
              if (q === '_framework') continue;
              if (typeof answer === 'string' && answer.trim()) {
                reflectResults.push({ date: weekKey, q, framework, answer });
              }
            }
          }
        } catch { /* skip */ }
      }
    }

    const filtered = reflectResults.filter((r) => {
      if (perspective === 'recent') {
        return r.date >= recentCutoff && r.answer?.trim();
      } else {
        return r.date.startsWith(monthKey5) || r.date.startsWith(monthKey5.slice(0, 4));
      }
    });

    if (filtered.length) {
      const label = perspective === 'recent' ? '近7天' : '本月';
      lines.push(`【${label}觉察问答（${filtered.length}条，framework分布：${(() => {
        const counts: Record<string, number> = {};
        filtered.forEach((r) => { counts[r.framework] = (counts[r.framework] || 0) + 1; });
        return Object.entries(counts).map(([k, v]) => `${k}${v}条`).join('、');
      })()})】\n${filtered.map((r) => `  [${r.framework}] ${r.q}\n  答：${r.answer}`).join('\n')}`);
    }
  }

  // ── 财务数据 ──
  if (perspective === 'finance' || perspective === 'monthly') {
    const moneyRecords: { type: string; category: string; categoryLabel: string; amount: number; date: string }[] =
      JSON.parse(getItem('life-os-money') || '[]');

    if (perspective === 'finance') {
      const monthKey3 = todayStr.slice(0, 7);
      const lastMonthKey = (() => {
        const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        return lm.toISOString().slice(0, 7);
      })();

      // 本月
      const thisMonthExp = moneyRecords.filter((r) => r.type === 'expense' && r.date.startsWith(monthKey3));
      const thisMonthInc = moneyRecords.filter((r) => r.type === 'income' && r.date.startsWith(monthKey3));
      const totalExpense = thisMonthExp.reduce((s, r) => s + r.amount, 0);
      const totalIncome = thisMonthInc.reduce((s, r) => s + r.amount, 0);

      // 上月对比
      const lastMonthExp = moneyRecords.filter((r) => r.type === 'expense' && r.date.startsWith(lastMonthKey));
      const lastTotalExpense = lastMonthExp.reduce((s, r) => s + r.amount, 0);
      const expChange = lastTotalExpense > 0
        ? `较上月${totalExpense > lastTotalExpense ? '+' : ''}${Math.round(((totalExpense - lastTotalExpense) / lastTotalExpense) * 100)}%`
        : '（上月无数据对比）';

      // 按类目汇总
      const catBreakdown: Record<string, number> = {};
      thisMonthExp.forEach((r) => { catBreakdown[r.categoryLabel] = (catBreakdown[r.categoryLabel] || 0) + r.amount; });
      const sortedCats = Object.entries(catBreakdown).sort(([, a], [, b]) => b - a);

      // 最近 4 周每周支出
      const weeklySpend: string[] = [];
      for (let w = 0; w < 4; w++) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - w * 7);
        const ws = dateStr(weekStart);
        const we = dateStr(weekEnd);
        const weekTotal = moneyRecords
          .filter((r) => r.type === 'expense' && r.date >= ws && r.date < we)
          .reduce((s, r) => s + r.amount, 0);
        weeklySpend.push(`第${4 - w}周：¥${weekTotal}`);
      }

      lines.push(`【本月财务数据】\n  收入：¥${totalIncome}，支出：¥${totalExpense}，净额：¥${totalIncome - totalExpense}\n  ${expChange}\n【支出分类（从高到低）】\n${sortedCats.map(([cat, amt]) => `  ${cat}：¥${amt}（${totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0}%）`).join('\n')}\n【近4周每周支出】\n${weeklySpend.map((w) => `  ${w}`).join('\n')}`);
    } else {
      // monthly perspective — 简要
      const monthKey4 = todayStr.slice(0, 7);
      const thisMonthExp = moneyRecords.filter((r) => r.type === 'expense' && r.date.startsWith(monthKey4));
      const totalExp = thisMonthExp.reduce((s, r) => s + r.amount, 0);
      lines.push(`【本月总支出：¥${totalExp}，共${thisMonthExp.length}笔】`);
    }
  }

  // ── Goal 进度 ──
  if (perspective === 'yearly') {
    const goals: { title: string; progress: number }[] = JSON.parse(
      getItem('life-os-goals') || '[]'
    );
    if (goals.length) {
      const avgProgress = Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length);
      lines.push(`【当前目标进度（平均${avgProgress}%）】\n${goals.map((g) => `  ${g}：${g.progress}%`).join('\n')}`);
    }
  }

  // ── Vision Distance 数据 ──
  if (perspective === 'yearly') {
    const yearKey = today.getFullYear().toString();
    const visionData = getItem(`life-os-vision-distance-${yearKey}`);
    if (visionData) {
      try {
        const parsed = JSON.parse(visionData);
        if (Array.isArray(parsed)) {
          const visionLines = parsed.map((d: { label: string; current: number }) => `  ${d.label}：${d.current}%`).join('\n');
          lines.push(`【Vision Distance 维度评分】\n${visionLines}`);
        }
      } catch { /* skip */ }
    }
  }

  return lines.length > 0 ? lines.join('\n\n') : '';
}

// ── Prompt：深度分析引擎 — 强制引用原文、多维度交叉分析 ──

const PERSPECTIVE_PROMPTS: Record<InsightTab, string> = {
  recent: `你是一位敏锐、诚实且有洞察力的个人行为分析师。用户提供了TA最近7天的完整生活记录——包括习惯打卡详情、每日觉察原文、反思问答的完整回答、开心小事、三件事计划等原始材料。

【核心要求】
1. 每一个观点都必须引用用户的具体记录原文作为证据。不要说"你似乎很关注健康"，要说"你在4月10日的觉察中写道'今天发现血糖和睡眠质量直接相关'——这说明你已经从'知道要早睡'进化到了理解背后的生理机制"。
2. 不要泛泛而谈或说正确的废话。如果数据不够得出某个结论，就直说"这一点数据还看不出明确模式"。
3. 像一个真正了解TA的朋友在认真读TA的日记后给出的反馈，不是AI报告。
4. 禁止使用emoji。禁止"根据数据分析""数据显示"这类机械腔调。用中文。

【输出格式 — 严格遵守以下6个段落，每段用**粗体标签**开头】

**行为模式扫描**：从这周的数据中识别出2-3个重复出现的具体行为模式。必须引用具体日期的内容作为佐证。模式可以是正面的也可以是需要注意的。

**趋势与对比**：本周vs上周的变化。哪些指标在变好？哪些在退步？用数字说话，并尝试解释可能的原因（结合用户的觉察/反思内容）。

**矛盾与盲区**：用户言行之间、不同数据之间的不一致之处。比如"你在反思中说想减少手机时间，但连续4天晚11点后还有Today记录更新"。这是最有价值的部分，请深入挖掘。

**情绪与认知线索**：从觉察和反思原文中提炼用户当前最关心的主题、反复出现的关键词、情绪基调的变化。引用至少2条原文来展示你的判断依据。

**关联性发现**：不同维度之间的隐含联系——比如某几天同时出现了某种习惯打卡+某种情绪/觉察主题。这些跨维度的联系往往揭示深层动机。

**一个小实验**：基于以上所有分析，给出一个明天就能做的小实验（不是笼统建议）。说明为什么要做这个实验、预期观察到什么、怎么做算成功。`,

  monthly: `你是一位极其敏锐的个人成长分析师。用户提供了TA本月几乎全部的生活原始记录——每一天的习惯打卡日历、每一条觉察原文、每一道反思问答的完整回答、开心小事、三件事计划、财务流水等。这是一份非常私人的生活档案，请认真对待。

【核心要求 — 这是最重要的部分】
1. **必须大量引用原文**：每一个实质性论断都要有用户的原话作为锚点。你应该像在读一本日记然后写书评一样自然地引用其中的句子。
2. **交叉分析**：不要孤立地看每种数据。要把习惯打卡趋势和觉察内容联系起来，把财务数据和反思中的焦虑点联系起来，把三件事计划和实际执行情况联系起来。真正的洞察来自交叉点。
3. **诚实但有建设性**：看到进步就明确指出来，看到问题也不回避。但批评的同时要提供视角转换——这个问题背后可能意味着什么？
4. **深度 > 宽度**：与其浅薄地覆盖所有方面，不如选2-3个真正有料的角度深挖。宁可少说但说得准、说得透。
5. 禁止emoji。禁止"数据显示""通过分析可知"等腔调。用中文。像一个认真读过TA所有记录的朋友在对话。

【输出格式 — 以下7个段落，每段用**粗体标签**开头，每段150-250字】

**本月叙事主线**：用2-3句话概括这个月的"故事线"——这不是一个散乱的清单，而是有一个内在的主题或转折。是什么把这个月串联起来的？

**习惯系统的真相**：不只罗列完成率。要分析习惯之间的联动关系（哪些习惯倾向于同天出现）、月中月末的变化节奏（是否月初积极后期松懈）、以及习惯执行情况与觉察内容之间的关系。引用具体日期的数据。

**内心世界的主题**：从所有觉察和反思原文中，提炼出本月反复出现的核心议题——是关于自我控制？关于关系？关于身体？关于工作意义？引用至少3条不同日期的原话来展示这些主题是如何贯穿整月的。

**言行一致性审计**：检查用户说的（反思中的目标/觉察中的意图）和做的（习惯打卡/三件事执行）之间的一致程度。不一致的地方往往是成长的入口。

**隐藏的关联**：跨越不同数据类型的意外发现。比如"每次你记录了关于工作的焦虑，第二天运动打卡率就下降"或者"财务支出大的周，觉察记录更短更简略"。

**一个关键洞察**：综合以上所有信息，给出一个你认为最重要、用户自己可能还没意识到的洞察。这是整篇分析的"灵魂句"，要让用户看完觉得"确实是这样但我之前没想到"。

**下月的一个具体改变**：不是"继续保持"或"多注意XX"。而是一个具体的、可验证的行为改变建议，并说明为什么基于本月的分析这个改变是最值得优先做的。`,

  yearly: `你是一位帮助人们看清自己的人生轨迹的深度分析师。用户提供了TA今年的长期数据——目标进度、各维度评分、全年习惯统计、每月财务走向、全年的反思与觉察记录摘要等。

【核心要求】
1. 从宏观角度审视这一年，但要扎根于具体数据。不要变成星座运势式的模糊描述。
2. 关注变化的方向和速率，而不只是静态的快照。
3. 找出"看不见的手"——那些持续影响多个维度的潜在因素。
4. 引用具体数据点和记录原文作为支撑。
5. 禁止emoji。禁止套话。用中文。真诚而有深度。

【输出格式 — 以下6个段落，用**粗体标签**开头**

**年度关键词**：如果用一个词或短语定义这一年，是什么？为什么？引用数据说明。

**维度全景扫描**：逐一点评各个维度的年度变化。不只是报分数，而是讲"故事"——这个维度经历了怎样的起伏、转折、突破或停滞。

**目标现实检验**：目标完成情况如何？未完成的目标是因为方向错了、方法不对、还是时机未到？已完成的哪些带来了真正的满足感？

**跨年模式识别**：有哪些模式贯穿了这一年？比如"每次Q1设定雄心勃勃的目标都会在Q3搁浅"或"身体相关的维度总是比认知相关的维度更容易改善"。

**今年最大的悖论**：用户这一年经历的最大矛盾或张力是什么？这个悖论本身可能就是下一年的成长入口。

**一个结构性调整**：不需要更多努力，而是需要不同的结构。基于全年的模式，什么系统性的调整能带来最大的杠杆效应？`,

  finance: `你是一位帮助人建立清醒财务认知的分析师。用户提供了详细的财务数据——收支明细、分类、月度对比、周度趋势等。

【核心要求】
1. 不做道德评判（不应该说"你不该花这么多"），只做事实分析和模式识别。
2. 把消费数据和用户的生活阶段、价值观联系起来看。
3. 找出数字背后的行为模式和可能的情绪驱动因素。
4. 给出可操作的、尊重用户生活方式的建议。
5. 禁止emoji。用中文。

【输出格式 — 用**粗体标签**开头的5个段落】

**财务健康诊断**：当前的收支格局用1-2句话说清楚。

**钱去哪儿了——深度版**：不只是分类占比，而是分析支出的"人格"——这个人的消费模式是什么样的？稳定还是冲动？必要型多还是享受型多？有什么季节性或周期性规律？

**消费与生活的对照**：如果用户的其他数据（习惯、觉察、反思）中有相关信息，尝试将消费模式和生活状态联系起来。比如"健身支出增加的月份也是运动打卡最多的月份"。

**三个微调建议**：三个小的、不痛苦的、但积累起来有意义的调整。每个都说明预期节省多少、怎么做到。

**一笔值得的钱**：指出一笔花钱花得好的支出，说明为什么这笔钱花得值。`,
};

// ── Gemini API 调用 ──

async function callGemini(apiKey: string, perspective: InsightTab, userData: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  const systemPrompt = PERSPECTIVE_PROMPTS[perspective];
  const formatReminder = `\n\n【格式强制要求 — 违反此要求的输出将被判定为不合格】\n- 你的回复必须严格使用 Markdown 的 **粗体** 格式作为每个段落的标题标记\n- 每一段的开头必须是 **标题文字：** 或 **标题文字:** 这种格式\n- 绝对不允许输出没有 **粗体标题** 的大段纯文本\n- 如果你不使用 **粗体** 标记格式，系统将无法正确渲染你的分析结果\n- 请现在就确认你会严格遵循以上格式要求，然后开始输出。\n`;
  const prompt = userData
    ? `${systemPrompt}\n\n=== 用户的完整原始生活记录（包含习惯打卡、觉察原文、反思问答、开心小事、财务数据等） ===\n\n请仔细阅读以下所有内容，像在读一本日记一样理解其中的细节和情绪，然后基于这些真实记录写出深度分析。\n\n${userData}${formatReminder}`
    : `${systemPrompt}\n\n用户暂时没有足够的生活数据。请说明数据不足，建议用户多记录几天后再来分析。`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text.trim();
}

// ── Markdown 渲染为 React 可用的简单结构 ──

/** 将 **粗体** 标记转为特殊分隔符，供前端分段渲染 */
export function parseInsightSections(text: string): { label: string; content: string }[] {
  const sections: { label: string; content: string }[] = [];

  // ── 策略1：按 **xxx**： 分割（理想格式）──
  const boldRegex = /\*\*([^*]+)\*\*[：:]\s*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).trim();
      if (before && sections.length > 0) {
        sections[sections.length - 1].content += '\n' + before;
      } else if (before) {
        sections.push({ label: '', content: before });
      }
    }
    const label = match[1];
    const contentStart = match.index + match[0].length;
    // 找下一个 ** 或文本末尾
    const nextMatch = boldRegex.exec(text);
    const contentEnd = nextMatch ? nextMatch.index : text.length;
    const content = text.slice(contentStart, contentEnd).trim();
    sections.push({ label, content });
    if (nextMatch) {
      boldRegex.lastIndex = nextMatch.index;
    }
    lastIndex = contentEnd;
  }

  if (sections.length > 0) return sections;

  // ── 策略2：按数字编号分割（如 "1. xxx\n2. xxx"）──
  const numRegex = /(?:^|\n)\s*(\d+)[\.、．]\s+/g;
  let numLastIdx = 0;
  let numMatch: RegExpExecArray | null;

  while ((numMatch = numRegex.exec(text)) !== null) {
    if (numMatch.index > numLastIdx) {
      const before = text.slice(numLastIdx, numMatch.index).trim();
      if (before) sections.push({ label: '', content: before });
    }
    const contentStart = numMatch.index + numMatch[0].length;
    const nextNum = numRegex.exec(text);
    const contentEnd = nextNum ? nextNum.index : text.length;
    const content = text.slice(contentStart, contentEnd).trim();
    sections.push({ label: '', content });
    if (nextNum) numRegex.lastIndex = nextNum.index;
    numLastIdx = contentEnd;
  }

  if (sections.length > 1) return sections; // 至少分出2段才算有效

  // ── 策略3：按双换行分段 ──
  sections.length = 0;
  const paras = text.split(/\n\s*\n/).map(s => s.replace(/\n/g, ' ').trim()).filter(Boolean);
  if (paras.length >= 2) {
    paras.forEach((p) => sections.push({ label: '', content: p }));
    return sections;
  }

  // ── 策略4：按句号+建议/但/不过 等关键转折点拆分 ──
  sections.length = 0;
  const splitPoints = text.split(/(?<=。)\s*(?=建议|但这|不过|然而|同时|此外|另外|值得关注|值得注意的是|核心)/);
  if (splitPoints.length >= 2) {
    splitPoints.forEach((s) => { if (s.trim()) sections.push({ label: '', content: s.trim() }); });
    return sections;
  }

  // ── 兜底：整段作为无标签内容 ──
  if (text.trim()) {
    sections.push({ label: '', content: text.trim() });
  }
  return sections;
}

// ── Hook ──

export function useAIInsight() {
  const [apiKey, setApiKey] = useState(() => getItem(API_KEY_STORAGE) || '');
  const [insightText, setInsightText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const saveApiKey = useCallback((key: string) => {
    setItem(API_KEY_STORAGE, key);
    setApiKey(key);
  }, []);

  const generateInsight = useCallback(
    async (tab: InsightTab) => {
      // 取消上一次请求
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setInsightText('');
      setError('');
      setIsLoading(true);
      setIsTyping(false);

      if (!apiKey) {
        // 没有 API key，用预设文本 fallback
        const list = INSIGHTS[tab];
        const text = list[Math.floor(Math.random() * list.length)];
        setIsLoading(false);
        setIsTyping(true);
        let i = 0;
        const timer = setInterval(() => {
          if (controller.signal.aborted) { clearInterval(timer); return; }
          if (i < text.length) {
            setInsightText(text.slice(0, i + 1));
            i++;
          } else {
            setIsTyping(false);
            clearInterval(timer);
          }
        }, 25);
        return;
      }

      try {
        const userData = collectUserData(tab);
        const text = await callGemini(apiKey, tab, userData);

        if (controller.signal.aborted) return;

        // 打字机效果
        setIsLoading(false);
        setIsTyping(true);
        let i = 0;
        const timer = setInterval(() => {
          if (controller.signal.aborted) { clearInterval(timer); return; }
          if (i < text.length) {
            setInsightText(text.slice(0, i + 1));
            i++;
          } else {
            setIsTyping(false);
            clearInterval(timer);
          }
        }, 12);
      } catch (err) {
        if (controller.signal.aborted) return;
        setIsLoading(false);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        // Fallback to preset
        const list = INSIGHTS[tab];
        const text = list[Math.floor(Math.random() * list.length)];
        setInsightText(text);
      }
    },
    [apiKey]
  );

  return {
    insightText,
    isTyping,
    isLoading,
    error,
    apiKey,
    saveApiKey,
    generateInsight,
  };
}
