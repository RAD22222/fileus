import React, { useState } from 'react';
import {
  Check,
  Plus,
  Flame,
  Sun,
  Zap,
  Moon,
  Compass,
  Pencil,
  Trash2,
  Share2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppData } from '../context/AppDataContext';
import { RoutineTask, TaskCategory, TimeOfDay } from '../types';

interface TodayScheduleProps {
  onOpenAddTaskModal: (routineId?: string) => void;
  onOpenEditTaskModal: (task: RoutineTask) => void;
  onOpenShareModal: () => void;
}

const TIME_FILTERS: { id: 'all' | TimeOfDay; label: string; icon?: React.ReactNode }[] = [
  { id: 'all', label: 'All' },
  { id: 'morning', label: 'Morning', icon: <Sun className="w-4 h-4" /> },
  { id: 'afternoon', label: 'Afternoon', icon: <Zap className="w-4 h-4" /> },
  { id: 'evening', label: 'Evening', icon: <Moon className="w-4 h-4" /> },
];

const CATEGORIES: { id: 'all' | TaskCategory; label: string }[] = [
  { id: 'all', label: 'All domains' },
  { id: 'health', label: 'Health' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'mindfulness', label: 'Mindfulness' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'learning', label: 'Learning' },
  { id: 'creativity', label: 'Creativity' },
  { id: 'other', label: 'Other' },
];

