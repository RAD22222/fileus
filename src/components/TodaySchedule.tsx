import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Snowflake,
  GripVertical,
  Minus,
  Play,
  Pause,
  BookHeart,
  ChevronDown,
  PartyPopper,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import { getAccents } from '../lib/themes';
import { hapticTick, hapticUndo, hapticNudge, hapticCelebrate } from '../lib/pwa';
import { DateNavigator } from './DateNavigator';
import { RoutineTask, TaskCategory, TimeOfDay, Mood } from '../types';

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

const GROUP_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'anytime'];
const GROUP_META: Record<TimeOfDay, { label: string; icon: React.ReactNode }> = {
  morning: { label: 'Morning', icon: <Sun className="w-4 h-4" /> },
  afternoon: { label: 'Afternoon', icon: <Zap className="w-4 h-4" /> },
  evening: { label: 'Evening', icon: <Moon className="w-4 h-4" /> },
  anytime: { label: 'Anytime', icon: <Compass className="w-4 h-4" /> },
};

const MOODS: { id: Mood; emoji: string; label: string }[] = [
  { id: 'great', emoji: '😄', label: 'Great day' },
  { id: 'good', emoji: '🙂', label: 'Good day' },
  { id: 'neutral', emoji: '😐', label: 'Average' },
  { id: 'low', emoji: '😔', label: 'Rough day' },
];

