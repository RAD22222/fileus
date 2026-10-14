import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../lib/firebase';
import {
  Routine,
  RoutineTask,
  TaskCompletion,
  CommunityPost,
  Cheer,
  UserProfile,
  RoutineTemplate,
} from '../types';
import {
  INITIAL_PRESET_ROUTINES,
  INITIAL_PRESET_TASKS,
} from '../data/defaultRoutines';
import { notificationService } from '../services/notificationService';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'local_only';

interface AuthAndSyncContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isGuest: boolean;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  deviceId: string;
  syncCode: string;

  // Core Data
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

  // Social
  addCommunityPost: (title: string, content: string, streakCount: number, routineName: string) => Promise<void>;
  addCheer: (postId: string, reaction: Cheer['reaction']) => Promise<void>;

  // Auth / Sync controls
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  triggerManualSync: () => Promise<void>;

  // Computed stats
  todayStats: {
    totalTasks: number;
    completedCount: number;
    completionPercentage: number;
    currentStreak: number;
    bestStreak: number;
  };
}

const AuthAndSyncContext = createContext<AuthAndSyncContextType | undefined>(undefined);

const GUEST_STORAGE_KEY_ROUTINES = 'habitpulse_guest_routines';
const GUEST_STORAGE_KEY_TASKS = 'habitpulse_guest_tasks';
const GUEST_STORAGE_KEY_COMPLETIONS = 'habitpulse_guest_completions';
const GUEST_STORAGE_KEY_POSTS = 'habitpulse_guest_posts';
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

