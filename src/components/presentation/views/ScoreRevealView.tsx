import React from 'react';
import { useGame } from '../../../context/GameContext';
import { AlertOctagon, PlusCircle, MinusCircle, Coins, Layers } from 'lucide-react';

export const ScoreRevealView: React.FC = () => {
  const { activeTask, state, revealContestant, revealBet } = useGame();

  if (!activeTask) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 font-serif text-2xl">
        No task active.
      </div>
    );
  }

  const { revealedContestantIds } = state.presentation;
  const revealedBetIds = state.presentation.revealedBetContestantIds || [];

  // Active subtask if any
  const currentSubtask = state.presentation.activeSubtaskId && activeTask.subtasks
    ? activeTask.subtasks.find((s) => s.id === state.presentation.activeSubtaskId)
    : null;

  const subtaskIndex = currentSubtask && activeTask.subtasks
    ? activeTask.subtasks.findIndex((s) => s.id === currentSubtask.id)
    : -1;

  const displayedTitle = currentSubtask
    ? `${activeTask.title}: Part ${subtaskIndex + 1} - ${currentSubtask.title}`
    : activeTask.title;

  const teamsMap = new Map((state.teams || []).map((t) => [t.id, t]));

  // Active contestants
  const assignedIds = activeTask.assignedContestantIds || state.contestants.map((c) => c.id);
  const activeContestants = state.contestants.filter((c) => assignedIds.includes(c.id));

  const getScoreEntry = (contestantId: string) => {
    if (currentSubtask && currentSubtask.scores) {
      return currentSubtask.scores[contestantId];
    }
    return activeTask.scores[contestantId];
  };

  const bets = activeTask.bets || {};
  const bettorIds = Object.keys(bets);

  return (
    <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-8 z-10 w-full max-w-7xl mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        {currentSubtask && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60 text-xs font-bold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Part {subtaskIndex + 1}</span>
          </div>
        )}
        <h2 className="font-serif font-black text-2xl md:text-4xl text-stone-100 tracking-tight">
          {displayedTitle}
        </h2>
        <p className="text-tm-gold text-sm md:text-base font-semibold tracking-wider uppercase mt-1">
          Taskmaster's Official Judgment
        </p>
      </div>

      {/* Active Contestant Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 items-stretch">
        {activeContestants.map((c) => {
          const score = getScoreEntry(c.id);
          const isRevealed = revealedContestantIds.includes(c.id);
          const isDQ = score?.isDisqualified ?? false;
          const points = isDQ ? 0 : (score?.points ?? 0);
          const team = c.teamId ? teamsMap.get(c.teamId) : null;

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
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-xs text-stone-400">
                      Seat {c.seatIndex + 1}
                    </span>
                    {team && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border"
                        style={{
                          backgroundColor: `${team.colorHex}25`,
                          borderColor: `${team.colorHex}66`,
                          color: team.colorHex,
                        }}
                      >
                        <span>{team.avatar || '🛡️'}</span>
                        <span className="truncate">{team.name}</span>
                      </span>
                    )}
                  </div>
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

      {/* Spectator Bets & Wagers Reveal Shelf */}
      {bettorIds.length > 0 && (
        <div className="mt-8 bg-stone-950/80 border border-purple-900/60 rounded-2xl p-6 shadow-xl backdrop-blur-sm animate-fade-in">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-tm-gold" />
              <h3 className="font-serif font-bold text-base text-purple-200 uppercase tracking-wider">
                Spectator Winner Wagers
              </h3>
            </div>
            <span className="text-xs text-stone-400">
              {revealedBetIds.length} of {bettorIds.length} Revealed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bettorIds.map((bettorId) => {
              const bettor = state.contestants.find((c) => c.id === bettorId);
              if (!bettor) return null;

              const bet = bets[bettorId];
              const isRevealed = revealedBetIds.includes(bettorId);
              const targetContestant = bet.targetContestantId
                ? state.contestants.find((tc) => tc.id === bet.targetContestantId)
                : null;
              const targetTeam = bet.targetTeamId
                ? (state.teams || []).find((tt) => tt.id === bet.targetTeamId)
                : null;

              const isWon = bet.isWon === true;
              const isLost = bet.isWon === false;

              return (
                <div
                  key={bettorId}
                  onClick={() => revealBet(bettorId)}
                  className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between ${
                    isRevealed
                      ? isWon
                        ? 'bg-emerald-950/40 border-emerald-600/80 shadow-gold'
                        : isLost
                        ? 'bg-stone-900/60 border-stone-800'
                        : 'bg-purple-950/40 border-purple-800/80'
                      : 'bg-stone-900/90 border-purple-900/40 hover:border-tm-gold/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ring-1 ring-white/10"
                      style={{ backgroundColor: bettor.colorHex }}
                    >
                      {bettor.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-stone-100 truncate">{bettor.name}</h4>
                      <span className="text-[11px] text-purple-300 uppercase tracking-wider font-semibold">
                        Spectator Bet
                      </span>
                    </div>
                  </div>

                  <div className="my-3 min-h-[50px] flex flex-col items-center justify-center">
                    {isRevealed ? (
                      <div className="text-center space-y-1 animate-fade-in w-full">
                        <div className="text-xs text-stone-300">
                          Backed:{' '}
                          <strong className="text-stone-100">
                            {targetContestant
                              ? targetContestant.name
                              : targetTeam
                              ? `${targetTeam.avatar || '🛡️'} ${targetTeam.name}`
                              : 'Selection'}
                          </strong>
                        </div>
                        {isWon && (
                          <div className="text-sm font-black text-emerald-400 flex items-center justify-center gap-1">
                            <span>+{bet.rewardPoints} PTS WON!</span>
                          </div>
                        )}
                        {isLost && (
                          <div className="text-xs font-semibold text-stone-500 line-through">
                            0 PTS (Missed)
                          </div>
                        )}
                        {!isWon && !isLost && (
                          <div className="text-xs font-bold text-amber-300">
                            +{bet.rewardPoints} PTS (Pending)
                          </div>
                        )}
                        {bet.notes && (
                          <p className="text-[11px] text-stone-400 italic truncate pt-0.5">
                            "{bet.notes}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-9 h-9 rounded-full wax-seal flex items-center justify-center shadow-sm">
                          <span className="font-serif font-black text-base text-tm-goldLight">?</span>
                        </div>
                        <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider mt-1">
                          Click to Reveal
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
