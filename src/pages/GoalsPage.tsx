import { useState, useMemo } from 'react';
import { useGoals } from '../hooks';
import { useGoalProgress } from '../hooks/useGoalProgress';
import { DISTANCE_DIMS } from '../lib/constants';
import type { Goal } from '../types';

export default function GoalsPage() {
  const { goals, projects, updateProgress, addGoal, addProject, deleteProject, updateProjectTitle, updateProjectStatus } = useGoals();
  const { details } = useGoalProgress(goals);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [goalYear, setGoalYear] = useState(new Date().getFullYear());
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
      addGoal(newGoalTitle.trim());
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

  const availableYears = useMemo(() => {
    const years = [...new Set(goals.map((g) => g.year))].sort((a, b) => b - a);
    const current = new Date().getFullYear();
    if (!years.includes(current)) years.unshift(current);
    return years;
  }, [goals]);

  const toggleProjectStatus = (title: string, current: 'active' | 'planning' | 'completed') => {
    const next = current === 'active' ? 'completed' : current === 'completed' ? 'planning' : 'active';
    updateProjectStatus(title, next);
  };

  return (
    <>
      {/* Goals */}
      <div className="card-base">
        <SectionHeader dot="success" title={`${goalYear} Goals`} extra={
          <div className="flex gap-1">
            {availableYears.map((y) => (
              <button
                key={y}
                onClick={() => setGoalYear(y)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  y === goalYear
                    ? 'bg-[var(--success)] text-white'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        } />
        <div className="flex flex-col gap-2.5">
          {filteredGoals.map((g, idx) => {
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
                    <div className="mt-1.5">
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
                  <button onClick={() => handleEdit(originalIdx)} className="btn-sm flex-shrink-0">Edit</button>
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
        <SectionHeader dot="accent" title="Vision Distance" />
        <p className="text-[12px] text-[var(--text-muted)] mb-4">你离理想中的自己还有多远？</p>
        <VisionDistance />
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

function VisionDistance() {
  return (
    <>
      {DISTANCE_DIMS.map((dim) => (
        <div key={dim.label} className="mb-4 last:mb-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">{dim.label}</span>
            <span className="text-[11px] font-semibold" style={{ color: dim.color }}>{dim.current}%</span>
          </div>
          <div className="h-2 bg-[var(--bg-subtle)] rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-1000" style={{ width: `${dim.current}%`, background: dim.color }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-[var(--text-muted)]">Now</span>
            <span className="text-[9px] text-[var(--text-muted)]">Vision</span>
          </div>
        </div>
      ))}
    </>
  );
}
