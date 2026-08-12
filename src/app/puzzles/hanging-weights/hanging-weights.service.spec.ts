import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import {
  HANGING_WEIGHT_DIFFICULTIES,
  HangingWeightNode,
  HangingWeightsService,
} from './hanging-weights.service';

describe('HangingWeightsService', () => {
  const service = new HangingWeightsService();

  for (const difficulty of HANGING_WEIGHT_DIFFICULTIES) {
    it(`creates balanced and uniquely deducible ${difficulty.id} mobiles`, () => {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const puzzle = service.createPuzzle(difficulty.id);
        const solvedFromKnownWeight = service.solvePuzzle(puzzle);

        expect(difficulty.weightCount).toBeGreaterThanOrEqual(5);
        expect(puzzle.weights).toHaveLength(difficulty.weightCount);
        expect(new Set(puzzle.weights.map((weight) => weight.label)).size).toBe(
          difficulty.weightCount,
        );
        expect(new Set(puzzle.weights.map((weight) => weight.color)).size).toBe(
          difficulty.weightCount,
        );
        expect(puzzle.weights.filter((weight) => weight.known)).toHaveLength(1);
        expect(puzzle.weights.find((weight) => weight.known)?.id).toBe(puzzle.knownWeightId);
        expect(countBranches(puzzle.root)).toBe(difficulty.weightCount - 1);
        expect(Object.values(puzzle.solution).every(Number.isInteger)).toBe(true);
        expect(Object.values(puzzle.solution).every((weight) => weight > 0)).toBe(true);
        expect(service.isPuzzleBalanced(puzzle)).toBe(true);
        expect(solvedFromKnownWeight).toEqual(puzzle.solution);
      }
    });
  }

  it('counts every suspended subtree in the load carried by its parent', () => {
    const puzzle = service.createPuzzle('cascade');

    expect(service.nodeTotal(puzzle.root, puzzle.solution)).toBe(
      Object.values(puzzle.solution).reduce((total, weight) => total + weight, 0),
    );
  });

  it('detects a mobile made unbalanced by a wrong answer', () => {
    const puzzle = service.createPuzzle('classic');
    const unknownWeight = puzzle.weights.find((weight) => !weight.known);

    expect(unknownWeight).toBeDefined();

    const changedPuzzle = {
      ...puzzle,
      solution: {
        ...puzzle.solution,
        [unknownWeight!.id]: puzzle.solution[unknownWeight!.id] + 1,
      },
    };

    expect(service.isPuzzleBalanced(changedPuzzle)).toBe(false);
  });
});

function countBranches(node: HangingWeightNode): number {
  if (node.kind === 'weight') {
    return 0;
  }

  return 1 + countBranches(node.left) + countBranches(node.right);
}
