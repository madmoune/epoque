import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { NEW_GAMES, NewGameId } from './new-games.catalog';
import { NewGamesPage } from './new-games.page';
import { createDropQuote, remainingDropLetters } from './drop-quote.logic';
import { parseWordFitWords } from './word-fit.logic';

const DROP_QUOTE_PHRASES = [
  'Un bon indice transforme le doute en certitude',
  'La patience ouvre des portes que la force ferme',
  'Au cœur du défi, l’équipe garde son calme malgré le bruit',
].join('\n');

const WORD_FIT_WORDS = `canotage kayak pagaie aviron rame canot bateau voile barque radeau
  rivière cascade courant rapide remous vague plage sable terre roche
  forêt arbre érable sapin pin racine branche feuille fleur mousse
  aigle huard héron castor renard lièvre caribou orignal truite saumon
  énigme indice logique secret lettre nombre symbole grille labyrinthe solution
  équipe relais ballon cible flèche lancer sport piste course marche
  boussole carte chemin sentier col sommet vallée montagne rocher falaise
  soleil étoile lune nuage pluie neige vent orage ciel ombre`
  .split(/\s+/)
  .join('\n');

describe('NewGamesPage interactions', () => {
  async function createPage(game: NewGameId, loadContent = true) {
    await TestBed.configureTestingModule({
      imports: [NewGamesPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { game } } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NewGamesPage);
    fixture.detectChanges();
    if (game === 'word-fit' && loadContent) {
      TestBed.inject(HttpTestingController).expectOne('words.txt').flush(WORD_FIT_WORDS);
      await vi.waitFor(() => expect(fixture.componentInstance['loading']()).toBe(false));
      await fixture.whenStable();
      fixture.detectChanges();
    }
    if (game === 'drop-quote' && loadContent) {
      TestBed.inject(HttpTestingController)
        .expectOne('mid-mid-sentences.txt')
        .flush(DROP_QUOTE_PHRASES);
      await vi.waitFor(() => expect(fixture.componentInstance['loading']()).toBe(false));
      await fixture.whenStable();
      fixture.detectChanges();
    }
    return fixture;
  }

  it('loads the word list before playing and retries a failed word request', async () => {
    const fixture = await createPage('word-fit', false);
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const http = TestBed.inject(HttpTestingController);
    expect(root.textContent).toContain('Chargement des mots');
    expect(page['wordFit']()).toBeNull();
    expect(root.querySelectorAll('.training-actions button:not(:disabled)')).toHaveLength(0);

    http.expectOne('words.txt').flush('', { status: 503, statusText: 'Unavailable' });
    await vi.waitFor(() => expect(page['loading']()).toBe(false));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('[role="alert"]')).not.toBeNull();

    Array.from(root.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim() === 'Réessayer')!
      .click();
    http.expectOne('words.txt').flush(WORD_FIT_WORDS);
    await vi.waitFor(() => expect(page['loading']()).toBe(false));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('.word-grid')).not.toBeNull();
    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(page['loading']()).toBe(false);
    const words = parseWordFitWords(WORD_FIT_WORDS);
    expect(page['wordFit']()!.words.every((word) => words.includes(word))).toBe(true);

    page['showHint']();
    page['newPuzzle']();
    expect(page['hintCount']()).toBe(0);
    expect(page['wordAssignments']()).toEqual(page['wordFit']()!.givens);
    http.expectNone('words.txt');
    http.verify();
  });

  it('disables play during loading and lets the player retry a failed phrase request', async () => {
    const fixture = await createPage('drop-quote', false);
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const http = TestBed.inject(HttpTestingController);
    expect(root.textContent).toContain('Chargement des phrases');
    expect(root.querySelectorAll('.training-actions button:not(:disabled)')).toHaveLength(0);
    http.expectOne('mid-mid-sentences.txt').flush('', { status: 503, statusText: 'Unavailable' });
    await vi.waitFor(() => expect(page['loading']()).toBe(false));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('[role="alert"]')).not.toBeNull();
    expect(page['dropQuote']()).toBeNull();

    Array.from(root.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim() === 'Réessayer')!
      .click();
    http.expectOne('mid-mid-sentences.txt').flush(DROP_QUOTE_PHRASES);
    await vi.waitFor(() => expect(page['loading']()).toBe(false));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('.drop-board')).not.toBeNull();
    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(page['loading']()).toBe(false);
    http.verify();
  });

  it('shows punctuation as fixed markers and keeps it out of selectable cells', async () => {
    const fixture = await createPage('drop-quote');
    const page = fixture.componentInstance;
    const puzzle = createDropQuote('Au cœur du défi, l’équipe garde son calme malgré le bruit');
    page['dropQuote'].set(puzzle);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(
      Array.from(root.querySelectorAll('.drop-punctuation'), (mark) => mark.textContent),
    ).toEqual([',', "'"]);
    const cell = puzzle.rows.join('').indexOf("'");
    page['selectDropCell'](cell);
    expect(page['selectedDropCell']()).toBeNull();
    expect(root.querySelectorAll('.drop-cell')).toHaveLength(Object.keys(puzzle.solution).length);
    expect(puzzle.columns.flat().every((letter) => /^[A-Z]$/.test(letter))).toBe(true);
  });

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
            const button = root.querySelector<HTMLButtonElement>(
              `.drop-cell[aria-label="${label}"]`,
            );
            expect(button, `Missing cell ${cell} in ${puzzle.phrase}`).not.toBeNull();
            button!.click();
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
    expect(page['selectedSlot']()).not.toBe(slot);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const usedWordButton = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.word-token.used'),
    ).find((button) => button.textContent?.includes(word));
    expect(usedWordButton).toBeDefined();
    expect(usedWordButton?.disabled).toBe(false);
    usedWordButton?.click();
    fixture.detectChanges();
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
    expect(page['selectedDropCell']()).toBe(Number(Object.keys(puzzle.solution)[1]));
    expect(page['dropReserve']()[column].length).toBe(puzzle.columns[column].length - 1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.drop-reserve-space')).toHaveLength(1);
    page['selectDropCell'](cell);
    page['removeDropLetter']();
    expect(page['dropReserve']()).toEqual(puzzle.columns);
  });

  it('advances dropped-letter selection in reading order for clicks and keyboard input', async () => {
    const fixture = await createPage('drop-quote');
    const page = fixture.componentInstance;
    const puzzle = createDropQuote('Au cœur du défi, l’équipe garde son calme malgré le bruit');
    const cells = Object.keys(puzzle.solution).map(Number);
    page['dropQuote'].set(puzzle);
    page['droppedLetters'].set({
      [cells[1]]: puzzle.solution[cells[1]],
      [cells[2]]: puzzle.solution[cells[2]],
    });
    page['lockedKeys'].set(new Set([String(cells[1])]));
    page['selectDropCell'](cells[0]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    root
      .querySelector<HTMLButtonElement>(
        `.drop-token[aria-label="Lettre ${puzzle.solution[cells[0]]}, colonne 1"]`,
      )!
      .click();
    expect(page['selectedDropCell']()).toBe(cells[3]);

    const rowEnd = cells.filter((cell) => cell < puzzle.width).at(-1)!;
    page['selectDropCell'](rowEnd);
    page['handleBoardKey'](new KeyboardEvent('keydown', { key: puzzle.solution[rowEnd] }));
    expect(page['selectedDropCell']()).toBe(cells.find((cell) => cell >= puzzle.width));

    const punctuation = puzzle.rows.join('').indexOf("'");
    const beforePunctuation = cells.filter((cell) => cell < punctuation).at(-1)!;
    page['selectDropCell'](beforePunctuation);
    page['handleBoardKey'](
      new KeyboardEvent('keydown', { key: puzzle.solution[beforePunctuation] }),
    );
    expect(page['selectedDropCell']()).toBe(cells.find((cell) => cell > punctuation));
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
