import { useState, useMemo, useRef } from 'react';
import { useLibrary } from '../hooks';
import { useToday } from '../hooks';
import type { LibraryItem } from '../types';

const TYPE_CONFIG = {
  book: { label: 'Book', labelCN: '读书', color: '#7C9885', icon: '📚' },
  movie: { label: 'Movie', labelCN: '电影', color: '#B57EDC', icon: '🎬' },
  blog: { label: 'Blog', labelCN: '博客', color: '#5B9BD5', icon: '💻' },
  podcast: { label: 'Podcast', labelCN: '播客', color: '#E8A87C', icon: '🎧' },
} as const;

const STATUS_CONFIG = {
  reading: { label: '在读/在看', color: 'var(--info)' },
  completed: { label: '已完成', color: 'var(--success)' },
  abandoned: { label: '弃了', color: 'var(--text-muted)' },
  in_progress: { label: '进行中', color: 'var(--warning)' },
} as const;

type ItemType = keyof typeof TYPE_CONFIG;
type ItemStatus = keyof typeof STATUS_CONFIG;

// ========== 微信读书笔记解析 ==========

interface ParsedBook {
  title: string;
  author?: string;
  highlights: string[];   // 划线内容
  notes: string[];        // 笔记/想法
  review?: string;        // 书评
}

/**
 * 解析微信读书导出的文本格式：
 * 《书名》
 * 作者：XXX
 * 我的笔记 / 我的划线
 * ---
 * 划线内容
 * 笔记：xxx
 */
function parseWereadText(text: string): ParsedBook[] {
  const books: ParsedBook[] = [];

  // 按书名分割：匹配 《书名》 或 【书名】
  const bookRegex = /[《【]([^》\]]+)[》】]/g;
  let match;
  const positions: number[] = [];
  const titles: string[] = [];

  while ((match = bookRegex.exec(text)) !== null) {
    positions.push(match.index);
    titles.push(match[1].trim());
  }

  if (positions.length === 0) {
    // 没有匹配到书名格式，尝试其他方式
    // 可能是一整段纯笔记，当作一本书处理
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      books.push({
        title: lines[0].replace(/^[《【》】\s]+/, '').substring(0, 50),
        highlights: lines.slice(1).filter(l => l.trim()),
        notes: [],
      });
    }
    return books;
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i] + titles[i].length + 2; // 跳过书名标记
    const end = i + 1 < positions.length ? positions[i + 1] : text.length;
    const content = text.substring(start, end);

    const book: ParsedBook = {
      title: titles[i],
      author: undefined,
      highlights: [],
      notes: [],
    };

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 匹配作者
      const authorMatch = trimmed.match(/^作者[：:]\s*(.+)/);
      if (authorMatch) {
        book.author = authorMatch[1].trim();
        continue;
      }

      // 匹配书评
      const reviewMatch = trimmed.match(/^(我的书评|点评|书评)[：:]\s*(.+)/);
      if (reviewMatch) {
        book.review = reviewMatch[2].trim();
        continue;
      }

      // 匹配笔记
      const noteMatch = trimmed.match(/^(笔记|想法|批注)[：:]\s*(.+)/);
      if (noteMatch) {
        book.notes.push(noteMatch[2].trim());
        continue;
      }

      // 剩下的非空行视为划线内容
      if (!trimmed.startsWith('---') && !trimmed.startsWith('#') && trimmed.length > 5) {
        book.highlights.push(trimmed);
      }
    }

    if (book.highlights.length > 0 || book.notes.length > 0 || book.review) {
      books.push(book);
    }
  }

  return books;
}

/**
 * 解析微信读书 Markdown 格式（浏览器插件导出）
 */
