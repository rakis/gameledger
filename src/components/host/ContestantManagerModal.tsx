import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { X, Plus, Trash2, ArrowUpDown, ChevronUp, ChevronDown, Users, Palette, Check } from 'lucide-react';

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
  const [activeCustomizerId, setActiveCustomizerId] = useState<string | null>(null);
  const [isAddColorPickerOpen, setIsAddColorPickerOpen] = useState(false);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addContestant(newName.trim(), newColor, newAvatar);
    setNewName('');
    setIsAddColorPickerOpen(false);
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
      <div className="bg-stone-900 border border-stone-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden space-y-5 flex-1">
          {/* Quick Actions toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-stone-400 font-medium">
              Contestants sit in seat order (1 to {state.contestants.length})
            </span>
            <button
              onClick={sortAlphabetically}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-tm-gold font-bold transition-colors cursor-pointer"
              title="Sort alphabetical by first name, as on the TV show"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Alphabetical (TV Order)</span>
            </button>
          </div>

          {/* Current Contestants List */}
          <div className="space-y-3">
            {state.contestants.map((c, index) => {
              const isCustomizing = activeCustomizerId === c.id;

              return (
                <div
                  key={c.id}
                  className={`p-3 rounded-xl bg-stone-950/70 border transition-all ${
                    isCustomizing
                      ? 'border-tm-gold/60 shadow-md ring-1 ring-tm-gold/30'
                      : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                    {/* Left: Identity & Reordering */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Reorder buttons (constant width, disabled when at top/bottom) */}
                      <div className="flex flex-col items-center justify-center flex-shrink-0">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => reorderContestants(index, index - 1)}
                          className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-20 disabled:hover:text-stone-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Move seat up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === state.contestants.length - 1}
                          onClick={() => reorderContestants(index, index + 1)}
                          className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-20 disabled:hover:text-stone-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Move seat down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Seat Number */}
                      <span className="w-6 text-center text-xs font-mono font-bold text-stone-500 flex-shrink-0">
                        #{index + 1}
                      </span>

                      {/* Interactive Avatar button */}
                      <button
                        type="button"
                        onClick={() => setActiveCustomizerId(isCustomizing ? null : c.id)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-md ring-2 ring-white/10 hover:ring-tm-gold/80 transition-all flex-shrink-0 relative group cursor-pointer"
                        style={{ backgroundColor: c.colorHex }}
                        title="Click to customize color & avatar"
                      >
                        <span>{c.avatar}</span>
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Palette className="w-2.5 h-2.5 text-tm-gold" />
                        </span>
                      </button>

                      {/* Name Input (min-w-0 flex-1 allows text input to shrink and fill naturally) */}
                      <input
                        type="text"
                        value={c.name}
                        placeholder="Contestant name"
                        onChange={(e) => updateContestant(c.id, { name: e.target.value })}
                        className="flex-1 min-w-0 bg-transparent text-stone-100 font-bold text-sm sm:text-base focus:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-tm-gold px-2.5 py-1 rounded border border-transparent focus:border-tm-gold/40 transition-colors"
                      />
                    </div>

                    {/* Right: Controls (Team, Appearance toggle, Emoji quick-select, Delete) */}
                    <div className="flex items-center gap-2 flex-shrink-0 justify-end sm:justify-start pl-8 sm:pl-0 pt-1 sm:pt-0 border-t border-stone-800/40 sm:border-t-0">
                      {/* Team selector */}
                      <select
                        value={c.teamId || ''}
                        onChange={(e) =>
                          updateContestant(c.id, {
                            teamId: (e.target.value as 'A' | 'B') || null,
                          })
                        }
                        className="bg-stone-900 hover:bg-stone-850 text-stone-300 text-xs px-2.5 py-1.5 rounded-lg border border-stone-800 font-semibold focus:outline-none focus:border-tm-gold cursor-pointer transition-colors"
                        title="Assign team"
                      >
                        <option value="">Solo</option>
                        <option value="A">Team A</option>
                        <option value="B">Team B</option>
                      </select>

                      {/* Appearance customizer toggle button */}
                      <button
                        type="button"
                        onClick={() => setActiveCustomizerId(isCustomizing ? null : c.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          isCustomizing
                            ? 'bg-tm-gold/20 border-tm-gold text-tm-goldBright'
                            : 'bg-stone-900 hover:bg-stone-800 border-stone-800 text-stone-300 hover:text-white'
                        }`}
                        title="Customize contestant color & avatar"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                          style={{ backgroundColor: c.colorHex }}
                        />
                        <Palette className="w-3.5 h-3.5 flex-shrink-0" />
                      </button>

                      {/* Quick Emoji selector dropdown */}
                      <select
                        value={c.avatar}
                        onChange={(e) => updateContestant(c.id, { avatar: e.target.value })}
                        className="bg-stone-900 hover:bg-stone-850 text-base px-2 py-1 rounded-lg border border-stone-800 cursor-pointer focus:outline-none focus:border-tm-gold transition-colors"
                        title="Quick avatar emoji"
                      >
                        {EMOJI_PRESETS.map((emoji) => (
                          <option key={emoji} value={emoji}>
                            {emoji}
                          </option>
                        ))}
                      </select>

                      {/* Delete button (fixed width, disabled with tooltip when <= 2 contestants) */}
                      <button
                        type="button"
                        disabled={state.contestants.length <= 2}
                        onClick={() => removeContestant(c.id)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-950/40 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-500 transition-colors flex-shrink-0 cursor-pointer"
                        title={state.contestants.length <= 2 ? 'At least 2 contestants are required' : 'Remove contestant'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Appearance Drawer */}
                  {isCustomizing && (
                    <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-3 animate-fade-in bg-stone-900/40 -mx-3 -mb-3 p-3 rounded-b-xl">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-tm-gold" />
                            <span>Contestant Color Palette</span>
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono">
                            {c.colorHex}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {PALETTE.map((color) => {
                            const isSelected = c.colorHex.toLowerCase() === color.toLowerCase();
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => updateContestant(c.id, { colorHex: color })}
                                className={`w-7 h-7 rounded-full transition-all relative flex items-center justify-center cursor-pointer ${
                                  isSelected
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-stone-950 scale-110 shadow-md'
                                    : 'opacity-75 hover:opacity-100 hover:scale-105'
                                }`}
                                style={{ backgroundColor: color }}
                                title={color}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-white filter drop-shadow" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold block mb-1.5">
                          Contestant Avatar Emoji
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {EMOJI_PRESETS.map((emoji) => {
                            const isSelected = c.avatar === emoji;
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => updateContestant(c.id, { avatar: emoji })}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-tm-gold/20 border border-tm-gold text-white scale-105 shadow-sm'
                                    : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
                                }`}
                              >
                                {emoji}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add New Contestant Form */}
          <div className="p-4 rounded-xl bg-stone-950/50 border border-dashed border-stone-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-tm-gold" />
                <span>Add New Contestant</span>
              </span>
              {isAddColorPickerOpen && (
                <span className="text-[11px] text-tm-gold font-medium">Select color below</span>
              )}
            </div>

            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Preview Avatar button (toggles color palette) */}
              <button
                type="button"
                onClick={() => setIsAddColorPickerOpen(!isAddColorPickerOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-md ring-2 ring-white/10 hover:ring-tm-gold transition-all flex-shrink-0 cursor-pointer relative group self-center sm:self-auto"
                style={{ backgroundColor: newColor }}
                title="Click to choose color"
              >
                <span>{newAvatar}</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Palette className="w-2.5 h-2.5 text-tm-gold" />
                </span>
              </button>

              <input
                type="text"
                placeholder="New Contestant Name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 min-w-0 bg-stone-900 text-stone-100 text-sm font-semibold px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-tm-gold"
              />

              {/* Emoji choice */}
              <select
                value={newAvatar}
                onChange={(e) => setNewAvatar(e.target.value)}
                className="bg-stone-900 hover:bg-stone-850 text-base px-2.5 py-2 rounded-lg border border-stone-700 cursor-pointer focus:outline-none focus:border-tm-gold self-center sm:self-auto"
                title="Select avatar emoji"
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
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-tm-red hover:bg-tm-redBright disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Add Player</span>
              </button>
            </form>

            {/* Add Player Color Picker Drawer */}
            {isAddColorPickerOpen && (
              <div className="pt-2 border-t border-stone-800 space-y-2 animate-fade-in">
                <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold block">
                  Choose Color for New Contestant
                </span>
                <div className="flex flex-wrap gap-2">
                  {PALETTE.map((color) => {
                    const isSelected = newColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setNewColor(color);
                          setIsAddColorPickerOpen(false);
                        }}
                        className={`w-7 h-7 rounded-full transition-all relative flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-stone-950 scale-110 shadow-md'
                            : 'opacity-75 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white filter drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-tm-gold hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
