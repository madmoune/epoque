import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { NewGamesPage } from './new-games.page';

describe('Cryptarithm versions', () => {
  async function createPage(game: 'cryptarithms') {
    await TestBed.configureTestingModule({
      imports: [NewGamesPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { game } } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NewGamesPage);
    fixture.detectChanges();
    return fixture;
  }

  it.each(['deduction', 'classic'] as const)(
    'preserves hints through reset and recognizes completion in %s mode',
    async (mode) => {
      const fixture = await createPage('cryptarithms');
      const page = fixture.componentInstance;
      page['setCryptarithmMode'](mode);
      page['showHint']();
      const fixed = { ...page['digitEntries']() };
      const locked = [...page['lockedKeys']()];
      page['resetPuzzle']();
      expect(page['digitEntries']()).toEqual(fixed);
      expect([...page['lockedKeys']()]).toEqual(locked);
      expect(page['hintCount']()).toBe(1);
      for (const [letter, digit] of Object.entries(page['cryptarithm']()!.solution))
        page['updateDigit'](letter, String(digit));
      fixture.detectChanges();
      expect(page['isSolved']()).toBe(true);
      expect(fixture.nativeElement.querySelector('app-puzzle-success-popup')).not.toBeNull();
      page['newPuzzle']();
      expect(page['isSolved']()).toBe(false);
      expect(page['cryptarithmMode']()).toBe(mode);
      expect(page['hintCount']()).toBe(0);
    },
  );

  it('starts in deduction mode and switches versions through the buttons', async () => {
    const fixture = await createPage('cryptarithms');
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(page['cryptarithmMode']()).toBe('deduction');
    expect(root.querySelectorAll('.cryptarithm-bank-digit').length).toBeGreaterThanOrEqual(5);
    const button = (label: string) =>
      Array.from(root.querySelectorAll<HTMLButtonElement>('.cryptarithm-modes button')).find(
        (candidate) => candidate.textContent?.trim() === label,
      )!;
    expect(button('Déduction').getAttribute('aria-pressed')).toBe('true');
    page['showHint']();
    button('Classique').click();
    fixture.detectChanges();
    expect(page['cryptarithmMode']()).toBe('classic');
    expect(page['cryptarithm']()!.digits).toBeUndefined();
    expect(root.querySelector('.cryptarithm-digit-bank')).toBeNull();
    expect(page['hintCount']()).toBe(0);
    expect(page['selectedDigit']()).toBeNull();
    expect(page['feedback']()).toBe('');
    expect(button('Classique').getAttribute('aria-pressed')).toBe('true');
    button('Déduction').click();
    fixture.detectChanges();
    expect(root.querySelector('.cryptarithm-digit-bank')).not.toBeNull();
    page['newPuzzle']();
    expect(page['cryptarithmMode']()).toBe('deduction');
    expect(page['cryptarithm']()!.digits).toBeDefined();
  });

  it('limits deduction input to the bank and updates used digits, including zero', async () => {
    const fixture = await createPage('cryptarithms');
    const page = fixture.componentInstance;
    const puzzle = {
      terms: ['ABC', 'CEF', 'GECB'] as [string, string, string],
      letters: ['A', 'B', 'C', 'E', 'F', 'G'],
      solution: { A: 4, B: 5, C: 6, E: 0, F: 9, G: 1 },
      givens: {},
      digits: [0, 1, 4, 5, 6, 9],
    };
    page['cryptarithm'].set(puzzle);
    page['lockedKeys'].set(new Set());
    page['digitEntries'].set({});
    page['selectedDigit'].set('E');
    expect(page['keyboardRows']().flat()).toEqual([...puzzle.digits.map(String), 'backspace']);
    page['pressDigit']('7');
    expect(page['digitEntries']()['E']).toBe('');
    page['pressDigit']('0');
    fixture.detectChanges();
    expect(page['digitEntries']()['E']).toBe('0');
    expect(page['isCryptarithmDigitUsed'](0)).toBe(true);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.cryptarithm-bank-digit.used')?.textContent?.trim()).toBe('0');
    page['pressDigit']('backspace');
    expect(page['isCryptarithmDigitUsed'](0)).toBe(false);
    page['setCryptarithmMode']('classic');
    const letter = page['cryptarithm']()!.letters.find((key) => !page['lockedKeys']().has(key))!;
    page['updateDigit'](letter, '7');
    expect(page['digitEntries']()[letter]).toBe('7');
  });
});
