import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { TaskType, SubTask, SubtaskScoringMode } from '../../types';
import { X, Plus, Clock, Award, Users, Timer, ShieldAlert, Sparkles, Layers, Trash2 } from 'lucide-react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PresetIdea {
  title: string;
  brief: string;
  type: TaskType;
  isTimed: boolean;
  timeLimitSeconds?: number;
  hasSubtasks?: boolean;
  subtasks?: { title: string; brief?: string }[];
}

const PRESET_IDEAS: PresetIdea[] = [
  {
    title: 'Prize Task: Most Magnificent Item',
    brief: 'Bring in the most magnificent item. Most magnificent item wins. You have until the studio recording.',
    type: 'prize' as TaskType,
    isTimed: false,
  },
  {
    title: 'Fastest Wins: Teabag in a Mug',
    brief: 'Get a teabag into a mug from the furthest distance. You may not move the mug. Furthest distance wins. You have 10 minutes. Your time starts now.',
    type: 'filmed' as TaskType,
    isTimed: true,
    timeLimitSeconds: 600,
  },
  {
    title: 'Team Task: The Silent Relay',
    brief: 'Communicate the secret word to your teammate without making any audible sound or mouthing words. Fastest team wins. Your time starts now.',
    type: 'team' as TaskType,
    isTimed: true,
    timeLimitSeconds: 300,
  },
  {
    title: 'Multi-Part: The Grand Triathlon',
    brief: 'Complete all three stages. Best overall performance across all stages wins. Your time starts now.',
    type: 'filmed' as TaskType,
    isTimed: false,
    hasSubtasks: true,
    subtasks: [
      { title: 'Part 1: The Egg Sprint', brief: 'Carry the egg from A to B without touching it with your hands.' },
      { title: 'Part 2: The Silent Limerick', brief: 'Write a five-line limerick without making any audible sound.' },
      { title: 'Part 3: The Blind Pour', brief: 'Pour exactly 330ml of water into the jug while blindfolded.' },
    ],
  },
  {
    title: 'Live Studio Task: Balance Endurance',
    brief: 'Stand on one leg with a balloon balanced on your head. Last person standing wins 5 points.',
    type: 'studio' as TaskType,
    isTimed: false,
  },
  {
    title: 'Tie-Break: Closest Number',
    brief: 'Write down the number of raisins in this jar without opening it. Closest guess wins.',
    type: 'tiebreak' as TaskType,
    isTimed: false,
  },
];

