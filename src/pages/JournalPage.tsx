import { useState, useMemo, useRef, useEffect } from 'react';
import { useJournal } from '../hooks';
import { useToday } from '../hooks';

const MOOD_OPTIONS = ['😊', '😢', '😡', '😰', '🤔', '🥰', '😴', '💪'];

export default function JournalPage() {
  const { todayStr } = useToday();
  const { meEntries, chenchenEntries, addEntry, deleteEntry, meStats, chenchenStats } = useJournal();

  const [activeOwner, setActiveOwner] = useState<'me' | 'chenchen'>('me');
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: todayStr,
    title: '',
    content: '',
    mood: '',
    tags: '',
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // 空字符串表示全部
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const entries = activeOwner === 'me' ? meEntries : chenchenEntries;
  const stats = activeOwner === 'me' ? meStats : chenchenStats;

  const filteredEntries = useMemo(() => {
    let result = entries;
    // 按月份筛选
    if (selectedMonth) {
      result = result.filter((e) => e.date.startsWith(selectedMonth));
    }
    // 按关键词搜索
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(kw) ||
          e.content.toLowerCase().includes(kw) ||
          e.mood?.includes(kw) ||
          e.tags?.some((t) => t.toLowerCase().includes(kw))
      );
    }
    return result;
  }, [entries, searchKeyword, selectedMonth]);

  const handleSubmit = () => {
    if (!newEntry.content.trim()) return;
    addEntry(activeOwner, {
      owner: activeOwner,
      date: newEntry.date,
      title: newEntry.title.trim() || undefined,
      content: newEntry.content.trim(),
      mood: newEntry.mood || undefined,
      tags: newEntry.tags
        ? newEntry.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
    });
    setNewEntry({ date: todayStr, title: '', content: '', mood: '', tags: '' });
    setShowForm(false);
    setExpandedId(null);
  };

  // Group entries by month
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: typeof filteredEntries } = {};
    filteredEntries.forEach((e) => {
      const month = e.date.slice(0, 7);
      if (!groups[month]) groups[month] = [];
      groups[month].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredEntries]);

  const ownerConfig = {
    me: { label: '我的日记', labelCN: '我的日记', icon: '📝', color: '#7C9885', placeholder: '今天想记录些什么...' },
    chenchen: { label: '宸宸', labelCN: '我的小魔怪宸宸', icon: '👦', color: '#B57EDC', placeholder: '记录宸宸今天的成长...' },
  };
  const config = ownerConfig[activeOwner];

  const handleExport = () => {
    if (filteredEntries.length === 0) return;
    const lines: string[] = [
      `# ${config.labelCN}`,
      `导出时间：${new Date().toLocaleString('zh-CN')}`,
      `共 ${filteredEntries.length} 篇\n`,
    ];
    filteredEntries.forEach((e) => {
      lines.push(`## ${e.date}${e.title ? ` - ${e.title}` : ''}${e.mood ? ` ${e.mood}` : ''}`);
      lines.push(e.content);
      if (e.tags && e.tags.length > 0) lines.push(`标签：${e.tags.map((t) => `#${t}`).join(' ')}`);
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal_${activeOwner}_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--bg-subtle)] p-1 rounded-xl">
            <button
              onClick={() => setActiveOwner('me')}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 ${
                activeOwner === 'me'
                  ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              📝 我的日记
            </button>
            <button
              onClick={() => setActiveOwner('chenchen')}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 ${
                activeOwner === 'chenchen'
                  ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              👦 宸宸
            </button>
          </div>
          <div className="text-[12px] text-[var(--text-muted)]">
            共 {stats.total} 篇 · 本月 {stats.thisMonth} 篇
          </div>
          {/* Month Selector */}
          <div className="relative">
            <button
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="text-[12px] px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-1"
            >
              {selectedMonth || '全部月份'}
              <span className="text-[10px]">{showMonthPicker ? '▲' : '▼'}</span>
            </button>
            {showMonthPicker && (
              <div className="absolute top-full left-0 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg p-3 z-50 min-w-[180px]">
                <button
                  onClick={() => { setSelectedMonth(''); setShowMonthPicker(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${!selectedMonth ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                >
                  全部月份
                </button>
                <button
                  onClick={() => { setSelectedMonth(todayStr.slice(0, 7)); setShowMonthPicker(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${selectedMonth === todayStr.slice(0, 7) ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                >
                  回到本月
                </button>
                <div className="border-t border-[var(--border)] my-2" />
                <div className="max-h-48 overflow-y-auto">
                  {(() => {
                    const months = [...new Set(entries.map((e) => e.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
                    return months.map((m) => (
                      <button
                        key={m}
                        onClick={() => { setSelectedMonth(m); setShowMonthPicker(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${selectedMonth === m ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                      >
                        {m}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="today-input w-40"
            placeholder="搜索..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <button onClick={handleExport} className="btn-sm">导出</button>
          <button onClick={() => { setShowForm(true); setExpandedId(null); }} className="btn-save">
            + 写日记
          </button>
        </div>
      </div>

      {/* Write Form */}
      {showForm && (
        <div className="card-base p-5" ref={formRef}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold" style={{ color: config.color }}>
              {config.icon} {config.labelCN}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              ×
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <input
                type="date"
                className="today-input flex-1"
                value={newEntry.date}
                onChange={(e) => setNewEntry((p) => ({ ...p, date: e.target.value }))}
              />
              <input
                type="text"
                className="today-input flex-1"
                placeholder="标题（选填）"
                value={newEntry.title}
                onChange={(e) => setNewEntry((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <textarea
              className="today-input resize-none"
              rows={5}
              placeholder={config.placeholder}
              value={newEntry.content}
              onChange={(e) => setNewEntry((p) => ({ ...p, content: e.target.value }))}
              autoFocus
            />

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-[var(--text-muted)] mr-1">心情：</span>
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setNewEntry((p) => ({ ...p, mood: p.mood === m ? '' : m }))}
                    className={`text-lg transition-transform hover:scale-110 ${newEntry.mood === m ? 'scale-110' : 'opacity-40'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="today-input w-40"
                placeholder="标签（逗号分隔）"
                value={newEntry.tags}
                onChange={(e) => setNewEntry((p) => ({ ...p, tags: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowForm(false)} className="btn-sm flex-1">取消</button>
              <button onClick={handleSubmit} className="btn-save flex-1">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="flex flex-col gap-4">
        {filteredEntries.length === 0 ? (
          <div className="card-base text-center py-12">
            <div className="text-4xl mb-3">{config.icon}</div>
            <div className="text-[14px] text-[var(--text-muted)]">
              {searchKeyword ? '没有找到匹配的日记' : selectedMonth ? '该月份还没有日记' : '还没有日记'}
            </div>
            <div className="text-[12px] text-[var(--text-muted)] mt-1">
              {searchKeyword ? '试试其他关键词' : selectedMonth ? '点击「全部月份」查看全部' : `点击「写日记」开始记录吧`}
            </div>
          </div>
        ) : (
          groupedEntries.map(([month, monthEntries]) => (
            <div key={month}>
              <div className="text-[12px] text-[var(--text-muted)] mb-2 font-medium">{month}</div>
              <div className="flex flex-col gap-2">
                {monthEntries.map((entry) => (
                  <div key={entry.id} className="card-base p-4">
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: config.color + '20' }}>
                        {entry.mood || config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-[var(--text-secondary)]">{entry.date}</span>
                          {entry.title && (
                            <span className="text-[14px] font-medium text-[var(--text-primary)]">{entry.title}</span>
                          )}
                        </div>
                        <div className={`text-[13px] text-[var(--text-secondary)] mt-1 leading-relaxed ${expandedId === entry.id ? '' : 'line-clamp-2'}`}>
                          {entry.content}
                        </div>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {entry.tags.map((tag) => (
                              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteEntry(activeOwner, entry.id); }}
                        className="w-6 h-6 rounded text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors opacity-0 group-hover:opacity-100"
                        style={{ opacity: expandedId === entry.id ? 1 : 0 }}
                      >
                        ×
                      </button>
                    </div>
                    {expandedId === entry.id && (
                      <div className="flex justify-end mt-2 pt-2 border-t border-[var(--border)]">
                        <button
                          onClick={() => deleteEntry(activeOwner, entry.id)}
                          className="text-[11px] text-[var(--danger)] hover:underline"
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
