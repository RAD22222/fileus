import React, { useEffect, useState } from 'react';
import { RefreshCcw, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  applySyncPack,
  scrubSyncUrl,
  unpackForPreview,
  type SyncPackPayload,
  type SyncPackSummary,
} from '../lib/syncPack';import { hapticTick, hapticCelebrate } from '../lib/pwa';

interface PreviewState {
  code: string;
  payload: SyncPackPayload | null;
  summary: SyncPackSummary | null;
  error: 'foreign' | 'bad' | null;
}

/**
 * MD3 dialog shown when an incoming Sync Pack is pending (opened from a
 * #HBPULSE… link, or pasted in Settings). Confirming replaces ALL local
 * HabitPulse data, then reloads so every context re-reads from storage.
 */
export const SyncRestoreSheet: React.FC = () => {
  const [preview, setPreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    let cancelled = false;
    const open = (e: Event) => {
      const code = ((e as CustomEvent).detail as { code: string })?.code || null;
      if (!code) return;
      hapticTick();
      if (cancelled) return;
      unpackForPreview(code)
        .then(({ payload, summary }) => {
          if (cancelled) return;
          setPreview({ code, payload, summary, error: null });
        })
        .catch((err: Error & { message: string }) => {
          if (cancelled) return;
          setPreview({ code, payload: null, summary: null, error: err.message === 'foreign' ? 'foreign' : 'bad' });
        });
    };
    window.addEventListener('habitpulse:restore', open);
    return () => {
      cancelled = true;
      window.removeEventListener('habitpulse:restore', open);
    };
  }, []);

  const close = (scrub: boolean) => {
    if (scrub) scrubSyncUrl();
    setPreview(null);
  };

  const confirm = () => {
    if (!preview || !preview.payload) return;
    hapticCelebrate();
    scrubSyncUrl();
    applySyncPack(preview.payload);
    window.location.reload();
  };

  if (!preview) return null;

  const fmtDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Restore sync pack"
      onClick={() => close(true)}
    >
      <div
        className="md-sheet-pop w-full sm:max-w-md p-5 pb-8 sm:pb-5 sm:rounded-[1.75rem] rounded-t-[1.75rem]"
        style={{ background: 'var(--md-surface-container-high)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
            >
              <RefreshCcw className="w-5 h-5" />
            </div>
            <h2 className="md-headline-small">Restore habits?</h2>
          </div>
          <button onClick={() => close(true)} className="md-icon-button md-ripple" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {preview.error ? (
          <div className="md-card md-card--outlined flex gap-3 p-4">
            <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: 'var(--md-error)' }} />
            <p className="md-body-medium">
              This code is invalid or belongs to another app. Double-check the code/edit paste and try again.
            </p>
          </div>
        ) : preview.summary && (
          <>
            <p className="md-body-medium mb-3" style={{ color: 'var(--md-on-surface-variant)' }}>
              This will replace everything on this device with the synced backup.
            </p>
            <ul className="md-card md-card--outlined divide-y" style={{ borderColor: 'var(--md-outline-variant)' }}>
              {preview.summary.habits > 0 && (
                <li className="flex items-center gap-3 px-4 py-2.5 md-body-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--md-primary)' }} />
                  {preview.summary.habits} habit{preview.summary.habits === 1 ? '' : 's'}
                </li>
              )}
              {preview.summary.historyDays > 0 && (
                <li className="flex items-center gap-3 px-4 py-2.5 md-body-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--md-primary)' }} />
                  {preview.summary.historyDays}-day completion history
                </li>
              )}
              {preview.summary.journalEntries > 0 && (
                <li className="flex items-center gap-3 px-4 py-2.5 md-body-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--md-primary)' }} />
                  {preview.summary.journalEntries} journal entr{preview.summary.journalEntries === 1 ? 'y' : 'ies'}
                </li>
              )}
            {preview.summary.created > 0 && (
              <li className="flex items-center gap-3 px-4 py-2.5 md-body-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--md-primary)' }} />
                Backed up {fmtDate(preview.summary.created)}
              </li>
            )}
            </ul>
          </>
        )}

        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={() => close(true)} className="md-button md-button--text md-ripple">
            No thanks
          </button>
          {!preview.error && (
            <button onClick={confirm} className="md-button md-button--filled md-ripple">
              <RefreshCcw className="w-4 h-4" />
              Restore &amp; reload
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/** Trigger a restore request from anywhere (Settings paste box, link). */
export function requestSyncRestore(code: string): void {
  window.dispatchEvent(new CustomEvent('habitpulse:restore', { detail: { code } }));
}
