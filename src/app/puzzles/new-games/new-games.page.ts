import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  CryptarithmMode,
  CryptarithmPuzzle,
  createCryptarithm,
  isCryptarithmSolved,
} from './cryptarithms.logic';
import { DropQuotePuzzle, isDropQuoteSolved, remainingDropLetters } from './drop-quote.logic';
import { DropQuoteService } from './drop-quote.service';
import { KakuroPuzzle, createKakuro, isKakuroSolved } from './kakuro.logic';
import { NEW_GAMES, NewGameId } from './new-games.catalog';
import { range, shuffle } from './random';
import { SkyscrapersPuzzle, createSkyscrapers, isSkyscrapersSolved } from './skyscrapers.logic';
import { SumpletePuzzle, createSumplete, isSumpleteSolved, sumpleteTotals } from './sumplete.logic';
import { WordFitPuzzle, canPlaceWord, isWordFitSolved, wordFitLetters } from './word-fit.logic';
import { WordFitService } from './word-fit.service';

@Component({
  selector: 'app-new-games-page',
  imports: [RouterLink, CustomKeyboardComponent, PuzzleSuccessPopupComponent],
  templateUrl: './new-games.page.html',
  styleUrl: './new-games.page.scss',
})
export class NewGamesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  protected readonly id = this.route.snapshot.data['game'] as NewGameId;
  protected readonly game = NEW_GAMES.find((game) => game.id === this.id)!;
  protected readonly range = range;
  private readonly dropQuoteService = this.id === 'drop-quote' ? inject(DropQuoteService) : null;
  private readonly wordFitService = this.id === 'word-fit' ? inject(WordFitService) : null;
  protected readonly loading = signal(this.id === 'drop-quote' || this.id === 'word-fit');
  protected readonly loadError = signal<string | null>(null);

  protected readonly cryptarithm = signal<CryptarithmPuzzle | null>(null);
  protected readonly cryptarithmMode = signal<CryptarithmMode>('deduction');
  protected readonly skyscrapers = signal<SkyscrapersPuzzle | null>(null);
  protected readonly kakuro = signal<KakuroPuzzle | null>(null);
  protected readonly sumplete = signal<SumpletePuzzle | null>(null);
  protected readonly wordFit = signal<WordFitPuzzle | null>(null);
  protected readonly dropQuote = signal<DropQuotePuzzle | null>(null);

  protected readonly digitEntries = signal<Record<string, string>>({});
  protected readonly keptNumbers = signal<boolean[]>([]);
  protected readonly wordAssignments = signal<Record<number, string>>({});
  protected readonly droppedLetters = signal<Record<number, string>>({});
  protected readonly lockedKeys = signal<Set<string>>(new Set());
  protected readonly selectedDigit = signal<string | null>(null);
  protected readonly selectedSlot = signal<number | null>(null);
  protected readonly selectedDropCell = signal<number | null>(null);
  protected readonly hintCount = signal(0);
  protected readonly feedback = signal('');

  protected readonly numericEntries = computed(() =>
    Object.fromEntries(
      Object.entries(this.digitEntries())
        .filter(([, value]) => value !== '')
        .map(([key, value]) => [key, Number(value)]),
    ),
  );
  protected readonly digitSolution = computed<Record<string, number>>(
    () =>
      this.cryptarithm()?.solution ??
      this.kakuro()?.solution ??
      Object.fromEntries(this.skyscrapers()?.solution.map((value, cell) => [cell, value]) ?? []),
  );
  protected readonly keyboardRows = computed<CustomKeyboardKey[][]>(() => {
    const digits = this.cryptarithm()?.digits;
    if (digits) {
      const keys = digits.map(String);
      return [keys.slice(0, 3), [...keys.slice(3), 'backspace']];
    }
    return this.id === 'skyscrapers'
      ? [['1', '2', '3', '4', 'backspace']]
      : [
          range(5).map((i) => String(i + (this.id === 'cryptarithms' ? 0 : 1))),
          [
            ...range(this.id === 'cryptarithms' ? 5 : 4).map((i) =>
              String(i + (this.id === 'cryptarithms' ? 5 : 6)),
            ),
            'backspace',
          ],
        ];
  });
  protected readonly sumTotals = computed(() => {
    const puzzle = this.sumplete();
    return puzzle ? sumpleteTotals(puzzle, this.keptNumbers()) : { rows: [], columns: [] };
  });
  protected readonly fittedLetters = computed(() => {
    const puzzle = this.wordFit();
    return puzzle ? wordFitLetters(puzzle, this.wordAssignments()) : {};
  });
  protected readonly placedWordCount = computed(() => Object.keys(this.wordAssignments()).length);
  protected readonly wordCells = computed(
    () => new Set(this.wordFit()?.slots.flatMap((slot) => slot.cells) ?? []),
  );
  protected readonly fixedWordCells = computed(
    () =>
      new Set(
        this.wordFit()?.slots.flatMap((slot, i) =>
          this.lockedKeys().has(String(i)) ? slot.cells : [],
        ) ?? [],
      ),
  );
  protected readonly selectedWordSlot = computed(() => {
    const slot = this.selectedSlot();
    return slot === null ? null : (this.wordFit()?.slots[slot] ?? null);
  });
  protected readonly dropReserve = computed(() => {
    const puzzle = this.dropQuote();
    return puzzle ? remainingDropLetters(puzzle, this.droppedLetters()) : [];
  });
  protected readonly isSolved = computed(() => {
    switch (this.id) {
      case 'cryptarithms':
        return (
          !!this.cryptarithm() && isCryptarithmSolved(this.cryptarithm()!, this.numericEntries())
        );
      case 'skyscrapers':
        return (
          !!this.skyscrapers() &&
          isSkyscrapersSolved(
            this.skyscrapers()!,
            range(16).map((cell) => this.numericEntries()[cell]),
          )
        );
      case 'kakuro':
        return !!this.kakuro() && isKakuroSolved(this.kakuro()!, this.numericEntries());
      case 'sumplete':
        return !!this.sumplete() && isSumpleteSolved(this.sumplete()!, this.keptNumbers());
      case 'word-fit':
        return !!this.wordFit() && isWordFitSolved(this.wordFit()!, this.wordAssignments());
      case 'drop-quote':
        return !!this.dropQuote() && isDropQuoteSolved(this.dropQuote()!, this.droppedLetters());
    }
  });

  constructor() {
    if (this.id === 'drop-quote') void this.loadDropPhrases();
    else if (this.id === 'word-fit') void this.loadWordFitWords();
    else this.newPuzzle();
    effect(() => {
      if (this.isSolved()) {
        this.selectedDigit.set(null);
        this.playHistory.markSolved(`/${this.id}`);
      }
    });
  }

  protected async loadDropPhrases(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      await this.dropQuoteService!.loadPhrases();
      this.loading.set(false);
      this.newPuzzle();
    } catch {
      this.loadError.set('Impossible de charger les phrases. Réessaie dans un instant.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async loadWordFitWords(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      await this.wordFitService!.loadWords();
      this.loading.set(false);
      this.newPuzzle();
    } catch {
      this.loadError.set('Impossible de charger les mots à caser. Réessaie dans un instant.');
    } finally {
      this.loading.set(false);
    }
  }

  protected newPuzzle(): void {
    if (this.loading() || this.loadError()) return;
    switch (this.id) {
      case 'cryptarithms':
        this.cryptarithm.set(createCryptarithm(this.cryptarithmMode()));
        break;
      case 'skyscrapers':
        this.skyscrapers.set(createSkyscrapers());
        break;
      case 'kakuro':
        this.kakuro.set(createKakuro());
        break;
      case 'sumplete':
        this.sumplete.set(createSumplete());
        break;
      case 'word-fit':
        this.wordFit.set(this.wordFitService!.createPuzzle());
        break;
      case 'drop-quote':
        this.dropQuote.set(this.dropQuoteService!.createPuzzle());
        break;
    }
    const givens =
      this.cryptarithm()?.givens ?? this.skyscrapers()?.givens ?? this.kakuro()?.givens ?? {};
    this.digitEntries.set(
      Object.fromEntries(Object.entries(givens).map(([key, value]) => [key, String(value)])),
    );
    this.keptNumbers.set(
      this.sumplete()?.numbers.map((_, cell) => this.sumplete()!.givens[cell] ?? true) ?? [],
    );
    this.wordAssignments.set({ ...this.wordFit()?.givens });
    this.droppedLetters.set({});
    this.lockedKeys.set(
      new Set(
        Object.keys(givens).concat(
          Object.keys(this.sumplete()?.givens ?? {}),
          Object.keys(this.wordFit()?.givens ?? {}),
        ),
      ),
    );
    this.hintCount.set(0);
    this.selectedDigit.set(null);
    this.selectedSlot.set(
      this.wordFit()?.slots.findIndex((_, i) => this.wordFit()!.givens[i] === undefined) ?? null,
    );
    this.selectedDropCell.set(null);
    this.feedback.set('');
  }

  protected resetPuzzle(): void {
    const locked = this.lockedKeys();
    this.digitEntries.update((entries) =>
      Object.fromEntries(Object.entries(entries).filter(([key]) => locked.has(key))),
    );
    this.keptNumbers.update((kept) =>
      kept.map((value, cell) => (locked.has(String(cell)) ? value : true)),
    );
    this.wordAssignments.update((entries) =>
      Object.fromEntries(Object.entries(entries).filter(([key]) => locked.has(key))),
    );
    this.droppedLetters.update((entries) =>
      Object.fromEntries(Object.entries(entries).filter(([key]) => locked.has(key))),
    );
    this.clearFeedback();
    this.selectedDigit.set(null);
  }

  protected setCryptarithmMode(mode: CryptarithmMode): void {
    if (this.cryptarithmMode() === mode) return;
    this.cryptarithmMode.set(mode);
    this.newPuzzle();
  }

  protected isCryptarithmDigitUsed(digit: number): boolean {
    return Object.values(this.numericEntries()).includes(digit);
  }

  protected selectDigit(key: string, event: Event): void {
    if (this.lockedKeys().has(key)) {
      this.selectedDigit.set(null);
      return;
    }
    this.selectedDigit.set(key);
    if (event.target instanceof HTMLInputElement) event.target.select();
  }

  protected updateDigit(key: string, value: string): void {
    if (this.lockedKeys().has(key) || this.isSolved()) return;
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const max = this.id === 'skyscrapers' ? 4 : 9;
    const min = this.id === 'cryptarithms' ? 0 : 1;
    const allowed = this.cryptarithm()?.digits;
    const clean =
      digit &&
      Number(digit) >= min &&
      Number(digit) <= max &&
      (!allowed || allowed.includes(Number(digit)))
        ? digit
        : '';
    this.digitEntries.update((entries) => ({ ...entries, [key]: clean }));
    this.clearFeedback();
  }

  protected inputDigit(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateDigit(key, input.value);
    input.value = this.digitEntries()[key] ?? '';
  }

  protected pressDigit(key: CustomKeyboardKey): void {
    const selected = this.selectedDigit();
    if (selected !== null)
      this.updateDigit(selected, key === 'backspace' || key === 'clear' ? '' : key);
  }

  protected kakuroClue(cell: number, direction: 'across' | 'down'): number | null {
    return (
      this.kakuro()?.runs.find((run) => run.clue === cell && run.direction === direction)?.total ??
      null
    );
  }

  protected toggleNumber(cell: number): void {
    if (this.lockedKeys().has(String(cell)) || this.isSolved()) return;
    this.keptNumbers.update((kept) => kept.map((value, i) => (i === cell ? !value : value)));
    this.clearFeedback();
  }

  protected selectWordCell(cell: number): void {
    const puzzle = this.wordFit()!;
    const slots = puzzle.slots.flatMap((slot, i) => (slot.cells.includes(cell) ? [i] : []));
    const current = slots.indexOf(this.selectedSlot() ?? -1);
    this.selectedSlot.set(slots[(current + 1) % slots.length]);
    this.clearFeedback();
  }

  protected slotNumber(cell: number): number | null {
    return this.wordFit()?.slots.find((slot) => slot.cells[0] === cell)?.number ?? null;
  }

  protected isWordUsed(word: string): boolean {
    return Object.values(this.wordAssignments()).includes(word);
  }

  protected isWordLocked(word: string): boolean {
    const slot = Object.entries(this.wordAssignments()).find(([, value]) => value === word)?.[0];

    return slot !== undefined && this.lockedKeys().has(slot);
  }

  protected selectOrPlaceWord(word: string): void {
    if (this.isWordUsed(word)) {
      this.removeWordByWord(word);
      return;
    }

    this.placeWord(word);
  }

  protected placeWord(word: string): void {
    const puzzle = this.wordFit()!;
    const slot = this.selectedSlot();
    if (slot === null || this.lockedKeys().has(String(slot)) || this.isSolved()) return;
    if (!canPlaceWord(puzzle, this.wordAssignments(), slot, word)) {
      this.feedback.set(
        'Ce mot ne convient pas à cet emplacement : vérifie la longueur et les croisements.',
      );
      return;
    }
    this.wordAssignments.update((assignments) => ({ ...assignments, [slot]: word }));
    this.clearFeedback();
    const next = puzzle.slots.findIndex((_, i) => this.wordAssignments()[i] === undefined);
    if (next !== -1) this.selectedSlot.set(next);
  }

  protected removeWord(): void {
    const slot = this.selectedSlot();
    if (slot === null || this.lockedKeys().has(String(slot)) || this.isSolved()) return;
    this.wordAssignments.update((assignments) => {
      const next = { ...assignments };
      delete next[slot];
      return next;
    });
    this.clearFeedback();
  }

  protected removeWordByWord(word: string): void {
    const slot = Object.entries(this.wordAssignments()).find(([, value]) => value === word)?.[0];

    if (slot === undefined) return;

    this.selectedSlot.set(Number(slot));
    this.removeWord();
  }

  protected selectDropCell(cell: number): void {
    if (!this.dropQuote()?.solution[cell] || this.lockedKeys().has(String(cell)) || this.isSolved())
      return;
    this.selectedDropCell.set(cell);
    this.clearFeedback();
  }

  protected placeDropLetter(column: number, letter: string): void {
    const cell = this.selectedDropCell();
    const puzzle = this.dropQuote()!;
    if (
      cell === null ||
      cell % puzzle.width !== column ||
      this.lockedKeys().has(String(cell)) ||
      this.isSolved()
    )
      return;
    const previous = this.droppedLetters()[cell];
    if (previous !== letter && !this.dropReserve()[column].includes(letter)) return;
    this.droppedLetters.update((values) => ({ ...values, [cell]: letter }));
    this.clearFeedback();
    const available = Object.keys(puzzle.solution)
      .map(Number)
      .filter((next) => !this.droppedLetters()[next] && !this.lockedKeys().has(String(next)));
    const next = available.find((next) => next > cell) ?? available[0];
    if (next !== undefined) this.selectedDropCell.set(next);
  }

  protected removeDropLetter(): void {
    const cell = this.selectedDropCell();
    if (cell === null || this.lockedKeys().has(String(cell)) || this.isSolved()) return;
    this.droppedLetters.update((values) => {
      const next = { ...values };
      delete next[cell];
      return next;
    });
    this.clearFeedback();
  }

  protected showHint(): void {
    if (this.isSolved()) return;
    let key: string | undefined;
    if (this.cryptarithm() || this.skyscrapers() || this.kakuro()) {
      const candidates = Object.keys(this.digitSolution()).filter(
        (key) => this.numericEntries()[key] !== this.digitSolution()[key],
      );
      key = candidates.includes(this.selectedDigit() ?? '')
        ? this.selectedDigit()!
        : shuffle(candidates)[0];
      if (key !== undefined)
        this.digitEntries.update((values) => ({
          ...values,
          [key!]: String(this.digitSolution()[key!]),
        }));
      this.selectedDigit.set(null);
    } else if (this.sumplete()) {
      const cell = shuffle(range(this.sumplete()!.numbers.length)).find(
        (cell) => this.keptNumbers()[cell] !== this.sumplete()!.solution[cell],
      );
      if (cell !== undefined) {
        key = String(cell);
        this.keptNumbers.update((kept) =>
          kept.map((value, i) => (i === cell ? this.sumplete()!.solution[i] : value)),
        );
      }
    } else if (this.wordFit()) {
      const puzzle = this.wordFit()!;
      const candidates = puzzle.slots.flatMap((_, slot) =>
        this.wordAssignments()[slot] !== puzzle.solution[slot] ? [slot] : [],
      );
      const selected = this.selectedSlot();
      const slot =
        selected !== null && candidates.includes(selected) ? selected : shuffle(candidates)[0];
      if (slot !== undefined) {
        key = String(slot);
        const word = puzzle.solution[slot];
        const required = new Map(puzzle.slots[slot].cells.map((cell, i) => [cell, word[i]]));
        this.wordAssignments.update((assignments) => {
          const next = { ...assignments };
          for (const [other, value] of Object.entries(next)) {
            if (Number(other) === slot) continue;
            if (
              value === word ||
              puzzle.slots[Number(other)].cells.some(
                (cell, i) => required.has(cell) && required.get(cell) !== value[i],
              )
            )
              delete next[Number(other)];
          }
          next[slot] = word;
          return next;
        });
        this.selectedSlot.set(slot);
      }
    } else if (this.dropQuote()) {
      const puzzle = this.dropQuote()!;
      const candidates = Object.keys(puzzle.solution)
        .map(Number)
        .filter((cell) => this.droppedLetters()[cell] !== puzzle.solution[cell]);
      const selected = this.selectedDropCell();
      const cell =
        selected !== null && candidates.includes(selected) ? selected : shuffle(candidates)[0];
      if (cell !== undefined) {
        key = String(cell);
        const letter = puzzle.solution[cell];
        this.droppedLetters.update((values) => {
          const next = { ...values };
          delete next[cell];
          if (!remainingDropLetters(puzzle, next)[cell % puzzle.width].includes(letter)) {
            const other = Object.keys(next)
              .map(Number)
              .find(
                (other) =>
                  other % puzzle.width === cell % puzzle.width &&
                  next[other] === letter &&
                  !this.lockedKeys().has(String(other)),
              );
            if (other !== undefined) delete next[other];
          }
          next[cell] = letter;
          return next;
        });
        this.selectedDropCell.set(null);
      }
    }
    if (key !== undefined) {
      this.lockedKeys.update((keys) => new Set([...keys, key!]));
      this.hintCount.update((count) => count + 1);
      this.clearFeedback();
      this.feedback.set('Indice placé; il restera visible après une remise à zéro.');
    }
  }

  private clearFeedback(): void {
    this.feedback.set('');
  }

  @HostListener('document:pointerdown', ['$event'])
  protected hideKeyboard(event: PointerEvent): void {
    if (
      event.target instanceof Element &&
      !event.target.closest('.digit-input, app-custom-keyboard')
    )
      this.selectedDigit.set(null);
  }

  @HostListener('document:keydown', ['$event'])
  protected handleBoardKey(event: KeyboardEvent): void {
    if (
      this.id !== 'drop-quote' ||
      this.isSolved() ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      (event.target instanceof Element && event.target.closest('input, textarea, select'))
    )
      return;
    const cell = this.selectedDropCell();
    if (cell === null) return;
    const puzzle = this.dropQuote()!;
    if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault();
      this.placeDropLetter(cell % puzzle.width, event.key.toUpperCase());
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      this.removeDropLetter();
    } else if (event.key.startsWith('Arrow')) {
      const step = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -puzzle.width,
        ArrowDown: puzzle.width,
      }[event.key as 'ArrowLeft'];
      if (!step) return;
      event.preventDefault();
      for (
        let next = cell + step;
        next >= 0 && next < puzzle.rows.length * puzzle.width;
        next += step
      ) {
        if (puzzle.solution[next] && !this.lockedKeys().has(String(next))) {
          this.selectedDropCell.set(next);
          break;
        }
      }
    }
  }
}
