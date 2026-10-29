import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from 'recharts';
import { HeartPulse, Activity, Footprints, Moon, Flame, Droplets, Timer, Sparkles } from 'lucide-react';
import { useGarminHealth, useGarminAIInsight } from '../hooks/useGarminHealth';

// ===== 运动总览：近7天 / 近30天 / 近90天 =====
type RangeKey = 'week' | 'month' | 'total';

interface ActItem { name: string; color: string; value: string; }

const ACT: Record<RangeKey, { items: ActItem[]; sum: string }> = {
  week: {
    items: [
      { name: '步行', color: 'var(--success)', value: '16 次 · 325 分钟 · 21.2 km' },
      { name: '力量训练', color: 'var(--warning)', value: '4 次 · 160 分钟' },
      { name: '跑步', color: 'var(--info)', value: '1 次 · 5.0 km · 心率147' },
      { name: '冥想', color: 'var(--purple)', value: '3 次 · 31 分钟' },
      { name: 'HIIT', color: 'var(--danger)', value: '1 次 · 16 分钟' },
    ],
    sum: '共 25 次活动',
  },
  month: {
    items: [
      { name: '步行', color: 'var(--success)', value: '56 次 · 1094 分钟 · 73.3 km' },
      { name: '力量训练', color: 'var(--warning)', value: '10 次 · 458 分钟' },
      { name: '跑步', color: 'var(--info)', value: '5 次 · 19.5 km · 心率141' },
      { name: '冥想', color: 'var(--purple)', value: '18 次 · 197 分钟' },
      { name: 'HIIT', color: 'var(--danger)', value: '2 次 · 36 分钟' },
      { name: '普拉提/板球/瑜伽', color: 'var(--pink, #D4537E)', value: '3 次 · 148 分钟' },
    ],
    sum: '共 94 次活动',
  },
  total: {
    items: [
      { name: '步行', color: 'var(--success)', value: '85 次 · 1861 分钟 · 113.9 km' },
      { name: '力量训练', color: 'var(--warning)', value: '21 次 · 969 分钟' },
      { name: '跑步', color: 'var(--info)', value: '12 次 · 49.5 km · 心率142' },
      { name: '冥想', color: 'var(--purple)', value: '18 次 · 197 分钟' },
      { name: 'HIIT', color: 'var(--danger)', value: '5 次 · 85 分钟' },
      { name: '普拉提/板球/瑜伽', color: 'var(--pink, #D4537E)', value: '4 次 · 188 分钟' },
    ],
    sum: '共 189 次活动',
  },
};

const RANGE_TABS: { key: RangeKey; label: string }[] = [
  { key: 'week', label: '近7天' },
  { key: 'month', label: '近30天' },
  { key: 'total', label: '近90天' },
];

// ===== 图表数据 =====
const weekStepsData = [
  { d: '10/23', v: 12924 }, { d: '10/24', v: 15972 }, { d: '10/25', v: 14291 },
  { d: '10/26', v: 9131 }, { d: '10/27', v: 8515 }, { d: '10/28', v: 8441 }, { d: '10/29', v: 7990 },
];

const runPaceData = [
  { d: '8/1', v: 8.4 }, { d: '8/16', v: 10.1 }, { d: '8/23', v: 8.8 }, { d: '9/5', v: 9.3 },
  { d: '9/11', v: 8.6 }, { d: '9/18', v: 9.0 }, { d: '9/25', v: 8.4 }, { d: '10/2', v: 8.4 },
  { d: '10/7', v: 8.5 }, { d: '10/11', v: 8.6 }, { d: '10/17', v: 9.5 }, { d: '10/24', v: 7.9 },
];

const hrZoneData = [
  { z: '<90', v: 30, c: 'var(--info)' },
  { z: '90-110', v: 25, c: 'var(--success)' },
  { z: '110-130', v: 28, c: 'var(--accent)' },
  { z: '130-150', v: 13, c: 'var(--warning)' },
  { z: '>150', v: 4, c: 'var(--danger)' },
];

