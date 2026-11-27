import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { resolveVowellessAnswer, vowelHint, VowellessPuzzle } from './vowelless-words.logic';
import { VowellessWordsService } from './vowelless-words.service';

@Component({
  selector: 'app-vowelless-words-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
  templateUrl: './vowelless-words.page.html',
  styleUrl: './vowelless-words.page.scss',
})
export class VowellessWordsPage {
  @ViewChild('answerField')
  private readonly answerField?: ElementRef<HTMLInputElement>;

  private readonly words = inject(VowellessWordsService);
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly puzzle = signal<VowellessPuzzle | null>(null);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly answer = signal('');
  protected readonly feedback = signal('');
  protected readonly solvedWord = signal<string | null>(null);
  protected readonly hintLevel = signal(0);
  protected readonly keyboardVisible = signal(false);
  protected readonly letterKeyboardRows: CustomKeyboardKey[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'backspace'],
    ['clear'],
  ];
  protected readonly maxHintLevel = computed(() => {
    const puzzle = this.puzzle();
    return puzzle ? puzzle.length - puzzle.consonants.length + 1 : 0;
  });
  protected readonly hintedLetters = computed(() => {
    const puzzle = this.puzzle();
    const level = this.hintLevel();
    return puzzle && level > 0 ? vowelHint(puzzle.word, level - 1) : [];
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.failed.set(false);
    try {
      await this.words.loadWords();
      if (!this.destroyRef.destroyed) this.nextPuzzle();
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected updateAnswer(value: string): void {
    if (this.solvedWord()) return;
    this.answer.set(value);
    this.feedback.set('');
    this.validateAnswer();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.validateAnswer();
  }

  private validateAnswer(): void {
    const puzzle = this.puzzle();
    if (!puzzle || this.solvedWord()) return;

    const input = this.answer().trim();
    if (!input) return;

    const correct = resolveVowellessAnswer(puzzle, input);
    if (correct === null) {
      this.feedback.set('Essaie un autre mot en gardant les consonnes dans le même ordre.');
      return;
    }

    this.answer.set(correct);
    this.solvedWord.set(correct);
    this.feedback.set('Mot trouvé !');
    this.keyboardVisible.set(false);
    this.playHistory.markSolved('/mots-sans-voyelles');
  }

  protected showKeyboard(): void {
    if (this.solvedWord()) return;
    this.keyboardVisible.set(true);
  }

  protected handleKeyboardKey(key: CustomKeyboardKey): void {
    if (this.solvedWord()) return;

    if (key === 'backspace') {
      this.updateAnswer(this.answer().slice(0, -1));
    } else if (key === 'clear') {
      this.updateAnswer('');
    } else if (key !== 'space') {
      this.updateAnswer(`${this.answer()}${key}`.slice(0, 24));
    }

    this.focusAnswerField();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected hideKeyboardWhenClickingAway(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (
      target.closest('.answer-input') ||
      target.closest('button') ||
      target.closest('app-custom-keyboard') ||
      target.closest('app-puzzle-success-popup')
    ) {
      return;
    }
    this.keyboardVisible.set(false);
  }

  protected revealHint(): void {
    if (this.solvedWord() || this.hintLevel() >= this.maxHintLevel()) return;
    this.hintLevel.update((level) => level + 1);
  }

  protected nextPuzzle(): void {
    this.puzzle.set(this.words.nextPuzzle());
    this.answer.set('');
    this.feedback.set('');
    this.hintLevel.set(0);
    this.solvedWord.set(null);
    this.keyboardVisible.set(false);
    this.focusAnswerField();
  }

  private focusAnswerField(): void {
    window.setTimeout(() => this.answerField?.nativeElement.focus());
  }
}
