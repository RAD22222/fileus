import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sun,
  Zap,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
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
  } = useAuthAndSync();

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
        return <Sun className="w-4 h-4 text-black dark:text-white" />;
      case 'afternoon':
        return <Zap className="w-4 h-4 text-black dark:text-white" />;
      case 'evening':
        return <Moon className="w-4 h-4 text-black dark:text-white" />;
      default:
        return <Clock className="w-4 h-4 text-black dark:text-white" />;
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
    <div className="space-y-4 sm:space-y-8 w-full max-w-full">

      {/* Top Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 glass-surface p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/15 w-full">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-black dark:text-white" />
            <h2 className="text-lg sm:text-2xl font-black text-black dark:text-white">
              Routine Stacks
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sequential habit chains architected to execute on autopilot throughout your day.
          </p>
        </div>

        <button
          onClick={onOpenCreateRoutineModal}
          className="w-full sm:w-auto min-h-[42px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-mono font-bold shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Routine</span>
        </button>
      </div>

      {/* User Routines List */}
      <div className="space-y-3 sm:space-y-4 w-full">
        {routines.map(routine => {
          const routineTasks = tasks
            .filter(t => t.routineId === routine.id && !t.isArchived)
            .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));
          const isExpanded = expandedRoutineIds.has(routine.id);

          return (
            <div
              key={routine.id}
              className="glass-card rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 overflow-hidden transition-all w-full"
            >
              {/* Routine Card Header */}
              <div className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 dark:border-white/5">
                <div
                  onClick={() => toggleExpand(routine.id)}
                  className="flex items-start sm:items-center gap-2.5 sm:gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-button flex items-center justify-center shrink-0">
                    {getTimeIcon(routine.timeOfDay)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                      <span className="uppercase font-bold text-black dark:text-white">{routine.timeOfDay}</span>
                      <span>·</span>
                      <span>{routineTasks.length} habit{routineTasks.length !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{getDayNames(routine.targetDays || [0, 1, 2, 3, 4, 5, 6])}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-black dark:text-white truncate">
                      {routine.title}
                    </h3>
                    {routine.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {routine.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Routine Controls */}
                <div className="flex items-center justify-end gap-1 shrink-0 pt-1 sm:pt-0 border-t border-black/5 dark:border-white/5 sm:border-0">
                  <button
                    onClick={() => onOpenAddTaskModal(routine.id)}
                    className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
                    title="Add step"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Step</span>
                  </button>

                  <button
                    onClick={() => onOpenEditRoutineModal(routine)}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    title="Edit routine"
                    aria-label="Edit routine"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteRoutine(routine.id)}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    title="Delete routine"
                    aria-label="Delete routine"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => toggleExpand(routine.id)}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    aria-label="Toggle expand"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Steps List */}
              {isExpanded && (
                <div className="p-2.5 sm:p-4 bg-black/[0.02] dark:bg-white/[0.02] space-y-2">
                  {routineTasks.length === 0 ? (
                    <div className="text-center py-5">
                      <p className="text-xs text-zinc-400">No habit steps in this routine yet.</p>
                      <button
                        onClick={() => onOpenAddTaskModal(routine.id)}
                        className="text-xs font-mono font-bold text-black dark:text-white hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add first step</span>
                      </button>
                    </div>
                  ) : (
                    routineTasks.map((task, idx) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl glass-button transition-colors min-h-[50px] w-full"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-black/5 dark:bg-white/10 text-black dark:text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-black dark:text-white truncate block">
                              {task.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                              <span>{task.scheduledTime || 'No time'}</span>
                              <span>·</span>
                              <span>{task.durationMinutes}m</span>
                              <span>·</span>
                              <span className="capitalize">{task.category}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => onOpenEditTaskModal(task)}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white rounded-lg transition-colors"
                            title="Edit step"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white rounded-lg transition-colors"
                            title="Delete step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Curated Templates Section */}
      <div className="space-y-3 pt-3 border-t border-black/10 dark:border-white/10 w-full">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-black dark:text-white">
            Curated Protocol Blueprints
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Proven habit frameworks. Adopt directly into your daily schedule with one tap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
          {CURATED_ROUTINE_TEMPLATES.map(tpl => (
            <div
              key={tpl.id}
              className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 flex flex-col justify-between space-y-3 sm:space-y-4 w-full"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {tpl.category} · {tpl.timeOfDay}
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-black dark:text-white mt-0.5 truncate">
                      {tpl.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                    by {tpl.author}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {tpl.description}
                </p>

                <div className="space-y-1.5 pt-1">
                  {tpl.tasks.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 glass-button px-2.5 sm:px-3 py-1.5 rounded-xl font-mono"
                    >
                      <span className="truncate flex-1 pr-2">{step.title}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 shrink-0">
                        {step.scheduledTime} ({step.durationMinutes}m)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 sm:pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">{tpl.tasks.length} steps</span>
                <button
                  onClick={() => handleImportTemplate(tpl)}
                  disabled={importingTemplateId === tpl.id}
                  className="min-h-[38px] flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {importingTemplateId === tpl.id ? (
                    <span>Adopting...</span>
                  ) : (
                    <>
                      <span>Adopt Protocol</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