const cycleData = [
  { x: '-7', v: 61.7 }, { x: '-6', v: 63.3 }, { x: '-5', v: 60.7 }, { x: '-4', v: 63.0 },
  { x: '-3', v: 60.0 }, { x: '-2', v: 60.3 }, { x: '-1', v: 60.7 }, { x: '经期1', v: 59.0 },
  { x: '2', v: 59.3 }, { x: '3', v: 58.3 }, { x: '4', v: 57.7 }, { x: '5', v: 58.7 },
  { x: '6', v: 57.3 }, { x: '7', v: 61.0 }, { x: '8', v: 59.3 },
];

// ===== 子组件 =====
function FocusCard({ label, color, value, small, delta, deltaClass, sub }: {
  label: string; color: string; value: string; small?: string; delta: string; deltaClass: string; sub: string;
}) {
  return (
    <div className="bg-[var(--bg-card)] rounded-[18px] p-[18px] shadow-[var(--shadow)]">
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] mb-2">
        <span className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />
        {label}
      </div>
      <div className="text-[26px] font-light leading-none text-[var(--text-primary)]">
        {value}{small && <span className="text-[12px] text-[var(--text-muted)] font-normal ml-0.5">{small}</span>}
      </div>
      <div className="text-[11px] font-medium mt-1.5" style={{ color: deltaClass === 'up' ? '#993556' : deltaClass === 'down' ? '#0F6E56' : 'var(--text-muted)' }}>{delta}</div>
      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</div>
    </div>
  );
}

function GlanceCard({ label, value, small, sub }: { label: string; value: string; small?: string; sub?: string }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-[14px] p-3 shadow-[var(--shadow)]">
      <div className="text-[10px] text-[var(--text-muted)] mb-1">{label}</div>
      <div className="text-[16px] font-normal leading-none text-[var(--text-primary)]">
        {value}{small && <span className="text-[10px] text-[var(--text-muted)]">{small}</span>}
      </div>
      {sub && <div className="text-[9px] text-[var(--text-muted)] mt-1">{sub}</div>}
    </div>
  );
}

function Section({ icon, title, color }: { icon?: React.ReactNode; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3">
      {icon && <span style={{ color: color || 'var(--accent)' }}>{icon}</span>}
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: color || 'var(--text-secondary)' }}>{title}</h2>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 p-3.5 rounded-xl bg-[var(--bg-subtle)] text-[13px] leading-[1.75] text-[#3a3a3a]">
      {children}
    </div>
  );
}

function Advice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 p-3.5 rounded-xl text-[13px] leading-[1.75] text-[#3a3a3a]" style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)' }}>
      {children}
    </div>
  );
}

