import { describe, it, expect } from 'vitest';
import {
  createEmptyBoard,
  getLowestEmptyRow,
  isValidMove,
  dropPiece,
  checkWin,
  isBoardFull,
  initialGameState,
  playMove,
  ROWS,
  COLS,
  Board,
} from './connect4';

describe('Connect 4 Core Logic', () => {
  it('initializes a 7x6 empty board', () => {
    const board = createEmptyBoard();
    expect(board.length).toBe(ROWS);
    expect(board[0].length).toBe(COLS);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        expect(board[r][c]).toBeNull();
      }
    }
  });

  it('drops a piece to the lowest empty row (gravity)', () => {
    const board = createEmptyBoard();
    expect(getLowestEmptyRow(board, 3)).toBe(5);

    const res1 = dropPiece(board, 3, 1);
    expect(res1).not.toBeNull();
    expect(res1!.row).toBe(5);
    expect(res1!.nextBoard[5][3]).toBe(1);

    const res2 = dropPiece(res1!.nextBoard, 3, 2);
    expect(res2).not.toBeNull();
    expect(res2!.row).toBe(4);
    expect(res2!.nextBoard[4][3]).toBe(2);
    expect(res2!.nextBoard[5][3]).toBe(1);
  });

  it('rejects moves in a full column', () => {
    let board = createEmptyBoard();
    for (let i = 0; i < ROWS; i++) {
      const res = dropPiece(board, 0, (i % 2 === 0 ? 1 : 2));
      expect(res).not.toBeNull();
      board = res!.nextBoard;
    }
    expect(isValidMove(board, 0)).toBe(false);
    expect(getLowestEmptyRow(board, 0)).toBe(-1);
    expect(dropPiece(board, 0, 1)).toBeNull();
  });

  it('alternates turns between Player 1 and Player 2', () => {
    let state = initialGameState();
    expect(state.currentPlayer).toBe(1);

    state = playMove(state, 0);
    expect(state.board[5][0]).toBe(1);
    expect(state.currentPlayer).toBe(2);

    state = playMove(state, 1);
    expect(state.board[5][1]).toBe(2);
    expect(state.currentPlayer).toBe(1);
  });

  it('detects a horizontal win', () => {
    let state = initialGameState();
    // P1: col 0, P2: col 0
    // P1: col 1, P2: col 1
    // P1: col 2, P2: col 2
    // P1: col 3 -> P1 wins horizontally at row 5!
    state = playMove(state, 0); // P1 at [5, 0]
    state = playMove(state, 0); // P2 at [4, 0]
    state = playMove(state, 1); // P1 at [5, 1]
    state = playMove(state, 1); // P2 at [4, 1]
    state = playMove(state, 2); // P1 at [5, 2]
    state = playMove(state, 2); // P2 at [4, 2]
    state = playMove(state, 3); // P1 at [5, 3]

    expect(state.status).toBe('won');
    expect(state.winner).toBe(1);
    expect(state.winningCells).toEqual([
      [5, 0],
      [5, 1],
      [5, 2],
      [5, 3],
    ]);
  });

  it('detects a vertical win', () => {
    let state = initialGameState();
    // P1: col 0, P2: col 1
    // P1: col 0, P2: col 1
    // P1: col 0, P2: col 1
    // P1: col 0 -> P1 wins vertically in col 0 (rows 5, 4, 3, 2)
    state = playMove(state, 0); // P1
    state = playMove(state, 1); // P2
    state = playMove(state, 0); // P1
    state = playMove(state, 1); // P2
    state = playMove(state, 0); // P1
    state = playMove(state, 1); // P2
    state = playMove(state, 0); // P1

    expect(state.status).toBe('won');
    expect(state.winner).toBe(1);
    expect(state.winningCells).toEqual([
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
    ]);
  });

  it('detects a diagonal win (down-right / negative slope)', () => {
    let state = initialGameState();
    // We want P1 to win diagonally from [2, 0] to [5, 3] or [2, 3] to [5, 0]
    // Let's build diagonal: [2, 0], [3, 1], [4, 2], [5, 3]
    // Col 0 needs 4 pieces (row 5, 4, 3, 2)
    // Col 1 needs 3 pieces (row 5, 4, 3)
    // Col 2 needs 2 pieces (row 5, 4)
    // Col 3 needs 1 piece (row 5)
    //
    // Col 3: P1 at [5, 3]
    // Col 2: P2 at [5, 2], P1 at [4, 2]
    // Col 1: P2 at [5, 1], P2 at [4, 1], P1 at [3, 1]
    // Col 0: P2 at [5, 0], P2 at [4, 0], P2 at [3, 0], P1 at [2, 0]
    state = playMove(state, 3); // P1: [5, 3]
    state = playMove(state, 2); // P2: [5, 2]
    state = playMove(state, 2); // P1: [4, 2]
    state = playMove(state, 1); // P2: [5, 1]
    state = playMove(state, 0); // P1: [5, 0]
    state = playMove(state, 1); // P2: [4, 1]
    state = playMove(state, 1); // P1: [3, 1]
    state = playMove(state, 0); // P2: [4, 0]
    state = playMove(state, 0); // P1: [3, 0] - wait, we want P1 at [2, 0]
    state = playMove(state, 6); // P2: throwaway [5, 6]
    state = playMove(state, 0); // P1: [2, 0]

    expect(state.status).toBe('won');
    expect(state.winner).toBe(1);
    expect(state.winningCells).toEqual([
      [2, 0],
      [3, 1],
      [4, 2],
      [5, 3],
    ]);
  });

  it('detects a diagonal win (up-right / positive slope)', () => {
    let state = initialGameState();
    // Diagonal: [5, 0], [4, 1], [3, 2], [2, 3]
    // Col 0: P1 at [5, 0]
    // Col 1: P2 at [5, 1], P1 at [4, 1]
    // Col 2: P2 at [5, 2], P1 at [4, 2], P2 at [3, 2]? Wait, we want P1 at [3, 2]
    // Col 3: P2 at [5, 3], P2 at [4, 3], P2 at [3, 3], P1 at [2, 3]
    state = playMove(state, 0); // P1: [5, 0]
    state = playMove(state, 1); // P2: [5, 1]
    state = playMove(state, 1); // P1: [4, 1]
    state = playMove(state, 2); // P2: [5, 2]
    state = playMove(state, 6); // P1: throwaway
    state = playMove(state, 2); // P2: [4, 2]
    state = playMove(state, 2); // P1: [3, 2]
    state = playMove(state, 3); // P2: [5, 3]
    state = playMove(state, 6); // P1: throwaway
    state = playMove(state, 3); // P2: [4, 3]
    state = playMove(state, 6); // P1: throwaway
    state = playMove(state, 3); // P2: [3, 3]
    state = playMove(state, 3); // P1: [2, 3]

    expect(state.status).toBe('won');
    expect(state.winner).toBe(1);
    expect(state.winningCells).toEqual([
      [5, 0],
      [4, 1],
      [3, 2],
      [2, 3],
    ]);
  });

  it('simulates a complete 42-move game ending in a draw', () => {
    const drawMoves = [
      0, 0, 0, 0, 0, 0,
      1, 1, 1, 1, 1, 1,
      4, 2, 2, 2, 2, 2, 2,
      3, 3, 3, 3, 3, 3,
      4, 4, 4, 4, 4,
      5, 5, 5, 5, 5,
      6, 6, 6, 6, 6, 6,
      5,
    ];

    let state = initialGameState();

    for (let i = 0; i < drawMoves.length; i++) {
      state = playMove(state, drawMoves[i]);
      if (i < 41) {
        expect(state.status).toBe('playing');
      }
    }

    expect(state.status).toBe('draw');
    expect(state.winner).toBeNull();
    expect(state.movesCount).toBe(42);
    expect(isBoardFull(state.board)).toBe(true);
  });

  it('ignores moves after the game has ended', () => {
    let state = initialGameState();
    // Make 4 in a row
    for (let c = 0; c < 4; c++) {
      state = playMove(state, c); // P1
      if (c < 3) state = playMove(state, c); // P2
    }
    expect(state.status).toBe('won');
    const boardBefore = state.board;

    // Further move should not change state
    const afterState = playMove(state, 5);
    expect(afterState.board).toEqual(boardBefore);
    expect(afterState.status).toBe('won');
  });
});