interface SubtaskDraft {
  title: string;
  brief: string;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose }) => {
  const { addTask } = useGame();

  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [type, setType] = useState<TaskType>('filmed');
  const [isTimed, setIsTimed] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(5);

  // Subtask configuration
  const [hasSubtasks, setHasSubtasks] = useState(false);
  const [subtaskScoringMode, setSubtaskScoringMode] = useState<SubtaskScoringMode>('sum');
  const [subtaskList, setSubtaskList] = useState<SubtaskDraft[]>([
    { title: 'Part 1', brief: '' },
    { title: 'Part 2', brief: '' },
  ]);

  if (!isOpen) return null;

  const updateSubtaskItem = (index: number, field: 'title' | 'brief', value: string) => {
    const updated = [...subtaskList];
    updated[index] = { ...updated[index], [field]: value };
    setSubtaskList(updated);
  };

  const removeSubtaskItem = (index: number) => {
    if (subtaskList.length <= 1) return;
    setSubtaskList(subtaskList.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const generatedSubtasks: SubTask[] | undefined =
      hasSubtasks && subtaskList.length > 0
        ? subtaskList.map((st, idx) => ({
            id: 'sub_' + Date.now() + '_' + idx,
            title: st.title.trim() || `Part ${idx + 1}`,
            brief: st.brief.trim() || `Instructions for Part ${idx + 1}. Your time starts now.`,
            isTimed: false,
            scores: {},
            orderIndex: idx,
          }))
        : undefined;

    addTask({
      title: title.trim(),
      brief: brief.trim() || 'All the information is on the task. Your time starts now.',
      type,
      isTimed,
      timeLimitSeconds: isTimed ? timeLimitMinutes * 60 : undefined,
      subtasks: generatedSubtasks,
      subtaskScoringMode: hasSubtasks ? subtaskScoringMode : undefined,
    });

    onClose();
    // Reset form
    setTitle('');
    setBrief('');
    setType('filmed');
    setIsTimed(false);
    setHasSubtasks(false);
    setSubtaskScoringMode('sum');
    setSubtaskList([
      { title: 'Part 1', brief: '' },
      { title: 'Part 2', brief: '' },
    ]);
  };

  const applyPreset = (preset: PresetIdea) => {
    setTitle(preset.title);
    setBrief(preset.brief);
    setType(preset.type);
    setIsTimed(preset.isTimed);
    if (preset.timeLimitSeconds) {
      setTimeLimitMinutes(Math.floor(preset.timeLimitSeconds / 60));
    }
    if (preset.hasSubtasks && preset.subtasks) {
      setHasSubtasks(true);
      setSubtaskList(
        preset.subtasks.map((st, idx) => ({
          title: st.title || `Part ${idx + 1}`,
          brief: st.brief || '',
        }))
      );
    } else {
      setHasSubtasks(false);
      setSubtaskList([
        { title: 'Part 1', brief: '' },
        { title: 'Part 2', brief: '' },
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <Plus className="w-5 h-5 text-tm-gold" />
            <h2 className="font-serif font-bold text-xl text-stone-100">
              Create New Task
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-tm-gold" />
              Quick Task Inspiration / Templates:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_IDEAS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 hover:border-tm-gold transition-colors text-left"
                >
                  {p.title.split(':')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Paint a self-portrait on a piece of toast"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-stone-950 text-stone-100 px-3.5 py-2.5 rounded-xl border border-stone-700 focus:outline-none focus:border-tm-gold text-sm font-semibold"
            />
          </div>

          {/* Task Type selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
              Task Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'filmed', label: 'Filmed Task', icon: Clock },
                { id: 'prize', label: 'Prize Task', icon: Award },
                { id: 'team', label: 'Team Task', icon: Users },
                { id: 'studio', label: 'Studio Task', icon: Timer },
                { id: 'tiebreak', label: 'Tie-Break', icon: ShieldAlert },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = type === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setType(cat.id as TaskType)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-tm-red/30 border-tm-red text-white shadow-sm font-bold'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-tm-gold' : ''}`} />
                    <span className="text-xs">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task Brief (What's written on the task envelope) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
              Task Brief (Read from the wax-sealed envelope)
            </label>
            <textarea
              rows={4}
              placeholder="What are the rules and instructions? (e.g. 'All the information is on the task. Your time starts now.')"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="w-full bg-stone-950 text-stone-100 px-3.5 py-2.5 rounded-xl border border-stone-700 focus:outline-none focus:border-tm-gold text-sm font-mono leading-relaxed"
            />
          </div>

          {/* Multi-Part / Sub-Tasks Section */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-tm-gold" />
                <div>
                  <span className="text-sm font-bold text-stone-200 block">
                    Multi-Part Challenge (Sub-Tasks)
                  </span>
                  <span className="text-xs text-stone-400">
                    Break this task into multiple stages (Part 1, Part 2, etc.)
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSubtasks}
                  onChange={(e) => setHasSubtasks(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tm-red"></div>
              </label>
            </div>

            {hasSubtasks && (
              <div className="space-y-3 pt-3 border-t border-stone-800/80 animate-fade-in">
                {/* Scoring Rollup Mode */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                  <label className="text-xs font-bold text-stone-300">
                    Scoring Rollup:
                  </label>
                  <select
                    value={subtaskScoringMode}
                    onChange={(e) => setSubtaskScoringMode(e.target.value as SubtaskScoringMode)}
                    className="bg-stone-950 text-stone-200 text-xs px-2.5 py-1.5 rounded-lg border border-stone-700 focus:outline-none focus:border-tm-gold font-semibold cursor-pointer"
                  >
                    <option value="sum">Sum of Parts (Accumulate all points)</option>
                    <option value="final_rank">Final Ranking (5 to 1 points based on total)</option>
                    <option value="custom">Manual Rollup (Score master task manually)</option>
                  </select>
                </div>

                {/* Subtask list */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                    Task Stages / Parts:
                  </label>
                  {subtaskList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[11px] font-mono font-bold text-tm-gold uppercase px-2 py-0.5 rounded bg-stone-900 border border-stone-800">
                            Part {idx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder={`Part ${idx + 1} Title`}
                            value={item.title}
                            onChange={(e) => updateSubtaskItem(idx, 'title', e.target.value)}
                            className="flex-1 bg-stone-900 text-stone-100 text-xs px-3 py-1.5 rounded-lg border border-stone-700 focus:outline-none focus:border-tm-gold font-semibold"
                          />
                        </div>
                        {subtaskList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubtaskItem(idx)}
                            className="p-1.5 text-stone-500 hover:text-red-400 rounded-lg hover:bg-stone-900 transition-colors cursor-pointer"
                            title="Remove part"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder={`Instructions for Part ${idx + 1} (optional)`}
                        value={item.brief}
                        onChange={(e) => updateSubtaskItem(idx, 'brief', e.target.value)}
                        className="w-full bg-stone-900 text-stone-300 text-xs font-typewriter px-3 py-1.5 rounded-lg border border-stone-800 focus:outline-none focus:border-tm-gold"
                      />
                    </div>
                  ))}
                </div>

                {/* Add Part button */}
                <button
                  type="button"
                  onClick={() =>
                    setSubtaskList([
                      ...subtaskList,
                      { title: `Part ${subtaskList.length + 1}`, brief: '' },
                    ])
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-dashed border-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-tm-gold" />
                  <span>Add Another Part</span>
                </button>
              </div>
            )}
          </div>

          {/* Timer Settings */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-tm-gold" />
              <div>
                <span className="text-sm font-bold text-stone-200 block">
                  Enable Countdown Timer
                </span>
                <span className="text-xs text-stone-400">
                  Shows live countdown clock on the stage screen
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTimed}
                  onChange={(e) => setIsTimed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tm-red"></div>
              </label>

              {isTimed && (
                <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1 rounded-lg border border-stone-700">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-12 bg-transparent text-stone-100 font-bold text-center focus:outline-none"
                  />
                  <span className="text-xs text-stone-400">mins</span>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-6 py-2.5 rounded-xl bg-tm-red hover:bg-tm-redBright disabled:opacity-50 text-white font-bold text-sm shadow-gold transition-transform hover:scale-105"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
