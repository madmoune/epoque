import { describe, expect, it } from 'vitest';
import { createMagicTriangle, triangleSums } from './magic-triangle.logic';

function possibleSums(digits: readonly number[]): Set<number> {
  const sums = new Set<number>();
  function visit(placed: readonly number[], remaining: readonly number[]): void {
    if (remaining.length === 0) {
      const [top, middleLeft, middleRight, bottomLeft, bottomMiddle, bottomRight] = placed;
      const left = top + middleLeft + bottomLeft;
      if (
        left === top + middleRight + bottomRight &&
        left === bottomLeft + bottomMiddle + bottomRight
      ) {
        sums.add(left);
      }
      return;
    }
    for (const digit of remaining)
      visit(
        [...placed, digit],
        remaining.filter((value) => value !== digit),
      );
  }
  visit([], digits);
  return sums;
}

describe('Triangle magique', () => {
  it('offers many distinct solvable digit sets and changes the possible totals on each redraw', () => {
    const drawCount = 96;
    const puzzles = new Set(
      Array.from({ length: drawCount }, (_, i) =>
        createMagicTriangle(undefined, () => (i + 0.5) / drawCount),
      ),
    );

    expect(puzzles.size).toBeGreaterThan(30);
    for (const puzzle of puzzles) {
      expect(puzzle.digits).toHaveLength(6);
      expect(new Set(puzzle.digits).size).toBe(6);
      expect(puzzle.digits.every((digit) => digit >= 1 && digit <= 9)).toBe(true);
      expect(puzzle.sums.size).toBeGreaterThan(0);
      expect(puzzle.sums).toEqual(possibleSums(puzzle.digits));
      for (const arrangement of puzzle.solutions) {
        const [left, right, bottom] = triangleSums(arrangement);
        expect(left).toBe(right);
        expect(left).toBe(bottom);
        expect(puzzle.sums.has(left!)).toBe(true);
        expect([...arrangement].sort((a, b) => a - b)).toEqual(puzzle.digits);
      }
      const next = createMagicTriangle(puzzle, () => 0);
      expect(next.digits).not.toEqual(puzzle.digits);
      expect([...next.sums].some((sum) => puzzle.sums.has(sum))).toBe(false);
    }
  });

  it('counts shared corners on both sides and holds back incomplete sums', () => {
    expect(triangleSums([5, 2, null, 8, 1, null])).toEqual([15, null, null]);
    expect(triangleSums([5, 2, 7, 8, 1, 6])).toEqual([15, 18, 15]);
  });
});