/** Circular progress ring — M3 expressive hero meter */
const ProgressRing: React.FC<{ percent: number }> = ({ percent }) => {
  const r = 32;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <div
      className="md-ring w-[4.5rem] h-[4.5rem]"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg viewBox="0 0 72 72" className="w-full h-full">
        <circle className="md-ring__track" cx="36" cy="36" r={r} />
        <circle
          className="md-ring__bar"
          cx="36"
          cy="36"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="md-ring__label">
        <span className="md-title-large font-mono">{percent}%</span>
      </span>
    </div>
  );
};

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
    setTaskProgress,
    deleteTask,
    reorderTasks,
    todayStats,
    streakFreezes,
    freezeUsedDates,
    useStreakFreeze,
    newlyEarnedMilestone,
    acknowledgeMilestone,
    saveJournalEntry,
    getJournalEntry,
  } = useAppData();
  const { colorScheme, customHue } = useTheme();
  const accents = getAccents(colorScheme, customHue);

  const [timeFilter, setTimeFilter] = useState<'all' | TimeOfDay>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TaskCategory>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Live timer for timer-type habits
  const [runningTimer, setRunningTimer] = useState<{ taskId: string; startedAt: number } | null>(null);
  const [timerTick, setTimerTick] = useState(0);
  useEffect(() => {
    if (!runningTimer) return;
    const iv = setInterval(() => setTimerTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [runningTimer]);

  // Day journal local draft
  const journalEntry = getJournalEntry(selectedDate);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalDraft, setJournalDraft] = useState('');
  const [journalMood, setJournalMood] = useState<Mood | undefined>(undefined);
  const [journalDirty, setJournalDirty] = useState(false);
  useEffect(() => {
    setJournalDraft(journalEntry?.note || '');
    setJournalMood(journalEntry?.mood);
    setJournalDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, journalEntry?.note, journalEntry?.mood]);

  const debouncedSaveJournal = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveJournal = (note: string, mood?: Mood) => {
    setJournalDraft(note);
    setJournalMood(mood);
    setJournalDirty(true);
    if (debouncedSaveJournal.current) clearTimeout(debouncedSaveJournal.current);
    debouncedSaveJournal.current = setTimeout(() => {
      saveJournalEntry(selectedDate, note, mood);
      setJournalDirty(false);
      hapticNudge();
    }, 700);
  };

  // Milestone celebration
  useEffect(() => {
    if (newlyEarnedMilestone != null) {
      hapticCelebrate();
      try {
        confetti({
          particleCount: 140,
          spread: 75,
          origin: { y: 0.5 },
          colors: accents.confetti,
        });
      } catch {}
    }
  }, [newlyEarnedMilestone, colorScheme]);

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

  const sortedDayTasks = useMemo(
    () =>
      [...dayTasks].sort((a, b) => {
        const oa = a.order ?? 9999;
        const ob = b.order ?? 9999;
        if (oa !== ob) return oa - ob;
        if (!a.scheduledTime) return 1;
        if (!b.scheduledTime) return -1;
        return a.scheduledTime.localeCompare(b.scheduledTime);
      }),
    [dayTasks]
  );

  const groupKeyOf = (task: RoutineTask): TimeOfDay =>
    routines.find(r => r.id === task.routineId)?.timeOfDay || 'anytime';

  // Grouped sections (only when no time filter is active)
  const groupedTasks = timeFilter === 'all'
    ? GROUP_ORDER
        .map(g => ({ group: g, items: sortedDayTasks.filter(t => groupKeyOf(t) === g) }))
        .filter(g => g.items.length > 0)
    : null;

  const getCompletion = (taskId: string, date: string) =>
    completions.find(c => c.taskId === taskId && c.date === date);
  const isTaskDone = (task: RoutineTask): boolean => {
    const c = getCompletion(task.id, selectedDate);
    if (!c) return false;
    if (task.habitType === 'count') return (c.value ?? task.targetCount ?? 1) >= (task.targetCount ?? 1);
    if (task.habitType === 'timer') return (c.value ?? 0) >= Math.max(1, task.durationMinutes);
    return true;
  };
  const completedTaskIds = useMemo(
    () => new Set(sortedDayTasks.filter(isTaskDone).map(t => t.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortedDayTasks, completions, selectedDate]
  );

  const handleToggle = async (task: RoutineTask) => {
    const isCurrentlyDone = completedTaskIds.has(task.id);
    await toggleTaskCompletion(task.id);
    if (isCurrentlyDone) {
      hapticUndo();
      return;
    }
    hapticTick();

    if (todayStats.completedCount + 1 === todayStats.totalTasks) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: accents.confetti,
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
    }
  };

  // ---- Streak freeze eligibility: yesterday had scheduled habits but is incomplete & unfrozen ----
  const yesterdayStr = useMemo(() => {
    const dt = new Date();
    dt.setDate(dt.getDate() - 1);
    return dt.toISOString().split('T')[0];
  }, []);
  const yesterdayDow = useMemo(
    () => new Date(new Date(yesterdayStr + 'T00:00:00').getTime()).getDay(),
    [yesterdayStr]
  );
  const freezeApplicable = useMemo(() => {
    if (streakFreezes <= 0) return false;
    if (freezeUsedDates.includes(yesterdayStr)) return false;
    const hadTasks = tasks.some(t => !t.isArchived && t.daysOfWeek.includes(yesterdayDow));
    const dayDone = completions.some(c => c.date === yesterdayStr);
    return hadTasks && !dayDone;
  }, [streakFreezes, freezeUsedDates, yesterdayStr, yesterdayDow, tasks, completions]);

  // ---- Drag reorder ----
  // One-shot entrance stagger: rows animate in when the tab mounts, then the
  // animation class is dropped. Without this, a live drag reorder would
  // restart every row's entrance animation on each swap (changing a row's
  // animation-delay after the animation finished re-runs it), making the
  // list flicker / look stuck while dragging.
  const [entranceDone, setEntranceDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntranceDone(true), 800);
    return () => clearTimeout(t);
  }, []);
  const [drag, setDrag] = useState<{
    id: string;
    listId: string;
    anchorY: number;
    currentY: number;
    committedIndex: number;
    listLength: number;
    pitch: number;
  } | null>(null);

  const listItemsOf = (listId: string): RoutineTask[] => {
    if (listId === 'all') return sortedDayTasks;
    const g = groupedTasks?.find(x => x.group === listId);
    return g ? g.items : [];
  };

  const startDrag = (e: React.PointerEvent, task: RoutineTask) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const listId = groupedTasks
      ? (groupedTasks.find(x => x.items.some(t => t.id === task.id))?.group ?? 'all')
      : 'all';
    const items = listItemsOf(listId);
    const fromIndex = items.findIndex(t => t.id === task.id);
    if (fromIndex < 0) return;
    const ul = (e.target as HTMLElement).closest('ul');
    const pitch = ul ? ul.scrollHeight / Math.max(1, items.length) : 73;
    setDrag({
      id: task.id,
      listId,
      anchorY: e.clientY,
      currentY: e.clientY,
      committedIndex: fromIndex,
      listLength: items.length,
      pitch,
    });
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const target = Math.max(
      0,
      Math.min(drag.listLength - 1, Math.round((e.clientY - drag.anchorY) / drag.pitch))
    );
    if (target !== drag.committedIndex) {
      // Live-swap: commit new order immediately and re-anchor
      const reordered = listItemsOf(drag.listId).map(t => t.id);
      reordered.splice(drag.committedIndex, 1);
      reordered.splice(target, 0, drag.id);
      reorderTasks(reordered);
      const anchorDelta = (target - drag.committedIndex) * drag.pitch;
      setDrag({
        ...drag,
        anchorY: drag.anchorY + anchorDelta,
        committedIndex: target,
        currentY: e.clientY,
      });
      hapticNudge();
    } else {
      setDrag({ ...drag, currentY: e.clientY });
    }
  };

  const endDrag = () => setDrag(null);

  const renderTaskRow = (    task: RoutineTask,
    showDivider: boolean,
    index: number
  ) => {
    const isCompleted = completedTaskIds.has(task.id);
    const parentRoutine = routines.find(r => r.id === task.routineId);
    const menuOpen = openMenuId === `task-${task.id}`;
    const isDragging = drag?.id === task.id;
    const completion = getCompletion(task.id, selectedDate);
    const type = task.habitType || 'check';
    const timerRunning = runningTimer?.taskId === task.id;
    const timerSeconds = timerRunning && runningTimer
      ? Math.floor((Date.now() - runningTimer.startedAt) / 1000)
      : 0;

    const counterValue = completion?.value ?? (isCompleted ? (task.targetCount ?? 1) : 0);
    const timerValueMinutes = (completion?.value ?? 0) + (timerRunning ? timerSeconds / 60 : 0);
    const timerTargetMin = Math.max(1, task.durationMinutes);
    void timerTick; // re-render each second while running

    return (
      <li
        key={task.id}
        className={`${entranceDone ? '' : 'md-item-enter '}${isDragging ? 'md-item-dragging' : ''}`}
        style={{
          ...(isDragging ? { zIndex: 5, position: 'relative' } : undefined),
          ...(entranceDone ? undefined : { animationDelay: `${Math.min(index * 40, 240)}ms` }),
        }}
      >
        {showDivider && <hr className="md-divider" />}
        <div
          className={`md-task-row${isCompleted ? ' md-task-row--done' : ''}`}
          style={{
            ...(isCompleted ? { opacity: 0.65 } : undefined),
            ...(isDragging ? { transform: `translateY(${drag!.currentY - drag!.anchorY}px)`, boxShadow: 'var(--md-elevation-3)', background: 'var(--md-surface-container-high)' } : undefined),
          }}
        >
          {/* Drag handle */}
          <button
            onPointerDown={(e) => startDrag(e, task)}
            onPointerMove={onDragMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="md-icon-button md-icon-button--plain shrink-0 self-center cursor-grab touch-none"
            style={{ opacity: 0.4 }}
            title="Hold & drag to reorder"
            aria-label={`Reorder ${task.title}`}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {(type === 'check' || (isCompleted && type !== 'count' && type !== 'timer')) && (
            <button
              onClick={() => handleToggle(task)}
              className={`md-checkbox md-ripple${isCompleted ? ' md-checkbox--checked' : ''}`}
              aria-label={isCompleted ? `Mark ${task.title} incomplete` : `Mark ${task.title} completed`}
              aria-pressed={isCompleted}
            >
              <span className="md-checkbox__box">
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
              </span>
            </button>
          )}

          {type === 'timer' && !isCompleted && !timerRunning && (
            <button
              onClick={() => { setRunningTimer({ taskId: task.id, startedAt: Date.now() }); hapticTick(); }}
              className="md-checkbox md-checkbox--tinted md-ripple"
              style={{ color: 'var(--md-primary)' }}
              title="Start timer"
              aria-label={`Start timer for ${task.title}`}
            >
              <span className="md-checkbox__box" style={{ background: 'transparent' }}>
                <Play className="w-4 h-4" fill="currentColor" />
              </span>
            </button>
          )}

          {type === 'timer' && timerRunning && !isCompleted && (
            <button
              onClick={async () => {
                // Commit accumulated minutes
                const mins = Math.floor(timerValueMinutes);
                setRunningTimer(null);
                await setTaskProgress(task.id, mins);
                hapticNudge();
              }}
              className="md-checkbox md-ripple"
              title="Pause timer"
              aria-label={`Pause timer for ${task.title}`}
              style={{ color: 'var(--md-primary)' }}
            >
              <span className="md-checkbox__box" style={{ background: 'transparent' }}>
                <Pause className="w-4 h-4" fill="currentColor" />
              </span>
            </button>
          )}

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
              {type === 'count' ? (
                <span className="font-mono">{isCompleted ? task.targetCount : counterValue}/{task.targetCount}</span>
              ) : type === 'timer' ? (
                timerRunning ? (
                  <span className="font-mono" style={{ color: 'var(--md-primary)' }}>
                    {String(Math.floor(timerValueMinutes)).padStart(2, '0')}:
                    {String(timerSeconds % 60).padStart(2, '0')} running
                  </span>
                ) : (
                  <span className="font-mono">{isCompleted ? timerTargetMin : Math.floor(timerValueMinutes)}/{timerTargetMin}m</span>
                )
              ) : (
                <>{task.durationMinutes}m</>
              )}
              {parentRoutine ? ` · ${parentRoutine.title}` : ''}
              {' · '}
              <span className="capitalize">{task.category}</span>
              {' · '}
              <span className="capitalize">{task.priority}</span>
            </span>
          </button>

          {/* Counter stepper */}
          {type === 'count' && !isCompleted && (
            <div className="flex items-center gap-1 shrink-0 self-center">
              <button
                onClick={() => { if (counterValue > 0) { setTaskProgress(task.id, counterValue - 1); hapticUndo(); } }}
                className="md-icon-button md-icon-button--plain"
                aria-label={`Remove one from ${task.title}`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setTaskProgress(task.id, counterValue + 1); hapticNudge(); }}
                className="md-icon-button md-icon-button--plain"
                aria-label={`Add one to ${task.title}`}
              >
                <Plus className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
              </button>
            </div>
          )}

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
  };

  const percent = todayStats.completionPercentage;
  const closeMenu = () => setOpenMenuId(null);

  return (
    <div className="space-y-4">
      {/* Date pager — phones only (tablet+/desktop: inside the top app bar) */}
      <div className="md-item-enter flex justify-center pt-1 sm:hidden">
        <div className="w-full max-w-xs">
          <DateNavigator fullWidth />
        </div>
      </div>

      {/* Today's hero — MD3 elevated card with progress ring */}
      <section
        className="md-card md-card--elevated md-item-enter space-y-4"
        style={{ borderRadius: '1.5rem', animationDelay: '60ms' }}
      >
        <div className="flex items-center gap-4">
          <ProgressRing percent={percent} />
          <div className="flex-1 min-w-0">
            <div className="md-label-medium truncate" style={{ color: 'var(--md-on-surface-variant)' }}>
              {targetDateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <h2 className="md-headline-small mt-0.5 truncate">
              {percent === 100 && todayStats.totalTasks > 0 ? 'All habits done' : "Today's schedule"}
            </h2>
            <div
              className="flex items-center gap-3 mt-2 md-body-small flex-wrap"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              <span>{todayStats.completedCount} of {todayStats.totalTasks} done</span>
              {streakFreezes > 0 && (
                <span className="flex items-center gap-1 md-label-medium" title="Streak freezes earned">
                  <Snowflake className="w-3.5 h-3.5" style={{ color: 'var(--md-tertiary)' }} />
                  {streakFreezes}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-2 px-3.5 py-2.5 flex-wrap"
          style={{
            background: 'var(--md-surface-container)',
            borderRadius: '1rem',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          <span className="flex items-center gap-1.5 md-label-large min-w-0">
            <Flame className="w-4 h-4 shrink-0" style={{ color: 'var(--md-primary)' }} />
            <span className="truncate">
              {todayStats.currentStreak}-day streak{percent >= 50 && percent < 100 ? ' — keep it going' : ''}
            </span>
          </span>
          <span className="flex items-center gap-1">
            {freezeApplicable && (
              <button
                onClick={() => { if (useStreakFreeze(yesterdayStr)) hapticTick(); }}
                className="md-button md-button--text md-ripple shrink-0"
                title="Protect your streak through yesterday's miss"
              >
                <Snowflake className="w-4 h-4" />
                Use freeze
              </button>
            )}
            <button onClick={onOpenShareModal} className="md-button md-button--text md-ripple shrink-0">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </span>
        </div>
      </section>

      {/* Filters — MD3 filter chips, flat on the surface */}
      <section className="md-item-enter space-y-3" style={{ animationDelay: '140ms' }} aria-label="Filters">
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

      {/* Task list — flat MD3 list with dividers; drag handle to reorder, tap row to edit */}
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
        <>
          {groupedTasks ? (
            /* Grouped by time of day */
            <div className="space-y-4" aria-label="Today's habits">
              {groupedTasks.map(({ group, items }) => (
                <section key={group} aria-label={GROUP_META[group].label}>
                  <div
                    className="flex items-center gap-1.5 md-label-large px-1 mb-1.5"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                  >
                    {GROUP_META[group].icon}
                    <span>{GROUP_META[group].label}</span>
                  </div>
                  <ul className="md-card md-card--outlined !p-0 overflow-hidden md-list-drag">
                    {items.map((task, i) => renderTaskRow(task, i > 0, i))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            /* Single filtered list */
            <ul className="md-card md-card--outlined !p-0 overflow-hidden md-list-drag" aria-label="Today's habits">
              {sortedDayTasks.map((task, i) => renderTaskRow(task, i > 0, i))}
            </ul>
          )}
        </>
      )}

      {/* Day journal */}
      <section
        className="md-card md-card--outlined"
        style={{ borderRadius: '1.5rem' }}
        aria-label="Day journal"
      >
        <button
          onClick={() => setJournalOpen(o => !o)}
          className="w-full flex items-center justify-between md-ripple rounded-2xl px-1 py-1"
          aria-expanded={journalOpen}
        >
          <span className="flex items-center gap-2">
            <BookHeart className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
            <span className="md-title-medium">Day journal</span>
            {journalEntry?.mood && <span aria-hidden="true">{MOODS.find(x => x.id === journalEntry.mood)?.emoji}</span>}
          </span>
          <ChevronDown
            className="w-4 h-4 transition-transform"
            style={{ color: 'var(--md-on-surface-variant)', transform: journalOpen ? 'rotate(180deg)' : undefined }}
          />
        </button>

        {journalOpen && (
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center gap-2">
              {MOODS.map(mo => {
                const active = journalMood === mo.id;
                return (
                  <button
                    key={mo.id}
                    onClick={() => saveJournal(journalDraft, active ? undefined : mo.id)}
                    className={`md-chip md-ripple${active ? ' md-chip--selected' : ''}`}
                    aria-pressed={active}
                    aria-label={mo.label}
                    title={mo.label}
                  >
                    <span aria-hidden="true">{mo.emoji}</span>
                    <span className="hidden sm:inline">{mo.label}</span>
                  </button>
                );
              })}
            </div>
            <label className="md-text-field md-text-field--area">
              <textarea
                className="md-text-field__input"
                rows={2}
                value={journalDraft}
                onChange={(e) => saveJournal(e.target.value, journalMood)}
                placeholder="How did today go?"
                maxLength={500}
              />
              <span className={`md-text-field__label${journalDraft ? ' md-text-field__label--active' : ''}`}>
                Reflection
              </span>
            </label>
            {journalDirty && (
              <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                Saving…
              </p>
            )}
          </div>
        )}
      </section>

      {/* Daily victory */}
      {percent === 100 && todayStats.totalTasks > 0 && (
        <section className="md-card md-card--elevated flex flex-col sm:flex-row items-center gap-3" style={{ borderRadius: '1.5rem' }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="md-title-medium">All done for today</h3>
            <p className="md-body-small mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
              All {todayStats.totalTasks} scheduled habits completed. Your {todayStats.currentStreak}-day streak is secured.
            </p>
          </div>
          <button onClick={onOpenShareModal} className="md-button md-button--filled md-ripple w-full sm:w-auto">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </section>
      )}

      {/* Milestone celebration */}
      {newlyEarnedMilestone != null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0" style={{ background: 'var(--md-scrim)' }} onClick={acknowledgeMilestone} />
          <div
            className="relative m-4 w-full max-w-xs rounded-[1.75rem] p-6 text-center space-y-3"
            style={{ background: 'var(--md-surface-container-high)', color: 'var(--md-on-surface)' }}
          >
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center md-bounce-in"
              style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
            >
              <PartyPopper className="w-8 h-8" />
            </div>
            <h2 className="md-headline-small">{newlyEarnedMilestone}-day milestone!</h2>
            <p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
              You've reached a {newlyEarnedMilestone}-day streak. Earned +1 streak freeze to protect it.
            </p>
            <div className="flex items-center justify-center gap-1.5 md-label-medium" style={{ color: 'var(--md-tertiary)' }}>
              <Snowflake className="w-4 h-4" />
              Freeze stock: {streakFreezes}
            </div>
            <button onClick={acknowledgeMilestone} className="md-button md-button--filled md-ripple w-full justify-center">
              <Check className="w-4 h-4" />
              Nice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
