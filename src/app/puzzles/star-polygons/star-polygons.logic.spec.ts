import { describe, expect, it } from 'vitest';
import {
  createStarPuzzle,
  nextStarInOutline,
  randomStarChallenge,
  STAR_CHALLENGES,
} from './star-polygons.logic';

describe('star polygon generation', () => {
  it('randomizes challenges without repeating the previous one', () => {
    expect(randomStarChallenge(undefined, () => 0)).toBe(STAR_CHALLENGES[0]);
    expect(randomStarChallenge(STAR_CHALLENGES[0], () => 0)).toBe(STAR_CHALLENGES[1]);
    expect(randomStarChallenge(STAR_CHALLENGES[6], () => 0.999999)).toBe(STAR_CHALLENGES[7]);
  });

  it('generates all eight combinations with regular figures and distinct, well-spaced stars', () => {
    const combinations = STAR_CHALLENGES.map(({ sizes }) => sizes);
    expect(combinations).toEqual([
      [4, 4],
      [3, 3],
      [3, 4],
      [3, 5],
      [4, 5],
      [3, 6],
      [4, 6],
      [5, 5],
    ]);

    let seed = 3821;
    const random = () => {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };

    for (const challenge of STAR_CHALLENGES) {
      // A constant source also exercises the fallback after unsuccessful attempts.
      const boards = [createStarPuzzle(challenge, () => 0)];
      for (let index = 0; index < 12; index++) boards.push(createStarPuzzle(challenge, random));
      expect(new Set(boards.map(({ stars }) => JSON.stringify(stars))).size).toBe(boards.length);

      for (const { stars, outlines } of boards) {
        expect(outlines.map((outline) => outline.length)).toEqual(challenge.sizes);
        expect([...outlines.flat()].sort((a, b) => a - b)).toEqual(stars.map((_, index) => index));
        stars.forEach(({ x, y }, index) => {
          expect(Math.min(x, y)).toBeGreaterThanOrEqual(10 - 1e-8);
          expect(Math.max(x, y)).toBeLessThanOrEqual(90 + 1e-8);
          for (const other of stars.slice(index + 1)) {
            expect(Math.hypot(x - other.x, y - other.y)).toBeGreaterThanOrEqual(15.5);
          }
        });

        for (const outline of outlines) {
          const points = outline.map((index) => stars[index]);
          const centerX = points.reduce((total, point) => total + point.x, 0) / points.length;
          const centerY = points.reduce((total, point) => total + point.y, 0) / points.length;
          const radius = Math.hypot(points[0].x - centerX, points[0].y - centerY);
          const side = 2 * radius * Math.sin(Math.PI / points.length);
          points.forEach(({ x, y }, index) => {
            const next = points[(index + 1) % points.length];
            expect(Math.hypot(x - centerX, y - centerY)).toBeCloseTo(radius, 8);
            expect(Math.hypot(x - next.x, y - next.y)).toBeCloseTo(side, 8);
          });
        }
      }
    }
  });

  it('accepts either direction and any starting star while rejecting a crossed outline', () => {
    const square = [5, 0, 1, 3];
    expect(nextStarInOutline(square, [1, 3, 5, 0])).toBe(1);
    expect(nextStarInOutline(square, [3, 1, 0, 5])).toBe(3);
    expect(nextStarInOutline(square, [0, 5])).toBe(3);
    expect(nextStarInOutline(square, [5, 1, 0, 3])).toBeNull();
  });
});
