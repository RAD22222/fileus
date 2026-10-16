import React, { useMemo, useState } from 'react';
import {
  Flame,
  Award,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { TaskCategory } from '../types';

export const AnalyticsVisualizer: React.FC = () => {
  const { tasks, completions, todayStats, setSelectedDate } = useAppData();
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

  // MD3 tonal heatmap scale based on the primary color
  const getHeatmapStyle = (pct: number, total: number): React.CSSProperties => {
    if (total === 0) {
      return { background: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)', opacity: 0.5 };
    }
    if (pct === 0) {
      return { background: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' };
    }
    if (pct < 35) {
      return { background: 'color-mix(in srgb, var(--md-primary) 25%, var(--md-surface))', color: 'var(--md-on-surface)' };
    }
    if (pct < 70) {
      return { background: 'color-mix(in srgb, var(--md-primary) 50%, var(--md-surface))', color: 'var(--md-on-surface)' };
    }
    if (pct < 100) {
      return { background: 'color-mix(in srgb, var(--md-primary) 75%, var(--md-surface))', color: 'var(--md-on-primary)' };
    }
    return { background: 'var(--md-primary)', color: 'var(--md-on-primary)', fontWeight: 700 };
  };

  const columnHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const metrics: { key: string; label: string; value: string | number; unit: string; hint: string; icon: React.ReactNode }[] = [
    {
      key: 'streak',
      label: 'Streak',
      value: todayStats.currentStreak,
      unit: 'days',
      hint: 'Current active',
      icon: <Flame className="w-4 h-4" strokeWidth={2.5} style={{ color: 'var(--md-primary)' }} />,
    },
    {
      key: 'best',
      label: 'Best streak',
      value: todayStats.bestStreak,
      unit: 'days',
      hint: 'Personal record',
      icon: <Award className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />,
    },
    {
      key: 'logs',
      label: 'Completions',
      value: completions.length,
      unit: 'logs',
      hint: 'Total checked off',
      icon: <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />,
    },
    {
      key: 'active',
      label: 'Configured',
      value: tasks.filter(t => !t.isArchived).length,
      unit: 'habits',
      hint: 'Active protocol',
      icon: <TrendingUp className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header — flat on the surface */}
      <section className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <h2 className="md-headline-small truncate">Analytics</h2>
          <p className="md-body-medium mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
            Consistency, adherence, and streaks
          </p>
        </div>
        <span className="md-chip md-chip--assist shrink-0">
          <span className="font-mono">Adherence {consistencyScore}%</span>
        </span>
      </section>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.key} className="md-card md-card--filled space-y-1">
            <div className="flex items-center justify-between">
              <span className="md-label-large" style={{ color: 'var(--md-on-surface-variant)' }}>
                {m.label}
              </span>
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--md-surface-container-lowest)' }}
              >
                {m.icon}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="md-headline-medium font-mono">{m.value}</span>
              <span className="md-label-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                {m.unit}
              </span>
            </div>
            <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              {m.hint}
            </p>
          </div>
        ))}
      </div>

      {/* 35-day heatmap */}
      <section className="md-card md-card--outlined space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="md-title-medium">35-day consistency matrix</h3>
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              Tap a day to load it in your schedule
            </p>
          </div>
          <div className="flex items-center gap-1.5 md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>
            <span>0%</span>
            <span className="w-3.5 h-3.5 rounded" style={{ background: 'var(--md-surface-container-highest)' }} />
            <span className="w-3.5 h-3.5 rounded" style={{ background: 'color-mix(in srgb, var(--md-primary) 25%, var(--md-surface))' }} />
            <span className="w-3.5 h-3.5 rounded" style={{ background: 'color-mix(in srgb, var(--md-primary) 50%, var(--md-surface))' }} />
            <span className="w-3.5 h-3.5 rounded" style={{ background: 'color-mix(in srgb, var(--md-primary) 75%, var(--md-surface))' }} />
            <span className="w-3.5 h-3.5 rounded" style={{ background: 'var(--md-primary)' }} />
            <span>100%</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>
          {columnHeaders.map((h, idx) => (
            <span key={idx}>{h}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {heatmapData.map((dItem) => (
            <button
              key={dItem.date}
              onClick={() => {
                setSelectedHeatmapDay(dItem);
                setSelectedDate(dItem.date);
              }}
              className="aspect-square min-w-0 rounded-lg flex flex-col items-center justify-center transition-transform active:scale-90 md-ripple"
              style={getHeatmapStyle(dItem.percentage, dItem.total)}
              title={`${dItem.date}: ${dItem.completed}/${dItem.total} completed (${dItem.percentage}%)`}
              aria-label={`${dItem.date} ${dItem.percentage}% completed`}
            >
              <span className="md-label-small font-mono leading-none">{dItem.dateObj.getDate()}</span>
              <span className="md-label-small leading-none mt-0.5" style={{ opacity: 0.75 }}>
                {dItem.percentage}%
              </span>
            </button>
          ))}
        </div>

        {selectedHeatmapDay && (
          <div
            className="flex items-center justify-between gap-2 p-3 rounded-xl md-body-medium"
            style={{ background: 'var(--md-surface-container-highest)' }}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Calendar className="w-4 h-4 shrink-0" style={{ color: 'var(--md-primary)' }} />
              <span className="font-mono font-medium truncate">{selectedHeatmapDay.date}</span>
              <span className="truncate" style={{ color: 'var(--md-on-surface-variant)' }}>
                · {selectedHeatmapDay.completed}/{selectedHeatmapDay.total} ({selectedHeatmapDay.percentage}%)
              </span>
            </span>
            <span className="md-label-large shrink-0" style={{ color: 'var(--md-primary)' }}>
              Loaded
            </span>
          </div>
        )}
      </section>

      {/* Weekly + category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <section className="md-card md-card--outlined space-y-3">
          <div>
            <h3 className="md-title-medium">Weekly adherence</h3>
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              Average completion by day of week
            </p>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-40 pb-2">
            {weeklyTrends.map((w) => (
              <div key={w.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end min-w-0">
                <span className="md-label-small font-mono" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {w.percentage}%
                </span>
                <div className="w-full max-w-7 flex-1 flex items-end rounded-lg" style={{ background: 'var(--md-surface-container-highest)' }}>
                  <div
                    className="w-full rounded-lg transition-all duration-500"
                    style={{
                      height: `${Math.max(w.percentage, 4)}%`,
                      background: 'var(--md-primary)',
                    }}
                  />
                </div>
                <span className="md-label-small font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {w.day}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="md-card md-card--outlined space-y-3">
          <div>
            <h3 className="md-title-medium">Habits by domain</h3>
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              Where your discipline is distributed
            </p>
          </div>
          <div className="space-y-2.5">
            {categoryStats.map(cat => {
              const totalAllTasks = tasks.length || 1;
              const ratio = Math.round((cat.totalTasks / totalAllTasks) * 100);

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between md-body-medium">
                    <span className="font-medium capitalize">{cat.category}</span>
                    <span className="md-label-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {cat.totalTasks} habit{cat.totalTasks !== 1 ? 's' : ''} · {cat.completionsCount} logs
                    </span>
                  </div>
                  <div className="md-progress-linear">
                    <div className="md-progress-linear__bar" style={{ width: `${ratio}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
