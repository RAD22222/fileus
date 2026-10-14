// Notification and Web Audio Sound Service

class NotificationService {
  private audioCtx: AudioContext | null = null;
  private inAppListeners: Set<(title: string, body: string, icon?: string) => void> = new Set();
  private sentNotificationsToday: Set<string> = new Set();

  constructor() {
    // Check permission status on load
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // already initialized
    }
  }

  public get permissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public subscribeInApp(listener: (title: string, body: string, icon?: string) => void) {
    this.inAppListeners.add(listener);
    return () => this.inAppListeners.delete(listener);
  }

  // Play pleasant acoustic chime using native Web Audio API
  public playChime(type: 'success' | 'alert' | 'cheer' = 'success') {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      if (type === 'success') {
        // Melodic two-note completion chime (C5 -> G5)
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start(now);
        osc1.stop(now + 0.45);
      } else if (type === 'alert') {
        // Gentle reminder chime (E5 -> A5)
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(880.0, now + 0.12); // A5

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'cheer') {
        // Celebratory triad (C5 - E5 - G5 - C6)
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          if (!this.audioCtx) return;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          const noteTime = now + idx * 0.08;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.2, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.3);
        });
      }
    } catch (e) {
      console.warn('Audio synthesis unavailable:', e);
    }
  }

  // Send desktop push notification with fallback to in-app notification
  public sendNotification(title: string, options: { body: string; icon?: string; tag?: string; playSound?: boolean }): void {
    const { body, icon = '⏰', tag, playSound = true } = options;

    if (playSound) {
      this.playChime('alert');
    }

    // Try native system push notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          tag: tag || 'habitpulse-routine',
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Native notification failed, falling back to in-app toast:', err);
      }
    }

    // Always dispatch to in-app notification center
    this.inAppListeners.forEach(listener => listener(title, body, icon));
  }

  public checkUpcomingTaskReminders(
    tasks: Array<{ id: string; title: string; scheduledTime: string; routineTitle?: string }>,
    completedIds: Set<string>,
    minutesBefore: number = 5,
    soundEnabled: boolean = true
  ) {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMins = now.getMinutes();
    const currentTotalMins = currentHours * 60 + currentMins;
    const todayKey = now.toISOString().split('T')[0];

    tasks.forEach(task => {
      if (!task.scheduledTime || completedIds.has(task.id)) return;

      const [h, m] = task.scheduledTime.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return;

      const taskTotalMins = h * 60 + m;
      const diff = taskTotalMins - currentTotalMins;

      // Trigger if within 0..minutesBefore window and not sent yet today
      const notifKey = `${todayKey}_${task.id}_${task.scheduledTime}`;
      if (diff >= 0 && diff <= minutesBefore && !this.sentNotificationsToday.has(notifKey)) {
        this.sentNotificationsToday.add(notifKey);

        const timeMsg = diff === 0 ? 'Starting now!' : `In ${diff} minute${diff > 1 ? 's' : ''}`;
        this.sendNotification(`Routine Reminder: ${task.title}`, {
          body: `${timeMsg} • ${task.routineTitle || 'Scheduled Routine'}`,
          tag: notifKey,
          playSound: soundEnabled,
        });
      }
    });
  }
}

export const notificationService = new NotificationService();
