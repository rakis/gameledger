import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { X, Plus, Trash2, ArrowUpDown, ChevronUp, ChevronDown, Users } from 'lucide-react';

interface ContestantManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PALETTE = [
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
];

const EMOJI_PRESETS = ['🦊', '🦆', '🦉', '🐯', '🦔', '🦄', '🐝', '🦁', '👑', '🎩', '🚀', '⭐', '🎈', '🍕', '🏆'];

export const ContestantManagerModal: React.FC<ContestantManagerModalProps> = ({ isOpen, onClose }) => {
  const { state, addContestant, updateContestant, removeContestant, reorderContestants } = useGame();
  
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [newAvatar, setNewAvatar] = useState(EMOJI_PRESETS[0]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addContestant(newName.trim(), newColor, newAvatar);
    setNewName('');
    // Cycle to next color & emoji
    const nextIdx = (state.contestants.length + 1) % PALETTE.length;
    setNewColor(PALETTE[nextIdx]);
    setNewAvatar(EMOJI_PRESETS[nextIdx % EMOJI_PRESETS.length]);
  };

  // Sort contestants alphabetically by first name (Taskmaster TV tradition!)
  const sortAlphabetically = () => {
    const sorted = [...state.contestants].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach((c, idx) => {
      updateContestant(c.id, { seatIndex: idx });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Modal Box */}
      <div className="bg-stone-900 border border-stone-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-tm-gold" />
            <h2 className="font-serif font-bold text-xl text-stone-100">
              Contestant Roster & Seating
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Actions toolbar */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-stone-400 font-medium">
              Contestants sit in seat order (1 to {state.contestants.length})
            </span>
            <button
              onClick={sortAlphabetically}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-tm-gold font-bold transition-colors"
              title="Sort alphabetical by first name, as on the TV show"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Alphabetical (TV Order)
            </button>
          </div>

          {/* Current Contestants List */}
          <div className="space-y-3">
            {state.contestants.map((c, index) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-stone-700 transition-colors"
              >
                {/* Seat badge & avatar */}
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-mono font-bold text-stone-500">
                    #{index + 1}
                  </span>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-md cursor-pointer ring-2 ring-white/10"
                    style={{ backgroundColor: c.colorHex }}
                    title="Contestant Avatar"
                  >
                    {c.avatar}
                  </div>

                  {/* Name Input */}
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateContestant(c.id, { name: e.target.value })}
                    className="bg-transparent text-stone-100 font-bold text-base focus:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-tm-gold px-2 py-1 rounded"
                  />
                </div>

                {/* Team & Color controls */}
                <div className="flex items-center gap-2">
                  {/* Team selector */}
                  <select
                    value={c.teamId || ''}
                    onChange={(e) =>
                      updateContestant(c.id, {
                        teamId: (e.target.value as 'A' | 'B') || null,
                      })
                    }
                    className="bg-stone-900 text-stone-300 text-xs px-2 py-1 rounded border border-stone-800 font-semibold focus:outline-none"
                  >
                    <option value="">No Team</option>
                    <option value="A">Team A</option>
                    <option value="B">Team B</option>
                  </select>

                  {/* Color picker dropdown */}
                  <div className="flex items-center gap-1">
                    {PALETTE.slice(0, 5).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateContestant(c.id, { colorHex: color })}
                        className={`w-5 h-5 rounded-full transition-transform ${
                          c.colorHex === color ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Emoji selector dropdown */}
                  <select
                    value={c.avatar}
                    onChange={(e) => updateContestant(c.id, { avatar: e.target.value })}
                    className="bg-stone-900 text-base px-1.5 py-0.5 rounded border border-stone-800 cursor-pointer"
                  >
                    {EMOJI_PRESETS.map((emoji) => (
                      <option key={emoji} value={emoji}>
                        {emoji}
                      </option>
                    ))}
                  </select>

                  {/* Reorder buttons */}
                  <div className="flex items-center">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => reorderContestants(index, index - 1)}
                        className="p-1 text-stone-500 hover:text-stone-300"
                        title="Move seat up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {index < state.contestants.length - 1 && (
                      <button
                        type="button"
                        onClick={() => reorderContestants(index, index + 1)}
                        className="p-1 text-stone-500 hover:text-stone-300"
                        title="Move seat down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Delete button (minimum 2 contestants) */}
                  {state.contestants.length > 2 && (
                    <button
                      onClick={() => removeContestant(c.id)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                      title="Remove contestant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add New Contestant Form */}
          <form
            onSubmit={handleAdd}
            className="p-4 rounded-xl bg-stone-950/50 border border-dashed border-stone-700 flex flex-wrap items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-md ring-2 ring-white/10"
              style={{ backgroundColor: newColor }}
            >
              {newAvatar}
            </div>

            <input
              type="text"
              placeholder="New Contestant Name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 min-w-[160px] bg-stone-900 text-stone-100 text-sm font-semibold px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-tm-gold"
            />

            {/* Emoji choice */}
            <select
              value={newAvatar}
              onChange={(e) => setNewAvatar(e.target.value)}
              className="bg-stone-900 text-base px-2 py-1.5 rounded-lg border border-stone-700"
            >
              {EMOJI_PRESETS.map((emoji) => (
                <option key={emoji} value={emoji}>
                  {emoji}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={!newName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-tm-red hover:bg-tm-redBright disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-tm-gold hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
