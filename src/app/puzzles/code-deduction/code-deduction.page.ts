import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { CODE_LENGTH, createCodeDeductionPuzzle } from './code-deduction.logic';

@Component({
  selector: 'app-code-deduction-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './code-deduction.page.html',
  styleUrl: './code-deduction.page.scss',
})
export class CodeDeductionPage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly hintCount = signal(0);

  protected readonly codeLength = CODE_LENGTH;
  protected readonly puzzle = signal(createCodeDeductionPuzzle());
  protected readonly answer = signal('');
  protected readonly feedback = signal('');
  protected readonly isSolved = signal(false);
  protected readonly canShowHint = computed(
    () => !this.isSolved() && this.hintCount() < CODE_LENGTH,
  );
  protected readonly revealedPrefix = computed(() =>
    this.puzzle().solution.slice(0, this.hintCount()),
  );

  protected updateAnswer(input: HTMLInputElement): void {
    if (this.isSolved()) return;

    const answer = input.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (input.value !== answer) input.value = answer;

    this.answer.set(answer);
    if (answer.length < CODE_LENGTH) {
      this.feedback.set('');
      return;
    }
    if (new Set(answer).size !== CODE_LENGTH) {
      this.feedback.set('Utilise quatre chiffres différents.');
      return;
    }
    if (answer !== this.puzzle().solution) {
      this.feedback.set('Ce code ne correspond pas aux indices.');
      return;
    }

    this.feedback.set('');
    this.isSolved.set(true);
    this.playHistory.markSolved('/code-deduction');
  }

  protected showHint(): void {
    if (this.canShowHint()) this.hintCount.update((count) => count + 1);
  }

  protected resetPuzzle(): void {
    this.answer.set('');
    this.feedback.set('');
    this.hintCount.set(0);
    this.isSolved.set(false);
  }

  protected newPuzzle(): void {
    this.puzzle.set(createCodeDeductionPuzzle(this.puzzle().solution));
    this.resetPuzzle();
  }
}
