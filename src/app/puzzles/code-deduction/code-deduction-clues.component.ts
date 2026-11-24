import { Component, input, linkedSignal } from '@angular/core';
import { type CodeClue } from './code-deduction.logic';

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
                  @let excluded = excludedDigits().has(digit);
                  <button
                    type="button"
                    class="digit-toggle"
                    data-board-cell
                    [class.is-excluded]="excluded"
                    [attr.aria-label]="
                      excluded
                        ? 'Réactiver le chiffre ' + digit
                        : 'Barrer le chiffre ' + digit + ' partout'
                    "
                    [attr.aria-pressed]="excluded"
                    [attr.data-digit]="digit"
                    (click)="toggleDigit(digit)"
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

    <p class="digit-marking-help">Sélectionne un chiffre pour le barrer partout ou le réactiver.</p>
  `,
  styleUrl: './code-deduction-clues.component.scss',
})
export class CodeDeductionCluesComponent {
  readonly clues = input.required<readonly CodeClue[]>();
  readonly round = input.required<number>();
  protected readonly excludedDigits = linkedSignal<ReadonlySet<string>>(() => {
    this.clues();
    this.round();
    return new Set();
  });

  protected toggleDigit(digit: string): void {
    this.excludedDigits.update((digits) => {
      const next = new Set(digits);
      if (next.has(digit)) next.delete(digit);
      else next.add(digit);
      return next;
    });
  }
}
