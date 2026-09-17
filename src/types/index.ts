export type TaskType = 'prize' | 'filmed' | 'team' | 'studio' | 'tiebreak';

export interface Team {
  id: string;
  name: string;
  colorHex: string;
  avatar?: string;
}

export interface Contestant {
  id: string;
  name: string;
  seatIndex: number;
  colorHex: string;
  avatar: string; // Emoji, SVG icon identifier, or data URL
  teamId?: string | null;
}

export interface ScoreEntry {
  contestantId: string;
  points: number;
  isDisqualified: boolean;
  isSatOut?: boolean;
  dqReason?: string;
  bonusPoints?: number;
  penaltyPoints?: number;
  timeTakenSeconds?: number;
  attemptNote?: string;
  rank?: number;
}

export type SubtaskScoringMode = 'sum' | 'final_rank' | 'custom';

export interface SubTask {
  id: string;
  title: string;
  brief: string;
  isTimed: boolean;
  timeLimitSeconds?: number;
  scores: Record<string, ScoreEntry>;
  orderIndex: number;
  weight?: number;
  notes?: string;
}

export interface TaskBet {
  bettorId: string;
  targetContestantId?: string;
  targetTeamId?: string;
  rewardPoints: number;
  isWon?: boolean;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  brief: string;
  type: TaskType;
  isTimed: boolean;
  timeLimitSeconds?: number;
  scores: Record<string, ScoreEntry>;
  orderIndex: number;
  notes?: string;
  assignedContestantIds?: string[]; // If undefined/empty, all contestants participate
  subtasks?: SubTask[];
  subtaskScoringMode?: SubtaskScoringMode;
  bets?: Record<string, TaskBet>; // bettorId -> TaskBet
  showPartLabel?: boolean; // Whether to display part label badge on stage screen (default: false)
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  tasks: Task[];
}

export type PresentationViewType = 
  | 'idle' 
  | 'task_brief' 
  | 'attempts' 
  | 'score_reveal' 
  | 'episode_leaderboard' 
  | 'series_leaderboard' 
  | 'winner';

export interface PresentationConfig {
  view: PresentationViewType;
  revealedContestantIds: string[];
  revealedAll: boolean;
  spotlightContestantId: string | null;
  displayMessage: string | null;
  bannerVisible: boolean;
  activeSubtaskId?: string | null;
  revealedBetContestantIds?: string[];
  showPartLabel?: boolean; // Whether to display part label badge on stage screen (default: false)
}

export interface TimerState {
  isRunning: boolean;
  seconds: number;
  initialLimit: number | null; // null if counting up (stopwatch)
  isCountdown: boolean;
}

export type SoundType = 'seal' | 'tick' | 'buzzer' | 'reveal' | 'dq' | 'fanfare';

export interface GameLedgerState {
  version: number;
  seriesTitle: string;
  taskmasterName: string;
  assistantName: string;
  contestants: Contestant[];
  teams?: Team[];
  episodes: Episode[];
  activeEpisodeId: string;
  activeTaskId: string | null;
  activeSubtaskId?: string | null;
  presentation: PresentationConfig;
  timer: TimerState;
  soundEnabled: boolean;
}

export type BroadcastMessage =
  | { type: 'STATE_UPDATE'; state: GameLedgerState }
  | { type: 'AUDIO_TRIGGER'; sound: SoundType }
  | { type: 'CONFETTI_BURST' }
  | { type: 'STAGE_PING' }
  | { type: 'STAGE_PONG' };

