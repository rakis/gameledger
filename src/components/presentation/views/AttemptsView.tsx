import React from 'react';
import { useGame } from '../../../context/GameContext';
import { Clock, MessageSquare, AlertCircle, Eye, Coins, Layers } from 'lucide-react';

export const AttemptsView: React.FC = () => {
  const { activeTask, state } = useGame();

  if (!activeTask) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 font-serif text-2xl">
        No task active.
      </div>
    );
  }

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

  // Active contestants vs Sat-Out contestants
  const assignedIds = activeTask.assignedContestantIds || state.contestants.map((c) => c.id);
  const activeContestants = state.contestants.filter((c) => assignedIds.includes(c.id));
  const satOutContestants = state.contestants.filter((c) => !assignedIds.includes(c.id));

  const formatTime = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const getScoreEntry = (contestantId: string) => {
    if (currentSubtask && currentSubtask.scores) {
      return currentSubtask.scores[contestantId];
    }
    return activeTask.scores[contestantId];
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-8 z-10 w-full max-w-7xl mx-auto">
      {/* Header bar */}
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
        <p className="text-tm-gold text-sm md:text-base font-medium tracking-wide uppercase mt-1">
          Contestant Attempts & Submissions
        </p>
      </div>

      {/* Grid of Active Contestants */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 items-stretch">
        {activeContestants.map((c) => {
          const score = getScoreEntry(c.id);
          const isSpotlight = state.presentation.spotlightContestantId === c.id;
          const team = c.teamId ? teamsMap.get(c.teamId) : null;

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
                  {team && (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border mt-0.5"
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

      {/* Sat-Out Spectators Bench */}
      {satOutContestants.length > 0 && (
        <div className="mt-8 bg-stone-950/80 border border-purple-900/50 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-stone-800/80">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <h3 className="font-serif font-bold text-sm text-purple-200 uppercase tracking-wider">
                Spectator Bench & Winner Predictions
              </h3>
            </div>
            <span className="text-xs text-stone-400 font-medium">
              {satOutContestants.length} Sitting Out
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {satOutContestants.map((c) => {
              const bet = activeTask.bets ? activeTask.bets[c.id] : undefined;
              const targetContestant = bet?.targetContestantId
                ? state.contestants.find((tc) => tc.id === bet.targetContestantId)
                : null;
              const targetTeam = bet?.targetTeamId
                ? (state.teams || []).find((tt) => tt.id === bet.targetTeamId)
                : null;

              return (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-stone-900/80 border border-purple-900/30 flex items-start gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ring-1 ring-white/10"
                    style={{ backgroundColor: c.colorHex }}
                  >
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-stone-200 truncate">{c.name}</h4>
                    {bet ? (
                      <div className="mt-1 space-y-1">
                        <div className="text-xs text-purple-300 flex items-center gap-1 font-semibold">
                          <Coins className="w-3.5 h-3.5 text-tm-gold" />
                          <span>
                            Backs:{' '}
                            <strong className="text-stone-100">
                              {targetContestant
                                ? targetContestant.name
                                : targetTeam
                                ? `${targetTeam.avatar || '🛡️'} ${targetTeam.name}`
                                : 'Contestant'}
                            </strong>
                          </span>
                        </div>
                        {bet.rewardPoints > 0 && (
                          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/60 font-mono font-bold">
                            +{bet.rewardPoints} pts payout
                          </span>
                        )}
                        {bet.notes && (
                          <p className="text-[11px] text-stone-400 italic truncate">
                            "{bet.notes}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-stone-500 italic mt-1 block">
                        Spectating
                      </span>
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
