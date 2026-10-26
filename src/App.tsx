import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw, HelpCircle, Bot, Users } from 'lucide-react';
import {
  initialGameState,
  playMove,
  GameState,
  Player,
} from './game/connect4';
import { getAIMove, AIDifficulty } from './game/ai';
import { Connect4Board } from './components/Connect4Board';
import { ScoreBoard } from './components/ScoreBoard';

export function App() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [scores, setScores] = useState({ player1: 0, player2: 0, draws: 0 });
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('pvp');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('Hard');
  const [isAIThinking, setIsAIThinking] = useState(false);

  const makeMoveAt = (col: number) => {
    setGameState((prevState) => {
      if (prevState.status !== 'playing') return prevState;

      const nextState = playMove(prevState, col);
      if (nextState === prevState) return prevState;

      if (nextState.status === 'won' && nextState.winner) {
        setScores((prev) => ({
          ...prev,
          [nextState.winner === 1 ? 'player1' : 'player2']:
            prev[nextState.winner === 1 ? 'player1' : 'player2'] + 1,
        }));
      } else if (nextState.status === 'draw') {
        setScores((prev) => ({
          ...prev,
          draws: prev.draws + 1,
        }));
      }

      return nextState;
    });
  };

  const handleDropPiece = (col: number) => {
    if (gameState.status !== 'playing') return;
    if (isAIThinking || (gameMode === 'ai' && gameState.currentPlayer === 2)) return;
    makeMoveAt(col);
  };

  // AI move automation
  useEffect(() => {
    if (
      gameMode !== 'ai' ||
      gameState.currentPlayer !== 2 ||
      gameState.status !== 'playing'
    ) {
      return;
    }

    setIsAIThinking(true);
    const timer = setTimeout(() => {
      const bestCol = getAIMove(gameState.board, 2, difficulty);
      if (bestCol !== -1) {
        makeMoveAt(bestCol);
      }
      setIsAIThinking(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [gameState.currentPlayer, gameState.status, gameState.board, gameMode, difficulty]);

  const handleResetGame = () => {
    setGameState(initialGameState());
    setHoveredCol(null);
    setIsAIThinking(false);
  };

  const handleResetScores = () => {
    setScores({ player1: 0, player2: 0, draws: 0 });
    handleResetGame();
  };

  const handleModeChange = (mode: 'pvp' | 'ai') => {
    setGameMode(mode);
    setGameState(initialGameState());
    setHoveredCol(null);
    setIsAIThinking(false);
  };

  const isGameOver = gameState.status !== 'playing';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="w-full max-w-xl flex flex-col items-center text-center mt-2 mb-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-3">
          Connect 4
        </h1>

        {/* Game Setup Area */}
        <section
          aria-label="Game Setup"
          data-testid="game-setup"
          className="w-full flex flex-col items-center gap-2 mb-3"
        >
          {/* Game Mode Selector */}
          <div
            data-testid="mode-selector"
            aria-label="Game Mode"
            className="flex flex-wrap items-center justify-center gap-2 mb-1"
          >
            <button
              type="button"
              aria-pressed={gameMode === 'pvp'}
              data-testid="mode-local-multiplayer"
              onClick={() => handleModeChange('pvp')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                gameMode === 'pvp'
                  ? 'bg-blue-950/80 border border-blue-500 text-blue-300 shadow-sm shadow-blue-500/20 ring-1 ring-blue-500/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span data-testid="mode-pvp">Local Multiplayer</span>
            </button>
            <button
              type="button"
              aria-pressed={gameMode === 'ai'}
              data-testid="mode-single-player"
              onClick={() => handleModeChange('ai')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-purple-950/80 border border-purple-500 text-purple-300 shadow-sm shadow-purple-500/20 ring-1 ring-purple-500/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span data-testid="mode-ai">Single Player</span>
            </button>
          </div>

          {/* AI Difficulty Selector */}
          {gameMode === 'ai' && (
            <div
              data-testid="difficulty-selector"
              aria-label="AI Difficulty"
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-lg text-xs"
            >
              <span className="text-slate-400 font-medium mr-1">Difficulty:</span>
              {(['Easy', 'Medium', 'Hard'] as const).map((lvl) => {
                const isSelected = difficulty.toLowerCase() === lvl.toLowerCase();
                return (
                  <button
                    key={lvl}
                    type="button"
                    aria-pressed={isSelected}
                    data-testid={`difficulty-${lvl.toLowerCase()}`}
                    onClick={() => setDifficulty(lvl)}
                    className={`px-2.5 py-0.5 rounded capitalize transition-all cursor-pointer font-medium ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span data-testid={`difficulty-${lvl}`}>{lvl}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-xl flex flex-col items-center flex-1 justify-center">
        {/* Score Board */}
        <ScoreBoard
          scores={scores}
          currentPlayer={gameState.currentPlayer}
          winner={gameState.winner}
          status={gameState.status}
        />

        {/* Status Announcement Banner */}
        <div
          data-testid="status-message"
          role="status"
          aria-live="polite"
          className={`w-full max-w-lg mb-4 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-base sm:text-lg transition-all shadow-md ${
            gameState.status === 'won'
              ? gameState.winner === 1
                ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                : 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
              : gameState.status === 'draw'
              ? 'bg-slate-800 text-slate-300 border border-slate-700'
              : 'bg-slate-900/80 text-slate-200 border border-slate-800'
          }`}
        >
          {gameState.status === 'won' && (
            <>
              <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />
              <span>
                Player {gameState.winner} ({gameState.winner === 1 ? 'Red' : 'Yellow'}) Wins!
              </span>
            </>
          )}

          {gameState.status === 'draw' && (
            <>
              <HelpCircle className="w-5 h-5 text-slate-400" />
              <span>It&apos;s a Draw! Board is full.</span>
            </>
          )}

          {gameState.status === 'playing' && (
            <div className="flex items-center gap-2" data-testid="current-turn">
              <span
                className={`w-3.5 h-3.5 rounded-full inline-block animate-pulse ${
                  gameState.currentPlayer === 1
                    ? 'bg-red-500 shadow-sm shadow-red-500'
                    : 'bg-amber-400 shadow-sm shadow-amber-400'
                }`}
              />
              <span>
                {isAIThinking || (gameMode === 'ai' && gameState.currentPlayer === 2)
                  ? 'AI is thinking...'
                  : `Player ${gameState.currentPlayer}'s Turn (${
                      gameState.currentPlayer === 1 ? 'Red' : 'Yellow'
                    })`}
              </span>
            </div>
          )}
        </div>

        {/* 7x6 Connect 4 Board */}
        <Connect4Board
          board={gameState.board}
          currentPlayer={gameState.currentPlayer}
          isGameOver={
            isGameOver ||
            isAIThinking ||
            (gameMode === 'ai' && gameState.currentPlayer === 2)
          }
          winningCells={gameState.winningCells}
          onDropPiece={handleDropPiece}
          hoveredCol={hoveredCol}
          setHoveredCol={setHoveredCol}
        />

        {/* Controls */}
        <div className="w-full max-w-lg mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            data-testid="reset-button"
            onClick={handleResetGame}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer hover:shadow-blue-600/40"
          >
            <RotateCcw className="w-4 h-4" />
            {isGameOver ? 'Play Again' : 'Reset Game'}
          </button>

          {(scores.player1 > 0 || scores.player2 > 0 || scores.draws > 0) && (
            <button
              type="button"
              data-testid="reset-scores-button"
              onClick={handleResetScores}
              className="text-xs text-slate-300 hover:text-slate-100 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Reset Scores
            </button>
          )}
        </div>
      </main>

      {/* Footer Instructions */}
      <footer className="w-full max-w-xl text-center text-xs text-slate-300 mt-6 pb-2">
        Click any column or the arrow buttons above to drop a disc. Connect 4 in a line (horizontal, vertical, or diagonal) to win!
      </footer>
    </div>
  );
}

