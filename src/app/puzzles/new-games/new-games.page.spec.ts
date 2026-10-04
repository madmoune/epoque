import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { NEW_GAMES, NewGameId } from './new-games.catalog';
import { NewGamesPage } from './new-games.page';
import { remainingDropLetters } from './drop-quote.logic';

describe('NewGamesPage interactions', () => {
  async function createPage(game: NewGameId) {
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

  it.each(NEW_GAMES)('renders $title and reaches success through usable hints', async (game) => {
    const fixture = await createPage(game.id);
    const page = fixture.componentInstance;
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe(game.title);
    const backLink = fixture.nativeElement.querySelector('.back-link') as HTMLAnchorElement;
    expect(backLink.getAttribute('href')).toBe('/#nouveaux-jeux');
    expect(backLink.textContent?.trim()).toBe('Retour au menu');
    expect(page['isSolved']()).toBe(false);

    page['showHint']();
    const locked = [...page['lockedKeys']()];
    expect(page['hintCount']()).toBe(1);
    page['resetPuzzle']();
    expect([...page['lockedKeys']()]).toEqual(locked);
    expect(page['hintCount']()).toBe(1);

    for (let attempt = 0; attempt < 70 && !page['isSolved'](); attempt++) page['showHint']();
    expect(page['isSolved']()).toBe(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-puzzle-success-popup')).not.toBeNull();

    page['newPuzzle']();
    expect(page['isSolved']()).toBe(false);
    expect(page['hintCount']()).toBe(0);
    expect(page['feedback']()).toBe('');
  });

  it.each(NEW_GAMES)(
    'automatically shows success after the last correct input in $title',
    async (game) => {
      const fixture = await createPage(game.id);
      const page = fixture.componentInstance;
      const root = fixture.nativeElement as HTMLElement;
      const actions: Array<() => void> = [];

      const buttonLabels = Array.from(root.querySelectorAll('button'), (button) =>
        button.textContent?.trim(),
      );
      expect(buttonLabels).not.toContain('Vérifier');
      expect(buttonLabels).toContain('Indice');
      expect(buttonLabels).not.toContain('Un indice');
      expect(root.querySelector('app-puzzle-success-popup')).toBeNull();

      if (page['cryptarithm']() || page['skyscrapers']() || page['kakuro']()) {
        for (const [key, value] of Object.entries(page['digitSolution']())) {
          if (page['lockedKeys']().has(key)) continue;
          const width = page['skyscrapers']()?.size ?? page['kakuro']()?.width ?? 0;
          const cell = Number(key);
          const label =
            game.id === 'cryptarithms'
              ? `Chiffre de la lettre ${key}`
              : `${game.id === 'skyscrapers' ? 'Hauteur, ligne' : 'Ligne'} ${Math.floor(cell / width) + 1}, colonne ${(cell % width) + 1}`;
          actions.push(() => {
            const input = root.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
            input.value = String(value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
          });
        }
      } else if (page['sumplete']()) {
        page['sumplete']()!.solution.forEach((kept, cell) => {
          if (page['keptNumbers']()[cell] !== kept)
            actions.push(() => {
              root.querySelectorAll<HTMLButtonElement>('.sum-cell')[cell].click();
            });
        });
      } else if (page['wordFit']()) {
        page['wordFit']()!.solution.forEach((word, slot) => {
          if (page['lockedKeys']().has(String(slot))) return;
          actions.push(() => {
            const select = root.querySelector<HTMLSelectElement>('#word-slot')!;
            select.value = String(slot);
            select.dispatchEvent(new Event('change', { bubbles: true }));
            fixture.detectChanges();
            Array.from(root.querySelectorAll<HTMLButtonElement>('.word-token'))
              .find((button) => button.querySelector('span')?.textContent?.trim() === word)!
              .click();
          });
        });
      } else if (page['dropQuote']()) {
        const puzzle = page['dropQuote']()!;
        for (const [key, letter] of Object.entries(puzzle.solution)) {
          const cell = Number(key);
          const column = (cell % puzzle.width) + 1;
          const label = `Ligne ${Math.floor(cell / puzzle.width) + 1}, colonne ${column}, vide`;
          actions.push(() => {
            root.querySelector<HTMLButtonElement>(`.drop-cell[aria-label="${label}"]`)!.click();
            fixture.detectChanges();
            root
              .querySelector<HTMLButtonElement>(
                `.drop-token[aria-label="Lettre ${letter}, colonne ${column}"]`,
              )!
              .click();
          });
        }
      }

      expect(actions.length).toBeGreaterThan(0);
      actions.forEach((action, index) => {
        action();
        fixture.detectChanges();
        if (index < actions.length - 1)
          expect(root.querySelector('app-puzzle-success-popup')).toBeNull();
      });

      expect(page['isSolved']()).toBe(true);
      expect(page['hintCount']()).toBe(0);
      expect(root.querySelector('app-puzzle-success-popup')?.textContent).toContain('sans indice');
    },
  );

  it('lets numeric cells be entered and cleared without changing givens', async () => {
    const fixture = await createPage('skyscrapers');
    const page = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector(
      '.digit-input:not([readonly])',
    ) as HTMLInputElement;
    input.focus();
    fixture.detectChanges();
    const key = page['selectedDigit']()!;
    expect(key).not.toBeNull();
    page['pressDigit']('3');
    expect(page['digitEntries']()[key]).toBe('3');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tower-glyph')).not.toBeNull();
    page['pressDigit']('backspace');
    expect(page['digitEntries']()[key]).toBe('');
    page['updateDigit'](key, '9');
    expect(page['digitEntries']()[key]).toBe('');
    expect(page['isSolved']()).toBe(false);
  });

  it('toggles a Sumplete number back and forth and preserves fixed hints', async () => {
    const fixture = await createPage('sumplete');
    const page = fixture.componentInstance;
    const cell = page['keptNumbers']().findIndex((_, i) => !page['lockedKeys']().has(String(i)));
    const original = page['keptNumbers']()[cell];
    page['toggleNumber'](cell);
    expect(page['keptNumbers']()[cell]).toBe(!original);
    page['toggleNumber'](cell);
    expect(page['keptNumbers']()[cell]).toBe(original);
    page['showHint']();
    const fixed = [...page['lockedKeys']()].map(Number);
    const values = page['keptNumbers']();
    fixed.forEach((cell) => page['toggleNumber'](cell));
    expect(page['keptNumbers']()).toEqual(values);
  });

  it('places words with matching crossings and frees them when removed', async () => {
    const fixture = await createPage('word-fit');
    const page = fixture.componentInstance;
    const puzzle = page['wordFit']()!;
    const slot = puzzle.slots.findIndex((_, i) => !page['lockedKeys']().has(String(i)));
    page['selectedSlot'].set(slot);
    const word = puzzle.solution[slot];
    page['placeWord'](word);
    expect(page['wordAssignments']()[slot]).toBe(word);
    expect(page['isWordUsed'](word)).toBe(true);
    page['selectedSlot'].set(slot);
    page['removeWord']();
    expect(page['wordAssignments']()[slot]).toBeUndefined();
    expect(page['isWordUsed'](word)).toBe(false);
    page['placeWord']('IMPOSSIBLE');
    expect(page['wordAssignments']()[slot]).toBeUndefined();
    expect(page['feedback']()).not.toBe('');
  });

  it('keeps dropped letters in the selected column and returns erased letters to the reserve', async () => {
    const fixture = await createPage('drop-quote');
    const page = fixture.componentInstance;
    const puzzle = page['dropQuote']()!;
    const cell = Number(Object.keys(puzzle.solution)[0]);
    const column = cell % puzzle.width;
    const letter = puzzle.solution[cell];
    page['selectDropCell'](cell);
    page['placeDropLetter']((column + 1) % puzzle.width, letter);
    expect(page['droppedLetters']()[cell]).toBeUndefined();
    page['placeDropLetter'](column, letter);
    expect(page['droppedLetters']()[cell]).toBe(letter);
    expect(page['dropReserve']()[column].length).toBe(puzzle.columns[column].length - 1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.drop-reserve-space')).toHaveLength(1);
    page['selectDropCell'](cell);
    page['removeDropLetter']();
    expect(page['dropReserve']()).toEqual(puzzle.columns);
  });

  it('can give a drop-letter hint even if its letter was used in a wrong cell', async () => {
    const fixture = await createPage('drop-quote');
    const page = fixture.componentInstance;
    const puzzle = page['dropQuote']()!;
    const cells = Object.keys(puzzle.solution).map(Number);
    const target = cells.find((cell) =>
      cells.some(
        (other) =>
          other % puzzle.width === cell % puzzle.width &&
          puzzle.solution[other] !== puzzle.solution[cell],
      ),
    )!;
    const column = target % puzzle.width;
    const other = cells.find(
      (cell) => cell % puzzle.width === column && puzzle.solution[cell] !== puzzle.solution[target],
    )!;
    const remaining = remainingDropLetters(puzzle, {});
    page['droppedLetters'].set(
      Object.fromEntries(
        cells
          .filter((cell) => cell % puzzle.width === column)
          .map((cell) => {
            const value =
              cell === target
                ? puzzle.solution[other]
                : cell === other
                  ? puzzle.solution[target]
                  : puzzle.solution[cell];
            remaining[column].splice(remaining[column].indexOf(value), 1);
            return [cell, value];
          }),
      ),
    );
    page['selectedDropCell'].set(target);
    page['showHint']();
    expect(page['droppedLetters']()[target]).toBe(puzzle.solution[target]);
    expect(page['lockedKeys']().has(String(target))).toBe(true);
    expect(page['dropReserve']()[column].length).toBe(1);
    expect(
      Object.values(page['droppedLetters']()).length + page['dropReserve']().flat().length,
    ).toBe(Object.keys(puzzle.solution).length);
  });
});
