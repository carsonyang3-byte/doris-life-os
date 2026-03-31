import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Save, BookOpen } from 'lucide-react';
import { DAILY_QUESTIONS, WEEKLY_QUESTIONS } from '../lib/constants';
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

// ---- 获取当天和当周的每日/每周问题 ----

function getDailyQuestions(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  // 每天展示 4 个不同的问题
  const indices = [
    dayOfYear % DAILY_QUESTIONS.length,
    (dayOfYear + 2) % DAILY_QUESTIONS.length,
    (dayOfYear + 4) % DAILY_QUESTIONS.length,
    (dayOfYear + 6) % DAILY_QUESTIONS.length,
  ];
  return indices.map(i => DAILY_QUESTIONS[i]);
}

function getWeeklyQuestions(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay() || 7;
  const weekOfMonth = Math.floor((d.getDate() - 1) / 7);
  const start = (weekOfMonth * 3) % WEEKLY_QUESTIONS.length;
  return [
    WEEKLY_QUESTIONS[start % WEEKLY_QUESTIONS.length],
    WEEKLY_QUESTIONS[(start + 1) % WEEKLY_QUESTIONS.length],
    WEEKLY_QUESTIONS[(start + 2) % WEEKLY_QUESTIONS.length],
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

  // ---- Daily Reflection ----
  const [dailyDate, setDailyDate] = useState(todayStr);
  const isDailyToday = dailyDate === todayStr;

  const dailyQuestions = useMemo(() => getDailyQuestions(dailyDate), [dailyDate]);
  const [dailyAnswers, setDailyAnswers] = useState<Record<string, string>>({});
  const [dailySaved, setDailySaved] = useState(false);

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

  const weeklyQuestions = useMemo(() => getWeeklyQuestions(weeklyDate), [weeklyDate]);
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
            <h2 className="section-title text-[var(--accent)]">Daily Reflection</h2>
          </div>
          <div className="flex items-center gap-3">
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
                <span className="inline-block text-[10px] px-2 py-1 rounded font-medium uppercase tracking-wide shrink-0 ml-3" style={{ background: 'rgba(201,169,110,0.1)', color: 'var(--accent-dark)' }}>
                  {item.framework}
                </span>
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

      {/* Weekly Reflection (KPT) */}
      <div className="card-base">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full dot-pulse" style={{ background: 'var(--info)' }} />
            <h2 className="section-title" style={{ color: 'var(--info)' }}>Weekly KPT</h2>
          </div>
          <div className="flex items-center gap-3">
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
                <span className="inline-block text-[10px] px-2 py-1 rounded font-medium uppercase tracking-wide shrink-0 ml-3" style={{ background: 'rgba(91,155,213,0.1)', color: 'var(--info)' }}>
                  {item.framework}
                </span>
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
