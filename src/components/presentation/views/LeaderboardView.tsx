import React, { useState } from 'react';
import { useGame } from '../../../context/GameContext';
import { Trophy, Medal, Sparkles, Layers, Users } from 'lucide-react';

interface LeaderboardViewProps {
  initialMode?: 'episode' | 'series';
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ initialMode = 'episode' }) => {
  const { episodeTotals, seriesTotals, activeEpisode, state } = useGame();
  const [mode, setMode] = useState<'episode' | 'series'>(initialMode);
  const [viewTarget, setViewTarget] = useState<'individual' | 'teams'>('individual');

  const totals = mode === 'episode' ? episodeTotals : seriesTotals;
  const maxScore = Math.max(...totals.map((t) => (mode === 'episode' ? t.episodeScore : t.seriesScore)), 1);

  const teamsMap = new Map((state.teams || []).map((t) => [t.id, t]));
  const hasTeams = (state.teams || []).length > 0;

  // Compute team totals
  const teamTotals = (state.teams || []).map((team) => {
    const memberTotals = totals.filter((t) => t.contestant.teamId === team.id);
    const totalScore = memberTotals.reduce(
      (sum, m) => sum + (mode === 'episode' ? m.episodeScore : m.seriesScore),
      0
    );
    return {
      team,
      memberTotals,
      score: totalScore,
    };
  }).sort((a, b) => b.score - a.score);

  let currentRank = 1;
  const rankedTeamTotals = teamTotals.map((entry, idx) => {
    if (idx > 0 && entry.score < teamTotals[idx - 1].score) {
      currentRank = idx + 1;
    }
    return { ...entry, rank: currentRank };
  });

  const maxTeamScore = Math.max(...teamTotals.map((t) => t.score), 1);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-sm shadow-gold">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>1st</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-400/20 text-slate-200 border border-slate-400/40 font-bold text-sm">
            <Medal className="w-4 h-4 text-slate-300" />
            <span>2nd</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-800/30 text-amber-400 border border-amber-700/40 font-bold text-sm">
            <Medal className="w-4 h-4 text-amber-500" />
            <span>3rd</span>
          </div>
        );
      default:
        return (
          <div className="px-3 py-1 rounded-full bg-stone-800/60 text-stone-400 font-semibold text-sm">
            <span>{rank}th</span>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-8 z-10 w-full max-w-5xl mx-auto">
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="min-w-0 flex-1 text-center md:text-left">
          <h2 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-stone-100 tracking-tight leading-tight break-words">
            {mode === 'episode' ? activeEpisode?.title || 'Episode Standings' : state.seriesTitle}
          </h2>
          <p className="text-tm-gold text-sm md:text-base font-semibold tracking-wider uppercase mt-1">
            {mode === 'episode' ? 'Episode Scoreboard' : 'Cumulative Series Leaderboard'}
            {hasTeams && viewTarget === 'teams' ? ' (Team Totals)' : ''}
          </p>
        </div>

        {/* Controls Container */}
        <div className="flex items-center gap-2 flex-wrap shrink-0 justify-center md:justify-end">
          {/* Contestants vs Teams Toggle (if teams configured) */}
          {hasTeams && (
            <div className="flex items-center bg-stone-900/90 p-1 rounded-xl border border-stone-800 shadow-inner">
              <button
                onClick={() => setViewTarget('individual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewTarget === 'individual'
                    ? 'bg-stone-800 text-stone-100 border border-stone-700 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Solo
              </button>
              <button
                onClick={() => setViewTarget('teams')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewTarget === 'teams'
                    ? 'bg-purple-900/60 text-purple-200 border border-purple-700 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Teams
              </button>
            </div>
          )}

          {/* Episode vs Series Toggle */}
          <div className="flex items-center bg-stone-900/90 p-1.5 rounded-xl border border-stone-800 shadow-inner">
            <button
              onClick={() => setMode('episode')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'episode'
                  ? 'bg-tm-red text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Episode
            </button>
            <button
              onClick={() => setMode('series')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'series'
                  ? 'bg-tm-gold text-stone-950 shadow-md font-black'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              Series
            </button>
          </div>
        </div>
      </div>

      {/* Score Bars List */}
      <div className="space-y-4">
        {viewTarget === 'individual' ? (
          totals.map((entry) => {
            const score = mode === 'episode' ? entry.episodeScore : entry.seriesScore;
            const percentage = Math.max(8, (score / maxScore) * 100);
            const isLeader = entry.rank === 1;
            const team = entry.contestant.teamId ? teamsMap.get(entry.contestant.teamId) : null;

            return (
              <div
                key={entry.contestant.id}
                className={`rounded-2xl p-4 transition-all duration-700 relative overflow-hidden ${
                  isLeader
                    ? 'bg-tm-card/95 border-2 border-tm-gold/80 shadow-gold'
                    : 'bg-tm-card/70 border border-stone-800 shadow-md'
                }`}
              >
                {/* Foreground row */}
                <div className="relative z-10 flex items-center justify-between gap-4">
                  {/* Contestant info & Rank */}
                  <div className="flex items-center gap-3.5 min-w-[200px]">
                    {getRankBadge(entry.rank)}

                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold shadow-md ring-2 ring-white/10"
                      style={{ backgroundColor: entry.contestant.colorHex }}
                    >
                      {entry.contestant.avatar}
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-stone-100 leading-tight">
                        {entry.contestant.name}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-xs text-stone-400">
                          Seat {entry.contestant.seatIndex + 1}
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
                            <span>{team.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score Number Display */}
                  <div className="flex items-baseline gap-2 text-right">
                    <span
                      className={`font-mono text-3xl md:text-4xl font-black tracking-tight ${
                        isLeader ? 'text-tm-goldBright' : 'text-stone-100'
                      }`}
                    >
                      {score}
                    </span>
                    <span className="text-xs uppercase font-bold tracking-widest text-stone-400">
                      PTS
                    </span>
                  </div>
                </div>

                {/* Animated Progress Bar fill in the background */}
                <div
                  className="absolute bottom-0 left-0 top-0 opacity-20 transition-all duration-1000 ease-out pointer-events-none rounded-2xl"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: entry.contestant.colorHex,
                    boxShadow: `0 0 20px ${entry.contestant.colorHex}`,
                  }}
                />
              </div>
            );
          })
        ) : (
          rankedTeamTotals.map((entry) => {
            const percentage = Math.max(8, (entry.score / maxTeamScore) * 100);
            const isLeader = entry.rank === 1;

            return (
              <div
                key={entry.team.id}
                className={`rounded-2xl p-5 transition-all duration-700 relative overflow-hidden ${
                  isLeader
                    ? 'bg-tm-card/95 border-2 border-tm-gold/80 shadow-gold'
                    : 'bg-tm-card/70 border border-stone-800 shadow-md'
                }`}
              >
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-[220px]">
                    {getRankBadge(entry.rank)}

                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shadow-md ring-2 ring-white/10"
                      style={{ backgroundColor: entry.team.colorHex }}
                    >
                      {entry.team.avatar || '🛡️'}
                    </div>

                    <div>
                      <h3 className="font-bold text-xl text-stone-100 leading-tight">
                        {entry.team.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1 flex-wrap">
                        {entry.memberTotals.map((m) => (
                          <span
                            key={m.contestant.id}
                            className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300"
                          >
                            {m.contestant.name} ({mode === 'episode' ? m.episodeScore : m.seriesScore})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 text-right">
                    <span
                      className={`font-mono text-4xl md:text-5xl font-black tracking-tight ${
                        isLeader ? 'text-tm-goldBright' : 'text-stone-100'
                      }`}
                    >
                      {entry.score}
                    </span>
                    <span className="text-xs uppercase font-bold tracking-widest text-stone-400">
                      PTS
                    </span>
                  </div>
                </div>

                {/* Animated Progress Bar fill in the background */}
                <div
                  className="absolute bottom-0 left-0 top-0 opacity-25 transition-all duration-1000 ease-out pointer-events-none rounded-2xl"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: entry.team.colorHex,
                    boxShadow: `0 0 20px ${entry.team.colorHex}`,
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
