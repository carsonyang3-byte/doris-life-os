import { useState, useEffect, useMemo, Fragment } from 'react';
import { useMoney, useToday } from '../hooks';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/constants';

export default function MoneyPage() {
  const { todayStr } = useToday();
  const { records, addRecord, deleteRecord, getWeeklyData } = useMoney();
  const [moneyType, setMoneyType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(todayStr.slice(0, 7));
  const [deleteMode, setDeleteMode] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(parseInt(todayStr.slice(0, 4)));
  const [pickerMonth, setPickerMonth] = useState(parseInt(todayStr.slice(5, 7)));

  const weeklyData = getWeeklyData();

  const monthRecords = useMemo(
    () => records.filter((r) => r.date.startsWith(selectedMonth)),
    [records, selectedMonth]
  );
  const totalIncome = monthRecords.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const totalExpense = monthRecords.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const balance = totalIncome - totalExpense;

  const catTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    monthRecords.filter((r) => r.type === 'expense').forEach((r) => {
      totals[r.category] = (totals[r.category] || 0) + r.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [monthRecords]);
  const maxCatAmount = catTotals.length > 0 ? catTotals[0][1] : 1;

  const currentCategories = moneyType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useEffect(() => {
    setCategory(currentCategories[0]?.key || '');
  }, [moneyType]);

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!category || !amt || amt <= 0) return;
    const catObj = currentCategories.find((c) => c.key === category);
    addRecord({
      type: moneyType,
      category,
      categoryLabel: catObj?.label || category,
      categoryColor: catObj?.color || '#A0A0A0',
      amount: amt,
      note: note.trim(),
      date: todayStr,
    });
    setAmount('');
    setNote('');
  };

  // Month picker helpers
  const monthLabel = selectedMonth.replace('-', ' / ');

  const openMonthPicker = () => {
    setPickerYear(parseInt(selectedMonth.slice(0, 4)));
    setPickerMonth(parseInt(selectedMonth.slice(5, 7)));
    setShowMonthPicker(true);
  };

  const confirmMonth = () => {
    setSelectedMonth(`${pickerYear}-${String(pickerMonth).padStart(2, '0')}`);
    setShowMonthPicker(false);
  };

  const getCalendarDays = () => {
    const year = pickerYear;
    const month = pickerMonth;
    const firstDay = new Date(year, month - 1, 1).getDay() || 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 1; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  const calendarDays = getCalendarDays();

  return (
    <div className="card-base card-accent">
      <SectionHeader
        dot="accent"
        title="Money Overview"
        extra={
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => {
                const [y, m] = selectedMonth.split('-').map(Number);
                const d = new Date(y, m - 2, 1);
                setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
              }}
              className="px-2 py-1 rounded-md text-[12px] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
            >
              ‹
            </button>
            <button
              onClick={openMonthPicker}
              className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--bg-hover)]"
            >
              {monthLabel}
            </button>
            <button
              onClick={() => {
                const [y, m] = selectedMonth.split('-').map(Number);
                const d = new Date(y, m, 1);
                setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
              }}
              className="px-2 py-1 rounded-md text-[12px] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
            >
              ›
            </button>
          </div>
        }
      />

      {/* Month Picker Modal */}
      {showMonthPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowMonthPicker(false)}>
          <div className="bg-[var(--bg-card)] rounded-2xl p-5 shadow-2xl border border-[var(--border)] w-72" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setPickerYear((y) => y - 1)}
                className="w-8 h-8 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-[16px] flex items-center justify-center transition-colors"
              >
                ‹
              </button>
              <span className="text-[15px] font-semibold text-[var(--text-primary)]">{pickerYear}</span>
              <button
                onClick={() => setPickerYear((y) => y + 1)}
                className="w-8 h-8 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-[16px] flex items-center justify-center transition-colors"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <button
                  key={m}
                  onClick={() => setPickerMonth(m)}
                  className={`h-9 rounded-lg text-[13px] font-medium transition-all ${
                    pickerMonth === m
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {m}月
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const now = todayStr.slice(0, 7);
                  setPickerYear(parseInt(now.slice(0, 4)));
                  setPickerMonth(parseInt(now.slice(5, 7)));
                }}
                className="flex-1 h-9 rounded-lg text-[12px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                回到本月
              </button>
              <button onClick={confirmMonth} className="flex-1 h-9 rounded-lg bg-[var(--accent)] text-white text-[13px] font-medium hover:opacity-90 transition-opacity">
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-5 max-md:grid-cols-1">
        <div className="stat-card">
          <div className="text-2xl font-semibold" style={{ color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {balance >= 0 ? '' : '-'}¥{Math.abs(balance).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Net Worth</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-semibold text-[var(--success)]">+¥{totalIncome.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</div>
          <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Income</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-semibold text-[var(--danger)]">-¥{totalExpense.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</div>
          <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Expense</div>
        </div>
      </div>

      <MoneySparkline weeks={weeklyData} height={60} />

      <div className="flex gap-2.5 flex-wrap mb-5">
        <div className="flex gap-1.5">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              className={`insight-tab ${moneyType === t ? 'active' : ''}`}
              onClick={() => setMoneyType(t)}
            >
              {t === 'expense' ? '支出' : '收入'}
            </button>
          ))}
        </div>
        <select
          className="text-[12px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] outline-none min-w-[100px]"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {currentCategories.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        <input type="number" className="today-input w-28" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input type="text" className="today-input flex-1 min-w-[120px]" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
        <button onClick={handleAdd} className="btn-save">Add</button>
        <button
          onClick={() => setDeleteMode(!deleteMode)}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
            deleteMode
              ? 'bg-[var(--danger)] text-white'
              : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          {deleteMode ? '取消删除' : 'Delete'}
        </button>
      </div>

      <div className="mb-5">
        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider block mb-3">Spending by Category</span>
        {catTotals.map(([key, amount]) => {
          const catObj = EXPENSE_CATEGORIES.find((c) => c.key === key);
          const pct = Math.round((amount / maxCatAmount) * 100);
          return (
            <div key={key} className="flex items-center gap-2.5 mb-2">
              <span className="text-[11px] text-[var(--text-secondary)] w-14 text-right shrink-0">{catObj?.label || key}</span>
              <div className="flex-1 h-1.5 bg-[var(--bg-subtle)] rounded overflow-hidden">
                <div className="h-full rounded transition-all" style={{ width: `${pct}%`, background: catObj?.color || '#A0A0A0' }} />
              </div>
              <span className="text-[11px] text-[var(--text-muted)] w-16 text-right shrink-0">¥{Math.round(amount).toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      <div>
        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider block mb-3">Recent Records</span>
        <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
          {monthRecords.length === 0 ? (
            <div className="text-center py-5 text-[12px] text-[var(--text-muted)]">本月暂无记录</div>
          ) : (
            monthRecords.map((r) => (
              <div key={r.id} className={`flex items-center gap-2.5 p-2 px-2.5 rounded-lg text-[12px] transition-colors ${
                deleteMode ? 'bg-[var(--danger-light)] hover:bg-[var(--danger)]/20 cursor-pointer' : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)]'
              }`}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.categoryColor }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[var(--text-secondary)] font-medium">{r.categoryLabel}</div>
                  {r.note && <div className="text-[11px] text-[var(--text-muted)]">{r.note}</div>}
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <div className="font-semibold text-[13px]" style={{ color: r.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                      {r.type === 'income' ? '+' : '-'}¥{r.amount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">{r.date}</div>
                  </div>
                  <button
                    onClick={() => deleteRecord(r.id)}
                    className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${
                      deleteMode
                        ? 'text-white bg-[var(--danger)] hover:bg-[var(--danger)]/80'
                        : 'text-[var(--text-muted)] hover:text-[var(--danger)]'
                    }`}
                    title="删除记录"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ dot, title, extra }: { dot: string; title: string; extra?: React.ReactNode }) {
  const dotColor = dot === 'accent' ? 'var(--accent)' : dot === 'success' ? 'var(--success)' : dot === 'info' ? 'var(--info)' : 'var(--warning)';
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full dot-pulse" style={{ background: dotColor }} />
        <h2 className="section-title" style={{ color: dotColor }}>{title}</h2>
      </div>
      {extra}
    </div>
  );
}

function MoneySparkline({ weeks, height = 60 }: { weeks: { income: number; expense: number }[]; height?: number }) {
  const maxVal = Math.max(...weeks.map((w) => Math.max(w.income, w.expense)), 1);
  return (
    <div className="flex items-end gap-[3px] justify-center mb-5" style={{ height }}>
      {weeks.map((w, i) => (
        <Fragment key={i}>
          <div className="money-sparkline-bar" style={{ height: Math.max(3, (w.expense / maxVal) * height), background: 'rgba(217,83,79,0.35)' }} />
          <div className="money-sparkline-bar" style={{ height: Math.max(3, (w.income / maxVal) * height), background: 'rgba(91,173,111,0.35)' }} />
        </Fragment>
      ))}
    </div>
  );
}