function parseWereadMarkdown(text: string): ParsedBook[] {
  const books: ParsedBook[] = [];
  // Markdown 格式：# 书名\n\n## 作者\n\n### 笔记\n- 划线\n  - 笔注
  const sections = text.split(/^#{1,3}\s+/m).filter(s => s.trim());

  let currentBook: ParsedBook | null = null;
  for (const section of sections) {
    const lines = section.split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;

    const firstLine = lines[0].trim();

    // 检查是否是书名行（通常第一个 section）
    if (!currentBook && !firstLine.startsWith('-') && !firstLine.startsWith('作者')) {
      currentBook = {
        title: firstLine.replace(/^[《【》】\s]+/, ''),
        highlights: [],
        notes: [],
      };
      // 检查后续行是否有作者
      for (let i = 1; i < lines.length; i++) {
        const authorMatch = lines[i].match(/作者[：:]\s*(.+)/);
        if (authorMatch) {
          currentBook.author = authorMatch[1].trim();
        }
      }
      continue;
    }

    if (currentBook) {
      for (const line of lines) {
        const trimmed = line.trim().replace(/^[-*]\s*/, '');
        if (!trimmed) continue;
        const noteMatch = trimmed.match(/^(笔记|想法|批注)[：:]\s*(.+)/);
        if (noteMatch) {
          currentBook.notes.push(noteMatch[2].trim());
        } else if (trimmed.length > 3) {
          currentBook.highlights.push(trimmed);
        }
      }
    }
  }

  if (currentBook) books.push(currentBook);
  return books;
}

/**
 * 智能检测文本格式并解析
 */
function parseImportText(text: string): ParsedBook[] {
  const trimmed = text.trim();

  // 尝试 JSON 格式
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed);
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          title: item.title || item.bookTitle || item.name || '未知书名',
          author: item.author || item.creator,
          highlights: item.highlights || item.marks || [],
          notes: item.notes || item.thoughts || [],
          review: item.review || item.abstract,
        }));
      }
    } catch {
      // 不是有效 JSON，继续尝试其他格式
    }
  }

  // 判断是 Markdown 还是纯文本
  if (trimmed.includes('#') || trimmed.startsWith('- ')) {
    return parseWereadMarkdown(trimmed);
  }

  return parseWereadText(trimmed);
}

// ========== 页面组件 ==========

