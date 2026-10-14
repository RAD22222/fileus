import React, { useState } from 'react';
import {
  Check,
  Clock,
  Plus,
  Flame,
  Sun,
  Zap,
  Moon,
  Compass,
  Edit2,
  Trash2,
  Share2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { RoutineTask, TaskCategory, TimeOfDay } from '../types';

interface TodayScheduleProps {
  onOpenAddTaskModal: (routineId?: string) => void;
  onOpenEditTaskModal: (task: RoutineTask) => void;
  onOpenShareModal: () => void;
}

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
  } = useAuthAndSync();

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
          colors: ['#ffffff', '#000000', '#71717a', '#d4d4d8', '#a1a1aa'],
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">

      {/* Progress Dashboard Banner - Mobile-First Glassmorphic Black & White */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl glass-surface p-3.5 sm:p-7 border border-black/10 dark:border-white/15 shadow-lg w-full">
        {/* Ambient specular light reflection */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-black/5 dark:bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-black/5 dark:bg-white/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-5">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
              <span className="font-bold uppercase tracking-wider text-black dark:text-white">
                {targetDateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span>·</span>
              <span>{todayStats.completedCount} of {todayStats.totalTasks} Done</span>
              <span>·</span>
              <span className="flex items-center gap-1 font-bold text-black dark:text-white">
                <Flame className="w-3.5 h-3.5 fill-black dark:fill-white text-black dark:text-white" />
                {todayStats.currentStreak}d Streak
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-black dark:text-white">
              {todayStats.completionPercentage === 100 && todayStats.totalTasks > 0
                ? 'Daily routines fully completed'
                : todayStats.completionPercentage >= 50
                ? 'Over halfway through today’s protocol'
                : 'Execute your daily protocol'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
              Consistency compounds exponentially. Small disciplined habits repeated daily form unstoppable momentum.
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t border-black/5 dark:border-white/5 sm:border-0">
            {/* Glass Circular Gauge */}
            <div className="flex items-center gap-2.5 sm:gap-3 glass-button px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    className="text-black/10 dark:text-white/10 sm:hidden"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    className="text-black dark:text-white transition-all duration-700 ease-out sm:hidden"
                    strokeWidth="3.5"
                    strokeDasharray={100.5}
                    strokeDashoffset={100.5 - (100.5 * todayStats.completionPercentage) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    className="text-black/10 dark:text-white/10 hidden sm:block"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    className="text-black dark:text-white transition-all duration-700 ease-out hidden sm:block"
                    strokeWidth="3.5"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 - (125.6 * todayStats.completionPercentage) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute font-mono font-black text-[11px] sm:text-xs text-black dark:text-white">
                  {todayStats.completionPercentage}%
                </span>
              </div>
              <div className="text-left">
                <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Score</div>
                <div className="text-sm sm:text-base font-mono font-extrabold text-black dark:text-white">
                  {todayStats.completedCount}/{todayStats.totalTasks}
                </div>
              </div>
            </div>

            {/* Quick Share Milestone */}
            <button
              onClick={onOpenShareModal}
              className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm active:scale-95"
              title="Share progress"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Minimal High-Contrast Progress Bar */}
        <div className="relative z-10 mt-3 sm:mt-4 w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-black dark:bg-white rounded-full transition-all duration-500"
            style={{ width: `${todayStats.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Filter and Action Bar - Smooth Mobile Scrolling & Responsive Wrap */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-2 sm:p-3 rounded-2xl glass-surface border border-black/10 dark:border-white/10 w-full">
        
        {/* Time Segments - Smooth touch scrolling */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <button
            onClick={() => setTimeFilter('all')}
            className={`min-h-[38px] px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all shrink-0 ${
              timeFilter === 'all'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            All ({dayTasks.length})
          </button>
          <button
            onClick={() => setTimeFilter('morning')}
            className={`min-h-[38px] flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all shrink-0 ${
              timeFilter === 'morning'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Morning</span>
          </button>
          <button
            onClick={() => setTimeFilter('afternoon')}
            className={`min-h-[38px] flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all shrink-0 ${
              timeFilter === 'afternoon'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Afternoon</span>
          </button>
          <button
            onClick={() => setTimeFilter('evening')}
            className={`min-h-[38px] flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all shrink-0 ${
              timeFilter === 'evening'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Evening</span>
          </button>
        </div>

        {/* Action Controls - Mobile Responsive Flex */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | TaskCategory)}
            className="flex-1 sm:flex-initial min-h-[38px] px-2.5 sm:px-3 py-1.5 text-xs font-mono rounded-xl bg-black/5 dark:bg-white/5 text-black dark:text-white border border-black/10 dark:border-white/10 focus:outline-none"
          >
            <option value="all">All Domains</option>
            <option value="health">Health</option>
            <option value="productivity">Productivity</option>
            <option value="mindfulness">Mindfulness</option>
            <option value="fitness">Fitness</option>
            <option value="learning">Learning</option>
            <option value="creativity">Creativity</option>
          </select>

          <button
            onClick={() => onOpenAddTaskModal()}
            className="min-h-[38px] flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-mono font-bold shadow-xs transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Habit</span>
          </button>
        </div>
      </div>

      {/* Routine Task Items List - Mobile Touch Friendly */}
      {sortedDayTasks.length === 0 ? (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-dashed border-black/15 dark:border-white/15 space-y-4">
          <div className="w-12 h-12 rounded-2xl glass-button flex items-center justify-center mx-auto text-black dark:text-white">
            <Compass className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-black dark:text-white">
              No habits scheduled for this filter
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Add a new routine step or reset filters to display your scheduled habits.
            </p>
          </div>
          <button
            onClick={() => onOpenAddTaskModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Habit</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3 w-full">
          {sortedDayTasks.map(task => {
            const isCompleted = completedTaskIds.has(task.id);
            const parentRoutine = routines.find(r => r.id === task.routineId);

            return (
              <div
                key={task.id}
                className={`group relative flex items-center gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-2xl transition-all duration-200 min-h-[58px] w-full ${
                  isCompleted
                    ? 'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 opacity-60'
                    : 'glass-card hover:border-black/25 dark:hover:border-white/30'
                }`}
              >
                {/* 44x44px touch target for checkbox */}
                <button
                  onClick={() => handleToggle(task.id)}
                  className="min-h-[44px] min-w-[40px] sm:min-w-[44px] -ml-1 flex items-center justify-center shrink-0"
                  aria-label={isCompleted ? `Mark ${task.title} incomplete` : `Mark ${task.title} completed`}
                >
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                        : 'border-2 border-zinc-400 dark:border-zinc-600 hover:border-black dark:hover:border-white text-transparent'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 stroke-[3] transition-transform ${isCompleted ? 'scale-100' : 'scale-75'}`} />
                  </div>
                </button>

                {/* Scheduled Time */}
                <div className="flex flex-col items-center justify-center min-w-[38px] sm:min-w-[46px] shrink-0 font-mono text-center">
                  <span className="text-[11px] sm:text-xs font-bold text-black dark:text-white">
                    {task.scheduledTime || '--:--'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400">
                    {task.durationMinutes}m
                  </span>
                </div>

                {/* Main Task Title & Unboxed Metadata */}
                <div className="flex-1 min-w-0 pr-1">
                  <span
                    className={`text-xs sm:text-base font-semibold block line-clamp-2 break-words transition-all ${
                      isCompleted
                        ? 'line-through text-zinc-400 dark:text-zinc-500'
                        : 'text-black dark:text-white'
                    }`}
                  >
                    {task.title}
                  </span>

                  {/* Clean unboxed text metadata */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {parentRoutine && (
                      <>
                        <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[90px] sm:max-w-[140px]">
                          {parentRoutine.title}
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="capitalize">{task.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase font-mono text-[9px] sm:text-[10px]">{task.priority}</span>
                  </div>
                </div>

                {/* Quick Action Touch Targets - Visible on touch screens without requiring hover */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-80 sm:opacity-70 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onOpenEditTaskModal(task)}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    title="Edit habit"
                    aria-label="Edit habit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    title="Delete habit"
                    aria-label="Delete habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily Milestone Card */}
      {todayStats.completionPercentage === 100 && todayStats.totalTasks > 0 && (
        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-black/20 dark:border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-black dark:text-white">
                Daily Victory Achieved
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                All {todayStats.totalTasks} scheduled habits completed. Your {todayStats.currentStreak}-day streak is secured.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenShareModal}
            className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Achievement</span>
          </button>
        </div>
      )}

    </div>
  );
};
