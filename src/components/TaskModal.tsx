import React, { useState, useEffect } from 'react';
import { X, Check, Clock, Calendar, Bell, Hash, Timer, CircleCheck } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { RoutineTask, TaskCategory, TaskPriority, HabitType } from '../types';

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
  const [habitType, setHabitType] = useState<HabitType>('check');
  const [targetCount, setTargetCount] = useState(8);
  const [reminderTime, setReminderTime] = useState<string | null>(null);
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
      setHabitType(taskToEdit.habitType || 'check');
      setTargetCount(taskToEdit.targetCount || 8);
      setReminderTime(taskToEdit.reminderTime ?? null);
    } else {
      setTitle('');
      setRoutineId(defaultRoutineId || (routines[0]?.id ?? 'standalone'));
      setScheduledTime('08:00');
      setDurationMinutes(15);
      setCategory('health');
      setPriority('medium');
      setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
      setHabitType('check');
      setTargetCount(8);
      setReminderTime(null);
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
          habitType,
          targetCount: habitType === 'count' ? targetCount : undefined,
          reminderTime: reminderTime || null,
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
          habitType,
          targetCount: habitType === 'count' ? targetCount : undefined,
          reminderTime: reminderTime || null,
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

          {/* Habit type — check-off / counter / timer */}
          <div>
            <div className="md-label-medium mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              How do you complete it?
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'check', label: 'Check-off', icon: CircleCheck, hint: 'Simple yes/no' },
                { id: 'count', label: 'Counter', icon: Hash, hint: 'e.g. 8 glasses' },
                { id: 'timer', label: 'Timer', icon: Timer, hint: 'e.g. 10 minutes' },
              ] as { id: HabitType; label: string; icon: typeof Hash; hint: string }[]).map(t => {
                const selected = habitType === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setHabitType(t.id)}
                    className={`rounded-xl p-2.5 text-left md-ripple border`}
                    style={{
                      background: selected ? 'var(--md-secondary-container)' : 'var(--md-surface-container-low)',
                      borderColor: selected ? 'var(--md-primary)' : 'var(--md-outline-variant)',
                      borderWidth: selected ? 2 : 1,
                      color: selected ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                    }}
                    aria-pressed={selected}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <div className="md-label-large" style={{ color: 'var(--md-on-surface)' }}>{t.label}</div>
                    <div className="md-label-small truncate">{t.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>

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

            {habitType === 'count' ? (
              <div className="flex flex-col justify-end">
                <div className="md-label-medium mb-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                  Daily target · <span className="font-mono">{targetCount}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  className="md-slider"
                  style={{ ['--md-slider-progress' as string]: `${((targetCount - 2) / 18) * 100}%` }}
                  aria-label="Daily count target"
                />
              </div>
            ) : (
              <div className="flex flex-col justify-end">
                <div className="md-label-medium mb-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {habitType === 'timer' ? 'Daily goal' : 'Duration'} ·{' '}
                  <span className="font-mono">{durationMinutes}m</span>
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
            )}
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

          {/* Reminder */}
          <div className="space-y-2">
            <div className="md-label-medium flex items-center gap-1.5" style={{ color: 'var(--md-on-surface-variant)' }}>
              <Bell className="w-4 h-4" />
              Reminder
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReminderTime(reminderTime ? null : scheduledTime)}
                className={`md-chip md-ripple shrink-0${reminderTime ? ' md-chip--selected' : ''}`}
                aria-pressed={!!reminderTime}
              >
                {reminderTime && <Check className="w-4 h-4" />}
                <span>{reminderTime ? 'On' : 'Notify me'}</span>
              </button>
              {reminderTime && (
                <button
                  type="button"
                  onClick={() => setReminderTime(scheduledTime)}
                  className="md-chip md-ripple shrink-0"
                >
                  At scheduled time
                </button>
              )}
              {reminderTime && (
                <label className="md-text-field flex-1 !min-w-0">
                  <input
                    className="md-text-field__input"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    placeholder=" "
                  />
                  <span className="md-text-field__label">At</span>
                </label>
              )}
            </div>
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              Requires installation ("Add to Home screen") and notification permission.
            </p>
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
