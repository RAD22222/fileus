import React from 'react';
import {
  Flame,
  Bell,
  Sun,
  Moon,
  Sliders,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import { DateNavigator } from './DateNavigator';

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
  const { todayStats } = useAppData();
  const { isDark, toggleDarkQuick } = useTheme();

  return (
    <header
      className={`md-top-app-bar${scrolled ? ' md-top-app-bar--scrolled' : ''}`}
      role="banner"
    >
      {/* App logo + name — tablet/desktop only; phones get a clean 64dp title bar */}
      <div
        className="hidden sm:flex w-9 h-9 shrink-0 items-center justify-center font-bold text-sm rounded-xl"
        style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
        aria-hidden="true"
      >
        HP
      </div>

      <div className="hidden sm:block ml-2 mr-1 min-w-0">
        <div className="md-title-large leading-tight truncate">HabitPulse</div>
        <div className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>
          Track your daily habits
        </div>
      </div>
      <span className="sm:hidden md-title-large ml-2 mr-auto truncate min-w-0">HabitPulse</span>

      <div className="flex-1 hidden sm:block" />

      {/* Streak — assist chip (tablet/desktop; phones: shown in the Today score card) */}
      <div className="hidden md:flex">
        <div
          className="md-chip md-chip--assist"
          title={`Streak: ${todayStats.currentStreak} days`}
        >
          <Flame
            className="w-4 h-4"
            strokeWidth={2.5}
            style={{ color: 'var(--md-primary)' }}
          />
          <span>{todayStats.currentStreak}d</span>
        </div>
      </div>

      {/* Date navigation — tablet/desktop only (phones: inside the Today screen) */}
      <div className="hidden sm:block sm:mr-1">
        <DateNavigator />
      </div>

      {/* Actions */}
      <button
        onClick={toggleDarkQuick}
        className="md-icon-button md-ripple"
        title={isDark ? 'Light Mode' : 'Dark Mode'}
        aria-label="Toggle dark mode"
      >
        {isDark ? <Sun className="w-[1.125rem] h-[1.125rem]" /> : <Moon className="w-[1.125rem] h-[1.125rem]" />}
      </button>
      <button
        onClick={onOpenNotificationModal}
        className="md-icon-button md-ripple relative"
        title="Notifications"
        aria-label="Push notifications"
      >
        <Bell className="w-[1.125rem] h-[1.125rem]" />
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
        <Sliders className="w-[1.125rem] h-[1.125rem]" />
      </button>
    </header>
  );
};
