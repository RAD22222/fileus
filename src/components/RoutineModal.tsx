import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Sun,
  Zap,
  Moon,
  Clock,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Routine, TimeOfDay } from '../types';

interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routineToEdit?: Routine | null;
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

const TIME_BLOCKS: { id: TimeOfDay; label: string; icon: React.ReactNode }[] = [
  { id: 'morning', label: 'Morning', icon: <Sun className="w-4 h-4" /> },
  { id: 'afternoon', label: 'Afternoon', icon: <Zap className="w-4 h-4" /> },
  { id: 'evening', label: 'Evening', icon: <Moon className="w-4 h-4" /> },
  { id: 'anytime', label: 'Anytime', icon: <Clock className="w-4 h-4" /> },
];

export const RoutineModal: React.FC<RoutineModalProps> = ({
  isOpen,
  onClose,
  routineToEdit,
}) => {
  const { routines, addRoutine, updateRoutine } = useAppData();

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
          color: '#007232',
          isArchived: false,
          order: routines.length,
        });
      }
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
        aria-label={routineToEdit ? 'Edit routine stack' : 'New routine stack'}
      >
        <div className="md-bottom-sheet__handle" aria-hidden="true" />

        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <div className="md-label-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
              Routine
            </div>
            <h2 className="md-headline-small">
              {routineToEdit ? 'Edit routine' : 'Create routine'}
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
              maxLength={100}
            />
            <span className="md-text-field__label">Routine title</span>
          </label>

          <label className="md-text-field md-text-field--textarea">
            <textarea
              className="md-text-field__input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=" "
              maxLength={300}
            />
            <span className="md-text-field__label">Purpose / intention</span>
          </label>

          <div>
            <div className="md-label-medium mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              Time of day
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TIME_BLOCKS.map(block => {
                const selected = timeOfDay === block.id;
                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => setTimeOfDay(block.id)}
                    className={`md-chip md-ripple min-h-[3rem] justify-start${selected ? ' md-chip--selected' : ''}`}
                    aria-pressed={selected}
                  >
                    {selected ? <Check className="w-4 h-4" /> : block.icon}
                    <span>{block.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="md-label-medium mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              Target days
            </div>
            <div className="flex items-center justify-between gap-1">
              {DAYS.map(d => {
                const active = targetDays.includes(d.num);
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
              {routineToEdit ? 'Save changes' : 'Create routine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
