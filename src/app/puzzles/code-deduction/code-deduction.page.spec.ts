import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { CodeDeductionPage } from './code-deduction.page';

describe('CodeDeductionPage digit marking', () => {
  it('strikes the selected digit in every clue and toggles it back', async () => {
    await TestBed.configureTestingModule({
      imports: [CodeDeductionPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(CodeDeductionPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const firstDigitButton = root.querySelector<HTMLButtonElement>('.digit-toggle');

    expect(firstDigitButton).not.toBeNull();

    const digit = firstDigitButton!.dataset['digit']!;
    const digitButtons = () =>
      root.querySelectorAll<HTMLButtonElement>(`.digit-toggle[data-digit="${digit}"]`);

    firstDigitButton!.click();
    fixture.detectChanges();
    expect([...digitButtons()].every((button) => button.classList.contains('is-excluded'))).toBe(
      true,
    );

    firstDigitButton!.click();
    fixture.detectChanges();
    expect([...digitButtons()].some((button) => button.classList.contains('is-excluded'))).toBe(
      false,
    );

    firstDigitButton!.click();
    root.querySelector<HTMLButtonElement>('[data-confirm-action="restart"]')!.click();
    fixture.detectChanges();
    expect(root.querySelector('.digit-toggle.is-excluded')).toBeNull();
  });
});
