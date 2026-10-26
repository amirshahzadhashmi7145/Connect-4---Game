import { describe, it, expect, vi } from 'vitest';
import {
  createEmptyBoard,
  dropPiece,
  playMove,
  initialGameState,
  Board,
  ROWS,
  COLS,
} from './connect4';
import {
  getAIMove,
  findBestMove,
  findImmediateWin,
  checkWinFromLastMove,
  evaluateBoard,
  getValidMoves,
  makeMove,
  undoMove,
  normalizeDifficulty,
} from './ai';

describe('Connect 4 AI Logic', () => {
  describe('Helper functions', () => {
    it('normalizes difficulty strings correctly', () => {
      expect(normalizeDifficulty('easy')).toBe('easy');
      expect(normalizeDifficulty('Easy')).toBe('easy');
      expect(normalizeDifficulty('medium')).toBe('medium');
      expect(normalizeDifficulty('Medium')).toBe('medium');
      expect(normalizeDifficulty('hard')).toBe('hard');
      expect(normalizeDifficulty('Hard')).toBe('hard');
      // @ts-expect-error test fallback
      expect(normalizeDifficulty('unknown')).toBe('hard');
    });

    it('identifies valid moves correctly and filters full columns', () => {
      let board = createEmptyBoard();
      expect(getValidMoves(board)).toEqual([3, 2, 4, 1, 5, 0, 6]);

      // Fill column 3
      for (let i = 0; i < ROWS; i++) {
        board = dropPiece(board, 3, 1)!.nextBoard;
      }
      expect(getValidMoves(board)).toEqual([2, 4, 1, 5, 0, 6]);
      expect(getValidMoves(board).includes(3)).toBe(false);
    });

    it('mutates and undoes moves accurately', () => {
      const board = createEmptyBoard();
      const row = makeMove(board, 2, 1);
      expect(row).toBe(5);
      expect(board[5][2]).toBe(1);

      const row2 = makeMove(board, 2, 2);
      expect(row2).toBe(4);
      expect(board[4][2]).toBe(2);

      undoMove(board, row2, 2);
      expect(board[4][2]).toBeNull();
      undoMove(board, row, 2);
      expect(board[5][2]).toBeNull();
    });

    it('correctly detects win from last move for all orientations', () => {
      const board = createEmptyBoard();

      // Horizontal
      board[5][0] = 1;
      board[5][1] = 1;
      board[5][2] = 1;
      board[5][3] = 1;
      expect(checkWinFromLastMove(board, 5, 3)).toBe(true);
      expect(checkWinFromLastMove(board, 5, 0)).toBe(true);
      expect(checkWinFromLastMove(board, 5, 1)).toBe(true);
      expect(checkWinFromLastMove(board, 5, 2)).toBe(true);

      // Vertical
      const vBoard = createEmptyBoard();
      vBoard[5][2] = 2;
      vBoard[4][2] = 2;
      vBoard[3][2] = 2;
      vBoard[2][2] = 2;
      expect(checkWinFromLastMove(vBoard, 2, 2)).toBe(true);

      // Diagonal down-right
      const d1Board = createEmptyBoard();
      d1Board[2][0] = 1;
      d1Board[3][1] = 1;
      d1Board[4][2] = 1;
      d1Board[5][3] = 1;
      expect(checkWinFromLastMove(d1Board, 5, 3)).toBe(true);
      expect(checkWinFromLastMove(d1Board, 3, 1)).toBe(true);

      // Diagonal up-right
      const d2Board = createEmptyBoard();
      d2Board[5][0] = 2;
      d2Board[4][1] = 2;
      d2Board[3][2] = 2;
      d2Board[2][3] = 2;
      expect(checkWinFromLastMove(d2Board, 2, 3)).toBe(true);
      expect(checkWinFromLastMove(d2Board, 4, 1)).toBe(true);
    });

    it('evaluates board higher for player with center control and connected discs', () => {
      const board = createEmptyBoard();
      board[5][3] = 1;
      board[4][3] = 1;
      board[5][2] = 1;

      const p1Score = evaluateBoard(board, 1);
      const p2Score = evaluateBoard(board, 2);
      expect(p1Score).toBeGreaterThan(0);
      expect(p2Score).toBeLessThan(0);
    });
  });

  describe('Edge cases and boundaries', () => {
    it('returns -1 when board is full', () => {
      const fullBoard: Board = Array.from({ length: ROWS }, () =>
        Array(COLS).fill(1)
      );
      expect(getAIMove(fullBoard, 1, 'easy')).toBe(-1);
      expect(getAIMove(fullBoard, 1, 'medium')).toBe(-1);
      expect(getAIMove(fullBoard, 1, 'hard')).toBe(-1);
    });

    it('returns the only available column if 6 columns are full', () => {
      let board = createEmptyBoard();
      // Fill columns 0, 1, 2, 3, 5, 6 (leaving column 4 with space)
      for (let c = 0; c < COLS; c++) {
        if (c === 4) continue;
        for (let r = 0; r < ROWS; r++) {
          board = dropPiece(board, c, (r % 2 === 0 ? 1 : 2))!.nextBoard;
        }
      }
      expect(getAIMove(board, 1, 'easy')).toBe(4);
      expect(getAIMove(board, 1, 'medium')).toBe(4);
      expect(getAIMove(board, 1, 'hard')).toBe(4);
    });

    it('findBestMove is an alias for getAIMove', () => {
      expect(findBestMove).toBe(getAIMove);
    });
  });

  describe('Easy Difficulty', () => {
    it('always selects a valid non-full column', () => {
      let board = createEmptyBoard();
      // Fill columns 0 and 1 completely
      for (let r = 0; r < ROWS; r++) {
        board = dropPiece(board, 0, 1)!.nextBoard;
        board = dropPiece(board, 1, 2)!.nextBoard;
      }

      for (let i = 0; i < 50; i++) {
        const move = getAIMove(board, 2, 'easy');
        expect(move).toBeGreaterThanOrEqual(2);
        expect(move).toBeLessThanOrEqual(6);
        expect(board[0][move]).toBeNull();
      }
    });

    it('picks randomly among valid columns', () => {
      const board = createEmptyBoard();
      const picked = new Set<number>();
      for (let i = 0; i < 100; i++) {
        picked.add(getAIMove(board, 1, 'easy'));
      }
      // With 100 trials over 7 columns, multiple different columns should be picked
      expect(picked.size).toBeGreaterThan(1);
    });
  });

  describe('Medium Difficulty', () => {
    it('always picks a valid column', () => {
      const board = createEmptyBoard();
      const move = getAIMove(board, 1, 'medium');
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThanOrEqual(6);
    });

    it('takes an immediate horizontal win', () => {
      let board = createEmptyBoard();
      // AI is Player 2. AI has 3 in a row at row 5 (cols 1, 2, 3)
      board = dropPiece(board, 1, 2)!.nextBoard;
      board = dropPiece(board, 2, 2)!.nextBoard;
      board = dropPiece(board, 3, 2)!.nextBoard;

      // Col 0 or Col 4 would win
      const move = getAIMove(board, 2, 'medium');
      expect([0, 4]).toContain(move);
    });

    it('blocks an immediate vertical threat', () => {
      let board = createEmptyBoard();
      // Opponent is Player 1. Opponent has 3 stacked in col 3.
      board = dropPiece(board, 3, 1)!.nextBoard; // row 5
      board = dropPiece(board, 3, 1)!.nextBoard; // row 4
      board = dropPiece(board, 3, 1)!.nextBoard; // row 3

      // AI is Player 2. Must block at col 3 (row 2)
      const move = getAIMove(board, 2, 'medium');
      expect(move).toBe(3);
    });

    it('blocks an immediate horizontal threat', () => {
      let board = createEmptyBoard();
      // Opponent is Player 1. Opponent has [5, 2], [5, 3], [5, 4]
      board = dropPiece(board, 2, 1)!.nextBoard;
      board = dropPiece(board, 3, 1)!.nextBoard;
      board = dropPiece(board, 4, 1)!.nextBoard;

      // AI is Player 2. Must block at col 1 or 5
      const move = getAIMove(board, 2, 'medium');
      expect([1, 5]).toContain(move);
    });
  });

  describe('Hard Difficulty - Minimax with Alpha-Beta', () => {
    it('takes immediate horizontal win', () => {
      let board = createEmptyBoard();
      // AI is Player 1. AI has [5, 0], [5, 1], [5, 2]
      board = dropPiece(board, 0, 1)!.nextBoard;
      board = dropPiece(board, 1, 1)!.nextBoard;
      board = dropPiece(board, 2, 1)!.nextBoard;

      const move = getAIMove(board, 1, 'hard');
      expect(move).toBe(3);
    });

    it('takes immediate vertical win', () => {
      let board = createEmptyBoard();
      // AI is Player 2. AI has [5, 4], [4, 4], [3, 4]
      board = dropPiece(board, 4, 2)!.nextBoard;
      board = dropPiece(board, 4, 2)!.nextBoard;
      board = dropPiece(board, 4, 2)!.nextBoard;

      const move = getAIMove(board, 2, 'hard');
      expect(move).toBe(4);
    });

    it('takes immediate diagonal win', () => {
      let board = createEmptyBoard();
      // Setup diagonal for AI (Player 1): [5, 0], [4, 1], [3, 2], [2, 3] (up-right)
      board[5][0] = 1; // P1
      board[5][1] = 2; // P2
      board[4][1] = 1; // P1
      board[5][2] = 2; // P2
      board[4][2] = 2; // P2
      board[3][2] = 1; // P1
      board[5][3] = 2; // P2
      board[4][3] = 2; // P2
      board[3][3] = 2; // P2
      // Dropping in col 3 places at [2, 3], winning!

      const move = getAIMove(board, 1, 'hard');
      expect(move).toBe(3);
    });

    it('takes immediate diagonal win in down-right direction', () => {
      const board = createEmptyBoard();
      // Setup diagonal for AI (Player 2): [2, 0], [3, 1], [4, 2], [5, 3]
      // Support for col 0: [5, 0], [4, 0], [3, 0] all filled, [2, 0] empty
      board[5][0] = 1;
      board[4][0] = 1;
      board[3][0] = 1;

      // Col 1: [5, 1], [4, 1] filled, [3, 1] is P2
      board[5][1] = 1;
      board[4][1] = 1;
      board[3][1] = 2;

      // Col 2: [5, 2] filled, [4, 2] is P2
      board[5][2] = 1;
      board[4][2] = 2;

      // Col 3: [5, 3] is P2
      board[5][3] = 2;

      // Now AI (Player 2) dropping in col 0 places at [2, 0] and wins!
      const move = getAIMove(board, 2, 'hard');
      expect(move).toBe(0);
    });

    it('blocks immediate horizontal threat from opponent', () => {
      let board = createEmptyBoard();
      // Opponent (Player 1) has [5, 0], [5, 1], [5, 2]
      board = dropPiece(board, 0, 1)!.nextBoard;
      board = dropPiece(board, 1, 1)!.nextBoard;
      board = dropPiece(board, 2, 1)!.nextBoard;

      // AI is Player 2. Must block at col 3
      const move = getAIMove(board, 2, 'hard');
      expect(move).toBe(3);
    });

    it('blocks immediate vertical threat from opponent', () => {
      let board = createEmptyBoard();
      // Opponent (Player 2) has [5, 5], [4, 5], [3, 5]
      board = dropPiece(board, 5, 2)!.nextBoard;
      board = dropPiece(board, 5, 2)!.nextBoard;
      board = dropPiece(board, 5, 2)!.nextBoard;

      // AI is Player 1. Must block at col 5
      const move = getAIMove(board, 1, 'hard');
      expect(move).toBe(5);
    });

    it('blocks immediate diagonal threat from opponent', () => {
      const board = createEmptyBoard();
      // Opponent (Player 1) has diagonal threat: [5, 0], [4, 1], [3, 2]
      // and col 3 has support up to row 3: [5, 3], [4, 3], [3, 3]
      board[5][0] = 1; // P1
      board[5][1] = 2; // P2
      board[4][1] = 1; // P1
      board[5][2] = 2; // P2
      board[4][2] = 2; // P2
      board[3][2] = 1; // P1
      board[5][3] = 2; // P2
      board[4][3] = 2; // P2
      board[3][3] = 2; // P2
      // If Opponent plays col 3, they get [2, 3] and win!
      // AI (Player 2) must block by playing col 3!

      const move = getAIMove(board, 2, 'hard');
      expect(move).toBe(3);
    });

    it('blocks immediate diagonal threat in down-right direction', () => {
      const board = createEmptyBoard();
      // Opponent (Player 2) has diagonal threat: [2, 0], [3, 1], [4, 2]
      // Support for col 3: [5, 3] is empty, which would complete [5, 3]
      board[5][0] = 1;
      board[4][0] = 1;
      board[3][0] = 1;
      board[2][0] = 2; // P2

      board[5][1] = 1;
      board[4][1] = 1;
      board[3][1] = 2; // P2

      board[5][2] = 1;
      board[4][2] = 2; // P2

      // [5, 3] is empty at bottom of col 3. If P2 plays col 3, lands at [5, 3] and wins!
      // AI (Player 1) must block by playing col 3!
      const move = getAIMove(board, 1, 'hard');
      expect(move).toBe(3);
    });

    it('prefers center column on open board', () => {
      const board = createEmptyBoard();
      // On empty board, center column 3 is mathematically optimal
      const move = getAIMove(board, 1, 'hard');
      expect(move).toBe(3);
    });

    it('avoids move that immediately hands a win to opponent', () => {
      let board = createEmptyBoard();
      // Row 5 has alternating pieces:
      // [5, 0] = P1, [5, 1] = P2, [5, 2] = P1 (no one has a win on row 5)
      // Row 4 has opponent (Player 2) in col 0, 1, 2:
      // [4, 0] = P2, [4, 1] = P2, [4, 2] = P2
      // Col 3 is completely empty.
      board = dropPiece(board, 0, 1)!.nextBoard; // [5, 0] P1
      board = dropPiece(board, 0, 2)!.nextBoard; // [4, 0] P2
      board = dropPiece(board, 1, 2)!.nextBoard; // [5, 1] P2
      board = dropPiece(board, 1, 2)!.nextBoard; // [4, 1] P2
      board = dropPiece(board, 2, 1)!.nextBoard; // [5, 2] P1
      board = dropPiece(board, 2, 2)!.nextBoard; // [4, 2] P2

      // If AI (Player 1) plays col 3, AI's piece lands at [5, 3] (not a win).
      // But now [4, 3] is supported, allowing opponent (Player 2) to play col 3 next turn
      // and complete [4, 0]-[4, 3] to WIN!
      // Therefore, Hard AI must NOT play col 3!
      const move = getAIMove(board, 1, 'hard');
      expect(move).not.toBe(3);
    });

    it('executes search quickly (< 100ms)', () => {
      const board = createEmptyBoard();
      const startTime = performance.now();
      const move = getAIMove(board, 1, 'hard');
      const duration = performance.now() - startTime;

      expect(move).toBeDefined();
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Integration with game simulation', () => {
    it('plays an entire game between AI Easy and AI Hard to completion without errors', () => {
      let state = initialGameState();
      let turns = 0;
      const maxTurns = 42;

      while (state.status === 'playing' && turns < maxTurns) {
        const move =
          state.currentPlayer === 1
            ? getAIMove(state.board, 1, 'hard')
            : getAIMove(state.board, 2, 'easy');

        expect(move).toBeGreaterThanOrEqual(0);
        expect(move).toBeLessThanOrEqual(6);

        state = playMove(state, move);
        turns++;
      }

      expect(['won', 'draw']).toContain(state.status);
    });
  });
});
