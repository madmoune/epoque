import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { resolveVowellessAnswer, vowelHint, VowellessPuzzle } from './vowelless-words.logic';
import { VowellessWordsService } from './vowelless-words.service';

@Component({
  selector: 'app-vowelless-words-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './vowelless-words.page.html',
  styleUrl: './vowelless-words.page.scss',
})
export class VowellessWordsPage {
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
    this.answer.set(value);
    this.feedback.set('');
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const puzzle = this.puzzle();
    if (!puzzle || this.solvedWord()) return;

    const input = this.answer().trim();
    if (!input) {
      this.feedback.set('Écris un mot pour le valider.');
      return;
    }

    const correct = resolveVowellessAnswer(puzzle, input);
    if (correct === null) {
      this.feedback.set('Essaie un autre mot en gardant les consonnes dans le même ordre.');
      return;
    }

    this.answer.set(correct);
    this.solvedWord.set(correct);
    this.feedback.set('Mot trouvé !');
    this.playHistory.markSolved('/mots-sans-voyelles');
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
  }
}
