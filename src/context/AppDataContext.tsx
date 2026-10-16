import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Routine,
  RoutineTask,
  TaskCompletion,
  CommunityPost,
  Cheer,
  RoutineTemplate,
  DayJournalEntry,
  MILESTONES,
} from '../types';
import {
  INITIAL_PRESET_ROUTINES,
  INITIAL_PRESET_TASKS,
} from '../data/defaultRoutines';
import { notificationService } from '../services/notificationService';
import { localDateStr } from '../lib/date';

export interface AppDataContextType {
  // Stable local identifiers (used for share cards / accountability codes)
  deviceId: string;
  syncCode: string;

  // Core Data — 100% local (localStorage persistence)
  routines: Routine[];
  tasks: RoutineTask[];
  completions: TaskCompletion[];
  communityPosts: CommunityPost[];

  // Selected date for viewing / tracking
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;

  // Actions
  toggleTaskCompletion: (taskId: string, date?: string) => Promise<void>;
  setTaskProgress: (taskId: string, value: number) => Promise<void>; // count/timer habits
  addRoutine: (routine: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRoutine: (id: string, updates: Partial<Routine>) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  addTask: (task: Omit<RoutineTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTask: (id: string, updates: Partial<RoutineTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  importRoutineTemplate: (template: RoutineTemplate) => Promise<void>;
  /** Reorder the tasks of one day-group; ids in their new display order */
  reorderTasks: (orderedIds: string[]) => Promise<void>;

  // Day journal
  journal: DayJournalEntry[];
  saveJournalEntry: (date: string, note: string, mood?: DayJournalEntry['mood']) => void;
  getJournalEntry: (date: string) => DayJournalEntry | undefined;

  // Streak freeze (protects a streak through a missed day; earned every 7-day streak)
  streakFreezes: number;
  freezeUsedDates: string[]; // dates the freeze bridged
  useStreakFreeze: (date: string) => boolean;

  // Milestones
  achievedMilestones: number[];
  newlyEarnedMilestone: number | null; // for celebration animation
  acknowledgeMilestone: () => void;

  // Data portability — replaces cloud sync (move data between devices via file)
  exportBackup: () => string;
  importBackup: (data: {
    routines?: Routine[];
    tasks?: RoutineTask[];
    completions?: TaskCompletion[];
    journal?: DayJournalEntry[];
  }) => void;

  // Social
  addCommunityPost: (title: string, content: string, streakCount: number, routineName: string) => Promise<void>;
  addCheer: (postId: string, reaction: Cheer['reaction']) => Promise<void>;

  // Computed stats
  todayStats: {
    totalTasks: number;
    completedCount: number;
    completionPercentage: number;
    currentStreak: number;
    bestStreak: number;
  };
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const STORAGE_KEY_ROUTINES = 'habitpulse_guest_routines';
const STORAGE_KEY_TASKS = 'habitpulse_guest_tasks';
const STORAGE_KEY_COMPLETIONS = 'habitpulse_guest_completions';
const STORAGE_KEY_POSTS = 'habitpulse_guest_posts';
const STORAGE_KEY_JOURNAL = 'habitpulse_guest_journal';
const STORAGE_KEY_FREEZES = 'habitpulse_freezes'; // { available, usedDates }
const STORAGE_KEY_MILESTONES_SEEN = 'habitpulse_milestones_seen';
const MAX_STREAK_FREEZES = 5;
const DEVICE_ID_KEY = 'habitpulse_device_id';

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'HP-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  // Stable device ID
  const [deviceId] = useState<string>(() => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  });

  // Share code used on social share cards / accountability tab
  const [syncCode, setSyncCode] = useState<string>(() => {
    return localStorage.getItem('habitpulse_sync_code') || generateRandomCode();
  });

  // Persist sync code so share cards stay consistent across sessions
  useEffect(() => {
    localStorage.setItem('habitpulse_sync_code', syncCode);
  }, [syncCode]);

  // State collections (localStorage-backed)
  const [routines, setRoutines] = useState<Routine[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROUTINES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PRESET_ROUTINES.map(r => ({ ...r, userId: 'local-user' }));
  });

  const [tasks, setTasks] = useState<RoutineTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PRESET_TASKS.map(t => ({ ...t, userId: 'local-user' }));
  });

  const [completions, setCompletions] = useState<TaskCompletion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPLETIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [journal, setJournal] = useState<DayJournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_JOURNAL);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [freezeState, setFreezeState] = useState<{ available: number; usedDates: string[] }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FREEZES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { available: 2, usedDates: [] };
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POSTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'post-welcome-1',
        userId: 'system-coach',
        authorName: 'Alex Rivera',
        title: '7-Day Morning Sunlight Streak!',
        content: 'Hit 7 continuous days of 10-minute morning outdoor walks. Mental alertness in the afternoon has doubled. Keep showing up everyone!',
        streakCount: 7,
        routineName: 'Morning Vitality & Priming',
        cheerCount: 14,
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'post-welcome-2',
        userId: 'system-coach-2',
        authorName: 'Jordan Chen',
        title: 'Deep Work Discipline Reached',
        content: 'Completed 5 consecutive focus blocks this week. Blocking phone notifications before 11 AM changed the entire game.',
        streakCount: 5,
        routineName: 'High-Impact Focus Block',
        cheerCount: 9,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
    ];
  });

  // Persist all state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROUTINES, JSON.stringify(routines));
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(completions));
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(communityPosts));
    localStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(journal));
  }, [routines, tasks, completions, communityPosts, journal]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FREEZES, JSON.stringify(freezeState));
  }, [freezeState]);

  // Recurring 30s background notification & reminder check
  useEffect(() => {
    const checkSchedule = () => {
      const todayStr = getTodayString();
      const todayDayOfWeek = new Date().getDay();
      const todayTasks = tasks.filter(t => !t.isArchived && t.daysOfWeek.includes(todayDayOfWeek));
      const completedSet = new Set(
        completions.filter(c => c.date === todayStr).map(c => c.taskId)
      );
      const enrichedTasks = todayTasks.map(t => {
        const parentRoutine = routines.find(r => r.id === t.routineId);
        return {
          id: t.id,
          title: t.title,
          scheduledTime: t.scheduledTime,
          reminderTime: t.reminderTime ?? null,
          habitType: t.habitType ?? 'check',
          targetCount: t.targetCount ?? null,
          routineTitle: parentRoutine?.title,
        };
      });
      notificationService.checkUpcomingTaskReminders(enrichedTasks, completedSet, 5, true);
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 30000);
    return () => clearInterval(interval);
  }, [tasks, routines, completions]);

  // Actions
  const toggleTaskCompletion = useCallback(async (taskId: string, targetDate?: string) => {
    const date = targetDate || selectedDate;
    const completionId = `local-user_${taskId}_${date}`.replace(/[^a-zA-Z0-9_\-]/g, '_');

    const existingIndex = completions.findIndex(
      c => c.taskId === taskId && c.date === date
    );

    if (existingIndex >= 0) {
      // Toggle OFF: Remove completion
      setCompletions(prev => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      // Toggle ON: Add completion (full value for counter/timer habits)
      const task = tasks.find(t => t.id === taskId);
      let value: number | undefined;
      if (task?.habitType === 'count') value = task.targetCount ?? 1;
      else if (task?.habitType === 'timer') value = Math.max(1, task.durationMinutes);
      const newRecord: TaskCompletion = {
        id: completionId,
        userId: 'local-user',
        taskId,
        date,
        completedAt: new Date().toISOString(),
        value,
      };
      setCompletions(prev => [...prev, newRecord]);
      notificationService.playChime('success');
    }
  }, [completions, selectedDate, tasks]);

  // Progress for counter/timer habits: value in completion record; done when >= target
  const setTaskProgress = useCallback(async (taskId: string, value: number) => {
    const date = selectedDate;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const target = task.habitType === 'count'
      ? (task.targetCount ?? 1)
      : Math.max(1, task.durationMinutes);
    const clamped = Math.max(0, Math.min(target, value));

    setCompletions(prev => {
      const idx = prev.findIndex(c => c.taskId === taskId && c.date === date);
      const existing = idx >= 0 ? prev[idx] : null;
      if (clamped === 0 && existing) {
        // Zero progress → remove the record
        return prev.filter((_, i) => i !== idx);
      }
      if (existing) {
        const next = [...prev];
        next[idx] = { ...existing, value: clamped };
        return next;
      }
      if (clamped === 0) return prev;
      return [
        ...prev,
        {
          id: `local-user_${taskId}_${date}`.replace(/[^a-zA-Z0-9_\-]/g, '_'),
          userId: 'local-user',
          taskId,
          date,
          completedAt: new Date().toISOString(),
          value: clamped,
        },
      ];
    });
  }, [tasks, selectedDate]);

  /** Reorder the visible rows of a day-group; ids in new display order. */
  const reorderTasks = useCallback(async (orderedIds: string[]) => {
    const now = new Date().toISOString();
    setTasks(prev =>
      prev.map(t => {
        const idx = orderedIds.indexOf(t.id);
        return idx >= 0 ? { ...t, order: idx, updatedAt: now } : t;
      })
    );
  }, []);

  // ---- Day journal ----
  const saveJournalEntry = useCallback((date: string, note: string, mood?: DayJournalEntry['mood']) => {
    setJournal(prev => {
      const idx = prev.findIndex(j => j.date === date);
      if (note.trim() === '' && !mood) {
        // Empty entry → remove it
        return prev.filter(j => j.date !== date);
      }
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], note, mood: mood ?? next[idx].mood };
        return next;
      }
      return [...prev, { date, note, mood }];
    });
  }, []);

  const getJournalEntry = useCallback(
    (date: string) => journal.find(j => j.date === date),
    [journal]
  );

  // ---- Streak freeze ----
  const useStreakFreeze = useCallback((date: string): boolean => {
    let success = false;
    setFreezeState(prev => {
      if (prev.available <= 0 || prev.usedDates.includes(date)) return prev;
      success = true;
      return { available: prev.available - 1, usedDates: [...prev.usedDates, date] };
    });
    return success;
  }, []);

  const addRoutine = useCallback(async (routineData: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `rtn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRoutine: Routine = {
      ...routineData,
      id,
      userId: 'local-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRoutines(prev => [...prev, newRoutine]);
    return id;
  }, []);

  const updateRoutine = useCallback(async (id: string, updates: Partial<Routine>) => {
    const now = new Date().toISOString();
    setRoutines(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates, updatedAt: now } : r))
    );
  }, []);

  const deleteRoutine = useCallback(async (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
    // Also delete associated tasks
    setTasks(prev => prev.filter(t => t.routineId !== id));
  }, []);

  const addTask = useCallback(async (taskData: Omit<RoutineTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTask: RoutineTask = {
      ...taskData,
      id,
      userId: 'local-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks(prev => [...prev, newTask]);
    return id;
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<RoutineTask>) => {
    const now = new Date().toISOString();
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates, updatedAt: now } : t))
    );
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const importRoutineTemplate = useCallback(async (template: RoutineTemplate) => {
    const routineId = await addRoutine({
      title: template.title,
      description: template.description,
      icon: template.icon,
      color: template.color,
      timeOfDay: template.timeOfDay,
      targetDays: [0, 1, 2, 3, 4, 5, 6],
      isArchived: false,
      order: routines.length,
    });

    for (let i = 0; i < template.tasks.length; i++) {
      const t = template.tasks[i];
      await addTask({
        routineId,
        title: t.title,
        scheduledTime: t.scheduledTime,
        durationMinutes: t.durationMinutes,
        category: t.category,
        priority: t.priority,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isArchived: false,
        order: i,
      });
    }

    notificationService.sendNotification(`Routine Imported: ${template.title}`, {
      body: `Added ${template.tasks.length} new routine habits to your schedule!`,
      playSound: true,
    });
  }, [addRoutine, addTask, routines.length]);

  // Data portability: export everything as a portable JSON snapshot
  const exportBackup = useCallback((): string => {
    return JSON.stringify(
      {
        app: 'HabitPulse',
        exportDate: new Date().toISOString(),
        routines,
        tasks,
        completions,
        journal,
      },
      null,
      2
    );
  }, [routines, tasks, completions, journal]);

  // Data portability: restore from a backup file (moves data between devices)
  const importBackup = useCallback((data: {
    routines?: Routine[];
    tasks?: RoutineTask[];
    completions?: TaskCompletion[];
    journal?: DayJournalEntry[];
  }) => {
    if (Array.isArray(data.routines)) setRoutines(data.routines);
    if (Array.isArray(data.tasks)) setTasks(data.tasks);
    if (Array.isArray(data.completions)) setCompletions(data.completions);
    if (Array.isArray(data.journal)) setJournal(data.journal);
  }, []);

  const addCommunityPost = useCallback(async (title: string, content: string, streakCount: number, routineName: string) => {
    const id = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newPost: CommunityPost = {
      id,
      userId: 'local-user',
      authorName: 'Habit Architect',
      title,
      content,
      streakCount,
      routineName,
      cheerCount: 1,
      createdAt: new Date().toISOString(),
    };

    setCommunityPosts(prev => [newPost, ...prev]);
    notificationService.playChime('cheer');
  }, []);

  const addCheer = useCallback(async (postId: string, reaction: Cheer['reaction']) => {
    void reaction; // reaction type kept for API compatibility
    setCommunityPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, cheerCount: (p.cheerCount || 0) + 1 } : p))
    );
    notificationService.playChime('cheer');
  }, []);

  // Computed stats: streak (freeze-aware), today percentage, completion count
  const todayStats = useMemo(() => {
    const targetDate = selectedDate;
    const [year, month, day] = targetDate.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    const activeTasksForDay = tasks.filter(t => !t.isArchived && t.daysOfWeek.includes(dayOfWeek));
    const completedForDay = completions.filter(c => c.date === targetDate);
    // count/timer habits count only when they reached their target
    const isDone = (t: RoutineTask): boolean => {
      const c = completedForDay.find(cc => cc.taskId === t.id);
      if (!c) return false;
      if (t.habitType === 'count') return (c.value ?? t.targetCount ?? 1) >= (t.targetCount ?? 1);
      if (t.habitType === 'timer') return (c.value ?? Math.max(1, t.durationMinutes)) >= Math.max(1, t.durationMinutes);
      return true;
    };
    const completedCount = activeTasksForDay.filter(isDone).length;

    const totalTasks = activeTasksForDay.length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    // Collect "kept" days: completions + freeze-bridged misses
    const keptDates = new Set(completions.map(c => c.date));
    freezeState.usedDates.forEach(d => keptDates.add(d));

    // A day "counts" toward a streak only if at least one habit was scheduled & done
    const daysWithTasks = new Set<string>();
    const seenDates = new Set<string>();
    completions.forEach(c => {
      if (!seenDates.has(c.date)) {
        seenDates.add(c.date);
        daysWithTasks.add(c.date);
      }
    });

    const DAY_MS = 24 * 3600 * 1000;
    const dateStr = localDateStr;

    let currentStreak = 0;
    const todayStr = getTodayString();
    const yesterday = new Date(Date.now() - DAY_MS);
    const todayDone = keptDates.has(todayStr);
    const yesterdayKept = keptDates.has(dateStr(yesterday));

    if (todayDone || yesterdayKept) {
      let cursor = todayDone ? new Date() : new Date(yesterday);
      while (true) {
        const dStr = dateStr(cursor);
        if (keptDates.has(dStr)) {
          // Freeze-bridged miss days keep the streak alive but don't extend the count
          if (!freezeState.usedDates.includes(dStr)) currentStreak++;
          cursor = new Date(cursor.getTime() - DAY_MS);
        } else {
          break;
        }
      }
    }

    // Best streak over completion history (consecutive days)
    const completionDates = Array.from(daysWithTasks).sort();
    let bestStreak = 0;
    if (completionDates.length > 0) {
      let tempStreak = 1;
      bestStreak = 1;
      for (let i = 1; i < completionDates.length; i++) {
        const prev = new Date(completionDates[i - 1]);
        const curr = new Date(completionDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / DAY_MS);
        if (diffDays === 1) {
          tempStreak++;
          if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    }

    return {
      totalTasks,
      completedCount,
      completionPercentage,
      currentStreak: Math.max(currentStreak, todayDone ? 1 : 0),
      bestStreak: Math.max(bestStreak, currentStreak),
    };
  }, [tasks, completions, selectedDate, freezeState]);

  // ---- Milestones: badges at 7/14/30/60/100/200/365-day streaks ----
  const achievedMilestones = useMemo(
    () => MILESTONES.filter(m => todayStats.bestStreak >= m),
    [todayStats.bestStreak]
  );

  // Detect a milestone reached this session but not celebrated yet
  const [newlyEarnedMilestone, setNewlyEarnedMilestone] = useState<number | null>(() => {
    try {
      const seen: number[] = JSON.parse(localStorage.getItem(STORAGE_KEY_MILESTONES_SEEN) || '[]');
      void seen;
      return null; // never celebrate on cold load
    } catch {
      return null;
    }
  });

  const seenMilestonesRef = useRef<number[]>(
    (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_MILESTONES_SEEN) || '[]');
      } catch {
        return [];
      }
    })()
  );

  useEffect(() => {
    const best = todayStats.bestStreak;
    const fresh = MILESTONES.find(m => best >= m && !seenMilestonesRef.current.includes(m));
    if (fresh && completions.some(c => c.date === getTodayString())) {
      seenMilestonesRef.current = [...seenMilestonesRef.current, fresh];
      localStorage.setItem(STORAGE_KEY_MILESTONES_SEEN, JSON.stringify(seenMilestonesRef.current));
      setNewlyEarnedMilestone(fresh);
      // Reward: +1 streak freeze per milestone (stock-capped)
      setFreezeState(prev =>
        prev.available < MAX_STREAK_FREEZES
          ? { ...prev, available: prev.available + 1 }
          : prev
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStats.bestStreak]);

  const acknowledgeMilestone = useCallback(() => setNewlyEarnedMilestone(null), []);

  return (
    <AppDataContext.Provider
      value={{
        deviceId,
        syncCode,
        routines,
        tasks,
        completions,
        communityPosts,
        selectedDate,
        setSelectedDate,
        toggleTaskCompletion,
        setTaskProgress,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        addTask,
        updateTask,
        deleteTask,
        reorderTasks,
        importRoutineTemplate,
        exportBackup,
        importBackup,
        journal,
        saveJournalEntry,
        getJournalEntry,
        streakFreezes: freezeState.available,
        freezeUsedDates: freezeState.usedDates,
        useStreakFreeze,
        achievedMilestones,
        newlyEarnedMilestone,
        acknowledgeMilestone,
        addCommunityPost,
        addCheer,
        todayStats,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
