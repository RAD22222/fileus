import React, { useEffect, useState } from 'react';
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
  Smartphone,
  Copy,
  Share2,
} from 'lucide-react';
import { useTheme, COLOR_SCHEMES } from '../context/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { toneHex } from '../lib/dynamicColor';
import { canPromptInstall, promptInstall, isStandalonePwa, hapticTick } from '../lib/pwa';
import { todayLocalStr } from '../lib/date';
import { buildSyncCode, packLink, extractCodeFrom } from '../lib/syncPack';
import { requestSyncRestore } from './SyncRestoreSheet';

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
    customHue,
    setCustomHue,
  } = useTheme();

  const { exportBackup, importBackup } = useAppData();

  // Live preview swatch for the custom hue (tone 40 light / 80 dark / 90 container)
  const customSwatch = `#${toneHex(40, 0.13, customHue)}`;
  const customSwatchDark = `#${toneHex(80, 0.13, customHue)}`;
  const customSwatch2 = `#${toneHex(90, 0.13, customHue)}`;

  // PWA install state
  const [installedPwa, setInstalledPwa] = useState(isStandalonePwa());
  const [installReady, setInstallReady] = useState(canPromptInstall());
  useEffect(() => {
    const onReady = () => setInstallReady(true);
    const onInstalled = () => {
      setInstalledPwa(true);
      setInstallReady(false);
    };
    window.addEventListener('habitpulse:install-available', onReady);
    window.addEventListener('habitpulse:installed', onInstalled);
    return () => {
      window.removeEventListener('habitpulse:install-available', onReady);
      window.removeEventListener('habitpulse:installed', onInstalled);
    };
  }, []);
  const handleInstall = async () => {
    await promptInstall();
  };
  void COLOR_SCHEMES;
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncCopied, setSyncCopied] = useState(false);
  const [syncShared, setSyncShared] = useState(false);
  const [syncPaste, setSyncPaste] = useState('');
  const [syncError, setSyncError] = useState(false);

  if (!isOpen) return null;

  const resetSyncFlags = () => {
    setTimeout(() => {
      setSyncCopied(false);
      setSyncShared(false);
      setSyncBusy(false);
    }, 2000);
  };

  const handleCopySyncCode = async () => {
    hapticTick();
    setSyncBusy(true);
    try {
      const code = await buildSyncCode();
      await navigator.clipboard.writeText(code);
      setSyncCopied(true);
      setSyncError(false);
      resetSyncFlags();
    } catch {
      setSyncError(true);
      setSyncBusy(false);
    }
  };

  const handleShareSyncLink = async () => {
    hapticTick();
    setSyncBusy(true);
    try {
      const code = await buildSyncCode();
      const link = packLink(code);
      const shareData = {
        title: 'HabitPulse — my habits',
        text: 'Open to bring my HabitPulse routines to this device:',
        url: link,
      };
      if (navigator.share) {
        await navigator.share(shareData);
        setSyncShared(true);
      } else {
        await navigator.clipboard.writeText(link);
        setSyncShared(true);
      }
      setSyncError(false);
      resetSyncFlags();
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setSyncBusy(false); // user cancelled the share sheet
        return;
      }
      setSyncError(true);
      setSyncBusy(false);
    }
  };

  const handleImportSyncCode = () => {
    hapticTick();
    const code = extractCodeFrom(syncPaste);
    if (!code) {
      setSyncError(true);
      return;
    }
    setSyncError(false);
    // The restore sheet pops (validates, previews, replaces data on confirm).
    requestSyncRestore(code);
  };

  const handleExportBackup = () => {
    const jsonBlob = new Blob([exportBackup()], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HabitPulse-Backup-${todayLocalStr()}.json`;
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
                ...(
                  colorScheme === 'custom'
                    ? [{
                        id: 'custom' as const,
                        label: 'Custom',
                        primary: customSwatch,
                        primaryDark: customSwatchDark,
                        container: customSwatch2,
                      }]
                    : [{
                        id: 'custom' as const,
                        label: 'Custom color',
                        primary: 'transparent',
                        primaryDark: 'transparent',
                        container: 'transparent',
                      }]
                ),
              ]).map(opt => {
                const selected = colorScheme === opt.id;
                const isCustomSlot = opt.id === 'custom';
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
                      {isCustomSlot && !selected ? (
                        <span
                          className="w-12 h-12 rounded-full shrink-0 -ml-1"
                          style={{
                            background: 'conic-gradient(#f14e4e, #f1a24e, #e6e54e, #56e358, #4ed7f1, #735ef1, #f14ec4, #f14e4e)',
                            boxShadow: 'var(--md-elevation-1)',
                          }}
                          aria-hidden="true"
                        />
                      ) : (
                        <>
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
                        </>
                      )}
                      {selected && (
                        <Check className="w-4 h-4 ml-auto shrink-0" strokeWidth={3} style={{ color: 'var(--md-primary)' }} />
                      )}
                    </div>
                    {(!isCustomSlot || selected) && (
                      <div className="flex items-center gap-1 mb-1.5" aria-hidden="true">
                        <span className="flex-1 h-4 rounded-l-full" style={{ background: opt.container }} />
                        <span className="flex-1 h-4" style={{ background: opt.primary }} />
                        <span className="flex-1 h-4 rounded-r-full" style={{ background: opt.primaryDark }} />
                      </div>
                    )}
                    <span className="md-label-large block truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {colorScheme === 'custom' && (
              <div className="mt-3 space-y-2">
                <div
                  className="h-8 w-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${customSwatch2}, ${customSwatch}, ${customSwatchDark})`,
                  }}
                  aria-hidden="true"
                />
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={customHue}
                  onChange={(e) => setCustomHue(Number(e.target.value))}
                  className="md-slider w-full"
                  style={{ ['--md-slider-progress' as string]: `${(customHue / 360) * 100}%` }}
                  aria-label="Source color hue"
                />
                <div className="flex items-center justify-between md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                  <span>Drag to re-tint the whole app — Material You style</span>
                  <span className="font-mono">{customHue}°</span>
                </div>
              </div>
            )}

            <p className="md-body-small mt-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              Applied instantly in light and dark mode.
            </p>
          </section>

          {/* Install the app (PWA) */}
          <section>
            <h3 className="md-title-small mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              Install app
            </h3>
            {installedPwa ? (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}>
                <Check className="w-5 h-5" />
                <span className="md-body-medium">
                  Running as an installed app — works offline
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleInstall}
                  className="md-button md-button--filled md-ripple"
                  disabled={!canPromptInstall()}
                  style={canPromptInstall() ? undefined : { opacity: 0.6 }}
                >
                  <Smartphone className="w-4 h-4" />
                  {canPromptInstall() ? 'Add to Home screen' : 'Not available yet'}
                </button>
                <span className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                  Fullscreen, offline mode, reminders — no store needed.
                </span>
              </div>
            )}
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

          {/* Sync between devices — backend-free sync pack */}
          <section>
            <h3 className="md-title-small mb-1 flex items-center gap-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              <Smartphone className="w-4 h-4" />
              Sync between devices
            </h3>
            <p className="md-body-small mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              Move everything (habits, history, journal, settings) to another device — no account, nothing sent to a server. The code carries your data inside it. Anyone with the code can read it.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleShareSyncLink}
                disabled={syncBusy}
                className="md-button md-button--filled md-ripple"
              >
                {syncShared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {syncBusy ? 'Packing…' : syncShared ? 'Shared' : 'Share link'}
              </button>
              <button
                onClick={handleCopySyncCode}
                disabled={syncBusy}
                className="md-button md-button--tonal md-ripple"
              >
                {syncCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {syncCopied ? 'Copied' : 'Copy code'}
              </button>
            </div>
            <p className="md-body-small mt-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              On the other device: open <span className="font-mono select-text">fileus.vercel.app</span> with the link, or paste the code here:
            </p>
            <div className="flex gap-2 mt-1.5">
              <input
                value={syncPaste}
                onChange={(e) => setSyncPaste(e.target.value)}
                placeholder="HBPULSE…"
                className="md-text-field__input flex-1"
                style={{ fontFamily: 'var(--md-font-mono)', fontSize: '0.8rem' }}
                aria-label="Paste sync code"
              />
              <button
                onClick={handleImportSyncCode}
                disabled={!syncPaste.trim() || syncBusy}
                className="md-button md-button--tonal md-ripple shrink-0"
              >
                Restore
              </button>
            </div>
            {syncError && (
              <p className="md-body-small mt-1.5" style={{ color: 'var(--md-error)' }}>
                That code couldn't be read — check that it wasn't cut off.
              </p>
            )}
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
