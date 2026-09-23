import React, { useState, useEffect, useMemo } from 'react';
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
  Layers,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  PrintOptions,
  PrintablePageItem,
  TaskPrintOptions,
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
  const { activeEpisode, state, updateTask } = useGame();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [targetMode, setTargetMode] = useState<'all' | 'single'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

  // Extract unique tasks in scope for printing
  const uniqueTasksInScope = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    for (const page of pages) {
      if (!map.has(page.taskId)) {
        map.set(page.taskId, { id: page.taskId, title: page.taskTitle });
      }
    }
    return Array.from(map.values());
  }, [pages]);

  const allTasksMap = useMemo(() => {
    const map = new Map<string, (typeof state.episodes)[0]['tasks'][0]>();
    for (const ep of state.episodes) {
      for (const t of ep.tasks) {
        map.set(t.id, t);
      }
    }
    return map;
  }, [state.episodes]);

  // Keep selectedTaskId in sync with available tasks in scope
  useEffect(() => {
    if (uniqueTasksInScope.length > 0) {
      if (!selectedTaskId || !uniqueTasksInScope.some((t) => t.id === selectedTaskId)) {
        const foundActive = uniqueTasksInScope.find((t) => t.id === state.activeTaskId);
        const currentPreviewId = pages[currentPageIndex]?.taskId;
        const foundPreview = uniqueTasksInScope.find((t) => t.id === currentPreviewId);
        setSelectedTaskId(foundActive?.id || foundPreview?.id || uniqueTasksInScope[0].id);
      }
    }
  }, [uniqueTasksInScope, state.activeTaskId, selectedTaskId, pages, currentPageIndex]);

  if (!isOpen) return null;

  const currentPreviewPage = pages[currentPageIndex];
  const activeTask = activeEpisode?.tasks.find((t) => t.id === state.activeTaskId);

  // Selected task model
  const selectedTask = allTasksMap.get(selectedTaskId);
  const taskOverride = options.taskOverrides?.[selectedTaskId];
  const taskStoredOpts = taskOverride ?? selectedTask?.printOptions;
  const isTaskCustomized = Boolean(
    (options.taskOverrides && selectedTaskId in options.taskOverrides) ||
    selectedTask?.printOptions
  );

  // Current values reflected in the controls
  const activeControls = {
    includeTitle:
      targetMode === 'single'
        ? (taskStoredOpts?.includeTitle ?? options.includeTitle)
        : options.includeTitle,
    separateSubtasks:
      targetMode === 'single'
        ? (taskStoredOpts?.separateSubtasks ?? options.separateSubtasks)
        : options.separateSubtasks,
    includeTimeLimit:
      targetMode === 'single'
        ? (taskStoredOpts?.includeTimeLimit ?? options.includeTimeLimit)
        : options.includeTimeLimit,
    appendTimeStartsNow:
      targetMode === 'single'
        ? (taskStoredOpts?.appendTimeStartsNow ?? options.appendTimeStartsNow)
        : options.appendTimeStartsNow,
    fontSizePt:
      targetMode === 'single'
        ? (taskStoredOpts?.fontSizePt ?? options.fontSizePt)
        : options.fontSizePt,
  };

  const handleOptionChange = <K extends keyof TaskPrintOptions>(
    key: K,
    value: TaskPrintOptions[K]
  ) => {
    if (targetMode === 'all') {
      setOptions((prev) => ({
        ...prev,
        [key]: value,
      }));
    } else if (selectedTaskId) {
      const updatedOpts: TaskPrintOptions = {
        includeTitle: activeControls.includeTitle,
        separateSubtasks: activeControls.separateSubtasks,
        includeTimeLimit: activeControls.includeTimeLimit,
        appendTimeStartsNow: activeControls.appendTimeStartsNow,
        fontSizePt: activeControls.fontSizePt,
        [key]: value,
      };

      setOptions((prev) => ({
        ...prev,
        taskOverrides: {
          ...(prev.taskOverrides || {}),
          [selectedTaskId]: updatedOpts,
        },
      }));

      updateTask(selectedTaskId, {
        printOptions: updatedOpts,
      });
    }
  };

  const handleApplyToAll = () => {
    const newGlobalOptions = {
      includeTitle: activeControls.includeTitle,
      separateSubtasks: activeControls.separateSubtasks,
      includeTimeLimit: activeControls.includeTimeLimit,
      appendTimeStartsNow: activeControls.appendTimeStartsNow,
      fontSizePt: activeControls.fontSizePt,
    };

    setOptions((prev) => ({
      ...prev,
      ...newGlobalOptions,
      taskOverrides: {},
    }));

    uniqueTasksInScope.forEach((t) => {
      updateTask(t.id, { printOptions: undefined });
    });

    setFeedbackMessage('Applied options to all tasks');
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  const handleApplyToOnlyThisTask = () => {
    if (!selectedTaskId) return;

    const currentOpts: TaskPrintOptions = {
      includeTitle: activeControls.includeTitle,
      separateSubtasks: activeControls.separateSubtasks,
      includeTimeLimit: activeControls.includeTimeLimit,
      appendTimeStartsNow: activeControls.appendTimeStartsNow,
      fontSizePt: activeControls.fontSizePt,
    };

    setOptions((prev) => ({
      ...prev,
      taskOverrides: {
        ...(prev.taskOverrides || {}),
        [selectedTaskId]: currentOpts,
      },
    }));

    updateTask(selectedTaskId, {
      printOptions: currentOpts,
    });

    setTargetMode('single');
    setFeedbackMessage(`Applied options to only "${selectedTask?.title || 'task'}"`);
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  const handleResetTaskToDefault = () => {
    if (!selectedTaskId) return;

    setOptions((prev) => {
      const nextOverrides = { ...(prev.taskOverrides || {}) };
      delete nextOverrides[selectedTaskId];
      return {
        ...prev,
        taskOverrides: nextOverrides,
      };
    });

    updateTask(selectedTaskId, {
      printOptions: undefined,
    });

    setFeedbackMessage(`Reset "${selectedTask?.title || 'task'}" to default`);
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  const handlePageChange = (newIndex: number) => {
    const bounded = Math.max(0, Math.min(pages.length - 1, newIndex));
    setCurrentPageIndex(bounded);
    if (targetMode === 'single' && pages[bounded]) {
      setSelectedTaskId(pages[bounded].taskId);
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    const targetPageIdx = pages.findIndex((p) => p.taskId === taskId);
    if (targetPageIdx !== -1) {
      setCurrentPageIndex(targetPageIdx);
    }
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Preview font size based on the current preview page's resolved font size
  const previewSheetFontSizePt =
    currentPreviewPage?.fontSizePt ?? activeControls.fontSizePt;
  const previewFontSizePx = Math.max(10, Math.round(previewSheetFontSizePt * 0.72));
  const previewTitleFontSizePx = Math.round(previewFontSizePx * 1.15);

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

            {/* Target Mode: All Tasks vs Only This Task */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-tm-gold flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Apply Options To</span>
                </label>
                {feedbackMessage && (
                  <span className="text-[11px] text-emerald-300 animate-fade-in flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{feedbackMessage}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setTargetMode('all')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                    targetMode === 'all'
                      ? 'bg-tm-card border-tm-gold text-tm-goldLight shadow-sm ring-1 ring-tm-gold/30'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                  }`}
                >
                  <Layers className="w-4 h-4 text-tm-gold shrink-0" />
                  <div className="text-left">
                    <span className="block font-bold">All Tasks</span>
                    <span className="text-[10px] opacity-75 block font-normal">Apply uniformly across all sheets</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetMode('single')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                    targetMode === 'single'
                      ? 'bg-tm-card border-tm-gold text-tm-goldLight shadow-sm ring-1 ring-tm-gold/30'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                  }`}
                >
                  <FileText className="w-4 h-4 text-tm-gold shrink-0" />
                  <div className="text-left truncate">
                    <span className="block font-bold">Only This Task</span>
                    <span className="text-[10px] opacity-75 block font-normal truncate">
                      {selectedTask?.title || 'Selected task'}
                    </span>
                  </div>
                </button>
              </div>

              {/* Task Selector when in "Only This Task" mode */}
              {targetMode === 'single' && (
                <div className="p-3 bg-stone-950/90 rounded-xl border border-stone-800 space-y-2 mb-3 animate-fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider">
                      Customizing Task:
                    </span>
                    {isTaskCustomized ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Custom Options
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500">
                        Using All Tasks Default
                      </span>
                    )}
                  </div>

                  <select
                    value={selectedTaskId}
                    onChange={(e) => handleSelectTask(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-tm-gold cursor-pointer"
                  >
                    {uniqueTasksInScope.map((t) => {
                      const hasCustom = Boolean(
                        options.taskOverrides?.[t.id] || allTasksMap.get(t.id)?.printOptions
                      );
                      return (
                        <option key={t.id} value={t.id}>
                          {t.title} {hasCustom ? '★ (Custom)' : ''}
                        </option>
                      );
                    })}
                  </select>

                  {isTaskCustomized && (
                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleResetTaskToDefault}
                        className="text-[11px] text-stone-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to All Tasks default</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Layout & Content Options */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-tm-gold block mb-2 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                <span>
                  Sheet Content {targetMode === 'single' ? `(${selectedTask?.title || 'Task'})` : '(All Tasks)'}
                </span>
              </label>

              <div className="space-y-3 bg-stone-950/70 p-4 rounded-xl border border-stone-800">
                {/* Include Title Toggle */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={activeControls.includeTitle}
                    onChange={(e) => handleOptionChange('includeTitle', e.target.checked)}
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
                    checked={activeControls.separateSubtasks}
                    onChange={(e) => handleOptionChange('separateSubtasks', e.target.checked)}
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
                    checked={activeControls.includeTimeLimit}
                    onChange={(e) => handleOptionChange('includeTimeLimit', e.target.checked)}
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
                    checked={activeControls.appendTimeStartsNow}
                    onChange={(e) => handleOptionChange('appendTimeStartsNow', e.target.checked)}
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
                  Font Size {targetMode === 'single' ? `(${selectedTask?.title || 'Task'})` : '(All Tasks)'}
                </label>
                <span className="text-xs font-mono font-bold text-tm-goldLight bg-stone-950 px-2.5 py-0.5 rounded-full border border-stone-800 shadow-inner">
                  {activeControls.fontSizePt} pt
                </span>
              </div>

              <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800 space-y-3">
                {/* Stepper with +/- buttons and dynamic slider */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleOptionChange('fontSizePt', Math.max(12, activeControls.fontSizePt - 1))
                    }
                    disabled={activeControls.fontSizePt <= 12}
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
                      value={activeControls.fontSizePt}
                      onChange={(e) => handleOptionChange('fontSizePt', Number(e.target.value))}
                      className="w-full accent-tm-gold cursor-pointer h-2 bg-stone-800 rounded-lg appearance-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleOptionChange('fontSizePt', Math.min(40, activeControls.fontSizePt + 1))
                    }
                    disabled={activeControls.fontSizePt >= 40}
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
                      onClick={() => handleOptionChange('fontSizePt', preset.pt)}
                      className={`flex-1 min-w-[50px] py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        activeControls.fontSizePt === preset.pt
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

            {/* Direct Quick Apply Action Toolbar */}
            <div className="pt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleApplyToAll}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-tm-gold/60 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Apply current options to all tasks in scope and clear custom overrides"
              >
                <Layers className="w-3.5 h-3.5 text-tm-gold" />
                <span>Apply to All Tasks</span>
              </button>

              <button
                type="button"
                onClick={handleApplyToOnlyThisTask}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-tm-gold/60 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Apply current options specifically to only this task"
              >
                <FileText className="w-3.5 h-3.5 text-tm-gold" />
                <span>Apply to Only Task</span>
              </button>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                  Sheet Preview ({pages.length === 0 ? 0 : currentPageIndex + 1} of {pages.length})
                </label>
                {currentPreviewPage && (
                  <div className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                    <span className="font-semibold text-stone-200 truncate max-w-[180px]">
                      {currentPreviewPage.taskTitle}
                    </span>
                    {currentPreviewPage.isCustomized ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Custom ({currentPreviewPage.fontSizePt}pt)
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-800 text-stone-400">
                        Default ({currentPreviewPage.fontSizePt}pt)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {pages.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPageIndex - 1)}
                    disabled={currentPageIndex === 0}
                    className="p-1 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-200 cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-stone-400 px-1">
                    {currentPageIndex + 1}/{pages.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPageIndex + 1)}
                    disabled={currentPageIndex >= pages.length - 1}
                    className="p-1 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-200 cursor-pointer"
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
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
