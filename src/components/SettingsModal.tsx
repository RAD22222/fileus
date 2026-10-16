import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Eye,
  Type,
  Download,
  Upload,
  X,
  Check,
  Bell,
  ChevronRight,
  Database,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAppData } from '../context/AppDataContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNotificationModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenNotificationModal,
}) => {
  const {
    theme,
    setTheme,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    colorScheme,
    setColorScheme,
  } = useTheme();

  const { exportBackup, importBackup } = useAppData();
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState(false);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    const jsonBlob = new Blob([exportBackup()], {
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

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        importBackup(parsed);
        setImportSuccess(true);
        setImportError(false);
        setTimeout(() => setImportSuccess(false), 2000);
      } catch {
        setImportError(true);
        setTimeout(() => setImportError(false), 2500);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="md-scrim" onClick={onClose}>
      <div
        className="md-bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="md-bottom-sheet__handle" aria-hidden="true" />

        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <div className="md-label-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
              Preferences
            </div>
            <h2 className="md-headline-small">Settings</h2>
          </div>
          <button onClick={onClose} className="md-icon-button md-ripple" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Notifications shortcut */}
          {onOpenNotificationModal && (
            <button onClick={onOpenNotificationModal} className="md-list-item md-ripple">
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
              >
                <Bell className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="md-body-large block">Notifications &amp; sounds</span>
                <span className="md-body-small block" style={{ color: 'var(--md-on-surface-variant)' }}>
                  Reminders and completion chimes
                </span>
              </span>
              <ChevronRight className="w-5 h-5 shrink-0" style={{ color: 'var(--md-on-surface-variant)' }} />
            </button>
          )}

          {/* Theme */}
          <section>
            <h3 className="md-title-small mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              Theme
            </h3>
            <div className="md-segmented w-full">
              {([
                { id: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
                { id: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
                { id: 'system', label: 'Auto', icon: <Laptop className="w-4 h-4" /> },
              ] as { id: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }[]).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`md-segmented__item md-ripple flex-1${theme === opt.id ? ' md-segmented__item--selected' : ''}`}
                  aria-pressed={theme === opt.id}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Color scheme (Material You source palette) */}
          <section>
            <h3 className="md-title-small mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              Color
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {([
                {
                  id: 'green' as const,
                  label: 'Meadow',
                  primary: '#007232',
                  primaryDark: '#7be193',
                  container: '#98feaf',
                },
                {
                  id: 'blue' as const,
                  label: 'Android Blue',
                  primary: '#2a5da6',
                  primaryDark: '#a4c9ff',
                  container: '#d2e4ff',
                },
              ]).map(opt => {
                const selected = colorScheme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setColorScheme(opt.id)}
                    className="relative rounded-2xl border text-left overflow-hidden md-ripple"
                    style={{
                      background: 'var(--md-surface-container-low)',
                      borderColor: selected ? 'var(--md-primary)' : 'var(--md-outline-variant)',
                      borderWidth: selected ? 2 : 1,
                      padding: '0.75rem 0.875rem',
                    }}
                    aria-pressed={selected}
                    aria-label={`${opt.label} color`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-6 h-6 rounded-full shrink-0"
                        style={{ background: opt.primary, boxShadow: 'var(--md-elevation-1)' }}
                        aria-hidden="true"
                      />
                      <span
                        className="w-6 h-6 rounded-full shrink-0"
                        style={{ background: opt.primaryDark, border: '2px solid var(--md-surface-container-highest)' }}
                        aria-hidden="true"
                      />
                      {selected && (
                        <Check className="w-4 h-4 ml-auto shrink-0" strokeWidth={3} style={{ color: 'var(--md-primary)' }} />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-1.5" aria-hidden="true">
                      <span className="flex-1 h-4 rounded-l-full" style={{ background: opt.container }} />
                      <span className="flex-1 h-4" style={{ background: opt.primary }} />
                      <span className="flex-1 h-4 rounded-r-full" style={{ background: opt.primaryDark }} />
                    </div>
                    <span className="md-label-large block truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="md-body-small mt-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              Applied instantly in light and dark mode.
            </p>
          </section>

          {/* High contrast switch */}
          <div className="flex items-center gap-4 py-1">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
            >
              <Eye className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="md-body-large block">High contrast</span>
              <span className="md-body-small block" style={{ color: 'var(--md-on-surface-variant)' }}>
                Stronger borders for readability
              </span>
            </span>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`md-switch${highContrast ? ' md-switch--on' : ''}`}
              role="switch"
              aria-checked={highContrast}
              aria-label="High contrast"
            >
              <span className="md-switch__thumb">
                {highContrast && <Check className="w-3 h-3" strokeWidth={3} />}
              </span>
            </button>
          </div>

          <hr className="md-divider" />

          {/* Font scale */}
          <section>
            <h3 className="md-title-small mb-2 flex items-center gap-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              <Type className="w-4 h-4" />
              Font scale
            </h3>
            <div className="md-segmented w-full">
              {([
                { id: 'normal', label: 'Standard' },
                { id: 'large', label: 'Large' },
              ] as { id: 'normal' | 'large'; label: string }[]).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFontSize(opt.id)}
                  className={`md-segmented__item md-ripple flex-1${fontSize === opt.id ? ' md-segmented__item--selected' : ''}`}
                  aria-pressed={fontSize === opt.id}
                >
                  {fontSize === opt.id && <Check className="w-4 h-4" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <hr className="md-divider" />

          {/* Backup & restore */}
          <section>
            <h3 className="md-title-small mb-1 flex items-center gap-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              <Database className="w-4 h-4" />
              Backup &amp; restore
            </h3>
            <p className="md-body-small mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              Your data lives in this browser. Export a file to keep a copy or move to another device.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportBackup}
                className="md-button md-button--tonal md-ripple"
              >
                {exportSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                {exportSuccess ? 'Saved' : 'Export'}
              </button>
              <button
                onClick={() => document.getElementById('habitpulse-import-input')?.click()}
                className="md-button md-button--outlined md-ripple"
              >
                {importSuccess ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {importSuccess ? 'Restored' : 'Import'}
              </button>
            </div>
            {importError && (
              <p className="md-body-small mt-2" style={{ color: 'var(--md-error)' }}>
                That file couldn't be read — nothing was changed.
              </p>
            )}
            <input
              id="habitpulse-import-input"
              type="file"
              accept="application/json,.json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </section>
        </div>
      </div>
    </div>
  );
};
