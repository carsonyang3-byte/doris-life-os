import { useState, useMemo } from 'react';
import { Plus, Trash2, X, ChevronDown, ChevronUp, Check, Settings2 } from 'lucide-react';
import { useGoals, useVisionEngineShared, useHabits } from '../hooks';
import { useGoalProgress } from '../hooks/useGoalProgress';
import type { Goal, AutoCalcRule } from '../types';

export default function GoalsPage() {
  const { goals, projects, updateProgress, addGoal, deleteGoal, addProject, deleteProject, updateProjectTitle, updateProjectStatus } = useGoals();
  const { details } = useGoalProgress(goals);
  
  // 使用共享的 Vision Engine 状态（跨页面同步）
  const { 
    year: goalYear, 
    visionDistance, 
    availableYears, 
    switchYear, 
    updateDimension, 
    resetVisionDistance, 
    calculateVisionDistance,
    isCalculating,
    customDimensions,
    addDimension,
    removeDimension,
    updateDimensionSources,
  } = useVisionEngineShared();

  // 维度管理 Modal 状态
  const [showDimModal, setShowDimModal] = useState(false);
  const [newDimInput, setNewDimInput] = useState('');
  // 展开配置的维度索引
  const [expandedDimIndex, setExpandedDimIndex] = useState<number | null>(null);
  
  // 获取习惯列表用于手动映射
  const { habitList } = useHabits();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState<string | null>(null);
  const [editProjectValue, setEditProjectValue] = useState('');
  // 新增目标时的 autoCalc 选择
  const [newGoalAutoCalcType, setNewGoalAutoCalcType] = useState<string>('none');
  const [newGoalHabit, setNewGoalHabit] = useState('冥想');
  const [newGoalWindow, setNewGoalWindow] = useState('30');
  const [newGoalTarget, setNewGoalTarget] = useState('12');
  const [newGoalCategory, setNewGoalCategory] = useState('freelance');
  const [newGoalDirection, setNewGoalDirection] = useState<'income' | 'expense'>('income');
  const [showNewGoalOptions, setShowNewGoalOptions] = useState(false);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(String(goals[index].progress));
  };

  const handleSave = (index: number) => {
    const val = parseInt(editValue) || 0;
    updateProgress(index, Math.max(0, Math.min(100, val)));
    setEditingIndex(null);
  };

  const handleResetToAuto = (index: number) => {
    // 恢复自动计算：设置 manualOverride=false, progress 用自动值
    const goal = goals[index];
    if (goal.autoCalc) {
      const autoResult = details[index];
      updateProgress(index, autoResult.autoProgress, false);
      setEditingIndex(null);
    }
  };

  const buildAutoCalc = (): Goal['autoCalc'] | undefined => {
    const target = parseInt(newGoalTarget) || 10;
    const windowDays = parseInt(newGoalWindow) || 30;
    switch (newGoalAutoCalcType) {
      case 'habit_rate': return { type: 'habit_rate', habit: newGoalHabit, windowDays };
      case 'library_count': return { type: 'library_count', itemType: 'book', statusFilter: 'completed', target };
      case 'money_monthly': return { type: 'money_monthly', category: newGoalCategory, direction: newGoalDirection, target };
      case 'journal_monthly': return { type: 'journal_monthly', owner: 'me', target };
      case 'reflect_monthly': return { type: 'reflect_monthly', target };
      default: return undefined;
    }
  };

  const handleAddGoal = () => {
    if (newGoalTitle.trim()) {
      const autoCalc = buildAutoCalc();
      addGoal(newGoalTitle.trim(), 'Click Edit to update', '#C9A96E', 'growth', goalYear, autoCalc);
      setNewGoalTitle('');
      setNewGoalAutoCalcType('none');
      setShowNewGoalOptions(false);
    }
  };

  const handleAddProject = () => {
    if (newProjectTitle.trim()) {
      addProject(newProjectTitle.trim());
      setNewProjectTitle('');
    }
  };

  // 切换某个维度中某个习惯的选中状态
  const toggleHabitMapping = (dimIndex: number, habitName: string) => {
    const dim = customDimensions[dimIndex];
    const sources = dim.sources || [];
    
    // 找 habits 类型的 source
    const habitSource = sources.find(s => s.type === 'habits');
    let newKeys: string[];
    
    if (habitSource) {
      newKeys = habitSource.keys.includes(habitName)
        ? habitSource.keys.filter(k => k !== habitName)
        : [...habitSource.keys, habitName];
      
      // 如果 keys 为空了，移除这个 source
      const newSources = newKeys.length > 0
        ? sources.map(s => s.type === 'habits' ? { ...s, keys: newKeys } : s)
        : sources.filter(s => s.type !== 'habits');
      
      updateDimensionSources(dimIndex, newSources);
    } else {
      // 还没有 habits source，新建一个
      const newSources = [...sources, { type: 'habits' as const, keys: [habitName], weight: 0.5 }];
      updateDimensionSources(dimIndex, newSources);
    }
  };

  // 获取某个维度的手动映射习惯名列表
  const getMappedHabits = (dimIndex: number): string[] => {
    const dim = customDimensions[dimIndex];
    if (!dim.sources) return [];
    const hs = dim.sources.find(s => s.type === 'habits');
    return hs?.keys || [];
  };

  const handleEditProject = (title: string) => {
    setEditingProjectTitle(title);
    setEditProjectValue(title);
  };

  const handleSaveProjectTitle = () => {
    if (editingProjectTitle && editProjectValue.trim()) {
      updateProjectTitle(editingProjectTitle, editProjectValue.trim());
    }
    setEditingProjectTitle(null);
  };

  const filteredGoals = useMemo(
    () => goals.filter((g) => g.year === goalYear),
    [goals, goalYear]
  );

  const hasCurrentYearGoals = availableYears.includes(new Date().getFullYear());
  const hasGoalYearGoals = availableYears.includes(goalYear);

  const handleAddYearGoals = () => {
    // 为当前选中的年份创建默认目标
    const defaultGoalsForYear = [
      { title: '冥想习惯养成', desc: '每天冥想10分钟', progress: 0, color: '#5BAD6F', dimension: 'energy' as const, year: goalYear, autoCalc: { type: 'habit_rate' as const, habit: '冥想', windowDays: 30 } },
      { title: '读完12本书', desc: '每月1本', progress: 0, color: '#5B9BD5', dimension: 'growth' as const, year: goalYear, autoCalc: { type: 'library_count' as const, itemType: 'book' as const, statusFilter: 'completed', target: 12 } },
      { title: '体重管理', desc: '达到目标体重', progress: 0, color: '#E8963F', dimension: 'energy' as const, year: goalYear },
    ];
    defaultGoalsForYear.forEach(g => addGoal(g.title, g.desc, g.color, g.dimension, g.year, g.autoCalc));
  };

  const toggleProjectStatus = (title: string, current: 'active' | 'planning' | 'completed') => {
    const next = current === 'active' ? 'completed' : current === 'completed' ? 'planning' : 'active';
    updateProjectStatus(title, next);
  };

  return (
    <>
      {/* Goals */}
      <div className="card-base">
        <SectionHeader dot="success" title={`${goalYear} Goals`} extra={
          <div className="flex gap-1 items-center">
            {availableYears.map((y) => (
              <button
                key={y}
                onClick={() => switchYear(y)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  y === goalYear
                    ? 'bg-[var(--success)] text-white'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {y}
              </button>
            ))}
            {goalYear !== new Date().getFullYear() && (
              <button
                onClick={() => {
                  if (window.confirm(`为 ${new Date().getFullYear()} 年创建默认目标吗？`)) {
                    switchYear(new Date().getFullYear());
                    // 延迟添加确保状态已更新
                    setTimeout(handleAddYearGoals, 0);
                  }
                }}
                className="px-2 py-1 rounded-lg text-[11px] font-medium text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors"
              >
                + New
              </button>
            )}
          </div>
        } />
        <div className="flex flex-col gap-2.5">
          {filteredGoals.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[12px] text-[var(--text-muted)] mb-3">
                {goalYear === new Date().getFullYear() 
                  ? `还没有${goalYear}年的目标` 
                  : `${goalYear}年还没有目标`}
              </div>
              <button
                onClick={handleAddYearGoals}
                className="px-4 py-2 rounded-lg bg-[var(--success)]/10 text-[var(--success)] text-[12px] font-medium hover:bg-[var(--success)]/20 transition-colors"
              >
                创建 {goalYear} 年目标
              </button>
            </div>
          ) : filteredGoals.map((g, idx) => {
            const originalIdx = goals.indexOf(g);
            const detail = details[originalIdx];
            const hasAutoCalc = !!g.autoCalc;
            const showCalc = hasAutoCalc && expandedIndex === idx;
            const isEditing = editingIndex === originalIdx;

            return (
              <div
                key={g.title}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--bg-subtle)] transition-colors duration-200 hover:bg-[var(--bg-hover)]"
              >
                <div className="w-1 h-9 rounded-sm flex-shrink-0 mt-0.5" style={{ background: g.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium">{g.title}</span>
                    {hasAutoCalc && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                        style={{
                          background: detail.isManual ? 'rgba(201,169,110,0.12)' : 'rgba(91,173,111,0.10)',
                          color: detail.isManual ? 'var(--accent-dark)' : 'var(--success)',
                        }}
                      >
                        {detail.isManual ? '手动' : '自动'}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[var(--text-muted)] mt-0.5">{g.desc}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${detail.progress}%`, background: g.color }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold flex-shrink-0" style={{ color: g.color }}>
                      {detail.progress}%
                    </span>
                  </div>
                  {/* 自动计算说明 */}
                  {hasAutoCalc && (
                    <div className="mt1.5">
                      <button
                        onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                        className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                      >
                        {showCalc ? '收起' : '查看计算依据'}
                      </button>
                      {showCalc && (
                        <div className="mt-1.5 p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                          <div className="text-[11px] text-[var(--text-secondary)]">
                            {detail.autoReason}
                          </div>
                          {detail.isManual && (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => handleResetToAuto(originalIdx)}
                                className="text-[10px] text-[var(--success)] hover:underline"
                              >
                                恢复自动值 ({detail.autoProgress}%)
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="number"
                      className="w-16 text-[12px] px-2 py-1 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-center outline-none"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      min={0}
                      max={100}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSave(originalIdx)}
                      onBlur={() => handleSave(originalIdx)}
                    />
                    <span className="text-[10px] text-[var(--text-muted)]">%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(originalIdx)} className="btn-sm">Edit</button>
                    <button
                      onClick={() => deleteGoal(g.title)}
                      className="w-6 h-6 rounded text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors flex items-center justify-center"
                      title="删除目标"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="today-input"
              placeholder="New goal title..."
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
            />
            <button
              onClick={() => setShowNewGoalOptions(!showNewGoalOptions)}
              className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${showNewGoalOptions ? 'bg-[var(--success)]/15 text-[var(--success)]' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--success)]'}`}
              title="自动计算规则"
            >
              Auto
            </button>
            <button onClick={handleAddGoal} className="btn-save">+ Add Goal</button>
          </div>
          {/* 自动计算选项 */}
          {showNewGoalOptions && (
            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] block mb-1">计算规则</label>
                  <select
                    value={newGoalAutoCalcType}
                    onChange={(e) => setNewGoalAutoCalcType(e.target.value)}
                    className="w-full text-[12px] px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none"
                  >
                    <option value="none">无（手动输入）</option>
                    <option value="habit_rate">习惯完成率</option>
                    <option value="library_count">读书完成数</option>
                    <option value="money_monthly">月度收支</option>
                    <option value="journal_monthly">日记篇数</option>
                    <option value="reflect_monthly">觉察次数</option>
                  </select>
                </div>
                {newGoalAutoCalcType === 'habit_rate' && (
                  <>
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] block mb-1">习惯名称</label>
                      <input type="text" value={newGoalHabit} onChange={(e) => setNewGoalHabit(e.target.value)} className="w-full text-[12px] px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none" placeholder="冥想" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] block mb-1">统计天数</label>
                      <input type="number" value={newGoalWindow} onChange={(e) => setNewGoalWindow(e.target.value)} className="w-full text-[12px] px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none" placeholder="30" />
                    </div>
                  </>
                )}
                {(newGoalAutoCalcType === 'library_count' || newGoalAutoCalcType === 'money_monthly' || newGoalAutoCalcType === 'journal_monthly' || newGoalAutoCalcType === 'reflect_monthly') && (
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] block mb-1">目标数量</label>
                    <input type="number" value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} className="w-full text-[12px] px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none" placeholder="12" />
                  </div>
                )}
                {newGoalAutoCalcType === 'money_monthly' && (
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] block mb-1">收支方向</label>
                    <select value={newGoalDirection} onChange={(e) => setNewGoalDirection(e.target.value as 'income' | 'expense')} className="w-full text-[12px] px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none">
                      <option value="income">收入</option>
                      <option value="expense">支出</option>
                    </select>
                  </div>
                )}
              </div>
              {newGoalAutoCalcType !== 'none' && (
                <p className="text-[10px] text-[var(--text-muted)]">
                  {newGoalAutoCalcType === 'habit_rate' && `将根据「${newGoalHabit}」近 ${newGoalWindow} 天完成率自动计算进度`}
                  {newGoalAutoCalcType === 'library_count' && `将根据已读完书籍数量 / ${newGoalTarget} 自动计算进度`}
                  {newGoalAutoCalcType === 'money_monthly' && `将根据本月${newGoalDirection === 'income' ? '收入' : '支出'} / ¥${newGoalTarget} 自动计算`}
                  {newGoalAutoCalcType === 'journal_monthly' && `将根据本月日记篇数 / ${newGoalTarget} 自动计算`}
                  {newGoalAutoCalcType === 'reflect_monthly' && `将根据本月觉察次数 / ${newGoalTarget} 自动计算`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="card-base">
        <SectionHeader dot="info" title="Projects" />
        <div className="flex flex-col gap-2.5">
          {projects.map((p) => {
            const isEditingTitle = editingProjectTitle === p.title;
            return (
              <div key={p.title} className="p-3.5 rounded-xl bg-[var(--bg-subtle)] transition-colors duration-200 hover:bg-[var(--bg-hover)]">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-9 rounded-sm flex-shrink-0 mt-0.5" style={{ background: p.color }} />
                  <div className="flex-1 min-w-0">
                    {isEditingTitle ? (
                      <input
                        type="text"
                        className="today-input text-[14px] font-medium"
                        value={editProjectValue}
                        onChange={(e) => setEditProjectValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveProjectTitle()}
                        onBlur={handleSaveProjectTitle}
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium">{p.title}</span>
                        <button onClick={() => handleEditProject(p.title)} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)]">Edit</button>
                      </div>
                    )}
                    <div className="text-[12px] text-[var(--text-muted)] mt-0.5">{p.desc}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => toggleProjectStatus(p.title, p.status)}
                      className="text-[12px] font-medium px-2.5 py-1 rounded-md cursor-pointer transition-opacity hover:opacity-80"
                      style={{
                        color: p.status === 'active' ? 'var(--success)' : p.status === 'completed' ? 'var(--info)' : 'var(--warning)',
                        background: p.status === 'active' ? 'rgba(91,173,111,0.08)' : p.status === 'completed' ? 'rgba(91,139,213,0.08)' : 'rgba(232,150,63,0.08)',
                      }}
                    >
                      {p.status === 'active' ? '进行中' : p.status === 'completed' ? '已完成' : '规划中'}
                    </button>
                    <button
                      onClick={() => deleteProject(p.title)}
                      className="w-6 h-6 rounded text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors flex items-center justify-center"
                      title="删除项目"
                    >
                      ×
                    </button>
                  </div>
                </div>
                {/* 状态历史 */}
                {p.history && p.history.length > 0 && (
                  <div className="mt-2 ml-4 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-[var(--text-muted)]">变更记录：</span>
                    {p.history.slice(0, 5).map((h, hi) => (
                      <span key={hi} className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          color: h.status === 'active' ? 'var(--success)' : h.status === 'completed' ? 'var(--info)' : 'var(--warning)',
                          background: h.status === 'active' ? 'rgba(91,173,111,0.08)' : h.status === 'completed' ? 'rgba(91,139,213,0.08)' : 'rgba(232,150,63,0.08)',
                        }}
                      >
                        {h.date} → {h.status === 'active' ? '进行中' : h.status === 'completed' ? '已完成' : '规划中'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-4">
          <input
            type="text"
            className="today-input"
            placeholder="New project title..."
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
          />
          <button onClick={handleAddProject} className="btn-save">+ Add Project</button>
        </div>
      </div>

      {/* Vision Distance */}
      <div className="distance-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full dot-pulse" style={{ background: 'var(--accent)' }} />
            <h2 className="section-title" style={{ color: 'var(--accent)' }}>Vision Distance</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={calculateVisionDistance}
              className="text-[10px] text-[var(--accent)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
              disabled={isCalculating}
            >
              {isCalculating ? '计算中...' : '自动计算'}
            </button>
            <button
              onClick={() => setShowDimModal(true)}
              className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-md cursor-pointer hover:text-[var(--accent)] transition-colors font-medium hover:bg-[var(--bg-hover)]"
            >
              管理维度
            </button>
          </div>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] mb-4">你离理想中的自己还有多远？</p>
        <VisionDistance data={visionDistance} onUpdate={updateDimension} onReset={resetVisionDistance} />
      </div>

      {/* 管理维度 Modal */}
      {showDimModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDimModal(false); }}
        >
          <div className="card-base w-full max-w-sm max-h-[80vh] flex flex-col" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">管理 Vision 维度</h3>
              <button onClick={() => setShowDimModal(false)} className="p-1 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 维度列表 */}
            <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-1.5">
              {customDimensions.map((dim, index) => {
                const isExpanded = expandedDimIndex === index;
                const mappedHabits = getMappedHabits(index);
                return (
                  <div key={dim.label} className="rounded-lg bg-[var(--bg-subtle)] group overflow-hidden">
                    {/* 维度行 */}
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: dim.color }} />
                      <span className="flex-1 text-[13px] text-[var(--text-primary)]">{dim.label}</span>
                      <span className="text-[10px] text-[var(--text-muted)] mr-1">{visionDistance[index]?.current ?? 0}%</span>
                      
                      {/* 展开/收起配置按钮 */}
                      <button
                        onClick={() => setExpandedDimIndex(isExpanded ? null : index)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors"
                        title={isExpanded ? '收起配置' : '配置数据源'}
                      >
                        {isExpanded 
                          ? <ChevronUp className="w-3.5 h-3.5" /> 
                          : <Settings2 className="w-3.5 h-3.5" />
                        }
                      </button>
                      
                      {customDimensions.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`确定删除「${dim.label}」？`)) {
                              removeDimension(index);
                              if (expandedDimIndex === index) setExpandedDimIndex(null);
                            }
                          }}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-hover)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* 展开的数据源配置面板 */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-[var(--border)] mt-0">
                        <div className="pt-2">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Check className="w-3 h-3 text-[var(--accent)]" />
                            <span className="text-[11px] font-medium text-[var(--text-secondary)]">关联习惯</span>
                            <span className="text-[10px] text-[var(--text-muted)]">(勾选后自动计算将精确匹配)</span>
                          </div>
                          
                          {habitList.length === 0 ? (
                            <p className="text-[11px] text-[var(--text-muted)] py-2">还没有设置习惯</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {habitList.map(habit => {
                                const isChecked = mappedHabits.includes(habit);
                                return (
                                  <button
                                    key={habit}
                                    onClick={() => toggleHabitMapping(index, habit)}
                                    className={`text-[11px] px-2 py-1 rounded-md border transition-all ${
                                      isChecked
                                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                                        : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                                    }`}
                                  >
                                    {isChecked && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                                    {habit}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* 显示自动匹配提示 */}
                          {mappedHabits.length > 0 && (
                            <p className="text-[10px] text-[var(--text-muted)] mt-2 leading-relaxed">
                              已手动映射 {mappedHabits.length} 个习惯。未映射的仍通过关键词自动匹配。
                            </p>
                          )}
                          {mappedHabits.length === 0 && habitList.length > 0 && (
                            <p className="text-[10px] text-[var(--text-muted)] mt-2 leading-relaxed">
                              未手动映射，将通过关键词自动匹配相关习惯。
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 添加新维度 */}
            <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
              <input
                type="text"
                value={newDimInput}
                onChange={(e) => setNewDimInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newDimInput.trim()) {
                    addDimension(newDimInput.trim());
                    setNewDimInput('');
                  }
                }}
                placeholder="新增维度名称..."
                className="flex-1 text-[12px] px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                onClick={() => { if (newDimInput.trim()) { addDimension(newDimInput.trim()); setNewDimInput(''); } }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SectionHeader({ dot, title }: { dot: string; title: string }) {
  const dotColor = dot === 'accent' ? 'var(--accent)' : dot === 'success' ? 'var(--success)' : dot === 'info' ? 'var(--info)' : 'var(--warning)';
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full dot-pulse" style={{ background: dotColor }} />
        <h2 className="section-title" style={{ color: dotColor }}>{title}</h2>
      </div>
    </div>
  );
}

function VisionDistance({ data, onUpdate, onReset }: {
  data: typeof DISTANCE_DIMS_DEFAULT;
  onUpdate: (index: number, value: number) => void;
  onReset: () => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (index: number, current: number) => {
    setEditingIndex(index);
    setEditValue(String(current));
  };

  const handleSave = (index: number) => {
    const val = parseInt(editValue);
    if (!isNaN(val)) {
      onUpdate(index, val);
    }
    setEditingIndex(null);
  };

  // 检查是否有设置过数据
  const hasData = data.some(dim => dim.current > 0);
  const allZero = data.every(dim => dim.current === 0);

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <div className="text-[11px] text-[var(--text-muted)]">
          {allZero ? '点击数值设置你的 Vision Distance' : '点击数值编辑，Reset 清空'}
        </div>
        <button
          onClick={onReset}
          className="text-[10px] text-[var(--text-muted)] hover:text-[var(--warning)] transition-colors"
        >
          Reset
        </button>
      </div>
      
      {data.map((dim, idx) => (
        <div key={dim.label} className="mb-4 last:mb-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">{dim.label}</span>
            {editingIndex === idx ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  className="w-12 text-[11px] px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-center outline-none"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  min={0}
                  max={100}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSave(idx)}
                  onBlur={() => handleSave(idx)}
                />
                <span className="text-[10px] text-[var(--text-muted)]">%</span>
              </div>
            ) : (
              <button
                onClick={() => handleEdit(idx, dim.current)}
                className="text-[11px] font-semibold hover:opacity-70 transition-opacity cursor-pointer"
                style={{ color: dim.current === 0 ? 'var(--text-muted)' : dim.color }}
                title={dim.current === 0 ? '点击设置' : '点击编辑'}
              >
                {dim.current === 0 ? '未设置' : `${dim.current}%`}
              </button>
            )}
          </div>
          <div className="h-2 bg-[var(--bg-subtle)] rounded overflow-hidden relative">
            <div 
              className="h-full rounded transition-all duration-1000" 
              style={{ 
                width: `${dim.current}%`, 
                background: dim.current === 0 ? 'var(--border)' : dim.color,
                opacity: dim.current === 0 ? 0.3 : 1
              }} 
            />
            {dim.current === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[8px] text-[var(--text-muted)]">点击设置</span>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-[var(--text-muted)]">Now</span>
            <span className="text-[9px] text-[var(--text-muted)]">Vision (100%)</span>
          </div>
        </div>
      ))}
      
      {!hasData && (
        <div className="mt-4 p-3 rounded-md bg-[var(--bg-subtle)] border border-dashed border-[var(--border)]">
          <p className="text-[11px] text-[var(--text-muted)] mb-2">
            💡 <strong>Vision Distance 是什么？</strong>
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">
            这是你离理想生活的距离。每个维度从 0% 开始，随着你的进步自动增长。
            未来将根据你的打卡记录、习惯数据自动计算。
          </p>
        </div>
      )}
    </>
  );
}
