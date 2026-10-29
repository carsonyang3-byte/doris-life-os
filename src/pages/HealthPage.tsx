import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from 'recharts';
import { HeartPulse, Activity, Footprints, Moon, Flame, Droplets, Timer } from 'lucide-react';

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

const goals = [
  { name: '每日步数 ≥ 10,000', val: '达标 62%', pct: 62, note: '近30天平均 9,920，离目标很近' },
  { name: '每周力量训练 ≥ 3 次', val: '达标 68%', pct: 68, note: '近30天约 2.3 次/周' },
  { name: '每周跑步 ≥ 2 次', val: '达标 40%', pct: 40, note: '近90天约 1 次/周，最大短板' },
  { name: '每周剧烈运动 ≥ 3 天', val: '达标 33%', pct: 33, note: '当前约 1 天/周' },
  { name: 'VO₂max 测出并达到「优秀」', val: '未开始', pct: 0, note: '先补一次户外跑，测出第一个值' },
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

// ===== 主组件 =====
export default function HealthPage() {
  const [range, setRange] = useState<RangeKey>('total');
  const act = ACT[range];

  return (
    <div className="flex flex-col gap-2">
      {/* 页头 */}
      <div className="mb-1">
        <div className="text-[11px] tracking-[0.16em] uppercase font-medium" style={{ color: 'var(--accent-dark)' }}>10月29日</div>
        <h1 className="text-[28px] font-light tracking-[0.1em] uppercase mt-0.5" style={{ fontFamily: "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif" }}>My Body</h1>
        <div className="text-[12px] text-[var(--text-muted)] mt-0.5">今天 · 本周 · 本月 · 运动 · 周期 · 目标</div>
      </div>

      {/* ===== 今天 · 重点关注 ===== */}
      <Section icon={<HeartPulse size={14} />} title="今天 · 重点关注" />
      <div className="grid grid-cols-2 gap-3">
        <FocusCard label="睡眠" color="var(--info)" value="6.7" small="小时" delta="评分 74 · 深睡22% · REM19%" deltaClass="flat" sub="昨晚 · 比本周均值低" />
        <FocusCard label="静息心率" color="var(--danger)" value="61" small="bpm" delta="比本周高 2" deltaClass="up" sub="全天 · 健康区间" />
        <FocusCard label="压力" color="var(--warning)" value="39" small="·最高96" delta="比本月高 4" deltaClass="up" sub="平均 · 中等" />
        <FocusCard label="步数" color="var(--success)" value="7,990" delta="连续 3 天下滑" deltaClass="down" sub="目标 10,680 · 完成75%" />
      </div>

      {/* ===== 今天 · 概览 ===== */}
      <Section icon={<Activity size={14} />} title="今天 · 概览" />
      <div className="grid grid-cols-4 gap-2.5">
        <GlanceCard label="卡路里" value="1,254" small="kcal" sub="活跃202" />
        <GlanceCard label="距离" value="5.6" small="km" />
        <GlanceCard label="呼吸" value="14" small="/分" sub="睡眠低至9" />
        <GlanceCard label="喝水" value="0" small="ml" sub="目标2406" />
        <GlanceCard label="身体年龄" value="40.8" sub="实际44" />
        <GlanceCard label="VO₂max" value="—" sub="未测出" />
        <GlanceCard label="静息心率7日" value="59" sub="稳定" />
        <GlanceCard label="周期" value="第18天" sub="黄体期" />
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <Insight><span className="font-semibold" style={{ color: 'var(--accent-dark)' }}>洞察</span>：昨晚睡 6.7 小时、评分 74，比本周平均（82）差；今天心率偏快、压力偏高。今天是你「偏累」的一天，适合放缓。</Insight>
        <Advice><div className="font-semibold mb-0.5" style={{ color: 'var(--accent-dark)' }}>建议</div>今晚早点睡。今天别上高强度，散步、拉伸就好。</Advice>
      </div>

      {/* ===== 本周 ===== */}
      <Section icon={<Footprints size={14} />} title="本周 · 近7天" />
      <div className="grid grid-cols-4 gap-2.5">
        <GlanceCard label="平均睡眠" value="7.0" small="h" sub="评分82" />
        <GlanceCard label="平均心率" value="59" sub="健康" />
        <GlanceCard label="平均压力" value="37" sub="中等" />
        <GlanceCard label="平均步数" value="11,038" sub="活跃" />
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
        <Insight><span className="font-semibold" style={{ color: 'var(--accent-dark)' }}>洞察</span>：这周 25 次活动很勤，但<b>跑步只 1 次、HIIT 1 次</b>，高强度偏少。步数从周初 15972 一路跌到 7990，后半周身体在递减，像前半周用力过猛。</Insight>
        <Advice><div className="font-semibold mb-0.5" style={{ color: 'var(--accent-dark)' }}>建议</div>量够了，缺强度结构。下周跑步/HIIT 加到 2-3 次，力量保持 4 次。</Advice>
      </div>

      {/* ===== 本月 ===== */}
      <Section icon={<Flame size={14} />} title="本月 · 近30天" />
      <div className="grid grid-cols-4 gap-2.5">
        <GlanceCard label="平均睡眠" value="6.8" small="h" sub="评分79" />
        <GlanceCard label="平均心率" value="59" sub="稳定" />
        <GlanceCard label="平均压力" value="35" sub="偏低·好" />
        <GlanceCard label="平均步数" value="9,920" sub="稳定" />
      </div>
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <Insight><span className="font-semibold" style={{ color: 'var(--accent-dark)' }}>洞察</span>：本月训练量足（94 次），但<b>剧烈运动只 2 天</b>（目标 3 天/周），这是身体年龄卡在 40.8 下不去的主因；VO₂max 也没测出。</Insight>
        <Advice><div className="font-semibold mb-0.5" style={{ color: 'var(--accent-dark)' }}>建议</div>1) 补一次「合格」户外跑：戴紧、户外、15 分钟以上、心率到 130-145，测出 VO₂max；2) 剧烈运动提到每周 3 天，身体年龄有望降到 40。</Advice>
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
        <Insight><span className="font-semibold" style={{ color: 'var(--accent-dark)' }}>洞察</span>：三个月对齐——<b>经期前静息心率高 5-6 bpm、睡眠变差、活动量冲高；经期一到心率回落、睡眠变好。</b>现在黄体期第 18 天，接下来一周逐渐进入经期前状态。预计下次经期 11/9。</Insight>
        <Advice><div className="font-semibold mb-0.5" style={{ color: 'var(--accent-dark)' }}>建议</div>黄体期后半段（现在到 11/9）中等强度为主；11/9 前后进入经期，头两天休息，别内疚。</Advice>
      </div>

      {/* ===== 你的记录 ===== */}
      <Section icon={<Droplets size={14} />} title="你的记录 · 症状与情绪" />
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <div className="text-[13px] font-medium text-[var(--text-primary)] mb-2">近 3 个月你记录了 23 天</div>
        <Insight>
          <b>背痛</b>（6次）：集中在周期第 1-3 天和第 27-29 天（经期前后）。<br />
          <b>情绪波动</b>（3次）：第 1-2 天和第 19 天。<br />
          <b>疲劳</b>（3次）：第 16-26 天（黄体期）。<br />
          <b>体重增加/腹胀</b>：第 15-17 天（黄体期）。
        </Insight>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {[
            { t: '背痛 ×6', hot: true }, { t: '腹泻 ×4', hot: true }, { t: '疲劳 ×3', hot: false },
            { t: '乳房胀痛 ×2', hot: false }, { t: '体重增加 ×2', hot: false }, { t: '失眠 ×1', hot: false },
            { t: '腹胀 ×1', hot: false },
          ].map(chip => (
            <span key={chip.t} className="text-[11px] px-2.5 py-1 rounded-full" style={{
              background: chip.hot ? 'rgba(212,83,126,0.12)' : 'var(--bg-subtle)',
              color: chip.hot ? '#993556' : 'var(--text-secondary)',
            }}>{chip.t}</span>
          ))}
        </div>
        <Insight><span className="font-semibold" style={{ color: 'var(--accent-dark)' }}>看到你写的</span>：备注里记过「心跳快了」「心跳加快」「仍然觉得水肿」——跟「经期前心率升高」完全对上，你自己早就敏锐感觉到了。</Insight>
        <Advice><div className="font-semibold mb-0.5" style={{ color: 'var(--accent-dark)' }}>建议</div>① 背痛集中在经期前后，那几天提前做腰背放松/热敷；② 黄体期（第15-28天）体重增加是水肿不是胖，别焦虑，经期后会回落。</Advice>
      </div>

      {/* ===== 目标追踪 ===== */}
      <Section title="目标追踪" />
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-[var(--shadow)]">
        <div className="text-[13px] font-medium text-[var(--text-primary)] mb-0.5">2026 年 · 你和目标的距离</div>
        <div className="text-[11px] text-[var(--text-muted)] mb-3">建议目标（按你的数据水平），可随时改</div>
        {goals.map(g => (
          <div key={g.name} className="py-2.5 border-b border-[var(--border)] last:border-none">
            <div className="flex justify-between items-baseline text-[13px] mb-1.5">
              <span className="font-medium text-[var(--text-primary)]">{g.name}</span>
              <span className="text-[12px] text-[var(--text-secondary)]">{g.val}</span>
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
