import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { DEFAULT_TEAMS } from '../../data/demoData';
import { SubtaskScoringMode } from '../../types';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  AlertOctagon,
  Award,
  ArrowUpDown,
  Plus,
  Trash2,
  Users,
  Sparkles,
  Layers,
  Shield,
  Coins,
  CheckCircle2,
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
    setTaskAssignedContestants,
    toggleContestantSitOut,
    addSubTask,
    updateSubTask,
    removeSubTask,
    setSubtaskScore,
    syncSubtaskScoresToParent,
    setTaskBet,
    removeTaskBet,
    resolveTaskBets,
    startTimer,
    pauseTimer,
    resetTimer,
    triggerSound,
  } = useGame();

  const [customDQReason, setCustomDQReason] = useState<{ [contestantId: string]: string }>({});
  const [editingBrief, setEditingBrief] = useState(false);
  const [briefInput, setBriefInput] = useState(activeTask?.brief || '');
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);

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

  const teams = state.teams || DEFAULT_TEAMS;
  const subtasks = activeTask.subtasks || [];
  const currentSubtask = subtasks.find((st) => st.id === selectedSubtaskId);

  // Active vs Sat Out participants
  const assignedIds = activeTask.assignedContestantIds && activeTask.assignedContestantIds.length > 0
    ? activeTask.assignedContestantIds
    : state.contestants.map((c) => c.id);

  const activeContestants = state.contestants.filter((c) => assignedIds.includes(c.id));
  const satOutContestants = state.contestants.filter((c) => !assignedIds.includes(c.id));

  // Format seconds to mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBriefSubmit = () => {
    if (currentSubtask) {
      updateSubTask(activeTask.id, currentSubtask.id, { brief: briefInput });
    } else {
      updateTask(activeTask.id, { brief: briefInput });
    }
    setEditingBrief(false);
  };

  // Rank contestants automatically by time taken (fastest wins: lowest time = 5 pts)
  const autoScoreByTime = () => {
    const scoredContestants = activeContestants
      .filter((c) => {
        const entry = currentSubtask ? currentSubtask.scores[c.id] : activeTask.scores[c.id];
        return entry && entry.timeTakenSeconds !== undefined && !entry.isDisqualified;
      })
      .sort((a, b) => {
        const timeA = (currentSubtask ? currentSubtask.scores[a.id]?.timeTakenSeconds : activeTask.scores[a.id]?.timeTakenSeconds) || 0;
        const timeB = (currentSubtask ? currentSubtask.scores[b.id]?.timeTakenSeconds : activeTask.scores[b.id]?.timeTakenSeconds) || 0;
        return timeA - timeB;
      });

    if (scoredContestants.length === 0) {
      alert('Please enter recorded times for contestants before auto-scoring by time.');
      return;
    }

    if (currentSubtask) {
      const pointScale = [5, 4, 3, 2, 1];
      scoredContestants.forEach((c, idx) => {
        setSubtaskScore(activeTask.id, currentSubtask.id, c.id, {
          points: idx < pointScale.length ? pointScale[idx] : 1,
          rank: idx + 1,
          isDisqualified: false,
        });
      });
    } else {
      autoScoreByRanking(activeTask.id, scoredContestants.map((c) => c.id), true);
    }
    triggerSound('reveal');
  };

  // Quick award team points to all members of a team
  const awardTeamPoints = (teamId: string, pts: number) => {
    const teamMembers = activeContestants.filter((c) => c.teamId === teamId);
    teamMembers.forEach((member) => {
      if (currentSubtask) {
        setSubtaskScore(activeTask.id, currentSubtask.id, member.id, {
          points: pts,
          isDisqualified: false,
        });
      } else {
        setScore(activeTask.id, member.id, {
          points: pts,
          isDisqualified: false,
        });
      }
    });
    triggerSound('reveal');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Top Banner: Task Title, Category & Editable Brief */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-widest text-tm-gold">
                Task Category: {activeTask.type}
              </span>
              {activeTask.isTimed && (
                <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">
                  Timed Task
                </span>
              )}
              {subtasks.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-tm-red/30 text-amber-300 font-semibold border border-tm-red/50">
                  {subtasks.length} Sub-Tasks ({activeTask.subtaskScoringMode || 'sum'} mode)
                </span>
              )}
            </div>
            <h2 className="font-serif font-black text-xl md:text-2xl text-stone-100">
              {currentSubtask ? `${activeTask.title} — ${currentSubtask.title}` : activeTask.title}
            </h2>
          </div>

          {/* Actions toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeTask.isTimed && (
              <button
                onClick={autoScoreByTime}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-tm-gold text-xs font-bold border border-stone-700 hover:border-tm-gold transition-colors cursor-pointer"
                title="Automatically assign points based on fastest recorded time"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Auto-Score by Time</span>
              </button>
            )}

            {subtasks.length > 0 && (
              <button
                onClick={() => syncSubtaskScoresToParent(activeTask.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-tm-gold hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-md transition-colors cursor-pointer"
                title="Roll up all subtask scores into master task"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sync to Master Scores</span>
              </button>
            )}
          </div>
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
                  className="px-2.5 py-1 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBriefSubmit}
                  className="px-3 py-1 bg-tm-red text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Save Brief
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                setBriefInput(currentSubtask ? currentSubtask.brief : activeTask.brief);
                setEditingBrief(true);
              }}
              className="cursor-pointer hover:border-stone-700 group"
              title="Click to edit task brief"
            >
              <p className="text-stone-300 text-xs md:text-sm font-typewriter italic leading-relaxed">
                "{currentSubtask ? currentSubtask.brief : activeTask.brief}"
              </p>
              <span className="text-[10px] text-stone-500 mt-1 block group-hover:text-tm-gold">
                (Click to edit {currentSubtask ? 'subtask' : 'task'} brief)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Tasks Step Bar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3 shadow-md">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1 mr-2">
              <Layers className="w-3.5 h-3.5 text-tm-gold" />
              <span>Stages / Parts:</span>
            </span>

            {/* Master Task Tab */}
            <button
              onClick={() => setSelectedSubtaskId(null)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSubtaskId === null
                  ? 'bg-tm-red text-white shadow-sm font-black'
                  : 'bg-stone-950 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <span>Master Overview</span>
            </button>

            {/* Subtask Tabs */}
            {subtasks.map((st, idx) => (
              <div key={st.id} className="flex items-center">
                <button
                  onClick={() => setSelectedSubtaskId(st.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSubtaskId === st.id
                      ? 'bg-tm-gold text-stone-950 shadow-sm font-black'
                      : 'bg-stone-950 text-stone-300 hover:bg-stone-800 border-y border-l border-stone-800'
                  }`}
                >
                  <span>{st.title || `Part ${idx + 1}`}</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete subtask "${st.title}"?`)) {
                      removeSubTask(activeTask.id, st.id);
                      if (selectedSubtaskId === st.id) setSelectedSubtaskId(null);
                    }
                  }}
                  className={`p-1.5 rounded-r-lg text-xs hover:text-red-400 transition-colors cursor-pointer ${
                    selectedSubtaskId === st.id
                      ? 'bg-tm-gold text-stone-900 border-l border-amber-500'
                      : 'bg-stone-950 text-stone-500 hover:bg-stone-800 border-y border-r border-stone-800'
                  }`}
                  title="Delete subtask"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add Subtask button */}
            <button
              onClick={() => {
                const nextNum = subtasks.length + 1;
                addSubTask(activeTask.id, `Part ${nextNum}`);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 border border-dashed border-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-tm-gold" />
              <span>Add Part</span>
            </button>
          </div>

          {/* Rollup Scoring Mode & TV Label Toggle */}
          {subtasks.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-stone-400">
              <label
                className="flex items-center gap-1.5 cursor-pointer select-none"
                title="Toggle displaying 'Part X' labels on stage screen"
              >
                <input
                  type="checkbox"
                  checked={activeTask.showPartLabel ?? false}
                  onChange={(e) =>
                    updateTask(activeTask.id, { showPartLabel: e.target.checked })
                  }
                  className="rounded bg-stone-950 border-stone-700 text-tm-gold focus:ring-0 cursor-pointer"
                />
                <span className="text-stone-300 font-medium">Show Part on TV</span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="font-medium">Rollup:</span>
                <select
                  value={activeTask.subtaskScoringMode || 'sum'}
                  onChange={(e) =>
                    updateTask(activeTask.id, {
                      subtaskScoringMode: e.target.value as SubtaskScoringMode,
                    })
                  }
                  className="bg-stone-950 text-stone-200 px-2 py-1 rounded-lg border border-stone-800 font-semibold focus:outline-none focus:border-tm-gold cursor-pointer"
                >
                  <option value="sum">Sum of Parts</option>
                  <option value="final_rank">Final Rank (5,4,3,2,1)</option>
                  <option value="custom">Custom / Manual</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Participant Active / Sit-Out Management Bar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-md space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-tm-gold" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-200">
              Active Participants for this Task ({activeContestants.length} of {state.contestants.length}):
            </span>
          </div>

          <button
            onClick={() =>
              setTaskAssignedContestants(
                activeTask.id,
                state.contestants.map((c) => c.id)
              )
            }
            className="text-xs text-tm-gold hover:text-amber-300 font-semibold underline cursor-pointer"
          >
            Reset: All Active
          </button>
        </div>

        {/* Contestant Assignment Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {state.contestants.map((c) => {
            const isActive = assignedIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleContestantSitOut(activeTask.id, c.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-stone-950 border-tm-gold/70 text-stone-100 shadow-sm'
                    : 'bg-stone-950/40 border-stone-800 text-stone-500 hover:text-stone-300 opacity-60'
                }`}
                title={isActive ? 'Click to sit out' : 'Click to activate for task'}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: c.colorHex }}
                >
                  {c.avatar}
                </span>
                <span>{c.name}</span>
                {isActive ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-stone-800 text-stone-400">
                    Sat Out
                  </span>
                )}
              </button>
            );
          })}
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-transform hover:scale-105 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={() => startTimer(activeTask.isTimed && activeTask.timeLimitSeconds ? activeTask.timeLimitSeconds : undefined)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tm-red hover:bg-tm-redBright text-white text-xs font-bold shadow-gold transition-transform hover:scale-105 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{state.timer.seconds > 0 ? 'Resume' : 'Start Timer'}</span>
            </button>
          )}

          <button
            onClick={() => resetTimer(activeTask.isTimed && activeTask.timeLimitSeconds ? activeTask.timeLimitSeconds : undefined)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
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
                className="px-2 py-1 text-[11px] font-mono font-bold text-stone-400 hover:text-tm-gold rounded hover:bg-stone-900 cursor-pointer"
              >
                {secs / 60}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Team Quick Award Bar (when Task Category is Team) */}
      {activeTask.type === 'team' && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-tm-gold" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-200">
              Team Challenge: Quick Award Team Points
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((tm) => {
              const members = activeContestants.filter((c) => c.teamId === tm.id);
              return (
                <div
                  key={tm.id}
                  className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: tm.colorHex }}
                      >
                        {tm.avatar || '🛡️'}
                      </span>
                      <span className="font-bold text-sm text-stone-100">{tm.name}</span>
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {members.length} players
                    </span>
                  </div>

                  {/* Team points buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[5, 4, 3, 2, 1, 0].map((pts) => (
                      <button
                        key={pts}
                        onClick={() => awardTeamPoints(tm.id, pts)}
                        className="px-2 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 font-mono font-bold text-xs border border-stone-700 hover:border-tm-gold cursor-pointer"
                        title={`Award ${pts} points to all ${tm.name} players`}
                      >
                        {pts} pts
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Contestants Scoring Matrix Table */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-3 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-tm-gold" />
            <span>
              {currentSubtask ? `Scoring: ${currentSubtask.title}` : 'Active Contestants Scoring Matrix'}
            </span>
          </h3>
          <span className="text-xs text-stone-400">
            {activeContestants.length} Active Participants
          </span>
        </div>

        <div className="divide-y divide-stone-800">
          {activeContestants.map((c) => {
            const score = currentSubtask
              ? currentSubtask.scores[c.id] || { contestantId: c.id, points: 0, isDisqualified: false }
              : activeTask.scores[c.id] || { contestantId: c.id, points: 0, isDisqualified: false };

            const isDQ = score.isDisqualified;
            const team = teams.find((tm) => tm.id === c.teamId);

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
                      {team && (
                        <span
                          className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded text-white flex items-center gap-1"
                          style={{ backgroundColor: team.colorHex }}
                        >
                          <span>{team.avatar}</span>
                          <span>{team.name}</span>
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
                        onClick={() => {
                          if (currentSubtask) {
                            setSubtaskScore(activeTask.id, currentSubtask.id, c.id, {
                              points: pts,
                              isDisqualified: false,
                              rank: Math.max(1, 6 - pts),
                            });
                          } else {
                            quickRankTask(activeTask.id, c.id, pts);
                          }
                        }}
                        className={`w-9 h-9 rounded-xl font-mono font-bold text-sm transition-all cursor-pointer ${
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
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (currentSubtask) {
                          setSubtaskScore(activeTask.id, currentSubtask.id, c.id, {
                            points: val,
                            isDisqualified: false,
                          });
                        } else {
                          setScore(activeTask.id, c.id, {
                            points: val,
                            isDisqualified: false,
                          });
                        }
                      }}
                      className="w-12 bg-transparent text-stone-100 font-mono font-bold text-sm text-center focus:outline-none disabled:opacity-40"
                    />
                  </div>

                  {/* DQ Toggle Button */}
                  <button
                    onClick={() => {
                      if (currentSubtask) {
                        setSubtaskScore(activeTask.id, currentSubtask.id, c.id, {
                          isDisqualified: !isDQ,
                          points: isDQ ? 1 : 0,
                          dqReason: isDQ ? undefined : 'Disqualified in subtask',
                        });
                      } else {
                        toggleDQ(activeTask.id, c.id, customDQReason[c.id]);
                      }
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isDQ
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-stone-800 hover:bg-red-950/60 text-stone-400 hover:text-red-300 border border-stone-700'
                    }`}
                    title="Toggle Disqualification"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>{isDQ ? "DQ'D" : 'DQ'}</span>
                  </button>
                </div>

                {/* Attempt Details: Time taken & Notes */}
                <div className="flex items-center gap-2 flex-1 w-full 2xl:w-auto 2xl:max-w-md min-w-0">
                  <div className="flex items-center gap-1 bg-stone-950 px-2.5 py-1.5 rounded-xl border border-stone-800 min-w-[130px] flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-tm-gold flex-shrink-0" />
                    <input
                      type="number"
                      placeholder="Time (sec)"
                      value={score.timeTakenSeconds ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        if (currentSubtask) {
                          setSubtaskScore(activeTask.id, currentSubtask.id, c.id, {
                            timeTakenSeconds: val,
                          });
                        } else {
                          setScore(activeTask.id, c.id, {
                            timeTakenSeconds: val,
                          });
                        }
                      }}
                      className="w-full bg-transparent text-stone-200 text-xs font-mono focus:outline-none"
                    />
                    {state.timer.seconds > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (currentSubtask) {
                            setSubtaskScore(activeTask.id, currentSubtask.id, c.id, {
                              timeTakenSeconds: state.timer.seconds,
                            });
                          } else {
                            setScore(activeTask.id, c.id, {
                              timeTakenSeconds: state.timer.seconds,
                            });
                          }
                        }}
                        title="Stamp current timer seconds"
                        className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-tm-gold hover:bg-stone-700 font-bold cursor-pointer"
                      >
                        Stamp
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder={isDQ ? 'Reason for DQ...' : 'Attempt notes or description...'}
                      value={isDQ ? (score.dqReason || '') : (score.attemptNote || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (currentSubtask) {
                          if (isDQ) {
                            setSubtaskScore(activeTask.id, currentSubtask.id, c.id, { dqReason: val });
                          } else {
                            setSubtaskScore(activeTask.id, currentSubtask.id, c.id, { attemptNote: val });
                          }
                        } else {
                          if (isDQ) {
                            setCustomDQReason({ ...customDQReason, [c.id]: val });
                            setScore(activeTask.id, c.id, { dqReason: val });
                          } else {
                            setScore(activeTask.id, c.id, { attemptNote: val });
                          }
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

      {/* Sat-Out Spectators & Betting Section */}
      {satOutContestants.length > 0 && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl overflow-hidden shadow-lg space-y-3 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2.5">
              <Coins className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-serif font-bold text-base text-stone-100">
                  Sat-Out Spectators & Predictions / Bets
                </h3>
                <p className="text-xs text-stone-400">
                  Sat-out players can predict the task winner and win points when their chosen player wins!
                </p>
              </div>
            </div>

            <button
              onClick={() => resolveTaskBets(activeTask.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tm-gold hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
              title="Evaluate all predictions against 1st place winners"
            >
              <Sparkles className="w-4 h-4" />
              <span>Resolve Bets (Auto-Award Points)</span>
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {satOutContestants.map((spectator) => {
              const currentBet = activeTask.bets?.[spectator.id];
              const isResolved = currentBet?.isWon !== undefined;
              const hasWon = currentBet?.isWon === true;

              return (
                <div
                  key={spectator.id}
                  className={`p-3.5 rounded-xl bg-stone-950 border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                    isResolved
                      ? hasWon
                        ? 'border-emerald-500/60 bg-emerald-950/20'
                        : 'border-stone-800 opacity-80'
                      : 'border-stone-800'
                  }`}
                >
                  {/* Spectator Identity */}
                  <div className="flex items-center gap-2.5 min-w-[180px]">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: spectator.colorHex }}
                    >
                      {spectator.avatar}
                    </span>
                    <div>
                      <span className="font-bold text-stone-200 text-sm block">
                        {spectator.name}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Spectating
                      </span>
                    </div>
                  </div>

                  {/* Bet Input Controls */}
                  <div className="flex flex-wrap items-center gap-2.5 flex-1">
                    {/* Choose Winner Target */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-400 font-medium">Predicts:</span>
                      <select
                        value={currentBet?.targetContestantId || currentBet?.targetTeamId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            removeTaskBet(activeTask.id, spectator.id);
                          } else {
                            // Check if team or contestant
                            const isTeam = teams.some((tm) => tm.id === val);
                            setTaskBet(activeTask.id, spectator.id, {
                              targetContestantId: isTeam ? undefined : val,
                              targetTeamId: isTeam ? val : undefined,
                              rewardPoints: currentBet?.rewardPoints || 2,
                              notes: currentBet?.notes,
                            });
                          }
                        }}
                        className="bg-stone-900 text-stone-200 text-xs px-2.5 py-1.5 rounded-lg border border-stone-700 font-semibold focus:outline-none focus:border-tm-gold cursor-pointer"
                      >
                        <option value="">-- Choose Winner --</option>
                        <optgroup label="Active Contestants">
                          {activeContestants.map((ac) => (
                            <option key={ac.id} value={ac.id}>
                              {ac.avatar} {ac.name}
                            </option>
                          ))}
                        </optgroup>
                        {activeTask.type === 'team' && (
                          <optgroup label="Teams">
                            {teams.map((tm) => (
                              <option key={tm.id} value={tm.id}>
                                {tm.avatar} {tm.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {/* Reward Points */}
                    <div className="flex items-center gap-1 bg-stone-900 px-2 py-1 rounded-lg border border-stone-700">
                      <span className="text-[10px] text-stone-400 font-bold uppercase">WIN PTS:</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={currentBet?.rewardPoints ?? 2}
                        onChange={(e) => {
                          if (currentBet) {
                            setTaskBet(activeTask.id, spectator.id, {
                              ...currentBet,
                              rewardPoints: Number(e.target.value),
                            });
                          }
                        }}
                        className="w-8 bg-transparent text-stone-100 font-mono font-bold text-xs text-center focus:outline-none"
                      />
                    </div>

                    {/* Banter Note */}
                    <div className="flex-1 min-w-[150px]">
                      <input
                        type="text"
                        placeholder="Banter or prediction reasoning..."
                        value={currentBet?.notes || ''}
                        onChange={(e) => {
                          if (currentBet) {
                            setTaskBet(activeTask.id, spectator.id, {
                              ...currentBet,
                              notes: e.target.value,
                            });
                          }
                        }}
                        className="w-full bg-stone-900 text-stone-300 text-xs px-2.5 py-1.5 rounded-lg border border-stone-800 placeholder:text-stone-600 focus:outline-none focus:border-tm-gold"
                      />
                    </div>
                  </div>

                  {/* Outcome Status Badge */}
                  <div className="flex items-center gap-2">
                    {isResolved ? (
                      hasWon ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
                          WON (+{currentBet.rewardPoints} PTS)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-400 font-semibold text-xs border border-stone-700">
                          LOST (0 PTS)
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-stone-500 italic">
                        {currentBet?.targetContestantId || currentBet?.targetTeamId ? 'Bet Active' : 'No Bet Placed'}
                      </span>
                    )}

                    {currentBet && (
                      <button
                        onClick={() => removeTaskBet(activeTask.id, spectator.id)}
                        className="p-1 text-stone-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Clear bet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

