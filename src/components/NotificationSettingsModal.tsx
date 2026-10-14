import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  X,
  Send,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return notificationService.permissionStatus;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('habitpulse_sound_enabled') !== 'false';
  });

  const [leadTime, setLeadTime] = useState<number>(() => {
    return Number(localStorage.getItem('habitpulse_lead_time') || 5);
  });

  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const status = await notificationService.requestPermission();
    setPermission(status);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('habitpulse_sound_enabled', String(next));
    if (next) {
      notificationService.playChime('alert');
    }
  };

  const handleSelectLeadTime = (mins: number) => {
    setLeadTime(mins);
    localStorage.setItem('habitpulse_lead_time', String(mins));
  };

  const handleSendTestNotification = () => {
    notificationService.sendNotification('HabitPulse Routine Alert (Test)', {
      body: 'Scheduled routine: "Morning Priming Protocol" is active. Focus time!',
      playSound: soundEnabled,
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="glass-modal rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-7 pb-8 sm:pb-7 border border-black/15 dark:border-white/15 space-y-4 sm:space-y-5 relative max-h-[90dvh] overflow-y-auto">
        
        {/* Mobile handle */}
        <div className="sm:hidden w-10 h-1 bg-black/20 dark:bg-white/20 rounded-full mx-auto -mt-1 mb-2 shrink-0" />

        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 text-zinc-400 hover:text-black dark:hover:text-white p-2 rounded-xl transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pr-8">
          <span className="text-sm font-mono uppercase tracking-widest text-zinc-500">Alerts & Audio</span>
          <h3 className="text-lg sm:text-xl font-black text-black dark:text-white">
            Push Notifications & Chimes
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Never miss scheduled habits with native push notifications and acoustic chimes.
          </p>
        </div>

        {/* Permission Status */}
        <div className="p-4 rounded-2xl glass-card border border-black/15 dark:border-white/15 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-black dark:text-white">System Permission</span>
            <span className="uppercase font-bold text-zinc-500">
              {permission === 'granted' ? 'Active' : permission === 'denied' ? 'Blocked' : 'Unset'}
            </span>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {permission === 'granted'
              ? 'Push notifications are authorized. You will receive alerts even when HabitPulse is in the background.'
              : 'Grant browser permission to receive scheduled reminders.'}
          </p>

          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold shadow-sm transition-all active:scale-95"
            >
              <Bell className="w-4 h-4" />
              <span>Enable Push Notifications</span>
            </button>
          )}
        </div>

        {/* Chime toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl glass-button">
          <div className="space-y-0.5">
            <span className="text-xs font-mono font-bold text-black dark:text-white">
              Web Audio Melodic Chimes
            </span>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Plays acoustic synthesis upon completion or alerts.
            </p>
          </div>
          <button
            onClick={handleToggleSound}
            className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition-all border ${
              soundEnabled
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                : 'glass-button text-zinc-400'
            }`}
            title={soundEnabled ? 'Disable sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Lead Time */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-black dark:text-white">
            Lead Time Reminder:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 0, label: 'Exact time' },
              { value: 5, label: '5m before' },
              { value: 15, label: '15m before' },
            ].map(item => (
              <button
                key={item.value}
                onClick={() => handleSelectLeadTime(item.value)}
                className={`min-h-[42px] py-2 px-2.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                  leadTime === item.value
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                    : 'glass-button text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test Notification */}
        <div className="pt-2">
          <button
            onClick={handleSendTestNotification}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-button text-black dark:text-white text-xs font-mono font-bold transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testSent ? 'Dispatched' : 'Test Notification & Chime'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
