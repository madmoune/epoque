import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { MagicSquarePage } from './magic-square.page';

describe('MagicSquarePage', () => {
  it('places one to three given cells in 3×3 even when the center is tried first', () => {
    for (const expectedCount of [1, 2, 3]) {
      const page = new MagicSquarePage();
      page['setSize'](3);
      const randomInt = page['randomInt'].bind(page);
      page['randomInt'] = (min, max) =>
        min === 1 && max === 3 ? expectedCount : randomInt(min, max);
      page['shuffle'] = (items) => [...items.slice(4, 5), ...items.slice(0, 4), ...items.slice(5)];

      page['newPuzzle']();

      const { cells, lines } = page['puzzle']();
      expect(cells.flat().filter((cell) => cell.given)).toHaveLength(expectedCount);
      expect(lines.every((line) => line.filter((cell) => cell.given).length <= 1)).toBe(true);
    }
  });

  it('checks all ten lines of a 4×4 square, including both diagonals', () => {
    const page = new MagicSquarePage();
    page['setSize'](4);

    const { cells, numberBank, targetSum } = page['puzzle']();
    const allCells = cells.flat();
    const givenCells = allCells.filter((cell) => cell.given);
    const missingCells = allCells.filter((cell) => !cell.given);
    const solutionNumbers = new Set(allCells.map((cell) => cell.value));
    const distractors = numberBank.filter((number) => !solutionNumbers.has(number));

    expect(cells.map((row) => row.length)).toEqual([4, 4, 4, 4]);
    expect(givenCells.length).toBeGreaterThanOrEqual(4);
    expect(givenCells.length).toBeLessThanOrEqual(6);
    const firstNumber = (targetSum - 30) / 4;
    expect([...solutionNumbers].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, index) => firstNumber + index),
    );
    for (const { row, col, value } of allCells) {
      expect(value + cells[3 - row][3 - col].value).toBe(targetSum / 2);
    }
    expect(numberBank).toHaveLength(missingCells.length + 3);
    expect(new Set(distractors).size).toBe(3);
    expect(page['isSolved']()).toBe(false);

    for (const cell of missingCells) {
      page['selectCell'](cell.row, cell.col);
      page['placeNumber'](cell.value);
    }
    expect(page['lineStates']()).toEqual(Array(10).fill('correct'));
    expect(page['isSolved']()).toBe(true);

    const linesToCheck = [
      { cells: cells[3], state: () => page['rowState'](3) },
      { cells: cells.map((row) => row[3]), state: () => page['columnState'](3) },
      { cells: cells.map((row, index) => row[index]), state: () => page['diagonalState'](0) },
      { cells: cells.map((row, index) => row[3 - index]), state: () => page['diagonalState'](1) },
    ];

    for (const line of linesToCheck) {
      const cell = line.cells.find((cell) => !cell.given)!;
      page['selectCell'](cell.row, cell.col);
      page['placeNumber'](distractors[0]);
      expect(line.state()).toBe('wrong');
      expect(page['isSolved']()).toBe(false);
      page['placeNumber'](cell.value);
      expect(page['isSolved']()).toBe(true);
    }
  });

  it('switches sizes from the toolbar and keeps the active size for a new puzzle', () => {
    TestBed.configureTestingModule({ imports: [MagicSquarePage], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(MagicSquarePage);
    const page = fixture.componentInstance;
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const [small, large] = host.querySelectorAll<HTMLButtonElement>('.toolbar button');
    expect(large.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelectorAll('.number-cell')).toHaveLength(16);
    const guide = host.querySelector<HTMLDetailsElement>('.solution-guide');
    expect(guide?.querySelector('summary')?.textContent).toBe('Méthode de résolution');
    expect(guide?.open).toBe(false);

    small.click();
    fixture.detectChanges();
    expect(small.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelectorAll('.number-cell')).toHaveLength(9);
    expect(host.querySelector('.solution-guide')).toBeNull();

    large.click();
    fixture.detectChanges();
    expect(large.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelectorAll('.number-cell')).toHaveLength(16);
    expect(host.querySelector('.solution-guide')).not.toBeNull();
    const puzzle = page['puzzle']();
    host.querySelector<HTMLButtonElement>('[data-confirm-action="hint"]')!.click();
    expect(
      page['answers']()
        .flat()
        .some((answer) => answer !== null),
    ).toBe(true);

    host.querySelector<HTMLButtonElement>('[data-confirm-action="new-game"]')!.click();
    fixture.detectChanges();
    expect(page['puzzle']()).not.toBe(puzzle);
    expect(page['answers']()).toEqual(Array.from({ length: 4 }, () => Array(4).fill(null)));
    expect(host.querySelectorAll('.number-cell')).toHaveLength(16);

    small.click();
    fixture.detectChanges();
    expect(small.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelectorAll('.number-cell')).toHaveLength(9);
  });
});
