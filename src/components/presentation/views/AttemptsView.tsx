import React from 'react';
import { useGame } from '../../../context/GameContext';
import { Clock, MessageSquare, AlertCircle } from 'lucide-react';

export const AttemptsView: React.FC = () => {
  const { activeTask, state } = useGame();

  if (!activeTask) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 font-serif text-2xl">
        No task active.
      </div>
    );
  }

  const formatTime = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-8 z-10 w-full max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="text-center mb-8">
        <h2 className="font-serif font-black text-2xl md:text-4xl text-stone-100 tracking-tight">
          {activeTask.title}
        </h2>
        <p className="text-tm-gold text-sm md:text-base font-medium tracking-wide uppercase mt-1">
          Contestant Attempts & Submissions
        </p>
      </div>

      {/* Grid of Contestants */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6 items-stretch">
        {state.contestants.map((c) => {
          const score = activeTask.scores[c.id];
          const isSpotlight = state.presentation.spotlightContestantId === c.id;

          return (
            <div
              key={c.id}
              className={`flex flex-col rounded-2xl p-5 border transition-all duration-300 relative ${
                isSpotlight
                  ? 'bg-tm-card border-tm-goldBright shadow-gold-lg ring-2 ring-tm-gold scale-105 z-20'
                  : 'bg-tm-card/90 border-tm-cardBorder hover:border-tm-gold/50 shadow-lg'
              }`}
            >
              {/* Top bar with avatar & color bar */}
              <div className="flex items-center gap-3 pb-3 border-b border-stone-800">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-md ring-2 ring-white/10"
                  style={{ backgroundColor: c.colorHex }}
                >
                  {c.avatar}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-lg text-stone-100 truncate">
                    {c.name}
                  </h3>
                  {c.teamId && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-800 text-stone-300 uppercase tracking-wider">
                      Team {c.teamId}
                    </span>
                  )}
                </div>
              </div>

              {/* Attempt content */}
              <div className="flex-1 flex flex-col justify-between py-4 space-y-3">
                {score?.attemptNote ? (
                  <div className="flex items-start gap-2 text-stone-300 text-sm md:text-base leading-snug font-serif italic">
                    <MessageSquare className="w-4 h-4 text-tm-gold flex-shrink-0 mt-1" />
                    <span>"{score.attemptNote}"</span>
                  </div>
                ) : (
                  <div className="text-stone-500 italic text-sm">
                    No attempt notes recorded.
                  </div>
                )}

                {/* Time taken if available */}
                {score?.timeTakenSeconds !== undefined && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/90 text-stone-200 text-xs font-mono border border-stone-700 w-fit">
                    <Clock className="w-3.5 h-3.5 text-tm-gold" />
                    <span>Time: {formatTime(score.timeTakenSeconds)}</span>
                  </div>
                )}

                {/* DQ Notice if already disqualified */}
                {score?.isDisqualified && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/80 border border-red-700 text-red-300 text-xs font-bold uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>Disqualified</span>
                  </div>
                )}
              </div>

              {/* Contestant Seat indicator */}
              <div className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold pt-2 border-t border-stone-800/80 flex justify-between">
                <span>Seat {c.seatIndex + 1}</span>
                <span className="text-stone-400 font-mono">#{c.id.substring(c.id.length - 2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
