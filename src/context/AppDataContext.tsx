import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Routine,
  RoutineTask,
  TaskCompletion,
  CommunityPost,
  Cheer,
  RoutineTemplate,
} from '../types';
import {
  INITIAL_PRESET_ROUTINES,
  INITIAL_PRESET_TASKS,
} from '../data/defaultRoutines';
import { notificationService } from '../services/notificationService';

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
  addRoutine: (routine: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRoutine: (id: string, updates: Partial<Routine>) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  addTask: (task: Omit<RoutineTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTask: (id: string, updates: Partial<RoutineTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  importRoutineTemplate: (template: RoutineTemplate) => Promise<void>;

  // Data portability — replaces cloud sync (move data between devices via file)
  exportBackup: () => string;
  importBackup: (data: { routines?: Routine[]; tasks?: RoutineTask[]; completions?: TaskCompletion[] }) => void;

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
  }, [routines, tasks, completions, communityPosts]);

  // Recurring 30s background notification & reminder check
  useEffect(() => {
    const checkSchedule = () => {
      const todayTasks = tasks.filter(t => !t.isArchived);
      const completedSet = new Set(
        completions.filter(c => c.date === getTodayString()).map(c => c.taskId)
      );
      const enrichedTasks = todayTasks.map(t => {
        const parentRoutine = routines.find(r => r.id === t.routineId);
        return {
          id: t.id,
          title: t.title,
          scheduledTime: t.scheduledTime,
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
      // Toggle ON: Add completion
      const newRecord: TaskCompletion = {
        id: completionId,
        userId: 'local-user',
        taskId,
        date,
        completedAt: new Date().toISOString(),
      };
      setCompletions(prev => [...prev, newRecord]);
      notificationService.playChime('success');
    }
  }, [completions, selectedDate]);

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
      },
      null,
      2
    );
  }, [routines, tasks, completions]);

  // Data portability: restore from a backup file (moves data between devices)
  const importBackup = useCallback((data: { routines?: Routine[]; tasks?: RoutineTask[]; completions?: TaskCompletion[] }) => {
    if (Array.isArray(data.routines)) setRoutines(data.routines);
    if (Array.isArray(data.tasks)) setTasks(data.tasks);
    if (Array.isArray(data.completions)) setCompletions(data.completions);
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

  // Computed stats: streak, today percentage, completion count
  const todayStats = useMemo(() => {
    const targetDate = selectedDate;
    const [year, month, day] = targetDate.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    const activeTasksForDay = tasks.filter(t => !t.isArchived && t.daysOfWeek.includes(dayOfWeek));
    const completedForDay = completions.filter(c => c.date === targetDate);
    const completedCount = activeTasksForDay.filter(t =>
      completedForDay.some(c => c.taskId === t.id)
    ).length;

    const totalTasks = activeTasksForDay.length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    // Calculate streaks across completions
    const completionDates = Array.from(new Set(completions.map(c => c.date))).sort();
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const todayStr = getTodayString();
    let checkDate = new Date();

    // Check if today or yesterday is completed to keep streak alive
    const todayDone = completions.some(c => c.date === todayStr);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayDone = completions.some(c => c.date === yesterdayStr);

    if (todayDone || yesterdayDone) {
      // Calculate backwards
      let cursor = todayDone ? new Date() : yesterday;
      while (true) {
        const dStr = cursor.toISOString().split('T')[0];
        const hasDone = completions.some(c => c.date === dStr);
        if (hasDone) {
          currentStreak++;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Best streak calculation
    if (completionDates.length > 0) {
      tempStreak = 1;
      bestStreak = 1;
      for (let i = 1; i < completionDates.length; i++) {
        const prev = new Date(completionDates[i - 1]);
        const curr = new Date(completionDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
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
  }, [tasks, completions, selectedDate]);

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
        addRoutine,
        updateRoutine,
        deleteRoutine,
        addTask,
        updateTask,
        deleteTask,
        importRoutineTemplate,
        exportBackup,
        importBackup,
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
