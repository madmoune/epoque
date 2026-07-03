import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { SumPyramidPage } from './sum-pyramid.page';

describe('SumPyramidPage', () => {
  it('generates puzzles without two consecutive empty rows', () => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const page = new SumPyramidPage() as any;
      const puzzle = page.puzzle();
      const rowHasGiven = Array.from({ length: puzzle.size }, () => false);
      let givenCount = 0;

      for (const row of puzzle.rows) {
        for (const cell of row) {
          if (cell.given) {
            rowHasGiven[cell.row] = true;
            givenCount += 1;
          }
        }
      }

      expect(givenCount).toBeGreaterThanOrEqual(puzzle.size);
      expect(givenCount).toBeLessThanOrEqual(puzzle.size + 2);

      for (let row = 0; row < rowHasGiven.length - 1; row += 1) {
        expect(rowHasGiven[row] || rowHasGiven[row + 1]).toBe(true);
      }
    }
  });
});
