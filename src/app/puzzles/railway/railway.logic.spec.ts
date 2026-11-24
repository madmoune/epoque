import { describe, expect, it } from 'vitest';
import {
  createRailPuzzle,
  EMPTY_RAILS,
  inspectRailState,
  RailPuzzle,
  railSweep,
  toggleRailLink,
} from './railway.logic';

function countSolutions(puzzle: RailPuzzle): number {
  const rows = [...puzzle.rows];
  const columns = [...puzzle.columns];
  const visited = new Set<number>();

  function visit(cell: number): number {
    const row = Math.floor(cell / 4);
    const column = cell % 4;
    if (!rows[row] || !columns[column] || visited.has(cell)) return 0;
    rows[row]--;
    columns[column]--;
    visited.add(cell);

    let count = 0;
    if (cell === puzzle.end.cell) {
      count = rows.every((remaining) => remaining === 0) ? 1 : 0;
    } else {
      if (row > 0) count += visit(cell - 4);
      if (row < 3) count += visit(cell + 4);
      if (column > 0) count += visit(cell - 1);
      if (column < 3) count += visit(cell + 1);
    }
    rows[row]++;
    columns[column]++;
    visited.delete(cell);
    return count;
  }

  return visit(puzzle.start.cell);
}

describe('Voie ferrée', () => {
  it('generates one valid route for each tested combination of gates and counters', () => {
    for (let index = 0; index < 100; index++) {
      const puzzle = createRailPuzzle(undefined, () => (index + 0.5) / 100);
      expect(countSolutions(puzzle)).toBe(1);
      const state = puzzle.solution
        .slice(1)
        .reduce(
          (state, cell, offset) => toggleRailLink(puzzle, state, puzzle.solution[offset], cell),
          EMPTY_RAILS,
        );
      expect(inspectRailState(puzzle, state).solved).toBe(true);
      const next = createRailPuzzle(puzzle, () => (index + 0.5) / 100);
      expect(new Set([next.start.cell, next.end.cell])).not.toEqual(
        new Set([puzzle.start.cell, puzzle.end.cell]),
      );
    }
  });

  it('requires a single route and both sets of counters before declaring a win', () => {
    const puzzle: RailPuzzle = {
      start: { cell: 0, side: 'west' },
      end: { cell: 3, side: 'east' },
      rows: [4, 2, 0, 0],
      columns: [2, 2, 1, 1],
      solution: [0, 4, 5, 1, 2, 3],
    };
    let state = EMPTY_RAILS;
    const link = (from: number, to: number) => {
      state = toggleRailLink(puzzle, state, from, to);
    };
    link(0, 1);
    link(1, 2);
    link(2, 3);
    expect(inspectRailState(puzzle, state)).toMatchObject({ connected: true, solved: false });
    expect(toggleRailLink(puzzle, state, 3, 7)).toBe(state);
    expect(toggleRailLink(puzzle, state, 3, 4)).toBe(state);

    link(4, 5);
    expect(inspectRailState(puzzle, state)).toMatchObject({
      rows: puzzle.rows,
      columns: puzzle.columns,
      connected: false,
      solved: false,
    });
    link(1, 0);
    link(0, 4);
    link(5, 1);
    expect(inspectRailState(puzzle, state)).toMatchObject({ route: puzzle.solution, solved: true });
  });

  it('fills skipped squares of one row or column without creating a diagonal or wraparound', () => {
    expect(railSweep(7, 4)).toEqual([6, 5, 4]);
    expect(railSweep(1, 13)).toEqual([5, 9, 13]);
    expect(railSweep(3, 4)).toEqual([]);
    expect(railSweep(0, 5)).toEqual([]);
  });
});
