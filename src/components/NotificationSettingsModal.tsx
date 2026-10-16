import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  X,
  Send,
  Check,
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
    notificationService.sendNotification('HabitPulse routine alert (test)', {
      body: 'Scheduled routine: "Morning Priming Protocol" is active. Focus time!',
      playSound: soundEnabled,
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  const statusLabel = permission === 'granted' ? 'Active' : permission === 'denied' ? 'Blocked' : 'Not set';

  return (
    <div className="md-scrim" onClick={onClose}>
      <div
        className="md-bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Notification settings"
      >
        <div className="md-bottom-sheet__handle" aria-hidden="true" />

        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <div className="md-label-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
              Alerts
            </div>
            <h2 className="md-headline-small">Notifications</h2>
          </div>
          <button onClick={onClose} className="md-icon-button md-ripple" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Permission */}
          <section className="md-card md-card--filled space-y-3">
            <div className="flex items-center justify-between">
              <span className="md-title-small">System permission</span>
              <span
                className="md-chip md-chip--assist"
                style={
                  permission === 'granted'
                    ? { background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)', borderColor: 'transparent' }
                    : undefined
                }
              >
                {permission === 'granted' && <Check className="w-4 h-4" />}
                {statusLabel}
              </span>
            </div>
            <p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
              {permission === 'granted'
                ? 'Push notifications are authorized. HabitPulse can alert you before each scheduled habit.'
                : 'Allow browser notifications to get reminders before each scheduled habit.'}
            </p>
            {permission !== 'granted' && (
              <button onClick={handleRequestPermission} className="md-button md-button--filled md-ripple w-full">
                <Bell className="w-4 h-4" />
                Enable push notifications
              </button>
            )}
          </section>

          {/* Sound switch */}
          <div className="flex items-center gap-4 py-1">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="md-body-large block">Completion chimes</span>
              <span className="md-body-small block" style={{ color: 'var(--md-on-surface-variant)' }}>
                Melodic sounds on check-off and reminders
              </span>
            </span>
            <button
              onClick={handleToggleSound}
              className={`md-switch${soundEnabled ? ' md-switch--on' : ''}`}
              role="switch"
              aria-checked={soundEnabled}
              aria-label="Completion chimes"
            >
              <span className="md-switch__thumb">
                {soundEnabled && <Check className="w-3 h-3" strokeWidth={3} />}
              </span>
            </button>
          </div>

          <hr className="md-divider" />

          {/* Lead time */}
          <section>
            <h3 className="md-title-small mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              Remind me
            </h3>
            <div className="md-segmented w-full">
              {([
                { value: 0, label: 'On time' },
                { value: 5, label: '5 min before' },
                { value: 15, label: '15 min before' },
              ]).map(item => (
                <button
                  key={item.value}
                  onClick={() => handleSelectLeadTime(item.value)}
                  className={`md-segmented__item md-ripple flex-1${leadTime === item.value ? ' md-segmented__item--selected' : ''}`}
                  aria-pressed={leadTime === item.value}
                >
                  {leadTime === item.value && <Check className="w-4 h-4" />}
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          {/* Test */}
          <button onClick={handleSendTestNotification} className="md-button md-button--tonal md-ripple w-full">
            {testSent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {testSent ? 'Dispatched' : 'Send test notification'}
          </button>

          <p className="md-body-small flex items-center gap-2" style={{ color: 'var(--md-on-surface-variant)' }}>
            <BellRing className="w-4 h-4 shrink-0" />
            Reminders are checked every 30 seconds while HabitPulse is open.
          </p>
        </div>
      </div>
    </div>
  );
};
