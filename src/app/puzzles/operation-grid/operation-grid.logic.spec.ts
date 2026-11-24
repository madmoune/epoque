import { describe, expect, it } from 'vitest';
import {
  createOperationGrid,
  OperationGridPuzzle,
  operationGridStatus,
} from './operation-grid.logic';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const OPERATIONS = {
  '+': (a: number, b: number) => a + b,
  '−': (a: number, b: number) => a - b,
  '×': (a: number, b: number) => a * b,
  '÷': (a: number, b: number) => a / b,
};

function countSolutions(puzzle: OperationGridPuzzle): number {
  const board = [...puzzle.givens];
  const empty = DIGITS.map((digit) => digit - 1).filter((index) => board[index] === null);
  const remaining = DIGITS.filter((digit) => !board.includes(digit));
  const [left, middle, right] = puzzle.columns.map((sign) => OPERATIONS[sign]);
  const bottom = OPERATIONS[puzzle.bottom];
  let count = 0;

  function place(depth: number): void {
    if (depth === empty.length) {
      const [a, b, c, d, e, f, g, h, i] = board as number[];
      if (left(a, d) === g && middle(b, e) === h && right(c, f) === i && bottom(g, h) === i)
        count++;
      return;
    }

    for (let index = depth; index < remaining.length; index++) {
      [remaining[depth], remaining[index]] = [remaining[index], remaining[depth]];
      board[empty[depth]] = remaining[depth];
      place(depth + 1);
      [remaining[depth], remaining[index]] = [remaining[index], remaining[depth]];
    }
  }

  place(0);
  return count;
}

describe('Grille d’opérations', () => {
  it('generates distinct operator arrangements with a unique solution using all nine digits', () => {
    const arrangements = new Set<string>();
    for (let draw = 0; draw < 64; draw++) {
      const puzzle = createOperationGrid(undefined, () => draw / 64);
      arrangements.add(puzzle.columns.join('') + puzzle.bottom);
      expect([...puzzle.solution].sort((a, b) => a - b)).toEqual(DIGITS);
      expect(operationGridStatus(puzzle, puzzle.solution)).toEqual(Array(4).fill('correct'));
      expect(puzzle.givens.filter((value) => value !== null).length).toBeGreaterThanOrEqual(1);
      expect(puzzle.givens.filter((value) => value !== null).length).toBeLessThanOrEqual(2);
      expect(
        puzzle.givens.every((value, index) => value === null || value === puzzle.solution[index]),
      ).toBe(true);
      expect(countSolutions(puzzle)).toBe(1);

      const next = createOperationGrid(puzzle, () => draw / 64);
      expect(next.columns.join('') + next.bottom).not.toBe(puzzle.columns.join('') + puzzle.bottom);
    }
    expect(arrangements.size).toBeGreaterThan(2);
  });
});
