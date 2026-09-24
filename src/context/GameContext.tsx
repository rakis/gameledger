import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  GameLedgerState,
  Contestant,
  Task,
  SubTask,
  Team,
  TaskBet,
  Episode,
  ScoreEntry,
  PresentationViewType,
  BroadcastMessage,
  SoundType,
} from '../types';
import { INITIAL_DEMO_STATE, EMPTY_STATE, DEFAULT_TEAMS } from '../data/demoData';
import {
  playSealBreak,
  playCountdownTick,
  playBuzzer,
  playScoreReveal,
  playDQSound,
  playFanfare,
} from '../utils/audio';

const STORAGE_KEY = 'gameledger_state_v1';
const BROADCAST_CHANNEL_NAME = 'gameledger_sync_channel';

interface ContestantTotal {
  contestant: Contestant;
  episodeScore: number;
  seriesScore: number;
  taskCount: number;
  rank: number;
}

interface GameContextType {
  state: GameLedgerState;
  isStageMode: boolean;
  isStageConnected: boolean;
  activeEpisode: Episode | undefined;
  activeTask: Task | undefined;
  activeSubtask: SubTask | undefined;
  episodeTotals: ContestantTotal[];
  seriesTotals: ContestantTotal[];
  
  // Contestant actions
  addContestant: (name: string, colorHex?: string, avatar?: string) => void;
  updateContestant: (id: string, updates: Partial<Contestant>) => void;
  removeContestant: (id: string) => void;
  reorderContestants: (fromIdx: number, toIdx: number) => void;

  // Team actions
  addTeam: (name: string, colorHex?: string, avatar?: string) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  removeTeam: (id: string) => void;

  // Episode actions
  addEpisode: (title?: string) => void;
  setActiveEpisode: (id: string) => void;
  updateEpisode: (id: string, updates: Partial<Episode>) => void;
  removeEpisode: (id: string) => void;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'orderIndex' | 'scores'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setActiveTask: (id: string | null) => void;
  reorderTasks: (fromIdx: number, toIdx: number) => void;

  // Participant Assignment / Sit-out actions
  setTaskAssignedContestants: (taskId: string, contestantIds: string[]) => void;
  toggleContestantSitOut: (taskId: string, contestantId: string) => void;

  // Sub-task actions
  addSubTask: (taskId: string, title?: string, brief?: string, isTimed?: boolean, timeLimitSeconds?: number) => void;
  updateSubTask: (taskId: string, subtaskId: string, updates: Partial<SubTask>) => void;
  removeSubTask: (taskId: string, subtaskId: string) => void;
  setActiveSubtask: (subtaskId: string | null) => void;
  setSubtaskScore: (taskId: string, subtaskId: string, contestantId: string, updates: Partial<ScoreEntry>) => void;
  syncSubtaskScoresToParent: (taskId: string) => void;

  // Spectator Betting actions
  setTaskBet: (taskId: string, bettorId: string, bet: Omit<TaskBet, 'bettorId'>) => void;
  removeTaskBet: (taskId: string, bettorId: string) => void;
  resolveTaskBets: (taskId: string) => void;
  revealBet: (contestantId: string) => void;
  revealAllBets: () => void;

  // Scoring actions
  setScore: (taskId: string, contestantId: string, updates: Partial<ScoreEntry>) => void;
  setTaskScores: (
    taskId: string,
    scores: Record<string, Partial<ScoreEntry>>,
    subtaskId?: string | null,
    syncToMaster?: boolean
  ) => void;
  quickRankTask: (taskId: string, contestantId: string, rankPoints: number, subtaskId?: string | null) => void;
  toggleDQ: (taskId: string, contestantId: string, dqReason?: string, subtaskId?: string | null) => void;
  autoScoreByRanking: (taskId: string, orderedContestantIds: string[], descending?: boolean, subtaskId?: string | null) => void;

  // Presentation / Stage Director actions
  setPresentationView: (view: PresentationViewType) => void;
  revealContestant: (contestantId: string) => void;
  revealNextScore: () => void;
  revealAllScores: () => void;
  resetReveals: () => void;
  setDisplayMessage: (msg: string | null) => void;
  setBannerVisible: (visible: boolean) => void;
  setShowPartLabel: (visible: boolean) => void;
  triggerConfetti: () => void;
  triggerSound: (sound: SoundType) => void;

  // Timer actions
  startTimer: (countdownSeconds?: number) => void;
  pauseTimer: () => void;
  resetTimer: (countdownSeconds?: number) => void;

  // Settings & Storage
  setSeriesTitle: (title: string) => void;
  toggleSound: () => void;
  openStageWindow: () => void;
  loadDemoData: () => void;
  resetToEmpty: () => void;
  exportJSON: () => void;
  importJSON: (jsonString: string) => boolean;
}

const ensureStateDefaults = (s: GameLedgerState): GameLedgerState => {
  return {
    ...s,
    teams: (s.teams && s.teams.length > 0) ? s.teams : DEFAULT_TEAMS,
    activeSubtaskId: s.activeSubtaskId ?? null,
    presentation: {
      ...s.presentation,
      revealedBetContestantIds: s.presentation?.revealedBetContestantIds || [],
      activeSubtaskId: s.presentation?.activeSubtaskId ?? null,
      showPartLabel: s.presentation?.showPartLabel ?? false,
    },
  };
};

