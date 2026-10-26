import { Board, Cell, Player, ROWS, COLS } from './connect4';

export type AIDifficulty =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'Easy'
  | 'Medium'
  | 'Hard';

export const MOVE_ORDER = [3, 2, 4, 1, 5, 0, 6];

/**
 * Returns all column indices that are not full, ordered from center outwards.
 */
export function getValidMoves(board: Board, moveOrder: number[] = MOVE_ORDER): number[] {
  return moveOrder.filter((col) => col >= 0 && col < COLS && board[0][col] === null);
}

/**
 * Checks if dropping a piece at (row, col) created 4-in-a-row for the player.
 */
export function checkWinFromLastMove(
  board: Board,
  row: number,
  col: number
): boolean {
  const p = board[row][col];
  if (p === null) return false;

  // 1. Horizontal
  let count = 1;
  let c = col - 1;
  while (c >= 0 && board[row][c] === p) {
    count++;
    c--;
  }
  c = col + 1;
  while (c < COLS && board[row][c] === p) {
    count++;
    c++;
  }
  if (count >= 4) return true;

  // 2. Vertical (only downwards because gravity fills upwards)
  count = 1;
  let r = row + 1;
  while (r < ROWS && board[r][col] === p) {
    count++;
    r++;
  }
  if (count >= 4) return true;

  // 3. Diagonal down-right (\)
  count = 1;
  r = row - 1;
  c = col - 1;
  while (r >= 0 && c >= 0 && board[r][c] === p) {
    count++;
    r--;
    c--;
  }
  r = row + 1;
  c = col + 1;
  while (r < ROWS && c < COLS && board[r][c] === p) {
    count++;
    r++;
    c++;
  }
  if (count >= 4) return true;

  // 4. Diagonal up-right (/)
  count = 1;
  r = row + 1;
  c = col - 1;
  while (r < ROWS && c >= 0 && board[r][c] === p) {
    count++;
    r++;
    c--;
  }
  r = row - 1;
  c = col + 1;
  while (r >= 0 && c < COLS && board[r][c] === p) {
    count++;
    r--;
    c++;
  }
  return count >= 4;
}

/**
 * Mutates board by placing piece at lowest empty row in col.
 * Returns the row index, or -1 if column is full.
 */
export function makeMove(board: Board, col: number, player: Player): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      board[r][col] = player;
      return r;
    }
  }
  return -1;
}

/**
 * Undoes a move by clearing the cell.
 */
export function undoMove(board: Board, row: number, col: number): void {
  board[row][col] = null;
}

/**
 * Evaluates a 4-cell window for the AI player.
 */
function evaluateWindow(
  c1: Cell,
  c2: Cell,
  c3: Cell,
  c4: Cell,
  aiPlayer: Player,
  opponent: Player
): number {
  let aiCount = 0;
  let oppCount = 0;
  let emptyCount = 0;

  const cells = [c1, c2, c3, c4];
  for (let i = 0; i < 4; i++) {
    const val = cells[i];
    if (val === aiPlayer) aiCount++;
    else if (val === opponent) oppCount++;
    else emptyCount++;
  }

  if (aiCount === 4) return 10000;
  if (oppCount === 4) return -10000;
  if (aiCount === 3 && emptyCount === 1) return 100;
  if (oppCount === 3 && emptyCount === 1) return -120;
  if (aiCount === 2 && emptyCount === 2) return 10;
  if (oppCount === 2 && emptyCount === 2) return -10;

  return 0;
}

/**
 * Heuristic evaluation of the board state from the perspective of aiPlayer.
 */
export function evaluateBoard(board: Board, aiPlayer: Player): number {
  const opponent: Player = aiPlayer === 1 ? 2 : 1;
  let score = 0;

  // Center column control bonus
  for (let r = 0; r < ROWS; r++) {
    if (board[r][3] === aiPlayer) score += 6;
    else if (board[r][3] === opponent) score -= 6;

    if (board[r][2] === aiPlayer) score += 2;
    else if (board[r][2] === opponent) score -= 2;

    if (board[r][4] === aiPlayer) score += 2;
    else if (board[r][4] === opponent) score -= 2;
  }

  // 1. Horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow(
        board[r][c],
        board[r][c + 1],
        board[r][c + 2],
        board[r][c + 3],
        aiPlayer,
        opponent
      );
    }
  }

  // 2. Vertical windows
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += evaluateWindow(
        board[r][c],
        board[r + 1][c],
        board[r + 2][c],
        board[r + 3][c],
        aiPlayer,
        opponent
      );
    }
  }

  // 3. Diagonal down-right windows
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow(
        board[r][c],
        board[r + 1][c + 1],
        board[r + 2][c + 2],
        board[r + 3][c + 3],
        aiPlayer,
        opponent
      );
    }
  }

  // 4. Diagonal up-right windows
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow(
        board[r][c],
        board[r - 1][c + 1],
        board[r - 2][c + 2],
        board[r - 3][c + 3],
        aiPlayer,
        opponent
      );
    }
  }

  return score;
}

