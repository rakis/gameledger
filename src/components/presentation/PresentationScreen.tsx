import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { IdleStageView } from './views/IdleStageView';
import { TaskBriefView } from './views/TaskBriefView';
import { AttemptsView } from './views/AttemptsView';
import { ScoreRevealView } from './views/ScoreRevealView';
import { LeaderboardView } from './views/LeaderboardView';
import { WinnerCeremonyView } from './views/WinnerCeremonyView';
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  X,
  SkipForward,
  ChevronRight,
} from 'lucide-react';

interface PresentationScreenProps {
  onCloseEmbedded?: () => void;
}

export const PresentationScreen: React.FC<PresentationScreenProps> = ({ onCloseEmbedded }) => {
  const {
    state,
    toggleSound,
    revealNextScore,
    revealAllScores,
  } = useGame();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Toggle browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request denied', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard navigation on presentation screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsBlackout((prev) => !prev);
      } else if (e.key === ' ') {
        e.preventDefault();
        if (state.presentation.view === 'score_reveal') {
          revealNextScore();
        }
      } else if (e.key === 'Escape') {
        if (onCloseEmbedded && !document.fullscreenElement) {
          onCloseEmbedded();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.presentation.view, revealNextScore, onCloseEmbedded]);

  // Render view router
  const renderCurrentView = () => {
    switch (state.presentation.view) {
      case 'task_brief':
        return <TaskBriefView />;
      case 'attempts':
        return <AttemptsView />;
      case 'score_reveal':
        return <ScoreRevealView />;
      case 'episode_leaderboard':
        return <LeaderboardView initialMode="episode" />;
      case 'series_leaderboard':
        return <LeaderboardView initialMode="series" />;
      case 'winner':
        return <WinnerCeremonyView />;
      case 'idle':
      default:
        return <IdleStageView />;
    }
  };

  return (
    <div
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      className="min-h-screen w-full bg-tm-darker text-stone-100 flex flex-col relative overflow-hidden select-none"
    >
      {/* Background theatrical stage lighting and spotlight effect */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top center spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-gradient-to-b from-tm-red/25 via-tm-redDark/10 to-transparent blur-2xl" />
        {/* Warm ambient corner glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-tm-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tm-red/20 rounded-full blur-3xl" />
      </div>

      {/* Blackout overlay (for dramatic pauses) */}
      {isBlackout && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center cursor-pointer" onClick={() => setIsBlackout(false)}>
          <span className="text-stone-700 text-sm uppercase tracking-widest">
            Screen Blacked Out (Press 'B' or click to resume)
          </span>
        </div>
      )}

      {/* Floating Presentation Control Bar (appears on hover or when stage mode active) */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-opacity duration-300 px-6 py-3 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex items-center justify-between ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full wax-seal flex items-center justify-center text-tm-goldLight font-serif font-black text-xs">
            TM
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-tm-gold block">
              Taskmaster Presentation Mode
            </span>
            <span className="text-sm font-semibold text-stone-200">
              {state.seriesTitle}
            </span>
          </div>
        </div>

        {/* Quick View Switcher & Action buttons */}
        <div className="flex items-center gap-2">
          {state.presentation.view === 'score_reveal' && (
            <>
              <button
                onClick={revealNextScore}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tm-red hover:bg-tm-redBright text-white text-xs font-bold shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
                Next Score (Space)
              </button>
              <button
                onClick={revealAllScores}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
              >
                <SkipForward className="w-4 h-4" />
                Reveal All
              </button>
            </>
          )}

          <button
            onClick={() => setIsBlackout(!isBlackout)}
            title="Blackout screen (B)"
            className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300"
          >
            {isBlackout ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleSound}
            title="Toggle Sound"
            className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300"
          >
            {state.soundEnabled ? <Volume2 className="w-4 h-4 text-tm-gold" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen (F)"
            className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onCloseEmbedded && (
            <button
              onClick={onCloseEmbedded}
              title="Close Presentation View"
              className="p-2 rounded-lg bg-red-900/80 hover:bg-red-800 text-red-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Dynamic View Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative w-full h-full z-10 pt-8 pb-12">
        {renderCurrentView()}
      </main>

      {/* Persistent Bottom Message Banner (if enabled) */}
      {(state.presentation.bannerVisible || state.presentation.displayMessage) && (
        <footer className="fixed bottom-0 left-0 right-0 z-30 bg-tm-redDark/90 border-t-2 border-tm-gold px-6 py-2.5 text-center shadow-lg backdrop-blur-md">
          <p className="font-serif font-black text-tm-goldLight text-sm md:text-base uppercase tracking-widest">
            {state.presentation.displayMessage || 'ALL THE INFORMATION IS ON THE TASK'}
          </p>
        </footer>
      )}
    </div>
  );
};
