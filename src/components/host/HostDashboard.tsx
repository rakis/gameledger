import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { HostHeader } from './HostHeader';
import { StageDirectorBar } from './StageDirectorBar';
import { TaskListSidebar } from './TaskListSidebar';
import { TaskScorerPanel } from './TaskScorerPanel';
import { HostSummaryDrawer } from './HostSummaryDrawer';
import { ContestantManagerModal } from './ContestantManagerModal';
import { NewTaskModal } from './NewTaskModal';
import { PrintTasksModal } from './PrintTasksModal';
import { PrintTasksContainer } from './PrintTasksContainer';
import {
  PrintOptions,
  generatePrintablePages,
  getTasksForScope,
} from '../../utils/printTasks';

interface HostDashboardProps {
  onOpenPresentation: () => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ onOpenPresentation }) => {
  const { activeEpisode, state } = useGame();

  const [isContestantModalOpen, setIsContestantModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    scope: 'episode',
    includeTitle: false,
    separateSubtasks: true,
    includeTimeLimit: true,
    appendTimeStartsNow: true,
    fontSizePt: 22,
  });

  // Calculate printable tasks and sheets based on options
  const tasksToPrint = useMemo(() => {
    return getTasksForScope(
      printOptions.scope,
      activeEpisode,
      state.episodes,
      state.activeTaskId
    );
  }, [printOptions.scope, activeEpisode, state.episodes, state.activeTaskId]);

  const printablePages = useMemo(() => {
    return generatePrintablePages(tasksToPrint, printOptions);
  }, [tasksToPrint, printOptions]);

  const handleOpenPrintModal = (scope: PrintOptions['scope'] = 'episode') => {
    setPrintOptions((prev) => ({ ...prev, scope }));
    setIsPrintModalOpen(true);
  };

  return (
    <>
      {/* Screen Interactive UI (hidden in @media print) */}
      <div className="screen-only min-h-screen flex flex-col bg-tm-dark text-stone-100">
        {/* Top Header */}
        <HostHeader
          onToggleContestants={() => setIsContestantModalOpen(true)}
          onOpenPresentation={onOpenPresentation}
          onOpenNewTask={() => setIsNewTaskModalOpen(true)}
          onOpenPrintModal={() => handleOpenPrintModal('episode')}
        />

        {/* Stage Director Live Controller */}
        <StageDirectorBar />

        {/* Main Content Tri-Panel Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Tasks List in Active Episode */}
          <TaskListSidebar
            onOpenNewTask={() => setIsNewTaskModalOpen(true)}
            onOpenPrintModal={() => handleOpenPrintModal('episode')}
          />

          {/* Center: Main Task Scorer & Timer Panel */}
          <TaskScorerPanel
            onOpenPrintModal={() => handleOpenPrintModal('current_task')}
          />

          {/* Right: Collapsible Live Score Standings */}
          <HostSummaryDrawer />
        </div>

        {/* Modals */}
        <ContestantManagerModal
          isOpen={isContestantModalOpen}
          onClose={() => setIsContestantModalOpen(false)}
        />

        <NewTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
        />

        <PrintTasksModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          initialScope={printOptions.scope}
          options={printOptions}
          setOptions={setPrintOptions}
          pages={printablePages}
        />
      </div>

      {/* Print Target DOM Layout (visible only in @media print) */}
      <PrintTasksContainer
        pages={printablePages}
        fontSizePt={printOptions.fontSizePt}
      />
    </>
  );
};
