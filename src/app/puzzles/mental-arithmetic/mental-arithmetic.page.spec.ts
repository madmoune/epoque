import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { MentalArithmeticPage } from './mental-arithmetic.page';

describe('MentalArithmeticPage routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates a quick calculation and offers the next one', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/quick-arithmetic', MentalArithmeticPage);
    const page = harness.routeNativeElement!;

    expect(page.querySelector('h1')?.textContent).toBe('Calcul rapide');
    expect(page.querySelector('.pedmas-guide')).toBeNull();
    expect(page.querySelector('.problem')?.textContent?.trim()).toBe('55 × 6');

    const input = page.querySelector<HTMLInputElement>('.answer-input')!;
    input.value = '331';
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(page.querySelector('app-puzzle-success-popup')).toBeNull();

    input.value = '330';
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
    const next = page.querySelector<HTMLButtonElement>('app-puzzle-success-popup .primary-action')!;
    expect(next.textContent?.trim()).toBe('Prochain calcul');

    random.mockReturnValue(0.95);
    next.click();
    harness.detectChanges();
    expect(input.value).toBe('');
    expect(page.querySelector('.problem')?.textContent?.trim()).toBe('95 × 955');
  });

  it('keeps the PEDMAS game on its own route', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/mental-arithmetic', MentalArithmeticPage);
    const page = harness.routeNativeElement!;

    expect(page.querySelector('h1')?.textContent).toBe('Arithmétique mentale');
    expect(page.querySelector('.pedmas-guide')).not.toBeNull();
    expect(page.querySelector('.problem .katex')).not.toBeNull();
  });
});
