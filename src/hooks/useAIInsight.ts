import { useState, useCallback, useRef } from 'react';
import { INSIGHTS } from '../lib/constants';

const API_KEY_STORAGE = 'life-os-gemini-key';

export type InsightTab = 'recent' | 'monthly' | 'yearly' | 'finance';

// ── 数据收集：从 localStorage 读取各模块数据 ──

function collectUserData(perspective: InsightTab): string {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const lines: string[] = [];

  // 习惯数据
  const habitData: Record<string, Record<string, boolean>> = JSON.parse(
    localStorage.getItem('life-os-habits') || '{}'
  );

  // 最近 7 天
  if (perspective === 'recent' || perspective === 'finance') {
    const recent7: Record<string, string[]> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const done = Object.entries(habitData[key] || {}).filter(([, v]) => v).map(([k]) => k);
      if (done.length) recent7[key] = done;
    }
    if (Object.keys(recent7).length) {
      lines.push(`【近7天习惯打卡】\n${JSON.stringify(recent7)}`);
    }
  }

  // 本月习惯统计
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
      lines.push(`【本月习惯完成次数（共${monthDays.length}天有记录）】\n${JSON.stringify(habitCounts)}`);
    }
  }

  // Today 数据（最近 7 天的三件事、开心小事、觉察）
  if (perspective === 'recent') {
    const recentToday: Record<string, { tasks: string[]; happy: string; awareness: string }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const raw = localStorage.getItem('life-os-today-' + key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.tasks?.some((t: string) => t.trim()) || parsed.happy?.trim() || parsed.awareness?.trim()) {
            recentToday[key] = { tasks: parsed.tasks || [], happy: parsed.happy || '', awareness: parsed.awareness || '' };
          }
        } catch { /* skip */ }
      }
    }
    if (Object.keys(recentToday).length) {
      lines.push(`【近7天 Today 记录（三件事/开心小事/觉察）】\n${JSON.stringify(recentToday)}`);
    }
  }

  // Reflect 觉察记录（最近或本月）
  if (perspective !== 'finance') {
    const reflectAll: { date: string; q: string; framework: string; answer: string }[] = JSON.parse(
      localStorage.getItem('life-os-reflect') || '[]'
    );
    if (perspective === 'recent') {
      const recent7Date = new Date(today);
      recent7Date.setDate(recent7Date.getDate() - 7);
      const filtered = reflectAll.filter((r) => new Date(r.date) >= recent7Date && r.answer?.trim());
      if (filtered.length) {
        lines.push(`【近7天觉察回答（${filtered.length}条）】\n${filtered.map((r) => `${r.date} [${r.framework}] ${r.q}\n答：${r.answer.slice(0, 200)}`).join('\n')}`);
      }
    } else {
      const monthKey2 = todayStr.slice(0, 7);
      const filtered = reflectAll.filter((r) => r.date.startsWith(monthKey2) && r.answer?.trim());
      if (filtered.length) {
        lines.push(`【本月觉察回答（${filtered.length}条）】\n${filtered.map((r) => `[${r.framework}] ${r.q}\n答：${r.answer.slice(0, 150)}`).join('\n')}`);
      }
    }
  }

  // 财务数据
  if (perspective === 'finance' || perspective === 'monthly') {
    const moneyRecords: { type: string; category: string; categoryLabel: string; amount: number; date: string }[] =
      JSON.parse(localStorage.getItem('life-os-money') || '[]');
    if (perspective === 'finance') {
      const monthKey3 = todayStr.slice(0, 7);
      const thisMonth = moneyRecords.filter((r) => r.date.startsWith(monthKey3));
      const expenses = thisMonth.filter((r) => r.type === 'expense');
      const income = thisMonth.filter((r) => r.type === 'income');
      const totalExpense = expenses.reduce((s, r) => s + r.amount, 0);
      const totalIncome = income.reduce((s, r) => s + r.amount, 0);

      // 按类目汇总
      const catBreakdown: Record<string, number> = {};
      expenses.forEach((r) => { catBreakdown[r.categoryLabel] = (catBreakdown[r.categoryLabel] || 0) + r.amount; });

      // 最近 4 周每周支出
      const weeklySpend: number[] = [];
      for (let w = 0; w < 4; w++) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - w * 7);
        const ws = weekStart.toISOString().slice(0, 10);
        const we = weekEnd.toISOString().slice(0, 10);
        const weekTotal = moneyRecords
          .filter((r) => r.type === 'expense' && r.date >= ws && r.date < we)
          .reduce((s, r) => s + r.amount, 0);
        weeklySpend.push(weekTotal);
      }

      lines.push(`【本月财务数据】\n收入：¥${totalIncome}，支出：¥${totalExpense}，净额：¥${totalIncome - totalExpense}\n支出分类：${JSON.stringify(catBreakdown)}\n最近4周每周支出：${weeklySpend.map((v) => `¥${v}`).join('、')}`);
    } else {
      // monthly perspective — 简要
      const monthKey4 = todayStr.slice(0, 7);
      const thisMonthExp = moneyRecords.filter((r) => r.type === 'expense' && r.date.startsWith(monthKey4));
      const totalExp = thisMonthExp.reduce((s, r) => s + r.amount, 0);
      lines.push(`【本月总支出：¥${totalExp}，共${thisMonthExp.length}笔】`);
    }
  }

  // Goal 进度
  if (perspective === 'yearly') {
    const goals: { title: string; progress: number }[] = JSON.parse(
      localStorage.getItem('life-os-goals') || '[]'
    );
    if (goals.length) {
      lines.push(`【当前目标进度】\n${goals.map((g) => `${g.title}：${g.progress}%`).join('、')}`);
    }
  }

  return lines.length > 0 ? lines.join('\n\n') : '';
}

