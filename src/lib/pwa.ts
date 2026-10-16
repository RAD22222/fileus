/** Android haptics + installed-app detection helpers. */

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    // iOS safe-area trick
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function vibrate(pattern: number | number[]): void {
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    // ignore — haptics unsupported
  }
}

/** Frozen-safe double-pulse: habit ticked on */
export const hapticTick = () => vibrate(12);
/** Habit unticked / revert */
export const hapticUndo = () => vibrate([8, 30, 8]);
/** Milestone / celebration */
export const hapticCelebrate = () => vibrate([20, 60, 20, 60, 40]);
/** Small nudge (stepper) */
export const hapticNudge = () => vibrate(8);

/** Deferred beforeinstallprompt event captured for the Settings install button. */
let deferredPrompt: any = null;

export function captureInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new Event('habitpulse:install-available'));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new Event('habitpulse:installed'));
  });
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome;
}

export function canPromptInstall(): boolean {
  return deferredPrompt != null;
}
