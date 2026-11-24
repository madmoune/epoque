import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { ShuntingPage } from './shunting.page';

describe('ShuntingPage', () => {
  let fixture: ComponentFixture<ShuntingPage>;
  let root: HTMLElement;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markSolved = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ShuntingPage],
      providers: [
        provideRouter([]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ShuntingPage);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  function click(selector: string): void {
    root.querySelector<HTMLButtonElement>(selector)!.click();
    fixture.detectChanges();
  }

  function dragTrain(stop: number, finish: 'pointerup' | 'pointercancel' = 'pointerup'): void {
    const source = root.querySelector<HTMLButtonElement>('.train')!;
    const target = root.querySelector<HTMLButtonElement>(`.stop[data-shunt-stop="${stop}"]`)!;
    const hitTest = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: () => target,
    });
    try {
      const send = (type: string, coordinate: number) => {
        source.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            pointerId: 1,
            pointerType: 'touch',
            button: 0,
            clientX: coordinate,
            clientY: coordinate,
          }),
        );
        fixture.detectChanges();
      };
      send('pointerdown', 10);
      send('pointermove', 75);
      expect(root.querySelector('.dragged-train')?.textContent).toContain('A');
      send(finish, 75);
      expect(root.querySelector('.dragged-train')).toBeNull();
    } finally {
      if (hitTest) Object.defineProperty(document, 'elementFromPoint', hitTest);
      else Reflect.deleteProperty(document, 'elementFromPoint');
    }
  }

  it('clicks on-board switches and drops only on reachable stops', () => {
    const page = fixture.componentInstance;
    page['state'].set({ positions: [6, 0, 9, 21], switches: 0 });
    fixture.detectChanges();
    dragTrain(12);
    expect(page['state']().positions[0]).toBe(6);
    expect(root.querySelector('[role="status"]')?.textContent).toContain('aiguillages');

    click('.switch-toggle[aria-label^="Aiguillage 1,"]');
    click('.switch-toggle[aria-label^="Aiguillage 2,"]');
    expect(root.querySelectorAll('.switch-toggle[aria-pressed="true"]')).toHaveLength(2);
    expect(root.querySelectorAll('.open-branch')).toHaveLength(1);
    dragTrain(12, 'pointercancel');
    expect(page['state']().positions[0]).toBe(6);
    dragTrain(12);
    expect(page['state']().positions[0]).toBe(12);
    click('.game-actions button:first-child');
    expect(page['state']()).toEqual({ positions: [6, 0, 9, 21], switches: 3 });
  });

  it('completes and records the triage only when all trains reach their own bay', () => {
    const page = fixture.componentInstance;
    page['state'].set({ positions: [12, 15, 17, 18], switches: 0 });
    fixture.detectChanges();
    expect(root.querySelector('[role="alert"]')).toBeNull();
    dragTrain(14);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Les quatre trains');
    expect(markSolved).toHaveBeenCalledExactlyOnceWith('/triage-ferroviaire');
    click('.game-actions button:first-child');
    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(page['state']().positions[0]).toBe(12);
  });
});
