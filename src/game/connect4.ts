export const ROWS = 6;
export const COLS = 7;

export type Player = 1 | 2;
export type Cell = Player | null;
export type Board = Cell[][];

export interface WinResult {
  winner: Player;
  winningCells: [number, number][];
}

export type GameStatus = 'playing' | 'won' | 'draw';

export interface GameState {
  board: Board;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  winningCells: [number, number][];
  movesCount: number;
}

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function getLowestEmptyRow(board: Board, col: number): number {
  if (col < 0 || col >= COLS) return -1;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      return row;
    }
  }
  return -1;
}

export function isValidMove(board: Board, col: number): boolean {
  if (col < 0 || col >= COLS) return false;
  return board[0][col] === null;
}

export function checkWin(board: Board): WinResult | null {
  // Check horizontal (row, col to col+3)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (
        p !== null &&
        p === board[r][c + 1] &&
        p === board[r][c + 2] &&
        p === board[r][c + 3]
      ) {
        return {
          winner: p,
          winningCells: [
            [r, c],
            [r, c + 1],
            [r, c + 2],
            [r, c + 3],
          ],
        };
      }
    }
  }

  // Check vertical (row to row+3, col)
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const p = board[r][c];
      if (
        p !== null &&
        p === board[r + 1][c] &&
        p === board[r + 2][c] &&
        p === board[r + 3][c]
      ) {
        return {
          winner: p,
          winningCells: [
            [r, c],
            [r + 1, c],
            [r + 2, c],
            [r + 3, c],
          ],
        };
      }
    }
  }

  // Check diagonal down-right (r to r+3, c to c+3)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (
        p !== null &&
        p === board[r + 1][c + 1] &&
        p === board[r + 2][c + 2] &&
        p === board[r + 3][c + 3]
      ) {
        return {
          winner: p,
          winningCells: [
            [r, c],
            [r + 1, c + 1],
            [r + 2, c + 2],
            [r + 3, c + 3],
          ],
        };
      }
    }
  }

  // Check diagonal up-right (r to r-3, c to c+3)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (
        p !== null &&
        p === board[r - 1][c + 1] &&
        p === board[r - 2][c + 2] &&
        p === board[r - 3][c + 3]
      ) {
        return {
          winner: p,
          winningCells: [
            [r, c],
            [r - 1, c + 1],
            [r - 2, c + 2],
            [r - 3, c + 3],
          ],
        };
      }
    }
  }

  return null;
}

export function isBoardFull(board: Board): boolean {
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) {
      return false;
    }
  }
  return true;
}

export function dropPiece(
  board: Board,
  col: number,
  player: Player
): { nextBoard: Board; row: number } | null {
  const row = getLowestEmptyRow(board, col);
  if (row === -1) return null;

  const nextBoard = board.map((r, rIdx) => {
    if (rIdx !== row) return [...r];
    const newRow = [...r];
    newRow[col] = player;
    return newRow;
  });

  return { nextBoard, row };
}

export function initialGameState(): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: 1,
    status: 'playing',
    winner: null,
    winningCells: [],
    movesCount: 0,
  };
}

export function playMove(state: GameState, col: number): GameState {
  if (state.status !== 'playing') {
    return state;
  }

  const dropResult = dropPiece(state.board, col, state.currentPlayer);
  if (!dropResult) {
    return state;
  }

  const { nextBoard } = dropResult;
  const win = checkWin(nextBoard);

  if (win) {
    return {
      ...state,
      board: nextBoard,
      status: 'won',
      winner: win.winner,
      winningCells: win.winningCells,
      movesCount: state.movesCount + 1,
    };
  }

  if (isBoardFull(nextBoard)) {
    return {
      ...state,
      board: nextBoard,
      status: 'draw',
      winner: null,
      winningCells: [],
      movesCount: state.movesCount + 1,
    };
  }

  return {
    ...state,
    board: nextBoard,
    currentPlayer: state.currentPlayer === 1 ? 2 : 1,
    movesCount: state.movesCount + 1,
  };
}
