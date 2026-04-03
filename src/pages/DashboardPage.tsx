import { useState, useEffect, useMemo, Fragment } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, Sun, Eye, Sparkles, CalendarDays, Settings, RefreshCw } from 'lucide-react';
import { useToday, useTodayData, useQuotes, useWeeklyFocus, useHabits, useMoney, useGoals, useScoring, useLibrary } from '../hooks';
import { useAIInsight } from '../hooks/useAIInsight';
import type { InsightTab } from '../hooks/useAIInsight';
import { useGoalProgress } from '../hooks/useGoalProgress';
import { VISION, HABIT_KEYS } from '../lib/constants';
import { formatDate, getWeekRange } from '../lib/utils';
import { getItem, setItem } from '../lib/storage';

interface DashboardPageProps {
  onPageChange?: (page: string) => void;
}

export default function DashboardPage({ onPageChange }: DashboardPageProps) {
  const { todayStr, dateCN } = useToday();
  const { tasks, setTasks, happy, setHappy, awareness, setAwareness, save, saved } = useTodayData();
  const { items: libraryItems } = useLibrary();
  const { current: quote, next, isFromLibrary, libraryCount } = useQuotes(libraryItems);
  const { focus, dimensions, updateFocus } = useWeeklyFocus();
  const { data: habitData, toggleHabit, getStreak, getJournalDays, getExerciseCount, getHeatmapData } = useHabits();
  const { records: moneyRecords, getWeeklyData } = useMoney();
  const { goals } = useGoals();
  const { details: goalDetails } = useGoalProgress(goals);
  const { dimensions: scoreDims, todayScore } = useScoring();
  
  // 使用新的规则引擎获取 Vision Distance 数据
  const { visionDistance, calculateVisionDistance, isCalculating } = useVisionEngine();

  // ---- Today 日期选择器 ----
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isToday = selectedDate === todayStr;

  // 选中的日期的 Today 记录
  const [selectedTasks, setSelectedTasks] = useState<string[]>(['', '', '']);
  const [selectedHappy, setSelectedHappy] = useState('');
  const [selectedAwareness, setSelectedAwareness] = useState('');

  const selectedDateCN = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    const weeks = ['日', '一', '二', '三', '四', '五', '六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 周${weeks[d.getDay()]}`;
  }, [selectedDate]);

  useEffect(() => {
    if (isToday) {
      setSelectedTasks([...tasks]);
      setSelectedHappy(happy);
      setSelectedAwareness(awareness);
    } else {
      // 加载历史数据
      try {
        const data = JSON.parse(getItem('life-os-today-' + selectedDate) || 'null');
        if (data) {
          setSelectedTasks(data.tasks?.length >= 3 ? [...data.tasks] : [...(data.tasks || []), ...Array(3 - (data.tasks?.length || 0)).fill('')]);
          setSelectedHappy(data.happy || '');
          setSelectedAwareness(data.awareness || '');
        } else {
          setSelectedTasks(['', '', '']);
          setSelectedHappy('');
          setSelectedAwareness('');
        }
      } catch {
        setSelectedTasks(['', '', '']);
        setSelectedHappy('');
        setSelectedAwareness('');
      }
    }
  }, [selectedDate, isToday, tasks, happy, awareness]);

  const saveSelected = () => {
    const data = { date: selectedDate, tasks: selectedTasks.filter(t => t.trim()), happy: selectedHappy, awareness: selectedAwareness };
    setItem('life-os-today-' + selectedDate, JSON.stringify(data));
    if (selectedAwareness?.trim()) setItem('life-os-awareness-' + selectedDate, '1');
  };

  // ---- Habit / Money 计算 ----
  const todayHabits = habitData[todayStr] || {};
  const streak = getStreak();
  const journalDays = getJournalDays();
  const exerciseCount = getExerciseCount();
  const heatmap = getHeatmapData();
  const weeklyMoney = getWeeklyData();

  const monthRecords = moneyRecords.filter((r) => r.date.startsWith(todayStr.slice(0, 7)));
  const monthIncome = monthRecords.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const monthExpense = monthRecords.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const lastWeek = weeklyMoney[weeklyMoney.length - 1];
  const prevWeek = weeklyMoney.length > 1 ? weeklyMoney[weeklyMoney.length - 2] : lastWeek;

  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekRange(new Date()), []);

  const trendPct = prevWeek && prevWeek.expense > 0 && lastWeek
    ? Math.round(((lastWeek.expense - prevWeek.expense) / prevWeek.expense) * 100)
    : 0;

  // ---- AI Insight ----
  const [insightTab, setInsightTab] = useState<InsightTab>('recent');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const { insightText, isTyping, isLoading, error: insightError, apiKey, saveApiKey, generateInsight } = useAIInsight();

  // 切换 tab 时自动生成新洞察
  useEffect(() => {
    generateInsight(insightTab);
  }, [insightTab]);

  return (
    <>
      {/* Row 1: Quote + Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card-base card-accent">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)] dot-pulse" />
                <h2 className="section-title text-[var(--accent)]">Daily Quote</h2>
                {isFromLibrary && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">我的笔记</span>
                )}
              </div>
              <button onClick={next} className="btn-sm">
                <ChevronRight className="w-2.5 h-2.5" />
                Next
              </button>
            </div>
            {libraryCount === 0 && (
              <div className="text-[10px] text-[var(--text-muted)] mb-1">
                从 Library 导入微信读书笔记后，这里会展示你的划线金句
              </div>
            )}
          <div className="relative min-h-[180px] flex flex-col justify-center">
            <div className="absolute top-2 left-4 text-[72px] leading-none text-[var(--accent-light)] z-0 select-none" style={{ fontFamily: "'Noto Serif SC', Georgia, serif" }}>
              &ldquo;
            </div>
            <p className="relative z-10 pt-7 pl-6 pr-5 text-[16px] leading-[1.9]" style={{ fontFamily: "'Noto Serif SC', Georgia, serif" }}>
              {quote.text}
            </p>
            <div className="relative z-10 pt-2.5 pl-6 pr-5 flex items-center gap-2.5">
              <span className="text-[12px] text-[var(--accent)] font-medium">{quote.book}</span>
              <span className="w-[3px] h-[3px] rounded-full bg-[var(--text-muted)]" />
              <span className="text-[11px] text-[var(--text-muted)]">{quote.author}</span>
            </div>
          </div>
        </div>

        <div className="card-base">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--info)] dot-pulse" />
              <h2 className="section-title text-[var(--info)]">Vision</h2>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {VISION.map((v) => (
              <div key={v.text} className="vision-card">
                <div className="vision-card-img" style={{ backgroundImage: `url(${v.img})` }} />
                <div className="flex items-center gap-2 px-3.5 py-3">
                  <span style={{ fontSize: 14, color: v.color }}>{v.icon}</span>
                  <span className="text-[12px] text-[var(--text-secondary)] font-light">{v.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Weekly Focus */}
      <div className="card-base">
        <SectionHeader dot="success" title="This Week" extra={
          <span className="text-[12px] text-[var(--text-muted)]">
            {weekStart.getMonth() + 1}/{weekStart.getDate()} - {weekEnd.getMonth() + 1}/{weekEnd.getDate()}
          </span>
        } />
        <div className="grid grid-cols-5 gap-2.5 max-md:grid-cols-3">
          {dimensions.map((dim) => (
            <div key={dim.key} className="focus-card">
              <div className="mb-2.5 text-center">
                <span className="text-[18px]">{dim.icon}</span>
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest mt-1">{dim.label}</p>
              </div>
              <input
                type="text"
                className="focus-input"
                placeholder="Focus..."
                value={focus[dim.key] || ''}
                onChange={(e) => updateFocus(dim.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Today -- 带日期选择器 */}
      <div className="card-base card-accent">
        <SectionHeader dot="accent" title="Today" extra={
          <div className="flex items-center gap-3">
            {/* 日期导航 */}
            <div className="flex items-center gap-1.5 bg-[var(--bg-subtle)] rounded-lg px-2 py-1">
              <button onClick={() => {
                const d = new Date(selectedDate + 'T00:00:00');
                const next = new Date(d);
                next.setUTCDate(d.getUTCDate() - 1);
                setSelectedDate(formatDate(next));
              }} className="p-0.5 hover:text-[var(--accent)] transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => {
                const d = new Date(selectedDate + 'T00:00:00');
                const next = new Date(d);
                next.setUTCDate(d.getUTCDate() + 1);
                const nextStr = formatDate(next);
                if (nextStr <= todayStr) setSelectedDate(nextStr);
              }}>
                <CalendarDays className="w-3 h-3 text-[var(--text-muted)]" />
                <span className="text-[12px] text-[var(--text-secondary)] font-medium whitespace-nowrap">
                  {selectedDateCN}
                </span>
                {!isToday && <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />}
              </div>
              {!isToday && (
                <button onClick={() => setSelectedDate(todayStr)} className="text-[10px] text-[var(--accent)] font-medium ml-1 hover:underline">
                  Today
                </button>
              )}
            </div>
            <button
              onClick={() => { if (isToday) save(); else saveSelected(); }}
              className="btn-save"
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        } />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />
              <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">最重要的三件事</span>
            </div>
            <div className="flex flex-col gap-2">
              {(isToday ? tasks : selectedTasks).map((task, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[12px] text-[var(--accent)] font-mono w-4 mt-2">{i + 1}</span>
                  <input
                    type="text"
                    className="today-input"
                    placeholder="..."
                    value={task}
                    onChange={(e) => {
                      if (isToday) {
                        const next = [...tasks];
                        next[i] = e.target.value;
                        setTasks(next);
                      } else {
                        const next = [...selectedTasks];
                        next[i] = e.target.value;
                        setSelectedTasks(next);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-3 h-3 text-[var(--warning)]" />
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">今天开心的小事</span>
              </div>
              <input
                type="text"
                className="today-input"
                placeholder="今天有什么让你微笑的事？"
                value={isToday ? happy : selectedHappy}
                onChange={(e) => { if (isToday) setHappy(e.target.value); else setSelectedHappy(e.target.value); }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-3 h-3 text-[var(--info)]" />
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">今天的觉察</span>
              </div>
              <textarea
                className="today-textarea"
                rows={3}
                placeholder="今天我观察到什么..."
                value={isToday ? awareness : selectedAwareness}
                onChange={(e) => { if (isToday) setAwareness(e.target.value); else setSelectedAwareness(e.target.value); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Progress */}
      <div className="card-base">
        <SectionHeader dot="warning" title="Progress" />
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-3 h-3 text-[var(--accent)]" />
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Today&apos;s Check-in</span>
            <span className="text-[11px] text-[var(--text-muted)] ml-auto">{dateCN}</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
            {HABIT_KEYS.map((key) => (
              <div
                key={key}
                className={`habit-checkin-item ${todayHabits[key] ? 'checked' : ''}`}
                onClick={() => toggleHabit(todayStr, key)}
              >
                <div className="habit-checkin-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="habit-checkin-label">{key}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-5">
          <StatCard value={streak} label="冥想连续天数" />
          <StatCard value={journalDays} label="觉察记录天数" />
          <StatCard value={exerciseCount} label="运动总次数" />
          <StatCard value={todayScore} label="今日积分" accent />
        </div>
        <div className="mb-1">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] text-[var(--text-muted)]">过去 12 周</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-[var(--text-muted)] mr-1">Less</span>
              {[0, 0.2, 0.4, 0.6, 1].map((v, i) => (
                <div key={i} className="w-[7px] h-[7px] rounded-[1px]" style={{ background: v === 0 ? 'var(--bg-subtle)' : `rgba(201,169,110,${v})` }} />
              ))}
              <span className="text-[9px] text-[var(--text-muted)] ml-1">More</span>
            </div>
          </div>
          <div className="flex gap-[3px] flex-wrap">
            {heatmap.map((cell) => {
              const level = cell.count === 0 ? 0 : cell.count <= 1 ? 1 : cell.count <= 2 ? 2 : cell.count <= 3 ? 3 : 4;
              return (
                <div
                  key={cell.date}
                  className={`heatmap-cell heatmap-${level}`}
                  title={`${cell.date}: ${cell.count}/${HABIT_KEYS.length}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 5: Money Mini */}
      <div className="card-base">
        <SectionHeader dot="accent" title="Money" extra={
          <button
            onClick={() => onPageChange && onPageChange('money')}
            className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-md cursor-pointer hover:text-[var(--accent)] transition-colors font-medium hover:bg-[var(--bg-hover)]"
          >
            Details →
          </button>
        } />
        <div className="grid grid-cols-3 gap-3 mb-4 max-md:grid-cols-1">
          <div className="rounded-xl p-3.5 text-center" style={{ background: 'rgba(91,173,111,0.06)' }}>
            <div className="text-lg font-semibold text-[var(--success)]">+¥{monthIncome.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Income</div>
          </div>
          <div className="rounded-xl p-3.5 text-center" style={{ background: 'rgba(217,83,79,0.06)' }}>
            <div className="text-lg font-semibold text-[var(--danger)]">-¥{monthExpense.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Expense</div>
          </div>
          <div className="rounded-xl p-3.5 text-center" style={{ background: lastWeek?.net >= 0 ? 'rgba(91,173,111,0.06)' : 'rgba(217,83,79,0.06)' }}>
            <div className={`text-lg font-semibold ${lastWeek?.net >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {lastWeek?.net >= 0 ? '+' : ''}¥{lastWeek?.net.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">This Week</div>
          </div>
        </div>
        <MoneySparkline weeks={weeklyMoney} height={40} />
        <div className="flex justify-between mt-2">
          <span className="text-[11px] text-[var(--text-muted)]">过去 4 周</span>
          <span className="text-[11px] text-[var(--text-muted)]">Spending {trendPct >= 0 ? '+' : ''}{trendPct}% vs last week</span>
        </div>
      </div>

      {/* Row 6: Reflect Mini */}
      <div className="card-base">
        <SectionHeader dot="purple" title="Reflect" extra={
          <button
            onClick={() => onPageChange && onPageChange('reflect')}
            className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-md cursor-pointer hover:text-[var(--accent)] transition-colors font-medium hover:bg-[var(--bg-hover)]"
          >
            All Questions →
          </button>
        } />
        <ReflectMini question={useToday().todayQ} />
      </div>

      {/* Row 7: Goals + Vision Distance (积分驱动) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card-base">
          <SectionHeader dot="success" title="Goals" extra={
            <button
              onClick={() => onPageChange && onPageChange('goals')}
              className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-md cursor-pointer hover:text-[var(--accent)] transition-colors font-medium hover:bg-[var(--bg-hover)]"
            >
              All Goals →
            </button>
          } />
          <div className="flex flex-col gap-2.5">
            {goals.slice(0, 3).map((g, i) => (
              <GoalItem key={g.title} goal={g} progress={goalDetails[i]?.progress ?? g.progress} isAuto={!!g.autoCalc && !goalDetails[i]?.isManual} />
            ))}
          </div>
        </div>
        <div className="distance-card">
          <SectionHeader dot="accent" title="Vision Distance" />
          <p className="text-[12px] text-[var(--text-muted)] mb-1">
            {isCalculating ? '计算中...' : '实时显示 Goals 页面设置值'}
            <button 
              onClick={calculateVisionDistance}
              className="ml-2 text-[10px] text-[var(--accent)] hover:underline"
              disabled={isCalculating}
            >
              重新计算
            </button>
          </p>
          <VisionDistance dimensions={visionDistance.map((dim, index) => ({
            key: dim.label,
            label: dim.label,
            color: dim.color,
            percent: dim.current,
            score: Math.round(dim.current * 3.3), // 转换为积分（假设100% = 330分）
          }))} />
        </div>
      </div>

      {/* Row 8: AI Insight */}
      <div className="card-base">
        <SectionHeader
          dot="accent"
          title="AI Insight"
          icon={<Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />}
          extra={
            <div className="flex items-center gap-2">
              {!apiKey && (
                <button onClick={() => setShowKeyInput(!showKeyInput)} className="btn-sm flex items-center gap-1">
                  <Settings className="w-3 h-3" /> API Key
                </button>
              )}
              <button
                onClick={() => generateInsight(insightTab)}
                disabled={isLoading}
                className="btn-sm flex items-center gap-1 disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? '生成中...' : '换一条'}
              </button>
            </div>
          }
        />
        {/* API Key 输入 */}
        {showKeyInput && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
            <p className="text-[11px] text-[var(--text-muted)] mb-2">输入 Gemini API Key（免费申请：aistudio.google.com）</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIza..."
                className="flex-1 text-[12px] px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                onClick={() => { if (keyInput.trim()) { saveApiKey(keyInput.trim()); setShowKeyInput(false); setKeyInput(''); } }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
              >
                保存
              </button>
            </div>
          </div>
        )}
        <div className="flex gap-1 mb-4 flex-wrap">
          {(['recent', 'monthly', 'yearly', 'finance'] as const).map((tab) => (
            <button
              key={tab}
              className={`insight-tab ${insightTab === tab ? 'active' : ''}`}
              onClick={() => { setInsightTab(tab); }}
            >
              {tab === 'recent' ? '近期笔记' : tab === 'monthly' ? '月度洞察' : tab === 'yearly' ? '年度洞察' : '财务'}
            </button>
          ))}
        </div>
        <div className="insight-content">
          <div className="insight-bar" />
          <p className="text-[14px] text-[var(--text-secondary)] font-light leading-[1.7] pl-4 min-h-[60px]">
            {isLoading && !insightText ? (
              <span className="text-[var(--text-muted)] italic">正在分析你的数据...</span>
            ) : insightError && !insightText ? (
              <span className="text-[var(--danger)] text-[12px]">API 调用失败，显示预设洞察</span>
            ) : (
              insightText
            )}
          </p>
          {!apiKey && (
            <div className="mt-2 pl-4">
              <span className="text-[10px] text-[var(--text-muted)]">
                当前使用预设洞察 | 点击右上角 API Key 接入 Gemini 获取个性化分析
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ===== Sub-components =====

function SectionHeader({ dot, title, extra, icon }: { dot?: string; title: string; extra?: React.ReactNode; icon?: React.ReactNode }) {
  const dotColor = dot === 'accent' ? 'var(--accent)' : dot === 'success' ? 'var(--success)' : dot === 'warning' ? 'var(--warning)' : dot === 'info' ? 'var(--info)' : 'var(--purple)';
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon || <div className="w-2 h-2 rounded-full dot-pulse" style={{ background: dotColor }} />}
        <h2 className="section-title" style={{ color: dotColor }}>{title}</h2>
      </div>
      {extra}
    </div>
  );
}

function StatCard({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="stat-card" style={accent ? { background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.15)' } : {}}>
      <div className="text-2xl font-semibold" style={accent ? { color: 'var(--accent)' } : {}}>{value}</div>
      <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function MoneySparkline({ weeks, height = 40 }: { weeks: { income: number; expense: number }[]; height?: number }) {
  const maxVal = Math.max(...weeks.map((w) => Math.max(w.income, w.expense)), 1);
  return (
    <div className="flex items-end gap-[3px] justify-center" style={{ height }}>
      {weeks.map((w, i) => (
        <Fragment key={i}>
          <div className="money-sparkline-bar" style={{ height: Math.max(3, (w.expense / maxVal) * height), background: 'rgba(217,83,79,0.35)' }} />
          <div className="money-sparkline-bar" style={{ height: Math.max(3, (w.income / maxVal) * height), background: 'rgba(91,173,111,0.35)' }} />
        </Fragment>
      ))}
    </div>
  );
}

function ReflectMini({ question }: { question: { q: string; framework: string } }) {
  return (
    <div className="rounded-xl p-5 bg-[var(--bg-subtle)] border-l-[3px] border-[var(--accent)]">
      <div className="text-[15px] font-medium text-[var(--text-primary)] leading-[1.6] mb-3">{question.q}</div>
      <span className="inline-block text-[10px] px-2 py-1 rounded font-medium uppercase tracking-wide" style={{ background: 'rgba(201,169,110,0.1)', color: 'var(--accent-dark)' }}>
        Daily · {question.framework}
      </span>
    </div>
  );
}

function GoalItem({ goal, progress, isAuto }: { goal: { title: string; color: string }; progress: number; isAuto: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--bg-subtle)] transition-colors duration-200 hover:bg-[var(--bg-hover)]">
      <div className="w-1 h-7 rounded-sm shrink-0" style={{ background: goal.color }} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium mb-1.5">{goal.title}</div>
        <div className="h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: goal.color }} />
        </div>
      </div>
      <span className="text-[12px] font-semibold shrink-0" style={{ color: goal.color }}>{progress}%</span>
    </div>
  );
}

function VisionDistance({ dimensions }: { dimensions: { key: string; label: string; color: string; percent: number; score: number }[] }) {
  return (
    <>
      {dimensions.map((dim) => (
        <div key={dim.key} className="mb-4 last:mb-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">{dim.label}</span>
            <span className="text-[11px] font-semibold" style={{ color: dim.color }}>{dim.percent}%</span>
          </div>
          <div className="h-2 bg-[var(--bg-subtle)] rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-1000" style={{ width: `${dim.percent}%`, background: dim.color }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-[var(--text-muted)]">{dim.score} pts</span>
            <span className="text-[9px] text-[var(--text-muted)]">100%</span>
          </div>
        </div>
      ))}
    </>
  );
}
