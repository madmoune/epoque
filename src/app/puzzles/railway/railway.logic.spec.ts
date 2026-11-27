import { describe, expect, it } from 'vitest';
import {
  createRailPuzzle,
  cycleRailMark,
  EMPTY_RAILS,
  hasRailCross,
  hasRailMark,
  inspectRailState,
  RailPuzzle,
  RAIL_SIZES,
  railSweep,
  toggleRailLink,
} from './railway.logic';

function countSolutions(puzzle: RailPuzzle): number {
  const rows = [...puzzle.rows];
  const columns = [...puzzle.columns];
  const rowCount = puzzle.size.rows;
  const columnCount = puzzle.size.columns;
  const visited = new Set<number>();

  function visit(cell: number): number {
    const row = Math.floor(cell / columnCount);
    const column = cell % columnCount;
    if (!rows[row] || !columns[column] || visited.has(cell)) return 0;
    rows[row]--;
    columns[column]--;
    visited.add(cell);

    let count = 0;
    if (cell === puzzle.end.cell) {
      count = rows.every((remaining) => remaining === 0) ? 1 : 0;
    } else {
      if (row > 0) count += visit(cell - columnCount);
      if (row < rowCount - 1) count += visit(cell + columnCount);
      if (column > 0) count += visit(cell - 1);
      if (column < columnCount - 1) count += visit(cell + 1);
    }
    rows[row]++;
    columns[column]++;
    visited.delete(cell);
    return count;
  }

  return visit(puzzle.start.cell);
}

describe('Voie ferrée', () => {
  it('defaults to the 6 × 5 board', () => {
    expect(createRailPuzzle(undefined, () => 0.5).size).toBe(RAIL_SIZES[2]);
  });

  it('generates valid routes for every available board size', () => {
    for (const size of RAIL_SIZES) {
      const puzzle = createRailPuzzle(undefined, () => 0.5, size);
      expect(puzzle.size).toBe(size);
      expect(puzzle.rows).toHaveLength(size.rows);
      expect(puzzle.columns).toHaveLength(size.columns);
      expect(puzzle.solution.every((cell) => cell < size.rows * size.columns)).toBe(true);

      const state = puzzle.solution
        .slice(1)
        .reduce(
          (state, cell, offset) => toggleRailLink(puzzle, state, puzzle.solution[offset], cell),
          EMPTY_RAILS,
        );
      expect(inspectRailState(puzzle, state).solved).toBe(true);

      let seed = size.rows * 100 + size.columns;
      let previous: RailPuzzle | undefined;
      for (let index = 0; index < 10; index++) {
        const random = () => {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          return seed / 2 ** 32;
        };
        const next = createRailPuzzle(previous, random, size);
        expect(next.size).toBe(size);
        expect(inspectRailState(next, EMPTY_RAILS).solved).toBe(false);
        previous = next;
      }
    }
  });

  it('generates one valid route for each tested combination of gates and counters', () => {
    const size = RAIL_SIZES[0];
    for (let index = 0; index < 100; index++) {
      const puzzle = createRailPuzzle(undefined, () => (index + 0.5) / 100, size);
      expect(countSolutions(puzzle)).toBe(1);
      const state = puzzle.solution
        .slice(1)
        .reduce(
          (state, cell, offset) => toggleRailLink(puzzle, state, puzzle.solution[offset], cell),
          EMPTY_RAILS,
        );
      expect(inspectRailState(puzzle, state).solved).toBe(true);
      const next = createRailPuzzle(puzzle, () => (index + 0.5) / 100, size);
      expect(new Set([next.start.cell, next.end.cell])).not.toEqual(
        new Set([puzzle.start.cell, puzzle.end.cell]),
      );
    }
  });

  it('requires a single route and both sets of counters before declaring a win', () => {
    const puzzle: RailPuzzle = {
      size: RAIL_SIZES[0],
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

  it('cycles an empty cell through a cross, a rail mark and empty', () => {
    const puzzle = createRailPuzzle(undefined, () => 0.5, RAIL_SIZES[2]);
    const cell = puzzle.size.columns + 2;

    let state = cycleRailMark(puzzle, EMPTY_RAILS, cell);
    expect(hasRailCross(state, cell)).toBe(true);
    expect(hasRailMark(state, cell)).toBe(false);

    state = cycleRailMark(puzzle, state, cell);
    expect(hasRailCross(state, cell)).toBe(false);
    expect(hasRailMark(state, cell)).toBe(true);

    state = cycleRailMark(puzzle, state, cell);
    expect(hasRailCross(state, cell)).toBe(false);
    expect(hasRailMark(state, cell)).toBe(false);
  });

  it('fills skipped squares of one row or column without creating a diagonal or wraparound', () => {
    const size = RAIL_SIZES[0];
    expect(railSweep(7, 4, size)).toEqual([6, 5, 4]);
    expect(railSweep(1, 13, size)).toEqual([5, 9, 13]);
    expect(railSweep(3, 4, size)).toEqual([]);
    expect(railSweep(0, 5, size)).toEqual([]);
  });
});
