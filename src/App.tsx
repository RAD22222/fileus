import React, { useState } from 'react';
import {
  CalendarCheck,
  Layers,
  BarChart3,
  Users,
  Plus,
} from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthAndSyncProvider, useAuthAndSync } from './context/AuthAndSyncContext';
import { Header } from './components/Header';
import { TodaySchedule } from './components/TodaySchedule';
import { RoutinesManager } from './components/RoutinesManager';
import { AnalyticsVisualizer } from './components/AnalyticsVisualizer';
import { SocialMotivation } from './components/SocialMotivation';
import { SyncAndDeviceModal } from './components/SyncAndDeviceModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { SettingsModal } from './components/SettingsModal';
import { TaskModal } from './components/TaskModal';
import { RoutineModal } from './components/RoutineModal';
import { NewPostModal } from './components/NewPostModal';
import { InAppNotificationToast } from './components/InAppNotificationToast';
import { Routine, RoutineTask } from './types';

type AppTab = 'today' | 'routines' | 'analytics' | 'social';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('today');

  // Modals state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);

  // Editing state
  const [taskToEdit, setTaskToEdit] = useState<RoutineTask | null>(null);
  const [defaultRoutineIdForNewTask, setDefaultRoutineIdForNewTask] = useState<string | undefined>(undefined);
  const [routineToEdit, setRoutineToEdit] = useState<Routine | null>(null);

  const { todayStats } = useAuthAndSync();

  const handleOpenAddTask = (routineId?: string) => {
    setTaskToEdit(null);
    setDefaultRoutineIdForNewTask(routineId);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: RoutineTask) => {
    setTaskToEdit(task);
    setDefaultRoutineIdForNewTask(task.routineId);
    setIsTaskModalOpen(true);
  };

  const handleOpenCreateRoutine = () => {
    setRoutineToEdit(null);
    setIsRoutineModalOpen(true);
  };

  const handleOpenEditRoutine = (routine: Routine) => {
    setRoutineToEdit(routine);
    setIsRoutineModalOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-[#fbfbfb] dark:bg-[#070709] text-black dark:text-white transition-colors flex flex-col font-sans antialiased selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* Monochromatic Glass Ambient Specular Backdrops */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-black/[0.03] dark:bg-white/[0.04] blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-black/[0.02] dark:bg-white/[0.03] blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-black/[0.02] dark:bg-white/[0.03] blur-3xl" />
      </div>

      {/* Top Header */}
      <Header
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area - Generous bottom padding to ensure bottom dock never covers content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 pb-28 sm:pb-32 md:pb-12">
        
        {/* Navigation Tabs (Desktop / Tablet >= 768px) - Glass Segmented Control */}
        <div className="hidden md:flex items-center gap-1.5 mb-6 glass-surface p-1.5 rounded-2xl border border-black/10 dark:border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('today')}
            className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'today'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Today&apos;s Protocol</span>
            <span className="ml-1 text-[10px] font-mono opacity-80">
              {todayStats.completedCount}/{todayStats.totalTasks}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('routines')}
            className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'routines'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Routine Stacks</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Heatmaps & Streaks</span>
            <span className="ml-1 text-[10px] font-mono opacity-80">
              {todayStats.currentStreak}d
            </span>
          </button>

          <button
            onClick={() => setActiveTab('social')}
            className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'social'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Social Cheers</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'today' && (
          <TodaySchedule
            onOpenAddTaskModal={handleOpenAddTask}
            onOpenEditTaskModal={handleOpenEditTask}
            onOpenShareModal={() => setIsNewPostModalOpen(true)}
          />
        )}

        {activeTab === 'routines' && (
          <RoutinesManager
            onOpenCreateRoutineModal={handleOpenCreateRoutine}
            onOpenEditRoutineModal={handleOpenEditRoutine}
            onOpenAddTaskModal={handleOpenAddTask}
            onOpenEditTaskModal={handleOpenEditTask}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsVisualizer />
        )}

        {activeTab === 'social' && (
          <SocialMotivation
            onOpenNewPostModal={() => setIsNewPostModalOpen(true)}
          />
        )}

      </main>

      {/* Mobile Bottom Transparent Glass Dock - Always Present ("Everytime") & Fully Transparent */}
      <nav className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 max-w-md mx-auto z-40 glass-dock rounded-2xl px-2 py-1 flex items-center justify-around h-15 sm:h-16 transition-all shadow-xl">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all ${
            activeTab === 'today'
              ? 'text-black dark:text-white bg-black/10 dark:bg-white/15 font-bold shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
          aria-label="Today tab"
        >
          <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-mono leading-none">Today</span>
        </button>

        <button
          onClick={() => setActiveTab('routines')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all ${
            activeTab === 'routines'
              ? 'text-black dark:text-white bg-black/10 dark:bg-white/15 font-bold shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
          aria-label="Routines tab"
        >
          <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-mono leading-none">Routines</span>
        </button>

        {/* Center Floating Quick Add Button */}
        <button
          onClick={() => handleOpenAddTask()}
          className="w-11 h-11 -mt-4 rounded-full bg-black/90 dark:bg-white/90 text-white dark:text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform border border-black/20 dark:border-white/30 backdrop-blur-md shrink-0 mx-1"
          aria-label="Add new habit"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all ${
            activeTab === 'analytics'
              ? 'text-black dark:text-white bg-black/10 dark:bg-white/15 font-bold shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
          aria-label="Heatmap tab"
        >
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-mono leading-none">Heatmap</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all ${
            activeTab === 'social'
              ? 'text-black dark:text-white bg-black/10 dark:bg-white/15 font-bold shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
          aria-label="Social tab"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-mono leading-none">Social</span>
        </button>
      </nav>

      {/* Floating In-App Toast Alerts */}
      <InAppNotificationToast />

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        defaultRoutineId={defaultRoutineIdForNewTask}
      />

      <RoutineModal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
        routineToEdit={routineToEdit}
      />

      <SyncAndDeviceModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenSyncModal={() => {
          setIsSettingsModalOpen(false);
          setIsSyncModalOpen(true);
        }}
        onOpenNotificationModal={() => {
          setIsSettingsModalOpen(false);
          setIsNotificationModalOpen(true);
        }}
      />

      <NewPostModal
        isOpen={isNewPostModalOpen}
        onClose={() => setIsNewPostModalOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthAndSyncProvider>
        <AppContent />
      </AuthAndSyncProvider>
    </ThemeProvider>
  );
}
