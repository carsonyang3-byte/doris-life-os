import { useState, useMemo, useRef } from 'react';
import { useTravel } from '../hooks';
import { useToday } from '../hooks';
import type { TravelPlan, TravelStatus, TravelJournalEntry, DayPlan, ItineraryItem } from '../types';

const STATUS_CONFIG: Record<TravelStatus, { label: string; color: string }> = {
  planning: { label: '筹备中', color: '#5B9BD5' },
  completed: { label: '已完成', color: 'var(--text-muted)' },
};

const MOOD_OPTIONS = ['', '开心', '放松', '惊喜', '感动', '满足', '疲惫', '一般'];

// ===== 照片压缩工具 =====
const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = (h * maxWidth) / w;
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject('canvas error'); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function TravelPage() {
  const { todayStr } = useToday();
  const {
    plans, journals, addPlan, updatePlan, deletePlan,
    addJournal, updateJournal, deleteJournal, getJournalsForTrip, stats,
  } = useTravel();

  // View: list | detail(plan) | itinerary | journal-view | journal-edit
  const [view, setView] = useState<'list' | 'detail' | 'itinerary' | 'journal-view' | 'journal-edit'>('list');
  const [activeTripId, setActiveTripId] = useState<number | null>(null);
  const [activeJournalId, setActiveJournalId] = useState<number | null>(null);

  // Plan form
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [planForm, setPlanForm] = useState({
    title: '', destination: '', status: 'planning' as TravelStatus,
    startDate: '', endDate: '', budget: '', companions: '', notes: '',
  });

  // Checklist
  const [newCheckItem, setNewCheckItem] = useState('');

  // Itinerary form
  const [itineraryDate, setItineraryDate] = useState('');
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);

  // Journal form
  const [journalForm, setJournalForm] = useState({
    date: '', title: '', content: '', mood: '', rating: 0,
  });
  const [journalPhotos, setJournalPhotos] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<TravelStatus | 'all'>('all');

  const activeTrip = plans.find((p) => p.id === activeTripId);
  const tripJournals = activeTripId ? getJournalsForTrip(activeTripId) : [];
  const activeJournal = journals.find((j) => j.id === activeJournalId);

  const filteredPlans = useMemo(() => {
    if (statusFilter === 'all') return plans;
    return plans.filter((p) => p.status === statusFilter);
  }, [plans, statusFilter]);

  // ===== 日期辅助 =====
  const getDaysText = (start: string, end?: string) => {
    if (!end) return '';
    const s = new Date(start);
    const e = new Date(end);
    const days = Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1;
    return `${days}天`;
  };

  const generateDateRange = (start: string, end?: string): string[] => {
    const dates: string[] = [];
    const s = new Date(start);
    const e = end ? new Date(end) : s;
    const cur = new Date(s);
    while (cur <= e) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  // ===== Plan CRUD =====

  const openNewPlan = () => {
    setEditingPlanId(null);
    setPlanForm({ title: '', destination: '', status: 'planning', startDate: '', endDate: '', budget: '', companions: '', notes: '' });
    setShowPlanForm(true);
  };

  const openEditPlan = (plan: TravelPlan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      title: plan.title, destination: plan.destination, status: plan.status,
      startDate: plan.startDate, endDate: plan.endDate || '',
      budget: plan.budget?.toString() || '', companions: plan.companions || '', notes: plan.notes || '',
    });
    setShowPlanForm(true);
  };

  const handleSavePlan = () => {
    if (!planForm.title.trim() || !planForm.destination.trim()) return;
    const data = {
      title: planForm.title.trim(), destination: planForm.destination.trim(),
      status: planForm.status, startDate: planForm.startDate || todayStr,
      endDate: planForm.endDate || undefined, budget: planForm.budget ? Number(planForm.budget) : undefined,
      companions: planForm.companions.trim() || undefined, notes: planForm.notes.trim() || undefined,
    };
    if (editingPlanId) {
      updatePlan(editingPlanId, data);
    } else {
      addPlan(data);
    }
    setShowPlanForm(false);
  };

  // ===== Checklist =====

  const toggleCheckItem = (planId: number, index: number) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan?.checklist) return;
    const updated = [...plan.checklist];
    if (updated[index].startsWith('[x] ')) {
      updated[index] = updated[index].replace('[x] ', '[ ] ');
    } else {
      updated[index] = updated[index].replace('[ ] ', '[x] ');
    }
    updatePlan(planId, { checklist: updated });
  };

  const addCheckItem = (planId: number) => {
    if (!newCheckItem.trim()) return;
    const plan = plans.find((p) => p.id === planId);
    const updated = [...(plan?.checklist || []), `[ ] ${newCheckItem.trim()}`];
    updatePlan(planId, { checklist: updated });
    setNewCheckItem('');
  };

  const removeCheckItem = (planId: number, index: number) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan?.checklist) return;
    const updated = plan.checklist.filter((_, i) => i !== index);
    updatePlan(planId, { checklist: updated.length > 0 ? updated : undefined });
  };

  // ===== Itinerary =====

  const openItinerary = (plan: TravelPlan) => {
    setActiveTripId(plan.id);
    const dates = generateDateRange(plan.startDate, plan.endDate);
    const existing = plan.itinerary || [];
    // 合并已有日程和新日期
    const merged = dates.map((d) => {
      const ex = existing.find((e) => e.date === d);
      return ex || { date: d, items: [] };
    });
    // 设置当前编辑的日期
    setItineraryDate(dates[0] || todayStr);
    setItineraryItems(merged.find((m) => m.date === (dates[0] || todayStr))?.items || []);
    setView('itinerary');
  };

  const selectItineraryDate = (date: string) => {
    setItineraryDate(date);
    const day = activeTrip?.itinerary?.find((d) => d.date === date);
    setItineraryItems(day?.items || []);
  };

  const saveItineraryDay = () => {
    if (!activeTripId) return;
    const existing = activeTrip?.itinerary || [];
    const updated = existing.map((d) => d.date === itineraryDate ? { ...d, items: itineraryItems } : d);
    const dayExists = existing.some((d) => d.date === itineraryDate);
    if (!dayExists) {
      updated.push({ date: itineraryDate, items: itineraryItems });
    }
    updatePlan(activeTripId, { itinerary: updated });
  };

  const addItineraryItem = () => {
    setItineraryItems((prev) => [...prev, { activity: '' }]);
  };

  const updateItineraryItem = (index: number, field: keyof ItineraryItem, value: string | number) => {
    setItineraryItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItineraryItem = (index: number) => {
    setItineraryItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ===== Journal =====

  const openNewJournal = () => {
    if (!activeTripId) return;
    setActiveJournalId(null);
    setJournalForm({ date: activeTrip?.startDate || todayStr, title: '', content: '', mood: '', rating: 0 });
    setJournalPhotos([]);
    setView('journal-edit');
  };

  const openEditJournal = (entry: TravelJournalEntry) => {
    setActiveJournalId(entry.id);
    setJournalForm({
      date: entry.date, title: entry.title || '', content: entry.content,
      mood: entry.mood || '', rating: entry.rating || 0,
    });
    setJournalPhotos(entry.photos || []);
    setView('journal-edit');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const base64 = await compressImage(file);
        setJournalPhotos((prev) => [...prev, base64]);
      } catch (err) {
        console.error('Photo upload error:', err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setJournalPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreview(null);
  };

  const handleSaveJournal = () => {
    if (!journalForm.content.trim() && !journalForm.title.trim() && journalPhotos.length === 0) return;
    if (!activeTripId) return;
    const data = {
      tripId: activeTripId, date: journalForm.date || todayStr,
      title: journalForm.title.trim() || undefined, content: journalForm.content.trim(),
      mood: journalForm.mood || undefined, rating: journalForm.rating || undefined,
      photos: journalPhotos,
    };
    if (activeJournalId) {
      updateJournal(activeJournalId, data);
    } else {
      addJournal(data);
    }
    setView('detail');
  };

  // ===== Star Rating =====

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={() => onChange(s === value ? 0 : s)}
          className="text-[16px] transition-transform hover:scale-110"
          style={{ opacity: s <= value ? 1 : 0.25 }}>
          ★
        </button>
      ))}
    </div>
  );

  // ============================================================
  // RENDER: Trip List
  // ============================================================

  if (view === 'list') {
    return (
      <>
        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: '总旅行', value: stats.totalTrips, icon: '✈️' },
            { label: '筹备中', value: stats.planning, icon: '📋' },
            { label: '已完成', value: stats.completed, icon: '🏁' },
            { label: '目的地', value: stats.destinations, icon: '🌍' },
            { label: '游记篇数', value: stats.totalJournals, icon: '📝' },
          ].map((s) => (
            <div key={s.label} className="card-base p-3 text-center">
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">{s.value}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Next Trip */}
        {stats.nextTrip && (
          <div className="card-base p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => { setActiveTripId(stats.nextTrip!.id); setView('detail'); }}>
            <div className="text-3xl">🧳</div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-[var(--text-muted)] mb-0.5">下一站</div>
              <div className="text-[15px] font-semibold text-[var(--text-primary)]">{stats.nextTrip.title}</div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                {stats.nextTrip.destination} · {stats.nextTrip.startDate}
                {stats.nextTrip.endDate && ` - ${stats.nextTrip.endDate}`}
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full"
              style={{ background: STATUS_CONFIG[stats.nextTrip.status].color + '20', color: STATUS_CONFIG[stats.nextTrip.status].color }}>
              {STATUS_CONFIG[stats.nextTrip.status].label}
            </span>
          </div>
        )}

        {/* Filter + Add */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl">
            {(['all', 'planning', 'completed'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  statusFilter === s ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}>
                {s === 'all' ? '全部' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
          <button onClick={openNewPlan} className="btn-save ml-auto">+ 新建旅行</button>
        </div>

        {/* Trip Cards */}
        <div className="flex flex-col gap-3">
          {filteredPlans.length === 0 ? (
            <div className="card-base text-center py-12">
              <div className="text-3xl mb-2">✈️</div>
              <div className="text-[14px] text-[var(--text-muted)]">
                {statusFilter === 'all' ? '还没有旅行计划' : `没有${STATUS_CONFIG[statusFilter].label}的旅行`}
              </div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1">点击「新建旅行」开始规划吧</div>
            </div>
          ) : (
            filteredPlans.map((plan) => {
              const jc = journals.filter((j) => j.tripId === plan.id).length;
              const cd = plan.checklist ? plan.checklist.filter((c) => c.startsWith('[x]')).length : 0;
              const ct = plan.checklist?.length || 0;
              const itCount = plan.itinerary?.filter((d) => d.items.length > 0).length || 0;

              return (
                <div key={plan.id} className="card-base p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => { setActiveTripId(plan.id); setView('detail'); }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-[#E8A87C]/15">
                      {plan.status === 'completed' ? '🏁' : '📍'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-medium text-[var(--text-primary)]">{plan.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: STATUS_CONFIG[plan.status].color + '20', color: STATUS_CONFIG[plan.status].color }}>
                          {STATUS_CONFIG[plan.status].label}
                        </span>
                      </div>
                      <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                        {plan.destination}
                        {plan.startDate && ` · ${plan.startDate}`}
                        {plan.endDate && ` - ${plan.endDate}`}
                        {plan.startDate && plan.endDate && ` (${getDaysText(plan.startDate, plan.endDate)})`}
                      </div>
                      {plan.companions && (
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">同行：{plan.companions}</div>
                      )}
                      <div className="flex gap-3 text-[11px] text-[var(--text-muted)] mt-1.5">
                        {itCount > 0 && <span>{itCount} 天日程</span>}
                        {jc > 0 && <span>{jc} 篇游记</span>}
                        {ct > 0 && <span>{cd}/{ct} 待办</span>}
                        {plan.budget && <span>预算 ¥{plan.budget.toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setActiveTripId(plan.id); openItinerary(plan); }}
                        className="w-7 h-7 rounded-md text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] transition-colors"
                        title="日程安排">
                        📅
                      </button>
                      <button onClick={() => { setActiveTripId(plan.id); openNewJournal(); }}
                        className="w-7 h-7 rounded-md text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] transition-colors"
                        title="写游记">
                        ✏️
                      </button>
                      <button onClick={() => openEditPlan(plan)}
                        className="w-7 h-7 rounded-md text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
                        title="编辑">
                        ✎
                      </button>
                      <button onClick={() => { if (confirm(`确定删除「${plan.title}」？相关游记也会一并删除。`)) deletePlan(plan.id); }}
                        className="w-7 h-7 rounded-md text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors"
                        title="删除">
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Plan Form Modal */}
        {showPlanForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPlanForm(false)}>
            <div className="card-base w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                  {editingPlanId ? '编辑旅行' : '新建旅行'}
                </h3>
                <button onClick={() => setShowPlanForm(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg">×</button>
              </div>
              <div className="flex flex-col gap-3">
                <input className="today-input" placeholder="旅行名称，如「日本关西之旅」" value={planForm.title}
                  onChange={(e) => setPlanForm((p) => ({ ...p, title: e.target.value }))} autoFocus />
                <input className="today-input" placeholder="目的地，如「日本·大阪/京都」" value={planForm.destination}
                  onChange={(e) => setPlanForm((p) => ({ ...p, destination: e.target.value }))} />
                <div className="flex gap-3">
                  <input type="date" className="today-input flex-1" value={planForm.startDate}
                    onChange={(e) => setPlanForm((p) => ({ ...p, startDate: e.target.value }))} />
                  <input type="date" className="today-input flex-1" value={planForm.endDate}
                    onChange={(e) => setPlanForm((p) => ({ ...p, endDate: e.target.value }))} />
                </div>
                <div className="flex gap-3">
                  <input className="today-input flex-1" placeholder="预算（选填）" type="number" value={planForm.budget}
                    onChange={(e) => setPlanForm((p) => ({ ...p, budget: e.target.value }))} />
                  <select className="today-input flex-1" value={planForm.status}
                    onChange={(e) => setPlanForm((p) => ({ ...p, status: e.target.value as TravelStatus }))}>
                    <option value="planning">筹备中</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>
                <input className="today-input" placeholder="同行人（选填）" value={planForm.companions}
                  onChange={(e) => setPlanForm((p) => ({ ...p, companions: e.target.value }))} />
                <textarea className="today-input resize-none" rows={2} placeholder="备注和想法（选填）" value={planForm.notes}
                  onChange={(e) => setPlanForm((p) => ({ ...p, notes: e.target.value }))} />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setShowPlanForm(false)} className="btn-sm flex-1">取消</button>
                  <button onClick={handleSavePlan} className="btn-save flex-1">保存</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ============================================================
  // RENDER: Trip Detail
  // ============================================================

  if (view === 'detail' && activeTrip) {
    const dates = generateDateRange(activeTrip.startDate, activeTrip.endDate);

    return (
      <>
        {/* Back + Status */}
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')}
            className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            ← 返回列表
          </button>
          <div className="w-px h-4 bg-[var(--border)]" />
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: STATUS_CONFIG[activeTrip.status].color + '20', color: STATUS_CONFIG[activeTrip.status].color }}>
            {STATUS_CONFIG[activeTrip.status].label}
          </span>
          <select className="text-[11px] bg-transparent border-none text-[var(--text-muted)] cursor-pointer"
            value={activeTrip.status}
            onChange={(e) => updatePlan(activeTrip.id, { status: e.target.value as TravelStatus })}>
            <option value="planning">筹备中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        {/* Trip Header */}
        <div className="card-base card-accent">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[20px] font-semibold text-[var(--text-primary)]">{activeTrip.title}</h2>
              <div className="text-[13px] text-[var(--text-secondary)] mt-1">{activeTrip.destination}</div>
              <div className="flex gap-4 text-[11px] text-[var(--text-muted)] mt-2">
                <span>{activeTrip.startDate}{activeTrip.endDate ? ` - ${activeTrip.endDate}` : ''}</span>
                {activeTrip.startDate && activeTrip.endDate && <span>{getDaysText(activeTrip.startDate, activeTrip.endDate)}</span>}
                {activeTrip.companions && <span>同行：{activeTrip.companions}</span>}
                {activeTrip.budget && <span>预算 ¥{activeTrip.budget.toLocaleString()}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEditPlan(activeTrip)} className="btn-sm">编辑</button>
              <button onClick={() => openItinerary(activeTrip)} className="btn-save">日程安排</button>
            </div>
          </div>
          {activeTrip.notes && (
            <div className="text-[12px] text-[var(--text-secondary)] mt-3 pt-3 border-t border-[var(--border)] leading-relaxed whitespace-pre-line">
              {activeTrip.notes}
            </div>
          )}
        </div>

        {/* Itinerary Preview */}
        {activeTrip.itinerary && activeTrip.itinerary.length > 0 && (
          <div className="card-base">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-medium text-[var(--text-primary)]">行程概览</h3>
              <button onClick={() => openItinerary(activeTrip)} className="text-[11px] text-[var(--accent)] hover:underline">
                编辑日程
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dates.map((date, idx) => {
                const day = activeTrip.itinerary?.find((d) => d.date === date);
                const hasItems = day && day.items.length > 0;
                return (
                  <div key={date} className={`shrink-0 w-20 text-center py-2 rounded-lg border transition-colors ${
                    hasItems ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)]'
                  }`}>
                    <div className="text-[10px] text-[var(--text-muted)]">Day {idx + 1}</div>
                    <div className="text-[12px] text-[var(--text-primary)] mt-0.5">{date.slice(5)}</div>
                    {hasItems && <div className="text-[10px] text-[var(--accent)] mt-0.5">{day!.items.length} 项</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Checklist */}
        <div className="card-base">
          <h3 className="text-[13px] font-medium text-[var(--text-primary)] mb-3">
            准备清单
            {activeTrip.checklist && activeTrip.checklist.length > 0 && (
              <span className="text-[11px] text-[var(--text-muted)] font-normal ml-2">
                {activeTrip.checklist.filter((c) => c.startsWith('[x]')).length}/{activeTrip.checklist.length}
              </span>
            )}
          </h3>
          <div className="flex flex-col gap-1.5 mb-3">
            {activeTrip.checklist?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 group">
                <button onClick={() => toggleCheckItem(activeTrip.id, idx)}
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors shrink-0 ${
                    item.startsWith('[x]') ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] hover:border-[var(--accent)]'
                  }`}>
                  {item.startsWith('[x]') && '✓'}
                </button>
                <span className={`flex-1 text-[12px] ${item.startsWith('[x]') ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                  {item.replace(/^\[.\] /, '')}
                </span>
                <button onClick={() => removeCheckItem(activeTrip.id, idx)}
                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity">
                  ×
                </button>
              </div>
            )) || <div className="text-[11px] text-[var(--text-muted)]">还没有待办事项</div>}
          </div>
          <div className="flex gap-2">
            <input className="today-input flex-1 text-[12px]" placeholder="添加待办事项..."
              value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addCheckItem(activeTrip.id); }} />
            <button onClick={() => addCheckItem(activeTrip.id)} className="btn-sm px-3">添加</button>
          </div>
        </div>

        {/* Travel Journals */}
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-medium text-[var(--text-primary)]">
            旅行游记
            <span className="text-[11px] text-[var(--text-muted)] font-normal ml-2">{tripJournals.length} 篇</span>
          </h3>
          <button onClick={openNewJournal} className="btn-sm">+ 写游记</button>
        </div>

        <div className="flex flex-col gap-3">
          {tripJournals.length === 0 ? (
            <div className="card-base text-center py-10">
              <div className="text-2xl mb-2">📝</div>
              <div className="text-[13px] text-[var(--text-muted)]">还没有游记</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">点击「写游记」记录旅途中的故事和照片</div>
            </div>
          ) : (
            tripJournals.map((entry) => {
              const hasPhotos = entry.photos && entry.photos.length > 0;
              return (
                <div key={entry.id} className="card-base p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => { setActiveJournalId(entry.id); setView('journal-view'); }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] font-medium text-[var(--accent)]">{entry.date}</span>
                    {entry.title && <span className="text-[13px] font-medium text-[var(--text-primary)]">{entry.title}</span>}
                    <span className="w-px h-3 bg-[var(--border)]" />
                    {entry.mood && <span className="text-[11px] text-[var(--text-muted)]">{entry.mood}</span>}
                    {entry.rating && entry.rating > 0 && (
                      <span className="flex gap-0.5 text-[10px]">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} style={{ color: s <= entry.rating! ? '#F5A623' : undefined, opacity: s <= entry.rating! ? 1 : 0.2 }}>★</span>
                        ))}
                      </span>
                    )}
                  </div>
                  {hasPhotos && (
                    <div className="flex gap-2 mb-2 overflow-hidden">
                      {entry.photos!.slice(0, 3).map((photo, idx) => (
                        <img key={idx} src={photo} alt="" className="w-20 h-20 object-cover rounded-lg" />
                      ))}
                      {entry.photos!.length > 3 && (
                        <div className="w-20 h-20 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center text-[12px] text-[var(--text-muted)]">
                          +{entry.photos!.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  {entry.content && (
                    <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                      {entry.content.length > 120 ? entry.content.slice(0, 120) + '...' : entry.content}
                    </div>
                  )}
                  <div className="flex justify-end gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEditJournal(entry)}
                      className="w-7 h-7 rounded-md text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors">
                      ✎
                    </button>
                    <button onClick={() => { if (confirm('确定删除这篇游记？')) deleteJournal(entry.id); }}
                      className="w-7 h-7 rounded-md text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors">
                      ×
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </>
    );
  }

  // ============================================================
  // RENDER: Itinerary Editor
  // ============================================================

  if (view === 'itinerary' && activeTrip) {
    const dates = generateDateRange(activeTrip.startDate, activeTrip.endDate);

    return (
      <>
        {/* Back */}
        <div className="flex items-center gap-3">
          <button onClick={() => setView('detail')}
            className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            ← 返回详情
          </button>
          <div className="w-px h-4 bg-[var(--border)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)]">{activeTrip.title} — 日程安排</span>
        </div>

        {/* Date Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dates.map((date, idx) => {
            const day = activeTrip.itinerary?.find((d) => d.date === date);
            const hasItems = day && day.items.length > 0;
            const isActive = date === itineraryDate;
            return (
              <button key={date} onClick={() => selectItineraryDate(date)}
                className={`shrink-0 px-4 py-2 rounded-xl text-[12px] font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : hasItems
                      ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--accent)]/30'
                      : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-transparent'
                }`}>
                Day {idx + 1} · {date.slice(5)}
                {hasItems && <div className="text-[10px] opacity-80">{day!.items.length} 项</div>}
              </button>
            );
          })}
        </div>

        {/* Items for selected date */}
        <div className="card-base">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-medium text-[var(--text-primary)]">
              {itineraryDate} 的安排
            </h3>
            <button onClick={addItineraryItem} className="btn-sm">+ 添加活动</button>
          </div>

          <div className="flex flex-col gap-3">
            {itineraryItems.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-[13px] text-[var(--text-muted)]">这一天还没有安排</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">点击「添加活动」开始规划</div>
              </div>
            ) : (
              itineraryItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 rounded-lg bg-[var(--bg-subtle)]">
                  <div className="flex flex-col gap-1.5 shrink-0 w-20">
                    <input type="time" className="today-input text-[11px] px-1.5 py-1" value={item.time || ''}
                      onChange={(e) => updateItineraryItem(idx, 'time', e.target.value)} />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input className="today-input text-[12px]" placeholder="活动，如「参观金阁寺」" value={item.activity}
                      onChange={(e) => updateItineraryItem(idx, 'activity', e.target.value)} />
                    <div className="flex gap-2">
                      <input className="today-input flex-1 text-[11px]" placeholder="地点（选填）" value={item.place || ''}
                        onChange={(e) => updateItineraryItem(idx, 'place', e.target.value)} />
                      <input type="number" className="today-input w-24 text-[11px]" placeholder="花费（选填）" value={item.cost || ''}
                        onChange={(e) => updateItineraryItem(idx, 'cost', Number(e.target.value) || 0)} />
                    </div>
                    <input className="today-input text-[11px]" placeholder="备注（选填）" value={item.note || ''}
                      onChange={(e) => updateItineraryItem(idx, 'note', e.target.value)} />
                  </div>
                  <button onClick={() => removeItineraryItem(idx)}
                    className="w-7 h-7 rounded-md text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors shrink-0 mt-1">
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <button onClick={saveItineraryDay} className="btn-save w-full mt-4">
            保存当天的日程
          </button>
        </div>
      </>
    );
  }

  // ============================================================
  // RENDER: Journal View (read-only full view)
  // ============================================================

  if (view === 'journal-view' && activeJournal && activeTrip) {
    return (
      <>
        <div className="flex items-center gap-3">
          <button onClick={() => setView('detail')}
            className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            ← 返回 {activeTrip.title}
          </button>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[13px] font-medium text-[var(--accent)]">{activeJournal.date}</span>
            {activeJournal.title && <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">{activeJournal.title}</h2>}
            <span className="w-px h-4 bg-[var(--border)]" />
            {activeJournal.mood && <span className="text-[12px] text-[var(--text-muted)]">{activeJournal.mood}</span>}
          </div>

          {activeJournal.rating && activeJournal.rating > 0 && (
            <div className="flex gap-0.5 text-[14px] mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ color: s <= activeJournal.rating! ? '#F5A623' : undefined, opacity: s <= activeJournal.rating! ? 1 : 0.2 }}>★</span>
              ))}
            </div>
          )}

          {/* Photos */}
          {activeJournal.photos && activeJournal.photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeJournal.photos.map((photo, idx) => (
                <img key={idx} src={photo} alt={`photo-${idx}`}
                  className="max-w-[280px] max-h-[280px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover"
                  style={{ width: photo.includes('base64') ? undefined : '100%' }}
                  onClick={() => setPhotoPreview(idx)} />
              ))}
            </div>
          )}

          {/* Content */}
          {activeJournal.content && (
            <div className="text-[14px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
              {activeJournal.content}
            </div>
          )}

          <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--border)]">
            <button onClick={() => openEditJournal(activeJournal)} className="btn-sm">编辑</button>
            <button onClick={() => { if (confirm('确定删除这篇游记？')) { deleteJournal(activeJournal.id); setView('detail'); } }}
              className="btn-sm text-[var(--danger)] hover:bg-[var(--danger)]/10">删除</button>
          </div>
        </div>

        {/* Photo Preview Modal */}
        {photoPreview !== null && activeJournal.photos && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setPhotoPreview(null)}>
            <img src={activeJournal.photos[photoPreview]} alt="preview"
              className="max-w-full max-h-full object-contain rounded-lg" />
            <button className="absolute top-4 right-4 text-white text-2xl hover:opacity-70" onClick={() => setPhotoPreview(null)}>×</button>
          </div>
        )}
      </>
    );
  }

  // ============================================================
  // RENDER: Journal Editor
  // ============================================================

  if (view === 'journal-edit') {
    return (
      <>
        <div className="flex items-center gap-3">
          <button onClick={() => setView('detail')}
            className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            ← 返回详情
          </button>
          <span className="text-[13px] font-medium text-[var(--text-primary)]">
            {activeJournalId ? '编辑游记' : '写游记'} — {activeTrip?.title}
          </span>
        </div>

        <div className="card-base p-5">
          <div className="flex flex-col gap-4">
            {/* Date + Mood */}
            <div className="flex gap-3">
              <input type="date" className="today-input flex-1" value={journalForm.date}
                onChange={(e) => setJournalForm((p) => ({ ...p, date: e.target.value }))} />
              <select className="today-input flex-1" value={journalForm.mood}
                onChange={(e) => setJournalForm((p) => ({ ...p, mood: e.target.value }))}>
                <option value="">心情（选填）</option>
                {MOOD_OPTIONS.slice(1).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Title */}
            <input className="today-input" placeholder="当天标题，如「Day 1: 抵达大阪」（选填）" value={journalForm.title}
              onChange={(e) => setJournalForm((p) => ({ ...p, title: e.target.value }))} />

            {/* Rating */}
            <div>
              <span className="text-[11px] text-[var(--text-muted)] block mb-1.5">当天评分</span>
              <StarRating value={journalForm.rating} onChange={(v) => setJournalForm((p) => ({ ...p, rating: v }))} />
            </div>

            {/* Photos Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[var(--text-muted)]">
                  照片{journalPhotos.length > 0 ? ` (${journalPhotos.length} 张)` : ''}
                </span>
                <button onClick={() => fileInputRef.current?.click()} className="text-[11px] text-[var(--accent)] hover:underline">
                  + 添加照片
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              </div>
              {journalPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {journalPhotos.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <img src={photo} alt={`upload-${idx}`} className="w-20 h-20 object-cover rounded-lg" />
                      <button onClick={() => removePhoto(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--danger)] text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-[10px] text-[var(--text-muted)] mt-1">支持 JPG/PNG，照片会自动压缩后保存在本地</div>
            </div>

            {/* Content */}
            <textarea className="today-input resize-y" rows={10} placeholder="记录今天的故事..." value={journalForm.content}
              onChange={(e) => setJournalForm((p) => ({ ...p, content: e.target.value }))} />

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => setView('detail')} className="btn-sm flex-1">取消</button>
              <button onClick={handleSaveJournal} className="btn-save flex-1">保存游记</button>
            </div>
          </div>
        </div>

        {/* Photo Preview Modal */}
        {photoPreview !== null && journalPhotos.length > 0 && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setPhotoPreview(null)}>
            <img src={journalPhotos[photoPreview]} alt="preview"
              className="max-w-full max-h-full object-contain rounded-lg" />
            <button className="absolute top-4 right-4 text-white text-2xl hover:opacity-70" onClick={() => setPhotoPreview(null)}>×</button>
          </div>
        )}
      </>
    );
  }

  return null;
}
