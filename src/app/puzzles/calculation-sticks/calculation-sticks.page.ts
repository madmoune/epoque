import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  createCalculationSticks,
  formatCalculationSticks,
  STICK_LENGTH,
} from './calculation-sticks.logic';

const SYMBOL_NAMES: Record<string, string> = { '+': 'plus', '−': 'moins', '×': 'fois' };

@Component({
  selector: 'app-calculation-sticks-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './calculation-sticks.page.html',
  styleUrl: './calculation-sticks.page.scss',
})
export class CalculationSticksPage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);

  protected readonly stickLength = STICK_LENGTH;
  protected readonly puzzle = signal(createCalculationSticks());
  protected readonly lifted = signal(0);
  protected readonly answer = signal('');
  protected readonly notice = signal('');
  protected readonly stickHint = signal(false);
  protected readonly calculationHint = signal(false);
  protected readonly solved = signal(false);
  protected readonly pileEmpty = computed(() => this.lifted() === this.puzzle().sticks.length);
  protected readonly visibleSticks = computed(() =>
    this.puzzle()
      .sticks.slice(this.lifted())
      .sort((first, second) => first.y - second.y || first.x - second.x),
  );
  protected readonly expression = computed(() =>
    formatCalculationSticks(
      this.puzzle()
        .sticks.slice(0, this.lifted())
        .map(({ symbol }) => symbol)
        .join(''),
    ),
  );

  protected label(symbol: string, vertical: boolean): string {
    return `Bâtonnet ${vertical ? 'vertical' : 'horizontal'}, ${SYMBOL_NAMES[symbol] ?? symbol}`;
  }

  protected liftStick(id: number): void {
    if (this.pileEmpty() || this.solved()) return;
    if (id !== this.lifted()) {
      this.notice.set('Soulève d’abord le bâtonnet qui passe au-dessus.');
      return;
    }

    this.lifted.update((count) => count + 1);
    this.stickHint.set(false);
    this.notice.set('');
  }

  protected revealHint(): void {
    if (this.solved()) return;
    if (this.pileEmpty()) {
      this.calculationHint.set(true);
    } else {
      this.stickHint.set(true);
      this.notice.set('Le bâtonnet dégagé est entouré.');
    }
  }

  protected updateAnswer(value: string): void {
    this.answer.set(value);
    this.notice.set('');
  }

  protected checkAnswer(event: Event): void {
    event.preventDefault();
    if (this.solved() || !this.pileEmpty()) return;
    const value = this.answer().trim();
    if (!value) {
      this.notice.set('Entre le résultat du calcul.');
      return;
    }
    if (!/^\d+$/.test(value) || Number(value) !== this.puzzle().answer) {
      this.notice.set('Essaie encore en commençant par la multiplication.');
      return;
    }

    this.solved.set(true);
    this.notice.set('');
    this.playHistory.markSolved('/batonnets-de-calcul');
  }

  protected restart(): void {
    this.lifted.set(0);
    this.answer.set('');
    this.notice.set('');
    this.stickHint.set(false);
    this.calculationHint.set(false);
    this.solved.set(false);
  }

  protected newPuzzle(): void {
    this.puzzle.update((previous) => createCalculationSticks(previous));
    this.restart();
  }
}
