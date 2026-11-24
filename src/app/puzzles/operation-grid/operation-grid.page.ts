import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { OPERATOR_NAMES } from '../shared/binary-operation';
import { NumberDrag, placeNumber } from '../shared/number-placement';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  createOperationGrid,
  OPERATION_GRID_CELLS,
  OPERATION_GRID_DIGITS,
  operationGridStatus,
} from './operation-grid.logic';

@Component({
  selector: 'app-operation-grid-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './operation-grid.page.html',
  styleUrl: './operation-grid.page.scss',
})
export class OperationGridPage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly notice = signal('');

  protected readonly digits = OPERATION_GRID_DIGITS;
  protected readonly cells = OPERATION_GRID_CELLS;
  protected readonly puzzle = signal(createOperationGrid());
  protected readonly placed = signal(this.puzzle().givens);
  protected readonly picked = signal<number | null>(null);
  protected readonly drag = new NumberDrag(inject(DOCUMENT), () => this.clearSelection());
  protected readonly status = computed(() => operationGridStatus(this.puzzle(), this.placed()));
  protected readonly solved = computed(() => this.status().every((status) => status === 'correct'));
  protected readonly feedback = computed(() => {
    if (this.solved()) return 'Les quatre égalités sont justes.';
    if (this.notice()) return this.notice();
    const status = this.status();
    const incorrectColumn = status.slice(0, 3).indexOf('incorrect');
    if (incorrectColumn >= 0) return `Vérifie le calcul de la colonne ${incorrectColumn + 1}.`;
    if (status[3] === 'incorrect') return 'Vérifie le calcul de la dernière ligne.';
    return `${status.filter((state) => state === 'correct').length} / 4 égalités justes`;
  });
  protected readonly boardLabel = computed(() => {
    const { columns, bottom } = this.puzzle();
    const names = columns.map(
      (operator, index) => `${OPERATOR_NAMES[operator]} en colonne ${index + 1}.`,
    );
    return `${names.join(' ')} ${OPERATOR_NAMES[bottom]} sur la dernière ligne.`;
  });

  protected selectNumber(number: number, event: MouseEvent): void {
    if (this.solved() || this.drag.blocksClick(event)) return;
    this.picked.update((picked) => (picked === number ? null : number));
    this.notice.set('');
  }

  protected selectCell(index: number, event: MouseEvent): void {
    if (this.solved() || this.drag.blocksClick(event) || this.puzzle().givens[index] !== null)
      return;

    const current = this.placed()[index];
    const picked = this.picked();
    this.notice.set('');
    if (picked === null) {
      this.picked.set(current);
      if (current === null) this.notice.set('Choisis un chiffre dans la réserve.');
    } else if (picked === current) {
      this.returnNumber(picked);
    } else {
      this.moveNumber(picked, index);
    }
  }

  protected endPointer(event: PointerEvent): void {
    const drop = this.drag.end(event);
    if (!drop || this.solved()) return;
    if (drop.cell === null) {
      this.returnNumber(drop.number);
    } else if (this.placed()[drop.cell] !== drop.number) {
      this.moveNumber(drop.number, drop.cell);
    }
  }

  protected cellLabel(index: number): string {
    const value = this.placed()[index];
    const fixed = this.puzzle().givens[index] !== null ? ', chiffre de départ' : '';
    return `Ligne ${Math.floor(index / 3) + 1}, colonne ${(index % 3) + 1}, ${value ?? 'case vide'}${fixed}`;
  }

  protected revealHint(): void {
    if (this.solved()) return;
    const values = this.placed();
    const { solution } = this.puzzle();
    const mismatch = values.findIndex(
      (number, index) => number !== null && number !== solution[index],
    );
    if (mismatch >= 0) {
      this.picked.set(values[mismatch]);
      this.notice.set(`Déplace le chiffre ${values[mismatch]}.`);
      return;
    }
    const index = values.indexOf(null);
    this.moveNumber(solution[index], index);
    this.notice.set(`Le chiffre ${solution[index]} est maintenant à la bonne place.`);
  }

  protected restart(): void {
    this.drag.reset();
    this.placed.set(this.puzzle().givens);
    this.clearSelection();
  }

  protected newPuzzle(): void {
    this.puzzle.update((previous) => createOperationGrid(previous));
    this.restart();
  }

  private clearSelection(): void {
    this.picked.set(null);
    this.notice.set('');
  }

  private returnNumber(number: number): void {
    this.placed.update((values) => values.map((value) => (value === number ? null : value)));
    this.clearSelection();
  }

  private moveNumber(number: number, index: number): void {
    if (this.puzzle().givens[index] !== null) return;
    this.placed.update((values) => placeNumber(values, number, index));
    this.clearSelection();
    if (this.solved()) this.playHistory.markSolved('/grille-operations');
  }
}
