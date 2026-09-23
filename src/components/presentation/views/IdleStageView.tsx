import React from 'react';
import { useGame } from '../../../context/GameContext';
import { Crown, Sparkles } from 'lucide-react';

export const IdleStageView: React.FC = () => {
  const { state, activeEpisode } = useGame();

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute w-96 h-96 bg-tm-red/20 rounded-full blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-96 h-96 bg-tm-gold/15 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

      {/* Wax Seal Centerpiece */}
      <div className="relative mb-8 group">
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-full wax-seal flex items-center justify-center cursor-default transform hover:scale-105 transition-transform duration-500">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-dashed border-tm-redBright/40 flex flex-col items-center justify-center text-center p-2">
            <Crown className="w-8 h-8 md:w-10 md:h-10 text-tm-goldLight mb-1 filter drop-shadow" />
            <span className="font-serif font-black text-2xl md:text-3xl text-tm-goldLight tracking-wider">
              TM
            </span>
          </div>
        </div>
      </div>

      {/* Series & Episode Titles */}
      <div className="max-w-4xl w-full z-10 space-y-3 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tm-card border border-tm-cardBorder text-tm-gold text-sm md:text-base tracking-wider uppercase font-semibold">
          <Sparkles className="w-4 h-4 text-tm-goldBright" />
          <span>{state.seriesTitle}</span>
        </div>

        <h1 className="font-serif font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-stone-100 tracking-tight leading-tight drop-shadow-md break-words">
          {activeEpisode?.title || 'GameLedger Stage'}
        </h1>

        <p className="text-stone-400 text-lg md:text-xl font-light italic max-w-xl mx-auto pt-2">
          "All the information is on the task."
        </p>

        {/* Contestants sitting in the row */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-4">
          {state.contestants.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-tm-card/80 border border-tm-cardBorder backdrop-blur-sm shadow-md"
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-base font-bold shadow-inner"
                style={{ backgroundColor: c.colorHex, color: '#ffffff' }}
              >
                {c.avatar}
              </span>
              <span className="font-medium text-stone-200 text-sm md:text-base">
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
