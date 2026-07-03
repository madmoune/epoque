import { Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  WordSearchCell,
  WordSearchHiddenWord,
  WordSearchPuzzle,
  WordSearchService,
} from './word-search.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';

type GridPosition = {
  row: number;
  col: number;
};

@Component({
  selector: 'app-word-search-page',
  imports: [FormsModule, RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
  templateUrl: './word-search.page.html',
  styleUrl: './word-search.page.scss',
})
export class WordSearchPage {
  @ViewChild('finalAnswerField')
  private readonly finalAnswerField?: ElementRef<HTMLInputElement>;
  private suppressNextSelection = false;

  private readonly wordSearchService = inject(WordSearchService);

  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly puzzle = signal<WordSearchPuzzle | null>(null);
  protected readonly foundWordIds = signal<Set<string>>(new Set());
  protected readonly selectedStart = signal<GridPosition | null>(null);
  protected readonly finalAnswer = signal('');
  protected readonly keyboardVisible = signal(false);
  protected readonly letterKeyboardRows: CustomKeyboardKey[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'backspace'],
    ['clear'],
  ];
  protected readonly message = signal('Tape la première et la dernière lettre d’un mot.');

  protected readonly foundWords = computed(() => {
    const puzzle = this.puzzle();

    if (!puzzle) {
      return [];
    }

    return puzzle.hiddenWords.filter((word) => this.foundWordIds().has(word.id));
  });

  protected readonly allWordsFound = computed(() => {
    const puzzle = this.puzzle();

    return Boolean(puzzle) && this.foundWordIds().size === puzzle!.hiddenWords.length;
  });

  protected readonly remainingLetters = computed(() => {
    const puzzle = this.puzzle();

    if (!puzzle || !this.allWordsFound()) {
      return '';
    }

    return puzzle.grid.flat().filter((cell) => cell.isFinalLetter).map((cell) => cell.letter).join('');
  });

  protected readonly isSolved = computed(() => {
    const puzzle = this.puzzle();

    if (!puzzle || !this.allWordsFound()) {
      return false;
    }

    return this.wordSearchService.normalize(this.finalAnswer()) === puzzle.normalizedFinalWord;
  });

  constructor() {
    void this.loadPuzzle();
  }

  protected selectCell(cell: WordSearchCell): void {
    if (this.isSolved()) {
      return;
    }

    const start = this.selectedStart();

    if (!start) {
      this.selectedStart.set({ row: cell.row, col: cell.col });
      this.message.set('Tape maintenant la dernière lettre du mot.');
      return;
    }

    if (start.row === cell.row && start.col === cell.col) {
      this.selectedStart.set(null);
      this.message.set('Sélection annulée.');
      return;
    }

    const selectedCells = this.cellsBetween(start, cell);

    if (selectedCells.length === 0) {
      this.selectedStart.set({ row: cell.row, col: cell.col });
      this.message.set('Choisis une ligne droite: horizontale, verticale ou diagonale.');
      return;
    }

    const matchedWord = this.findMatchingWord(selectedCells);
    this.selectedStart.set(null);

    if (!matchedWord) {
      this.message.set('Ce trajet ne correspond pas à un mot caché.');
      return;
    }

    this.foundWordIds.update((ids) => new Set([...ids, matchedWord.id]));
    this.message.set(
      this.allWordsFound()
        ? 'Tous les mots sont trouvés. Déchiffre les lettres restantes.'
        : `Mot trouvé: ${matchedWord.answer}.`,
    );
  }

  protected cellClass(cell: WordSearchCell): string {
    const classes = ['grid-cell'];
    const start = this.selectedStart();

    if (start?.row === cell.row && start.col === cell.col) {
      classes.push('selected');
    }

    if (cell.hiddenWordIds.some((wordId) => this.foundWordIds().has(wordId))) {
      classes.push('found');

      const wordIndex = this.foundWordColorIndex(cell);

      if (wordIndex !== null) {
        classes.push(`found-${wordIndex}`);
      }
    }

    if (this.allWordsFound() && cell.isFinalLetter) {
      classes.push('remaining');
    }

    return classes.join(' ');
  }

  protected wordClass(word: WordSearchHiddenWord): string {
    const classes = ['word-item'];

    if (this.foundWordIds().has(word.id)) {
      classes.push('found-word', `found-${this.wordColorIndex(word)}`);
    }

    return classes.join(' ');
  }

  protected updateFinalAnswer(value: string): void {
    this.finalAnswer.set(value);
  }

  protected handleKeyboardKey(key: CustomKeyboardKey): void {
    if (!this.allWordsFound() || this.isSolved()) {
      return;
    }

    if (key === 'backspace') {
      this.finalAnswer.update((answer) => answer.slice(0, -1));
      this.focusFinalAnswer(false);
      return;
    }

    if (key === 'clear') {
      this.finalAnswer.set('');
      this.focusFinalAnswer(false);
      return;
    }

    if (key === 'space') {
      return;
    }

    this.finalAnswer.update((answer) => `${answer}${key}`);
    this.focusFinalAnswer(false);
  }

  protected selectFinalAnswerContent(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    this.keyboardVisible.set(true);

    if (this.suppressNextSelection) {
      this.suppressNextSelection = false;
      return;
    }

    event.target.select();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected hideKeyboardWhenClickingAway(event: PointerEvent): void {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (
      target.closest('.final-answer-input') ||
      target.closest('app-custom-keyboard') ||
      target.closest('app-puzzle-success-popup')
    ) {
      return;
    }

    this.keyboardVisible.set(false);
  }

  protected newPuzzle(): void {
    try {
      this.puzzle.set(this.wordSearchService.createPuzzle());
      this.foundWordIds.set(new Set());
      this.selectedStart.set(null);
      this.finalAnswer.set('');
      this.keyboardVisible.set(false);
      this.message.set('Tape la première et la dernière lettre d’un mot.');
    } catch {
      this.loadError.set('Impossible de créer une grille de mots cachés.');
    }
  }

  protected revealWord(word: WordSearchHiddenWord): void {
    if (this.isSolved()) {
      return;
    }

    this.foundWordIds.update((ids) => new Set([...ids, word.id]));
    this.selectedStart.set(null);
    this.message.set(`Indice utilisé: ${word.answer}.`);
  }

  private async loadPuzzle(): Promise<void> {
    try {
      await this.wordSearchService.loadWords();
      this.newPuzzle();
    } catch {
      this.loadError.set('Impossible de charger la liste de mots.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private cellsBetween(start: GridPosition, end: GridPosition): GridPosition[] {
    const rowDelta = Math.sign(end.row - start.row);
    const colDelta = Math.sign(end.col - start.col);
    const rowDistance = Math.abs(end.row - start.row);
    const colDistance = Math.abs(end.col - start.col);

    if (rowDistance !== 0 && colDistance !== 0 && rowDistance !== colDistance) {
      return [];
    }

    const length = Math.max(rowDistance, colDistance) + 1;

    return Array.from({ length }, (_, index) => ({
      row: start.row + rowDelta * index,
      col: start.col + colDelta * index,
    }));
  }

  private findMatchingWord(cells: GridPosition[]): WordSearchHiddenWord | null {
    const puzzle = this.puzzle();

    if (!puzzle) {
      return null;
    }

    const selectedKey = this.pathKey(cells);
    const reversedSelectedKey = this.pathKey([...cells].reverse());

    return (
      puzzle.hiddenWords.find(
        (word) =>
          !this.foundWordIds().has(word.id) &&
          (this.pathKey(word.cells) === selectedKey ||
            this.pathKey(word.cells) === reversedSelectedKey),
      ) ?? null
    );
  }

  private pathKey(cells: GridPosition[]): string {
    return cells.map((cell) => `${cell.row}:${cell.col}`).join('|');
  }

  private foundWordColorIndex(cell: WordSearchCell): number | null {
    const puzzle = this.puzzle();

    if (!puzzle) {
      return null;
    }

    const foundWordId = cell.hiddenWordIds.find((wordId) => this.foundWordIds().has(wordId));

    if (!foundWordId) {
      return null;
    }

    const wordIndex = puzzle.hiddenWords.findIndex((word) => word.id === foundWordId);

    return wordIndex < 0 ? null : wordIndex % 8;
  }

  private wordColorIndex(word: WordSearchHiddenWord): number {
    const puzzle = this.puzzle();

    if (!puzzle) {
      return 0;
    }

    const wordIndex = puzzle.hiddenWords.findIndex((candidate) => candidate.id === word.id);

    return wordIndex < 0 ? 0 : wordIndex % 8;
  }

  private focusFinalAnswer(selectOnFocus = true): void {
    this.suppressNextSelection = !selectOnFocus;
    window.setTimeout(() => this.finalAnswerField?.nativeElement.focus());
  }
}
