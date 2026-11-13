import { describe, expect, it } from 'vitest';
import {
  PUZZLE_A_CADENAS,
  PUZZLE_A_CADENAS_GRID_EXAMPLE_RESULTS,
} from './puzzle-a-cadenas.catalog';
import { PUZZLE_A_CADENAS_NEW_50 } from './puzzle-a-cadenas.new-50';

describe('Puzzle à Cadenas catalog', () => {
  it('contains the original puzzles plus the 50 new PDF puzzles', () => {
    expect(PUZZLE_A_CADENAS).toHaveLength(175);
    expect(PUZZLE_A_CADENAS.slice(12)).toHaveLength(163);
    expect(PUZZLE_A_CADENAS_NEW_50).toHaveLength(50);
    expect(new Set(PUZZLE_A_CADENAS.map((puzzle) => puzzle.id)).size).toBe(175);
  });

  it('keeps a four-digit answer for every puzzle, including leading zeroes', () => {
    expect(PUZZLE_A_CADENAS.every((puzzle) => /^\d{4}$/.test(puzzle.answer))).toBe(true);
  });

  it('labels the example and answer sections throughout the collection', () => {
    for (const puzzle of PUZZLE_A_CADENAS) {
      expect(puzzle.display).toMatch(/(?:^|\n)(?:Exemples|Indices)\n/);
      expect(puzzle.display).toContain('\nÀ résoudre\n');
    }
  });

  it('keeps four resolvable A–D lines in each of the last 50 puzzles', () => {
    for (const puzzle of PUZZLE_A_CADENAS_NEW_50) {
      const targetDisplay = puzzle.display.split('\nÀ résoudre\n')[1] ?? '';

      expect(targetDisplay.match(/(?:^|\n)(?:@diagram\s+)?[ABCD](?=\s|$)/g)).toHaveLength(4);
      expect(targetDisplay.match(/(?:@result|→)\s*\?/g)).toHaveLength(4);
    }
  });

  it('uses an explicit separator for nonogram runs', () => {
    const puzzle = PUZZLE_A_CADENAS_NEW_50.find(
      (entry) => entry.id === 'nouveaux-67-fenetres-cachees',
    );

    expect(puzzle?.display).not.toMatch(/\d\.\d/);
    expect(puzzle?.display).toContain('C:1,2,2,1·2');
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
