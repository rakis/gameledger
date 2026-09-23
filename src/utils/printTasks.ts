import { Episode, Task } from '../types';

export interface PrintOptions {
  scope: 'episode' | 'current_task' | 'series';
  includeTitle: boolean;
  separateSubtasks: boolean;
  includeTimeLimit: boolean;
  appendTimeStartsNow: boolean;
  fontSizePt: number;
}

export interface PrintablePageItem {
  id: string;
  taskId: string;
  taskTitle: string;
  isSubtask: boolean;
  subtaskTitle?: string;
  partNumber?: number;
  totalParts?: number;
  brief: string;
  isTimed: boolean;
  timeLimitSeconds?: number;
  renderedTitle?: string;
  renderedBrief: string;
  timeLimitNotice?: string;
  timeStartsNotice?: string;
}

/**
 * Format seconds into a friendly sentence, e.g. "10 minutes" or "90 seconds"
 */
export const formatDuration = (seconds: number): string => {
  if (seconds >= 60 && seconds % 60 === 0) {
    const mins = seconds / 60;
    return `${mins} minute${mins === 1 ? '' : 's'}`;
  }
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${mins} minute${mins === 1 ? '' : 's'} and ${remainder} second${remainder === 1 ? '' : 's'}`;
  }
  return `${seconds} second${seconds === 1 ? '' : 's'}`;
};

/**
 * Generate printable page models given tasks and selected options
 */
export const generatePrintablePages = (
  tasks: Task[],
  options: PrintOptions
): PrintablePageItem[] => {
  const pages: PrintablePageItem[] = [];

  for (const task of tasks) {
    const hasSubtasks = (task.subtasks?.length || 0) > 0;

    if (hasSubtasks && options.separateSubtasks && task.subtasks) {
      task.subtasks.forEach((subtask, index) => {
        const timeLimit = subtask.timeLimitSeconds ?? task.timeLimitSeconds;
        const isTimed = subtask.isTimed ?? task.isTimed;

        const timeLimitNotice =
          options.includeTimeLimit && isTimed && timeLimit
            ? `You have ${formatDuration(timeLimit)}.`
            : undefined;

        // Check if brief already contains "starts now" or "start now" (case-insensitive)
        const briefLower = subtask.brief.toLowerCase();
        const hasStartNow =
          briefLower.includes('starts now') || briefLower.includes('start now');

        const timeStartsNotice =
          options.appendTimeStartsNow && !hasStartNow
            ? 'Your time starts now.'
            : undefined;

        const renderedTitle = options.includeTitle
          ? `${task.title}: Part ${index + 1} - ${subtask.title}`
          : undefined;

        pages.push({
          id: `${task.id}-subtask-${subtask.id}`,
          taskId: task.id,
          taskTitle: task.title,
          isSubtask: true,
          subtaskTitle: subtask.title,
          partNumber: index + 1,
          totalParts: task.subtasks!.length,
          brief: subtask.brief,
          isTimed,
          timeLimitSeconds: timeLimit,
          renderedTitle,
          renderedBrief: subtask.brief,
          timeLimitNotice,
          timeStartsNotice,
        });
      });
    } else {
      const timeLimitNotice =
        options.includeTimeLimit && task.isTimed && task.timeLimitSeconds
          ? `You have ${formatDuration(task.timeLimitSeconds)}.`
          : undefined;

      const briefLower = task.brief.toLowerCase();
      const hasStartNow =
        briefLower.includes('starts now') || briefLower.includes('start now');

      const timeStartsNotice =
        options.appendTimeStartsNow && !hasStartNow
          ? 'Your time starts now.'
          : undefined;

      const renderedTitle = options.includeTitle ? task.title : undefined;

      pages.push({
        id: task.id,
        taskId: task.id,
        taskTitle: task.title,
        isSubtask: false,
        brief: task.brief,
        isTimed: task.isTimed,
        timeLimitSeconds: task.timeLimitSeconds,
        renderedTitle,
        renderedBrief: task.brief,
        timeLimitNotice,
        timeStartsNotice,
      });
    }
  }

  return pages;
};

/**
 * Filter tasks based on selected print scope
 */
export const getTasksForScope = (
  scope: PrintOptions['scope'],
  activeEpisode: Episode | undefined,
  allEpisodes: Episode[],
  activeTaskId: string | null
): Task[] => {
  if (scope === 'current_task' && activeTaskId) {
    for (const ep of allEpisodes) {
      const found = ep.tasks.find((t) => t.id === activeTaskId);
      if (found) return [found];
    }
    return [];
  }

  if (scope === 'series') {
    return allEpisodes.flatMap((ep) => ep.tasks);
  }

  // Default: active episode
  return activeEpisode ? activeEpisode.tasks : [];
};