export default function LibraryPage() {
  const { todayStr } = useToday();
  const { items, addItem, addItems, updateItem, deleteItem, byType, stats } = useLibrary();

  const [activeTab, setActiveTab] = useState<ItemType | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<ParsedBook[] | null>(null);
  const [importError, setImportError] = useState('');
  const [newItem, setNewItem] = useState({
    type: 'book' as ItemType,
    title: '',
    creator: '',
    date: todayStr,
    rating: 0,
    status: 'completed' as ItemStatus,
    note: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items;
    return items.filter((i) => i.type === activeTab);
  }, [items, activeTab]);

  const handleAdd = () => {
    if (!newItem.title.trim()) return;
    addItem(newItem);
    setNewItem({
      type: newItem.type,
      title: '',
      creator: '',
      date: todayStr,
      rating: 0,
      status: 'completed',
      note: '',
    });
    setShowAddForm(false);
  };

  const handleParseImport = () => {
    setImportError('');
    if (!importText.trim()) {
      setImportError('请先粘贴或输入内容');
      return;
    }
    const result = parseImportText(importText);
    if (result.length === 0) {
      setImportError('未能识别出书籍信息。请确认内容包含《书名》格式，或为 JSON 数组格式。');
      return;
    }
    setImportPreview(result);
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;
    const newItems: Omit<LibraryItem, 'id'>[] = importPreview.map((book) => ({
      type: 'book' as const,
      title: book.title,
      creator: book.author || '',
      date: todayStr,
      rating: 0,
      status: 'completed' as const,
      note: [
        book.review ? `书评：${book.review}` : '',
        book.highlights.length > 0
          ? `划线 ${book.highlights.length} 条：\n${book.highlights.slice(0, 5).join('\n')}${book.highlights.length > 5 ? '\n...' : ''}`
          : '',
        book.notes.length > 0
          ? `笔记 ${book.notes.length} 条：\n${book.notes.slice(0, 5).join('\n')}${book.notes.length > 5 ? '\n...' : ''}`
          : '',
      ].filter(Boolean).join('\n\n'),
    }));
    addItems(newItems);
    setShowImportModal(false);
    setImportText('');
    setImportPreview(null);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      setShowImportModal(true);
      // 自动解析
      const result = parseImportText(content);
      if (result.length > 0) {
        setImportPreview(result);
        setImportError('');
      } else {
        setImportError('无法识别文件内容格式。支持微信读书文本、Markdown 和 JSON 格式。');
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s === value ? 0 : s)}
          className="text-[16px] transition-transform hover:scale-110"
          style={{ opacity: s <= value ? 1 : 0.25 }}
        >
          ★
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['book', 'movie', 'blog', 'podcast'] as ItemType[]).map((type) => (
          <div key={type} className="card-base p-4 text-center">
            <div className="text-2xl mb-1">{TYPE_CONFIG[type].icon}</div>
            <div className="text-xl font-semibold" style={{ color: TYPE_CONFIG[type].color }}>
              {stats[type === 'book' ? 'books' : type === 'movie' ? 'movies' : type === 'blog' ? 'blogs' : 'podcasts']}
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">{TYPE_CONFIG[type].labelCN}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar + Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl">
          {(['all', 'book', 'movie', 'blog', 'podcast'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                activeTab === tab
                  ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab === 'all' ? '全部' : TYPE_CONFIG[tab].labelCN}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-sm px-3 py-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            导入笔记
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,.csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-sm px-3 py-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            导入文件
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-save"
          >
            + 添加记录
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowImportModal(false)}>
          <div
            className="card-base w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                导入微信读书笔记
              </h3>
              <button
                onClick={() => { setShowImportModal(false); setImportText(''); setImportPreview(null); setImportError(''); }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg"
              >
                ×
              </button>
            </div>

            <div className="text-[11px] text-[var(--text-muted)] mb-3 leading-relaxed">
              支持三种格式：1) 从微信读书App复制的笔记文本 2) 浏览器插件导出的 Markdown 3) JSON 数组文件
              <br />
              提示：在微信读书App中，点击「我」→「笔记」→ 选择一本书 → 点击右上角「导出」→「复制到剪贴板」
            </div>

            <textarea
              className="today-input resize-none w-full"
              rows={8}
              placeholder={`粘贴微信读书笔记到这里...\n\n示例格式：\n《被讨厌的勇气》\n作者：岸见一郎\n\n第1章\n为什么会害怕被别人讨厌？\n笔记：因为不懂得课题分离\n\n人的烦恼皆源于人际关系\n笔记：一切烦恼都是人际关系的烦恼`}
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportPreview(null); setImportError(''); }}
            />

            {importError && (
              <div className="text-[12px] text-[var(--danger)] mt-2">{importError}</div>
            )}

            {!importPreview && (
              <button
                onClick={handleParseImport}
                className="btn-save w-full mt-3"
                disabled={!importText.trim()}
              >
                解析内容
              </button>
            )}

            {/* Preview parsed books */}
            {importPreview && (
              <div className="mt-3 space-y-2">
                <div className="text-[12px] font-medium text-[var(--text-secondary)]">
                  识别到 {importPreview.length} 本书：
                </div>
                {importPreview.map((book, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px]">{TYPE_CONFIG.book.icon}</span>
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">{book.title}</span>
                      {book.author && (
                        <span className="text-[11px] text-[var(--text-muted)]">{book.author}</span>
                      )}
                    </div>
                    <div className="flex gap-3 text-[11px] text-[var(--text-muted)]">
                      <span>{book.highlights.length} 条划线</span>
                      <span>{book.notes.length} 条笔记</span>
                      {book.review && <span>有书评</span>}
                    </div>
                    {book.highlights.length > 0 && (
                      <div className="text-[11px] text-[var(--text-secondary)] mt-1.5 truncate">
                        {book.highlights[0]}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => { setImportPreview(null); setImportError(''); }}
                    className="btn-sm flex-1"
                  >
                    重新解析
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="btn-save flex-1"
                  >
                    确认导入 {importPreview.length} 本
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="card-base" onClick={() => setShowAddForm(false)}>
          <div onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">添加记录</h3>

            <div className="flex gap-2 mb-4">
              {(['book', 'movie', 'blog', 'podcast'] as ItemType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewItem((p) => ({ ...p, type }))}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all ${
                    newItem.type === type
                      ? 'text-white shadow-sm'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                  }`}
                  style={newItem.type === type ? { background: TYPE_CONFIG[type].color } : {}}
                >
                  {TYPE_CONFIG[type].icon} {TYPE_CONFIG[type].labelCN}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                className="today-input"
                placeholder={`${TYPE_CONFIG[newItem.type].labelCN}名称`}
                value={newItem.title}
                onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
                autoFocus
              />
              <input
                type="text"
                className="today-input"
                placeholder={newItem.type === 'movie' ? '导演' : newItem.type === 'blog' ? '博主' : '作者/主播'}
                value={newItem.creator}
                onChange={(e) => setNewItem((p) => ({ ...p, creator: e.target.value }))}
              />
              <div className="flex gap-3">
                <input
                  type="date"
                  className="today-input flex-1"
                  value={newItem.date}
                  onChange={(e) => setNewItem((p) => ({ ...p, date: e.target.value }))}
                />
                <select
                  className="today-input flex-1"
                  value={newItem.status}
                  onChange={(e) => setNewItem((p) => ({ ...p, status: e.target.value as ItemStatus }))}
                >
                  <option value="completed">已完成</option>
                  <option value="in_progress">进行中</option>
                  <option value="reading">在读/在看</option>
                  <option value="abandoned">弃了</option>
                </select>
              </div>
              <div>
                <span className="text-[11px] text-[var(--text-muted)] block mb-1.5">评分</span>
                <StarRating value={newItem.rating} onChange={(v) => setNewItem((p) => ({ ...p, rating: v }))} />
              </div>
              <textarea
                className="today-input resize-none"
                rows={2}
                placeholder="简短感想（选填）"
                value={newItem.note}
                onChange={(e) => setNewItem((p) => ({ ...p, note: e.target.value }))}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setShowAddForm(false)} className="btn-sm flex-1">取消</button>
                <button onClick={handleAdd} className="btn-save flex-1">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="flex flex-col gap-3">
        {filteredItems.length === 0 ? (
          <div className="card-base text-center py-12">
            <div className="text-3xl mb-2">📖</div>
            <div className="text-[14px] text-[var(--text-muted)]">
              {activeTab === 'all' ? '还没有记录' : `还没有${TYPE_CONFIG[activeTab].labelCN}记录`}
            </div>
            <div className="text-[12px] text-[var(--text-muted)] mt-1">
              点击「导入笔记」从微信读书导入，或点击「+ 添加记录」手动添加
            </div>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="card-base p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: TYPE_CONFIG[item.type].color + '20' }}
                >
                  {TYPE_CONFIG[item.type].icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-medium text-[var(--text-primary)]">{item.title}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: STATUS_CONFIG[item.status].color + '20', color: STATUS_CONFIG[item.status].color }}
                    >
                      {STATUS_CONFIG[item.status].label}
                    </span>
                  </div>
                  {item.creator && (
                    <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                      {item.type === 'movie' ? '导演' : item.type === 'blog' ? '博主' : '作者'}：{item.creator}
                    </div>
                  )}
                  {item.rating > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="text-[12px]" style={{ color: s <= item.rating! ? '#F5A623' : undefined, opacity: s <= item.rating! ? 1 : 0.2 }}>
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                  {item.note && (
                    <div className="text-[12px] text-[var(--text-secondary)] mt-2 leading-relaxed whitespace-pre-line line-clamp-3">{item.note}</div>
                  )}
                  <div className="text-[10px] text-[var(--text-muted)] mt-2">{item.date}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="w-7 h-7 rounded-md text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
