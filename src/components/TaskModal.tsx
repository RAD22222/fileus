import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Clock,
  Calendar,
} from 'lucide-react';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { RoutineTask, TaskCategory, TaskPriority } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: RoutineTask | null;
  defaultRoutineId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultRoutineId,
}) => {
  const { routines, addTask, updateTask } = useAuthAndSync();

  const [title, setTitle] = useState('');
  const [routineId, setRoutineId] = useState('standalone');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [category, setCategory] = useState<TaskCategory>('health');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setRoutineId(taskToEdit.routineId || 'standalone');
      setScheduledTime(taskToEdit.scheduledTime || '08:00');
      setDurationMinutes(taskToEdit.durationMinutes || 15);
      setCategory(taskToEdit.category || 'health');
      setPriority(taskToEdit.priority || 'medium');
      setDaysOfWeek(taskToEdit.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
    } else {
      setTitle('');
      setRoutineId(defaultRoutineId || (routines[0]?.id ?? 'standalone'));
      setScheduledTime('08:00');
      setDurationMinutes(15);
      setCategory('health');
      setPriority('medium');
      setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    }
  }, [taskToEdit, defaultRoutineId, routines, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev => {
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
      if (taskToEdit) {
        await updateTask(taskToEdit.id, {
          title: title.trim(),
          routineId,
          scheduledTime,
          durationMinutes,
          category,
          priority,
          daysOfWeek,
        });
      } else {
        await addTask({
          title: title.trim(),
          routineId,
          scheduledTime,
          durationMinutes,
          category,
          priority,
          daysOfWeek,
          isArchived: false,
          order: 99,
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
      <div className="glass-modal rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-7 pb-8 sm:pb-7 border border-black/15 dark:border-white/15 space-y-4 sm:space-y-5 relative max-h-[90dvh] overflow-y-auto">
        
        {/* Mobile drag handle affordance */}
        <div className="sm:hidden w-10 h-1 bg-black/20 dark:bg-white/20 rounded-full mx-auto -mt-1 mb-2 shrink-0" />

        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 text-zinc-400 hover:text-black dark:hover:text-white p-2 rounded-xl transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pr-8">
          <span className="text-xs sm:text-sm font-mono uppercase tracking-widest text-zinc-500">Protocol Step</span>
          <h3 className="text-lg sm:text-xl font-black text-black dark:text-white">
            {taskToEdit ? 'Edit Habit Details' : 'Schedule New Habit'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-black dark:text-white">
              Habit Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 15-Minute Sunlight Walk"
              maxLength={120}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-black dark:text-white">
              Assigned Routine Stack
            </label>
            <select
              value={routineId}
              onChange={(e) => setRoutineId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-base sm:text-xs font-mono font-bold focus:outline-none"
            >
              <option value="standalone">Standalone Daily Task</option>
              {routines.map(r => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.timeOfDay})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-black dark:text-white flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Time</span>
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-base sm:text-sm focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-black dark:text-white">
                Duration ({durationMinutes}m)
              </label>
              <input
                type="range"
                min="1"
                max="120"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full h-2 bg-black/20 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white mt-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-black dark:text-white">
                Domain
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-base sm:text-xs font-mono capitalize focus:outline-none"
              >
                <option value="health">Health & Vitality</option>
                <option value="productivity">Productivity</option>
                <option value="mindfulness">Mindfulness</option>
                <option value="fitness">Fitness & Movement</option>
                <option value="learning">Learning</option>
                <option value="creativity">Creativity</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-black dark:text-white">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-base sm:text-xs font-mono capitalize focus:outline-none"
              >
                <option value="high">High (Required)</option>
                <option value="medium">Medium</option>
                <option value="low">Low (Bonus)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-black dark:text-white flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Active Recurrence Days</span>
            </label>
            <div className="flex items-center justify-between gap-1 pt-1">
              {dayLabels.map(d => {
                const active = daysOfWeek.includes(d.num);
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
              <span>{taskToEdit ? 'Save Changes' : 'Schedule Habit'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
