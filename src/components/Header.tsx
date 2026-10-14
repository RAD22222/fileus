import React from 'react';
import {
  Flame,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sliders,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  scrolled?: boolean;
  onOpenNotificationModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  scrolled = false,
  onOpenNotificationModal,
  onOpenSettingsModal,
}) => {
  const {
    todayStats,
    selectedDate,
    setSelectedDate,
  } = useAppData();

  const { isDark, toggleDarkQuick } = useTheme();

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
    <header
      className={`md-top-app-bar${scrolled ? ' md-top-app-bar--scrolled' : ''}`}
      role="banner"
    >
      {/* App logo */}
      <div
        className="w-9 h-9 shrink-0 flex items-center justify-center font-bold text-sm rounded-xl"
        style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
        aria-hidden="true"
      >
        HP
      </div>

      {/* Title */}
      <div className="hidden sm:block ml-2 mr-1 min-w-0">
        <div className="md-title-large leading-tight truncate">HabitPulse</div>
        <div className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>
          Daily Habit Architecture
        </div>
      </div>
      <span className="sm:hidden md-title-large ml-2 mr-auto truncate">HabitPulse</span>

      <div className="flex-1 hidden sm:block" />

      {/* Streak — assist chip */}
      <div
        className="md-chip md-chip--assist hidden md:inline-flex"
        title={`Streak: ${todayStats.currentStreak} days`}
      >
        <Flame
          className="w-4 h-4"
          strokeWidth={2.5}
          style={{ color: 'var(--md-primary)' }}
        />
        <span className="font-mono">{todayStats.currentStreak}d</span>
      </div>

      {/* Date navigation — MD3 segmented button */}
      <div className="md-segmented" role="group" aria-label="Select date">
        <button
          onClick={handlePrevDay}
          className="md-segmented__item md-ripple px-2"
          title="Previous Day"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleSetToday}
          className="md-segmented__item md-ripple min-w-[5rem] px-2"
          title={isSelectedDateToday ? 'Today' : `Selected: ${formatDisplayDate(selectedDate)}`}
        >
          <Calendar className="w-4 h-4" />
          <span className="md-label-large whitespace-nowrap">
            {isSelectedDateToday ? 'Today' : formatDisplayDate(selectedDate)}
          </span>
        </button>
        <button
          onClick={handleNextDay}
          className="md-segmented__item md-ripple px-2"
          title="Next Day"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Actions */}
      <button
        onClick={toggleDarkQuick}
        className="md-icon-button md-ripple"
        title={isDark ? 'Light Mode' : 'Dark Mode'}
        aria-label="Toggle dark mode"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      <button
        onClick={onOpenNotificationModal}
        className="md-icon-button md-ripple relative"
        title="Notifications"
        aria-label="Push notifications"
      >
        <Bell className="w-5 h-5" />
        <span
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--md-primary)' }}
        />
      </button>
      <button
        onClick={onOpenSettingsModal}
        className="md-icon-button md-ripple"
        title="Settings"
        aria-label="Settings"
      >
        <Sliders className="w-5 h-5" />
      </button>
    </header>
  );
};
