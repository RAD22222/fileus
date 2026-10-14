import React from 'react';
import {
  Flame,
  Cloud,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  LogIn,
  Sliders,
} from 'lucide-react';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onOpenSyncModal: () => void;
  onOpenNotificationModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSyncModal,
  onOpenNotificationModal,
  onOpenSettingsModal,
}) => {
  const {
    user,
    syncStatus,
    todayStats,
    selectedDate,
    setSelectedDate,
  } = useAuthAndSync();

  const { isDark, toggleDarkQuick, highContrast } = useTheme();

  // Date navigation helpers
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  const isSelectedDateToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <header className="sticky top-0 z-40 glass-surface border-b border-black/10 dark:border-white/10 transition-colors w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 sm:h-16 gap-1 sm:gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black shadow-md border border-black/20 dark:border-white/30 shrink-0">
              <span className="text-xs sm:text-sm tracking-tighter font-mono">HP</span>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-black dark:text-white font-sans">
                  HABITPULSE
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase tracking-widest bg-black/10 dark:bg-white/10 text-black dark:text-white rounded border border-black/10 dark:border-white/10">
                  SYNC
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tracking-tight">Daily Habit Architecture</p>
            </div>
          </div>

          {/* Date Selector Navigation - Ergonomic & Ultra-Compact on Mobile */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl glass-button shrink-0">
            <button
              onClick={handlePrevDay}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Previous Day"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={handleSetToday}
              className={`h-7 sm:h-8 px-2 sm:px-3 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 ${
                isSelectedDateToday
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs whitespace-nowrap">
                {isSelectedDateToday ? 'Today' : formatDisplayDate(selectedDate)}
              </span>
            </button>

            <button
              onClick={handleNextDay}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Next Day"
              aria-label="Next day"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Right Action Hub - Carefully Scaled & Non-Overflowing */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">

            {/* Streak Counter */}
            <div
              className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl glass-button text-black dark:text-white font-mono font-extrabold text-[11px] sm:text-xs cursor-default shrink-0"
              title={`Streak: ${todayStats.currentStreak} days`}
            >
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-black dark:fill-white text-black dark:text-white shrink-0" />
              <span>{todayStats.currentStreak}d</span>
            </div>

            {/* Daily Completion Pill - Desktop / Tablet only */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-button text-black dark:text-white font-mono font-bold text-xs cursor-default"
              title={`${todayStats.completedCount} of ${todayStats.totalTasks} completed today`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>{todayStats.completionPercentage}%</span>
            </div>

            {/* Cloud Sync Button - Tablet / Desktop only */}
            <button
              onClick={onOpenSyncModal}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                syncStatus === 'synced'
                  ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white border-black/15 dark:border-white/20'
                  : syncStatus === 'syncing'
                  ? 'bg-black/10 dark:bg-white/15 text-black dark:text-white border-black/20 dark:border-white/30'
                  : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-black/10 dark:border-white/10'
              }`}
              title="Cloud Multi-Device Sync"
              aria-label="Cloud sync status"
            >
              <Cloud className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline text-[11px] font-bold">
                {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing' : 'Link'}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus === 'synced' ? 'bg-black dark:bg-white' : syncStatus === 'syncing' ? 'bg-zinc-400 animate-pulse' : 'border border-black dark:border-white'
                }`}
              />
            </button>

            {/* Push Notifications Trigger - Tablet / Desktop only */}
            <button
              onClick={onOpenNotificationModal}
              className="hidden sm:flex items-center justify-center p-2 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white rounded-xl glass-button hover:border-black/20 dark:hover:border-white/30 transition-colors relative"
              title="Notifications"
              aria-label="Push notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
            </button>

            {/* Dark Mode Quick Toggle */}
            <button
              onClick={toggleDarkQuick}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white rounded-xl glass-button hover:border-black/20 dark:hover:border-white/30 transition-colors shrink-0"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />}
            </button>

            {/* Settings Trigger with Sync Badge on mobile */}
            <button
              onClick={onOpenSettingsModal}
              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl transition-colors glass-button relative shrink-0 ${
                highContrast
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
              }`}
              title="Settings"
              aria-label="Settings"
            >
              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {/* Subtle sync status indicator dot on mobile */}
              <span
                className={`sm:hidden absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-black ${
                  syncStatus === 'synced'
                    ? 'bg-black dark:bg-white'
                    : syncStatus === 'syncing'
                    ? 'bg-zinc-400 animate-pulse'
                    : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
              />
            </button>

            {/* User Account / Avatar (Shown if logged in, or on tablet/desktop) */}
            {user ? (
              <button
                onClick={onOpenSyncModal}
                className="flex items-center p-0.5 rounded-full border border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white transition-all shrink-0"
                title={user.displayName || user.email || 'User Profile & Sync'}
                aria-label="User profile and sync"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full grayscale object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-[10px] sm:text-xs flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={onOpenSyncModal}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-bold transition-all shadow-xs shrink-0"
                aria-label="Sync account"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sync</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