// ── Gemini API 调用 ──

const PERSPECTIVE_PROMPTS: Record<InsightTab, string> = {
  recent: `你是一个温暖但有洞察力的个人生活教练。根据用户最近几天的数据，给出一条简短的、个性化的洞察（100-150字）。
重点关注：情绪模式、习惯之间的关联、行动与觉察的一致性。
语气要求：像朋友聊天一样自然，不要用"根据数据分析"这类AI腔调，不要用emoji。
用中文回复。只输出一条洞察，不要有标题或编号。`,

  monthly: `你是一个关注长期成长的生活教练。根据用户本月的综合数据，给出一条简短的月度洞察（100-150字）。
重点关注：习惯趋势变化、支出结构是否健康、觉察记录反映的内在状态变化。
语气要求：像朋友聊天一样自然，不要用"根据数据分析"这类AI腔调，不要用emoji。
用中文回复。只输出一条洞察，不要有标题或编号。`,

  yearly: `你是一个帮助用户看见更大图景的成长教练。根据用户的长期数据，给出一条简短的年度洞察（100-150字）。
重点关注：跨维度的成长（Be-Do-Have）、目标完成趋势、认知模式的变化。
语气要求：像朋友聊天一样自然，不要用"根据数据分析"这类AI腔调，不要用emoji。
用中文回复。只输出一条洞察，不要有标题或编号。`,

  finance: `你是一个帮助用户建立健康财务意识的教练。根据用户的财务数据，给出一条简短的财务洞察（100-150字）。
重点关注：支出结构是否合理、收入支出比、消费节律、储蓄信号。
语气要求：像朋友聊天一样自然，不要用"根据数据分析"这类AI腔调，不要用emoji。
用中文回复。只输出一条洞察，不要有标题或编号。`,
};

async function callGemini(apiKey: string, perspective: InsightTab, userData: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const systemPrompt = PERSPECTIVE_PROMPTS[perspective];
  const prompt = userData
    ? `${systemPrompt}\n\n以下是用户的真实生活数据：\n\n${userData}`
    : `${systemPrompt}\n\n用户暂时没有足够的生活数据。请给一条通用的、鼓励性的生活小洞察。`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 300,
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

// ── Hook ──

export function useAIInsight() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const [insightText, setInsightText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const saveApiKey = useCallback((key: string) => {
    localStorage.setItem(API_KEY_STORAGE, key);
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
        }, 25);
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
