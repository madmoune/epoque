import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { WordLadderPuzzle, WordLadderService } from './word-ladder.service';

type WordLadderFeedback = {
  tone: 'error' | 'hint';
  text: string;
};

@Component({
  selector: 'app-word-ladder-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './word-ladder.page.html',
  styleUrl: './word-ladder.page.scss',
})
export class WordLadderPage {
  @ViewChild('wordInput')
  private readonly wordInput?: ElementRef<HTMLInputElement>;

  private readonly wordLadderService = inject(WordLadderService);

  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly puzzle = signal<WordLadderPuzzle | null>(null);
  protected readonly ladder = signal<string[]>([]);
  protected readonly answerInput = signal('');
  protected readonly feedback = signal<WordLadderFeedback | null>(null);
  protected readonly hintedWordKeys = signal<Set<string>>(new Set());
  protected readonly hintCount = signal(0);

  protected readonly currentWord = computed(() => this.ladder().at(-1) ?? '');
  protected readonly moveCount = computed(() => Math.max(0, this.ladder().length - 1));
  protected readonly remainingMoves = computed(() => {
    const currentPuzzle = this.puzzle();

    return currentPuzzle ? Math.max(0, currentPuzzle.minimumMoves - this.moveCount()) : 0;
  });
  protected readonly isSolved = computed(() => {
    const currentPuzzle = this.puzzle();

    return (
      currentPuzzle !== null &&
      this.moveCount() === currentPuzzle.minimumMoves &&
      this.wordLadderService.sameWord(this.currentWord(), currentPuzzle.target)
    );
  });
  protected readonly successMessage = computed(() => {
    const moves = this.moveCount();
    const hints = this.hintCount();
    const moveLabel = moves === 1 ? 'changement' : 'changements';

    if (hints === 0) {
      return `Solution optimale trouvée en ${moves} ${moveLabel}, sans indice.`;
    }

    return `Solution optimale trouvée en ${moves} ${moveLabel}, avec ${hints} ${
      hints === 1 ? 'indice' : 'indices'
    }.`;
  });
  protected readonly successAnswer = computed(() => {
    const currentPuzzle = this.puzzle();

    return currentPuzzle
      ? `${currentPuzzle.start.toLocaleUpperCase('fr-CA')} → ${currentPuzzle.target.toLocaleUpperCase('fr-CA')}`
      : '';
  });

  constructor() {
    void this.loadPuzzle();
  }

  protected updateAnswer(value: string): void {
    const maximumLength = this.puzzle()?.letterCount ?? 5;
    const letters = [...value.replace(/[^\p{Letter}]/gu, '')].slice(0, maximumLength).join('');

    this.answerInput.set(letters.toLocaleUpperCase('fr-CA'));
    this.feedback.set(null);
  }

  protected submitWord(): void {
    const currentPuzzle = this.puzzle();
    const candidateInput = this.answerInput().trim();

    if (!currentPuzzle || this.isSolved()) {
      return;
    }

    if (this.remainingMoves() <= 0) {
      this.showError(
        'Le nombre optimal de changements est atteint. Annule une étape ou recommence.',
      );
      return;
    }

    if (this.wordLadderService.normalizedLength(candidateInput) !== currentPuzzle.letterCount) {
      this.showError(`Entre un mot de ${currentPuzzle.letterCount} lettres.`);
      return;
    }

    const candidate = this.wordLadderService.resolveWord(candidateInput);

    if (!candidate) {
      this.showError('Ce mot ne fait pas partie du dictionnaire.');
      return;
    }

    if (this.wordLadderService.sameWord(candidate, this.currentWord())) {
      this.showError('Change exactement une lettre du mot actuel.');
      return;
    }

    if (this.ladder().some((word) => this.wordLadderService.sameWord(word, candidate))) {
      this.showError('Ce mot a déjà été utilisé dans cette échelle.');
      return;
    }

    if (!this.wordLadderService.areNeighbors(this.currentWord(), candidate)) {
      this.showError('Le nouveau mot doit différer d’une seule lettre.');
      return;
    }

    const nextMoveCount = this.moveCount() + 1;
    const reachesTarget = this.wordLadderService.sameWord(candidate, currentPuzzle.target);

    this.ladder.update((words) => [...words, candidate]);
    this.answerInput.set('');

    if (nextMoveCount === currentPuzzle.minimumMoves && !reachesTarget) {
      this.showError(
        'Le nombre optimal de changements est atteint sans le mot cible. Annule une étape ou recommence.',
      );
    } else {
      this.feedback.set(null);
    }

    this.focusInput();
  }

