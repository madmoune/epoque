import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { formatCalculationSticks } from './calculation-sticks.logic';
import { CalculationSticksPage } from './calculation-sticks.page';

it('requires lifting the top stick, assembles the expression, and validates the result', () => {
  const markSolved = vi.fn();
  TestBed.configureTestingModule({
    imports: [CalculationSticksPage],
    providers: [provideRouter([]), { provide: PuzzlePlayHistoryService, useValue: { markSolved } }],
  });
  const fixture = TestBed.createComponent(CalculationSticksPage);
  const root = fixture.nativeElement as HTMLElement;
  fixture.detectChanges();
  const puzzle = fixture.componentInstance['puzzle']();

  function click(selector: string): void {
    root.querySelector<HTMLButtonElement>(selector)!.click();
    fixture.detectChanges();
  }

  click('[data-stick-id="1"]');
  expect(root.querySelectorAll('.stick')).toHaveLength(9);
  expect(root.querySelector('.feedback')?.textContent).toContain('passe au-dessus');
  click('[data-confirm-action="hint"]');
  expect(root.querySelector('.stick.hinted')?.getAttribute('data-stick-id')).toBe('0');
  expect(root.querySelector('input')).toBeNull();

  for (const { id } of puzzle.sticks) click(`[data-stick-id="${id}"]`);
  const expected = formatCalculationSticks(puzzle.sticks.map(({ symbol }) => symbol).join(''));
  expect(root.querySelector('.expression')?.textContent).toBe(expected);
  expect(root.querySelector('.stick-pile')).toBeNull();
  click('[data-confirm-action="hint"]');
  expect(root.querySelector('.hint')?.textContent).toContain(puzzle.product);

  const input = root.querySelector<HTMLInputElement>('input')!;
  const submit = (number: number) => {
    input.value = String(number);
    input.dispatchEvent(new Event('input'));
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  };
  submit(puzzle.answer + 1);
  expect(root.querySelector('.feedback')?.textContent).toContain('multiplication');
  expect(markSolved).not.toHaveBeenCalled();
  submit(puzzle.answer);
  expect(markSolved).toHaveBeenCalledExactlyOnceWith('/batonnets-de-calcul');
  expect(root.querySelector('[role="alert"]')?.textContent).toContain(
    `${expected} = ${puzzle.answer}`,
  );

  click('[role="alert"] button');
  expect(root.querySelectorAll('.stick')).toHaveLength(9);
  expect(root.querySelector('.calculation')).toBeNull();
  expect(fixture.componentInstance['puzzle']().answer).not.toBe(puzzle.answer);
});
