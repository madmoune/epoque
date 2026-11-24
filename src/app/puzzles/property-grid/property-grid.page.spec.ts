import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import {
  findPropertyGridSolution,
  PROPERTY_GRID_CELLS,
  propertyGridRules,
} from './property-grid.logic';
import { PropertyGridPage } from './property-grid.page';

describe('PropertyGridPage', () => {
  let fixture: ComponentFixture<PropertyGridPage>;
  let root: HTMLElement;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markSolved = vi.fn();
    await TestBed.configureTestingModule({
      imports: [PropertyGridPage],
      providers: [
        provideRouter([]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PropertyGridPage);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  function cell(index: number): HTMLButtonElement {
    return root.querySelectorAll<HTMLButtonElement>('.grid-slot')[index];
  }

  function token(value: number): HTMLButtonElement {
    return [...root.querySelectorAll<HTMLButtonElement>('.number-token')].find(
      (button) => Number(button.textContent) === value,
    )!;
  }

  function click(button: HTMLButtonElement): void {
    button.click();
    fixture.detectChanges();
  }

  it('shows a placement conflict, swaps existing numbers and returns a number to the reserve', () => {
    const puzzle = fixture.componentInstance['puzzle']();
    const cellIndex = PROPERTY_GRID_CELLS.find((index) =>
      puzzle.numbers.some((number) =>
        propertyGridRules(puzzle, index).some((rule) => !rule.accepts(number)),
      ),
    )!;
    const cellRules = propertyGridRules(puzzle, cellIndex);
    const wrongNumber = puzzle.numbers.find((number) =>
      cellRules.some((rule) => !rule.accepts(number)),
    )!;
    const wrongRule = cellRules.find((rule) => !rule.accepts(wrongNumber))!;
    click(token(wrongNumber));
    click(cell(cellIndex));
    expect(cell(cellIndex).classList.contains('conflict')).toBe(true);
    expect(root.querySelector('[role="status"]')?.textContent).toContain(wrongRule.label);
    expect(token(wrongNumber).disabled).toBe(true);

    const otherCell = (cellIndex + 1) % 9;
    const otherNumber = puzzle.numbers.find((number) => number !== wrongNumber)!;
    click(token(otherNumber));
    click(cell(otherCell));
    click(cell(otherCell));
    click(cell(cellIndex));
    expect(cell(cellIndex).getAttribute('aria-label')).toContain(`nombre ${otherNumber}.`);
    expect(cell(otherCell).getAttribute('aria-label')).toContain(`nombre ${wrongNumber}.`);
    click(cell(cellIndex));
    click(cell(cellIndex));
    expect(token(otherNumber).disabled).toBe(false);
    expect(markSolved).not.toHaveBeenCalled();
  });

  it('solves through clicks and a drop, then starts a grid with different numbers and rules', () => {
    const page = fixture.componentInstance;
    const first = page['puzzle']();
    const solution = findPropertyGridSolution(first, page['placed']())!;
    const source = token(solution[0]);
    const point = (type: string, coordinate: number) => {
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
    const originalHitTest = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: () => cell(0),
    });
    try {
      point('pointerdown', 10);
      point('pointermove', 30);
      expect(root.querySelector('.drag-preview')?.textContent).toContain(String(solution[0]));
      point('pointercancel', 30);
      expect(root.querySelector('.drag-preview')).toBeNull();
      expect(cell(0).classList.contains('filled')).toBe(false);

      point('pointerdown', 10);
      point('pointerup', 100);
    } finally {
      if (originalHitTest) Object.defineProperty(document, 'elementFromPoint', originalHitTest);
      else Reflect.deleteProperty(document, 'elementFromPoint');
    }
    expect(cell(0).getAttribute('aria-label')).toContain(`nombre ${solution[0]}.`);

    solution.slice(1).forEach((number, index) => {
      click(token(number));
      click(cell(index + 1));
    });
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Grille complétée');
    expect(markSolved).toHaveBeenCalledExactlyOnceWith('/grille-proprietes');

    click(root.querySelector<HTMLButtonElement>('[role="alert"] button')!);
    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(root.querySelectorAll('.grid-slot.filled')).toHaveLength(0);
    const second = page['puzzle']();
    expect(second.numbers).not.toEqual(first.numbers);
    expect(second.rows.map(({ id }) => id).sort()).not.toEqual(
      first.rows.map(({ id }) => id).sort(),
    );
    expect(second.columns.map(({ id }) => id).sort()).not.toEqual(
      first.columns.map(({ id }) => id).sort(),
    );
  });
});
