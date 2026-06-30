import {
  AfterViewInit,
  Component,
  DestroyRef,
  HostListener,
  computed,
  ElementRef,
  inject,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CryptogramCharacter, CryptogramPuzzle } from '../../puzzles/cryptograms/cryptogram.model';
import { CryptogramService } from '../../puzzles/cryptograms/cryptogram.service';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

@Component({
  selector: 'app-cryptograms-page',
  imports: [FormsModule, RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
  templateUrl: './cryptogram.page.html',
  styleUrl: './cryptogram.page.scss',
})
export class CryptogramsPage implements AfterViewInit {
  @ViewChildren('guessInput')
  private readonly guessInputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('wordGroupElement')
  private readonly wordGroupElements!: QueryList<ElementRef<HTMLElement>>;
  private suppressNextSelection = false;

  private readonly cryptogramService = inject(CryptogramService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly puzzle = signal<CryptogramPuzzle | null>(null);
  protected readonly guesses = signal<string[]>([]);
  protected readonly activeCharacterIndex = signal<number | null>(null);
  protected readonly wrappedWordIndexes = signal<Set<number>>(new Set());
  protected readonly lineBreakAfterIndexes = signal<Set<number>>(new Set());
  protected readonly letterKeyboardRows: CustomKeyboardKey[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'backspace'],
    ['clear'],
  ];

  protected readonly characters = computed<CryptogramCharacter[]>(() => {
    const puzzle = this.puzzle();

    if (!puzzle) {
      return [];
    }

    return puzzle.encrypted.split('').map((encryptedCharacter, index) => {
      const answerCharacter = puzzle.answer[index];

      return {
        encryptedCharacter,
        answerCharacter,
        isLetter: this.isLetter(encryptedCharacter),
        index,
      };
    });
  });

  protected readonly wordGroups = computed(() => {
    const groups: CryptogramCharacter[][] = [];
    let currentGroup: CryptogramCharacter[] = [];

    for (const character of this.characters()) {
      if (character.encryptedCharacter === ' ') {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }

        continue;
      }

      currentGroup.push(character);
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  });

  protected readonly isCorrect = computed(() => {
    const puzzle = this.puzzle();

    if (!puzzle) {
      return false;
    }

    const guess = this.guesses().join('');

    return guess === puzzle.answer;
  });

  constructor() {
    void this.loadPuzzle();
  }

  ngAfterViewInit(): void {
    this.wordGroupElements.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.queueWrappedWordHintUpdate());
    this.queueWrappedWordHintUpdate();
  }

  protected updateGuess(index: number, value: string, currentInput: HTMLInputElement): void {
    this.activeCharacterIndex.set(index);
    const nextGuesses = [...this.guesses()];
    const character = value.slice(-1).toUpperCase();

    nextGuesses[index] = character;
    this.guesses.set(nextGuesses);

    if (!character || this.isCorrect()) {
      return;
    }
  }

  protected activateInput(index: number, input: HTMLInputElement): void {
    this.activeCharacterIndex.set(index);
    if (this.suppressNextSelection) {
      this.suppressNextSelection = false;
      return;
    }
    input.select();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected hideKeyboardWhenClickingAway(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('.character-tile input') || target.closest('app-custom-keyboard')) return;
    this.activeCharacterIndex.set(null);
  }

  @HostListener('window:resize')
  protected updateWrappedWordsAfterResize(): void {
    this.queueWrappedWordHintUpdate();
  }

  protected handleKeyboardKey(key: CustomKeyboardKey): void {
    if (this.isCorrect()) return;

    const activeIndex = this.activeCharacterIndex() ?? this.findFirstEmptyGuessIndex();
    if (activeIndex === null) return;

    const input = this.findInputByCharacterIndex(activeIndex);
    if (!input) return;

    if (key === 'backspace') {
      this.handleBackspace(activeIndex, new Event('keyboard'), input);
      return;
    }

    if (key === 'clear') {
      this.clearGuesses();
      input.focus();
      return;
    }

    if (key === 'space') return;

    const nextGuesses = [...this.guesses()];
    nextGuesses[activeIndex] = key;
    this.guesses.set(nextGuesses);

    if (this.isCorrect()) return;
  }

  protected nextPuzzle(): void {
    const nextPuzzle = this.cryptogramService.getRandomPuzzle();

    this.puzzle.set(nextPuzzle);

    this.guesses.set(
      nextPuzzle.answer.split('').map((character) => (this.isLetter(character) ? '' : character)),
    );
    this.activeCharacterIndex.set(null);

    window.setTimeout(() => {
      this.suppressNextSelection = true;
      this.guessInputs.first?.nativeElement.focus();
      this.updateWrappedWordHints();
    });
  }

  private async loadPuzzle(): Promise<void> {
    try {
      await this.cryptogramService.loadSentences();
      this.nextPuzzle();
    } catch (error) {
      console.error('Impossible de charger les phrases du cryptogramme :', error);
      this.loadError.set('Impossible de charger les phrases du cryptogramme.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private isLetter(character: string): boolean {
    return /^[A-Z]$/.test(character);
  }

  protected showHint(): void {
    const puzzle = this.puzzle();

    if (!puzzle || this.isCorrect()) {
      return;
    }

    const missingAnswerLetters = puzzle.answer
      .split('')
      .filter(
        (character, index) => this.isLetter(character) && this.guesses()[index] !== character,
      );

    if (missingAnswerLetters.length === 0) {
      return;
    }

    const hintedLetter =
      missingAnswerLetters[Math.floor(Math.random() * missingAnswerLetters.length)];

    const nextGuesses = [...this.guesses()];

    puzzle.answer.split('').forEach((character, index) => {
      if (character === hintedLetter) {
        nextGuesses[index] = character;
      }
    });

    this.guesses.set(nextGuesses);
  }

  protected handleBackspace(index: number, event: Event, currentInput: HTMLInputElement): void {
    event.preventDefault();

    const nextGuesses = [...this.guesses()];

    if (nextGuesses[index]) {
      nextGuesses[index] = '';
      this.guesses.set(nextGuesses);
      return;
    }

    const previousInput = this.findPreviousInput(currentInput);

    if (!previousInput) {
      return;
    }

    const previousIndex = Number(previousInput.dataset['characterIndex']);

    if (Number.isNaN(previousIndex)) {
      return;
    }

    nextGuesses[previousIndex] = '';
    this.guesses.set(nextGuesses);

    queueMicrotask(() => {
      this.suppressNextSelection = true;
      previousInput.focus();
      this.activeCharacterIndex.set(previousIndex);
    });
  }

  private findInputByCharacterIndex(index: number): HTMLInputElement | undefined {
    return this.guessInputs
      .toArray()
      .map((input) => input.nativeElement)
      .find((input) => Number(input.dataset['characterIndex']) === index);
  }

  private findFirstEmptyGuessIndex(): number | null {
    const index = this.guesses().findIndex((guess, characterIndex) => {
      const character = this.characters()[characterIndex];
      return character?.isLetter && !guess;
    });

    return index === -1 ? null : index;
  }

  private findPreviousInput(currentInput: HTMLInputElement): HTMLInputElement | undefined {
    const inputs = this.guessInputs.toArray().map((input) => input.nativeElement);
    const currentIndex = inputs.indexOf(currentInput);

    if (currentIndex <= 0) {
      return undefined;
    }

    return inputs[currentIndex - 1];
  }

  protected handleGuessKeydown(
    index: number,
    event: KeyboardEvent,
    currentInput: HTMLInputElement,
  ): void {
    if (event.key === 'Backspace') {
      this.handleBackspace(index, event, currentInput);
      return;
    }

    if (!/^[a-zA-Z]$/.test(event.key)) {
      return;
    }

    event.preventDefault();

    const nextGuesses = [...this.guesses()];
    const character = event.key.toUpperCase();

    nextGuesses[index] = character;
    this.guesses.set(nextGuesses);

    if (this.isCorrect()) {
      return;
    }
  }

  protected clearGuesses(): void {
    const puzzle = this.puzzle();

    if (!puzzle || this.isCorrect()) {
      return;
    }

    this.guesses.set(
      puzzle.answer.split('').map((character) => (this.isLetter(character) ? '' : character)),
    );
    this.activeCharacterIndex.set(null);
  }

  private queueWrappedWordHintUpdate(): void {
    window.setTimeout(() => this.updateWrappedWordHints(), 0);
  }

  private updateWrappedWordHints(): void {
    const wrappedIndexes = new Set<number>();
    const lineBreakAfterIndexes = new Set<number>();
    const wordGroups = this.wordGroups();

    this.wordGroupElements.forEach((wordGroup, index) => {
      const childRects: DOMRect[] = [];
      const wordCharacters = wordGroups[index] ?? [];

      Array.from(wordGroup.nativeElement.children).forEach((child) => {
        if (child instanceof HTMLElement) {
          childRects.push(child.getBoundingClientRect());
        }
      });

      childRects.forEach((rect, childIndex) => {
        const nextRect = childRects[childIndex + 1];

        if (nextRect === undefined || nextRect.top - rect.top <= 16 || nextRect.left >= rect.left) {
          return;
        }

        const characterIndex = wordCharacters[childIndex]?.index;

        if (characterIndex !== undefined) {
          wrappedIndexes.add(index);
          lineBreakAfterIndexes.add(characterIndex);
        }
      });
    });

    this.wrappedWordIndexes.set(wrappedIndexes);
    this.lineBreakAfterIndexes.set(lineBreakAfterIndexes);
  }
}
