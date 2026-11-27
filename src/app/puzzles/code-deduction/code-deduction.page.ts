import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { CodeDeductionCluesComponent, CodeDigitSelection } from './code-deduction-clues.component';
import { CODE_LENGTH, createCodeDeductionPuzzle } from './code-deduction.logic';

@Component({
  selector: 'app-code-deduction-page',
  imports: [RouterLink, CodeDeductionCluesComponent, PuzzleSuccessPopupComponent],
  templateUrl: './code-deduction.page.html',
  styleUrl: './code-deduction.page.scss',
})
export class CodeDeductionPage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly hintCount = signal(0);

  protected readonly codeLength = CODE_LENGTH;
  protected readonly puzzle = signal(createCodeDeductionPuzzle());
  protected readonly round = signal(0);
  protected readonly answer = signal(createEmptyAnswer());
  protected readonly feedback = signal('');
  protected readonly isSolved = signal(false);
  protected readonly canShowHint = computed(
    () => !this.isSolved() && this.hintCount() < CODE_LENGTH,
  );
  protected readonly revealedPrefix = computed(() =>
    this.puzzle().solution.slice(0, this.hintCount()),
  );

  protected updateAnswer(index: number, input: HTMLInputElement): void {
    if (this.isSolved()) return;

    const answer = input.value.replace(/\D/g, '').slice(0, 1);
    if (input.value !== answer) input.value = answer;

    this.answer.update((current) =>
      current.map((digit, position) => (position === index ? answer : digit)),
    );
    this.validateAnswer();
  }

  protected useDigitSelection(selection: CodeDigitSelection): void {
    if (this.isSolved()) return;

    this.answer.update((current) => {
      const next = [...current];
      if (selection.state === 'selected') {
        const previousPosition = next.indexOf(selection.digit);
        if (previousPosition !== -1 && previousPosition !== selection.position) {
          next[previousPosition] = '';
        }
        next[selection.position] = selection.digit;
      } else if (selection.state === 'free') {
        next.forEach((digit, position) => {
          if (digit === selection.digit) next[position] = '';
        });
      }
      return next;
    });
    this.validateAnswer();
  }

  private validateAnswer(): void {
    const answer = this.answer().join('');
    if (this.answer().some((digit) => digit === '')) {
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
    this.answer.set(createEmptyAnswer());
    this.feedback.set('');
    this.hintCount.set(0);
    this.round.update((round) => round + 1);
    this.isSolved.set(false);
  }

  protected newPuzzle(): void {
    this.puzzle.set(createCodeDeductionPuzzle(this.puzzle().solution));
    this.resetPuzzle();
  }
}

function createEmptyAnswer(): string[] {
  return Array.from({ length: CODE_LENGTH }, () => '');
}
