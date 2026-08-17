import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { MagicSquarePage } from './magic-square.page';

describe('MagicSquarePage', () => {
  it('varies the number of given cells between one and three', () => {
    for (const expectedCount of [1, 2, 3]) {
      const page = new MagicSquarePage() as any;
      const randomInt = page.randomInt.bind(page);
      page.randomInt = (min: number, max: number) =>
        min === 1 && max === 3 ? expectedCount : randomInt(min, max);

      page.newPuzzle();

      const givenCount = page
        .puzzle()
        .cells.flat()
        .filter((cell: { given: boolean }) => cell.given).length;
      expect(givenCount).toBe(expectedCount);
    }
  });
});
