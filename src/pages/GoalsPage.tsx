import { useState, useMemo } from 'react';
import { useGoals, useVisionEngine } from '../hooks';
import { useGoalProgress } from '../hooks/useGoalProgress';
import type { Goal } from '../types';

export default function GoalsPage() {
  const { goals, projects, updateProgress, addGoal, deleteGoal, addProject, deleteProject, updateProjectTitle, updateProjectStatus } = useGoals();
  const { details } = useGoalProgress(goals);
  
  // 使用新的规则引擎
  const { 
    year: goalYear, 
    visionDistance, 
    availableYears, 
    switchYear, 
    updateDimension, 
    resetVisionDistance, 
    calculateVisionDistance,
    isCalculating 
  } = useVisionEngine();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState<string | null>(null);
  const [editProjectValue, setEditProjectValue] = useState('');

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

  const handleAddGoal = () => {
    if (newGoalTitle.trim()) {
      addGoal(newGoalTitle.trim(), 'Click Edit to update', '#C9A96E', 'growth', goalYear);
      setNewGoalTitle('');
    }
  };

  const handleAddProject = () => {
    if (newProjectTitle.trim()) {
      addProject(newProjectTitle.trim());
      setNewProjectTitle('');
    }
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
      { title: '副业收入目标', desc: 'AI相关项目或内容创作', progress: 0, color: '#C9A96E', dimension: 'workMoney' as const, year: goalYear, autoCalc: { type: 'money_monthly' as const, category: 'freelance', direction: 'income' as const, target: 5000 } },
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
        <div className="flex items-center gap-2 mt-4">
          <input
            type="text"
            className="today-input"
            placeholder="New goal title..."
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
          />
          <button onClick={handleAddGoal} className="btn-save">+ Add Goal</button>
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
          </div>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] mb-4">你离理想中的自己还有多远？</p>
        <VisionDistance data={visionDistance} onUpdate={updateDimension} onReset={resetVisionDistance} />
      </div>
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
