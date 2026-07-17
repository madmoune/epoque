import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { PivotWordService } from './pivot-word.service';

@Component({
  selector: 'app-pivot-word-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './pivot-word.page.html',
  styleUrl: './pivot-word.page.scss',
})
export class PivotWordPage {
  @ViewChild('answerInputField')
  private readonly answerInputField?: ElementRef<HTMLInputElement>;

  private readonly pivotWordService = inject(PivotWordService);

  protected readonly puzzle = signal(this.pivotWordService.createPuzzle());
  protected readonly answerInput = signal('');
  protected readonly hintLevel = signal(0);
  protected readonly isSolved = signal(false);
  protected readonly isRevealed = signal(false);

  protected readonly isFinished = computed(() => this.isSolved() || this.isRevealed());
  protected readonly firstLetter = computed(() =>
    [...this.puzzle().answer.toLocaleUpperCase('fr-CA')].at(0),
  );
  protected readonly answerLength = computed(
    () => [...this.pivotWordService.normalizeAnswer(this.puzzle().answer)].length,
  );
  protected readonly successMessage = computed(() => {
    if (this.isRevealed()) {
      return 'Observe les trois expressions pour retenir leur lien commun.';
    }

    const hints = this.hintLevel();

    return hints === 0
      ? 'Mot trouvé sans indice.'
      : `Mot trouvé avec ${hints} indice${hints > 1 ? 's' : ''}.`;
  });

  protected updateAnswer(value: string): void {
    if (this.isFinished()) {
      return;
    }

    const letters = [...value.replace(/[^\p{Letter}]/gu, '')].slice(0, 20).join('');

    this.answerInput.set(letters.toLocaleUpperCase('fr-CA'));

    if (this.pivotWordService.isCorrect(this.puzzle(), this.answerInput())) {
      this.isSolved.set(true);
    }
  }

  protected useHint(): void {
    if (this.isFinished() || this.hintLevel() >= 3) {
      return;
    }

    this.hintLevel.update((level) => level + 1);
    this.focusAnswer(false);
  }

  protected revealAnswer(): void {
    if (this.isFinished()) {
      return;
    }

    this.answerInput.set(this.puzzle().answer.toLocaleUpperCase('fr-CA'));
    this.isRevealed.set(true);
  }

  protected newPuzzle(): void {
    this.puzzle.set(this.pivotWordService.createPuzzle());
    this.answerInput.set('');
    this.hintLevel.set(0);
    this.isSolved.set(false);
    this.isRevealed.set(false);
    this.focusAnswer(false);
  }

  protected showExpression(linkIndex: number): boolean {
    return this.isFinished() || (this.hintLevel() >= 3 && linkIndex === 0);
  }

  private focusAnswer(selectContent: boolean): void {
    window.setTimeout(() => {
      this.answerInputField?.nativeElement.focus();

      if (selectContent) {
        this.answerInputField?.nativeElement.select();
      }
    });
  }
}
