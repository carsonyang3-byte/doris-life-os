import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Save, BookOpen, RefreshCw, Shuffle } from 'lucide-react';
import { DAILY_QUESTION_SETS, WEEKLY_QUESTION_SETS, DAILY_SET_KEYS, WEEKLY_SET_KEYS, type DailySetKey, type WeeklySetKey } from '../lib/constants';
import { formatDate } from '../lib/utils';
import { getItem, setItem } from '../lib/storage';

// ---- 数据存储 ----

const REFLECT_DAILY_PREFIX = 'life-os-reflect-daily-';
const REFLECT_WEEKLY_PREFIX = 'life-os-reflect-weekly-';

function loadReflectAnswers(prefix: string): Record<string, string> {
  try {
    return JSON.parse(getItem(prefix) || '{}');
  } catch { return {}; }
}

function saveReflectAnswers(prefix: string, answers: Record<string, string>) {
  setItem(prefix, JSON.stringify(answers));
}

function getWeekKey(date: Date): string {
  // ISO week: YYYY-WXX
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

function formatDateCN(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const weeks = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weeks[d.getDay()]}`;
}

// ---- 日历选择器组件 ----
function CalendarPicker({
  selectedDate,
  onSelect,
  maxDate,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
  maxDate: string;
}) {
  const current = new Date(selectedDate + 'T00:00:00');
  const [viewYear, setViewYear] = useState(current.getFullYear());
  const [viewMonth, setViewMonth] = useState(current.getMonth());

  const weeks = ['日', '一', '二', '三', '四', '五', '六'];

  // 生成当月日历格子
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = firstDay.getDay();
    const days: (number | null)[] = [];

    // 填充开头空白
    for (let i = 0; i < startDow; i++) days.push(null);
    // 填充日期
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
  }, [viewYear, viewMonth]);

  const isSelected = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return formatDate(d) === selectedDate;
  };

  const isFuture = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return formatDate(d) > maxDate;
  };

  const isToday = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return formatDate(d) === formatDate(new Date());
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="absolute top-full left-0 mt-2 z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg p-4 min-w-[280px]">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-[var(--bg-subtle)] rounded transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[13px] font-medium">{viewYear}年 {viewMonth + 1}月</span>
        <button onClick={nextMonth} className="p-1 hover:bg-[var(--bg-subtle)] rounded transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weeks.map(w => (
          <div key={w} className="text-[10px] text-[var(--text-muted)] text-center py-1 font-medium">{w}</div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => (
          <div key={i} className="aspect-square">
            {day !== null && (
              <button
                onClick={() => {
                  if (!isFuture(day)) {
                    onSelect(formatDate(new Date(viewYear, viewMonth, day)));
                  }
                }}
                disabled={isFuture(day)}
                className={`w-full h-full flex items-center justify-center text-[12px] rounded transition-colors
                  ${isFuture(day) ? 'text-[var(--text-muted)] opacity-30 cursor-not-allowed' : ''}
                  ${isSelected(day) ? 'bg-[var(--accent)] text-white font-medium' : ''}
                  ${isToday(day) && !isSelected(day) ? 'ring-1 ring-[var(--accent)]' : ''}
                  ${!isSelected(day) && !isFuture(day) ? 'hover:bg-[var(--bg-subtle)]' : ''}
                `}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 快速跳转 */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
        <button
          onClick={() => { setViewYear(new Date().getFullYear()); setViewMonth(new Date().getMonth()); }}
          className="text-[10px] text-[var(--accent)] hover:underline"
        >
          回到本月
        </button>
        <button
          onClick={() => { onSelect(maxDate); setViewYear(new Date().getFullYear()); setViewMonth(new Date().getMonth()); }}
          className="text-[10px] text-[var(--accent)] hover:underline ml-auto"
        >
          回到今天
        </button>
      </div>
    </div>
  );
}

// ── Question Set 存储键 ──
const DAILY_SET_KEY = 'life-os-reflect-daily-set';
const WEEKLY_SET_KEY = 'life-os-reflect-weekly-set';
const AUTO_ROTATE_KEY = 'life-os-reflect-auto-rotate';

// ── 自动轮换：按日期自动切换 set ──

function getAutoDailySet(dateStr: string): DailySetKey {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_SET_KEYS[dayOfYear % DAILY_SET_KEYS.length];
}

function getAutoWeeklySet(dateStr: string): WeeklySetKey {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay() || 7;
  const weekOfMonth = Math.floor((d.getDate() - 1) / 7);
  const monthOffset = d.getFullYear() * 12 + d.getMonth();
  return WEEKLY_SET_KEYS[(monthOffset + weekOfMonth) % WEEKLY_SET_KEYS.length];
}

function getDailyQuestions(dateStr: string, setKey: DailySetKey) {
  const questions = DAILY_QUESTION_SETS[setKey];
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  // 每天展示 4 个不同的问题（轮询），步长确保覆盖面
  const count = questions.length;
  const step = Math.max(1, Math.floor(count / 4));
  const indices = [
    dayOfYear % count,
    (dayOfYear + step) % count,
    (dayOfYear + step * 2) % count,
    (dayOfYear + step * 3) % count,
  ];
  return indices.map(i => questions[i]);
}

function getWeeklyQuestions(dateStr: string, setKey: WeeklySetKey) {
  const questions = WEEKLY_QUESTION_SETS[setKey];
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay() || 7;
  const weekOfMonth = Math.floor((d.getDate() - 1) / 7);
  const count = questions.length;
  const start = (weekOfMonth * 3) % count;
  return [
    questions[start % count],
    questions[(start + 1) % count],
    questions[(start + 2) % count],
  ];
}

// ---- 日期选择器组件 ----
function DateSelector({
  date,
  onDateChange,
  maxDate,
  dateCN,
  color = 'accent',
}: {
  date: string;
  onDateChange: (d: string) => void;
  maxDate: string;
  dateCN: string;
  color?: 'accent' | 'info';
}) {
  const [showCalendar, setShowCalendar] = useState(false);

  const colorClass = color === 'accent' ? 'var(--accent)' : 'var(--info)';
  const hoverColorClass = color === 'accent' ? 'hover:text-[var(--accent)]' : 'hover:text-[var(--info)]';

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 bg-[var(--bg-subtle)] rounded-lg px-2 py-1">
        <button onClick={() => {
          const d = new Date(date + 'T00:00:00');
          d.setDate(d.getDate() - 1);
          onDateChange(formatDate(d));
        }} className={`p-0.5 ${hoverColorClass} transition-colors`}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className={`flex items-center gap-1.5 px-1 ${hoverColorClass} transition-colors`}
        >
          <CalendarDays className="w-3 h-3" />
          <span className="text-[12px] text-[var(--text-secondary)] font-medium whitespace-nowrap">{dateCN}</span>
        </button>

        <button onClick={() => {
          const d = new Date(date + 'T00:00:00');
          d.setDate(d.getDate() + 1);
          if (formatDate(d) <= maxDate) onDateChange(formatDate(d));
        }} className={`p-0.5 ${hoverColorClass} transition-colors`}>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {showCalendar && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
          <CalendarPicker
            selectedDate={date}
            onSelect={(d) => { onDateChange(d); setShowCalendar(false); }}
            maxDate={maxDate}
          />
        </>
      )}
    </div>
  );
}

// ---- Component ----

export default function ReflectPage() {
  const todayStr = formatDate(new Date());

  // ── 自动轮换开关 ──
  const [autoRotate, setAutoRotate] = useState<boolean>(() => {
    const saved = getItem(AUTO_ROTATE_KEY);
    return saved === 'true';
  });

  useEffect(() => {
    setItem(AUTO_ROTATE_KEY, String(autoRotate));
  }, [autoRotate]);

  // ── Question Set 选择 ──
  const [dailySet, setDailySet] = useState<DailySetKey>(() => {
    if (getItem(AUTO_ROTATE_KEY) === 'true') {
      return getAutoDailySet(todayStr);
    }
    const saved = getItem(DAILY_SET_KEY) as DailySetKey | null;
    return (saved && saved in DAILY_QUESTION_SETS) ? saved : DAILY_SET_KEYS[0];
  });
  const [weeklySet, setWeeklySet] = useState<WeeklySetKey>(() => {
    if (getItem(AUTO_ROTATE_KEY) === 'true') {
      return getAutoWeeklySet(todayStr);
    }
    const saved = getItem(WEEKLY_SET_KEY) as WeeklySetKey | null;
    return (saved && saved in WEEKLY_QUESTION_SETS) ? saved : WEEKLY_SET_KEYS[0];
  });

  // 自动轮换时，日期变化自动切换 set
  useEffect(() => {
    if (autoRotate) {
      setDailySet(getAutoDailySet(dailyDate));
    }
  }, [autoRotate, dailyDate]);

  useEffect(() => {
    if (autoRotate) {
      setWeeklySet(getAutoWeeklySet(weeklyDate));
    }
  }, [autoRotate, weeklyDate]);

  // ---- Daily Reflection ----
  const [dailyDate, setDailyDate] = useState(todayStr);
  const isDailyToday = dailyDate === todayStr;

  const dailyQuestions = useMemo(() => getDailyQuestions(dailyDate, dailySet), [dailyDate, dailySet]);
  const [dailyAnswers, setDailyAnswers] = useState<Record<string, string>>({});
  const [dailySaved, setDailySaved] = useState(false);

  useEffect(() => {
    if (!autoRotate) setItem(DAILY_SET_KEY, dailySet);
  }, [dailySet, autoRotate]);

  useEffect(() => {
    if (!autoRotate) setItem(WEEKLY_SET_KEY, weeklySet);
  }, [weeklySet, autoRotate]);

  useEffect(() => {
    const stored = loadReflectAnswers(REFLECT_DAILY_PREFIX + dailyDate);
    setDailyAnswers(stored);
    setDailySaved(false);
  }, [dailyDate]);

  const saveDaily = () => {
    saveReflectAnswers(REFLECT_DAILY_PREFIX + dailyDate, dailyAnswers);
    setDailySaved(true);
    setTimeout(() => setDailySaved(false), 1500);
  };

  const dailyDateCN = useMemo(() => formatDateCN(dailyDate), [dailyDate]);

  // 检查当天是否写过（有数据的日期列表）
  const [dailyHistory, setDailyHistory] = useState<string[]>([]);
  useEffect(() => {
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = formatDate(d);
      if (getItem(REFLECT_DAILY_PREFIX + ds)) dates.push(ds);
    }
    setDailyHistory(dates);
  }, [dailySaved]);

  // ---- Weekly Reflection ----
  const [weeklyDate, setWeeklyDate] = useState(todayStr);
  const weekKey = useMemo(() => getWeekKey(new Date(weeklyDate + 'T00:00:00')), [weeklyDate]);

  const weeklyQuestions = useMemo(() => getWeeklyQuestions(weeklyDate, weeklySet), [weeklyDate, weeklySet]);
  const [weeklyAnswers, setWeeklyAnswers] = useState<Record<string, string>>({});
  const [weeklySaved, setWeeklySaved] = useState(false);

  useEffect(() => {
    const stored = loadReflectAnswers(REFLECT_WEEKLY_PREFIX + weekKey);
    setWeeklyAnswers(stored);
    setWeeklySaved(false);
  }, [weekKey]);

  const saveWeekly = () => {
    saveReflectAnswers(REFLECT_WEEKLY_PREFIX + weekKey, weeklyAnswers);
    setWeeklySaved(true);
    setTimeout(() => setWeeklySaved(false), 1500);
  };

  const weeklyDateCN = useMemo(() => {
    const d = new Date(weeklyDate + 'T00:00:00');
    const dow = d.getDay() || 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - dow + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`;
  }, [weeklyDate]);

  return (
    <>
      {/* Daily Reflection */}
      <div className="card-base card-accent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
            <h2 className="section-title text-[var(--accent)]">Daily Reflection</h2>
            {/* 自动轮换开关 */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                autoRotate
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
              title={autoRotate ? '自动轮换：每天切换不同反思体系' : '手动模式：自己选择反思体系'}
            >
              <Shuffle className="w-3 h-3" />
              {autoRotate ? '自动轮换' : '手动'}
            </button>
          </div>
          {/* Set 选择器 + 日期 + 保存 */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-[var(--bg-subtle)] rounded-lg p-0.5 flex-wrap">
              {DAILY_SET_KEYS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setDailySet(s); if (autoRotate) setAutoRotate(false); }}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap ${dailySet === s ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <DateSelector
              date={dailyDate}
              onDateChange={setDailyDate}
              maxDate={todayStr}
              dateCN={dailyDateCN}
              color="accent"
            />
            {!isDailyToday && (
              <button onClick={() => setDailyDate(todayStr)} className="text-[10px] text-[var(--accent)] font-medium hover:underline">Today</button>
            )}
            <button onClick={saveDaily} className="btn-save flex items-center gap-1">
              <Save className="w-3 h-3" />
              {dailySaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* 历史记录提示 */}
        {dailyHistory.length > 0 && !isDailyToday && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-[10px] text-[var(--text-muted)]">有记录的日期:</span>
            {dailyHistory.slice(0, 10).map(ds => (
              <button
                key={ds}
                onClick={() => setDailyDate(ds)}
                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${ds === dailyDate
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {formatDateCN(ds).slice(0, 6)}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {dailyQuestions.map((item, i) => (
            <div key={i} className="rounded-xl p-5 bg-[var(--bg-subtle)] border-l-[3px]" style={{ borderColor: 'var(--accent)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="text-[15px] font-medium text-[var(--text-primary)] leading-[1.6]">{item.q}</div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: 'rgba(201,169,110,0.1)', color: 'var(--accent-dark)' }}>
                    {item.framework}
                  </span>
                  {item.source && (
                    <span className="text-[9px] text-[var(--text-muted)] opacity-70">
                      {item.source}
                    </span>
                  )}
                </div>
              </div>
              <textarea
                className="today-textarea w-full"
                rows={3}
                placeholder="写点什么..."
                value={dailyAnswers[item.q] || ''}
                onChange={(e) => setDailyAnswers(prev => ({ ...prev, [item.q]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Reflection */}
      <div className="card-base">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full dot-pulse" style={{ background: 'var(--info)' }} />
            <h2 className="section-title" style={{ color: 'var(--info)' }}>Weekly Reflection</h2>
          </div>
          {/* Set 选择器 */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-[var(--bg-subtle)] rounded-lg p-0.5 flex-wrap">
              {WEEKLY_SET_KEYS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setWeeklySet(s); if (autoRotate) setAutoRotate(false); }}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap ${weeklySet === s ? 'bg-[var(--info)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <DateSelector
              date={weeklyDate}
              onDateChange={setWeeklyDate}
              maxDate={todayStr}
              dateCN={weeklyDateCN}
              color="info"
            />
            {weekKey !== getWeekKey(new Date()) && (
              <button onClick={() => setWeeklyDate(todayStr)} className="text-[10px] text-[var(--info)] font-medium hover:underline">This Week</button>
            )}
            <button onClick={saveWeekly} className="btn-save flex items-center gap-1" style={{ background: 'var(--info)' }}>
              <Save className="w-3 h-3" />
              {weeklySaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {weeklyQuestions.map((item, i) => (
            <div key={i} className="rounded-xl p-5 bg-[var(--bg-subtle)] border-l-[3px]" style={{ borderColor: 'var(--info)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="text-[15px] font-medium text-[var(--text-primary)] leading-[1.6]">{item.q}</div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: 'rgba(91,155,213,0.1)', color: 'var(--info)' }}>
                    {item.framework}
                  </span>
                  {item.source && (
                    <span className="text-[9px] text-[var(--text-muted)] opacity-70">
                      {item.source}
                    </span>
                  )}
                </div>
              </div>
              <textarea
                className="today-textarea w-full"
                rows={3}
                placeholder="写下你的思考..."
                value={weeklyAnswers[item.q] || ''}
                onChange={(e) => setWeeklyAnswers(prev => ({ ...prev, [item.q]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
