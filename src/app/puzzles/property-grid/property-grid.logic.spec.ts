import { describe, expect, it } from 'vitest';
import {
  createPropertyGrid,
  findPropertyGridSolution,
  PropertyGridPuzzle,
  propertyGridRules,
} from './property-grid.logic';

function countArrangements(
  puzzle: PropertyGridPuzzle,
  index = 0,
  numbers = puzzle.numbers,
): number {
  if (!numbers.length) return 1;
  const row = puzzle.rows[Math.floor(index / 3)];
  const column = puzzle.columns[index % 3];
  let total = 0;
  for (const number of numbers) {
    if (row.accepts(number) && column.accepts(number)) {
      total += countArrangements(
        puzzle,
        index + 1,
        numbers.filter((value) => value !== number),
      );
    }
    if (total > 1) break;
  }
  return total;
}

describe('Grille de propriétés', () => {
  it('generates a unique solution, with fresh numbers and rules on both axes', () => {
    let seed = 31567;
    const random = () => {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    let previous: PropertyGridPuzzle | undefined;
    const ruleSets = new Set<string>();

    for (let round = 0; round < 80; round++) {
      const puzzle = createPropertyGrid(previous, random);
      expect(countArrangements(puzzle)).toBe(1);
      expect(new Set(puzzle.numbers).size).toBe(9);
      expect(puzzle.numbers.every((number) => number >= 1 && number <= 60)).toBe(true);
      const rules = [...puzzle.rows, ...puzzle.columns].map(({ id }) => id);
      expect(new Set(rules).size).toBe(6);
      ruleSets.add(rules.sort().join(','));

      if (previous) {
        const previousRules = new Set([...previous.rows, ...previous.columns].map(({ id }) => id));
        expect(puzzle.rows.some(({ id }) => !previousRules.has(id))).toBe(true);
        expect(puzzle.columns.some(({ id }) => !previousRules.has(id))).toBe(true);
        expect(
          puzzle.numbers.filter((number) => !previous!.numbers.includes(number)).length,
        ).toBeGreaterThanOrEqual(3);
      }
      previous = puzzle;
    }
    expect(ruleSets.size).toBeGreaterThan(50);
  });

  it('varies even after unsuccessful draws and only finds a hint compatible with the grid', () => {
    const first = createPropertyGrid(undefined, () => 0);
    const second = createPropertyGrid(first, () => 0);
    expect(countArrangements(first)).toBe(1);
    expect(countArrangements(second)).toBe(1);
    expect(
      new Set(
        [...first.rows, ...first.columns, ...second.rows, ...second.columns].map(({ id }) => id),
      ).size,
    ).toBe(12);
    expect(second.numbers).not.toEqual(first.numbers);

    const placed = Array<number | null>(9).fill(null);
    const solution = findPropertyGridSolution(second, placed)!;
    placed[0] = solution[0];
    expect(findPropertyGridSolution(second, placed)).toEqual(solution);
    const blocked = solution.findIndex((correct, index) =>
      second.numbers.some(
        (number) =>
          number !== correct &&
          propertyGridRules(second, index).every((rule) => rule.accepts(number)),
      ),
    );
    const misleading = second.numbers.find(
      (number) =>
        number !== solution[blocked] &&
        propertyGridRules(second, blocked).every((rule) => rule.accepts(number)),
    )!;
    placed.fill(null);
    placed[blocked] = misleading;
    expect(findPropertyGridSolution(second, placed)).toBeNull();
  });
});
