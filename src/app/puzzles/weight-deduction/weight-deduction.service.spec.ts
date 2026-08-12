import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import {
  WEIGHT_VARIANTS,
  WeightDeductionService,
  WeightPanToken,
} from './weight-deduction.service';

describe('WeightDeductionService', () => {
  const service = new WeightDeductionService();

  it('chooses a valid variant when none is selected by the player', () => {
    const puzzle = service.createPuzzle();

    expect(WEIGHT_VARIANTS.map((variant) => variant.id)).toContain(puzzle.variantId);
  });

  for (const variant of WEIGHT_VARIANTS) {
    it(`creates uniquely solvable ${variant.id} puzzles`, () => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const puzzle = service.createPuzzle(variant.id);

        expect(service.countSolutions(puzzle)).toBe(1);
        expect(puzzle.clues.length).toBeGreaterThanOrEqual(5);
        expect(new Set(puzzle.stones.map((stone) => stone.label.slice(0, 1))).size).toBe(
          puzzle.stones.length,
        );
        expect(
          puzzle.clues.every(
            (clue) => service.relationForClue(clue, puzzle.solution) === clue.relation,
          ),
        ).toBe(true);
        expect(puzzle.clues.some((clue) => clue.relation !== 'balanced')).toBe(true);
      }
    });
  }

  it('uses repeated colors in the repeated-color variant', () => {
    const puzzle = service.createPuzzle('repeated-colors');

    expect(puzzle.copiesPerStone).toBeGreaterThan(1);
    expect(puzzle.allowedWeights).toEqual([2, 5, 9, 14, 20, 27, 35]);
    expect(puzzle.allowedWeights.length).toBeGreaterThan(puzzle.stones.length);
    expect(puzzle.clues.some((clue) => hasRepeatedStone([...clue.left, ...clue.right]))).toBe(true);
  });

  it('uses spaced weight choices for the unique-stone variant', () => {
    const puzzle = service.createPuzzle('unique-stones');

    expect(puzzle.allowedWeights).toEqual([3, 7, 10, 15, 18, 25, 33, 42]);
    expect(puzzle.allowedWeights.length).toBeGreaterThan(puzzle.stones.length);
  });

  it('never duplicates one unique stone on a pan', () => {
    const puzzle = service.createPuzzle('unique-stones');

    expect(puzzle.copiesPerStone).toBe(1);
    for (const clue of puzzle.clues) {
      expect(hasRepeatedStone(clue.left)).toBe(false);
      expect(hasRepeatedStone(clue.right)).toBe(false);
    }
  });

  it('keeps a repeated weight with expanded shared choices', () => {
    const puzzle = service.createPuzzle('shared-weights');

    const values = Object.values(puzzle.solution);

    expect(puzzle.allowedWeights).toEqual([2, 5, 9, 14, 20]);
    expect(new Set(values).size).toBeLessThan(values.length);
  });
});

function hasRepeatedStone(tokens: readonly WeightPanToken[]): boolean {
  const stoneIds = tokens
    .filter((token): token is Extract<WeightPanToken, { kind: 'stone' }> => token.kind === 'stone')
    .map((token) => token.stoneId);

  return new Set(stoneIds).size < stoneIds.length;
}
