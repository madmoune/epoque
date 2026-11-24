import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { OperationGridPage } from './operation-grid.page';

describe('OperationGridPage', () => {
  let fixture: ComponentFixture<OperationGridPage>;
  let root: HTMLElement;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markSolved = vi.fn();
    await TestBed.configureTestingModule({
      imports: [OperationGridPage],
      providers: [
        provideRouter([]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(OperationGridPage);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  function cell(index: number): HTMLButtonElement {
    return root.querySelector<HTMLButtonElement>(`[data-placement-cell="${index}"]`)!;
  }

  function token(digit: number): HTMLButtonElement {
    return root.querySelectorAll<HTMLButtonElement>('.number-token')[digit - 1];
  }

  function click(button: HTMLButtonElement): void {
    button.click();
    fixture.detectChanges();
  }

  it('guards the fixed digits, flags an incorrect calculation and restores the clues on restart', () => {
    const puzzle = fixture.componentInstance['puzzle']();
    const fixed = puzzle.givens.findIndex((value) => value !== null);
    const empty = puzzle.givens.indexOf(null);
    const other = puzzle.givens.findIndex(
      (value, index) => value === null && index % 3 !== empty % 3,
    );
    const wrongDigit = puzzle.solution[other];

    click(token(wrongDigit));
    click(cell(fixed));
    expect(cell(fixed).disabled).toBe(true);
    expect(cell(fixed).textContent?.trim()).toBe(String(puzzle.solution[fixed]));
    click(cell(empty));
    expect(token(wrongDigit).disabled).toBe(true);

    const column = empty % 3;
    for (const index of [column, column + 3, column + 6]) {
      if (index === empty || puzzle.givens[index] !== null) continue;
      click(token(puzzle.solution[index]));
      click(cell(index));
    }
    expect(root.querySelectorAll('.column-equals')[column].classList.contains('incorrect')).toBe(
      true,
    );
    expect(root.querySelector('.feedback')?.textContent).toContain(`colonne ${column + 1}`);

    click(root.querySelector<HTMLButtonElement>('[data-confirm-action="hint"]')!);
    expect(root.querySelector('.feedback')?.textContent).toContain(
      `Déplace le chiffre ${wrongDigit}`,
    );
    expect(markSolved).not.toHaveBeenCalled();

    click(root.querySelector<HTMLButtonElement>('[data-confirm-action="restart"]')!);
    expect(fixture.componentInstance['placed']()).toEqual(puzzle.givens);
  });

  it('solves the grid using clicks and starts a different set of operations from the success popup', () => {
    const page = fixture.componentInstance;
    const first = page['puzzle']();
    for (const [index, number] of first.solution.entries()) {
      if (first.givens[index] !== null) continue;
      click(token(number));
      click(cell(index));
    }
    expect(root.querySelectorAll('.sign.correct')).toHaveLength(4);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Grille complétée');
    expect(markSolved).toHaveBeenCalledExactlyOnceWith('/grille-operations');

    click(root.querySelector<HTMLButtonElement>('[role="alert"] button')!);
    const second = page['puzzle']();
    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(page['placed']()).toEqual(second.givens);
    expect([second.columns, second.bottom]).not.toEqual([first.columns, first.bottom]);
  });
});
