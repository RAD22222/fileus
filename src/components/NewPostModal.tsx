import React, { useState } from 'react';
import {
  X,
  Send,
  Flame,
} from 'lucide-react';
import { useAuthAndSync } from '../context/AuthAndSyncContext';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewPostModal: React.FC<NewPostModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addCommunityPost, todayStats, routines } = useAuthAndSync();

  const [title, setTitle] = useState(`${todayStats.currentStreak}-Day Protocol Streak`);
  const [content, setContent] = useState('');
  const [routineName, setRoutineName] = useState(routines[0]?.title || 'Daily Protocol System');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await addCommunityPost(
        title.trim(),
        content.trim(),
        todayStats.currentStreak,
        routineName
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
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
          <span className="text-xs sm:text-sm font-mono uppercase tracking-widest text-zinc-500">Social Victory</span>
          <h3 className="text-lg sm:text-xl font-black text-black dark:text-white">
            Share Habit Breakthrough
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Inspire your accountability circle and log your active streak.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex items-center justify-between p-3 rounded-xl glass-button text-xs font-mono">
            <div className="flex items-center gap-2 text-black dark:text-white font-bold">
              <Flame className="w-4 h-4 fill-black dark:fill-white text-black dark:text-white" />
              <span>Attaching {todayStats.currentStreak}-day streak badge</span>
            </div>
            <span className="text-zinc-500">{todayStats.completionPercentage}% today</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-black dark:text-white">
              Headline *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Completed 10 consecutive focus sprints"
              maxLength={120}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-base sm:text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-black dark:text-white">
              Associated Routine
            </label>
            <select
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-xs font-mono focus:outline-none"
            >
              {routines.map(r => (
                <option key={r.id} value={r.title}>
                  {r.title}
                </option>
              ))}
              <option value="Daily Routine Protocol">General Protocol</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-black dark:text-white">
              Reflection / Notes *
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what worked, how you navigated friction, and encouragement for peers..."
              maxLength={600}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-base sm:text-xs focus:outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl glass-button text-xs font-mono font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Milestone</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