export const TodaySchedule: React.FC<TodayScheduleProps> = ({
  onOpenAddTaskModal,
  onOpenEditTaskModal,
  onOpenShareModal,
}) => {
  const {
    routines,
    tasks,
    completions,
    selectedDate,
    toggleTaskCompletion,
    deleteTask,
    todayStats,
  } = useAppData();

  const [timeFilter, setTimeFilter] = useState<'all' | TimeOfDay>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TaskCategory>('all');

  const [y, m, d] = selectedDate.split('-').map(Number);
  const targetDateObj = new Date(y, m - 1, d);
  const currentDayOfWeek = targetDateObj.getDay();

  const dayTasks = tasks.filter(task => {
    if (task.isArchived) return false;
    if (!task.daysOfWeek.includes(currentDayOfWeek)) return false;

    const parentRoutine = routines.find(r => r.id === task.routineId);
    const routineTime = parentRoutine?.timeOfDay || 'anytime';

    if (timeFilter !== 'all' && routineTime !== timeFilter) {
      return false;
    }

    if (categoryFilter !== 'all' && task.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  const sortedDayTasks = [...dayTasks].sort((a, b) => {
    if (!a.scheduledTime) return 1;
    if (!b.scheduledTime) return -1;
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });

  const completedTaskIds = new Set(
    completions.filter(c => c.date === selectedDate).map(c => c.taskId)
  );

  const handleToggle = async (taskId: string) => {
    const isCurrentlyDone = completedTaskIds.has(taskId);
    await toggleTaskCompletion(taskId);

    if (!isCurrentlyDone && todayStats.completedCount + 1 === todayStats.totalTasks) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#007232', '#7be193', '#98feaf', '#4c6651', '#ffffff'],
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
    }
  };

  const percent = todayStats.completionPercentage;

  return (
    <div className="space-y-3">
      {/* Today's score — MD3 elevated card */}
      <section className="md-card md-card--elevated space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="md-label-medium uppercase tracking-wider" style={{ color: 'var(--md-on-surface-variant)' }}>
              {targetDateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
              {todayStats.completedCount} of {todayStats.totalTasks} done
            </div>
          </div>
          <div
            className="md-chip md-chip--assist"
            title={`${todayStats.currentStreak}-day streak`}
          >
            <Flame className="w-4 h-4" strokeWidth={2.5} style={{ color: 'var(--md-primary)' }} />
            <span className="font-mono">{todayStats.currentStreak}d streak</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <h2 className="md-headline-small">
            {percent === 100 && todayStats.totalTasks > 0
              ? 'Protocol complete'
              : percent >= 50
              ? 'Over halfway there'
              : `Today's protocol`}
          </h2>
          <div className="text-right shrink-0">
            <div className="md-display-small font-mono leading-none" style={{ color: 'var(--md-primary)' }}>
              {percent}%
            </div>
            <div className="md-label-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
              {todayStats.completedCount}/{todayStats.totalTasks}
            </div>
          </div>
        </div>

        <div className="md-progress-linear" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="md-progress-linear__bar" style={{ width: `${percent}%` }} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="md-body-small flex-1" style={{ color: 'var(--md-on-surface-variant)' }}>
            Consistency compounds. Small disciplines repeated daily build unstoppable momentum.
          </p>
          <button onClick={onOpenShareModal} className="md-button md-button--tonal md-ripple shrink-0">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </section>

      {/* Filters — MD3 filter chips */}
      <section className="md-card md-card--filled space-y-3">
        <div className="md-chip-row scrollbar-none">
          {TIME_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              className={`md-chip md-ripple${timeFilter === f.id ? ' md-chip--selected' : ''}`}
              aria-pressed={timeFilter === f.id}
            >
              {timeFilter === f.id && <Check className="w-4 h-4" />}
              {f.icon}
              <span>{f.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="md-text-field md-text-field--select flex-1">
            <select
              className="md-text-field__input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | TaskCategory)}
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <span className="md-text-field__label">Domain</span>
            <span className="md-text-field__arrow" aria-hidden="true">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </label>
          <button
            onClick={() => onOpenAddTaskModal()}
            className="md-button md-button--filled md-ripple shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add habit
          </button>
        </div>
      </section>

      {/* Task list */}
      {sortedDayTasks.length === 0 ? (
        <section className="md-card md-card--outlined text-center space-y-3 py-10">
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
          >
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="md-title-medium">No habits for this filter</h3>
            <p className="md-body-medium mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
              Add a routine step or reset filters to see your schedule.
            </p>
          </div>
          <button onClick={() => onOpenAddTaskModal()} className="md-button md-button--filled md-ripple">
            <Plus className="w-4 h-4" />
            Create first habit
          </button>
        </section>
      ) : (
        <ul className="space-y-2">
          {sortedDayTasks.map(task => {
            const isCompleted = completedTaskIds.has(task.id);
            const parentRoutine = routines.find(r => r.id === task.routineId);

            return (
              <li
                key={task.id}
                className="md-card md-card--filled flex items-center gap-1 pr-1"
                style={isCompleted ? { opacity: 0.6 } : undefined}
              >
                <button
                  onClick={() => handleToggle(task.id)}
                  className={`md-checkbox md-ripple${isCompleted ? ' md-checkbox--checked' : ''}`}
                  aria-label={isCompleted ? `Mark ${task.title} incomplete` : `Mark ${task.title} completed`}
                  aria-pressed={isCompleted}
                >
                  <span className="md-checkbox__box">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </span>
                </button>

                <div className="flex flex-col items-center justify-center w-12 shrink-0 font-mono text-center">
                  <span className="md-label-large">{task.scheduledTime || '--:--'}</span>
                  <span className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                    {task.durationMinutes}m
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className="md-body-large block truncate"
                    style={isCompleted ? { textDecoration: 'line-through', color: 'var(--md-on-surface-variant)' } : undefined}
                  >
                    {task.title}
                  </span>
                  <div
                    className="md-body-small truncate"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                  >
                    {parentRoutine ? `${parentRoutine.title} · ` : ''}
                    <span className="capitalize">{task.category}</span>
                    {' · '}
                    <span className="uppercase font-mono md-label-small">{task.priority}</span>
                  </div>
                </div>

                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => onOpenEditTaskModal(task)}
                    className="md-icon-button md-ripple"
                    title="Edit habit"
                    aria-label="Edit habit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="md-icon-button md-ripple"
                    title="Delete habit"
                    aria-label="Delete habit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Daily victory */}
      {percent === 100 && todayStats.totalTasks > 0 && (
        <section className="md-card md-card--elevated flex flex-col sm:flex-row items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="md-title-medium">Daily victory achieved</h3>
            <p className="md-body-small mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
              All {todayStats.totalTasks} scheduled habits done. Your {todayStats.currentStreak}-day streak is secured.
            </p>
          </div>
          <button onClick={onOpenShareModal} className="md-button md-button--filled md-ripple w-full sm:w-auto">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </section>
      )}
    </div>
  );
};
