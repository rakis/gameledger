import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  AlertOctagon,
  Award,
  ArrowUpDown,
} from 'lucide-react';

export const TaskScorerPanel: React.FC = () => {
  const {
    activeTask,
    updateTask,
    state,
    setScore,
    quickRankTask,
    toggleDQ,
    autoScoreByRanking,
    startTimer,
    pauseTimer,
    resetTimer,
    triggerSound,
  } = useGame();

  const [customDQReason, setCustomDQReason] = useState<{ [contestantId: string]: string }>({});
  const [editingBrief, setEditingBrief] = useState(false);
  const [briefInput, setBriefInput] = useState(activeTask?.brief || '');

  if (!activeTask) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-stone-500">
        <Clock className="w-12 h-12 text-stone-700 mb-3" />
        <h3 className="font-serif text-lg text-stone-300">No Task Selected</h3>
        <p className="text-xs text-stone-500 mt-1">
          Select a task from the sidebar or click "Add Task" to start scoring.
        </p>
      </div>
    );
  }

  // Format seconds to mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBriefSubmit = () => {
    updateTask(activeTask.id, { brief: briefInput });
    setEditingBrief(false);
  };

  // Rank contestants automatically by time taken (fastest wins: lowest time = 5 pts)
  const autoScoreByTime = () => {
    const scoredContestants = state.contestants
      .filter((c) => {
        const entry = activeTask.scores[c.id];
        return entry && entry.timeTakenSeconds !== undefined && !entry.isDisqualified;
      })
      .sort((a, b) => {
        const timeA = activeTask.scores[a.id]?.timeTakenSeconds || 0;
        const timeB = activeTask.scores[b.id]?.timeTakenSeconds || 0;
        return timeA - timeB; // ascending
      });

    if (scoredContestants.length === 0) {
      alert('Please enter recorded times for contestants before auto-scoring by time.');
      return;
    }

    autoScoreByRanking(activeTask.id, scoredContestants.map((c) => c.id), true);
    triggerSound('reveal');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Top Banner: Task Title, Category & Editable Brief */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-tm-gold">
                Task Category: {activeTask.type}
              </span>
              {activeTask.isTimed && (
                <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">
                  Timed Task
                </span>
              )}
            </div>
            <h2 className="font-serif font-black text-xl md:text-2xl text-stone-100">
              {activeTask.title}
            </h2>
          </div>

          {/* Quick Auto-Score button if timed */}
          {activeTask.isTimed && (
            <button
              onClick={autoScoreByTime}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-tm-gold text-xs font-bold border border-stone-700 hover:border-tm-gold transition-colors"
              title="Automatically assign 5, 4, 3, 2, 1 points based on fastest recorded time"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Auto-Score by Time (Fastest Wins)</span>
            </button>
          )}
        </div>

        {/* Task Brief / Instructions */}
        <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800/80">
          {editingBrief ? (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={briefInput}
                onChange={(e) => setBriefInput(e.target.value)}
                className="w-full bg-stone-900 text-stone-100 text-xs font-mono p-2 rounded-lg border border-stone-700 focus:outline-none focus:border-tm-gold"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingBrief(false)}
                  className="px-2.5 py-1 text-xs text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBriefSubmit}
                  className="px-3 py-1 bg-tm-red text-white text-xs font-bold rounded-lg"
                >
                  Save Brief
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                setBriefInput(activeTask.brief);
                setEditingBrief(true);
              }}
              className="cursor-pointer hover:border-stone-700 group"
              title="Click to edit task brief"
            >
              <p className="text-stone-300 text-xs md:text-sm font-typewriter italic leading-relaxed">
                "{activeTask.brief}"
              </p>
              <span className="text-[10px] text-stone-500 mt-1 block group-hover:text-tm-gold">
                (Click to edit brief text)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Built-in Task Stopwatch & Countdown Timer */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center">
            <Clock className={`w-6 h-6 ${state.timer.isRunning ? 'text-tm-goldBright animate-spin-slow' : 'text-tm-gold'}`} />
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">
              {state.timer.isCountdown ? 'Countdown Clock' : 'Task Stopwatch'}
            </span>
            <span className="font-mono text-3xl md:text-4xl font-black text-stone-100 tracking-wider">
              {formatTime(state.timer.seconds)}
            </span>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {state.timer.isRunning ? (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-transform hover:scale-105"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={() => startTimer(activeTask.isTimed && activeTask.timeLimitSeconds ? activeTask.timeLimitSeconds : undefined)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tm-red hover:bg-tm-redBright text-white text-xs font-bold shadow-gold transition-transform hover:scale-105"
            >
              <Play className="w-4 h-4" />
              <span>{state.timer.seconds > 0 ? 'Resume' : 'Start Timer'}</span>
            </button>
          )}

          <button
            onClick={() => resetTimer(activeTask.isTimed && activeTask.timeLimitSeconds ? activeTask.timeLimitSeconds : undefined)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Quick countdown presets */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
            {[60, 180, 300, 600].map((secs) => (
              <button
                key={secs}
                onClick={() => {
                  resetTimer(secs);
                  startTimer(secs);
                }}
                className="px-2 py-1 text-[11px] font-mono font-bold text-stone-400 hover:text-tm-gold rounded hover:bg-stone-900"
              >
                {secs / 60}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contestant Scoring Matrix Table */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-3 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-tm-gold" />
            <span>Award Points & Record Results</span>
          </h3>
          <span className="text-xs text-stone-400">
            Standard 5-Point scale (or enter custom scores)
          </span>
        </div>

        <div className="divide-y divide-stone-800">
          {state.contestants.map((c) => {
            const score = activeTask.scores[c.id] || {
              contestantId: c.id,
              points: 0,
              isDisqualified: false,
            };

            const isDQ = score.isDisqualified;

            return (
              <div
                key={c.id}
                className={`p-4 md:p-5 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 transition-colors ${
                  isDQ ? 'bg-red-950/20' : 'hover:bg-stone-800/30'
                }`}
              >
                {/* Contestant identity */}
                <div className="flex items-center gap-3.5 min-w-0 2xl:min-w-[200px] flex-shrink-0">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold shadow-md ring-2 ring-white/10"
                    style={{ backgroundColor: c.colorHex }}
                  >
                    {c.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-stone-100 flex items-center gap-1.5">
                      <span>{c.name}</span>
                      {c.teamId && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-stone-800 text-stone-300">
                          Team {c.teamId}
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-stone-400">
                      Seat #{c.seatIndex + 1}
                    </span>
                  </div>
                </div>

                {/* Quick 5-4-3-2-1 Points Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[5, 4, 3, 2, 1].map((pts) => {
                    const isSelected = !isDQ && score.points === pts;
                    return (
                      <button
                        key={pts}
                        disabled={isDQ}
                        onClick={() => quickRankTask(activeTask.id, c.id, pts)}
                        className={`w-9 h-9 rounded-xl font-mono font-bold text-sm transition-all ${
                          isSelected
                            ? 'bg-tm-gold text-stone-950 shadow-gold scale-110 font-black'
                            : isDQ
                            ? 'opacity-30 bg-stone-800 text-stone-500 cursor-not-allowed'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white'
                        }`}
                        title={`Award ${pts} points`}
                      >
                        {pts}
                      </button>
                    );
                  })}

                  {/* Direct point value input */}
                  <div className="flex items-center gap-1 ml-1 bg-stone-950 px-2 py-1 rounded-xl border border-stone-800">
                    <span className="text-[10px] uppercase text-stone-500 font-bold">PTS:</span>
                    <input
                      type="number"
                      disabled={isDQ}
                      value={isDQ ? 0 : score.points}
                      onChange={(e) =>
                        setScore(activeTask.id, c.id, {
                          points: Number(e.target.value),
                          isDisqualified: false,
                        })
                      }
                      className="w-12 bg-transparent text-stone-100 font-mono font-bold text-sm text-center focus:outline-none disabled:opacity-40"
                    />
                  </div>

                  {/* DQ (Disqualification) Toggle Button */}
                  <button
                    onClick={() => toggleDQ(activeTask.id, c.id, customDQReason[c.id])}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isDQ
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-stone-800 hover:bg-red-950/60 text-stone-400 hover:text-red-300 border border-stone-700'
                    }`}
                    title="Toggle Disqualification (0 Points)"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>{isDQ ? 'DQ\'D (0 PTS)' : 'DQ'}</span>
                  </button>
                </div>

                {/* Attempt Details: Time taken & Attempt Notes */}
                <div className="flex items-center gap-2 flex-1 w-full 2xl:w-auto 2xl:max-w-md min-w-0">
                  {/* Time taken input */}
                  <div className="flex items-center gap-1 bg-stone-950 px-2.5 py-1.5 rounded-xl border border-stone-800 min-w-[130px] flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-tm-gold flex-shrink-0" />
                    <input
                      type="number"
                      placeholder="Time (sec)"
                      value={score.timeTakenSeconds ?? ''}
                      onChange={(e) =>
                        setScore(activeTask.id, c.id, {
                          timeTakenSeconds: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full bg-transparent text-stone-200 text-xs font-mono focus:outline-none"
                    />
                    {/* Button to stamp current timer value */}
                    {state.timer.seconds > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setScore(activeTask.id, c.id, {
                            timeTakenSeconds: state.timer.seconds,
                          })
                        }
                        title="Stamp current timer seconds"
                        className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-tm-gold hover:bg-stone-700 font-bold"
                      >
                        Stamp
                      </button>
                    )}
                  </div>

                  {/* Attempt Note */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder={isDQ ? 'Reason for DQ...' : 'Attempt notes or description...'}
                      value={isDQ ? (score.dqReason || '') : (score.attemptNote || '')}
                      onChange={(e) => {
                        if (isDQ) {
                          setCustomDQReason({ ...customDQReason, [c.id]: e.target.value });
                          setScore(activeTask.id, c.id, { dqReason: e.target.value });
                        } else {
                          setScore(activeTask.id, c.id, { attemptNote: e.target.value });
                        }
                      }}
                      className={`w-full text-xs px-3 py-1.5 rounded-xl border focus:outline-none ${
                        isDQ
                          ? 'bg-red-950/40 border-red-800 text-red-200 placeholder:text-red-400/50'
                          : 'bg-stone-950 border-stone-800 text-stone-300 placeholder:text-stone-600 focus:border-tm-gold'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
