import React, { useState } from 'react';
import {
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
  MoreVertical,
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  const closeMenu = () => setOpenMenuId(null);

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
      {/* Header — flat on the surface */}
      <section className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <h2 className="md-headline-small truncate">Routines</h2>
          <p className="md-body-medium mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
            Group habits into repeatable routines
          </p>
        </div>
        <button
          onClick={onOpenCreateRoutineModal}
          className="md-button md-button--tonal md-ripple shrink-0"
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
          const menuOpen = openMenuId === `routine-${routine.id}`;

          return (
            <article key={routine.id} className="md-card md-card--outlined p-0 overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-1 p-2 pl-3">
                <button
                  onClick={() => toggleExpand(routine.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-xl py-1.5"
                  aria-expanded={isExpanded}
                >
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
                  >
                    {getTimeIcon(routine.timeOfDay)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="md-title-medium block truncate">{routine.title}</span>
                    <span className="md-label-medium block truncate mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {routineTasks.length} habit{routineTasks.length !== 1 ? 's' : ''} · {getDayNames(routine.targetDays || [0, 1, 2, 3, 4, 5, 6])}
                    </span>
                    {routine.description && isExpanded && (
                      <span className="md-body-small block truncate mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                        {routine.description}
                      </span>
                    )}
                  </span>
                </button>

                <button
                  onClick={() => toggleExpand(routine.id)}
                  className="md-icon-button md-ripple shrink-0"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                <div className="relative shrink-0">
                  <button
                    onClick={() => setOpenMenuId(menuOpen ? null : `routine-${routine.id}`)}
                    className="md-icon-button md-ripple"
                    title="More options"
                    aria-label={`Options for ${routine.title}`}
                    aria-expanded={menuOpen}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="md-menu-backdrop" onClick={closeMenu} />
                      <div className="md-menu" role="menu">
                        <button
                          className="md-menu-item"
                          role="menuitem"
                          onClick={() => { closeMenu(); onOpenAddTaskModal(routine.id); }}
                        >
                          <Plus className="w-4 h-4" />
                          Add step
                        </button>
                        <button
                          className="md-menu-item"
                          role="menuitem"
                          onClick={() => { closeMenu(); onOpenEditRoutineModal(routine); }}
                        >
                          <Pencil className="w-4 h-4" />
                          Edit routine
                        </button>
                        <button
                          className="md-menu-item md-menu-item--danger"
                          role="menuitem"
                          onClick={() => { closeMenu(); deleteRoutine(routine.id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete routine
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Steps */}
              {isExpanded && (
                <div
                  className="px-2 pb-2"
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
                    routineTasks.map((task, idx) => {
                      const stepMenuOpen = openMenuId === `step-${task.id}`;
                      return (
                        <div key={task.id}>
                          {idx > 0 && <hr className="md-divider" style={{ margin: '0 0.75rem' }} />}
                          <div className="md-task-row">
                            <span
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 md-label-large font-mono"
                              style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
                            >
                              {idx + 1}
                            </span>
                            <span className="flex-1 min-w-0 pl-1">
                              <span className="md-body-large block truncate">{task.title}</span>
                              <span className="md-body-small block font-mono mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                                {task.scheduledTime || 'No time'} · {task.durationMinutes}m · <span className="capitalize">{task.category}</span>
                              </span>
                            </span>
                            <span className="relative shrink-0 self-center">
                              <button
                                onClick={() => setOpenMenuId(stepMenuOpen ? null : `step-${task.id}`)}
                                className="md-icon-button md-ripple"
                                title="More options"
                                aria-label={`Options for ${task.title}`}
                                aria-expanded={stepMenuOpen}
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>
                              {stepMenuOpen && (
                                <>
                                  <div className="md-menu-backdrop" onClick={closeMenu} />
                                  <div className="md-menu" role="menu">
                                    <button
                                      className="md-menu-item"
                                      role="menuitem"
                                      onClick={() => { closeMenu(); onOpenEditTaskModal(task); }}
                                    >
                                      <Pencil className="w-4 h-4" />
                                      Edit step
                                    </button>
                                    <button
                                      className="md-menu-item md-menu-item--danger"
                                      role="menuitem"
                                      onClick={() => { closeMenu(); deleteTask(task.id); }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete step
                                    </button>
                                  </div>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })
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
          <h3 className="md-title-large">Routine templates</h3>
          <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
            Ready-made routines — add any of them to your schedule in one tap
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CURATED_ROUTINE_TEMPLATES.map(tpl => (
            <article key={tpl.id} className="md-card md-card--filled flex flex-col space-y-3">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="md-label-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
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
                    'Adding…'
                  ) : (
                    <>
                      Add to schedule
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
