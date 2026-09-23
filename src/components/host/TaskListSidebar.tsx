import React from 'react';
import { useGame } from '../../context/GameContext';
import { Task, TaskType } from '../../types';
import {
  Plus,
  Clock,
  Award,
  Users,
  Timer,
  ShieldAlert,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle,
  Printer,
} from 'lucide-react';

interface TaskListSidebarProps {
  onOpenNewTask: () => void;
  onOpenPrintModal?: () => void;
}

export const TaskListSidebar: React.FC<TaskListSidebarProps> = ({
  onOpenNewTask,
  onOpenPrintModal,
}) => {
  const {
    activeEpisode,
    state,
    setActiveTask,
    reorderTasks,
    removeTask,
  } = useGame();

  if (!activeEpisode) {
    return (
      <div className="p-4 text-stone-500 text-sm">
        No active episode found.
      </div>
    );
  }

  const getTypeIcon = (type: TaskType) => {
    switch (type) {
      case 'prize':
        return Award;
      case 'team':
        return Users;
      case 'studio':
        return Timer;
      case 'tiebreak':
        return ShieldAlert;
      default:
        return Clock;
    }
  };

  // Check if a task is scored for all assigned contestants
  const isTaskCompleted = (task: Task) => {
    const activeContestants = (task.assignedContestantIds && task.assignedContestantIds.length > 0)
      ? state.contestants.filter((c) => task.assignedContestantIds!.includes(c.id))
      : state.contestants;

    if (activeContestants.length === 0) return false;
    return activeContestants.every((c) => {
      const entry = task.scores[c.id];
      return entry && (entry.isDisqualified || (entry.points !== undefined && entry.points !== null));
    });
  };

  return (
    <aside className="w-full md:w-80 bg-stone-900/80 border-r border-stone-800 flex flex-col h-full">
      {/* Episode title & Add Task button */}
      <div className="p-4 border-b border-stone-800 flex items-center justify-between gap-2 bg-stone-950/40">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-tm-gold block">
            Episode {activeEpisode.episodeNumber}
          </span>
          <h2 className="font-serif font-bold text-base text-stone-100 truncate">
            {activeEpisode.title}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenPrintModal && (
            <button
              onClick={onOpenPrintModal}
              title="Print task sheets for this episode"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-tm-gold border border-stone-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-tm-red hover:bg-tm-redBright text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task List items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeEpisode.tasks.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-xs italic">
            No tasks in this episode yet. Click "Add Task" above!
          </div>
        ) : (
          activeEpisode.tasks.map((task, index) => {
            const Icon = getTypeIcon(task.type);
            const isSelected = state.activeTaskId === task.id;
            const completed = isTaskCompleted(task);
            const hasSubtasks = (task.subtasks?.length || 0) > 0;
            const isPartialParticipants =
              task.assignedContestantIds &&
              task.assignedContestantIds.length < state.contestants.length;
            const hasBets = task.bets && Object.keys(task.bets).length > 0;

            return (
              <div
                key={task.id}
                onClick={() => setActiveTask(task.id)}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-tm-card border-tm-gold/80 shadow-md ring-1 ring-tm-gold/40'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="mt-0.5 text-stone-400 flex-shrink-0">
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-stone-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-tm-gold uppercase">
                        T{index + 1}
                      </span>
                      <Icon className="w-3 h-3 text-stone-400" />
                      <span className="text-[10px] text-stone-400 capitalize">
                        {task.type}
                      </span>
                      {hasSubtasks && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/70 border border-amber-800/60 text-amber-300 font-bold">
                          {task.subtasks!.length} parts
                        </span>
                      )}
                      {isPartialParticipants && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-stone-800 border border-stone-700 text-stone-300 font-medium">
                          {task.assignedContestantIds!.length}/{state.contestants.length}
                        </span>
                      )}
                      {hasBets && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950/70 border border-purple-800/60 text-purple-300 font-bold">
                          {Object.keys(task.bets!).length} bet{Object.keys(task.bets!).length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-xs md:text-sm text-stone-200 truncate mt-0.5">
                      {task.title}
                    </h3>
                  </div>
                </div>

                {/* Move & Delete controls */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderTasks(index, index - 1);
                      }}
                      className="p-1 text-stone-500 hover:text-stone-300"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {index < activeEpisode.tasks.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderTasks(index, index + 1);
                      }}
                      className="p-1 text-stone-500 hover:text-stone-300"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {activeEpisode.tasks.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete task "${task.title}"?`)) {
                          removeTask(task.id);
                        }
                      }}
                      className="p-1 text-stone-500 hover:text-red-400"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Progress Footer */}
      <div className="p-3 border-t border-stone-800 bg-stone-950/60 text-xs text-stone-400 flex items-center justify-between">
        <span>
          Scored:{' '}
          <strong className="text-stone-200">
            {activeEpisode.tasks.filter(isTaskCompleted).length} / {activeEpisode.tasks.length}
          </strong>
        </span>
        <span className="text-[11px] text-stone-500">Auto-saved</span>
      </div>
    </aside>
  );
};
