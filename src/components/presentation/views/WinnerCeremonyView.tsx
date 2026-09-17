import React, { useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import { Trophy, Crown, Sparkles, Award } from 'lucide-react';

export const WinnerCeremonyView: React.FC = () => {
  const { seriesTotals, state, triggerConfetti } = useGame();

  useEffect(() => {
    // Automatically trigger initial celebration confetti
    triggerConfetti();
    const timer = setTimeout(() => {
      triggerConfetti();
    }, 1500);
    return () => clearTimeout(timer);
  }, [triggerConfetti]);

  const winner = seriesTotals[0];
  const second = seriesTotals[1];
  const third = seriesTotals[2];

  if (!winner) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 font-serif text-2xl">
        No contestants found.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 z-10 w-full max-w-5xl mx-auto text-center relative">
      {/* Golden Head Trophy Silhouette / Icon */}
      <div className="relative mb-6">
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 p-1 shadow-gold-lg animate-pulse flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-stone-950 flex flex-col items-center justify-center">
            <Trophy className="w-14 h-14 md:w-18 md:h-18 text-tm-goldBright" />
          </div>
        </div>
        <div className="absolute -top-3 -right-2 bg-tm-red text-white p-2 rounded-full shadow-lg border border-tm-gold">
          <Crown className="w-6 h-6 text-tm-goldBright" />
        </div>
      </div>

      {/* Series Champion Title */}
      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs md:text-sm font-bold uppercase tracking-widest">
          <Sparkles className="w-4 h-4" />
          Champion of {state.seriesTitle}
        </div>
        <h1 className="font-serif font-black text-4xl md:text-6xl lg:text-7xl text-stone-100 tracking-tight leading-tight">
          {winner.contestant.name}
        </h1>
        <p className="text-tm-gold text-xl md:text-2xl font-bold font-mono tracking-wider">
          {winner.seriesScore} Total Points
        </p>
      </div>

      {/* The Podium: 2nd, 1st, 3rd */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 items-end w-full max-w-2xl pt-4">
        {/* 2nd Place */}
        {second && (
          <div className="flex flex-col items-center">
            <div
              className="w-14 h-14 md:w-18 md:h-18 rounded-full flex items-center justify-center text-2xl font-bold shadow-md ring-2 ring-slate-400 mb-2"
              style={{ backgroundColor: second.contestant.colorHex }}
            >
              {second.contestant.avatar}
            </div>
            <span className="font-bold text-stone-200 text-sm md:text-base truncate max-w-[100px] md:max-w-[140px]">
              {second.contestant.name}
            </span>
            <span className="font-mono text-xs md:text-sm text-stone-400">
              {second.seriesScore} pts
            </span>
            <div className="w-full bg-slate-700/60 border-t-4 border-slate-400 rounded-t-xl h-24 md:h-32 flex flex-col items-center justify-center mt-2 shadow-lg">
              <span className="font-serif font-black text-2xl md:text-3xl text-slate-300">
                2nd
              </span>
            </div>
          </div>
        )}

        {/* 1st Place (Winner Center) */}
        <div className="flex flex-col items-center transform -translate-y-4">
          <Crown className="w-8 h-8 text-tm-goldBright animate-bounce mb-1" />
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-4xl font-bold shadow-gold-lg ring-4 ring-tm-goldBright mb-2"
            style={{ backgroundColor: winner.contestant.colorHex }}
          >
            {winner.contestant.avatar}
          </div>
          <span className="font-bold text-stone-100 text-base md:text-lg">
            {winner.contestant.name}
          </span>
          <span className="font-mono text-sm md:text-base text-tm-goldBright font-black">
            {winner.seriesScore} pts
          </span>
          <div className="w-full bg-amber-600/40 border-t-4 border-tm-goldBright rounded-t-xl h-36 md:h-48 flex flex-col items-center justify-center mt-2 shadow-gold">
            <span className="font-serif font-black text-3xl md:text-4xl text-tm-goldBright">
              1st
            </span>
            <Award className="w-6 h-6 text-tm-gold mt-1" />
          </div>
        </div>

        {/* 3rd Place */}
        {third && (
          <div className="flex flex-col items-center">
            <div
              className="w-14 h-14 md:w-18 md:h-18 rounded-full flex items-center justify-center text-2xl font-bold shadow-md ring-2 ring-amber-700 mb-2"
              style={{ backgroundColor: third.contestant.colorHex }}
            >
              {third.contestant.avatar}
            </div>
            <span className="font-bold text-stone-200 text-sm md:text-base truncate max-w-[100px] md:max-w-[140px]">
              {third.contestant.name}
            </span>
            <span className="font-mono text-xs md:text-sm text-stone-400">
              {third.seriesScore} pts
            </span>
            <div className="w-full bg-amber-950/60 border-t-4 border-amber-700 rounded-t-xl h-16 md:h-24 flex flex-col items-center justify-center mt-2 shadow-lg">
              <span className="font-serif font-black text-xl md:text-2xl text-amber-600">
                3rd
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Re-trigger Confetti Button */}
      <div className="mt-8">
        <button
          onClick={triggerConfetti}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tm-red hover:bg-tm-redBright text-white font-bold text-sm shadow-gold transition-transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-tm-goldLight" />
          Celebrate Again (Confetti)
        </button>
      </div>
    </div>
  );
};
