import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sun,
  Zap,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Routine, RoutineTask, RoutineTemplate, TimeOfDay } from '../types';
import { CURATED_ROUTINE_TEMPLATES } from '../data/defaultRoutines';

interface RoutinesManagerProps {
  onOpenCreateRoutineModal: () => void;
  onOpenEditRoutineModal: (routine: Routine) => void;
  onOpenAddTaskModal: (routineId?: string) => void;
  onOpenEditTaskModal: (task: RoutineTask) => void;
}

export const RoutinesManager: React.FC<RoutinesManagerProps> = ({
  onOpenCreateRoutineModal,
  onOpenEditRoutineModal,
  onOpenAddTaskModal,
  onOpenEditTaskModal,
}) => {
  const {
    routines,
    tasks,
    deleteRoutine,
    deleteTask,
    importRoutineTemplate,
  } = useAppData();

  const [expandedRoutineIds, setExpandedRoutineIds] = useState<Set<string>>(
    new Set(routines.map(r => r.id))
  );
  const [importingTemplateId, setImportingTemplateId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRoutineIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImportTemplate = async (template: RoutineTemplate) => {
    setImportingTemplateId(template.id);
    try {
      await importRoutineTemplate(template);
    } finally {
      setImportingTemplateId(null);
    }
  };

  const getTimeIcon = (timeOfDay: TimeOfDay) => {
    switch (timeOfDay) {
      case 'morning':
        return <Sun className="w-5 h-5" />;
      case 'afternoon':
        return <Zap className="w-5 h-5" />;
      case 'evening':
        return <Moon className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getDayNames = (days: number[]) => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
    return days.map(d => dayLabels[d]).join(', ');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <section className="md-card md-card--elevated flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
          >
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <h2 className="md-title-large">Routine stacks</h2>
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              Habit chains that execute on autopilot
            </p>
          </div>
        </div>
        <button
          onClick={onOpenCreateRoutineModal}
          className="md-button md-button--filled md-ripple w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New routine
        </button>
      </section>

      {/* User routines */}
      <div className="space-y-3">
        {routines.map(routine => {
          const routineTasks = tasks
            .filter(t => t.routineId === routine.id && !t.isArchived)
            .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));
          const isExpanded = expandedRoutineIds.has(routine.id);

          return (
            <article key={routine.id} className="md-card md-card--outlined p-0 overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-3 p-3">
                <button
                  onClick={() => toggleExpand(routine.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-xl"
                  aria-expanded={isExpanded}
                >
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
                  >
                    {getTimeIcon(routine.timeOfDay)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="md-label-medium uppercase tracking-wider block" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {routine.timeOfDay} · {routineTasks.length} habit{routineTasks.length !== 1 ? 's' : ''} · {getDayNames(routine.targetDays || [0, 1, 2, 3, 4, 5, 6])}
                    </span>
                    <span className="md-title-medium block truncate">{routine.title}</span>
                    {routine.description && (
                      <span className="md-body-small block truncate" style={{ color: 'var(--md-on-surface-variant)' }}>
                        {routine.description}
                      </span>
                    )}
                  </span>
                </button>

                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => onOpenAddTaskModal(routine.id)}
                    className="md-icon-button md-ripple"
                    title="Add step"
                    aria-label="Add step"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onOpenEditRoutineModal(routine)}
                    className="md-icon-button md-ripple"
                    title="Edit routine"
                    aria-label="Edit routine"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRoutine(routine.id)}
                    className="md-icon-button md-ripple"
                    title="Delete routine"
                    aria-label="Delete routine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleExpand(routine.id)}
                    className="md-icon-button md-ripple"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Steps */}
              {isExpanded && (
                <div
                  className="px-2 pb-2 space-y-1"
                  style={{ background: 'var(--md-surface-container)' }}
                >
                  {routineTasks.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                        No steps in this routine yet.
                      </p>
                      <button
                        onClick={() => onOpenAddTaskModal(routine.id)}
                        className="md-button md-button--text md-ripple mt-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add first step
                      </button>
                    </div>
                  ) : (
                    routineTasks.map((task, idx) => (
                      <div key={task.id} className="md-list-item md-ripple rounded-xl">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 md-label-large font-mono"
                          style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
                        >
                          {idx + 1}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="md-body-large block truncate">{task.title}</span>
                          <span className="md-body-small block font-mono" style={{ color: 'var(--md-on-surface-variant)' }}>
                            {task.scheduledTime || 'No time'} · {task.durationMinutes}m · <span className="capitalize">{task.category}</span>
                          </span>
                        </span>
                        <span className="flex items-center shrink-0">
                          <button
                            onClick={() => onOpenEditTaskModal(task)}
                            className="md-icon-button md-ripple"
                            title="Edit step"
                            aria-label="Edit step"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="md-icon-button md-ripple"
                            title="Delete step"
                            aria-label="Delete step"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Curated templates */}
      <section className="space-y-3 pt-2">
        <div>
          <h3 className="md-title-large">Protocol blueprints</h3>
          <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
            Proven habit frameworks — adopt them into your schedule in one tap
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CURATED_ROUTINE_TEMPLATES.map(tpl => (
            <article key={tpl.id} className="md-card md-card--filled flex flex-col space-y-3">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="md-label-medium uppercase tracking-wider" style={{ color: 'var(--md-on-surface-variant)' }}>
                    {tpl.category} · {tpl.timeOfDay}
                  </span>
                  <span className="md-label-small shrink-0" style={{ color: 'var(--md-on-surface-variant)' }}>
                    by {tpl.author}
                  </span>
                </div>
                <h4 className="md-title-medium">{tpl.title}</h4>
              </div>

              <p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                {tpl.description}
              </p>

              <div className="space-y-1.5 flex-1">
                {tpl.tasks.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl md-body-medium"
                    style={{ background: 'var(--md-surface-container-highest)' }}
                  >
                    <span className="truncate">{step.title}</span>
                    <span className="md-label-small font-mono shrink-0" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {step.scheduledTime} · {step.durationMinutes}m
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="md-label-large" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {tpl.tasks.length} steps
                </span>
                <button
                  onClick={() => handleImportTemplate(tpl)}
                  disabled={importingTemplateId === tpl.id}
                  className="md-button md-button--filled md-ripple"
                >
                  {importingTemplateId === tpl.id ? (
                    'Adopting…'
                  ) : (
                    <>
                      Adopt protocol
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
