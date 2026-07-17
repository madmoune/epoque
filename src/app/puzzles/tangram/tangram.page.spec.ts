import '@angular/compiler';
import { beforeEach, describe, expect, it } from 'vitest';
import { TangramPage } from './tangram.page';

describe('TangramPage interactions', () => {
  let page: any;
  let board: HTMLElement;

  beforeEach(() => {
    page = new TangramPage() as any;
    board = document.createElement('div');
    board.getBoundingClientRect = () =>
      ({
        top: 0,
        right: 400,
        bottom: 400,
        left: 0,
        width: 400,
        height: 400,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
  });

  it('places a selected piece with a tap on the board', () => {
    page.selectedPieceId.set('large-blue');

    page.placeSelectedPiece({
      currentTarget: board,
      clientX: 200,
      clientY: 200,
    });

    expect(page.placedPieces()).toHaveLength(1);
    expect(page.placedPieces()[0].pieceId).toBe('large-blue');
    expect(page.selectedPieceIsPlaced()).toBe(true);
  });

  it('rotates the active piece in both directions', () => {
    page.selectedPieceId.set('medium-yellow');

    page.rotateSelectedPiece(-1);
    expect(page.pieceRotation('medium-yellow')).toBe(315);

    page.rotateSelectedPiece(1);
    expect(page.pieceRotation('medium-yellow')).toBe(0);
  });

  it('keeps a piece inside the board and lets the player remove it', () => {
    page.selectedPieceId.set('large-blue');

    page.placeSelectedPiece({
      currentTarget: board,
      clientX: 0,
      clientY: 0,
    });

    const placedPiece = page.placedPieces()[0];
    const vertices = page.transformedVertices(
      page.getDefinition(placedPiece.pieceId),
      placedPiece.x,
      placedPiece.y,
      placedPiece.rotation,
    );

    expect(Math.min(...vertices.map((point: { x: number }) => point.x))).toBeGreaterThanOrEqual(0);
    expect(Math.min(...vertices.map((point: { y: number }) => point.y))).toBeGreaterThanOrEqual(0);

    page.returnSelectedPieceToTray();
    expect(page.placedPieces()).toHaveLength(0);
  });
});
