import React from 'react';
import { useGame } from '../../../context/GameContext';
import { AlertOctagon, PlusCircle, MinusCircle } from 'lucide-react';

export const ScoreRevealView: React.FC = () => {
  const { activeTask, state, revealContestant } = useGame();

  if (!activeTask) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 font-serif text-2xl">
        No task active.
      </div>
    );
  }

  const { revealedContestantIds } = state.presentation;

  return (
    <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-8 z-10 w-full max-w-7xl mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="font-serif font-black text-2xl md:text-4xl text-stone-100 tracking-tight">
          {activeTask.title}
        </h2>
        <p className="text-tm-gold text-sm md:text-base font-semibold tracking-wider uppercase mt-1">
          Taskmaster's Official Judgment
        </p>
      </div>

      {/* Contestant Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6 items-stretch">
        {state.contestants.map((c) => {
          const score = activeTask.scores[c.id];
          const isRevealed = revealedContestantIds.includes(c.id);
          const isDQ = score?.isDisqualified ?? false;
          const points = isDQ ? 0 : (score?.points ?? 0);

          return (
            <div
              key={c.id}
              onClick={() => revealContestant(c.id)}
              className={`flex flex-col rounded-2xl p-5 border transition-all duration-500 cursor-pointer select-none relative overflow-hidden ${
                isRevealed
                  ? isDQ
                    ? 'bg-red-950/40 border-red-700/80 shadow-lg'
                    : points === 5
                    ? 'bg-tm-card border-tm-goldBright shadow-gold-lg ring-2 ring-tm-gold/80 scale-105 z-10'
                    : 'bg-tm-card/90 border-tm-cardBorder shadow-md'
                  : 'bg-tm-card/60 border-stone-800 hover:border-tm-gold/40 hover:scale-[1.02]'
              }`}
            >
              {/* Contestant Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-stone-800/80">
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
                  <span className="text-xs text-stone-400">
                    Seat {c.seatIndex + 1}
                  </span>
                </div>
              </div>

              {/* Score Display Area */}
              <div className="flex-1 flex flex-col items-center justify-center py-6 min-h-[160px] relative">
                {isRevealed ? (
                  isDQ ? (
                    <div className="text-center space-y-2 animate-bounce-short">
                      <div className="dq-stamp px-3 py-1.5 rounded-lg text-lg md:text-xl flex items-center gap-1.5 justify-center">
                        <AlertOctagon className="w-5 h-5 flex-shrink-0" />
                        <span>DISQUALIFIED</span>
                      </div>
                      <div className="font-mono text-4xl font-black text-red-500">
                        0 <span className="text-sm font-bold text-red-400">PTS</span>
                      </div>
                      {score?.dqReason && (
                        <p className="text-xs text-red-300/80 italic max-w-[180px] leading-tight pt-1">
                          "{score.dqReason}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center space-y-1 transform transition-all duration-300">
                      <div className="font-mono text-6xl md:text-7xl font-black text-tm-goldLight tracking-tight filter drop-shadow">
                        {points}
                      </div>
                      <div className="text-xs md:text-sm uppercase font-bold tracking-widest text-tm-gold">
                        {points === 1 ? 'Point' : 'Points'}
                      </div>

                      {/* Bonus or penalty chips */}
                      {Boolean(score?.bonusPoints) && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
                          <PlusCircle className="w-3 h-3" />+{score?.bonusPoints} bonus
                        </span>
                      )}
                      {Boolean(score?.penaltyPoints) && (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-semibold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-700/50">
                          <MinusCircle className="w-3 h-3" />-{score?.penaltyPoints} penalty
                        </span>
                      )}
                    </div>
                  )
                ) : (
                  /* Hidden State: Wax Seal emblem */
                  <div className="flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <div className="w-20 h-20 rounded-full wax-seal flex items-center justify-center shadow-wax">
                      <span className="font-serif font-black text-3xl text-tm-goldLight">
                        ?
                      </span>
                    </div>
                    <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold mt-3">
                      Click to Reveal
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-note */}
              {score?.attemptNote && isRevealed && (
                <div className="text-xs text-stone-400 font-serif italic truncate border-t border-stone-800 pt-2 text-center">
                  "{score.attemptNote}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
