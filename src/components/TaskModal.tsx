import React, { useState, useEffect } from 'react';
import { X, Check, Clock, Calendar } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { RoutineTask, TaskCategory, TaskPriority } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: RoutineTask | null;
  defaultRoutineId?: string;
}

const DAYS = [
  { num: 0, label: 'S' },
  { num: 1, label: 'M' },
  { num: 2, label: 'T' },
  { num: 3, label: 'W' },
  { num: 4, label: 'T' },
  { num: 5, label: 'F' },
  { num: 6, label: 'S' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultRoutineId,
}) => {
  const { routines, addTask, updateTask } = useAppData();

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

  const sliderProgress = ((durationMinutes - 1) / (120 - 1)) * 100;

  return (
    <div className="md-scrim" onClick={onClose}>
      <div
        className="md-bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={taskToEdit ? 'Edit habit' : 'New habit'}
      >
        <div className="md-bottom-sheet__handle" aria-hidden="true" />

        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <div className="md-label-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
              Habit
            </div>
            <h2 className="md-headline-small">
              {taskToEdit ? 'Edit habit' : 'Schedule habit'}
            </h2>
          </div>
          <button onClick={onClose} className="md-icon-button md-ripple" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
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
            <span className="md-text-field__label">Habit name</span>
          </label>

          <label className="md-text-field md-text-field--select">
            <select
              className="md-text-field__input"
              value={routineId}
              onChange={(e) => setRoutineId(e.target.value)}
            >
              <option value="standalone">Standalone daily task</option>
              {routines.map(r => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.timeOfDay})
                </option>
              ))}
            </select>
            <span className="md-text-field__label">Routine stack</span>
            <span className="md-text-field__arrow" aria-hidden="true">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="md-text-field">
              <input
                className="md-text-field__input"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder=" "
              />
              <span className="md-text-field__label">
                <Clock className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                Time
              </span>
            </label>

            <div className="flex flex-col justify-end">
              <div className="md-label-medium mb-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                Duration · <span className="font-mono">{durationMinutes}m</span>
              </div>
              <input
                type="range"
                min="1"
                max="120"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="md-slider"
                style={{ ['--md-slider-progress' as string]: `${sliderProgress}%` }}
                aria-label="Duration in minutes"
              />
            </div>
          </div>

          <label className="md-text-field md-text-field--select">
            <select
              className="md-text-field__input"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
            >
              <option value="health">Health & Vitality</option>
              <option value="productivity">Productivity</option>
              <option value="mindfulness">Mindfulness</option>
              <option value="fitness">Fitness & Movement</option>
              <option value="learning">Learning</option>
              <option value="creativity">Creativity</option>
              <option value="other">Other</option>
            </select>
            <span className="md-text-field__label">Domain</span>
            <span className="md-text-field__arrow" aria-hidden="true">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </label>

          <div>
            <div className="md-label-medium mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              Priority
            </div>
            <div className="md-segmented w-full">
              {([
                { id: 'high', label: 'High' },
                { id: 'medium', label: 'Medium' },
                { id: 'low', label: 'Low' },
              ] as { id: TaskPriority; label: string }[]).map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`md-segmented__item md-ripple flex-1${priority === p.id ? ' md-segmented__item--selected' : ''}`}
                  style={idx === 2 ? { borderTopRightRadius: 'var(--md-shape-full)', borderBottomRightRadius: 'var(--md-shape-full)' } : undefined}
                  aria-pressed={priority === p.id}
                >
                  {priority === p.id && <Check className="w-4 h-4" />}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="md-label-medium mb-2 flex items-center gap-1.5" style={{ color: 'var(--md-on-surface-variant)' }}>
              <Calendar className="w-4 h-4" />
              Active days
            </div>
            <div className="flex items-center justify-between gap-1">
              {DAYS.map(d => {
                const active = daysOfWeek.includes(d.num);
                return (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => toggleDay(d.num)}
                    className={`md-chip md-chip--round md-ripple flex-1${active ? ' md-chip--selected' : ''}`}
                    aria-pressed={active}
                    aria-label={`Toggle day ${d.num}`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="md-button md-button--text md-ripple">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="md-button md-button--filled md-ripple"
            >
              <Check className="w-4 h-4" />
              {taskToEdit ? 'Save changes' : 'Schedule habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