export const AuthAndSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local_only');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
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

  // 6-digit sync code for cross-device linking
  const [syncCode, setSyncCode] = useState<string>(() => {
    return localStorage.getItem('habitpulse_sync_code') || generateRandomCode();
  });

  // State collections
  const [routines, setRoutines] = useState<Routine[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY_ROUTINES);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Seed initial routines for guest
    return INITIAL_PRESET_ROUTINES.map(r => ({ ...r, userId: 'guest-local' }));
  });

  const [tasks, setTasks] = useState<RoutineTask[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY_TASKS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PRESET_TASKS.map(t => ({ ...t, userId: 'guest-local' }));
  });

  const [completions, setCompletions] = useState<TaskCompletion[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY_COMPLETIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY_POSTS);
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

  // Verify initial connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);

      if (firebaseUser) {
        setSyncStatus('syncing');
        try {
          const profileDocPath = `users/${firebaseUser.uid}`;
          const currentCode = syncCode;
          const profileData: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Habit Member',
            photoURL: firebaseUser.photoURL || '',
            syncCode: currentCode,
            darkMode: (localStorage.getItem('habitpulse_theme') as UserProfile['darkMode']) || 'system',
            highContrast: localStorage.getItem('habitpulse_high_contrast') === 'true',
            soundEnabled: true,
            notificationMinutesBefore: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Save or sync user profile
          await setDoc(doc(db, 'users', firebaseUser.uid), profileData, { merge: true });
          setUserProfile(profileData);
          setSyncStatus('synced');
          setLastSyncTime(new Date());
        } catch (e) {
          console.warn('Profile sync warning:', e);
          setSyncStatus('offline');
        }
      } else {
        setUserProfile(null);
        setSyncStatus('local_only');
      }
    });

    return () => unsubscribe();
  }, [syncCode]);

  // Real-time Firestore sync when user is authenticated
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const uid = user.uid;
    setSyncStatus('syncing');

    // 1. Synchronize Routines
    const routinesQuery = query(
      collection(db, 'routines'),
      where('userId', '==', uid)
    );
    const unsubsRoutines = onSnapshot(
      routinesQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          // If the cloud account has 0 routines, upload local or starter presets
          try {
            const seedRoutines = routines.length > 0
              ? routines.map(r => ({ ...r, userId: uid }))
              : INITIAL_PRESET_ROUTINES.map(r => ({ ...r, userId: uid }));

            for (const r of seedRoutines) {
              await setDoc(doc(db, 'routines', r.id), r);
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'routines');
          }
        } else {
          const cloudRoutines: Routine[] = [];
          snapshot.forEach((docSnap) => {
            cloudRoutines.push(docSnap.data() as Routine);
          });
          cloudRoutines.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setRoutines(cloudRoutines);
        }
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'routines');
      }
    );

    // 2. Synchronize Tasks
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid)
    );
    const unsubsTasks = onSnapshot(
      tasksQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            const seedTasks = tasks.length > 0
              ? tasks.map(t => ({ ...t, userId: uid }))
              : INITIAL_PRESET_TASKS.map(t => ({ ...t, userId: uid }));

            for (const t of seedTasks) {
              await setDoc(doc(db, 'tasks', t.id), t);
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'tasks');
          }
        } else {
          const cloudTasks: RoutineTask[] = [];
          snapshot.forEach((docSnap) => {
            cloudTasks.push(docSnap.data() as RoutineTask);
          });
          cloudTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setTasks(cloudTasks);
        }
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'tasks');
      }
    );

    // 3. Synchronize Completions
    const completionsQuery = query(
      collection(db, 'completions'),
      where('userId', '==', uid)
    );
    const unsubsCompletions = onSnapshot(
      completionsQuery,
      (snapshot) => {
        const cloudCompletions: TaskCompletion[] = [];
        snapshot.forEach((docSnap) => {
          cloudCompletions.push(docSnap.data() as TaskCompletion);
        });
        setCompletions(cloudCompletions);
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'completions');
      }
    );

    // 4. Synchronize Community Feed
    const postsQuery = query(
      collection(db, 'communityPosts'),
      limit(30)
    );
    const unsubsPosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudPosts: CommunityPost[] = [];
          snapshot.forEach((docSnap) => {
            cloudPosts.push(docSnap.data() as CommunityPost);
          });
          cloudPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setCommunityPosts(cloudPosts);
        }
      },
      (error) => {
        console.warn('Community posts snapshot error:', error);
      }
    );

    return () => {
      unsubsRoutines();
      unsubsTasks();
      unsubsCompletions();
      unsubsPosts();
    };
  }, [user, isAuthReady]);

  // Persist guest state to localStorage
  useEffect(() => {
    if (!user) {
      localStorage.setItem(GUEST_STORAGE_KEY_ROUTINES, JSON.stringify(routines));
      localStorage.setItem(GUEST_STORAGE_KEY_TASKS, JSON.stringify(tasks));
      localStorage.setItem(GUEST_STORAGE_KEY_COMPLETIONS, JSON.stringify(completions));
      localStorage.setItem(GUEST_STORAGE_KEY_POSTS, JSON.stringify(communityPosts));
    }
  }, [routines, tasks, completions, communityPosts, user]);

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
    const currentUid = user ? user.uid : 'guest-local';
    const completionId = `${currentUid}_${taskId}_${date}`.replace(/[^a-zA-Z0-9_\-]/g, '_');

    const existingIndex = completions.findIndex(
      c => c.taskId === taskId && c.date === date
    );

    if (existingIndex >= 0) {
      // Toggle OFF: Remove completion
      const newCompletions = completions.filter((_, idx) => idx !== existingIndex);
      setCompletions(newCompletions);

      if (user) {
        try {
          await deleteDoc(doc(db, 'completions', completionId));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `completions/${completionId}`);
        }
      }
    } else {
      // Toggle ON: Add completion
      const newRecord: TaskCompletion = {
        id: completionId,
        userId: currentUid,
        taskId,
        date,
        completedAt: new Date().toISOString(),
      };
      setCompletions(prev => [...prev, newRecord]);
      notificationService.playChime('success');

      if (user) {
        try {
          await setDoc(doc(db, 'completions', completionId), newRecord);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `completions/${completionId}`);
        }
      }
    }
  }, [completions, selectedDate, user]);

  const addRoutine = useCallback(async (routineData: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const currentUid = user ? user.uid : 'guest-local';
    const id = `rtn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRoutine: Routine = {
      ...routineData,
      id,
      userId: currentUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRoutines(prev => [...prev, newRoutine]);

    if (user) {
      try {
        await setDoc(doc(db, 'routines', id), newRoutine);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `routines/${id}`);
      }
    }
    return id;
  }, [user]);

  const updateRoutine = useCallback(async (id: string, updates: Partial<Routine>) => {
    const now = new Date().toISOString();
    setRoutines(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates, updatedAt: now } : r))
    );

    if (user) {
      try {
        const cleanUpdates = { ...updates, updatedAt: now };
        await updateDoc(doc(db, 'routines', id), cleanUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `routines/${id}`);
      }
    }
  }, [user]);

  const deleteRoutine = useCallback(async (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
    // Also delete or archive associated tasks
    const tasksToDelete = tasks.filter(t => t.routineId === id);
    setTasks(prev => prev.filter(t => t.routineId !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'routines', id));
        for (const t of tasksToDelete) {
          await deleteDoc(doc(db, 'tasks', t.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `routines/${id}`);
      }
    }
  }, [user, tasks]);

  const addTask = useCallback(async (taskData: Omit<RoutineTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const currentUid = user ? user.uid : 'guest-local';
    const id = `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTask: RoutineTask = {
      ...taskData,
      id,
      userId: currentUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks(prev => [...prev, newTask]);

    if (user) {
      try {
        await setDoc(doc(db, 'tasks', id), newTask);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `tasks/${id}`);
      }
    }
    return id;
  }, [user]);

  const updateTask = useCallback(async (id: string, updates: Partial<RoutineTask>) => {
    const now = new Date().toISOString();
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates, updatedAt: now } : t))
    );

    if (user) {
      try {
        const cleanUpdates = { ...updates, updatedAt: now };
        await updateDoc(doc(db, 'tasks', id), cleanUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${id}`);
      }
    }
  }, [user]);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
      }
    }
  }, [user]);

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

  const addCommunityPost = useCallback(async (title: string, content: string, streakCount: number, routineName: string) => {
    const currentUid = user ? user.uid : 'guest-local';
    const authorName = user?.displayName || userProfile?.displayName || 'Habit Adventurer';
    const authorPhoto = user?.photoURL || '';
    const id = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newPost: CommunityPost = {
      id,
      userId: currentUid,
      authorName,
      authorPhoto,
      title,
      content,
      streakCount,
      routineName,
      cheerCount: 1,
      createdAt: new Date().toISOString(),
    };

    setCommunityPosts(prev => [newPost, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'communityPosts', id), newPost);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `communityPosts/${id}`);
      }
    }
    notificationService.playChime('cheer');
  }, [user, userProfile]);

  const addCheer = useCallback(async (postId: string, reaction: Cheer['reaction']) => {
    const currentUid = user ? user.uid : 'guest-local';
    const userName = user?.displayName || 'Friend';
    const cheerId = `cheer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Update local post cheer count
    setCommunityPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, cheerCount: (p.cheerCount || 0) + 1 } : p))
    );
    notificationService.playChime('cheer');

    if (user) {
      try {
        const cheerDoc: Cheer = {
          id: cheerId,
          postId,
          userId: currentUid,
          userName,
          reaction,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'communityPosts', postId, 'cheers', cheerId), cheerDoc);
        // Increment cheer count on post
        const currentPost = communityPosts.find(p => p.id === postId);
        const nextCheerCount = (currentPost?.cheerCount || 0) + 1;
        await updateDoc(doc(db, 'communityPosts', postId), { cheerCount: nextCheerCount });
      } catch (err) {
        console.warn('Cheer persistence notice:', err);
      }
    }
  }, [user, communityPosts]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-in failed:', error);
      setSyncStatus('offline');
      throw error;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setSyncStatus('local_only');
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  }, []);

  const triggerManualSync = useCallback(async () => {
    setSyncStatus('syncing');
    await testConnection();
    setTimeout(() => {
      setSyncStatus(user ? 'synced' : 'local_only');
      setLastSyncTime(new Date());
    }, 600);
  }, [user]);

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
    <AuthAndSyncContext.Provider
      value={{
        user,
        userProfile,
        isGuest: !user,
        syncStatus,
        lastSyncTime,
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
        addCommunityPost,
        addCheer,
        signInWithGoogle,
        signOutUser,
        triggerManualSync,
        todayStats,
      }}
    >
      {children}
    </AuthAndSyncContext.Provider>
  );
};

export const useAuthAndSync = () => {
  const context = useContext(AuthAndSyncContext);
  if (!context) {
    throw new Error('useAuthAndSync must be used within an AuthAndSyncProvider');
  }
  return context;
};
