import React from 'react';
import { useGame } from '../../../context/GameContext';
import { Clock, Timer, Users, Award, ShieldAlert, Layers, UserCheck, Eye } from 'lucide-react';

export const TaskBriefView: React.FC = () => {
  const { activeTask, state } = useGame();

  if (!activeTask) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 font-serif text-2xl">
        No task selected.
      </div>
    );
  }

  // Active subtask if any (defaults to part 1 for multipart tasks)
  const hasSubtasks = !!(activeTask.subtasks && activeTask.subtasks.length > 0);
  const currentSubtask = hasSubtasks
    ? (activeTask.subtasks!.find((s) => s.id === state.presentation.activeSubtaskId) || activeTask.subtasks![0])
    : null;

  const subtaskIndex = currentSubtask && activeTask.subtasks
    ? activeTask.subtasks.findIndex((s) => s.id === currentSubtask.id)
    : -1;

  // Participant assignments
  const assignedIds = activeTask.assignedContestantIds || state.contestants.map((c) => c.id);
  const activeContestants = state.contestants.filter((c) => assignedIds.includes(c.id));
  const satOutContestants = state.contestants.filter((c) => !assignedIds.includes(c.id));
  const isPartialParticipants = satOutContestants.length > 0;

  const teamsMap = new Map((state.teams || []).map((t) => [t.id, t]));

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'prize':
        return { label: 'Prize Task', icon: Award, color: 'bg-amber-900/60 text-amber-200 border-amber-600/50' };
      case 'team':
        return { label: 'Team Task', icon: Users, color: 'bg-emerald-900/60 text-emerald-200 border-emerald-600/50' };
      case 'studio':
        return { label: 'Live Studio Task', icon: Timer, color: 'bg-purple-900/60 text-purple-200 border-purple-600/50' };
      case 'tiebreak':
        return { label: 'Tie-Break', icon: ShieldAlert, color: 'bg-red-900/60 text-red-200 border-red-600/50' };
      default:
        return { label: 'Task', icon: Clock, color: 'bg-rose-900/60 text-rose-200 border-rose-600/50' };
    }
  };

  const badge = getTypeBadge(activeTask.type);
  const BadgeIcon = badge.icon;

  const showPartLabel = state.presentation.showPartLabel ?? activeTask.showPartLabel ?? false;

  // Never show the name of the task on stage view; only show part number if part labels are enabled
  const displayedTitle = currentSubtask && showPartLabel
    ? `Part ${subtaskIndex + 1}`
    : null;

  const displayedBrief = currentSubtask && currentSubtask.brief
    ? currentSubtask.brief
    : activeTask.brief;

  const timeLimit = currentSubtask?.timeLimitSeconds ?? activeTask.timeLimitSeconds;
  const isTimed = currentSubtask
    ? (currentSubtask.isTimed ?? (currentSubtask.timeLimitSeconds !== undefined))
    : activeTask.isTimed;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 z-10">
      {/* Category / Subtask / Type Pills */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider border shadow-md ${badge.color}`}>
          <BadgeIcon className="w-4 h-4" />
          {badge.label}
        </span>

        {currentSubtask && showPartLabel && (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60 shadow-md">
            <Layers className="w-4 h-4" />
            <span>Part {subtaskIndex + 1}</span>
          </span>
        )}

        {isTimed && timeLimit && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-stone-900/80 text-stone-300 border border-stone-700">
            <Clock className="w-4 h-4 text-tm-gold" />
            Time limit: {formatTime(timeLimit)}
          </span>
        )}
      </div>

      {/* The Parchment Task Letter */}
      <div className="w-full max-w-3xl parchment-texture rounded-2xl p-8 md:p-14 relative transform rotate-[-0.5deg] shadow-parchment border-4 border-[#dcd0b1]">
        {/* Decorative Wax Seal on top-right of parchment */}
        <div className="absolute -top-7 -right-5 md:-top-9 md:-right-7 w-16 h-16 md:w-20 md:h-20 rounded-full wax-seal flex items-center justify-center shadow-wax transform rotate-12">
          <div className="w-11 h-11 md:w-14 md:h-14 rounded-full border border-dashed border-red-300/40 flex items-center justify-center">
            <span className="font-serif font-black text-tm-goldLight text-base md:text-xl">TM</span>
          </div>
        </div>

        {/* Task Title (only shown for multipart tasks when part label is enabled, never showing task name) */}
        {displayedTitle && (
          <h2 className="font-serif font-bold text-2xl md:text-4xl text-[#1a110a] mb-6 tracking-tight border-b-2 border-[#ccb88e] pb-4">
            {displayedTitle}
          </h2>
        )}

        {/* Task Brief Content in Typewriter Typography */}
        <div className="font-typewriter text-lg md:text-2xl text-[#261e18] leading-relaxed whitespace-pre-wrap tracking-wide font-medium">
          {displayedBrief}
        </div>
      </div>

      {/* Assigned Contestants vs Sat-Out Spectators */}
      {isPartialParticipants && (
        <div className="mt-6 w-full max-w-3xl flex flex-wrap items-center justify-between gap-4 bg-stone-900/80 backdrop-blur-md px-5 py-3 rounded-xl border border-stone-800 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-400 flex items-center gap-1 uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              Active ({activeContestants.length}):
            </span>
            {activeContestants.map((c) => {
              const team = c.teamId ? teamsMap.get(c.teamId) : null;
              return (
                <span
                  key={c.id}
                  className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 border border-stone-700 flex items-center gap-1.5"
                >
                  {team && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: team.colorHex }}
                      title={team.name}
                    />
                  )}
                  <span>{c.name}</span>
                </span>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-400 flex items-center gap-1 uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              Sat Out:
            </span>
            {satOutContestants.map((c) => (
              <span
                key={c.id}
                className="px-2 py-0.5 rounded-md bg-purple-950/50 text-purple-300 border border-purple-800/40 italic"
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live Stage Timer (if timer is running or has recorded time) */}
      {(state.timer.isRunning || state.timer.seconds > 0) && (
        <div className="mt-8 bg-black/80 backdrop-blur-md px-8 py-3.5 rounded-2xl border-2 border-tm-gold/60 shadow-gold flex items-center gap-4 animate-fade-in">
          <Clock className={`w-7 h-7 ${state.timer.isRunning ? 'text-tm-goldBright animate-pulse' : 'text-stone-400'}`} />
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-stone-400 font-medium">
              {state.timer.isCountdown ? 'Time Remaining' : 'Stopwatch'}
            </span>
            <span className={`font-mono text-3xl md:text-4xl font-black tracking-wider ${
              state.timer.isCountdown && state.timer.seconds <= 10 
                ? 'text-red-500 animate-pulse' 
                : 'text-tm-goldBright'
            }`}>
              {formatTime(state.timer.seconds)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
