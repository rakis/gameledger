import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Tv,
  ExternalLink,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Users,
  Settings,
  Printer,
} from 'lucide-react';

interface HostHeaderProps {
  onToggleContestants: () => void;
  onOpenPresentation: () => void;
  onOpenNewTask: () => void;
  onOpenPrintModal?: () => void;
}

export const HostHeader: React.FC<HostHeaderProps> = ({
  onToggleContestants,
  onOpenPresentation,
  onOpenNewTask,
  onOpenPrintModal,
}) => {
  const {
    state,
    setActiveEpisode,
    addEpisode,
    setSeriesTitle,
    toggleSound,
    openStageWindow,
    triggerConfetti,
    exportJSON,
    importJSON,
    loadDemoData,
    resetToEmpty,
  } = useGame();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(state.seriesTitle);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      setSeriesTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importJSON(content);
        if (success) {
          alert('Game series imported successfully!');
        } else {
          alert('Failed to import file. Ensure it is a valid GameLedger JSON file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="bg-tm-dark/95 border-b border-tm-cardBorder px-4 py-2.5 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Branding & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full wax-seal flex items-center justify-center text-tm-goldLight font-serif font-black text-sm shadow-wax flex-shrink-0">
            TM
          </div>
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <form onSubmit={handleTitleSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSubmit}
                  autoFocus
                  className="bg-stone-900 text-stone-100 px-2 py-0.5 rounded border border-tm-gold text-sm font-bold"
                />
              </form>
            ) : (
              <h1
                onClick={() => {
                  setTitleInput(state.seriesTitle);
                  setIsEditingTitle(true);
                }}
                title="Click to edit series title"
                className="font-serif font-bold text-base md:text-lg text-stone-100 hover:text-tm-gold cursor-pointer transition-colors flex items-center gap-1.5 min-w-0"
              >
                <span className="truncate">{state.seriesTitle}</span>
                <span className="text-xs text-stone-500 font-sans font-normal hidden sm:inline shrink-0">(edit)</span>
              </h1>
            )}

            {/* Episode selector tabs */}
            <div className="flex items-center gap-1.5 mt-0.5 overflow-x-auto max-w-full scrollbar-none py-0.5">
              {state.episodes.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => setActiveEpisode(ep.id)}
                  title={ep.title ? `Ep ${ep.episodeNumber}: ${ep.title}` : `Episode ${ep.episodeNumber}`}
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-all shrink-0 ${
                    ep.id === state.activeEpisodeId
                      ? 'bg-tm-red text-white shadow-sm font-bold'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  Ep {ep.episodeNumber}
                </button>
              ))}
              <button
                onClick={() => addEpisode()}
                title="Add New Episode"
                className="text-stone-400 hover:text-stone-200 hover:bg-stone-800 p-0.5 rounded-full shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Presentation Screen Launchers & Tools */}
        <div className="flex items-center gap-2 shrink-0">
          {/* New Task Button */}
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-semibold border border-stone-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-tm-redBright" />
            <span className="hidden sm:inline">New Task</span>
          </button>

          {/* Contestants Button */}
          <button
            onClick={onToggleContestants}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-semibold border border-stone-800 transition-colors"
          >
            <Users className="w-4 h-4 text-tm-gold" />
            <span className="hidden sm:inline">Contestants</span>
            <span className="bg-stone-800 px-1.5 py-0.2 rounded text-[10px] text-stone-300 font-mono">
              {state.contestants.length}
            </span>
          </button>

          {/* Presentation Launchers */}
          <button
            onClick={onOpenPresentation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tm-red hover:bg-tm-redBright text-white text-xs font-bold shadow-gold transition-all"
            title="Present stage display in current window"
          >
            <Tv className="w-4 h-4" />
            <span className="hidden sm:inline">Present Screen</span>
          </button>

          <button
            onClick={openStageWindow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors"
            title="Open stage display in a separate popup window (for TV/Projector)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-tm-gold" />
            <span className="hidden md:inline">TV Popout</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={state.soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800"
          >
            {state.soundEnabled ? <Volume2 className="w-4 h-4 text-tm-gold" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          {/* More Settings & Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800"
              title="Options & Data"
            >
              <Settings className="w-4 h-4" />
            </button>

            {showSettingsDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSettingsDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-stone-900 rounded-xl shadow-2xl border border-stone-700 py-2 z-50 text-xs font-medium space-y-1">
                  <div className="px-3 py-1.5 border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                    Game Series Controls
                  </div>

                  <button
                    onClick={() => {
                      triggerConfetti();
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-white text-left"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Trigger Confetti Burst
                  </button>

                  {onOpenPrintModal && (
                    <button
                      onClick={() => {
                        onOpenPrintModal();
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-white text-left"
                    >
                      <Printer className="w-4 h-4 text-tm-gold" />
                      <span>Print Task Sheets</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      exportJSON();
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-white text-left"
                  >
                    <Download className="w-4 h-4 text-tm-gold" />
                    Export Series (JSON)
                  </button>

                  <label className="w-full flex items-center gap-2 px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-white text-left cursor-pointer">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Import Series (JSON)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        handleFileImport(e);
                        setShowSettingsDropdown(false);
                      }}
                      className="hidden"
                    />
                  </label>

                  <div className="border-t border-stone-800 pt-1">
                    <button
                      onClick={() => {
                        if (confirm('Load sample Taskmaster demo data? This will overwrite existing unsaved changes.')) {
                          loadDemoData();
                        }
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-amber-300 hover:bg-stone-800 text-left"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Load Demo Game (Series 1)
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Start a fresh new empty game? All existing data will be cleared.')) {
                          resetToEmpty();
                        }
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-950/50 text-left"
                    >
                      <RotateCcw className="w-4 h-4 text-red-500" />
                      Reset to Empty Game
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
