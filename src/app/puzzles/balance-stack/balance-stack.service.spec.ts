import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import {
  BALANCE_STACK_DIFFICULTIES,
  BalanceStackCell,
  BalanceStackPiece,
  BalanceStackService,
} from './balance-stack.service';

describe('BalanceStackService', () => {
  const service = new BalanceStackService();

  for (const difficulty of BALANCE_STACK_DIFFICULTIES) {
    it(`creates a replayable ${difficulty.id} puzzle with one solution`, () => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const puzzle = service.createPuzzle(difficulty.id);
        let cells: BalanceStackCell[] = [];

        expect(puzzle.pieces).toHaveLength(difficulty.pieceCount);
        expect(puzzle.solutionMoves).toHaveLength(difficulty.pieceCount);
        expect(service.countSolutions(puzzle)).toBe(1);

        puzzle.solutionMoves.forEach((move, pieceIndex) => {
          const piece = puzzle.pieces[pieceIndex];
          const result = service.dropPiece(puzzle, cells, piece, move.rotation, move.x);

          expect(move.pieceId).toBe(piece.id);
          expect(result).not.toBeNull();
          expect(result?.localStable).toBe(true);
          expect(result?.globalStable).toBe(true);
          expect(result?.connected).toBe(true);
          expect(result?.compact).toBe(true);
          expect(result?.stable).toBe(true);
          cells = result!.cells;
        });

        expect(cells).toHaveLength(difficulty.pieceCount * 4);
        expect(service.isPerfectlyBalanced(puzzle, cells)).toBe(true);
      }
    });
  }

  it('keeps only distinct rotations for symmetrical shapes', () => {
    expect(service.orientationsFor(testPiece('square')).length).toBe(1);
    expect(service.orientationsFor(testPiece('bar')).length).toBe(2);
    expect(service.orientationsFor(testPiece('tee')).length).toBe(4);
    expect(service.orientationsFor(testPiece('zigzag')).length).toBe(2);
  });

  it('rejects a tower whose global center of mass leaves the safe zone', () => {
    const puzzle = service.createPuzzle('initiation');
    const result = service.dropPiece(puzzle, [], testPiece('square'), 0, 0);

    expect(result).not.toBeNull();
    expect(result?.localStable).toBe(true);
    expect(result?.globalStable).toBe(false);
    expect(result?.stable).toBe(false);
  });

  it('rejects a block whose own center is outside its contact points', () => {
    const puzzle = service.createPuzzle('classic');
    const support: BalanceStackCell[] = [{ x: 0, y: 0, pieceId: 'support', color: '#999' }];
    const result = service.dropPiece(puzzle, support, testPiece('bar'), 0, 0);

    expect(result).not.toBeNull();
    expect(result?.localStable).toBe(false);
    expect(result?.stable).toBe(false);
  });

  it('rejects a stable piece that is disconnected from the tower', () => {
    const puzzle = testPuzzle();
    const existing: BalanceStackCell[] = [{ x: 3, y: 0, pieceId: 'support', color: '#999' }];
    const result = service.dropPiece(puzzle, existing, testPiece('square'), 0, 0);

    expect(result).not.toBeNull();
    expect(result?.localStable).toBe(true);
    expect(result?.connected).toBe(false);
    expect(result?.stable).toBe(false);
  });

  it('can find a continuation after the first generated move', () => {
    const puzzle = service.createPuzzle('initiation');
    const firstMove = puzzle.solutionMoves[0];
    const firstResult = service.dropPiece(
      puzzle,
      [],
      puzzle.pieces[0],
      firstMove.rotation,
      firstMove.x,
    );

    expect(firstResult?.stable).toBe(true);

    const remainingMoves = service.findCompletion(puzzle, firstResult!.cells, 1);

    expect(remainingMoves).not.toBeNull();
    expect(remainingMoves).toHaveLength(puzzle.pieces.length - 1);
  });
});

function testPiece(shapeId: BalanceStackPiece['shapeId']): BalanceStackPiece {
  return {
    id: `test-${shapeId}`,
    shapeId,
    label: shapeId,
    color: '#888',
  };
}

function testPuzzle() {
  return {
    difficultyId: 'classic' as const,
    title: 'Test',
    description: 'Test',
    width: 9,
    height: 11,
    safeRadius: 10,
    pieces: [],
    solutionMoves: [],
  };
}
