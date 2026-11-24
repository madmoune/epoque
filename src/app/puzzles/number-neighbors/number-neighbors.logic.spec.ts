import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canSitTogether,
  createNumberNeighborsPuzzle,
  findSeatingSolution,
  NEIGHBOR_RULES,
  NumberNeighborsPuzzle,
  seatingConflicts,
} from './number-neighbors.logic';

describe('Voisins numérotés', () => {
  afterEach(() => vi.restoreAllMocks());

  it('checks each of the three rules symmetrically', () => {
    expect(canSitTogether('prime-gap', 15, 2)).toBe(false);
    expect(canSitTogether('prime-gap', 2, 15)).toBe(false);
    expect(canSitTogether('prime-gap', 2, 3)).toBe(true);
    expect(canSitTogether('prime-gap', 3, 9)).toBe(true);
    expect(canSitTogether('common-factor', 9, 15)).toBe(false);
    expect(canSitTogether('common-factor', 1, 12)).toBe(true);
    expect(canSitTogether('common-factor', 8, 15)).toBe(true);
    expect(canSitTogether('multiple-of-five', 10, 15)).toBe(false);
    expect(canSitTogether('multiple-of-five', 7, 3)).toBe(false);
    expect(canSitTogether('multiple-of-five', 6, 3)).toBe(true);
  });

  it.each(NEIGHBOR_RULES)(
    'generates solvable layouts for $label, even with a repeated draw',
    ({ id }) => {
      let seed = 594301;
      const draw = vi.spyOn(Math, 'random').mockImplementation(() => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      });
      let previous: NumberNeighborsPuzzle | undefined;
      const sets = new Set<string>();

      for (let round = 0; round < 20; round++) {
        if (round === 18) draw.mockReturnValue(0.999999);
        const puzzle = createNumberNeighborsPuzzle(id, previous);
        const solution = findSeatingSolution(puzzle)!;
        const { chairs } = puzzle.layout;

        expect(puzzle.layout).not.toBe(previous?.layout);
        expect(chairs).toHaveLength(8);
        expect(new Set(puzzle.numbers).size).toBe(8);
        expect([...solution].sort((a, b) => a - b)).toEqual(puzzle.numbers);
        for (const [first, chair] of chairs.entries()) {
          for (let second = first + 1; second < chairs.length; second++) {
            const other = chairs[second];
            if (
              Math.max(Math.abs(chair.row - other.row), Math.abs(chair.column - other.column)) <= 1
            ) {
              expect(canSitTogether(id, solution[first], solution[second])).toBe(true);
            }
          }
        }

        const partial = solution.map((number, i) => (i % 2 === 0 ? number : null));
        const completion = findSeatingSolution(puzzle, partial)!;
        expect(seatingConflicts(puzzle, completion)).toEqual([]);
        for (const [i, number] of partial.entries())
          if (number !== null) expect(completion[i]).toBe(number);
        sets.add(puzzle.numbers.join(','));
        previous = puzzle;
      }

      expect(sets.size).toBeGreaterThan(3);
    },
  );
});
