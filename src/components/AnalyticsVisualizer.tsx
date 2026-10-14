import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Flame,
  Award,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { TaskCategory } from '../types';

export const AnalyticsVisualizer: React.FC = () => {
  const { tasks, completions, todayStats, setSelectedDate } = useAuthAndSync();
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<{
    date: string;
    total: number;
    completed: number;
    percentage: number;
  } | null>(null);

  // Generate 35-day activity matrix (last 5 weeks)
  const heatmapData = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();

      const activeTasks = tasks.filter(t => !t.isArchived && t.daysOfWeek.includes(dayOfWeek));
      const total = activeTasks.length;
      const dayCompletions = completions.filter(c => c.date === dateStr);
      const completed = activeTasks.filter(t => dayCompletions.some(c => c.taskId === t.id)).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      days.push({
        date: dateStr,
        dayOfWeek,
        dateObj: d,
        total,
        completed,
        percentage,
      });
    }
    return days;
  }, [tasks, completions]);

  const consistencyScore = useMemo(() => {
    if (heatmapData.length === 0) return 0;
    const daysWithRoutines = heatmapData.filter(d => d.total > 0);
    if (daysWithRoutines.length === 0) return 0;
    const avgPercentage = daysWithRoutines.reduce((acc, d) => acc + d.percentage, 0) / daysWithRoutines.length;
    return Math.round(avgPercentage);
  }, [heatmapData]);

  const categoryStats = useMemo(() => {
    const categories: TaskCategory[] = ['health', 'productivity', 'mindfulness', 'fitness', 'learning', 'creativity'];
    return categories.map(cat => {
      const catTasks = tasks.filter(t => t.category === cat && !t.isArchived);
      const catCompletions = completions.filter(c => {
        const t = tasks.find(tsk => tsk.id === c.taskId);
        return t && t.category === cat;
      });
      return {
        category: cat,
        totalTasks: catTasks.length,
        completionsCount: catCompletions.length,
      };
    });
  }, [tasks, completions]);

  const weeklyTrends = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return [1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
      const dayOccurrences = heatmapData.filter(d => d.dayOfWeek === dayIdx && d.total > 0);
      const avg =
        dayOccurrences.length > 0
          ? Math.round(dayOccurrences.reduce((acc, cur) => acc + cur.percentage, 0) / dayOccurrences.length)
          : 0;
      return {
        day: dayNames[dayIdx],
        percentage: avg,
      };
    });
  }, [heatmapData]);

  // Monochromatic Glass Intensity Scale
  const getMonochromeHeatmapColor = (pct: number, total: number) => {
    if (total === 0) return 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 opacity-40';
    if (pct === 0) return 'bg-black/10 dark:bg-white/10 border-black/10 dark:border-white/10';
    if (pct < 35) return 'bg-black/30 dark:bg-white/30 border-black/30 dark:border-white/30 text-white dark:text-black';
    if (pct < 70) return 'bg-black/60 dark:bg-white/60 border-black/60 dark:border-white/60 text-white dark:text-black';
    if (pct < 100) return 'bg-black/85 dark:bg-white/85 border-black/80 dark:border-white/80 text-white dark:text-black';
    return 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black ring-2 ring-black/20 dark:ring-white/30 font-black';
  };

  const columnHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-4 sm:space-y-8 w-full max-w-full">

      {/* Top Banner */}
      <div className="glass-surface p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/15 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-black dark:text-white" />
            <h2 className="text-lg sm:text-2xl font-black text-black dark:text-white">
              Habit Analytics & Heatmaps
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time visualization of your habit consistency, adherence patterns, and streaks.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl glass-button text-xs font-mono font-bold text-black dark:text-white self-start sm:self-auto shrink-0">
          <span>Adherence Score: {consistencyScore}%</span>
        </div>
      </div>

      {/* 4 Metric Cards - Mobile 2-col, Desktop 4-col */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full">
        
        {/* Current Streak */}
        <div className="glass-card p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">Streak</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg glass-button flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 fill-black dark:fill-white text-black dark:text-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-3xl font-mono font-black text-black dark:text-white">
              {todayStats.currentStreak}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-zinc-500">days</span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-mono text-zinc-500 dark:text-zinc-400">Current active</p>
        </div>

        {/* Longest Streak */}
        <div className="glass-card p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">Best Streak</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg glass-button flex items-center justify-center">
              <Award className="w-3.5 h-3.5 text-black dark:text-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-3xl font-mono font-black text-black dark:text-white">
              {todayStats.bestStreak}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-zinc-500">days</span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-mono text-zinc-500 dark:text-zinc-400">Personal record</p>
        </div>

        {/* Total Habits Completed */}
        <div className="glass-card p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">Completions</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg glass-button flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-3xl font-mono font-black text-black dark:text-white">
              {completions.length}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-zinc-500">logs</span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-mono text-zinc-500 dark:text-zinc-400">Total checked off</p>
        </div>

        {/* Active Habits */}
        <div className="glass-card p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">Configured</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg glass-button flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-black dark:text-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-3xl font-mono font-black text-black dark:text-white">
              {tasks.filter(t => !t.isArchived).length}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-zinc-500">habits</span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-mono text-zinc-500 dark:text-zinc-400">Active protocol</p>
        </div>

      </div>

      {/* 35-Day Monochrome Heatmap Matrix - Mobile Responsive */}
      <div className="glass-card p-3 sm:p-7 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 space-y-3 sm:space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-black dark:text-white">
              35-Day Consistency Matrix
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Tap any tile to inspect completions or jump to that day in your schedule.
            </p>
          </div>

          {/* Monochrome Legend */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
            <span>0%</span>
            <div className="w-3 h-3 rounded bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10" />
            <div className="w-3 h-3 rounded bg-black/30 dark:bg-white/30" />
            <div className="w-3 h-3 rounded bg-black/60 dark:bg-white/60" />
            <div className="w-3 h-3 rounded bg-black dark:bg-white" />
            <span>100%</span>
          </div>
        </div>

        {/* Weekday Column Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] font-mono font-bold text-zinc-400 pt-1">
          {columnHeaders.map((h, idx) => (
            <span key={idx}>{h}</span>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {heatmapData.map((dItem) => (
            <button
              key={dItem.date}
              onClick={() => {
                setSelectedHeatmapDay(dItem);
                setSelectedDate(dItem.date);
              }}
              className={`aspect-square min-w-0 rounded-lg sm:rounded-xl border flex flex-col items-center justify-center p-0.5 sm:p-1 transition-all active:scale-95 ${getMonochromeHeatmapColor(
                dItem.percentage,
                dItem.total
              )}`}
              title={`${dItem.date}: ${dItem.completed}/${dItem.total} completed (${dItem.percentage}%)`}
              aria-label={`${dItem.date} ${dItem.percentage}% completed`}
            >
              <span className="text-[9px] sm:text-[10px] font-mono font-bold leading-none">
                {dItem.dateObj.getDate()}
              </span>
              <span className="text-[7px] sm:text-[8px] font-mono opacity-80 leading-none mt-0.5">
                {dItem.percentage}%
              </span>
            </button>
          ))}
        </div>

        {/* Tooltip Card */}
        {selectedHeatmapDay && (
          <div className="mt-2 p-2.5 sm:p-3 rounded-xl glass-button flex items-center justify-between text-xs font-mono animate-in fade-in">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
              <span className="font-bold text-black dark:text-white truncate">
                {selectedHeatmapDay.date}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 truncate">
                · {selectedHeatmapDay.completed}/{selectedHeatmapDay.total} ({selectedHeatmapDay.percentage}%)
              </span>
            </div>
            <span className="font-bold text-black dark:text-white shrink-0 ml-1">
              Loaded
            </span>
          </div>
        )}
      </div>

      {/* Weekly Trends & Category Breakdown - Stacked on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 w-full">

        {/* Weekly Adherence Bars */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 space-y-3 sm:space-y-4 w-full">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white">
              Weekly Day Adherence
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Average routine completion percentage by day of week.
            </p>
          </div>

          <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-36 sm:h-40 pt-4 pb-2 border-b border-black/5 dark:border-white/5">
            {weeklyTrends.map((w) => (
              <div key={w.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end min-w-0">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                  {w.percentage}%
                </span>
                <div className="w-full max-w-[28px] bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden h-24 sm:h-28 flex items-end">
                  <div
                    className="w-full bg-black dark:bg-white rounded-lg transition-all duration-500"
                    style={{ height: `${Math.max(w.percentage, 4)}%` }}
                  />
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {w.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 space-y-3 sm:space-y-4 w-full">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white">
              Habits by Domain
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Habit density across key life categories.
            </p>
          </div>

          <div className="space-y-2.5 sm:space-y-3 pt-1">
            {categoryStats.map(cat => {
              const totalAllTasks = tasks.length || 1;
              const ratio = Math.round((cat.totalTasks / totalAllTasks) * 100);

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-black dark:text-white capitalize">
                      {cat.category}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-[10px] sm:text-[11px]">
                      {cat.totalTasks} habit{cat.totalTasks !== 1 ? 's' : ''} ({cat.completionsCount} logs)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-black dark:bg-white rounded-full transition-all duration-500"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
