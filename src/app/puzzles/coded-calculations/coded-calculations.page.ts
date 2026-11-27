import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { BINARY_OPERATORS, OPERATOR_NAMES } from '../shared/binary-operation';
import { NumberDrag, placeNumber } from '../shared/number-placement';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  calculateSymbol,
  calculationKey,
  CalculationTrial,
  CODED_CALCULATION_LIMIT,
  CODED_DIGITS,
  CODED_SYMBOLS,
  CodedCalculation,
  createCodedDigits,
} from './coded-calculations.logic';

const ROUTE = '/calcul-code';
const EMPTY_DRAFT = [null, null, null] as const;
const SLOTS = ['Premier symbole', 'Opération', 'Deuxième symbole'];

@Component({
  selector: 'app-coded-calculations-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './coded-calculations.page.html',
  styleUrl: './coded-calculations.page.scss',
})
export class CodedCalculationsPage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly secret = signal<readonly number[]>(createCodedDigits());

  protected readonly symbols = CODED_SYMBOLS;
  protected readonly operators = BINARY_OPERATORS;
  protected readonly digits = CODED_DIGITS;
  protected readonly limit = CODED_CALCULATION_LIMIT;
  protected readonly slots = SLOTS;
  protected readonly tokens = [
    ...this.symbols,
    ...this.operators.map((operator) => ({ glyph: operator, label: OPERATOR_NAMES[operator] })),
  ];
  protected readonly draft = signal<readonly (number | null)[]>(EMPTY_DRAFT);
  protected readonly trials = signal<readonly CalculationTrial[]>([]);
  protected readonly guesses = signal<readonly (number | null)[]>(this.symbols.map(() => null));
  protected readonly solved = signal(false);
  protected readonly showHint = signal(false);
  protected readonly feedback = signal('');
  protected readonly successfulTrials = computed(() =>
    this.trials().filter((trial) => trial.result !== null),
  );
  protected readonly drag = new NumberDrag(inject(DOCUMENT), () => this.feedback.set(''));
  protected readonly canCompose = computed(
    () => !this.solved() && this.trials().length < this.limit,
  );
  protected readonly calculation = computed<CodedCalculation | null>(() => {
    const [left, sign, right] = this.draft();
    if (left === null || sign === null || right === null) return null;
    return { left, operator: this.operators[sign - this.symbols.length], right };
  });
  protected readonly displayedTrial = computed(() => {
    const calculation = this.calculation();
    if (!calculation) return undefined;
    const key = calculationKey(calculation);
    return this.trials().find((trial) => calculationKey(trial) === key);
  });

  protected selectToken(token: number, event: MouseEvent): void {
    if (!this.canCompose() || this.drag.blocksClick(event)) return;
    const draft = this.draft();
    const previous = draft.indexOf(token);
    if (previous !== -1) {
      this.clearSlot(previous, event);
      return;
    }
    const slot = token >= this.symbols.length ? 1 : draft[0] === null ? 0 : 2;
    this.placeToken(token, slot);
  }

  protected clearSlot(slot: number, event: MouseEvent): void {
    if (!this.canCompose() || this.drag.blocksClick(event)) return;
    this.draft.update((draft) => draft.map((token, index) => (index === slot ? null : token)));
    this.feedback.set('');
  }

  protected endPointer(event: PointerEvent): void {
    const drop = this.drag.end(event);
    if (!drop || drop.cell === null || !this.canCompose()) return;
    this.placeToken(drop.number, drop.cell);
  }

  protected testCalculation(): void {
    const calculation = this.calculation();
    if (!calculation || !this.canCompose()) return;
    if (this.displayedTrial()) {
      this.feedback.set('Ce calcul a déjà été testé.');
      return;
    }

    const result = calculateSymbol(this.secret(), calculation);
    this.trials.update((trials) => [...trials, { ...calculation, result }]);
    this.feedback.set(result === null ? '✕ Résultat sans symbole.' : '');
  }

  protected updateGuess(index: number, event: Event): void {
    if (this.solved()) return;
    const value = Number((event.target as HTMLSelectElement).value);
    const digit = this.digits.includes(value) ? value : null;
    this.guesses.update((guesses) => guesses.map((guess, i) => (index === i ? digit : guess)));
    this.feedback.set('');
    this.validateGuesses();
  }

  private validateGuesses(): void {
    if (this.solved()) return;
    const guesses = this.guesses();
    if (guesses.includes(null)) return;

    if (new Set(guesses).size !== this.symbols.length) {
      this.feedback.set('Utilise chaque chiffre une seule fois.');
    } else if (guesses.some((guess, index) => guess !== this.secret()[index])) {
      this.feedback.set('Au moins un chiffre est à revoir.');
    } else {
      this.solved.set(true);
      this.feedback.set('Les huit chiffres sont exacts.');
      this.drag.reset();
      this.playHistory.markSolved(ROUTE);
    }
  }

  protected newPuzzle(): void {
    this.secret.update((digits) => createCodedDigits(digits));
    this.drag.reset();
    this.draft.set(EMPTY_DRAFT);
    this.trials.set([]);
    this.guesses.set(this.symbols.map(() => null));
    this.solved.set(false);
    this.showHint.set(false);
    this.feedback.set('');
  }

  private placeToken(token: number, slot: number): void {
    if (token >= this.symbols.length !== (slot === 1)) return;
    this.draft.update((draft) => placeNumber(draft, token, slot));
    this.feedback.set('');
    this.testCalculation();
  }
}
