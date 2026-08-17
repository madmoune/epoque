import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { WeightDeductionPage } from './weight-deduction.page';
import { WeightDeductionService } from './weight-deduction.service';

describe('WeightDeductionPage', () => {
  it('updates the balance relation whenever a piece is added or removed', () => {
    const injector = Injector.create({ providers: [WeightDeductionService] });
    const page = runInInjectionContext(injector, () => new WeightDeductionPage()) as any;
    const stonePieces = page
      .pieces()
      .filter((piece: any) => piece.token.kind === 'stone')
      .filter(
        (piece: any, index: number, pieces: any[]) =>
          pieces.findIndex((candidate) => candidate.token.stoneId === piece.token.stoneId) ===
          index,
      );
    const [leftPiece, rightPiece] = stonePieces;

    page.selectPiece(leftPiece.id);
    page.placeSelected('left');
    expect(page.currentResult()).toBe('left-heavier');

    page.selectPiece(rightPiece.id);
    page.placeSelected('right');

    const leftWeight = page.puzzle().solution[leftPiece.token.stoneId];
    const rightWeight = page.puzzle().solution[rightPiece.token.stoneId];
    const expectedRelation =
      leftWeight === rightWeight
        ? 'balanced'
        : leftWeight > rightWeight
          ? 'left-heavier'
          : 'right-heavier';

    expect(page.currentResult()).toBe(expectedRelation);

    const leftUsage = page.leftPieces()[0];
    page.selectPiece(leftUsage.id);
    page.placeSelected('tray');
    expect(page.currentResult()).toBe('right-heavier');

    page.clearScale();
    expect(page.currentResult()).toBeNull();
  });

  it('keeps a custom order for pieces in the tray', () => {
    const injector = Injector.create({ providers: [WeightDeductionService] });
    const page = runInInjectionContext(injector, () => new WeightDeductionPage()) as any;
    const initialTrayIds = page.trayPieces().map((piece: any) => piece.id);
    const movedPieceId = initialTrayIds[0];

    page.movePiece(movedPieceId, 'tray', initialTrayIds.length);

    expect(page.trayPieces().map((piece: any) => piece.id)).toEqual([
      ...initialTrayIds.slice(1),
      movedPieceId,
    ]);
  });

  it('removes only the selected stone from the balance', () => {
    const injector = Injector.create({ providers: [WeightDeductionService] });
    const page = runInInjectionContext(injector, () => new WeightDeductionPage()) as any;
    const [leftPiece, rightPiece] = page.trayPieces();

    page.selectPiece(leftPiece.id);
    page.placeSelected('left');
    page.selectPiece(rightPiece.id);
    page.placeSelected('right');

    page.removePiece(page.leftPieces()[0].id);

    expect(page.leftPieces()).toHaveLength(0);
    expect(page.rightPieces()).toHaveLength(1);
    expect(page.trayPieces()).toHaveLength(page.puzzle().stones.length);
  });

  it('empties one pan without clearing the other one', () => {
    const injector = Injector.create({ providers: [WeightDeductionService] });
    const page = runInInjectionContext(injector, () => new WeightDeductionPage()) as any;
    const [leftPiece, rightPiece] = page.trayPieces();

    page.selectPiece(leftPiece.id);
    page.placeSelected('left');
    page.selectPiece(rightPiece.id);
    page.placeSelected('right');

    page.clearPan('left');

    expect(page.leftPieces()).toHaveLength(0);
    expect(page.rightPieces()).toHaveLength(1);
    expect(page.trayPieces()).toHaveLength(page.puzzle().stones.length);
  });

  it('keeps one reserve stone per color and reuses it infinitely', () => {
    const service = new WeightDeductionService();
    const injector = Injector.create({
      providers: [{ provide: WeightDeductionService, useValue: service }],
    });
    const page = runInInjectionContext(injector, () => new WeightDeductionPage()) as any;

    page.puzzle.set(service.createPuzzle('repeated-colors'));
    page.resetPuzzle();

    const reservePiece = page.trayPieces()[0];
    const reserveCount = page.trayPieces().length;

    page.selectPiece(reservePiece.id);
    page.placeSelected('left');
    page.selectPiece(reservePiece.id);
    page.placeSelected('right');
    page.selectPiece(reservePiece.id);
    page.placeSelected('left');

    expect(page.trayPieces().length).toBe(reserveCount);
    expect(page.leftPieces().length).toBe(2);
    expect(page.rightPieces().length).toBe(1);

    const matchingPieces = page
      .stonePieces()
      .filter((piece: any) => piece.token.stoneId === reservePiece.token.stoneId);
    const select = document.createElement('select');
    const option = document.createElement('option');
    option.value = String(page.puzzle().allowedWeights[0]);
    select.append(option);
    select.value = option.value;
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: select });

    page.updateAnswer(reservePiece.id, event);

    expect(matchingPieces.every((piece: any) => page.answerFor(piece.id) === option.value)).toBe(
      true,
    );

    page.clearScale();
    expect(page.leftPieces()).toHaveLength(0);
    expect(page.rightPieces()).toHaveLength(0);
    expect(page.trayPieces()).toHaveLength(reserveCount);
  });

  it('validates the attribution automatically after the last answer changes', () => {
    const injector = Injector.create({ providers: [WeightDeductionService] });
    const page = runInInjectionContext(injector, () => new WeightDeductionPage()) as any;

    for (const piece of page.stonePieces()) {
      const select = document.createElement('select');
      const option = document.createElement('option');
      option.value = String(page.puzzle().solution[piece.token.stoneId]);
      select.append(option);
      select.value = option.value;

      const event = new Event('change');
      Object.defineProperty(event, 'target', { value: select });
      page.updateAnswer(piece.id, event);
    }

    expect(page.isSolved()).toBe(true);
  });
});
