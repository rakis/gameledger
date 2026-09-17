import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Trophy, BarChart3, ChevronRight, ChevronLeft, Crown } from 'lucide-react';

export const HostSummaryDrawer: React.FC = () => {
  const { episodeTotals, seriesTotals, setPresentationView } = useGame();
  const [isOpen, setIsOpen] = useState(true);
  const [tab, setTab] = useState<'episode' | 'series'>('episode');

  const totals = tab === 'episode' ? episodeTotals : seriesTotals;

  return (
    <div
      className={`hidden lg:flex flex-col bg-stone-900/90 border-l border-stone-800 transition-all duration-300 ${
        isOpen ? 'w-72' : 'w-12'
      }`}
    >
      {/* Toggle button */}
      <div className="p-3 border-b border-stone-800 flex items-center justify-between">
        {isOpen && (
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-tm-gold" />
            <h3 className="font-serif font-bold text-xs text-stone-200 uppercase tracking-wider">
              Live Scores
            </h3>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200"
          title={isOpen ? 'Collapse panel' : 'Expand scores'}
        >
          {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 mb-3 text-xs">
            <button
              onClick={() => setTab('episode')}
              className={`flex-1 py-1 rounded-lg font-bold transition-all ${
                tab === 'episode'
                  ? 'bg-tm-red text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Episode
            </button>
            <button
              onClick={() => setTab('series')}
              className={`flex-1 py-1 rounded-lg font-bold transition-all ${
                tab === 'series'
                  ? 'bg-tm-gold text-stone-950 font-black shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Series Total
            </button>
          </div>

          {/* Standings List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {totals.map((entry) => {
              const score = tab === 'episode' ? entry.episodeScore : entry.seriesScore;
              const isFirst = entry.rank === 1;

              return (
                <div
                  key={entry.contestant.id}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                    isFirst
                      ? 'bg-stone-950 border-tm-gold/60 shadow-sm'
                      : 'bg-stone-950/40 border-stone-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 text-center text-xs font-bold ${
                        isFirst ? 'text-tm-gold' : 'text-stone-500'
                      }`}
                    >
                      {entry.rank}
                    </span>

                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
                      style={{ backgroundColor: entry.contestant.colorHex }}
                    >
                      {entry.contestant.avatar}
                    </div>

                    <span className="font-bold text-xs text-stone-200 truncate max-w-[100px]">
                      {entry.contestant.name}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-stone-100">
                      {score}
                    </span>
                    <span className="text-[10px] text-stone-500 ml-1 font-semibold">
                      pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fast Stage Presenter Actions */}
          <div className="pt-3 border-t border-stone-800 space-y-1.5">
            <button
              onClick={() => setPresentationView(tab === 'episode' ? 'episode_leaderboard' : 'series_leaderboard')}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-tm-gold text-xs font-bold border border-stone-700 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Show {tab === 'episode' ? 'Episode' : 'Series'} on TV</span>
            </button>

            <button
              onClick={() => setPresentationView('winner')}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-bold border border-amber-500/40 transition-colors"
            >
              <Crown className="w-3.5 h-3.5 text-tm-goldBright" />
              <span>Crown Winner on TV</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
