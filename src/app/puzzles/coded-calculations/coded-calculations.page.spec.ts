import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { CODED_DIGITS } from './coded-calculations.logic';
import { CodedCalculationsPage } from './coded-calculations.page';

describe('CodedCalculationsPage', () => {
  let fixture: ComponentFixture<CodedCalculationsPage>;
  let root: HTMLElement;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markSolved = vi.fn();
    await TestBed.configureTestingModule({
      imports: [CodedCalculationsPage],
      providers: [
        provideRouter([]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CodedCalculationsPage);
    fixture.componentInstance['secret'].set(CODED_DIGITS);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  function click(target: string): void {
    root.querySelector<HTMLButtonElement>(target)!.click();
    fixture.detectChanges();
  }

  function testCalculation(left: number, operator: '+' | '−', right: number): void {
    for (let index = 0; index < 3; index++) click(`[data-placement-cell="${index}"]`);
    click(`.symbol-token[data-drag-number="${left}"]`);
    click(operator === '+' ? '[aria-label="Addition"]' : '[aria-label="Soustraction"]');
    click(`.symbol-token[data-drag-number="${right}"]`);
  }

  function choose(index: number, digit: number): void {
    const select = root.querySelectorAll<HTMLSelectElement>('.digit-guess')[index];
    select.value = String(digit);
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  it('shows the test result, retains the history and treats reversed additions as the same test', () => {
    expect(root.querySelector('.test-button')).toBeNull();
    expect(root.querySelector('.test-result')?.classList.contains('invalid')).toBe(false);
    testCalculation(0, '+', 1);
    expect(root.querySelector('.test-result')?.textContent).toContain('🎾');
    expect(root.querySelectorAll('.history li')).toHaveLength(1);
    testCalculation(1, '+', 0);
    expect(root.querySelector('.feedback')?.textContent).toContain('déjà été testé');
    expect(root.querySelectorAll('.history li')).toHaveLength(1);

    testCalculation(1, '−', 0);
    expect(root.querySelector('.test-result')?.textContent).toContain('⚽');
    testCalculation(0, '−', 1);
    expect(root.querySelector('.test-result')?.classList.contains('invalid')).toBe(true);
    expect(root.querySelector('.trial-count')?.textContent).toContain('3 / 13');
  });

  it('caps the history at thirteen tests and still accepts guesses after the limit', () => {
    for (let right = 1; right < 8; right++) testCalculation(0, '+', right);
    for (let right = 1; right < 7; right++) testCalculation(0, '−', right);
    expect(root.querySelectorAll('.history li')).toHaveLength(13);
    expect(root.querySelector<HTMLButtonElement>('.test-button')).toBeNull();
    expect(root.querySelector<HTMLSelectElement>('.digit-guess')?.disabled).toBe(false);

    CODED_DIGITS.slice(0, -1).forEach((digit, index) => choose(index, digit));
    choose(7, 1);
    expect(root.querySelector('.feedback')?.textContent).toContain('une seule fois');
    expect(markSolved).not.toHaveBeenCalled();
    choose(7, 8);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Code déchiffré');
    expect(markSolved).toHaveBeenCalledExactlyOnceWith('/calcul-code');

    click('[role="alert"] button');
    expect(fixture.componentInstance['secret']()).not.toEqual(CODED_DIGITS);
    expect(root.querySelector('.history')).toBeNull();
    expect(root.querySelector('.trial-count')?.textContent).toContain('0 / 13');
    expect(
      [...root.querySelectorAll<HTMLSelectElement>('.digit-guess')].every(
        (select) => select.value === '',
      ),
    ).toBe(true);
  });
});
