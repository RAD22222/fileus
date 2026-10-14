import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Eye,
  Type,
  Download,
  X,
  Check,
  Cloud,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuthAndSync } from '../context/AuthAndSyncContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSyncModal?: () => void;
  onOpenNotificationModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenSyncModal,
  onOpenNotificationModal,
}) => {
  const {
    theme,
    setTheme,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
  } = useTheme();

  const { routines, tasks, completions, user, syncStatus } = useAuthAndSync();
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      user: user?.email || 'guest',
      routines,
      tasks,
      completions,
    };
    const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HabitPulse-Backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="glass-modal rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-7 pb-8 sm:pb-7 border border-black/15 dark:border-white/15 space-y-4 sm:space-y-5 relative max-h-[90dvh] overflow-y-auto">
        
        {/* Mobile drag handle */}
        <div className="sm:hidden w-10 h-1 bg-black/20 dark:bg-white/20 rounded-full mx-auto -mt-1 mb-2 shrink-0" />

        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 text-zinc-400 hover:text-black dark:hover:text-white p-2 rounded-xl transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pr-8">
          <span className="text-xs sm:text-sm font-mono uppercase tracking-widest text-zinc-500">System Preferences</span>
          <h3 className="text-lg sm:text-xl font-black text-black dark:text-white">
            Display & Connectivity
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Fine-tune contrast, font scales, cloud sync, and theme preferences.
          </p>
        </div>

        {/* Quick Hub for Cloud Sync and Notifications (Especially useful for Mobile) */}
        <div className="space-y-2">
          {onOpenSyncModal && (
            <button
              onClick={onOpenSyncModal}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl glass-button text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-black dark:text-white flex items-center gap-1.5">
                    <span>Cloud Multi-Device Sync</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {user ? `Linked: ${user.email || user.displayName}` : 'Sync code & device linking'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
            </button>
          )}

          {onOpenNotificationModal && (
            <button
              onClick={onOpenNotificationModal}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl glass-button text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-black dark:text-white">
                    Push Notifications & Sounds
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Scheduled browser alerts and chime settings
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
            </button>
          )}
        </div>

        {/* Theme mode buttons */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-black dark:text-white">
            Monochrome Theme Mode:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`min-h-[42px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                theme === 'light'
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                  : 'glass-button text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`min-h-[42px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                theme === 'dark'
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                  : 'glass-button text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`min-h-[42px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                theme === 'system'
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                  : 'glass-button text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Auto</span>
            </button>
          </div>
        </div>

        {/* High contrast */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl glass-button">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-black dark:text-white" />
              <span className="text-xs font-mono font-bold text-black dark:text-white">
                High Contrast Mode
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Heightens border definition and contrast for readability.
            </p>
          </div>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 shrink-0 ${
              highContrast ? 'bg-black dark:bg-white' : 'bg-black/20 dark:bg-white/20'
            }`}
            role="switch"
            aria-checked={highContrast}
          >
            <div
              className={`w-4 h-4 rounded-full ${highContrast ? 'bg-white dark:bg-black translate-x-6' : 'bg-white dark:bg-black translate-x-0'} transition-transform`}
            />
          </button>
        </div>

        {/* Typography scale */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-black dark:text-white flex items-center gap-1.5">
            <Type className="w-4 h-4" />
            <span>Font Scale:</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFontSize('normal')}
              className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                fontSize === 'normal'
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                  : 'glass-button text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Standard (100%)
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                fontSize === 'large'
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                  : 'glass-button text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Large (112%)
            </button>
          </div>
        </div>

        {/* Backup export */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
          <label className="text-xs font-mono font-bold text-black dark:text-white">
            Data Portability:
          </label>
          <button
            onClick={handleExportBackup}
            className="w-full min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl glass-button text-black dark:text-white text-xs font-mono font-bold transition-colors"
          >
            {exportSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{exportSuccess ? 'Downloaded Backup' : 'Export JSON Backup'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
