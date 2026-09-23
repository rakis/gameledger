import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  Settings2,
  Plus,
  Minus,
} from 'lucide-react';
import {
  PrintOptions,
  PrintablePageItem,
} from '../../utils/printTasks';

interface PrintTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScope?: PrintOptions['scope'];
  options: PrintOptions;
  setOptions: React.Dispatch<React.SetStateAction<PrintOptions>>;
  pages: PrintablePageItem[];
}

export const PrintTasksModal: React.FC<PrintTasksModalProps> = ({
  isOpen,
  onClose,
  initialScope = 'episode',
  options,
  setOptions,
  pages,
}) => {
  const { activeEpisode, state } = useGame();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Sync initial scope when opening
  useEffect(() => {
    if (isOpen && initialScope) {
      setOptions((prev) => ({ ...prev, scope: initialScope }));
    }
  }, [isOpen, initialScope, setOptions]);

  // Keep preview index in bounds if page count changes
  useEffect(() => {
    if (currentPageIndex >= pages.length) {
      setCurrentPageIndex(Math.max(0, pages.length - 1));
    }
  }, [pages.length, currentPageIndex]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPreviewPage = pages[currentPageIndex];

  const handlePrint = () => {
    // Small timeout to ensure any state flush before native print dialog opens
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Dynamically scale preview font size relative to sheet preview dimensions
  const previewFontSizePx = Math.max(10, Math.round(options.fontSizePt * 0.72));
  const previewTitleFontSizePx = Math.round(previewFontSizePx * 1.15);

  const activeTask = activeEpisode?.tasks.find((t) => t.id === state.activeTaskId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in screen-only">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-stone-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-tm-red/20 text-tm-redBright border border-tm-red/40">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
                <span>Print Task Sheets</span>
                <span className="text-xs font-sans font-normal px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                  {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Centered on clean white paper in authentic typewriter font for envelopes or handouts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two columns (Options left, Live preview right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-6">
            {/* Scope Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-tm-gold block mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Print Scope</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOptions((prev) => ({ ...prev, scope: 'episode' }))}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    options.scope === 'episode'
                      ? 'bg-tm-card border-tm-gold text-tm-goldLight shadow-sm'
                      : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <span className="block font-bold">This Episode</span>
                  <span
                    className="text-[10px] text-stone-400 font-normal truncate block max-w-full"
                    title={activeEpisode?.title ? `Ep ${activeEpisode.episodeNumber}: ${activeEpisode.title}` : undefined}
                  >
                    Ep {activeEpisode?.episodeNumber ?? 1} ({activeEpisode?.tasks.length ?? 0} tasks)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOptions((prev) => ({ ...prev, scope: 'current_task' }))}
                  disabled={!activeTask}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    options.scope === 'current_task'
                      ? 'bg-tm-card border-tm-gold text-tm-goldLight shadow-sm'
                      : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  } ${!activeTask ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="block font-bold">Current Task</span>
                  <span className="text-[10px] text-stone-400 font-normal truncate block">
                    {activeTask ? activeTask.title : 'None selected'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOptions((prev) => ({ ...prev, scope: 'series' }))}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    options.scope === 'series'
                      ? 'bg-tm-card border-tm-gold text-tm-goldLight shadow-sm'
                      : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <span className="block font-bold">Entire Series</span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    {state.episodes.length} episodes
                  </span>
                </button>
              </div>
            </div>

            {/* Layout & Content Options */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-tm-gold block mb-2 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                <span>Sheet Content & Options</span>
              </label>

              <div className="space-y-3 bg-stone-950/70 p-4 rounded-xl border border-stone-800">
                {/* Include Title Toggle */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.includeTitle}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, includeTitle: e.target.checked }))
                    }
                    className="mt-0.5 rounded border-stone-700 text-tm-red focus:ring-tm-gold cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-200 block">
                      Include Task Title
                    </span>
                    <span className="text-[11px] text-stone-400 block leading-tight">
                      Leave off for authentic Taskmaster sealed envelopes (text-only surprise).
                    </span>
                  </div>
                </label>

                {/* Separate Subtasks Toggle */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.separateSubtasks}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, separateSubtasks: e.target.checked }))
                    }
                    className="mt-0.5 rounded border-stone-700 text-tm-red focus:ring-tm-gold cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-200 block">
                      Multi-Part Tasks: Separate Page per Part
                    </span>
                    <span className="text-[11px] text-stone-400 block leading-tight">
                      Prints Part 1, Part 2 on separate sheets for sequential envelope opening.
                    </span>
                  </div>
                </label>

                {/* Include Time Limit Notice */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.includeTimeLimit}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, includeTimeLimit: e.target.checked }))
                    }
                    className="mt-0.5 rounded border-stone-700 text-tm-red focus:ring-tm-gold cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-200 block flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Include Time Limit Notice</span>
                    </span>
                    <span className="text-[11px] text-stone-400 block leading-tight">
                      Appends "You have X minutes." if the task is timed.
                    </span>
                  </div>
                </label>

                {/* Append "Your time starts now." */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.appendTimeStartsNow}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        appendTimeStartsNow: e.target.checked,
                      }))
                    }
                    className="mt-0.5 rounded border-stone-700 text-tm-red focus:ring-tm-gold cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-200 block">
                      Include "Your time starts now."
                    </span>
                    <span className="text-[11px] text-stone-400 block leading-tight">
                      Appends the classic Taskmaster line at the end of the brief.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Typography Font Size with Dynamic +/- Controls */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-tm-gold">
                  Font Size
                </label>
                <span className="text-xs font-mono font-bold text-tm-goldLight bg-stone-950 px-2.5 py-0.5 rounded-full border border-stone-800 shadow-inner">
                  {options.fontSizePt} pt
                </span>
              </div>

              <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800 space-y-3">
                {/* Stepper with +/- buttons and dynamic slider */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setOptions((prev) => ({
                        ...prev,
                        fontSizePt: Math.max(12, prev.fontSizePt - 1),
                      }))
                    }
                    disabled={options.fontSizePt <= 12}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-200 border border-stone-700 hover:border-tm-gold transition-colors cursor-pointer flex-shrink-0"
                    title="Decrease font size (-1pt)"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="range"
                      min="12"
                      max="40"
                      step="1"
                      value={options.fontSizePt}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setOptions((prev) => ({ ...prev, fontSizePt: val }));
                      }}
                      className="w-full accent-tm-gold cursor-pointer h-2 bg-stone-800 rounded-lg appearance-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setOptions((prev) => ({
                        ...prev,
                        fontSizePt: Math.min(40, prev.fontSizePt + 1),
                      }))
                    }
                    disabled={options.fontSizePt >= 40}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-200 border border-stone-700 hover:border-tm-gold transition-colors cursor-pointer flex-shrink-0"
                    title="Increase font size (+1pt)"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  {[
                    { label: 'Compact', pt: 16 },
                    { label: 'Standard', pt: 20 },
                    { label: 'Large', pt: 24 },
                    { label: 'Bold', pt: 28 },
                    { label: 'Jumbo', pt: 34 },
                  ].map((preset) => (
                    <button
                      key={preset.pt}
                      type="button"
                      onClick={() =>
                        setOptions((prev) => ({ ...prev, fontSizePt: preset.pt }))
                      }
                      className={`flex-1 min-w-[50px] py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        options.fontSizePt === preset.pt
                          ? 'bg-tm-card border-tm-gold text-tm-goldLight shadow-sm'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="text-[10px] block opacity-70 font-mono font-normal">
                        {preset.pt}pt
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Sheet Preview ({pages.length === 0 ? 0 : currentPageIndex + 1} of {pages.length})
              </label>

              {pages.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentPageIndex === 0}
                    className="p-1 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-200"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-stone-400 px-1">
                    {currentPageIndex + 1}/{pages.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))
                    }
                    disabled={currentPageIndex >= pages.length - 1}
                    className="p-1 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-200"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Simulated Blank White Paper (Standard A4 / Letter proportion) */}
            <div className="flex-1 bg-stone-950 p-4 rounded-xl border border-stone-800 flex items-center justify-center min-h-[360px] overflow-hidden">
              {pages.length === 0 ? (
                <div className="text-xs text-stone-500 italic text-center p-6">
                  No tasks found in the selected scope.
                </div>
              ) : (
                <div
                  className="w-full max-w-[360px] aspect-[1/1.3] bg-white text-black shadow-2xl rounded-sm p-6 sm:p-8 flex flex-col justify-center items-center text-center select-none overflow-hidden transition-all"
                  style={{
                    fontFamily: 'var(--font-typewriter)',
                  }}
                >
                  {/* Task Title (if enabled) */}
                  {currentPreviewPage?.renderedTitle && (
                    <div
                      className="font-serif font-bold text-stone-900 mb-4 pb-2 border-b border-stone-300 w-full text-center"
                      style={{ fontSize: `${previewTitleFontSizePx}px` }}
                    >
                      {currentPreviewPage.renderedTitle}
                    </div>
                  )}

                  {/* Task Brief Content */}
                  <div
                    className="font-medium tracking-wide whitespace-pre-wrap text-stone-900"
                    style={{ fontSize: `${previewFontSizePx}px`, lineHeight: 1.6 }}
                  >
                    {currentPreviewPage?.renderedBrief}
                  </div>

                  {/* Time limit if applicable */}
                  {currentPreviewPage?.timeLimitNotice && (
                    <div
                      className="mt-4 font-medium text-stone-800"
                      style={{ fontSize: `${previewFontSizePx}px`, lineHeight: 1.6 }}
                    >
                      {currentPreviewPage.timeLimitNotice}
                    </div>
                  )}

                  {/* "Your time starts now." */}
                  {currentPreviewPage?.timeStartsNotice && (
                    <div
                      className="mt-3 font-bold text-stone-950"
                      style={{ fontSize: `${previewFontSizePx}px`, lineHeight: 1.6 }}
                    >
                      {currentPreviewPage.timeStartsNotice}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between gap-3">
          <div className="text-xs text-stone-400 hidden sm:block">
            {pages.length > 0 ? (
              <span>
                Ready to print <strong className="text-stone-200">{pages.length}</strong> separate{' '}
                {pages.length === 1 ? 'task sheet' : 'task sheets'}.
              </span>
            ) : (
              <span>No pages to print.</span>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={pages.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tm-red hover:bg-tm-redBright disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-gold transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
