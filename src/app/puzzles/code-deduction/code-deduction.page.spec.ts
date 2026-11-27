import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { CodeDeductionPage } from './code-deduction.page';

describe('CodeDeductionPage digit marking', () => {
  it('cycles a digit through barred, selected and free in every clue', async () => {
    await TestBed.configureTestingModule({
      imports: [CodeDeductionPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(CodeDeductionPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const firstDigitButton = root.querySelector<HTMLButtonElement>('.digit-toggle');
    const answerInputs = root.querySelectorAll<HTMLInputElement>('.code-answer');

    expect(firstDigitButton).not.toBeNull();
    expect(answerInputs).toHaveLength(4);

    const digit = firstDigitButton!.dataset['digit']!;
    const digitButtons = () =>
      root.querySelectorAll<HTMLButtonElement>(`.digit-toggle[data-digit="${digit}"]`);

    firstDigitButton!.click();
    fixture.detectChanges();
    expect([...digitButtons()].every((button) => button.classList.contains('is-excluded'))).toBe(
      true,
    );
    expect([...digitButtons()].every((button) => button.dataset['state'] === 'excluded')).toBe(
      true,
    );

    firstDigitButton!.click();
    fixture.detectChanges();
    expect([...digitButtons()].every((button) => button.classList.contains('is-selected'))).toBe(
      true,
    );
    expect([...digitButtons()].every((button) => button.dataset['state'] === 'selected')).toBe(
      true,
    );
    expect(root.querySelector<HTMLInputElement>('#code-answer-0')?.value).toBe(digit);

    firstDigitButton!.click();
    fixture.detectChanges();
    expect([...digitButtons()].every((button) => button.dataset['state'] === 'free')).toBe(true);
    expect(root.querySelector('.digit-toggle.is-excluded')).toBeNull();
    expect(root.querySelector('.digit-toggle.is-selected')).toBeNull();
    expect(root.querySelector<HTMLInputElement>('#code-answer-0')?.value).toBe('');

    firstDigitButton!.click();
    root.querySelector<HTMLButtonElement>('[data-confirm-action="restart"]')!.click();
    fixture.detectChanges();
    expect(root.querySelector('.digit-toggle.is-excluded')).toBeNull();
  });

  it('validates automatically when the four answer inputs are filled', async () => {
    await TestBed.configureTestingModule({
      imports: [CodeDeductionPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(CodeDeductionPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const page = fixture.componentInstance as unknown as {
      puzzle: () => { solution: string };
    };
    const answerInputs = [...root.querySelectorAll<HTMLInputElement>('.code-answer')];

    page
      .puzzle()
      .solution.split('')
      .forEach((digit, index) => {
        answerInputs[index].value = digit;
        answerInputs[index].dispatchEvent(new Event('input', { bubbles: true }));
        fixture.detectChanges();
      });

    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Code trouvé');
  });
});
