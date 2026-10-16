import React, { useState } from 'react';
import { X, Send, Flame } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewPostModal: React.FC<NewPostModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addCommunityPost, todayStats, routines } = useAppData();

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
    <div className="md-scrim" onClick={onClose}>
      <div
        className="md-bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Share habit breakthrough"
      >
        <div className="md-bottom-sheet__handle" aria-hidden="true" />

        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <div className="md-label-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
              Share progress
            </div>
            <h2 className="md-headline-small">Share a habit win</h2>
          </div>
          <button onClick={onClose} className="md-icon-button md-ripple" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="md-card md-card--filled flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 md-title-small">
            <Flame className="w-5 h-5" strokeWidth={2.5} style={{ color: 'var(--md-primary)' }} />
            <span>Attaching {todayStats.currentStreak}-day streak</span>
          </div>
          <span className="md-label-large font-mono" style={{ color: 'var(--md-on-surface-variant)' }}>
            {todayStats.completionPercentage}% today
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="md-text-field">
            <input
              className="md-text-field__input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder=" "
              maxLength={120}
            />
            <span className="md-text-field__label">Headline</span>
          </label>

          <label className="md-text-field md-text-field--select">
            <select
              className="md-text-field__input"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
            >
              {routines.map(r => (
                <option key={r.id} value={r.title}>
                  {r.title}
                </option>
              ))}
              <option value="Daily Routine Protocol">General</option>
            </select>
            <span className="md-text-field__label">Associated routine</span>
            <span className="md-text-field__arrow" aria-hidden="true">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </label>

          <label className="md-text-field md-text-field--textarea">
            <textarea
              className="md-text-field__input"
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder=" "
              maxLength={600}
            />
            <span className="md-text-field__label">Reflection / notes</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="md-button md-button--text md-ripple">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="md-button md-button--filled md-ripple"
            >
              <Send className="w-4 h-4" />
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
