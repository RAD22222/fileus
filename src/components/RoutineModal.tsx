import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Sun,
  Zap,
  Moon,
  Clock,
} from 'lucide-react';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { Routine, TimeOfDay } from '../types';

interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routineToEdit?: Routine | null;
}

export const RoutineModal: React.FC<RoutineModalProps> = ({
  isOpen,
  onClose,
  routineToEdit,
}) => {
  const { routines, addRoutine, updateRoutine } = useAuthAndSync();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [targetDays, setTargetDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (routineToEdit) {
      setTitle(routineToEdit.title);
      setDescription(routineToEdit.description || '');
      setTimeOfDay(routineToEdit.timeOfDay);
      setTargetDays(routineToEdit.targetDays || [0, 1, 2, 3, 4, 5, 6]);
    } else {
      setTitle('');
      setDescription('');
      setTimeOfDay('morning');
      setTargetDays([0, 1, 2, 3, 4, 5, 6]);
    }
  }, [routineToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setTargetDays(prev => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (routineToEdit) {
        await updateRoutine(routineToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          timeOfDay,
          targetDays,
        });
      } else {
        await addRoutine({
          title: title.trim(),
          description: description.trim(),
          timeOfDay,
          targetDays,
          icon: timeOfDay === 'morning' ? 'sun' : timeOfDay === 'afternoon' ? 'zap' : timeOfDay === 'evening' ? 'moon' : 'clock',
          color: '#ffffff',
          isArchived: false,
          order: routines.length,
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayLabels = [
    { num: 0, label: 'S' },
    { num: 1, label: 'M' },
    { num: 2, label: 'T' },
    { num: 3, label: 'W' },
    { num: 4, label: 'T' },
    { num: 5, label: 'F' },
    { num: 6, label: 'S' },
  ];

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
          <span className="text-xs sm:text-sm font-mono uppercase tracking-widest text-zinc-500">Routine Stack</span>
          <h3 className="text-lg sm:text-xl font-black text-black dark:text-white">
            {routineToEdit ? 'Edit Routine Stack' : 'Create Routine Stack'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-black dark:text-white">
              Routine Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning Priming Ritual"
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-base sm:text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-black dark:text-white">
              Purpose / Intention
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why does this routine matter? (e.g. Circadian alertness, deep focus...)"
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-base sm:text-xs focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-black dark:text-white">
              Time of Day Block
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'morning', label: 'Morning', icon: <Sun className="w-4 h-4" /> },
                { id: 'afternoon', label: 'Afternoon', icon: <Zap className="w-4 h-4" /> },
                { id: 'evening', label: 'Evening', icon: <Moon className="w-4 h-4" /> },
                { id: 'anytime', label: 'Anytime', icon: <Clock className="w-4 h-4" /> },
              ].map(block => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => setTimeOfDay(block.id as TimeOfDay)}
                  className={`min-h-[44px] flex items-center gap-2 p-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                    timeOfDay === block.id
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                      : 'glass-button text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {block.icon}
                  <span>{block.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-black dark:text-white">
              Target Days
            </label>
            <div className="flex items-center justify-between gap-1 pt-1">
              {dayLabels.map(d => {
                const active = targetDays.includes(d.num);
                return (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => toggleDay(d.num)}
                    className={`min-h-[40px] flex-1 rounded-xl text-xs font-mono font-bold transition-all ${
                      active
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                        : 'bg-black/5 dark:bg-white/5 text-zinc-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
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
              disabled={isSubmitting || !title.trim()}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{routineToEdit ? 'Save Changes' : 'Create Routine'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
