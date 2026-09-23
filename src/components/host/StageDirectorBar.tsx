import React from 'react';
import { useGame } from '../../context/GameContext';
import { PresentationViewType } from '../../types';
import {
  Tv,
  FileText,
  Users,
  Eye,
  BarChart3,
  Trophy,
  Crown,
  ChevronRight,
  RotateCcw,
  Sparkles,
  MessageSquare,
  Layers,
  Coins,
} from 'lucide-react';

export const StageDirectorBar: React.FC = () => {
  const {
    state,
    activeTask,
    setPresentationView,
    setActiveSubtask,
    revealNextScore,
    revealAllScores,
    revealAllBets,
    resetReveals,
    setBannerVisible,
    setShowPartLabel,
  } = useGame();

  const currentView = state.presentation.view;
  const betsCount = activeTask?.bets ? Object.keys(activeTask.bets).length : 0;
  const revealedBetsCount = state.presentation.revealedBetContestantIds?.length || 0;
  const hasSubtasks = (activeTask?.subtasks?.length || 0) > 0;

  const viewButtons: { id: PresentationViewType; label: string; icon: React.ElementType }[] = [
    { id: 'idle', label: 'Holding Logo', icon: Crown },
    { id: 'task_brief', label: 'Task Brief', icon: FileText },
    { id: 'attempts', label: 'Attempts', icon: Users },
    { id: 'score_reveal', label: 'Score Reveal', icon: Eye },
    { id: 'episode_leaderboard', label: 'Episode Standings', icon: BarChart3 },
    { id: 'series_leaderboard', label: 'Series Standings', icon: Trophy },
    { id: 'winner', label: 'Crown Champion', icon: Sparkles },
  ];

  return (
    <div className="bg-stone-900/95 border-b border-stone-800 px-4 py-2 sticky top-[53px] z-20 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: TV screen indicator & View Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 border border-stone-700 text-stone-300 text-xs font-semibold mr-1">
            <Tv className="w-3.5 h-3.5 text-tm-gold" />
            <span className="text-[11px] uppercase tracking-wider text-tm-gold font-bold">TV View:</span>
          </div>

          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 flex-wrap">
            {viewButtons.map((btn) => {
              const Icon = btn.icon;
              const isActive = currentView === btn.id;

              return (
                <button
                  key={btn.id}
                  onClick={() => setPresentationView(btn.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-tm-red text-white shadow-gold font-black scale-105 z-10'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle/Right: Subtasks & Reveal controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasSubtasks && ['task_brief', 'attempts', 'score_reveal'].includes(currentView) && (
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-amber-800/60 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-amber-400 px-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Part:
              </span>
              {currentView !== 'task_brief' && (
                <button
                  onClick={() => setActiveSubtask(null)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                    !state.presentation.activeSubtaskId
                      ? 'bg-amber-600 text-white font-bold shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Overview
                </button>
              )}
              {activeTask?.subtasks?.map((st, idx) => {
                const isPartActive = currentView === 'task_brief'
                  ? (state.presentation.activeSubtaskId === st.id || (!state.presentation.activeSubtaskId && idx === 0))
                  : state.presentation.activeSubtaskId === st.id;

                return (
                  <button
                    key={st.id}
                    onClick={() => setActiveSubtask(st.id)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                      isPartActive
                        ? 'bg-amber-600 text-white font-bold shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                    title={st.title}
                  >
                    P{idx + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setShowPartLabel(!state.presentation.showPartLabel)}
                className={`ml-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                  state.presentation.showPartLabel
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500 shadow-sm'
                    : 'bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300'
                }`}
                title={
                  state.presentation.showPartLabel
                    ? 'Part label is visible on TV (click to hide for surprise)'
                    : 'Part label is hidden on TV (click to show on TV)'
                }
              >
                {state.presentation.showPartLabel ? 'TV Label: ON' : 'TV Label: OFF'}
              </button>
            </div>
          )}

          {currentView === 'score_reveal' && (
            <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-tm-gold/40">
              <button
                onClick={revealNextScore}
                disabled={state.presentation.revealedAll}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-tm-red hover:bg-tm-redBright disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all"
                title="Reveal the next score (lowest to highest)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Next Reveal</span>
              </button>

              <button
                onClick={revealAllScores}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
              >
                Reveal All
              </button>

              <button
                onClick={resetReveals}
                title="Hide all scores again"
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {betsCount > 0 && (
                <button
                  onClick={revealAllBets}
                  disabled={revealedBetsCount >= betsCount}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                    revealedBetsCount >= betsCount
                      ? 'bg-purple-950/40 text-purple-400 border-purple-800/40'
                      : 'bg-purple-700 hover:bg-purple-600 text-white border-purple-500 shadow-sm animate-pulse'
                  }`}
                  title="Reveal spectator bets on the presentation screen"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Bets ({revealedBetsCount}/{betsCount})</span>
                </button>
              )}
            </div>
          )}

          {/* Banner Ticker Toggle */}
          <button
            onClick={() => setBannerVisible(!state.presentation.bannerVisible)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              state.presentation.bannerVisible
                ? 'bg-tm-gold/20 text-tm-goldBright border-tm-gold/50'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
            title="Toggle bottom banner message on presentation screen"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Taskmaster Quote</span>
          </button>
        </div>
      </div>
    </div>
  );
};
