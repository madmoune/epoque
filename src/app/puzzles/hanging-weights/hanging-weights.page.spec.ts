import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { HangingWeightsPage } from './hanging-weights.page';
import { HangingWeightsService } from './hanging-weights.service';

describe('HangingWeightsPage placement mode', () => {
  it('places every available weight and solves the mobile', () => {
    const service = new HangingWeightsService();
    const injector = Injector.create({
      providers: [{ provide: HangingWeightsService, useValue: service }],
    });
    const page = runInInjectionContext(injector, () => new HangingWeightsPage()) as any;

    page.puzzle.set(service.createPuzzle('classic', 'placement'));
    page.resetPuzzle();

    expect(page.isPlacementMode()).toBe(true);
    expect(page.availablePlacementWeights()).toHaveLength(page.puzzle().weights.length);

    for (const weight of page.puzzle().weights) {
      page.selectPlacementWeight(weight.id);
      page.placeSelectedPlacementWeight(weight.id);
    }

    expect(page.allPlaced()).toBe(true);
    expect(page.isSolved()).toBe(true);
  });
});
