import React from 'react';
import { ArrowDown } from 'lucide-react';
import { Board, Player, COLS, ROWS, isValidMove, getLowestEmptyRow } from '../game/connect4';

interface Connect4BoardProps {
  board: Board;
  currentPlayer: Player;
  isGameOver: boolean;
  winningCells: [number, number][];
  onDropPiece: (col: number) => void;
  hoveredCol: number | null;
  setHoveredCol: (col: number | null) => void;
}

export const Connect4Board: React.FC<Connect4BoardProps> = ({
  board,
  currentPlayer,
  isGameOver,
  winningCells,
  onDropPiece,
  hoveredCol,
  setHoveredCol,
}) => {
  const isWinningCell = (r: number, c: number) => {
    return winningCells.some(([winR, winC]) => winR === r && winC === c);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Column Drop Buttons Header */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 w-full px-4 mb-2">
        {Array.from({ length: COLS }).map((_, colIdx) => {
          const canDrop = !isGameOver && isValidMove(board, colIdx);
          const isHovered = hoveredCol === colIdx && canDrop;

          return (
            <button
              key={colIdx}
              type="button"
              data-testid={`column-button-${colIdx}`}
              aria-label={`Drop piece in column ${colIdx + 1}${canDrop ? '' : ' (full)'}`}
              disabled={!canDrop}
              onClick={() => onDropPiece(colIdx)}
              onMouseEnter={() => setHoveredCol(colIdx)}
              onMouseLeave={() => setHoveredCol(null)}
              onFocus={() => setHoveredCol(colIdx)}
              onBlur={() => setHoveredCol(null)}
              className={`h-10 sm:h-12 flex items-center justify-center rounded-lg transition-all duration-150 ${
                canDrop
                  ? 'cursor-pointer hover:bg-slate-700/50 active:scale-95 text-slate-300 hover:text-white'
                  : 'cursor-not-allowed opacity-30 text-slate-600'
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform ${
                  isHovered
                    ? currentPlayer === 1
                      ? 'bg-red-500 text-white shadow-md shadow-red-500/50 scale-110'
                      : 'bg-amber-400 text-slate-900 shadow-md shadow-amber-400/50 scale-110'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <ArrowDown className={`w-4 h-4 transition-transform ${isHovered ? 'translate-y-0.5' : ''}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Connect 4 Blue Cabinet Frame */}
      <div
        data-testid="connect4-board"
        role="grid"
        aria-label="Connect 4 Board"
        className="w-full bg-blue-700 p-3 sm:p-4 rounded-3xl shadow-2xl border-4 border-blue-800 shadow-blue-950/60"
      >
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {Array.from({ length: COLS }).map((_, colIdx) => {
            const canDrop = !isGameOver && isValidMove(board, colIdx);
            const previewRow = isGameOver ? -1 : getLowestEmptyRow(board, colIdx);

            return (
              <div
                key={colIdx}
                className="flex flex-col gap-2 sm:gap-3 cursor-pointer group"
                onClick={() => canDrop && onDropPiece(colIdx)}
                onMouseEnter={() => setHoveredCol(colIdx)}
                onMouseLeave={() => setHoveredCol(null)}
              >
                {Array.from({ length: ROWS }).map((_, rowIdx) => {
                  const cell = board[rowIdx][colIdx];
                  const winning = isWinningCell(rowIdx, colIdx);
                  const isGhostCell =
                    !isGameOver &&
                    hoveredCol === colIdx &&
                    rowIdx === previewRow &&
                    cell === null;

                  return (
                    <div
                      key={rowIdx}
                      data-testid={`cell-${rowIdx}-${colIdx}`}
                      data-player={cell ?? undefined}
                      data-winning={winning ? 'true' : undefined}
                      className="aspect-square relative rounded-full bg-blue-900 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] flex items-center justify-center p-1 sm:p-1.5"
                    >
                      {/* Placed Disc */}
                      {cell !== null && (
                        <div
                          className={`w-full h-full rounded-full transition-transform duration-200 transform scale-100 ${
                            cell === 1
                              ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-inner shadow-red-300/40 border-2 border-red-700'
                              : 'bg-gradient-to-br from-yellow-300 to-amber-500 shadow-inner shadow-yellow-100/60 border-2 border-amber-600'
                          } ${
                            winning
                              ? 'ring-4 ring-white shadow-[0_0_15px_rgba(255,255,255,0.9)] animate-pulse'
                              : ''
                          }`}
                        >
                          {/* Inner concentric ring for authentic Connect 4 disc look */}
                          <div
                            className={`w-1/2 h-1/2 mx-auto mt-[25%] rounded-full border border-black/20 ${
                              cell === 1 ? 'bg-red-600/30' : 'bg-amber-600/30'
                            }`}
                          />
                        </div>
                      )}

                      {/* Hover preview ghost piece */}
                      {cell === null && isGhostCell && (
                        <div
                          className={`w-full h-full rounded-full opacity-40 border-2 border-dashed ${
                            currentPlayer === 1
                              ? 'bg-red-500 border-red-300'
                              : 'bg-amber-400 border-amber-200'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Board Stand / Base */}
      <div className="w-full max-w-sm flex justify-between px-6 -mt-1 pointer-events-none">
        <div className="w-8 h-4 bg-blue-800 rounded-b-lg shadow-md" />
        <div className="w-8 h-4 bg-blue-800 rounded-b-lg shadow-md" />
      </div>
    </div>
  );
};
