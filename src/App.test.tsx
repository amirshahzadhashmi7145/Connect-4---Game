import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from './App';

describe('Connect 4 UI Application', () => {
  it('renders a 7x6 grid board with 42 cells and 7 column buttons', () => {
    render(<App />);

    const board = screen.getByTestId('connect4-board');
    expect(board).toBeDefined();

    // Check 7 column buttons
    for (let c = 0; c < 7; c++) {
      const colBtn = screen.getByTestId(`column-button-${c}`);
      expect(colBtn).toBeDefined();
    }

    // Check all 42 cells (6 rows x 7 cols)
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        const cell = screen.getByTestId(`cell-${r}-${c}`);
        expect(cell).toBeDefined();
        expect(cell.getAttribute('data-player')).toBeNull();
      }
    }
  });

  it('allows players to drop pieces into columns by clicking and gravity places them at the lowest row', () => {
    render(<App />);

    const col0Btn = screen.getByTestId('column-button-0');
    fireEvent.click(col0Btn);

    // Row 5 (bottom) should now have Player 1 piece
    const bottomCell = screen.getByTestId('cell-5-0');
    expect(bottomCell.getAttribute('data-player')).toBe('1');

    // Row 4 should still be empty
    const cellAbove = screen.getByTestId('cell-4-0');
    expect(cellAbove.getAttribute('data-player')).toBeNull();

    // Second click in same column
    fireEvent.click(col0Btn);

    // Row 4 should now have Player 2 piece
    expect(cellAbove.getAttribute('data-player')).toBe('2');
  });

  it('switches turns correctly between two players', () => {
    render(<App />);

    const statusBanner = screen.getByTestId('status-message');
    expect(statusBanner.textContent).toContain("Player 1's Turn (Red)");

    // P1 moves
    fireEvent.click(screen.getByTestId('column-button-2'));
    expect(statusBanner.textContent).toContain("Player 2's Turn (Yellow)");

    // P2 moves
    fireEvent.click(screen.getByTestId('column-button-3'));
    expect(statusBanner.textContent).toContain("Player 1's Turn (Red)");
  });

  it('detects horizontal win and highlights winning cells', () => {
    render(<App />);

    // Player 1 drops in 0, 1, 2, 3
    // Player 2 drops in 0, 1, 2
    fireEvent.click(screen.getByTestId('column-button-0')); // P1 at [5, 0]
    fireEvent.click(screen.getByTestId('column-button-0')); // P2 at [4, 0]
    fireEvent.click(screen.getByTestId('column-button-1')); // P1 at [5, 1]
    fireEvent.click(screen.getByTestId('column-button-1')); // P2 at [4, 1]
    fireEvent.click(screen.getByTestId('column-button-2')); // P1 at [5, 2]
    fireEvent.click(screen.getByTestId('column-button-2')); // P2 at [4, 2]
    fireEvent.click(screen.getByTestId('column-button-3')); // P1 at [5, 3] -> Win!

    const statusBanner = screen.getByTestId('status-message');
    expect(statusBanner.textContent).toContain('Player 1 (Red) Wins!');

    // Check winning cells are marked
    for (let c = 0; c < 4; c++) {
      const cell = screen.getByTestId(`cell-5-${c}`);
      expect(cell.getAttribute('data-winning')).toBe('true');
    }

    // Check non-winning cell is not marked winning
    expect(screen.getByTestId('cell-4-0').getAttribute('data-winning')).toBeNull();
  });

  it('detects vertical win', () => {
    render(<App />);

    // P1: col 0, P2: col 1, repeatedly
    fireEvent.click(screen.getByTestId('column-button-0')); // P1 [5, 0]
    fireEvent.click(screen.getByTestId('column-button-1')); // P2 [5, 1]
    fireEvent.click(screen.getByTestId('column-button-0')); // P1 [4, 0]
    fireEvent.click(screen.getByTestId('column-button-1')); // P2 [4, 1]
    fireEvent.click(screen.getByTestId('column-button-0')); // P1 [3, 0]
    fireEvent.click(screen.getByTestId('column-button-1')); // P2 [3, 1]
    fireEvent.click(screen.getByTestId('column-button-0')); // P1 [2, 0] -> Win!

    const statusBanner = screen.getByTestId('status-message');
    expect(statusBanner.textContent).toContain('Player 1 (Red) Wins!');

    // Verify winning cells
    for (let r = 2; r <= 5; r++) {
      expect(screen.getByTestId(`cell-${r}-0`).getAttribute('data-winning')).toBe('true');
    }
  });

  it('detects diagonal win', () => {
    render(<App />);

    // Diagonal: [5, 0], [4, 1], [3, 2], [2, 3]
    fireEvent.click(screen.getByTestId('column-button-0')); // P1: [5, 0]
    fireEvent.click(screen.getByTestId('column-button-1')); // P2: [5, 1]
    fireEvent.click(screen.getByTestId('column-button-1')); // P1: [4, 1]
    fireEvent.click(screen.getByTestId('column-button-2')); // P2: [5, 2]
    fireEvent.click(screen.getByTestId('column-button-6')); // P1: throwaway
    fireEvent.click(screen.getByTestId('column-button-2')); // P2: [4, 2]
    fireEvent.click(screen.getByTestId('column-button-2')); // P1: [3, 2]
    fireEvent.click(screen.getByTestId('column-button-3')); // P2: [5, 3]
    fireEvent.click(screen.getByTestId('column-button-6')); // P1: throwaway
    fireEvent.click(screen.getByTestId('column-button-3')); // P2: [4, 3]
    fireEvent.click(screen.getByTestId('column-button-6')); // P1: throwaway
    fireEvent.click(screen.getByTestId('column-button-3')); // P2: [3, 3]
    fireEvent.click(screen.getByTestId('column-button-3')); // P1: [2, 3] -> Win!

    const statusBanner = screen.getByTestId('status-message');
    expect(statusBanner.textContent).toContain('Player 1 (Red) Wins!');

    expect(screen.getByTestId('cell-5-0').getAttribute('data-winning')).toBe('true');
    expect(screen.getByTestId('cell-4-1').getAttribute('data-winning')).toBe('true');
    expect(screen.getByTestId('cell-3-2').getAttribute('data-winning')).toBe('true');
    expect(screen.getByTestId('cell-2-3').getAttribute('data-winning')).toBe('true');
  });

  it('disables column drop button when a column becomes full', () => {
    render(<App />);

    const col0Btn = screen.getByTestId('column-button-0');
    // Drop 6 pieces in column 0
    for (let i = 0; i < 6; i++) {
      fireEvent.click(col0Btn);
    }

    // Now column 0 is full, button should be disabled
    expect(col0Btn.hasAttribute('disabled')).toBe(true);

    // Clicking again should not change anything
    fireEvent.click(col0Btn);
    expect(screen.getByTestId('cell-0-0').getAttribute('data-player')).not.toBeNull();
  });

  it('resets the board and game status when the reset button is clicked', () => {
    render(<App />);

    // Make some moves
    fireEvent.click(screen.getByTestId('column-button-0'));
    fireEvent.click(screen.getByTestId('column-button-1'));

    expect(screen.getByTestId('cell-5-0').getAttribute('data-player')).toBe('1');
    expect(screen.getByTestId('cell-5-1').getAttribute('data-player')).toBe('2');

    // Click Reset Game
    const resetBtn = screen.getByTestId('reset-button');
    fireEvent.click(resetBtn);

    // Board should be empty
    expect(screen.getByTestId('cell-5-0').getAttribute('data-player')).toBeNull();
    expect(screen.getByTestId('cell-5-1').getAttribute('data-player')).toBeNull();

    // Turn should be back to Player 1
    const statusBanner = screen.getByTestId('status-message');
    expect(statusBanner.textContent).toContain("Player 1's Turn (Red)");
  });

  it('detects draws when board is filled without a win', () => {
    render(<App />);

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

    for (const col of drawMoves) {
      fireEvent.click(screen.getByTestId(`column-button-${col}`));
    }

    const statusBanner = screen.getByTestId('status-message');
    expect(statusBanner.textContent).toContain("It's a Draw! Board is full.");

    // All column buttons should now be disabled
    for (let c = 0; c < 7; c++) {
      expect(screen.getByTestId(`column-button-${c}`).hasAttribute('disabled')).toBe(true);
    }
  });
});
