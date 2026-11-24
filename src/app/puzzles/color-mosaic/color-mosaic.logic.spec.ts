import { describe, expect, it } from 'vitest';
import {
  checkColorMosaic,
  createColorMosaic,
  MOSAIC_COLORS,
  MosaicColor,
  mosaicColorTotals,
} from './color-mosaic.logic';

function* allSymmetricMosaics(): Generator<MosaicColor[]> {
  const colors = MOSAIC_COLORS.slice(0, 3);
  for (let pattern = 0; pattern < colors.length ** 8; pattern++) {
    const [a, b, c, d, e, f, g, h] = Array.from(
      { length: 8 },
      (_, index) => colors[Math.floor(pattern / colors.length ** index) % colors.length],
    );
    const top = [a, b, c, b, a];
    const second = [d, e, f, e, d];
    yield [...top, ...second, g, h, 'blue', h, g, ...second, ...top];
  }
}

describe('Mosaïque logique', () => {
  it('has a unique solution for each generated set of proportions and position clues', () => {
    for (const draw of [0, 0.15, 0.26, 0.39, 0.41, 0.52, 0.63, 0.79, 0.85, 0.98]) {
      const puzzle = createColorMosaic(undefined, () => draw);
      const solutions = [...allSymmetricMosaics()].filter(
        (mosaic) => checkColorMosaic(puzzle, mosaic).kind === 'solved',
      );
      expect(solutions).toHaveLength(1);
      expect(mosaicColorTotals(solutions[0])).toEqual(puzzle.totals);
      expect(solutions[0][12]).toBe('blue');
      expect(createColorMosaic(puzzle, () => draw).totals).not.toEqual(puzzle.totals);
    }
  });

  it('checks completeness, both reflections and the color proportions', () => {
    const puzzle = createColorMosaic(undefined, () => 0.9);
    const allRed = Array<MosaicColor>(25).fill('red');
    const top = [...allRed];
    top[0] = 'green';
    const left = [...top];
    left[20] = 'green';
    expect(checkColorMosaic(puzzle, [])).toEqual({ kind: 'incomplete', blanks: 25 });
    expect(checkColorMosaic(puzzle, top)).toEqual({ kind: 'symmetry', axis: 'horizontal' });
    expect(checkColorMosaic(puzzle, left)).toEqual({ kind: 'symmetry', axis: 'vertical' });
    expect(checkColorMosaic(puzzle, allRed)).toEqual({ kind: 'blue' });
    allRed[12] = 'blue';
    expect(checkColorMosaic(puzzle, allRed)).toEqual({ kind: 'ratios' });
  });
});
