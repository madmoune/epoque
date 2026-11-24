import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { triangleSums } from './magic-triangle.logic';
import { MagicTrianglePage } from './magic-triangle.page';

describe('MagicTrianglePage', () => {
  let fixture: ComponentFixture<MagicTrianglePage>;
  let root: HTMLElement;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markSolved = vi.fn();
    await TestBed.configureTestingModule({
      imports: [MagicTrianglePage],
      providers: [
        provideRouter([]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MagicTrianglePage);
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  function digitButton(digit: number): HTMLButtonElement {
    return [...root.querySelectorAll<HTMLButtonElement>('button.digit')].find(
      (button) => Number(button.textContent) === digit,
    )!;
  }

  function slot(index: number): HTMLButtonElement {
    return root.querySelectorAll<HTMLButtonElement>('.triangle-slot')[index];
  }

  function place(digit: number, index: number): void {
    digitButton(digit).click();
    fixture.detectChanges();
    slot(index).click();
    fixture.detectChanges();
  }

  it('shows unequal totals and accepts an arrangement with a different common sum', () => {
    const { digits, solutions } = fixture.componentInstance['puzzle']();
    digits.forEach(place);
    expect(root.querySelector('.feedback')?.textContent).toContain('Les sommes diffèrent');
    expect(markSolved).not.toHaveBeenCalled();

    root.querySelector<HTMLButtonElement>('[data-confirm-action="restart"]')!.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.triangle-slot.filled')).toHaveLength(0);
    const [firstSum] = triangleSums(solutions[0]);
    const alternative = solutions.find((solution) => triangleSums(solution)[0] !== firstSum)!;
    const [wantedSum] = triangleSums(alternative);
    alternative.forEach(place);

    expect(
      [...root.querySelectorAll('.side-sum dd')].map((sum) => Number(sum.textContent)),
    ).toEqual([wantedSum, wantedSum, wantedSum]);
    expect(root.querySelector('app-puzzle-success-popup')?.textContent).toContain(
      'Triangle équilibré',
    );
    expect(markSolved).toHaveBeenCalledExactlyOnceWith('/triangle-magique');
  });

  it('uses the same placement for dragging and selecting, and removes the digit on a second selection', () => {
    const { digits } = fixture.componentInstance['puzzle']();
    const digit = digits[0];
    const data = new Map<string, string>();
    const transfer = {
      setData: (type: string, value: string) => data.set(type, value),
      getData: (type: string) => data.get(type) ?? '',
      get types() {
        return [...data.keys()];
      },
    };
    const drag = (target: HTMLElement, type: string) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: transfer });
      target.dispatchEvent(event);
      fixture.detectChanges();
      return event;
    };

    drag(digitButton(digit), 'dragstart');
    expect(drag(slot(0), 'dragover').defaultPrevented).toBe(true);
    drag(slot(0), 'drop');
    expect(Number(slot(0).textContent)).toBe(digit);

    const other = digits[1];
    place(other, 1);
    slot(0).click();
    fixture.detectChanges();
    slot(1).click();
    fixture.detectChanges();
    expect(Number(slot(0).textContent)).toBe(other);
    expect(Number(slot(1).textContent)).toBe(digit);

    slot(1).click();
    fixture.detectChanges();
    slot(1).click();
    fixture.detectChanges();
    expect(slot(1).classList.contains('filled')).toBe(false);
  });
});
