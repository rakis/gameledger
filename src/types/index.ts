export type TaskType = 'prize' | 'filmed' | 'team' | 'studio' | 'tiebreak';

export interface Contestant {
  id: string;
  name: string;
  seatIndex: number;
  colorHex: string;
  avatar: string; // Emoji, SVG icon identifier, or data URL
  teamId?: 'A' | 'B' | null;
}

export interface ScoreEntry {
  contestantId: string;
  points: number;
  isDisqualified: boolean;
  dqReason?: string;
  bonusPoints?: number;
  penaltyPoints?: number;
  timeTakenSeconds?: number;
  attemptNote?: string;
  rank?: number;
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
  episodes: Episode[];
  activeEpisodeId: string;
  activeTaskId: string | null;
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

