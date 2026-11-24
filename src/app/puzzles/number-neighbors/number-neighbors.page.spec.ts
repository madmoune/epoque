import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { canSitTogether, findSeatingSolution } from './number-neighbors.logic';
import { NumberNeighborsPage } from './number-neighbors.page';

describe('NumberNeighborsPage', () => {
  let fixture: ComponentFixture<NumberNeighborsPage>;
  let root: HTMLElement;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markSolved = vi.fn();
    await TestBed.configureTestingModule({
      imports: [NumberNeighborsPage],
      providers: [
        provideRouter([]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NumberNeighborsPage);
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  function chair(index: number): HTMLButtonElement {
    return root.querySelectorAll<HTMLButtonElement>('button.chair')[index];
  }

  function selectNumber(number: number): void {
    const tile = [...root.querySelectorAll<HTMLButtonElement>('.number-token')].find(
      (button) => Number(button.textContent?.trim()) === number,
    )!;
    tile.click();
    fixture.detectChanges();
  }

  function place(number: number, index: number): void {
    selectNumber(number);
    chair(index).click();
    fixture.detectChanges();
  }

  it('reports a diagonal conflict and lets players swap or remove a number', () => {
    const page = fixture.componentInstance;
    const puzzle = page['puzzle']();
    const { chairs } = puzzle.layout;
    const firstSeat = chairs.findIndex((seat) =>
      chairs.some(
        (other) =>
          Math.abs(seat.row - other.row) === 1 && Math.abs(seat.column - other.column) === 1,
      ),
    );
    const otherSeat = chairs.findIndex(
      (seat) =>
        Math.abs(seat.row - chairs[firstSeat].row) === 1 &&
        Math.abs(seat.column - chairs[firstSeat].column) === 1,
    );
    const first = puzzle.numbers.find((n) =>
      puzzle.numbers.some((m) => !canSitTogether(puzzle.rule, n, m)),
    )!;
    const other = puzzle.numbers.find((n) => !canSitTogether(puzzle.rule, first, n))!;

    place(first, firstSeat);
    place(other, otherSeat);
    expect(root.querySelectorAll('button.chair.conflict')).toHaveLength(2);
    expect(root.querySelector('.conflict-feedback')?.textContent).toContain('un nombre premier');
    expect(markSolved).not.toHaveBeenCalled();

    chair(firstSeat).click();
    fixture.detectChanges();
    chair(otherSeat).click();
    fixture.detectChanges();
    expect(page['placements']()[firstSeat]).toBe(other);
    expect(page['placements']()[otherSeat]).toBe(first);

    chair(otherSeat).click();
    fixture.detectChanges();
    chair(otherSeat).click();
    fixture.detectChanges();
    expect(page['placements']()[otherSeat]).toBeNull();
    expect(root.querySelector('.conflict-feedback')).toBeNull();
  });

  it('starts a chosen variant, places a hint and completes by placing the remaining numbers', () => {
    const page = fixture.componentInstance;
    const picker = root.querySelector<HTMLSelectElement>('#neighbor-rule')!;
    picker.value = 'multiple-of-five';
    picker.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const puzzle = page['puzzle']();

    expect(puzzle.rule).toBe('multiple-of-five');
    root.querySelector<HTMLButtonElement>('[data-confirm-action="hint"]')!.click();
    fixture.detectChanges();
    expect(page['placedCount']()).toBe(1);
    const solution = findSeatingSolution(puzzle, page['placements']())!;
    solution.forEach((number, i) => {
      if (page['placements']()[i] === null) place(number, i);
    });

    expect(root.querySelector('app-puzzle-success-popup')?.textContent).toContain(
      'Tout le monde est assis',
    );
    expect(markSolved).toHaveBeenCalledExactlyOnceWith('/voisins-numerotes');
  });
});
