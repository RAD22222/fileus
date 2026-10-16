import React, { useEffect, useRef, useState } from 'react';
import {
  CalendarCheck,
  Layers,
  BarChart3,
  Users,
  Plus,
} from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { Header } from './components/Header';
import { TodaySchedule } from './components/TodaySchedule';
import { RoutinesManager } from './components/RoutinesManager';
import { AnalyticsVisualizer } from './components/AnalyticsVisualizer';
import { SocialMotivation } from './components/SocialMotivation';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { SettingsModal } from './components/SettingsModal';
import { TaskModal } from './components/TaskModal';
import { RoutineModal } from './components/RoutineModal';
import { NewPostModal } from './components/NewPostModal';
import { InAppNotificationToast } from './components/InAppNotificationToast';
import { Routine, RoutineTask } from './types';

type AppTab = 'today' | 'routines' | 'analytics' | 'social';

const NAV_ITEMS: { id: AppTab; label: string; icon: typeof CalendarCheck }[] = [
  { id: 'today', label: 'Today', icon: CalendarCheck },
  { id: 'routines', label: 'Routines', icon: Layers },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'social', label: 'Social', icon: Users },
];

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [viewDirection, setViewDirection] = useState<'forward' | 'backward'>('forward');
  const prevTabRef = useRef<AppTab>('today');

  const changeTab = (id: AppTab) => {
    if (id === activeTab) return;
    const from = NAV_ITEMS.findIndex(n => n.id === prevTabRef.current);
    const to = NAV_ITEMS.findIndex(n => n.id === id);
    setViewDirection(to > from ? 'forward' : 'backward');
    prevTabRef.current = id;
    setActiveTab(id);
  };

  // Every tab is a fresh screen — start at the top. This also avoids the
  // Chromium quirk where a fixed bottom bar is mispositioned while the
  // browser re-clamps scroll on a content swap.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab]);

  // Modals state
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);

  // Editing state
  const [taskToEdit, setTaskToEdit] = useState<RoutineTask | null>(null);
  const [defaultRoutineIdForNewTask, setDefaultRoutineIdForNewTask] = useState<string | undefined>(undefined);
  const [routineToEdit, setRoutineToEdit] = useState<Routine | null>(null);

  const { todayStats } = useAppData();

  // Elevate the top app bar on scroll (MD3 on-scroll behavior)
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const renderNavItem = (item: typeof NAV_ITEMS[number], inRail = false) => {
    const active = activeTab === item.id;
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => changeTab(item.id)}
        className={`md-nav-item md-ripple${active ? ' md-nav-item--active' : ''}${inRail ? ' w-full' : ' flex-1'}`}
        aria-current={active ? 'page' : undefined}
        aria-label={item.label}
      >
        <span className="md-nav-item__indicator">
          <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
        </span>
        <span className="md-nav-item__label md-label-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header
        scrolled={scrolled}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      <main
        key={activeTab}
        className={`relative mx-auto w-full max-w-3xl flex-1 px-4 pt-3 pb-24 md:pb-10 md:pl-28 md-view-enter-${viewDirection}`}
      >
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

        {activeTab === 'analytics' && <AnalyticsVisualizer />}

        {activeTab === 'social' && (
          <SocialMotivation onOpenNewPostModal={() => setIsNewPostModalOpen(true)} />
        )}
      </main>

      {/* Floating action button — quick add habit (extended for clarity) */}
      {/* Dock — sticky bottom overlay. Sticky (not fixed) sidesteps Android
          Chrome's fixed-bottom repositioning bugs during content swaps. */}
      <div className="sticky bottom-0 z-30 pointer-events-none md:hidden">
        <button
          onClick={() => handleOpenAddTask()}
          className="md-fab md-fab--floating md-fab--extended md-ripple pointer-events-auto"
          aria-label="Add new habit"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Add habit
        </button>
        <nav className="md-nav-bar md-nav-bar--sticky pointer-events-auto" aria-label="Primary">
          {NAV_ITEMS.map(item => renderNavItem(item))}
        </nav>
      </div>

      {/* Navigation rail — tablets & desktop (MD3) */}
      <nav className="md-nav-rail" aria-label="Primary">
        <button
          onClick={() => handleOpenAddTask()}
          className="md-fab md-ripple"
          aria-label="Add new habit"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
        {NAV_ITEMS.map(item => renderNavItem(item, true))}
      </nav>

      <InAppNotificationToast />

      {/* Modals — MD3 modal bottom sheets */}
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

      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
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
      <AppDataProvider>
        <AppContent />
      </AppDataProvider>
    </ThemeProvider>
  );
}
