export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type TaskCategory = 'health' | 'productivity' | 'mindfulness' | 'fitness' | 'learning' | 'creativity' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ThemeMode = 'light' | 'dark' | 'system';
export type CheerReaction = 'fire' | 'clap' | 'rocket' | 'muscle' | 'heart';
export type HabitType = 'check' | 'count' | 'timer';
export type Mood = 'great' | 'good' | 'neutral' | 'low';

export const MILESTONES = [7, 14, 30, 60, 100, 200, 365] as const;

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  syncCode: string;
  darkMode: ThemeMode;
  highContrast: boolean;
  soundEnabled: boolean;
  notificationMinutesBefore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Routine {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  timeOfDay: TimeOfDay;
  targetDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  isArchived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineTask {
  id: string;
  userId: string;
  routineId: string; // Routine ID or 'standalone'
  title: string;
  scheduledTime: string; // HH:mm
  durationMinutes: number;
  category: TaskCategory;
  priority: TaskPriority;
  daysOfWeek: number[]; // 0-6
  isArchived: boolean;
  order: number;
  /** How completion works: checkbox, X-of-N counter, or accumulated timer (minutes) */
  habitType?: HabitType;
  /** Counter target (habitType='count') */
  targetCount?: number;
  /** Per-habit reminder time override, HH:mm (null = follow scheduled time) */
  reminderTime?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompletion {
  id: string; // composite `${userId}_${taskId}_${date}`
  userId: string;
  taskId: string;
  date: string; // YYYY-MM-DD
  completedAt: string;
  notes?: string;
  /** Progress value for count/timer habits (units done or minutes accumulated) */
  value?: number;
}

/** One free-text reflection per day */
export interface DayJournalEntry {
  date: string; // YYYY-MM-DD
  note: string;
  mood?: Mood;
}

export interface CommunityPost {
  id: string;
  userId: string;
  authorName: string;
  authorPhoto?: string;
  title: string;
  content: string;
  streakCount: number;
  routineName: string;
  cheerCount: number;
  createdAt: string;
}

export interface Cheer {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  reaction: CheerReaction;
  createdAt: string;
}

export interface RoutineTemplate {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  timeOfDay: TimeOfDay;
  icon: string;
  color: string;
  author: string;
  tasks: Array<{
    title: string;
    scheduledTime: string;
    durationMinutes: number;
    category: TaskCategory;
    priority: TaskPriority;
  }>;
}

export interface DayActivity {
  date: string; // YYYY-MM-DD
  totalTasks: number;
  completedTasks: number;
  percentage: number;
}
