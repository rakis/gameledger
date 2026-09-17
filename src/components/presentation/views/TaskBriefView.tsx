import React from 'react';
import { useGame } from '../../../context/GameContext';
import { Clock, Timer, Users, Award, ShieldAlert } from 'lucide-react';

export const TaskBriefView: React.FC = () => {
  const { activeTask, state } = useGame();

  if (!activeTask) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 font-serif text-2xl">
        No task selected.
      </div>
    );
  }

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

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 z-10">
      {/* Category / Type Pill */}
      <div className="mb-6 flex items-center gap-3">
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider border shadow-md ${badge.color}`}>
          <BadgeIcon className="w-4 h-4" />
          {badge.label}
        </span>
        {activeTask.isTimed && activeTask.timeLimitSeconds && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-stone-900/80 text-stone-300 border border-stone-700">
            <Clock className="w-4 h-4 text-tm-gold" />
            Time limit: {formatTime(activeTask.timeLimitSeconds)}
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

        {/* Task Title */}
        <h2 className="font-serif font-bold text-2xl md:text-4xl text-[#1a110a] mb-6 tracking-tight border-b-2 border-[#ccb88e] pb-4">
          {activeTask.title}
        </h2>

        {/* Task Brief Content in Typewriter Typography */}
        <div className="font-typewriter text-lg md:text-2xl text-[#261e18] leading-relaxed whitespace-pre-wrap tracking-wide font-medium">
          {activeTask.brief}
        </div>

        {/* Traditional Taskmaster Punchline */}
        <div className="mt-8 pt-6 border-t border-[#dfcfad] flex justify-between items-center text-sm md:text-base text-[#604f3f] font-serif italic">
          <span>All the information is on the task.</span>
          <span className="font-bold uppercase tracking-wider text-tm-red">
            Your time starts now.
          </span>
        </div>
      </div>

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
