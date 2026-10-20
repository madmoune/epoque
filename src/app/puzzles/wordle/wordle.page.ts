import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
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
import { WordLadderService } from '../word-ladder/word-ladder.service';
import { scoreWordleGuess, WordleTile, WordleTileState } from './wordle.logic';

type WordleStatus = 'playing' | 'won' | 'lost';
type WordleFeedback = {
  tone: 'error' | 'info';
  text: string;
};
type WordleBoardRow = {
  active: boolean;
  submitted: boolean;
  tiles: WordleTile[];
};
type WordleKeyState = Extract<WordleTileState, 'correct' | 'present' | 'absent'>;

@Component({
  selector: 'app-wordle-page',
  imports: [RouterLink, CustomKeyboardComponent, PuzzleSuccessPopupComponent],
  templateUrl: './wordle.page.html',
  styleUrl: './wordle.page.scss',
})
export class WordlePage {
  @ViewChild('wordInput')
  private readonly wordInput?: ElementRef<HTMLInputElement>;

  private readonly wordLadderService = inject(WordLadderService);
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly wordLength = 5 as const;

  protected readonly maxAttempts = 6;
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly target = signal('');
  protected readonly guesses = signal<string[]>([]);
  protected readonly guessInput = signal('');
  protected readonly status = signal<WordleStatus>('playing');
  protected readonly feedback = signal<WordleFeedback | null>(null);
  protected readonly wordPoolCount = signal(0);
  protected readonly letterKeyboardRows: CustomKeyboardKey[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'backspace'],
    ['clear'],
  ];

  protected readonly isFinished = computed(() => this.status() !== 'playing');
  protected readonly isWon = computed(() => this.status() === 'won');
  protected readonly isLost = computed(() => this.status() === 'lost');
  protected readonly boardRows = computed<WordleBoardRow[]>(() => {
    const rows = this.guesses().map((guess) => ({
      active: false,
      submitted: true,
      tiles: scoreWordleGuess(guess, this.target()),
    }));

    if (!this.isFinished()) {
      rows.push({
        active: true,
        submitted: false,
        tiles: this.inputTiles(this.guessInput()),
      });
    }

    while (rows.length < this.maxAttempts) {
      rows.push({
        active: false,
        submitted: false,
        tiles: this.inputTiles(''),
      });
    }

    return rows;
  });
  protected readonly keyboardStates = computed<Record<string, WordleKeyState>>(() => {
    const states: Record<string, WordleKeyState> = {};
    const priority: Record<WordleKeyState, number> = {
      absent: 1,
      present: 2,
      correct: 3,
    };

    for (const guess of this.guesses()) {
      for (const tile of scoreWordleGuess(guess, this.target())) {
        if (tile.state !== 'correct' && tile.state !== 'present' && tile.state !== 'absent') {
          continue;
        }

        const key = this.wordLadderService.normalize(tile.letter).toLocaleUpperCase('fr-CA');
        const previousState = states[key];

        if (!previousState || priority[tile.state] > priority[previousState]) {
          states[key] = tile.state;
        }
      }
    }

    return states;
  });
  protected readonly attemptsLabel = computed(
    () => `${this.guesses().length} / ${this.maxAttempts}`,
  );
  protected readonly successMessage = computed(() => {
    const attempts = this.guesses().length;

    return `Mot trouvé en ${attempts} ${attempts === 1 ? 'essai' : 'essais'}.`;
  });
  protected readonly lossMessage = computed(
    () => `Le mot mystère était ${this.displayWord(this.target())}.`,
  );

  constructor() {
    effect(() => {
      if (this.isWon()) {
        this.playHistory.markSolved('/wordle');
      }
    });

    void this.loadWords();
  }

  @HostListener('window:keydown.enter', ['$event'])
  protected submitWithEnter(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      return;
    }

    if (!this.isFinished()) {
      event.preventDefault();
      this.submitGuess();
    }
  }

  protected updateGuessInput(value: string): void {
    const letters = [...value.replace(/[^\p{Letter}]/gu, '')].slice(0, this.wordLength).join('');

    this.guessInput.set(letters.toLocaleUpperCase('fr-CA'));
    this.feedback.set(null);
  }

  protected handleKeyboardKey(key: CustomKeyboardKey): void {
    if (this.isFinished()) {
      return;
    }

    if (key === 'backspace') {
      this.updateGuessInput(this.guessInput().slice(0, -1));
      this.focusInput();
      return;
    }

    if (key === 'clear') {
      this.updateGuessInput('');
      this.focusInput();
      return;
    }

    if (key === 'space') {
      return;
    }

    this.updateGuessInput(`${this.guessInput()}${key}`);
    this.focusInput();
  }

  protected submitGuess(): void {
    const candidateInput = this.guessInput().trim();

    if (this.isFinished() || !this.target()) {
      return;
    }

    if (this.wordLadderService.normalizedLength(candidateInput) !== this.wordLength) {
      this.showError(`Entre un mot de ${this.wordLength} lettres.`);
      return;
    }

    const candidate = this.wordLadderService.resolveWord(candidateInput);

    if (!candidate || this.wordLadderService.normalizedLength(candidate) !== this.wordLength) {
      this.showError('Ce mot ne fait pas partie de la liste des word-ladders.');
      return;
    }

    const nextAttemptCount = this.guesses().length + 1;
    this.guesses.update((guesses) => [...guesses, candidate]);
    this.guessInput.set('');

    if (this.wordLadderService.sameWord(candidate, this.target())) {
      this.status.set('won');
      this.feedback.set(null);
      return;
    }

    if (nextAttemptCount >= this.maxAttempts) {
      this.status.set('lost');
      this.feedback.set({ tone: 'info', text: this.lossMessage() });
      return;
    }

    const remainingAttempts = this.maxAttempts - nextAttemptCount;
    this.feedback.set({
      tone: 'info',
      text: `Pas encore. Il reste ${remainingAttempts} ${remainingAttempts === 1 ? 'essai' : 'essais'}.`,
    });
    this.focusInput();
  }

  protected restartGame(): void {
    if (!this.target()) {
      return;
    }

    this.guesses.set([]);
    this.guessInput.set('');
    this.status.set('playing');
    this.feedback.set(null);
    this.focusInput();
  }

  protected newGame(): void {
    try {
      const words = this.wordLadderService.wordsForLength(this.wordLength);

      if (words.length === 0) {
        throw new Error('The five-letter word list is empty.');
      }

      const previousTarget = this.target();
      const candidates = words.filter(
        (word) => !this.wordLadderService.sameWord(word, previousTarget),
      );
      const pool = candidates.length > 0 ? candidates : words;
      const nextTarget = pool[Math.floor(Math.random() * pool.length)];

      this.target.set(nextTarget);
      this.wordPoolCount.set(words.length);
      this.guesses.set([]);
      this.guessInput.set('');
      this.status.set('playing');
      this.feedback.set(null);
      this.loadError.set(null);
      this.focusInput();
    } catch {
      this.loadError.set('Impossible de préparer le jeu de mots. Réessaie dans un instant.');
    }
  }

  protected retryLoad(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    void this.loadWords();
  }

  protected tileLabel(tile: WordleTile): string {
    if (!tile.letter) {
      return 'Case vide';
    }

    const stateLabels: Record<WordleTileState, string> = {
      empty: 'case vide',
      tbd: 'lettre saisie',
      correct: 'bonne lettre, bonne place',
      present: 'bonne lettre, mauvaise place',
      absent: 'lettre absente',
    };

    return `${tile.letter}, ${stateLabels[tile.state]}`;
  }

  private async loadWords(): Promise<void> {
    try {
      await this.wordLadderService.loadWords();
      this.isLoading.set(false);
      this.newGame();
    } catch {
      this.loadError.set('Impossible de charger la liste de mots. Réessaie dans un instant.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private inputTiles(value: string): WordleTile[] {
    const letters = [...value.toLocaleUpperCase('fr-CA')];

    return Array.from({ length: this.wordLength }, (_, index) => ({
      letter: letters[index] ?? '',
      state: letters[index] ? 'tbd' : 'empty',
    }));
  }

  private displayWord(word: string): string {
    return word.toLocaleUpperCase('fr-CA');
  }

  private showError(text: string): void {
    this.feedback.set({ tone: 'error', text });
  }

  private focusInput(): void {
    window.setTimeout(() => this.wordInput?.nativeElement.focus(), 0);
  }
}