// ===== AI 洞察渲染：把 **标题** 分段，标题高亮、正文正常 =====
function AIInsightBlock({ content, generatedAtLabel }: { content: string; generatedAtLabel?: string }) {
  // 按 **标题** 切段
  const parts = content.split(/\*\*([^*]+)\*\*/);
  const sections: { title: string; body: string }[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i % 2 === 1) {
      // 是标题（**之间的内容**）
      const title = p.trim();
      const body = (parts[i + 1] || '').trim();
      sections.push({ title, body });
      i++;
    } else if (p.trim()) {
      // 无标题的开头段落
      sections.push({ title: '', body: p.trim() });
    }
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-5 shadow-[var(--shadow)] mt-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--accent)' }}><Sparkles size={14} /></span>
          <span className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--accent-dark)' }}>AI 洞察</span>
        </div>
        {generatedAtLabel && <span className="text-[11px] text-[var(--text-muted)]">更新于 {generatedAtLabel}</span>}
      </div>
      <div className="space-y-3">
        {sections.map((s, idx) => (
          <div key={idx}>
            {s.title && (
              <div className="text-[13px] font-semibold mb-1" style={{ color: 'var(--accent-dark)' }}>{s.title}</div>
            )}
            <p className="text-[13px] leading-[1.75] text-[var(--text-primary)] whitespace-pre-wrap">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== 辅助函数（从云端数据计算） =====
function avgOf(cloud: ReturnType<typeof useGarminHealth>, n: number, key: string): number {
  const days = cloud?.days?.slice(-n) || [];
  const vals = days.filter(d => (d as Record<string, unknown>)[key] != null).map(d => (d as Record<string, unknown>)[key] as number);
  if (!vals.length) return 0;
  return Math.round(sum(vals) / vals.length);
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function fmtInt(v: number): string {
  return v.toLocaleString();
}

function runInsight(cloud: ReturnType<typeof useGarminHealth>, range: 'week' | 'month'): string {
  if (!cloud) return '';
  const b = cloud.activity[range]?.bytype || {};
  const run = b.running || {};
  const hiit = b.high_intensity_interval_training || b.indoor_cardio || {};
  const strength = b.strength_training || b.strength || {};
  const runN = run.n || 0;
  const hiitN = hiit.n || 0;
  const strengthN = strength.n || 0;
  const parts: string[] = [];
  parts.push(`跑步 ${runN} 次、HIIT ${hiitN} 次、力量 ${strengthN} 次`);
  if (runN + hiitN < 3) parts.push('高强度偏少');
  return parts.join('，') + '。';
}

// ===== 主组件 =====
export default function HealthPage() {
  const [range, setRange] = useState<RangeKey>('total');
  const cloud = useGarminHealth();
  const aiInsight = useGarminAIInsight();

  // 活动总览：优先用云端数据，无则用写死兜底
  const act = useMemo(() => {
    if (!cloud) return ACT[range];
    const bytype = cloud.activity[range]?.bytype || {};
    const items: ActItem[] = [];
    const map: Record<string, { label: string; color: string }> = {
      walking: { label: '步行', color: 'var(--success)' },
      strength_training: { label: '力量训练', color: 'var(--warning)' },
      strength: { label: '力量训练', color: 'var(--warning)' },
      running: { label: '跑步', color: 'var(--info)' },
      meditation: { label: '冥想', color: 'var(--purple)' },
      high_intensity_interval_training: { label: 'HIIT', color: 'var(--danger)' },
      indoor_cardio: { label: 'HIIT', color: 'var(--danger)' },
      pilates: { label: '普拉提', color: 'var(--pink, #D4537E)' },
      yoga: { label: '瑜伽', color: 'var(--pink, #D4537E)' },
    };
    for (const [k, v] of Object.entries(bytype)) {
      const m = map[k] || { label: k, color: 'var(--text-muted)' };
      let val = `${v.n} 次 · ${v.durMin} 分钟`;
      if (v.distKm > 0) val += ` · ${v.distKm} km`;
      if (v.avgHR) val += ` · 心率${v.avgHR}`;
      items.push({ name: m.label, color: m.color, value: val });
    }
    return { items, sum: `共 ${cloud.activity[range].total} 次活动` };
  }, [cloud, range]);

  // 今日数据（最后一天）
  const today = useMemo(() => {
    const d = cloud?.days?.length ? cloud.days[cloud.days.length - 1] : null;
    return d || { date: '', restingHR: 61, sleepH: 6.7, sleepScore: 74, deepPct: 22, remPct: 19, stress: 39, maxStress: 96, steps: 7990, kcal: 1254, distanceKm: 5.6 };
  }, [cloud]);

  // 步数周图
  const weekStepsData = useMemo(() => {
    const last7 = cloud?.days?.slice(-7) || [];
    return last7.map(d => ({ d: d.date.slice(5), v: d.steps ?? 0 }));
  }, [cloud]);

  // 跑步配速
  const runPaceData = useMemo(() => {
    const p = cloud?.runPace || [];
    return p.length ? p.map(x => ({ d: x.d.replace('-', '/'), v: x.v })) : [
      { d: '8/1', v: 8.4 }, { d: '8/16', v: 10.1 }, { d: '8/23', v: 8.8 }, { d: '9/5', v: 9.3 },
      { d: '9/11', v: 8.6 }, { d: '9/18', v: 9.0 }, { d: '9/25', v: 8.4 }, { d: '10/2', v: 8.4 },
      { d: '10/7', v: 8.5 }, { d: '10/11', v: 8.6 }, { d: '10/17', v: 9.5 }, { d: '10/24', v: 7.9 },
    ];
  }, [cloud]);

  // 周期
  const cycle = useMemo(() => cloud?.cycle || {
    cycleDay: 18, phase: '黄体期', nextPeriod: '2026-11-09', cycleLen: 28,
  }, [cloud]);

  const dateLabel = cloud?.generatedAtLabel || '10月29日';
  const fitnessAge = cloud?.fitnessAge != null ? (Math.round(cloud.fitnessAge * 10) / 10).toFixed(1) : '40.8';
  const vo2max = cloud?.vo2max != null ? String(cloud.vo2max) : '—';

  return (
    <div className="flex flex-col gap-2">
      {/* 页头 */}
      <div className="mb-1">
        <div className="text-[11px] tracking-[0.16em] uppercase font-medium" style={{ color: 'var(--accent-dark)' }}>{dateLabel}</div>
        <h1 className="text-[28px] font-light tracking-[0.1em] uppercase mt-0.5" style={{ fontFamily: "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif" }}>My Body</h1>
        <div className="text-[12px] text-[var(--text-muted)] mt-0.5" style={{ fontStyle: 'italic', letterSpacing: '0.02em' }}>Listen to your body and keep moving.</div>
      </div>

      {/* ===== AI 洞察（DeepSeek 每日自动生成）===== */}
      {aiInsight?.content ? (
        <AIInsightBlock content={aiInsight.content} generatedAtLabel={aiInsight.generatedAtLabel} />
      ) : null}

      {/* ===== 今天 · 重点关注 ===== */}
      <Section icon={<HeartPulse size={14} />} title="今天 · 重点关注" />
      <div className="grid grid-cols-2 gap-3">
        <FocusCard label="睡眠" color="var(--info)" value={String(today.sleepH ?? 0)} small="小时" delta={`评分 ${today.sleepScore ?? '-'} · 深睡${today.deepPct ?? '-'}% · REM${today.remPct ?? '-'}%`} deltaClass="flat" sub="昨晚" />
        <FocusCard label="静息心率" color="var(--danger)" value={String(today.restingHR ?? '-')} small="bpm" delta="健康区间" deltaClass="flat" sub="全天" />
        <FocusCard label="压力" color="var(--warning)" value={String(today.stress ?? '-')} small={today.maxStress ? `·最高${today.maxStress}` : ''} delta="平均" deltaClass="flat" sub="中等" />
        <FocusCard label="步数" color="var(--success)" value={(today.steps ?? 0).toLocaleString()} delta="今日" deltaClass="flat" sub="目标 10,000" />
      </div>

      {/* ===== 今天 · 概览 ===== */}
      <Section icon={<Activity size={14} />} title="今天 · 概览" />
      <div className="grid grid-cols-4 gap-2.5">
        <GlanceCard label="卡路里" value={(today.kcal ?? 0).toLocaleString()} small="kcal" />
        <GlanceCard label="距离" value={String(today.distanceKm ?? 0)} small="km" />
        <GlanceCard label="身体年龄" value={fitnessAge} sub={`实际${cloud?.chronoAge ?? 44}`} />
        <GlanceCard label="VO₂max" value={vo2max} sub={vo2max === '—' ? '未测出' : '已测出'} />
        <GlanceCard label="周期" value={`第${cycle.cycleDay ?? '-'}天`} sub={cycle.phase || ''} />
        <GlanceCard label="下次经期" value={(cycle.nextPeriod || '').slice(5).replace('-', '/')} sub={`周期${cycle.cycleLen ?? '-'}天`} />
        <GlanceCard label="症状记录" value={String(cloud?.symptomDays ?? 23)} small="天" />
        <GlanceCard label="数据更新" value={dateLabel} small="" sub="每日自动" />
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <Insight><span className="font-semibold" style={{ color: 'var(--accent-dark)' }}>洞察</span>：昨晚睡 {today.sleepH ?? '-'} 小时、评分 {today.sleepScore ?? '-'}；今天心率 {today.restingHR ?? '-'}、压力 {today.stress ?? '-'}。{today.sleepScore != null && today.sleepScore < 80 ? '睡眠偏低，今天适合放缓。' : '整体状态平稳。'}</Insight>
        <Advice><div className="font-semibold mb-0.5" style={{ color: 'var(--accent-dark)' }}>建议</div>{today.sleepScore != null && today.sleepScore < 80 ? '今晚早点睡。今天别上高强度，散步、拉伸就好。' : '保持节奏，适度活动即可。'}</Advice>
      </div>

      {/* ===== 本周 ===== */}
      <Section icon={<Footprints size={14} />} title="本周 · 近7天" />
      <div className="grid grid-cols-4 gap-2.5">
        <GlanceCard label="平均睡眠" value={String(avgOf(cloud, 7, 'sleepH'))} small="h" sub={`评分${avgOf(cloud, 7, 'sleepScore')}`} />
        <GlanceCard label="平均心率" value={String(avgOf(cloud, 7, 'restingHR'))} sub="健康" />
        <GlanceCard label="平均压力" value={String(avgOf(cloud, 7, 'stress'))} sub="中等" />
        <GlanceCard label="平均步数" value={fmtInt(avgOf(cloud, 7, 'steps'))} sub="活跃" />
      </div>
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekStepsData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <XAxis dataKey="d" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(201,169,110,0.06)' }} />
              <Bar dataKey="v" radius={[5, 5, 0, 0]}>
                {weekStepsData.map((_, i) => <Cell key={i} fill={`rgba(201,169,110,${0.3 + i * 0.08})`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Insight><span className="font-semibold" style={{ color: 'var(--accent-dark)' }}>洞察</span>：这周 {cloud?.activity.week.total ?? 25} 次活动，{runInsight(cloud, 'week')}步数从周初到周末的走势见上图。</Insight>
        <Advice><div className="font-semibold mb-0.5" style={{ color: 'var(--accent-dark)' }}>建议</div>量够，注意强度结构：跑步/HIIT 加到 2-3 次/周，力量保持。</Advice>
      </div>

      {/* ===== 本月 ===== */}
      <Section icon={<Flame size={14} />} title="本月 · 近30天" />
      <div className="grid grid-cols-4 gap-2.5">
        <GlanceCard label="平均睡眠" value={String(avgOf(cloud, 30, 'sleepH'))} small="h" sub={`评分${avgOf(cloud, 30, 'sleepScore')}`} />
        <GlanceCard label="平均心率" value={String(avgOf(cloud, 30, 'restingHR'))} sub="稳定" />
        <GlanceCard label="平均压力" value={String(avgOf(cloud, 30, 'stress'))} sub="偏低·好" />
        <GlanceCard label="平均步数" value={fmtInt(avgOf(cloud, 30, 'steps'))} sub="稳定" />
      </div>
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <Insight><span className="font-semibold" style={{ color: 'var(--accent-dark)' }}>洞察</span>：本月训练量 {cloud?.activity.month.total ?? 94} 次。{runInsight(cloud, 'month')}身体年龄 {fitnessAge}（实际 {cloud?.chronoAge ?? 44}）{cloud?.vo2max == null ? '，VO₂max 还未测出' : '，VO₂max 已测出' }。</Insight>
        <Advice><div className="font-semibold mb-0.5" style={{ color: 'var(--accent-dark)' }}>建议</div>{cloud?.vo2max == null ? '补一次「合格」户外跑：戴紧、户外、15分钟以上、心率130-145，测出 VO₂max。' : '保持训练结构，继续稳步提升。'}</Advice>
      </div>

      {/* ===== 运动 · 训练 ===== */}
      <Section icon={<Timer size={14} />} title="运动 · 训练" />
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[13px] font-medium text-[var(--text-primary)]">运动总览</div>
          <div className="flex bg-[var(--bg-subtle)] rounded-[9px] p-[3px] gap-[2px]">
            {RANGE_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setRange(t.key)}
                className={`text-[11px] px-3 py-[5px] rounded-[7px] border-none cursor-pointer transition-all ${range === t.key
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold shadow-sm'
                  : 'text-[var(--text-secondary)] bg-transparent'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {act.items.map(it => (
          <div key={it.name} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-none text-[13px]">
            <span className="flex items-center gap-2 text-[var(--text-primary)]">
              <span className="w-[8px] h-[8px] rounded-full" style={{ background: it.color }} />
              {it.name}
            </span>
            <span className="text-[12px] text-[var(--text-secondary)]">{it.value}</span>
          </div>
        ))}
        <div className="mt-2.5 text-[12px] text-[var(--text-secondary)]">{act.sum}</div>
      </div>

      {/* 跑步配速 */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <div className="text-[13px] font-medium text-[var(--text-primary)]">跑步：你的配速在进步</div>
        <div style={{ height: 190, marginTop: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={runPaceData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
              <XAxis dataKey="d" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={1} />
              <YAxis domain={[7, 11]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="var(--info)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <Insight><span className="font-semibold" style={{ color: 'var(--accent-dark)' }}>洞察</span>：8 月初配速 10.1 分/公里，最近（10/24）已到 <b>7.9 分/公里</b>，进步明显。10/24 那次 5 公里、心率 147，是你最近状态最好的一跑。</Insight>
        <Advice><div className="font-semibold mb-0.5" style={{ color: 'var(--accent-dark)' }}>建议</div>配速已稳进 8 分内，试着每周加一次「更长」的跑（5→6公里）或「更快」的短跑，刺激心肺继续提升。</Advice>
      </div>

      {/* 心率区间 */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <div className="text-[13px] font-medium text-[var(--text-primary)]">心率区间分布（近30天）</div>
        <div style={{ height: 180, marginTop: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hrZoneData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <XAxis dataKey="z" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(201,169,110,0.06)' }} />
              <Bar dataKey="v" radius={[5, 5, 0, 0]}>
                {hrZoneData.map((d, i) => <Cell key={i} fill={d.c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Insight><span className="font-semibold" style={{ color: 'var(--accent-dark)' }}>洞察</span>：大部分时间在<b>中低强度（120以下）</b>，日常健康很好；但真正到「高强度」的时间偏少——跟「剧烈运动不够」是同一件事。</Insight>
      </div>

      {/* ===== 周期 ===== */}
      <Section icon={<Moon size={14} />} title="周期" />
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <div style={{ height: 190 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cycleData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
              <XAxis dataKey="x" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={1} />
              <YAxis domain={[55, 66]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="var(--info)" strokeWidth={2} dot={{ r: 2.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <Insight><span className="font-semibold" style={{ color: 'var(--accent-dark)' }}>洞察</span>：现在<b>{cycle.phase || '—'}第 {cycle.cycleDay ?? '-'} 天</b>{cycle.nextPeriod ? `，预计下次经期 ${cycle.nextPeriod.slice(5).replace('-', '/')}` : ''}。经期前静息心率偏高、睡眠变差，经期一到心率回落、睡眠变好。</Insight>
        <Advice><div className="font-semibold mb-0.5" style={{ color: 'var(--accent-dark)' }}>建议</div>{cycle.phase === '黄体期' ? '黄体期后半段以中等强度为主；下次经期前后头两天休息，别内疚。' : cycle.phase === '经期' ? '经期头两天以休息、散步、拉伸为主，别硬练。' : cycle.phase === '卵泡期' || cycle.phase === '排卵期' ? '精力上升期，适合上强度：力量、HIIT、跑步。' : '按身体感觉安排，中等强度为主。'}</Advice>
      </div>

      {/* ===== 你的记录 ===== */}
      <Section icon={<Droplets size={14} />} title="你的记录 · 症状与情绪" />
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <div className="text-[13px] font-medium text-[var(--text-primary)] mb-2">近 3 个月你记录了 {cloud?.symptomDays ?? 23} 天</div>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {(cloud?.symptoms?.length ? cloud.symptoms : [
            { name: '背痛', count: 6 }, { name: '腹泻', count: 4 }, { name: '疲劳', count: 3 },
            { name: '乳房胀痛', count: 2 }, { name: '体重增加', count: 2 }, { name: '失眠', count: 1 },
            { name: '腹胀', count: 1 },
          ]).map(s => (
            <span key={s.name} className="text-[11px] px-2.5 py-1 rounded-full" style={{
              background: s.count >= 4 ? 'rgba(212,83,126,0.12)' : 'var(--bg-subtle)',
              color: s.count >= 4 ? '#993556' : 'var(--text-secondary)',
            }}>{s.name} ×{s.count}</span>
          ))}
        </div>
        <Insight><span className="font-semibold" style={{ color: 'var(--accent-dark)' }}>看到你写的</span>：备注里记过「心跳快了」「心跳加快」「仍然觉得水肿」——跟「经期前心率升高」完全对上，你自己早就敏锐感觉到了。</Insight>
        <Advice><div className="font-semibold mb-0.5" style={{ color: 'var(--accent-dark)' }}>建议</div>① 背痛集中在经期前后，那几天提前做腰背放松/热敷；② 黄体期体重增加是水肿不是胖，别焦虑，经期后会回落。</Advice>
      </div>

      {/* ===== 目标追踪 ===== */}
      <Section title="目标追踪" />
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <div className="text-[13px] font-medium text-[var(--text-primary)] mb-0.5">2026 年 · 你和目标的距离</div>
        <div className="text-[11px] text-[var(--text-muted)] mb-3">建议目标（按你的数据水平），可随时改</div>
        {(cloud?.goals?.length ? cloud.goals : [
          { name: '每日步数 ≥ 10,000', pct: 62, note: '近30天平均 9,920' },
          { name: '每周力量训练 ≥ 3 次', pct: 68, note: '当前约 2.3 次/周' },
          { name: '每周跑步 ≥ 2 次', pct: 40, note: '近90天约 1 次/周' },
        ]).map(g => (
          <div key={g.name} className="py-2.5 border-b border-[var(--border)] last:border-none">
            <div className="flex justify-between items-baseline text-[13px] mb-1.5">
              <span className="font-medium text-[var(--text-primary)]">{g.name}</span>
              <span className="text-[12px] text-[var(--text-secondary)]">{g.pct}%</span>
            </div>
            <div className="h-[8px] rounded bg-[var(--bg-subtle)] overflow-hidden">
              <div className="h-full rounded" style={{ width: `${g.pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-dark))' }} />
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">{g.note}</div>
          </div>
        ))}
      </div>

      <div className="text-[11px] text-[var(--text-muted)] leading-[1.8] mt-4 px-1">
        说明：本报告基于你的 Garmin 数据自动生成，仅供自我了解，不构成医疗或专业训练建议。目标进度为按现有数据估算，可编辑调整。
      </div>
    </div>
  );
}