  protected useHint(): void {
    const currentPuzzle = this.puzzle();

    if (!currentPuzzle || this.isSolved()) {
      return;
    }

    if (this.remainingMoves() <= 0) {
      this.showError(
        'Le nombre optimal de changements est atteint. Annule une étape ou recommence.',
      );
      return;
    }

    const usedWords = this.ladder().slice(0, -1);
    const path = this.wordLadderService.findShortestPath(
      this.currentWord(),
      currentPuzzle.target,
      usedWords,
    );

    if (!path || path.length < 2) {
      this.showError('Cette branche est bloquée. Annule un ou plusieurs mots pour continuer.');
      return;
    }

    if (path.length - 1 > this.remainingMoves()) {
      this.showError(
        'Cette branche ne permet plus une solution minimale. Annule une ou plusieurs étapes.',
      );
      return;
    }

    const hintedWord = path[1];

    this.ladder.update((words) => [...words, hintedWord]);
    this.hintedWordKeys.update((wordKeys) => {
      const nextWordKeys = new Set(wordKeys);

      nextWordKeys.add(this.wordLadderService.normalize(hintedWord));
      return nextWordKeys;
    });
    this.hintCount.update((count) => count + 1);
    this.answerInput.set('');
    this.feedback.set({
      tone: 'hint',
      text: `Indice ajouté : ${hintedWord.toLocaleUpperCase('fr-CA')}.`,
    });
    this.focusInput();
  }

  protected undoLastWord(): void {
    if (this.ladder().length <= 1 || this.isSolved()) {
      return;
    }

    const removedWord = this.ladder().at(-1);

    this.ladder.update((words) => words.slice(0, -1));

    if (removedWord && this.isHintedWord(removedWord)) {
      this.hintedWordKeys.update((wordKeys) => {
        const nextWordKeys = new Set(wordKeys);

        nextWordKeys.delete(this.wordLadderService.normalize(removedWord));
        return nextWordKeys;
      });
      this.hintCount.update((count) => Math.max(0, count - 1));
    }

    this.answerInput.set('');
    this.feedback.set(null);
    this.focusInput();
  }

  protected restartPuzzle(): void {
    const currentPuzzle = this.puzzle();

    if (!currentPuzzle) {
      return;
    }

    this.ladder.set([currentPuzzle.start]);
    this.answerInput.set('');
    this.feedback.set(null);
    this.hintedWordKeys.set(new Set());
    this.hintCount.set(0);
    this.focusInput();
  }

  protected newPuzzle(): void {
    try {
      const nextPuzzle = this.wordLadderService.createPuzzle();

      this.puzzle.set(nextPuzzle);
      this.ladder.set([nextPuzzle.start]);
      this.answerInput.set('');
      this.feedback.set(null);
      this.hintedWordKeys.set(new Set());
      this.hintCount.set(0);
      this.focusInput();
    } catch {
      this.loadError.set('Impossible de créer une nouvelle échelle de mots.');
    }
  }

  protected letters(word: string): string[] {
    return [...word.toLocaleUpperCase('fr-CA')];
  }

  protected isHintedWord(word: string): boolean {
    return this.hintedWordKeys().has(this.wordLadderService.normalize(word));
  }

  protected isChangedLetter(stepIndex: number, letterIndex: number): boolean {
    if (stepIndex <= 0) {
      return false;
    }

    const words = this.ladder();
    const previousLetters = [...this.wordLadderService.normalize(words[stepIndex - 1])];
    const currentLetters = [...this.wordLadderService.normalize(words[stepIndex])];

    return previousLetters[letterIndex] !== currentLetters[letterIndex];
  }

  private async loadPuzzle(): Promise<void> {
    try {
      await this.wordLadderService.loadWords();
      this.newPuzzle();
    } catch {
      this.loadError.set('Impossible de charger la liste de mots.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private showError(text: string): void {
    this.feedback.set({ tone: 'error', text });
  }

  private focusInput(): void {
    window.setTimeout(() => this.wordInput?.nativeElement.focus());
  }
}
