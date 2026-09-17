import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  GameLedgerState,
  Contestant,
  Task,
  Episode,
  ScoreEntry,
  PresentationViewType,
  BroadcastMessage,
  SoundType,
} from '../types';
import { INITIAL_DEMO_STATE, EMPTY_STATE } from '../data/demoData';
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
  activeEpisode: Episode | undefined;
  activeTask: Task | undefined;
  episodeTotals: ContestantTotal[];
  seriesTotals: ContestantTotal[];
  
  // Contestant actions
  addContestant: (name: string, colorHex?: string, avatar?: string) => void;
  updateContestant: (id: string, updates: Partial<Contestant>) => void;
  removeContestant: (id: string) => void;
  reorderContestants: (fromIdx: number, toIdx: number) => void;

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

  // Scoring actions
  setScore: (taskId: string, contestantId: string, updates: Partial<ScoreEntry>) => void;
  quickRankTask: (taskId: string, contestantId: string, rankPoints: number) => void;
  toggleDQ: (taskId: string, contestantId: string, dqReason?: string) => void;
  autoScoreByRanking: (taskId: string, orderedContestantIds: string[], descending?: boolean) => void;

  // Presentation / Stage Director actions
  setPresentationView: (view: PresentationViewType) => void;
  revealContestant: (contestantId: string) => void;
  revealNextScore: () => void;
  revealAllScores: () => void;
  resetReveals: () => void;
  setDisplayMessage: (msg: string | null) => void;
  setBannerVisible: (visible: boolean) => void;
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

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if current URL param specifies stage display mode (?stage=true)
  const [isStageMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('stage') === 'true';
  });

  const [state, setState] = useState<GameLedgerState>(() => {
    if (typeof window === 'undefined') return INITIAL_DEMO_STATE;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved state, using demo', e);
      }
    }
    return INITIAL_DEMO_STATE;
  });

  const channelRef = useRef<BroadcastChannel | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Initialize BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.type === 'STATE_UPDATE') {
        setState(msg.state);
      } else if (msg.type === 'AUDIO_TRIGGER') {
        if (state.soundEnabled) {
          playAudioCue(msg.sound);
        }
      } else if (msg.type === 'CONFETTI_BURST') {
        runConfettiAnimation();
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [state.soundEnabled]);

  // Persist state to LocalStorage and broadcast changes (Host only)
  const broadcastState = useCallback((newState: GameLedgerState) => {
    setState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      channelRef.current?.postMessage({
        type: 'STATE_UPDATE',
        state: newState,
      } as BroadcastMessage);
    } catch (e) {
      console.error('Storage or broadcast error', e);
    }
  }, []);

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

  const triggerSound = useCallback((sound: SoundType) => {
    if (state.soundEnabled) {
      playAudioCue(sound);
    }
    channelRef.current?.postMessage({
      type: 'AUDIO_TRIGGER',
      sound,
    } as BroadcastMessage);
  }, [state.soundEnabled, playAudioCue]);

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

  const triggerConfetti = useCallback(() => {
    runConfettiAnimation();
    channelRef.current?.postMessage({
      type: 'CONFETTI_BURST',
    } as BroadcastMessage);
  }, [runConfettiAnimation]);

  // Timer runner
  useEffect(() => {
    if (state.timer.isRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setState((prev) => {
          if (!prev.timer.isRunning) return prev;

          let newSeconds = prev.timer.seconds;
          let shouldStop = false;

          if (prev.timer.isCountdown) {
            newSeconds = Math.max(0, prev.timer.seconds - 1);
            if (newSeconds === 0) {
              shouldStop = true;
              triggerSound('buzzer');
            } else if (newSeconds <= 5) {
              triggerSound('tick');
            }
          } else {
            newSeconds = prev.timer.seconds + 1;
          }

          const updated: GameLedgerState = {
            ...prev,
            timer: {
              ...prev.timer,
              seconds: newSeconds,
              isRunning: !shouldStop,
            },
          };

          channelRef.current?.postMessage({
            type: 'STATE_UPDATE',
            state: updated,
          } as BroadcastMessage);

          return updated;
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
  }, [state.timer.isRunning, state.timer.isCountdown, triggerSound]);

  // Active episode and task computed
  const activeEpisode = state.episodes.find((e) => e.id === state.activeEpisodeId) || state.episodes[0];
  const activeTask = activeEpisode?.tasks.find((t) => t.id === state.activeTaskId) || activeEpisode?.tasks[0];

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
            episodeTaskCounts[cid] = (episodeTaskCounts[cid] || 0) + 1;
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
            seriesTaskCounts[cid] = (seriesTaskCounts[cid] || 0) + 1;
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
    const palette = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
    const emojis = ['👑', '⭐', '🎩', '🦁', '🦉', '🦊', '🦆', '🦔', '🦄', '🐝'];
    
    const newContestant: Contestant = {
      id: 'c_' + Date.now() + Math.random().toString(36).substring(2, 5),
      name: name.trim(),
      seatIndex: state.contestants.length,
      colorHex: colorHex || palette[state.contestants.length % palette.length],
      avatar: avatar || emojis[state.contestants.length % emojis.length],
      teamId: state.contestants.length % 2 === 0 ? 'A' : 'B',
    };

    broadcastState({
      ...state,
      contestants: [...state.contestants, newContestant],
    });
  }, [state, broadcastState]);

  const updateContestant = useCallback((id: string, updates: Partial<Contestant>) => {
    const updated = state.contestants.map((c) => (c.id === id ? { ...c, ...updates } : c));
    broadcastState({ ...state, contestants: updated });
  }, [state, broadcastState]);

  const removeContestant = useCallback((id: string) => {
    const updated = state.contestants.filter((c) => c.id !== id);
    broadcastState({ ...state, contestants: updated });
  }, [state, broadcastState]);

  const reorderContestants = useCallback((fromIdx: number, toIdx: number) => {
    const list = [...state.contestants];
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    const updated = list.map((c, idx) => ({ ...c, seatIndex: idx }));
    broadcastState({ ...state, contestants: updated });
  }, [state, broadcastState]);

  // Episode actions
  const addEpisode = useCallback((title?: string) => {
    const num = state.episodes.length + 1;
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
    broadcastState({
      ...state,
      episodes: [...state.episodes, newEp],
      activeEpisodeId: newEp.id,
      activeTaskId: newEp.tasks[0].id,
    });
  }, [state, broadcastState]);

  const setActiveEpisode = useCallback((id: string) => {
    const ep = state.episodes.find((e) => e.id === id);
    broadcastState({
      ...state,
      activeEpisodeId: id,
      activeTaskId: ep?.tasks[0]?.id || null,
    });
  }, [state, broadcastState]);

  const updateEpisode = useCallback((id: string, updates: Partial<Episode>) => {
    const updated = state.episodes.map((e) => (e.id === id ? { ...e, ...updates } : e));
    broadcastState({ ...state, episodes: updated });
  }, [state, broadcastState]);

  const removeEpisode = useCallback((id: string) => {
    if (state.episodes.length <= 1) return; // Keep at least one episode
    const updated = state.episodes.filter((e) => e.id !== id);
    const nextActive = updated[0]?.id || '';
    broadcastState({
      ...state,
      episodes: updated,
      activeEpisodeId: nextActive,
      activeTaskId: updated[0]?.tasks[0]?.id || null,
    });
  }, [state, broadcastState]);

  // Task actions
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'orderIndex' | 'scores'>) => {
    if (!activeEpisode) return;
    const newTask: Task = {
      ...taskData,
      id: 't_' + Date.now(),
      orderIndex: activeEpisode.tasks.length,
      scores: {},
    };

    const updatedEpisodes = state.episodes.map((ep) => {
      if (ep.id === activeEpisode.id) {
        return {
          ...ep,
          tasks: [...ep.tasks, newTask],
        };
      }
      return ep;
    });

    broadcastState({
      ...state,
      episodes: updatedEpisodes,
      activeTaskId: newTask.id,
      presentation: {
        ...state.presentation,
        view: 'task_brief',
        revealedContestantIds: [],
        revealedAll: false,
      },
    });
    triggerSound('seal');
  }, [state, activeEpisode, broadcastState, triggerSound]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const updatedEpisodes = state.episodes.map((ep) => ({
      ...ep,
      tasks: ep.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    broadcastState({ ...state, episodes: updatedEpisodes });
  }, [state, broadcastState]);

  const removeTask = useCallback((id: string) => {
    const updatedEpisodes = state.episodes.map((ep) => ({
      ...ep,
      tasks: ep.tasks.filter((t) => t.id !== id),
    }));
    broadcastState({
      ...state,
      episodes: updatedEpisodes,
      activeTaskId: activeEpisode?.tasks.find((t) => t.id !== id)?.id || null,
    });
  }, [state, activeEpisode, broadcastState]);

  const setActiveTask = useCallback((id: string | null) => {
    broadcastState({
      ...state,
      activeTaskId: id,
      presentation: {
        ...state.presentation,
        revealedContestantIds: [],
        revealedAll: false,
      },
    });
  }, [state, broadcastState]);

  const reorderTasks = useCallback((fromIdx: number, toIdx: number) => {
    if (!activeEpisode) return;
    const list = [...activeEpisode.tasks];
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    const updatedTasks = list.map((t, idx) => ({ ...t, orderIndex: idx }));

    const updatedEpisodes = state.episodes.map((ep) =>
      ep.id === activeEpisode.id ? { ...ep, tasks: updatedTasks } : ep
    );
    broadcastState({ ...state, episodes: updatedEpisodes });
  }, [state, activeEpisode, broadcastState]);

  // Scoring actions
  const setScore = useCallback((taskId: string, contestantId: string, updates: Partial<ScoreEntry>) => {
    const updatedEpisodes = state.episodes.map((ep) => ({
      ...ep,
      tasks: ep.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const currentEntry = t.scores[contestantId] || {
          contestantId,
          points: 0,
          isDisqualified: false,
        };
        return {
          ...t,
          scores: {
            ...t.scores,
            [contestantId]: { ...currentEntry, ...updates },
          },
        };
      }),
    }));

    broadcastState({ ...state, episodes: updatedEpisodes });
  }, [state, broadcastState]);

  const quickRankTask = useCallback((taskId: string, contestantId: string, rankPoints: number) => {
    setScore(taskId, contestantId, {
      points: rankPoints,
      isDisqualified: false,
      rank: Math.max(1, 6 - rankPoints),
    });
    triggerSound('reveal');
  }, [setScore, triggerSound]);

  const toggleDQ = useCallback((taskId: string, contestantId: string, dqReason?: string) => {
    const currentTask = activeEpisode?.tasks.find((t) => t.id === taskId);
    const isCurrentlyDQ = currentTask?.scores[contestantId]?.isDisqualified ?? false;

    setScore(taskId, contestantId, {
      isDisqualified: !isCurrentlyDQ,
      points: !isCurrentlyDQ ? 0 : 1,
      dqReason: !isCurrentlyDQ ? (dqReason || 'Disqualified by Taskmaster') : undefined,
    });

    if (!isCurrentlyDQ) {
      triggerSound('dq');
    }
  }, [activeEpisode, setScore, triggerSound]);

  const autoScoreByRanking = useCallback((taskId: string, orderedContestantIds: string[], descending: boolean = true) => {
    // 5 points for 1st, 4 for 2nd, etc.
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

    const updatedEpisodes = state.episodes.map((ep) => ({
      ...ep,
      tasks: ep.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const newScores = { ...t.scores };
        Object.entries(scoreUpdates).forEach(([cid, entry]) => {
          newScores[cid] = { ...(newScores[cid] || { contestantId: cid }), ...entry } as ScoreEntry;
        });
        return { ...t, scores: newScores };
      }),
    }));

    broadcastState({ ...state, episodes: updatedEpisodes });
  }, [state, broadcastState]);

  // Presentation / Stage Director actions
  const setPresentationView = useCallback((view: PresentationViewType) => {
    broadcastState({
      ...state,
      presentation: {
        ...state.presentation,
        view,
      },
    });
    if (view === 'task_brief') {
      triggerSound('seal');
    } else if (view === 'winner') {
      triggerSound('fanfare');
      triggerConfetti();
    }
  }, [state, broadcastState, triggerSound, triggerConfetti]);

  const revealContestant = useCallback((contestantId: string) => {
    const revealed = state.presentation.revealedContestantIds.includes(contestantId)
      ? state.presentation.revealedContestantIds
      : [...state.presentation.revealedContestantIds, contestantId];

    const allRevealed = state.contestants.every((c) => revealed.includes(c.id));

    broadcastState({
      ...state,
      presentation: {
        ...state.presentation,
        revealedContestantIds: revealed,
        revealedAll: allRevealed,
        spotlightContestantId: contestantId,
      },
    });

    // Check if contestant was DQ'd or scored
    const scoreEntry = activeTask?.scores[contestantId];
    if (scoreEntry?.isDisqualified) {
      triggerSound('dq');
    } else {
      triggerSound('reveal');
    }
  }, [state, activeTask, broadcastState, triggerSound]);

  const revealNextScore = useCallback(() => {
    if (!activeTask) return;
    // Reveal from lowest to highest points for maximum drama
    const unrevealed = state.contestants
      .filter((c) => !state.presentation.revealedContestantIds.includes(c.id))
      .sort((a, b) => {
        const scoreA = activeTask.scores[a.id]?.points ?? 0;
        const scoreB = activeTask.scores[b.id]?.points ?? 0;
        return scoreA - scoreB;
      });

    if (unrevealed.length > 0) {
      revealContestant(unrevealed[0].id);
    }
  }, [activeTask, state.contestants, state.presentation.revealedContestantIds, revealContestant]);

  const revealAllScores = useCallback(() => {
    const allIds = state.contestants.map((c) => c.id);
    broadcastState({
      ...state,
      presentation: {
        ...state.presentation,
        revealedContestantIds: allIds,
        revealedAll: true,
      },
    });
    triggerSound('reveal');
  }, [state, broadcastState, triggerSound]);

  const resetReveals = useCallback(() => {
    broadcastState({
      ...state,
      presentation: {
        ...state.presentation,
        revealedContestantIds: [],
        revealedAll: false,
        spotlightContestantId: null,
      },
    });
  }, [state, broadcastState]);

  const setDisplayMessage = useCallback((msg: string | null) => {
    broadcastState({
      ...state,
      presentation: {
        ...state.presentation,
        displayMessage: msg,
      },
    });
  }, [state, broadcastState]);

  const setBannerVisible = useCallback((visible: boolean) => {
    broadcastState({
      ...state,
      presentation: {
        ...state.presentation,
        bannerVisible: visible,
      },
    });
  }, [state, broadcastState]);

  // Timer actions
  const startTimer = useCallback((countdownSeconds?: number) => {
    const isCountdown = typeof countdownSeconds === 'number' && countdownSeconds > 0;
    broadcastState({
      ...state,
      timer: {
        isRunning: true,
        seconds: isCountdown ? countdownSeconds : state.timer.seconds,
        initialLimit: isCountdown ? countdownSeconds : state.timer.initialLimit,
        isCountdown,
      },
    });
  }, [state, broadcastState]);

  const pauseTimer = useCallback(() => {
    broadcastState({
      ...state,
      timer: {
        ...state.timer,
        isRunning: false,
      },
    });
  }, [state, broadcastState]);

  const resetTimer = useCallback((countdownSeconds?: number) => {
    const isCountdown = typeof countdownSeconds === 'number' && countdownSeconds > 0;
    broadcastState({
      ...state,
      timer: {
        isRunning: false,
        seconds: isCountdown ? countdownSeconds : 0,
        initialLimit: isCountdown ? countdownSeconds : null,
        isCountdown,
      },
    });
  }, [state, broadcastState]);

  // General settings & import/export
  const setSeriesTitle = useCallback((title: string) => {
    broadcastState({ ...state, seriesTitle: title });
  }, [state, broadcastState]);

  const toggleSound = useCallback(() => {
    broadcastState({ ...state, soundEnabled: !state.soundEnabled });
  }, [state, broadcastState]);

  const openStageWindow = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('stage', 'true');
    window.open(url.toString(), 'GameLedgerStage', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
  }, []);

  const loadDemoData = useCallback(() => {
    broadcastState(INITIAL_DEMO_STATE);
    triggerSound('fanfare');
  }, [broadcastState, triggerSound]);

  const resetToEmpty = useCallback(() => {
    broadcastState(EMPTY_STATE);
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
        broadcastState(parsed);
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
        activeEpisode,
        activeTask,
        episodeTotals,
        seriesTotals,
        addContestant,
        updateContestant,
        removeContestant,
        reorderContestants,
        addEpisode,
        setActiveEpisode,
        updateEpisode,
        removeEpisode,
        addTask,
        updateTask,
        removeTask,
        setActiveTask,
        reorderTasks,
        setScore,
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
