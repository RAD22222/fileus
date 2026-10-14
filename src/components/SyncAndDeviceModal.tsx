import React, { useState } from 'react';
import {
  Cloud,
  Laptop,
  Smartphone,
  Tablet,
  Copy,
  Check,
  RefreshCw,
  LogIn,
  LogOut,
  X,
} from 'lucide-react';
import { useAuthAndSync } from '../context/AuthAndSyncContext';

interface SyncAndDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncAndDeviceModal: React.FC<SyncAndDeviceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    user,
    syncStatus,
    lastSyncTime,
    deviceId,
    syncCode,
    signInWithGoogle,
    signOutUser,
    triggerManualSync,
    routines,
    tasks,
    completions,
  } = useAuthAndSync();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDeviceId, setCopiedDeviceId] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedDeviceId(true);
    setTimeout(() => setCopiedDeviceId(false), 2000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await triggerManualSync();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError('Sign-in cancelled or popup blocked. Please allow popups.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="glass-modal rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-7 pb-8 sm:pb-7 border border-black/15 dark:border-white/15 space-y-4 sm:space-y-5 relative max-h-[90dvh] overflow-y-auto">
        
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
          <span className="text-sm font-mono uppercase tracking-widest text-zinc-500">Cloud Sync Architecture</span>
          <h3 className="text-lg sm:text-xl font-black text-black dark:text-white">
            Multi-Device Synchronization
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time Firestore persistence across your phone, tablet, and computer.
          </p>
        </div>

        {/* Status Card */}
        <div className="p-4 rounded-2xl glass-card border border-black/15 dark:border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              syncStatus === 'synced' ? 'bg-black dark:bg-white' : syncStatus === 'syncing' ? 'bg-zinc-400 animate-pulse' : 'border border-black dark:border-white'
            }`} />
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white">
                {syncStatus === 'synced'
                  ? 'Real-Time Sync Active'
                  : syncStatus === 'syncing'
                  ? 'Syncing with Firestore...'
                  : 'Local Storage Mode'}
              </div>
              <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                {lastSyncTime
                  ? `Last verified: ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : 'Changes cached locally'}
              </div>
            </div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl glass-button text-black dark:text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
            title="Force sync"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Account Authentication */}
        <div className="p-4 rounded-2xl glass-button space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-black dark:text-white">Cloud Account</span>
            <span className="text-zinc-400">{user ? 'Google Linked' : 'Guest Mode'}</span>
          </div>

          {user ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-9 h-9 rounded-full grayscale object-cover border border-black/20 dark:border-white/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-black dark:bg-white text-white dark:text-black font-mono font-bold text-xs flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-black dark:text-white truncate">
                    {user.displayName || 'Habit Member'}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 truncate">{user.email}</div>
                </div>
              </div>

              <button
                onClick={signOutUser}
                className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-button text-xs font-mono font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Sign in with Google to synchronize routines across multiple devices automatically.
              </p>
              <button
                onClick={handleGoogleSignIn}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold shadow-sm transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google Cloud</span>
              </button>
              {authError && (
                <p className="text-[11px] font-mono text-zinc-500 text-center">{authError}</p>
              )}
            </div>
          )}
        </div>

        {/* Pairing Code */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <label className="font-bold text-black dark:text-white">Device Pairing Code</label>
            <span className="text-zinc-400">Sync code</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 glass-button px-4 py-2.5 rounded-xl font-mono text-base font-black text-black dark:text-white tracking-widest text-center">
              {syncCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold transition-all shrink-0"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] font-mono text-zinc-500">
            Open HabitPulse on your phone or tablet to access your identical schedule in real-time.
          </p>
        </div>

        {/* Multi-Device Visual Strip */}
        <div className="p-3.5 rounded-2xl glass-button">
          <div className="flex items-center justify-around text-center py-1">
            <div className="flex flex-col items-center gap-1">
              <Laptop className="w-4 h-4 text-black dark:text-white" />
              <span className="text-[10px] font-mono text-zinc-500">Desktop</span>
            </div>
            <span className="text-xs font-mono text-zinc-400">⇄</span>
            <div className="flex flex-col items-center gap-1">
              <Smartphone className="w-4 h-4 text-black dark:text-white" />
              <span className="text-[10px] font-mono text-zinc-500">Mobile</span>
            </div>
            <span className="text-xs font-mono text-zinc-400">⇄</span>
            <div className="flex flex-col items-center gap-1">
              <Tablet className="w-4 h-4 text-black dark:text-white" />
              <span className="text-[10px] font-mono text-zinc-500">Tablet</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-black/5 dark:border-white/5">
          <span>{routines.length} routines · {tasks.length} tasks</span>
          <button onClick={handleCopyDeviceId} className="hover:text-black dark:hover:text-white">
            {copiedDeviceId ? 'Copied ID' : `ID: ${deviceId.substring(0, 10)}...`}
          </button>
        </div>

      </div>
    </div>
  );
};