export const calculateParentScoresFromSubtasks = (
  task: Task,
  defaultContestantIds: string[]
): Record<string, ScoreEntry> => {
  const mode = task.subtaskScoringMode || 'sum';
  const assignedIds = task.assignedContestantIds && task.assignedContestantIds.length > 0
    ? task.assignedContestantIds
    : defaultContestantIds;
  const parentScores: Record<string, ScoreEntry> = { ...task.scores };

  if (mode === 'sum') {
    assignedIds.forEach((cid) => {
      let totalPts = 0;
      let hasDQ = false;
      const notes: string[] = [];
      task.subtasks?.forEach((st) => {
        const sc = st.scores[cid];
        if (sc) {
          if (sc.isDisqualified) {
            hasDQ = true;
          } else {
            totalPts += Number(sc.points || 0);
          }
          if (sc.attemptNote) notes.push(`${st.title}: ${sc.attemptNote}`);
        }
      });
      parentScores[cid] = {
        contestantId: cid,
        points: hasDQ ? 0 : totalPts,
        isDisqualified: hasDQ,
        dqReason: hasDQ ? 'Disqualified in subtask' : undefined,
        attemptNote: notes.length > 0 ? notes.join(' | ') : undefined,
      };
    });

    // Assign ranks
    const sorted = assignedIds
      .filter((cid) => !parentScores[cid]?.isDisqualified)
      .sort((a, b) => (parentScores[b]?.points || 0) - (parentScores[a]?.points || 0));
    let curRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && (parentScores[sorted[i]]?.points || 0) < (parentScores[sorted[i - 1]]?.points || 0)) {
        curRank = i + 1;
      }
      if (parentScores[sorted[i]]) {
        parentScores[sorted[i]].rank = curRank;
      }
    }
  } else if (mode === 'final_rank') {
    const pointScale = [5, 4, 3, 2, 1];
    const contestantSums: Record<string, number> = {};
    const dqs = new Set<string>();

    assignedIds.forEach((cid) => {
      let sum = 0;
      task.subtasks?.forEach((st) => {
        const sc = st.scores[cid];
        if (sc) {
          if (sc.isDisqualified) dqs.add(cid);
          else sum += Number(sc.points || 0);
        }
      });
      contestantSums[cid] = sum;
    });

    const nonDQs = assignedIds.filter((cid) => !dqs.has(cid));
    const sorted = [...nonDQs].sort((a, b) => (contestantSums[b] || 0) - (contestantSums[a] || 0));

    let curRank = 1;
    sorted.forEach((cid, idx) => {
      if (idx > 0 && (contestantSums[cid] || 0) < (contestantSums[sorted[idx - 1]] || 0)) {
        curRank = idx + 1;
      }
      const pts = pointScale[curRank - 1] ?? 1;
      parentScores[cid] = {
        contestantId: cid,
        points: pts,
        rank: curRank,
        isDisqualified: false,
      };
    });

    dqs.forEach((cid) => {
      parentScores[cid] = {
        contestantId: cid,
        points: 0,
        isDisqualified: true,
        dqReason: 'Disqualified in subtask',
      };
    });
  }

  return parentScores;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if current URL param specifies stage display mode (?stage=true)
  const [isStageMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('stage') === 'true';
  });

  const [state, setState] = useState<GameLedgerState>(() => {
    if (typeof window === 'undefined') return ensureStateDefaults(INITIAL_DEMO_STATE);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return ensureStateDefaults(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved state, using demo', e);
      }
    }
    return ensureStateDefaults(INITIAL_DEMO_STATE);
  });

  const stateRef = useRef<GameLedgerState>(state);
  stateRef.current = state;
  const channelRef = useRef<BroadcastChannel | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const [isStageConnected, setIsStageConnected] = useState<boolean>(false);
  const lastStagePongRef = useRef<number>(0);

  // Audio helper
  const playAudioCue = useCallback((sound: SoundType) => {
    switch (sound) {
      case 'seal':
        playSealBreak();
        break;
      case 'tick':
        playCountdownTick();
        break;
      case 'buzzer':
        playBuzzer();
        break;
      case 'reveal':
        playScoreReveal();
        break;
      case 'dq':
        playDQSound();
        break;
      case 'fanfare':
        playFanfare();
        break;
    }
  }, []);

  // Confetti helper
  const runConfettiAnimation = useCallback(async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#cba052', '#8b111e', '#ffd700', '#ffffff', '#e8dcba'],
      });
    } catch (e) {
      console.warn('Confetti effect failed to load', e);
    }
  }, []);

  // Initialize BroadcastChannel & Heartbeat
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.type === 'STATE_UPDATE') {
        const next = ensureStateDefaults(msg.state);
        stateRef.current = next;
        setState(next);
      } else if (msg.type === 'AUDIO_TRIGGER') {
        if (stateRef.current.soundEnabled) {
          playAudioCue(msg.sound);
        }
      } else if (msg.type === 'CONFETTI_BURST') {
        runConfettiAnimation();
      } else if (msg.type === 'STAGE_PING') {
        if (isStageMode) {
          channelRef.current?.postMessage({ type: 'STAGE_PONG' } as BroadcastMessage);
        }
      } else if (msg.type === 'STAGE_PONG') {
        if (!isStageMode) {
          lastStagePongRef.current = Date.now();
          setIsStageConnected(true);
        }
      }
    };

    // If mounting in Stage mode, announce presence immediately
    if (isStageMode) {
      channel.postMessage({ type: 'STAGE_PONG' } as BroadcastMessage);
    }

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [isStageMode, playAudioCue, runConfettiAnimation]);

  // Stage Heartbeat Monitor (Host Cockpit only)
  useEffect(() => {
    if (isStageMode || typeof window === 'undefined') return;

    // Send initial ping
    channelRef.current?.postMessage({ type: 'STAGE_PING' } as BroadcastMessage);

    const pingInterval = window.setInterval(() => {
      channelRef.current?.postMessage({ type: 'STAGE_PING' } as BroadcastMessage);
      const isAlive = (Date.now() - lastStagePongRef.current) < 10000;
      setIsStageConnected(isAlive);
    }, 3000);

    return () => {
      clearInterval(pingInterval);
    };
  }, [isStageMode]);

  // Fallback persistence sync via StorageEvent (for cross-tab resilience)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const next = ensureStateDefaults(parsed);
          stateRef.current = next;
          setState(next);
        } catch (err) {
          console.warn('Failed to parse storage event state', err);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Persist state to LocalStorage and broadcast changes using functional updates
  const updateAndBroadcastState = useCallback((updater: (prev: GameLedgerState) => GameLedgerState) => {
    setState((prev) => {
      const next = ensureStateDefaults(updater(prev));
      stateRef.current = next;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        channelRef.current?.postMessage({
          type: 'STATE_UPDATE',
          state: next,
        } as BroadcastMessage);
      } catch (e) {
        console.error('Storage or broadcast error', e);
      }
      return next;
    });
  }, []);

  const broadcastState = useCallback((newState: GameLedgerState) => {
    updateAndBroadcastState(() => newState);
  }, [updateAndBroadcastState]);

  const triggerSound = useCallback((sound: SoundType) => {
    if (stateRef.current.soundEnabled) {
      playAudioCue(sound);
    }
    channelRef.current?.postMessage({
      type: 'AUDIO_TRIGGER',
      sound,
    } as BroadcastMessage);
  }, [playAudioCue]);

  const triggerConfetti = useCallback(() => {
    runConfettiAnimation();
    channelRef.current?.postMessage({
      type: 'CONFETTI_BURST',
    } as BroadcastMessage);
  }, [runConfettiAnimation]);

  // Timer runner (Host is single source of truth; Stage display never runs intervals)
  useEffect(() => {
    if (isStageMode) return;

    if (state.timer.isRunning) {
      let lastTick = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.max(1, Math.round((now - lastTick) / 1000));
        lastTick = now;

        updateAndBroadcastState((prev) => {
          if (!prev.timer.isRunning) return prev;

          let newSeconds = prev.timer.seconds;
          let shouldStop = false;

          if (prev.timer.isCountdown) {
            newSeconds = Math.max(0, prev.timer.seconds - deltaSeconds);
            if (newSeconds === 0) {
              shouldStop = true;
              triggerSound('buzzer');
            } else if (newSeconds <= 5) {
              triggerSound('tick');
            }
          } else {
            newSeconds = prev.timer.seconds + deltaSeconds;
          }

          return {
            ...prev,
            timer: {
              ...prev.timer,
              seconds: newSeconds,
              isRunning: !shouldStop,
            },
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isStageMode, state.timer.isRunning, state.timer.isCountdown, triggerSound, updateAndBroadcastState]);

  // Active episode, task, and subtask computed
  const activeEpisode = state.episodes.find((e) => e.id === state.activeEpisodeId) || state.episodes[0];
  const activeTask = activeEpisode?.tasks.find((t) => t.id === state.activeTaskId) || activeEpisode?.tasks[0];
  const activeSubtask = activeTask?.subtasks?.find((st) => st.id === (state.activeSubtaskId || state.presentation.activeSubtaskId)) || activeTask?.subtasks?.[0];

  // Helper calculations for scores & leaderboards
  const calculateTotals = useCallback((): { episodeTotals: ContestantTotal[]; seriesTotals: ContestantTotal[] } => {
    const contestantMap = new Map<string, Contestant>();
    state.contestants.forEach((c) => contestantMap.set(c.id, c));

    // Episode scores
    const episodeScores: Record<string, number> = {};
    const episodeTaskCounts: Record<string, number> = {};
    state.contestants.forEach((c) => {
      episodeScores[c.id] = 0;
      episodeTaskCounts[c.id] = 0;
    });

    if (activeEpisode) {
      activeEpisode.tasks.forEach((task) => {
        Object.entries(task.scores).forEach(([cid, entry]) => {
          if (entry) {
            const pts = entry.isDisqualified ? 0 : Number(entry.points || 0);
            episodeScores[cid] = (episodeScores[cid] || 0) + pts;
            if (!entry.isSatOut) {
              episodeTaskCounts[cid] = (episodeTaskCounts[cid] || 0) + 1;
            }
          }
        });
      });
    }

    // Series cumulative scores
    const seriesScores: Record<string, number> = {};
    const seriesTaskCounts: Record<string, number> = {};
    state.contestants.forEach((c) => {
      seriesScores[c.id] = 0;
      seriesTaskCounts[c.id] = 0;
    });

    state.episodes.forEach((ep) => {
      ep.tasks.forEach((task) => {
        Object.entries(task.scores).forEach(([cid, entry]) => {
          if (entry) {
            const pts = entry.isDisqualified ? 0 : Number(entry.points || 0);
            seriesScores[cid] = (seriesScores[cid] || 0) + pts;
            if (!entry.isSatOut) {
              seriesTaskCounts[cid] = (seriesTaskCounts[cid] || 0) + 1;
            }
          }
        });
      });
    });

    // Generate episode totals
    const epTotals: ContestantTotal[] = state.contestants.map((c) => ({
      contestant: c,
      episodeScore: episodeScores[c.id] || 0,
      seriesScore: seriesScores[c.id] || 0,
      taskCount: episodeTaskCounts[c.id] || 0,
      rank: 1,
    }));

    // Sort descending by episodeScore
    epTotals.sort((a, b) => b.episodeScore - a.episodeScore);
    // Assign ranks
    let curRank = 1;
    for (let i = 0; i < epTotals.length; i++) {
      if (i > 0 && epTotals[i].episodeScore < epTotals[i - 1].episodeScore) {
        curRank = i + 1;
      }
      epTotals[i].rank = curRank;
    }

    // Generate series totals
    const serTotals: ContestantTotal[] = state.contestants.map((c) => ({
      contestant: c,
      episodeScore: episodeScores[c.id] || 0,
      seriesScore: seriesScores[c.id] || 0,
      taskCount: seriesTaskCounts[c.id] || 0,
      rank: 1,
    }));

    // Sort descending by seriesScore
    serTotals.sort((a, b) => b.seriesScore - a.seriesScore);
    curRank = 1;
    for (let i = 0; i < serTotals.length; i++) {
      if (i > 0 && serTotals[i].seriesScore < serTotals[i - 1].seriesScore) {
        curRank = i + 1;
      }
      serTotals[i].rank = curRank;
    }

    return { episodeTotals: epTotals, seriesTotals: serTotals };
  }, [state.contestants, state.episodes, activeEpisode]);

  const { episodeTotals, seriesTotals } = calculateTotals();

  // Contestant actions
  const addContestant = useCallback((name: string, colorHex?: string, avatar?: string) => {
    updateAndBroadcastState((prev) => {
      const palette = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
      const emojis = ['👑', '⭐', '🎩', '🦁', '🦉', '🦊', '🦆', '🦔', '🦄', '🐝'];
      const newContestant: Contestant = {
        id: 'c_' + Date.now() + Math.random().toString(36).substring(2, 5),
        name: name.trim(),
        seatIndex: prev.contestants.length,
        colorHex: colorHex || palette[prev.contestants.length % palette.length],
        avatar: avatar || emojis[prev.contestants.length % emojis.length],
        teamId: prev.contestants.length % 2 === 0 ? 'A' : 'B',
      };
      return {
        ...prev,
        contestants: [...prev.contestants, newContestant],
      };
    });
  }, [updateAndBroadcastState]);

  const updateContestant = useCallback((id: string, updates: Partial<Contestant>) => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      contestants: prev.contestants.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, [updateAndBroadcastState]);

  const removeContestant = useCallback((id: string) => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      contestants: prev.contestants.filter((c) => c.id !== id),
    }));
  }, [updateAndBroadcastState]);

  const reorderContestants = useCallback((fromIdx: number, toIdx: number) => {
    updateAndBroadcastState((prev) => {
      const list = [...prev.contestants];
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      const updated = list.map((c, idx) => ({ ...c, seatIndex: idx }));
      return { ...prev, contestants: updated };
    });
  }, [updateAndBroadcastState]);

  // Team actions
  const addTeam = useCallback((name: string, colorHex?: string, avatar?: string) => {
    updateAndBroadcastState((prev) => {
      const palette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
      const emojis = ['🦁', '🐯', '🦉', '🦊', '👑', '⚡', '🔥', '⭐'];
      const currentTeams = prev.teams || DEFAULT_TEAMS;
      const newTeam: Team = {
        id: 'team_' + Date.now(),
        name: name.trim() || `Team ${currentTeams.length + 1}`,
        colorHex: colorHex || palette[currentTeams.length % palette.length],
        avatar: avatar || emojis[currentTeams.length % emojis.length],
      };
      return {
        ...prev,
        teams: [...currentTeams, newTeam],
      };
    });
  }, [updateAndBroadcastState]);

  const updateTeam = useCallback((id: string, updates: Partial<Team>) => {
    updateAndBroadcastState((prev) => {
      const currentTeams = prev.teams || DEFAULT_TEAMS;
      const updated = currentTeams.map((tm) => (tm.id === id ? { ...tm, ...updates } : tm));
      return { ...prev, teams: updated };
    });
  }, [updateAndBroadcastState]);

  const removeTeam = useCallback((id: string) => {
    updateAndBroadcastState((prev) => {
      const currentTeams = prev.teams || DEFAULT_TEAMS;
      if (currentTeams.length <= 2) return prev; // Keep at least 2 teams
      const updated = currentTeams.filter((tm) => tm.id !== id);
      const updatedContestants = prev.contestants.map((c) => (c.teamId === id ? { ...c, teamId: null } : c));
      return { ...prev, teams: updated, contestants: updatedContestants };
    });
  }, [updateAndBroadcastState]);

  // Episode actions
  const addEpisode = useCallback((title?: string) => {
    updateAndBroadcastState((prev) => {
      const num = prev.episodes.length + 1;
      const newEp: Episode = {
        id: 'ep_' + Date.now(),
        episodeNumber: num,
        title: title || `Episode ${num}`,
        tasks: [
          {
            id: 't_' + Date.now(),
            title: 'Prize Task',
            brief: 'Bring in the most magnificent item. Most magnificent wins.',
            type: 'prize',
            isTimed: false,
            orderIndex: 0,
            scores: {},
          },
        ],
      };
      return {
        ...prev,
        episodes: [...prev.episodes, newEp],
        activeEpisodeId: newEp.id,
        activeTaskId: newEp.tasks[0].id,
      };
    });
  }, [updateAndBroadcastState]);

  const setActiveEpisode = useCallback((id: string) => {
    updateAndBroadcastState((prev) => {
      const ep = prev.episodes.find((e) => e.id === id);
      return {
        ...prev,
        activeEpisodeId: id,
        activeTaskId: ep?.tasks[0]?.id || null,
      };
    });
  }, [updateAndBroadcastState]);

  const updateEpisode = useCallback((id: string, updates: Partial<Episode>) => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      episodes: prev.episodes.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, [updateAndBroadcastState]);

  const removeEpisode = useCallback((id: string) => {
    updateAndBroadcastState((prev) => {
      if (prev.episodes.length <= 1) return prev; // Keep at least one episode
      const updated = prev.episodes.filter((e) => e.id !== id);
      const nextActive = updated[0]?.id || '';
      return {
        ...prev,
        episodes: updated,
        activeEpisodeId: nextActive,
        activeTaskId: updated[0]?.tasks[0]?.id || null,
      };
    });
  }, [updateAndBroadcastState]);

  // Task actions
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'orderIndex' | 'scores'>) => {
    updateAndBroadcastState((prev) => {
      const currentActiveEp = prev.episodes.find((e) => e.id === prev.activeEpisodeId) || prev.episodes[0];
      if (!currentActiveEp) return prev;

      const newTask: Task = {
        ...taskData,
        id: 't_' + Date.now(),
        orderIndex: currentActiveEp.tasks.length,
        scores: {},
      };

      const updatedEpisodes = prev.episodes.map((ep) => {
        if (ep.id === currentActiveEp.id) {
          return {
            ...ep,
            tasks: [...ep.tasks, newTask],
          };
        }
        return ep;
      });

      return {
        ...prev,
        episodes: updatedEpisodes,
        activeTaskId: newTask.id,
        presentation: {
          ...prev.presentation,
          view: 'task_brief',
          revealedContestantIds: [],
          revealedAll: false,
        },
      };
    });
    triggerSound('seal');
  }, [updateAndBroadcastState, triggerSound]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      episodes: prev.episodes.map((ep) => ({
        ...ep,
        tasks: ep.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),
    }));
  }, [updateAndBroadcastState]);

  const removeTask = useCallback((id: string) => {
    updateAndBroadcastState((prev) => {
      const currentActiveEp = prev.episodes.find((e) => e.id === prev.activeEpisodeId) || prev.episodes[0];
      const updatedEpisodes = prev.episodes.map((ep) => ({
        ...ep,
        tasks: ep.tasks.filter((t) => t.id !== id),
      }));
      return {
        ...prev,
        episodes: updatedEpisodes,
        activeTaskId: currentActiveEp?.tasks.find((t) => t.id !== id)?.id || null,
      };
    });
  }, [updateAndBroadcastState]);

  const setActiveTask = useCallback((id: string | null) => {
    updateAndBroadcastState((prev) => {
      const currentActiveEp = prev.episodes.find((e) => e.id === prev.activeEpisodeId) || prev.episodes[0];
      const task = id ? currentActiveEp?.tasks.find((t) => t.id === id) : null;
      const defaultSubtaskId = (task?.subtasks && task.subtasks.length > 0) ? task.subtasks[0].id : null;
      return {
        ...prev,
        activeTaskId: id,
        activeSubtaskId: defaultSubtaskId,
        presentation: {
          ...prev.presentation,
          activeSubtaskId: defaultSubtaskId,
          revealedContestantIds: [],
          revealedAll: false,
        },
      };
    });
  }, [updateAndBroadcastState]);

  const reorderTasks = useCallback((fromIdx: number, toIdx: number) => {
    updateAndBroadcastState((prev) => {
      const currentActiveEp = prev.episodes.find((e) => e.id === prev.activeEpisodeId) || prev.episodes[0];
      if (!currentActiveEp) return prev;
      const list = [...currentActiveEp.tasks];
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      const updatedTasks = list.map((t, idx) => ({ ...t, orderIndex: idx }));

      const updatedEpisodes = prev.episodes.map((ep) =>
        ep.id === currentActiveEp.id ? { ...ep, tasks: updatedTasks } : ep
      );
      return { ...prev, episodes: updatedEpisodes };
    });
  }, [updateAndBroadcastState]);

  // Scoring actions
  const setTaskScores = useCallback((
    taskId: string,
    scores: Record<string, Partial<ScoreEntry>>,
    subtaskId?: string | null,
    syncToMaster: boolean = false
  ) => {
    updateAndBroadcastState((prev) => {
      const currentContestantIds = prev.contestants.map((c) => c.id);
      const updatedEpisodes = prev.episodes.map((ep) => ({
        ...ep,
        tasks: ep.tasks.map((t) => {
          if (t.id !== taskId) return t;

          if (subtaskId && t.subtasks && t.subtasks.length > 0) {
            const updatedSubtasks = t.subtasks.map((st) => {
              if (st.id !== subtaskId) return st;
              const newSubScores = { ...st.scores };
              Object.entries(scores).forEach(([cid, entryUpdates]) => {
                const currentEntry = newSubScores[cid] || {
                  contestantId: cid,
                  points: 0,
                  isDisqualified: false,
                };
                newSubScores[cid] = {
                  ...currentEntry,
                  ...entryUpdates,
                  points: entryUpdates.isDisqualified ? 0 : (entryUpdates.points ?? currentEntry.points ?? 0),
                };
              });

              // Recalculate ranks within subtask
              const assigned = t.assignedContestantIds && t.assignedContestantIds.length > 0
                ? t.assignedContestantIds
                : currentContestantIds;
              const ranked = assigned
                .filter((cid) => !newSubScores[cid]?.isDisqualified)
                .sort((a, b) => (newSubScores[b]?.points || 0) - (newSubScores[a]?.points || 0));
              let curRank = 1;
              for (let i = 0; i < ranked.length; i++) {
                if (i > 0 && (newSubScores[ranked[i]]?.points || 0) < (newSubScores[ranked[i - 1]]?.points || 0)) {
                  curRank = i + 1;
                }
                if (newSubScores[ranked[i]]) {
                  newSubScores[ranked[i]].rank = curRank;
                }
              }

              return { ...st, scores: newSubScores };
            });

            let newParentScores = t.scores;
            if (syncToMaster) {
              const updatedTempTask = { ...t, subtasks: updatedSubtasks };
              newParentScores = calculateParentScoresFromSubtasks(updatedTempTask, currentContestantIds);
            }

            return {
              ...t,
              subtasks: updatedSubtasks,
              scores: newParentScores,
            };
          }

          // Main task score updates
          const newScores = { ...t.scores };
          Object.entries(scores).forEach(([cid, entryUpdates]) => {
            const currentEntry = newScores[cid] || {
              contestantId: cid,
              points: 0,
              isDisqualified: false,
            };
            newScores[cid] = {
              ...currentEntry,
              ...entryUpdates,
              points: entryUpdates.isDisqualified ? 0 : (entryUpdates.points ?? currentEntry.points ?? 0),
            };
          });

          // Recalculate ranks across active contestants
          const assigned = t.assignedContestantIds && t.assignedContestantIds.length > 0
            ? t.assignedContestantIds
            : currentContestantIds;
          const ranked = assigned
            .filter((cid) => !newScores[cid]?.isDisqualified)
            .sort((a, b) => (newScores[b]?.points || 0) - (newScores[a]?.points || 0));
          let curRank = 1;
          for (let i = 0; i < ranked.length; i++) {
            if (i > 0 && (newScores[ranked[i]]?.points || 0) < (newScores[ranked[i - 1]]?.points || 0)) {
              curRank = i + 1;
            }
            if (newScores[ranked[i]]) {
              newScores[ranked[i]].rank = curRank;
            }
          }

          return { ...t, scores: newScores };
        }),
      }));

      return { ...prev, episodes: updatedEpisodes };
    });
  }, [updateAndBroadcastState]);

  const setScore = useCallback((taskId: string, contestantId: string, updates: Partial<ScoreEntry>) => {
    setTaskScores(taskId, { [contestantId]: updates }, null, false);
  }, [setTaskScores]);

  const setSubtaskScore = useCallback((taskId: string, subtaskId: string, contestantId: string, updates: Partial<ScoreEntry>) => {
    setTaskScores(taskId, { [contestantId]: updates }, subtaskId, false);
  }, [setTaskScores]);

  const quickRankTask = useCallback((taskId: string, contestantId: string, rankPoints: number, subtaskId?: string | null) => {
    setTaskScores(
      taskId,
      {
        [contestantId]: {
          points: rankPoints,
          isDisqualified: false,
          rank: Math.max(1, 6 - rankPoints),
        },
      },
      subtaskId,
      Boolean(subtaskId)
    );
    triggerSound('reveal');
  }, [setTaskScores, triggerSound]);

  const toggleDQ = useCallback((taskId: string, contestantId: string, dqReason?: string, subtaskId?: string | null) => {
    let wasDQ = false;
    updateAndBroadcastState((prev) => {
      const ep = prev.episodes.find((e) => e.tasks.some((t) => t.id === taskId));
      const task = ep?.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      if (subtaskId && task.subtasks) {
        const st = task.subtasks.find((s) => s.id === subtaskId);
        wasDQ = st?.scores[contestantId]?.isDisqualified ?? false;
      } else {
        wasDQ = task.scores[contestantId]?.isDisqualified ?? false;
      }

      const nextIsDQ = !wasDQ;
      const updates: Partial<ScoreEntry> = {
        isDisqualified: nextIsDQ,
        points: nextIsDQ ? 0 : 1,
        dqReason: nextIsDQ ? (dqReason || 'Disqualified by Taskmaster') : undefined,
      };

      const currentContestantIds = prev.contestants.map((c) => c.id);
      const updatedEpisodes = prev.episodes.map((e) => ({
        ...e,
        tasks: e.tasks.map((t) => {
          if (t.id !== taskId) return t;
          if (subtaskId && t.subtasks) {
            const updatedSubtasks = t.subtasks.map((s) => {
              if (s.id !== subtaskId) return s;
              const currentEntry = s.scores[contestantId] || { contestantId, points: 0, isDisqualified: false };
              return {
                ...s,
                scores: {
                  ...s.scores,
                  [contestantId]: { ...currentEntry, ...updates },
                },
              };
            });
            const newParentScores = calculateParentScoresFromSubtasks({ ...t, subtasks: updatedSubtasks }, currentContestantIds);
            return {
              ...t,
              subtasks: updatedSubtasks,
              scores: newParentScores,
            };
          }

          const currentEntry = t.scores[contestantId] || { contestantId, points: 0, isDisqualified: false };
          return {
            ...t,
            scores: {
              ...t.scores,
              [contestantId]: { ...currentEntry, ...updates },
            },
          };
        }),
      }));

      return { ...prev, episodes: updatedEpisodes };
    });

    if (!wasDQ) {
      triggerSound('dq');
    }
  }, [updateAndBroadcastState, triggerSound]);

  const autoScoreByRanking = useCallback((
    taskId: string,
    orderedContestantIds: string[],
    descending: boolean = true,
    subtaskId?: string | null
  ) => {
    const pointScale = [5, 4, 3, 2, 1];
    const ordered = descending ? orderedContestantIds : [...orderedContestantIds].reverse();

    const scoreUpdates: Record<string, Partial<ScoreEntry>> = {};
    ordered.forEach((cid, idx) => {
      const points = idx < pointScale.length ? pointScale[idx] : 1;
      scoreUpdates[cid] = {
        points,
        rank: idx + 1,
        isDisqualified: false,
      };
    });

    setTaskScores(taskId, scoreUpdates, subtaskId, Boolean(subtaskId));
    triggerSound('reveal');
  }, [setTaskScores, triggerSound]);

  // Participant Assignment / Sit-out actions
  const setTaskAssignedContestants = useCallback((taskId: string, contestantIds: string[]) => {
    updateAndBroadcastState((prev) => {
      const updatedEpisodes = prev.episodes.map((ep) => ({
        ...ep,
        tasks: ep.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const newScores = { ...t.scores };
          prev.contestants.forEach((c) => {
            const isSatOut = !contestantIds.includes(c.id);
            const currentEntry = newScores[c.id] || { contestantId: c.id, points: 0, isDisqualified: false };
            newScores[c.id] = { ...currentEntry, isSatOut };
          });
          return { ...t, assignedContestantIds: contestantIds, scores: newScores };
        }),
      }));
      return { ...prev, episodes: updatedEpisodes };
    });
  }, [updateAndBroadcastState]);

  const toggleContestantSitOut = useCallback((taskId: string, contestantId: string) => {
    updateAndBroadcastState((prev) => {
      const currentEp = prev.episodes.find((e) => e.tasks.some((t) => t.id === taskId));
      const currentTask = currentEp?.tasks.find((t) => t.id === taskId);
      if (!currentTask) return prev;

      const currentAssigned = currentTask.assignedContestantIds && currentTask.assignedContestantIds.length > 0
        ? [...currentTask.assignedContestantIds]
        : prev.contestants.map((c) => c.id);

      let newAssigned: string[];
      if (currentAssigned.includes(contestantId)) {
        if (currentAssigned.length <= 1) return prev; // Must have at least 1 active contestant
        newAssigned = currentAssigned.filter((id) => id !== contestantId);
      } else {
        newAssigned = [...currentAssigned, contestantId];
      }

      const updatedScores = { ...currentTask.scores };
      const isSatOut = !newAssigned.includes(contestantId);
      updatedScores[contestantId] = {
        ...(updatedScores[contestantId] || { contestantId, points: 0, isDisqualified: false }),
        isSatOut,
        points: isSatOut ? 0 : (updatedScores[contestantId]?.points ?? 0),
      };

      const updatedEpisodes = prev.episodes.map((ep) => ({
        ...ep,
        tasks: ep.tasks.map((t) => (t.id === taskId ? { ...t, assignedContestantIds: newAssigned, scores: updatedScores } : t)),
      }));

      return { ...prev, episodes: updatedEpisodes };
    });
  }, [updateAndBroadcastState]);

  // Sub-task actions
  const addSubTask = useCallback((taskId: string, title?: string, brief?: string, isTimed?: boolean, timeLimitSeconds?: number) => {
    updateAndBroadcastState((prev) => {
      const updatedEpisodes = prev.episodes.map((ep) => ({
        ...ep,
        tasks: ep.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const subtasks = t.subtasks || [];
          const num = subtasks.length + 1;
          const newSub: SubTask = {
            id: 'sub_' + Date.now() + Math.random().toString(36).substring(2, 4),
            title: title || `Part ${num}`,
            brief: brief || `Instructions for Part ${num}. Your time starts now.`,
            isTimed: isTimed ?? false,
            timeLimitSeconds: isTimed ? (timeLimitSeconds || 300) : undefined,
            scores: {},
            orderIndex: subtasks.length,
          };
          return {
            ...t,
            subtasks: [...subtasks, newSub],
            subtaskScoringMode: t.subtaskScoringMode || 'sum',
          };
        }),
      }));
      return { ...prev, episodes: updatedEpisodes };
    });
    triggerSound('seal');
  }, [updateAndBroadcastState, triggerSound]);

  const updateSubTask = useCallback((taskId: string, subtaskId: string, updates: Partial<SubTask>) => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      episodes: prev.episodes.map((ep) => ({
        ...ep,
        tasks: ep.tasks.map((t) => {
          if (t.id !== taskId || !t.subtasks) return t;
          return {
            ...t,
            subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, ...updates } : st)),
          };
        }),
      })),
    }));
  }, [updateAndBroadcastState]);

  const removeSubTask = useCallback((taskId: string, subtaskId: string) => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      episodes: prev.episodes.map((ep) => ({
        ...ep,
        tasks: ep.tasks.map((t) => {
          if (t.id !== taskId || !t.subtasks) return t;
          return {
            ...t,
            subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
          };
        }),
      })),
    }));
  }, [updateAndBroadcastState]);

  const setActiveSubtask = useCallback((subtaskId: string | null) => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      activeSubtaskId: subtaskId,
      presentation: {
        ...prev.presentation,
        activeSubtaskId: subtaskId,
      },
    }));
  }, [updateAndBroadcastState]);

  const syncSubtaskScoresToParent = useCallback((taskId: string) => {
    updateAndBroadcastState((prev) => {
      const currentEp = prev.episodes.find((e) => e.tasks.some((t) => t.id === taskId));
      const currentTask = currentEp?.tasks.find((t) => t.id === taskId);
      if (!currentTask || !currentTask.subtasks || currentTask.subtasks.length === 0) return prev;

      const parentScores = calculateParentScoresFromSubtasks(
        currentTask,
        prev.contestants.map((c) => c.id)
      );

      const updatedEpisodes = prev.episodes.map((ep) => ({
        ...ep,
        tasks: ep.tasks.map((t) => (t.id === taskId ? { ...t, scores: parentScores } : t)),
      }));

      return { ...prev, episodes: updatedEpisodes };
    });
    triggerSound('reveal');
  }, [updateAndBroadcastState, triggerSound]);

  // Spectator Betting actions
  const setTaskBet = useCallback((taskId: string, bettorId: string, bet: Omit<TaskBet, 'bettorId'>) => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      episodes: prev.episodes.map((ep) => ({
        ...ep,
        tasks: ep.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            bets: {
              ...(t.bets || {}),
              [bettorId]: { ...bet, bettorId },
            },
          };
        }),
      })),
    }));
  }, [updateAndBroadcastState]);

  const removeTaskBet = useCallback((taskId: string, bettorId: string) => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      episodes: prev.episodes.map((ep) => ({
        ...ep,
        tasks: ep.tasks.map((t) => {
          if (t.id !== taskId || !t.bets) return t;
          const copy = { ...t.bets };
          delete copy[bettorId];
          return { ...t, bets: copy };
        }),
      })),
    }));
  }, [updateAndBroadcastState]);

  const resolveTaskBets = useCallback((taskId: string) => {
    let someoneWon = false;
    updateAndBroadcastState((prev) => {
      const currentEp = prev.episodes.find((e) => e.tasks.some((t) => t.id === taskId));
      const currentTask = currentEp?.tasks.find((t) => t.id === taskId);
      if (!currentTask || !currentTask.bets) return prev;

      const assignedIds = currentTask.assignedContestantIds && currentTask.assignedContestantIds.length > 0
        ? currentTask.assignedContestantIds
        : prev.contestants.map((c) => c.id);

      // Determine active winners (Rank 1 and not DQ'd and not sat out)
      const activeScored = assignedIds.map((cid) => currentTask.scores[cid]).filter(Boolean);
      const eligibleScored = activeScored.filter((s) => !s.isDisqualified && !s.isSatOut);

      const maxPoints = Math.max(...eligibleScored.map((s) => s.points || 0), -Infinity);
      const winningContestantIds = eligibleScored
        .filter((s) => (s.rank === 1 || s.points === maxPoints) && s.points > 0)
        .map((s) => s.contestantId);

      // Determine winning team(s) if applicable
      const winningTeamIds: string[] = [];
      if (currentTask.type === 'team') {
        winningContestantIds.forEach((cid) => {
          const c = prev.contestants.find((cont) => cont.id === cid);
          if (c?.teamId && !winningTeamIds.includes(c.teamId)) {
            winningTeamIds.push(c.teamId);
          }
        });
      }

      const updatedBets: Record<string, TaskBet> = { ...currentTask.bets };
      const updatedScores: Record<string, ScoreEntry> = { ...currentTask.scores };

      Object.entries(updatedBets).forEach(([bettorId, bet]) => {
        let won = false;
        if (bet.targetContestantId && winningContestantIds.includes(bet.targetContestantId)) {
          won = true;
        }
        if (bet.targetTeamId && winningTeamIds.includes(bet.targetTeamId)) {
          won = true;
        }
        if (won) someoneWon = true;

        updatedBets[bettorId] = { ...bet, isWon: won };

        const targetContestant = prev.contestants.find((c) => c.id === bet.targetContestantId);
        const targetTeam = prev.teams?.find((tm) => tm.id === bet.targetTeamId);
        const targetName = targetContestant?.name || (targetTeam ? targetTeam.name : 'Unknown');

        const reward = won ? Number(bet.rewardPoints || 2) : 0;
        updatedScores[bettorId] = {
          contestantId: bettorId,
          points: reward,
          bonusPoints: reward,
          isDisqualified: false,
          isSatOut: true,
          attemptNote: `Spectator Bet on ${targetName}: ${won ? `WON (+${reward} pts)` : 'LOST (0 pts)'}`,
        };
      });

      const updatedEpisodes = prev.episodes.map((ep) => ({
        ...ep,
        tasks: ep.tasks.map((t) => (t.id === taskId ? { ...t, bets: updatedBets, scores: updatedScores } : t)),
      }));

      return { ...prev, episodes: updatedEpisodes };
    });

    if (someoneWon) {
      triggerSound('reveal');
    } else {
      triggerSound('buzzer');
    }
  }, [updateAndBroadcastState, triggerSound]);

  const revealBet = useCallback((contestantId: string) => {
    updateAndBroadcastState((prev) => {
      const currentRevealed = prev.presentation.revealedBetContestantIds || [];
      const updated = currentRevealed.includes(contestantId)
        ? currentRevealed
        : [...currentRevealed, contestantId];
      return {
        ...prev,
        presentation: {
          ...prev.presentation,
          revealedBetContestantIds: updated,
        },
      };
    });
    triggerSound('reveal');
  }, [updateAndBroadcastState, triggerSound]);

  const revealAllBets = useCallback(() => {
    updateAndBroadcastState((prev) => {
      const currentActiveEp = prev.episodes.find((e) => e.id === prev.activeEpisodeId) || prev.episodes[0];
      const curTask = currentActiveEp?.tasks.find((t) => t.id === prev.activeTaskId) || currentActiveEp?.tasks[0];
      const allBettorIds = curTask?.bets ? Object.keys(curTask.bets) : [];
      return {
        ...prev,
        presentation: {
          ...prev.presentation,
          revealedBetContestantIds: allBettorIds,
        },
      };
    });
    triggerSound('reveal');
  }, [updateAndBroadcastState, triggerSound]);

  // Presentation / Stage Director actions
  const setPresentationView = useCallback((view: PresentationViewType) => {
    updateAndBroadcastState((prev) => {
      const currentActiveEp = prev.episodes.find((e) => e.id === prev.activeEpisodeId) || prev.episodes[0];
      const curTask = currentActiveEp?.tasks.find((t) => t.id === prev.activeTaskId) || currentActiveEp?.tasks[0];
      const subtasks = curTask?.subtasks;
      const shouldDefaultSubtask = view === 'task_brief' && subtasks && subtasks.length > 0;
      const nextSubtaskId = shouldDefaultSubtask && subtasks
        ? (subtasks.some((st) => st.id === prev.presentation.activeSubtaskId)
            ? prev.presentation.activeSubtaskId
            : subtasks[0].id)
        : prev.presentation.activeSubtaskId;

      return {
        ...prev,
        activeSubtaskId: nextSubtaskId,
        presentation: {
          ...prev.presentation,
          view,
          activeSubtaskId: nextSubtaskId,
        },
      };
    });
    if (view === 'task_brief') {
      triggerSound('seal');
    } else if (view === 'winner') {
      triggerSound('fanfare');
      triggerConfetti();
    }
  }, [updateAndBroadcastState, triggerSound, triggerConfetti]);

  const revealContestant = useCallback((contestantId: string) => {
    let isDQ = false;
    updateAndBroadcastState((prev) => {
      const currentActiveEp = prev.episodes.find((e) => e.id === prev.activeEpisodeId) || prev.episodes[0];
      const curTask = currentActiveEp?.tasks.find((t) => t.id === prev.activeTaskId) || currentActiveEp?.tasks[0];

      const revealed = prev.presentation.revealedContestantIds.includes(contestantId)
        ? prev.presentation.revealedContestantIds
        : [...prev.presentation.revealedContestantIds, contestantId];

      const assignedIds = curTask?.assignedContestantIds && curTask.assignedContestantIds.length > 0
        ? curTask.assignedContestantIds
        : prev.contestants.map((c) => c.id);
      const allRevealed = assignedIds.every((id) => revealed.includes(id));

      const activeSubtaskId = prev.presentation.activeSubtaskId;
      const currentSubtask = activeSubtaskId && curTask?.subtasks
        ? curTask.subtasks.find((st) => st.id === activeSubtaskId)
        : null;
      const scoreEntry = currentSubtask ? currentSubtask.scores[contestantId] : curTask?.scores[contestantId];
      isDQ = scoreEntry?.isDisqualified ?? false;

      return {
        ...prev,
        presentation: {
          ...prev.presentation,
          revealedContestantIds: revealed,
          revealedAll: allRevealed,
          spotlightContestantId: contestantId,
        },
      };
    });

    if (isDQ) {
      triggerSound('dq');
    } else {
      triggerSound('reveal');
    }
  }, [updateAndBroadcastState, triggerSound]);

  const revealNextScore = useCallback(() => {
    const curTask = activeTask;
    if (!curTask) return;
    const assignedIds = curTask.assignedContestantIds && curTask.assignedContestantIds.length > 0
      ? curTask.assignedContestantIds
      : state.contestants.map((c) => c.id);

    const activeSubtaskId = state.presentation.activeSubtaskId;
    const currentSubtask = activeSubtaskId && curTask.subtasks
      ? curTask.subtasks.find((st) => st.id === activeSubtaskId)
      : null;
    const scoresToEvaluate = currentSubtask?.scores || curTask.scores;

    // Reveal from lowest to highest points for maximum drama among assigned contestants
    const unrevealed = state.contestants
      .filter((c) => assignedIds.includes(c.id) && !state.presentation.revealedContestantIds.includes(c.id))
      .sort((a, b) => {
        const scoreA = scoresToEvaluate[a.id]?.points ?? 0;
        const scoreB = scoresToEvaluate[b.id]?.points ?? 0;
        return scoreA - scoreB;
      });

    if (unrevealed.length > 0) {
      revealContestant(unrevealed[0].id);
    }
  }, [activeTask, state.contestants, state.presentation.revealedContestantIds, state.presentation.activeSubtaskId, revealContestant]);

  const revealAllScores = useCallback(() => {
    updateAndBroadcastState((prev) => {
      const currentActiveEp = prev.episodes.find((e) => e.id === prev.activeEpisodeId) || prev.episodes[0];
      const curTask = currentActiveEp?.tasks.find((t) => t.id === prev.activeTaskId) || currentActiveEp?.tasks[0];
      const assignedIds = curTask?.assignedContestantIds && curTask.assignedContestantIds.length > 0
        ? curTask.assignedContestantIds
        : prev.contestants.map((c) => c.id);
      return {
        ...prev,
        presentation: {
          ...prev.presentation,
          revealedContestantIds: assignedIds,
          revealedAll: true,
        },
      };
    });
    triggerSound('reveal');
  }, [updateAndBroadcastState, triggerSound]);

  const resetReveals = useCallback(() => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      presentation: {
        ...prev.presentation,
        revealedContestantIds: [],
        revealedAll: false,
        spotlightContestantId: null,
        revealedBetContestantIds: [],
      },
    }));
  }, [updateAndBroadcastState]);

  const setDisplayMessage = useCallback((msg: string | null) => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      presentation: {
        ...prev.presentation,
        displayMessage: msg,
      },
    }));
  }, [updateAndBroadcastState]);

  const setBannerVisible = useCallback((visible: boolean) => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      presentation: {
        ...prev.presentation,
        bannerVisible: visible,
      },
    }));
  }, [updateAndBroadcastState]);

  const setShowPartLabel = useCallback((visible: boolean) => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      presentation: {
        ...prev.presentation,
        showPartLabel: visible,
      },
    }));
  }, [updateAndBroadcastState]);

  // Timer actions
  const startTimer = useCallback((countdownSeconds?: number) => {
    updateAndBroadcastState((prev) => {
      const isCountdown = typeof countdownSeconds === 'number' && countdownSeconds > 0;
      return {
        ...prev,
        timer: {
          isRunning: true,
          seconds: isCountdown ? countdownSeconds : prev.timer.seconds,
          initialLimit: isCountdown ? countdownSeconds : prev.timer.initialLimit,
          isCountdown,
        },
      };
    });
  }, [updateAndBroadcastState]);

  const pauseTimer = useCallback(() => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        isRunning: false,
      },
    }));
  }, [updateAndBroadcastState]);

  const resetTimer = useCallback((countdownSeconds?: number) => {
    updateAndBroadcastState((prev) => {
      const isCountdown = typeof countdownSeconds === 'number' && countdownSeconds > 0;
      return {
        ...prev,
        timer: {
          isRunning: false,
          seconds: isCountdown ? countdownSeconds : 0,
          initialLimit: isCountdown ? countdownSeconds : null,
          isCountdown,
        },
      };
    });
  }, [updateAndBroadcastState]);

  // General settings & import/export
  const setSeriesTitle = useCallback((title: string) => {
    updateAndBroadcastState((prev) => ({ ...prev, seriesTitle: title }));
  }, [updateAndBroadcastState]);

  const toggleSound = useCallback(() => {
    updateAndBroadcastState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, [updateAndBroadcastState]);

  const openStageWindow = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('stage', 'true');
    window.open(url.toString(), 'GameLedgerStage', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
  }, []);

  const loadDemoData = useCallback(() => {
    broadcastState(ensureStateDefaults(INITIAL_DEMO_STATE));
    triggerSound('fanfare');
  }, [broadcastState, triggerSound]);

  const resetToEmpty = useCallback(() => {
    broadcastState(ensureStateDefaults(EMPTY_STATE));
  }, [broadcastState]);

  const exportJSON = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gameledger-${state.seriesTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [state]);

  const importJSON = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.contestants && parsed.episodes) {
        broadcastState(ensureStateDefaults(parsed));
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON import', e);
    }
    return false;
  }, [broadcastState]);

  return (
    <GameContext.Provider
      value={{
        state,
        isStageMode,
        isStageConnected,
        activeEpisode,
        activeTask,
        activeSubtask,
        episodeTotals,
        seriesTotals,
        addContestant,
        updateContestant,
        removeContestant,
        reorderContestants,
        addTeam,
        updateTeam,
        removeTeam,
        addEpisode,
        setActiveEpisode,
        updateEpisode,
        removeEpisode,
        addTask,
        updateTask,
        removeTask,
        setActiveTask,
        reorderTasks,
        setTaskAssignedContestants,
        toggleContestantSitOut,
        addSubTask,
        updateSubTask,
        removeSubTask,
        setActiveSubtask,
        setSubtaskScore,
        syncSubtaskScoresToParent,
        setTaskBet,
        removeTaskBet,
        resolveTaskBets,
        revealBet,
        revealAllBets,
        setScore,
        setTaskScores,
        quickRankTask,
        toggleDQ,
        autoScoreByRanking,
        setPresentationView,
        revealContestant,
        revealNextScore,
        revealAllScores,
        resetReveals,
        setDisplayMessage,
        setBannerVisible,
        setShowPartLabel,
        triggerConfetti,
        triggerSound,
        startTimer,
        pauseTimer,
        resetTimer,
        setSeriesTitle,
        toggleSound,
        openStageWindow,
        loadDemoData,
        resetToEmpty,
        exportJSON,
        importJSON,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
