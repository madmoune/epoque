import '@angular/compiler';
import { beforeEach, describe, expect, it } from 'vitest';
import { CornerCubePage } from './corner-cube.page';

describe('CornerCubePage', () => {
  let page: any;

  beforeEach(() => {
    page = new CornerCubePage() as any;
  });

  it('recognizes the canonical solved placement', () => {
    page.placedPieces.set(
      page.positions.map((position: any) => ({
        pieceId: position.id,
        positionId: position.id,
        anchorFace: position.faces[0],
      })),
    );

    expect(page.isSolved()).toBe(true);
  });

  it('moves a selected piece instead of duplicating it', () => {
    const firstPosition = page.positions[0];
    const secondPosition = page.positions[1];

    page.placedPieces.set([
      {
        pieceId: firstPosition.id,
        positionId: firstPosition.id,
        anchorFace: firstPosition.faces[0],
      },
    ]);
    page.selectedPieceId.set(firstPosition.id);

    page.placeSelectedPieceAtPosition(secondPosition.id, secondPosition.faces[0]);

    expect(page.placedPieces()).toEqual([
      {
        pieceId: firstPosition.id,
        positionId: secondPosition.id,
        anchorFace: secondPosition.faces[0],
      },
    ]);
  });
});
