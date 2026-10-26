import React from 'react';
import { Player } from '../game/connect4';

interface ScoreBoardProps {
  scores: { player1: number; player2: number; draws: number };
  currentPlayer: Player;
  winner: Player | null;
  status: 'playing' | 'won' | 'draw';
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  scores,
  currentPlayer,
  winner,
  status,
}) => {
  const isP1Active = status === 'playing' ? currentPlayer === 1 : winner === 1;
  const isP2Active = status === 'playing' ? currentPlayer === 2 : winner === 2;

  return (
    <div className="w-full max-w-lg mx-auto mb-6">
      <div className="grid grid-cols-3 gap-3">
        {/* Player 1 Card */}
        <div
          data-testid="player1-card"
          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
            isP1Active
              ? 'bg-red-500/10 border-red-500 shadow-md shadow-red-500/10'
              : 'bg-slate-800/40 border-slate-700/60'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 inline-block shadow-sm shadow-red-400" />
            <span className="font-semibold text-sm text-slate-100">Player 1</span>
          </div>
          <span className="text-2xl font-black text-red-400">{scores.player1}</span>
          <span className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">
            Red
          </span>
        </div>

        {/* Draws Card */}
        <div
          data-testid="draws-card"
          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
            status === 'draw'
              ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
              : 'bg-slate-800/40 border-slate-700/60'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-slate-300 text-xs font-semibold">Ties</span>
          </div>
          <span className="text-2xl font-black text-slate-200">{scores.draws}</span>
          <span className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">
            Draws
          </span>
        </div>

        {/* Player 2 Card */}
        <div
          data-testid="player2-card"
          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
            isP2Active
              ? 'bg-amber-400/10 border-amber-400 shadow-md shadow-amber-400/10'
              : 'bg-slate-800/40 border-slate-700/60'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-300" />
            <span className="font-semibold text-sm text-slate-100">Player 2</span>
          </div>
          <span className="text-2xl font-black text-amber-400">{scores.player2}</span>
          <span className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">
            Yellow
          </span>
        </div>
      </div>
    </div>
  );
};
