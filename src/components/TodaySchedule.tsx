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
  MoreVertical,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppData } from '../context/AppDataContext';
import { DateNavigator } from './DateNavigator';
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
  const closeMenu = () => setOpenMenuId(null);

  return (
    <div className="space-y-4">
      {/* Date pager — phones only (tablet+/desktop: inside the top app bar) */}
      <div className="flex justify-center pt-1 sm:hidden">
        <div className="w-full max-w-xs">
          <DateNavigator fullWidth />
        </div>
      </div>

      {/* Today's score — MD3 elevated card */}
      <section className="md-card md-card--elevated space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="md-label-medium truncate" style={{ color: 'var(--md-on-surface-variant)' }}>
              {targetDateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <div className="md-label-large mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
              {todayStats.completedCount} of {todayStats.totalTasks} done
            </div>
          </div>
          <div
            className="md-chip md-chip--assist shrink-0"
            title={`${todayStats.currentStreak}-day streak`}
          >
            <Flame className="w-4 h-4" strokeWidth={2.5} style={{ color: 'var(--md-primary)' }} />
            <span>{todayStats.currentStreak}-day streak</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="md-display-small font-mono leading-none shrink-0" style={{ color: 'var(--md-primary)' }}>
            {percent}%
          </div>
          <h2 className="md-title-large text-right min-w-0">
            {percent === 100 && todayStats.totalTasks > 0
              ? 'All habits done'
              : percent >= 50
              ? 'Halfway there'
              : `Today's schedule`}
          </h2>
        </div>

        <div className="md-progress-linear h-1.5" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="md-progress-linear__bar" style={{ width: `${percent}%` }} />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <p
            className="md-body-small flex-1 min-w-0 truncate"
            style={{ color: 'var(--md-on-surface-variant)' }}
            title="Consistency compounds. Small steps repeated daily build lasting momentum."
          >
            Consistency compounds. Small steps repeated daily build lasting momentum.
          </p>
          <button onClick={onOpenShareModal} className="md-button md-button--text md-ripple shrink-0">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </section>

      {/* Filters — MD3 filter chips, flat on the surface */}
      <section className="space-y-3" aria-label="Filters">
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
        <label className="md-text-field md-text-field--select">
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
      </section>

      {/* Task list — flat MD3 list with dividers; tap a row to edit it */}
      {sortedDayTasks.length === 0 ? (
        <section className="md-card md-card--outlined text-center space-y-3 py-10">
          <div
            className="w-10 h-10 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
          >
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="md-title-medium">No habits for this filter</h3>
            <p className="md-body-medium mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
              Add a habit or reset filters to see your schedule.
            </p>
          </div>
          <button onClick={() => onOpenAddTaskModal()} className="md-button md-button--filled md-ripple">
            <Plus className="w-4 h-4" />
            Create habit
          </button>
        </section>
      ) : (
        <ul className="md-card md-card--outlined !p-0 overflow-hidden" aria-label="Today's habits">
          {sortedDayTasks.map((task, index) => {
            const isCompleted = completedTaskIds.has(task.id);
            const parentRoutine = routines.find(r => r.id === task.routineId);
            const menuOpen = openMenuId === `task-${task.id}`;

            return (
              <li key={task.id}>
                {index > 0 && <hr className="md-divider" />}
                <div
                  className={`md-task-row${isCompleted ? ' md-task-row--done' : ''}`}
                  style={isCompleted ? { opacity: 0.65 } : undefined}
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

                  <button
                    onClick={() => onOpenEditTaskModal(task)}
                    className="flex flex-col md-ripple rounded-lg text-left flex-1 min-w-0 pl-1 pr-2 py-1.5"
                    title="Tap to edit this habit"
                    aria-label={`Edit ${task.title}`}
                  >
                    <span
                      className="md-body-large block truncate w-full"
                      style={isCompleted ? { textDecoration: 'line-through', color: 'var(--md-on-surface-variant)' } : undefined}
                    >
                      {task.title}
                    </span>
                    <span
                      className="md-body-small block truncate w-full mt-0.5 text-left"
                      style={{ color: 'var(--md-on-surface-variant)' }}
                    >
                      <span className="font-mono">{task.scheduledTime || '--:--'}</span>
                      {' · '}
                      {task.durationMinutes}m
                      {parentRoutine ? ` · ${parentRoutine.title}` : ''}
                      {' · '}
                      <span className="capitalize">{task.category}</span>
                      {' · '}
                      <span className="capitalize">{task.priority}</span>
                    </span>
                  </button>

                  <div className="relative shrink-0 self-center">
                    <button
                      onClick={() => setOpenMenuId(menuOpen ? null : `task-${task.id}`)}
                      className="md-icon-button md-ripple"
                      title="More options"
                      aria-label={`Options for ${task.title}`}
                      aria-expanded={menuOpen}
                    >
                      <MoreVertical className="w-[1.125rem] h-[1.125rem]" />
                    </button>
                    {menuOpen && (
                      <>
                        <div className="md-menu-backdrop" onClick={closeMenu} />
                        <div className="md-menu" role="menu">
                          <button
                            className="md-menu-item"
                            role="menuitem"
                            onClick={() => { closeMenu(); onOpenEditTaskModal(task); }}
                          >
                            <Pencil className="w-4 h-4" />
                            Edit habit
                          </button>
                          <button
                            className="md-menu-item md-menu-item--danger"
                            role="menuitem"
                            onClick={() => { closeMenu(); deleteTask(task.id); }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete habit
                          </button>
                        </div>
                      </>
                    )}
                  </div>
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
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="md-title-medium">All done for today</h3>
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
