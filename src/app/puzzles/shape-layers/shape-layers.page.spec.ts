import '@angular/compiler';
import { beforeEach, describe, expect, it } from 'vitest';
import { ShapeLayersPage } from './shape-layers.page';

describe('ShapeLayersPage', () => {
  let page: any;

  beforeEach(() => {
    page = new ShapeLayersPage() as any;
  });

  it('accepts the generated solution as solved', () => {
    page.pieces.set(page.solution().map((piece: any) => ({ ...piece })));

    expect(page.isSolved()).toBe(true);
  });

  it('matches the diagonal accent triangle used by the board', () => {
    const isInsideAccent = (x: number, y: number): boolean =>
      page.isInsideAccent('diagonal', x, y);

    expect(isInsideAccent(0.3, -0.3)).toBe(true);
    expect(isInsideAccent(0.1, -0.1)).toBe(false);
    expect(isInsideAccent(-0.1, -0.4)).toBe(false);
  });

  it('moves a selected piece up and down in the stack', () => {
    const placedPieces = page.solution().slice(0, 3).map((piece: any) => ({ ...piece }));
    page.pieces.set(placedPieces);
    page.selectPiece(placedPieces[0].id);

    page.changeLayer(1);

    expect(page.pieces().map((piece: any) => piece.id)).toEqual([
      placedPieces[1].id,
      placedPieces[0].id,
      placedPieces[2].id,
    ]);
    expect(page.selectedPieceId()).toBe(placedPieces[0].id);
    expect(page.canChangeLayer(-1)).toBe(true);

    page.changeLayer(-1);

    expect(page.pieces().map((piece: any) => piece.id)).toEqual([
      placedPieces[0].id,
      placedPieces[1].id,
      placedPieces[2].id,
    ]);
  });

  it('disables layer movement at the ends of the stack', () => {
    const placedPieces = page.solution().slice(0, 2).map((piece: any) => ({ ...piece }));
    page.pieces.set(placedPieces);
    page.selectPiece(placedPieces[0].id);

    expect(page.canChangeLayer(-1)).toBe(false);
    expect(page.canChangeLayer(1)).toBe(true);

    page.selectPiece(placedPieces[1].id);

    expect(page.canChangeLayer(1)).toBe(false);
    expect(page.canChangeLayer(-1)).toBe(true);
  });
});