/**
 * Minimax with Alpha-Beta Pruning.
 */
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player,
  lastRow: number,
  lastCol: number
): number {
  if (lastRow !== -1 && checkWinFromLastMove(board, lastRow, lastCol)) {
    // If last move won:
    // If isMaximizing is true now, the previous turn was minimizing (opponent), so opponent won.
    // If isMaximizing is false now, the previous turn was maximizing (AI), so AI won.
    return isMaximizing ? -1000000 - depth : 1000000 + depth;
  }

  const validMoves = getValidMoves(board);
  if (validMoves.length === 0) {
    return 0; // Draw
  }

  if (depth === 0) {
    return evaluateBoard(board, aiPlayer);
  }

  const opponent: Player = aiPlayer === 1 ? 2 : 1;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const col of validMoves) {
      const row = makeMove(board, col, aiPlayer);
      const evalScore = minimax(
        board,
        depth - 1,
        alpha,
        beta,
        false,
        aiPlayer,
        row,
        col
      );
      undoMove(board, row, col);

      if (evalScore > maxEval) {
        maxEval = evalScore;
      }
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) {
        break; // Beta cut-off
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const col of validMoves) {
      const row = makeMove(board, col, opponent);
      const evalScore = minimax(
        board,
        depth - 1,
        alpha,
        beta,
        true,
        aiPlayer,
        row,
        col
      );
      undoMove(board, row, col);

      if (evalScore < minEval) {
        minEval = evalScore;
      }
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) {
        break; // Alpha cut-off
      }
    }
    return minEval;
  }
}

/**
 * Finds if there is an immediate winning move for a given player.
 */
export function findImmediateWin(board: Board, player: Player): number | null {
  const validMoves = getValidMoves(board);
  for (const col of validMoves) {
    const row = makeMove(board, col, player);
    const won = checkWinFromLastMove(board, row, col);
    undoMove(board, row, col);
    if (won) return col;
  }
  return null;
}

/**
 * Normalize difficulty string.
 */
export function normalizeDifficulty(
  difficulty: AIDifficulty = 'hard'
): 'easy' | 'medium' | 'hard' {
  const lower = difficulty.toLowerCase();
  if (lower === 'easy') return 'easy';
  if (lower === 'medium') return 'medium';
  return 'hard';
}

/**
 * Calculates the best column for the AI to play.
 *
 * @param board Current 6x7 Connect 4 board.
 * @param aiPlayer The AI's player number (1 or 2).
 * @param difficulty 'easy' | 'medium' | 'hard' (case-insensitive).
 * @returns The 0-indexed column (0-6) or -1 if no valid moves exist.
 */
export function getAIMove(
  board: Board,
  aiPlayer: Player,
  difficulty: AIDifficulty = 'hard'
): number {
  const validMoves = getValidMoves(board);
  if (validMoves.length === 0) return -1;
  if (validMoves.length === 1) return validMoves[0];

  const diff = normalizeDifficulty(difficulty);
  const opponent: Player = aiPlayer === 1 ? 2 : 1;

  // Easy: picks a random valid column
  if (diff === 'easy') {
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }

  // Work on a deep copy of the board so caller's state is never mutated
  const boardCopy = board.map((row) => [...row]);

  // Both Medium and Hard check for immediate win first
  const winningMove = findImmediateWin(boardCopy, aiPlayer);
  if (winningMove !== null) {
    return winningMove;
  }

  // Both Medium and Hard block opponent's immediate winning threat
  const blockingMove = findImmediateWin(boardCopy, opponent);
  if (blockingMove !== null) {
    return blockingMove;
  }

  // Medium: shallow minimax (depth 2-3)
  // Hard: minimax with alpha-beta pruning (depth 5-6)
  const searchDepth = diff === 'medium' ? 2 : 5;

  let bestMove = validMoves[0];
  let bestScore = -Infinity;

  for (const col of validMoves) {
    const row = makeMove(boardCopy, col, aiPlayer);
    const score = minimax(
      boardCopy,
      searchDepth - 1,
      -Infinity,
      Infinity,
      false,
      aiPlayer,
      row,
      col
    );
    undoMove(boardCopy, row, col);

    if (score > bestScore) {
      bestScore = score;
      bestMove = col;
    }

  }

  return bestMove;
}

// Alias for convenience
export const findBestMove = getAIMove;
