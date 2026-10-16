import React, { useMemo, useState } from 'react';
import {
  Flame,
  Award,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Snowflake,
  Sun,
  Zap,
  Moon,
  Compass,
  Lightbulb,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { TaskCategory, TimeOfDay, MILESTONES } from '../types';
import { localDateStr } from '../lib/date';

type Period = 'week' | 'month';

const GROUP_META: Record<TimeOfDay, { label: string; icon: React.ReactNode }> = {
  morning: { label: 'Morning', icon: <Sun className="w-4 h-4" /> },
  afternoon: { label: 'Afternoon', icon: <Zap className="w-4 h-4" /> },
  evening: { label: 'Evening', icon: <Moon className="w-4 h-4" /> },
  anytime: { label: 'Anytime', icon: <Compass className="w-4 h-4" /> },
};

export const AnalyticsVisualizer: React.FC = () => {
  const { tasks, routines, completions, todayStats, setSelectedDate, streakFreezes, achievedMilestones, journal } = useAppData();
  const [selectedDay, setSelectedDay] = useState<{ date: string; total: number; completed: number; percentage: number } | null>(null);
  const [period, setPeriod] = useState<Period>('week');

  const DAY_MS = 24 * 3600 * 1000;
  const dateStr = (d: Date) => localDateStr(d);

  // ---- Per-day stats over the last 365 days, broken down by time-of-day group ----
  const days = useMemo(() => {
    const groupOf = (taskId: string): TimeOfDay =>
      routines.find(r => r.id === tasks.find(t => t.id === taskId)?.routineId)?.timeOfDay || 'anytime';

    const out: {
      date: string; dateObj: Date; dayOfWeek: number;
      total: number; completed: number; percentage: number;
      groups: Record<TimeOfDay, { total: number; completed: number }>;
    }[] = [];

    for (let i = 364; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY_MS);
      const ds = dateStr(d);
      const dayOfWeek = d.getDay();

      const activeTasks = tasks.filter(t => !t.isArchived && t.daysOfWeek.includes(dayOfWeek));
      const dayCompletions = completions.filter(c => c.date === ds);
      const isDone = (t: (typeof activeTasks)[number]) => {
        const c = dayCompletions.find(cc => cc.taskId === t.id);
        if (!c) return false;
        if (t.habitType === 'count') return (c.value ?? t.targetCount ?? 1) >= (t.targetCount ?? 1);
        if (t.habitType === 'timer') return (c.value ?? 0) >= Math.max(1, t.durationMinutes);
        return true;
      };

      const groups: Record<TimeOfDay, { total: number; completed: number }> = {
        morning: { total: 0, completed: 0 },
        afternoon: { total: 0, completed: 0 },
        evening: { total: 0, completed: 0 },
        anytime: { total: 0, completed: 0 },
      };
      activeTasks.forEach(t => {
        const g = t.routineId && routines.find(r => r.id === t.routineId)?.timeOfDay || 'anytime';
        groups[g].total++;
        if (isDone(t)) groups[g].completed++;
      });

      const completed = activeTasks.filter(isDone).length;
      const total = activeTasks.length;
      out.push({
        date: ds,
        dateObj: d,
        dayOfWeek,
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        groups,
      });
    }
    void groupOf;
    return out;
  }, [tasks, completions, routines]);

  const consistencyScore = useMemo(() => {
    const withRoutines = days.filter(d => d.total > 0);
    if (withRoutines.length === 0) return 0;
    return Math.round(withRoutines.reduce((acc, d) => acc + d.percentage, 0) / withRoutines.length);
  }, [days]);

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
      const dayOccurrences = days.filter(d => d.dayOfWeek === dayIdx && d.total > 0);
      const avg =
        dayOccurrences.length > 0
          ? Math.round(dayOccurrences.reduce((acc, cur) => acc + cur.percentage, 0) / dayOccurrences.length)
          : 0;
      return { day: dayNames[dayIdx], percentage: avg };
    });
  }, [days]);

  // ---- Weekly / monthly report ----
  const report = useMemo(() => {
    const len = period === 'week' ? 7 : 30;
    const slice = days.slice(-len);
    const withTasks = slice.filter(d => d.total > 0);
    const scheduled = withTasks.reduce((a, d) => a + d.total, 0);
    const done = withTasks.reduce((a, d) => a + d.completed, 0);
    const pct = scheduled > 0 ? Math.round((done / scheduled) * 100) : 0;
    const best = [...withTasks].sort((a, b) => b.percentage - a.percentage)[0];
    const worst = [...withTasks].sort((a, b) => a.percentage - b.percentage)[0];
    return {
      len,
      activeDays: withTasks.length,
      scheduled,
      done,
      pct,
      best: best && best.percentage > 0 ? best : null,
      worst: worst && worst.percentage < 100 ? worst : null,
      perfectDays: slice.filter(d => d.total > 0 && d.completed === d.total).length,
    };
  }, [days, period]);

  // ---- "Best time of day" insight ----
  const timeInsight = useMemo(() => {
    const window = days.slice(-90).filter(d => d.total > 0);
    const order: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'anytime'];
    const stats = order
      .map(g => {
        const rows = window.filter(d => d.groups[g].total > 0);
        const total = rows.reduce((a, d) => a + d.groups[g].total, 0);
        const done = rows.reduce((a, d) => a + d.groups[g].completed, 0);
        return { group: g, total, done, pct: total > 0 ? Math.round((done / total) * 100) : null, days: rows.length };
      })
      .filter(s => s.pct !== null);
    const sorted = [...stats].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    let takeaway = '';
    if (best && worst && best.group !== worst.group && (best.pct ?? 0) - (worst.pct ?? 0) >= 15) {
      takeaway = `You're strongest in the ${best.group} (${best.pct}%). The ${worst.group} block trails at ${worst.pct}% — consider moving one habit you care about into your ${best.group} stack.`;
    } else {
      takeaway = 'Your adherence is balanced across the day. Nice work!';
    }
    return { stats: sorted, best, worst, takeaway };
  }, [days]);

  // ---- GitHub-style year heatmap ----
  const heatmap = useMemo(() => {
    // 53 columns of weeks; each column groups 7 days stacked Sun..Sat
    const cells = days.map(d => d);
    const columns: (typeof days)[] = [];
    for (let i = 0; i < cells.length; i += 7) columns.push(cells.slice(i, i + 7));
    return columns;
  }, [days]);

  const monthLabels = useMemo(() => {
    return heatmap.map((col, idx) => {
      const first = col[0];
      const prev = idx > 0 ? heatmap[idx - 1][0] : null;
      const monthName = first.dateObj.toLocaleDateString(undefined, { month: 'short' });
      return !prev || prev.dateObj.getMonth() !== first.dateObj.getMonth()
        ? monthName
        : '';
    });
  }, [heatmap]);

  const getHeatStyle = (pct: number, total: number): React.CSSProperties => {
    if (total === 0) return { background: 'var(--md-surface-container-highest)', opacity: 0.45 };
    if (pct === 0) return { background: 'var(--md-surface-container-highest)' };
    if (pct < 35) return { background: 'color-mix(in srgb, var(--md-primary) 25%, var(--md-surface))' };
    if (pct < 70) return { background: 'color-mix(in srgb, var(--md-primary) 50%, var(--md-surface))' };
    if (pct < 100) return { background: 'color-mix(in srgb, var(--md-primary) 75%, var(--md-surface))' };
    return { background: 'var(--md-primary)' };
  };

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
      key: 'freeze',
      label: 'Freezes',
      value: streakFreezes,
      unit: 'stocked',
      hint: 'Protect a streak',
      icon: <Snowflake className="w-4 h-4" style={{ color: 'var(--md-tertiary)' }} />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header — flat on the surface */}
      <section className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <h2 className="md-headline-small truncate">Analytics</h2>
          <p className="md-body-medium mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
            Consistency, habits, and streaks
          </p>
        </div>
        <span className="md-chip md-chip--assist shrink-0">
          <span>Adherence {consistencyScore}%</span>
        </span>
      </section>

      {/* Milestones */}
      <section className="md-card md-card--outlined space-y-3" aria-label="Milestones">
        <div>
          <h3 className="md-title-medium">Milestones</h3>
          <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
            Streak badges — each one earns a streak freeze
          </p>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-1">
          {MILESTONES.map(ms => {
            const earned = achievedMilestones.includes(ms);
            return (
              <div
                key={ms}
                className="flex flex-col items-center gap-1 shrink-0"
                title={earned ? `${ms}-day streak earned` : `${ms}-day streak locked`}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center md-label-large"
                  style={
                    earned
                      ? { background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)', border: '2px solid var(--md-primary)' }
                      : { background: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)', border: '1px dashed var(--md-outline-variant)', opacity: 0.6 }
                  }
                >
                  <Flame className="w-4 h-4" strokeWidth={2.4} />
                </div>
                <span className="md-label-small font-mono" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {ms}d
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(mx => (
          <div key={mx.key} className="md-card md-card--filled space-y-1">
            <div className="flex items-center justify-between">
              <span className="md-label-large" style={{ color: 'var(--md-on-surface-variant)' }}>
                {mx.label}
              </span>
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--md-surface-container-lowest)' }}
              >
                {mx.icon}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="md-headline-medium">{mx.value}</span>
              <span className="md-label-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                {mx.unit}
              </span>
            </div>
            <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              {mx.hint}
            </p>
          </div>
        ))}
      </div>

      {/* Weekly / monthly report */}
      <section className="md-card md-card--outlined space-y-3" aria-label="Reports">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <h3 className="md-title-medium">{period === 'week' ? 'Weekly report' : 'Monthly report'}</h3>
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              Your last {report.len} days at a glance
            </p>
          </div>
          <div className="md-segmented">
            {(['week', 'month'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`md-segmented__item md-ripple${period === p ? ' md-segmented__item--selected' : ''}`}
                aria-pressed={period === p}
              >
                {p === 'week' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="md-headline-medium font-mono" style={{ color: report.pct >= 70 ? 'var(--md-primary)' : 'var(--md-on-surface)' }}>
                {report.pct}%
              </span>
            </div>
            <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>Overall adherence</p>
          </div>
          <div className="space-y-1">
            <div className="md-headline-medium">{report.perfectDays}</div>
            <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>Perfect days</p>
          </div>
          <div className="space-y-1">
            <div className="md-title-medium">{report.done}/{report.scheduled}</div>
            <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>Habits completed</p>
          </div>
          <div className="space-y-1">
            <div className="md-title-medium">{journal.length}</div>
            <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>Journal entries</p>
          </div>
        </div>

        {(report.best || report.worst) && (
          <div
            className="flex items-start gap-2 p-3 rounded-xl md-body-small flex-wrap"
            style={{ background: 'var(--md-surface-container-high)' }}
          >
            {report.best && report.best.percentage > 0 && (
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 shrink-0" style={{ color: 'var(--md-primary)' }} />
                Best: <span className="font-mono">{report.best.date}</span> at {report.best.percentage}%
              </span>
            )}
            {report.worst && (
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 shrink-0" style={{ color: 'var(--md-tertiary)' }} />
                Lightest: <span className="font-mono">{report.worst.date}</span> at {report.worst.percentage}%
              </span>
            )}
          </div>
        )}
      </section>

      {/* Best time of day insight */}
      <section className="md-card md-card--outlined space-y-3" aria-label="Best time of day">
        <div>
          <h3 className="md-title-medium flex items-center gap-2">
            <Sun className="w-5 h-5" style={{ color: 'var(--md-primary)' }} />
            Best time of day
          </h3>
          <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
            Adherence by daily block, last 90 days
          </p>
        </div>

        <div className="space-y-2.5">
          {timeInsight.stats.map(s => (
            <div key={s.group} className="flex items-center gap-3">
              <span className="w-28 flex items-center gap-1.5 md-body-medium shrink-0">
                {GROUP_META[s.group].icon}
                <span className="truncate capitalize">{s.group}</span>
              </span>
              <div className="md-progress-linear flex-1">
                <div className="md-progress-linear__bar" style={{ width: `${s.pct}%` }} />
              </div>
              <span className="font-mono md-label-large w-11 text-right">{s.pct}%</span>
            </div>
          ))}
        </div>
        <p
          className="md-body-medium p-3 rounded-xl"
          style={{ background: 'var(--md-surface-container-high)', color: 'var(--md-on-surface-variant)' }}
        >
          <Lightbulb className="w-4 h-4 inline-block mr-1 -mt-0.5" style={{ color: 'var(--md-tertiary)' }} />
          {timeInsight.takeaway}
        </p>
      </section>

      {/* Year heatmap — GitHub-style */}
      <section className="md-card md-card--outlined space-y-3" aria-label="Year heatmap">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="md-title-medium">Year of consistency</h3>
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              Last 365 days — tap a square to load that day
            </p>
          </div>
          <div className="flex items-center gap-1.5 md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>
            <span>Less</span>
            <span className="w-3 h-3 rounded" style={{ background: 'var(--md-surface-container-highest)' }} />
            <span className="w-3 h-3 rounded" style={{ background: 'color-mix(in srgb, var(--md-primary) 25%, var(--md-surface))' }} />
            <span className="w-3 h-3 rounded" style={{ background: 'color-mix(in srgb, var(--md-primary) 50%, var(--md-surface))' }} />
            <span className="w-3 h-3 rounded" style={{ background: 'color-mix(in srgb, var(--md-primary) 75%, var(--md-surface))' }} />
            <span className="w-3 h-3 rounded" style={{ background: 'var(--md-primary)' }} />
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-none -mx-2 px-2" style={{ maxHeight: '11rem' }}>
          <div className="inline-flex flex-col gap-1" style={{ minWidth: 'min-content' }}>
            {/* month labels */}
            <div className="flex gap-[3px] md-label-small" style={{ color: 'var(--md-on-surface-variant)', height: '1rem' }}>
              {monthLabels.map((lbl, i) => (
                <span key={i} className="relative shrink-0" style={{ width: '0.75rem' }}>
                  {lbl && (
                    <span className="absolute left-0 top-0 whitespace-nowrap">{lbl}</span>
                  )}
                </span>
              ))}
            </div>
            {/* week columns */}
            <div className="flex gap-[3px]">
              {heatmap.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[3px]">
                  {col.map(cell => (
                    <button
                      key={cell.date}
                      onClick={() => {
                        setSelectedDay({ date: cell.date, total: cell.total, completed: cell.completed, percentage: cell.percentage });
                        setSelectedDate(cell.date);
                      }}
                      className="w-3 h-3 rounded-[3px] transition-transform hover:scale-125 active:scale-110"
                      style={getHeatStyle(cell.percentage, cell.total)}
                      title={`${cell.date}: ${cell.completed}/${cell.total} (${cell.percentage}%)`}
                      aria-label={`${cell.date} ${cell.percentage}% completed`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedDay && (
          <div
            className="flex items-center justify-between gap-2 p-3 rounded-xl md-body-medium"
            style={{ background: 'var(--md-surface-container-highest)' }}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Calendar className="w-4 h-4 shrink-0" style={{ color: 'var(--md-primary)' }} />
              <span className="font-mono font-medium truncate">{selectedDay.date}</span>
              <span className="truncate" style={{ color: 'var(--md-on-surface-variant)' }}>
                · {selectedDay.completed}/{selectedDay.total} ({selectedDay.percentage}%)
              </span>
            </span>
            <span className="md-label-large shrink-0" style={{ color: 'var(--md-primary)' }}>
              Loaded
            </span>
          </div>
        )}
      </section>

      {/* Weekly trend + domain cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <section className="md-card md-card--outlined space-y-3">
          <div>
            <h3 className="md-title-medium">Adherence by weekday</h3>
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              Average completion, last year
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
