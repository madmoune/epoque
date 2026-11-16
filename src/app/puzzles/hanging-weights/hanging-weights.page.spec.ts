import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { HangingWeightsPage } from './hanging-weights.page';
import { HangingWeightsService } from './hanging-weights.service';

describe('HangingWeightsPage mobile keyboard', () => {
  it('reopens the keyboard on the same input when it still has focus', async () => {
    const puzzle = new HangingWeightsService().createPuzzle('classic', 'values');

    await TestBed.configureTestingModule({
      imports: [HangingWeightsPage],
      providers: [
        provideRouter([]),
        { provide: HangingWeightsService, useValue: { createPuzzle: () => puzzle } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HangingWeightsPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('.unknown-node input')!;

    input.focus();
    fixture.detectChanges();
    expect(root.querySelector('.custom-keyboard')).not.toBeNull();

    root.querySelector('.mobile-figure')!.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }),
    );
    fixture.detectChanges();
    expect(root.querySelector('.custom-keyboard')).toBeNull();
    expect(document.activeElement).toBe(input);

    input.click();
    fixture.detectChanges();
    const firstKey = root.querySelector<HTMLButtonElement>('.custom-keyboard button')!;
    expect(firstKey).not.toBeNull();
    firstKey.click();
    fixture.detectChanges();
    expect(input.value).toBe('1');
  });
});

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
