import { describe, expect, it } from 'vitest';
import {
  PUZZLE_A_CADENAS,
  PUZZLE_A_CADENAS_GRID_EXAMPLE_RESULTS,
} from './puzzle-a-cadenas.catalog';

describe('Puzzle à Cadenas catalog', () => {
  it('contains the original twelve puzzles plus puzzles 13 to 125', () => {
    expect(PUZZLE_A_CADENAS).toHaveLength(125);
    expect(PUZZLE_A_CADENAS.slice(12)).toHaveLength(113);
    expect(new Set(PUZZLE_A_CADENAS.map((puzzle) => puzzle.id)).size).toBe(125);
  });

  it('keeps a four-digit answer for every puzzle, including leading zeroes', () => {
    expect(PUZZLE_A_CADENAS.every((puzzle) => /^\d{4}$/.test(puzzle.answer))).toBe(true);
  });

  it('provides four numeric results for every 3x3 grid example', () => {
    const gridPuzzleIds = PUZZLE_A_CADENAS.filter((puzzle) =>
      /Exemple 1\n[■·]{3}\n[■·]{3}\n[■·]{3}/.test(puzzle.display),
    ).map((puzzle) => puzzle.id);

    expect(Object.keys(PUZZLE_A_CADENAS_GRID_EXAMPLE_RESULTS).sort()).toEqual(gridPuzzleIds.sort());
    expect(
      Object.values(PUZZLE_A_CADENAS_GRID_EXAMPLE_RESULTS).every(
        (results) => results.length === 4 && results.every((result) => /^\d$/.test(result)),
      ),
    ).toBe(true);
  });
});
