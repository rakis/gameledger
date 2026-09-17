import React, { useState } from 'react';
import { HostHeader } from './HostHeader';
import { StageDirectorBar } from './StageDirectorBar';
import { TaskListSidebar } from './TaskListSidebar';
import { TaskScorerPanel } from './TaskScorerPanel';
import { HostSummaryDrawer } from './HostSummaryDrawer';
import { ContestantManagerModal } from './ContestantManagerModal';
import { NewTaskModal } from './NewTaskModal';

interface HostDashboardProps {
  onOpenPresentation: () => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ onOpenPresentation }) => {
  const [isContestantModalOpen, setIsContestantModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-tm-dark text-stone-100">
      {/* Top Header */}
      <HostHeader
        onToggleContestants={() => setIsContestantModalOpen(true)}
        onOpenPresentation={onOpenPresentation}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
      />

      {/* Stage Director Live Controller */}
      <StageDirectorBar />

      {/* Main Content Tri-Panel Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Tasks List in Active Episode */}
        <TaskListSidebar onOpenNewTask={() => setIsNewTaskModalOpen(true)} />

        {/* Center: Main Task Scorer & Timer Panel */}
        <TaskScorerPanel />

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
    </div>
  );
};
