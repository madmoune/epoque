import { Component, input, linkedSignal, output } from '@angular/core';
import { type CodeClue } from './code-deduction.logic';

type DigitState = 'free' | 'excluded' | 'selected';

export type CodeDigitSelection = {
  readonly digit: string;
  readonly position: number;
  readonly state: DigitState;
};

@Component({
  selector: 'app-code-deduction-clues',
  template: `
    <div class="clue-grid">
      <table aria-label="Essais et indices">
        <thead>
          <tr>
            <th scope="col">Essai</th>
            <th scope="col">Bien placés</th>
            <th scope="col">Mal placés</th>
          </tr>
        </thead>
        <tbody>
          @for (clue of clues(); track clue.attempt) {
            <tr>
              <th scope="row" class="attempt-cell">
                @for (digit of clue.attempt; track $index) {
                  @let state = digitState(digit);
                  <button
                    type="button"
                    class="digit-toggle"
                    data-board-cell
                    [class.is-excluded]="state === 'excluded'"
                    [class.is-selected]="state === 'selected'"
                    [attr.data-state]="state"
                    [attr.aria-label]="digitLabel(digit, state)"
                    [attr.aria-pressed]="state !== 'free'"
                    [attr.data-digit]="digit"
                    (click)="toggleDigit(digit, $index)"
                  >
                    {{ digit }}
                  </button>
                }
              </th>
              <td>{{ clue.wellPlaced }}</td>
              <td>{{ clue.misplaced }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <p class="digit-marking-help">
      Un clic barre le chiffre partout, un deuxième le sélectionne et un troisième le rend libre.
    </p>
  `,
  styleUrl: './code-deduction-clues.component.scss',
})
export class CodeDeductionCluesComponent {
  readonly clues = input.required<readonly CodeClue[]>();
  readonly round = input.required<number>();
  readonly digitSelection = output<CodeDigitSelection>();
  protected readonly digitStates = linkedSignal<ReadonlyMap<string, DigitState>>(() => {
    this.clues();
    this.round();
    return new Map();
  });

  protected digitState(digit: string): DigitState {
    return this.digitStates().get(digit) ?? 'free';
  }

  protected toggleDigit(digit: string, position: number): void {
    this.digitStates.update((states) => {
      const next = new Map(states);
      const state = states.get(digit) ?? 'free';
      const nextState: DigitState =
        state === 'free' ? 'excluded' : state === 'excluded' ? 'selected' : 'free';

      if (nextState === 'free') next.delete(digit);
      else next.set(digit, nextState);

      return next;
    });

    const state = this.digitStates().get(digit) ?? 'free';
    this.digitSelection.emit({ digit, position, state });
  }

  protected digitLabel(digit: string, state: DigitState): string {
    if (state === 'excluded') return `Sélectionner le chiffre ${digit} partout`;
    if (state === 'selected') return `Libérer le chiffre ${digit} partout`;
    return `Barrer le chiffre ${digit} partout`;
  }
}
