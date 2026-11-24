import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { NumberDrag, placeNumber } from '../shared/number-placement';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  createPropertyGrid,
  findPropertyGridSolution,
  PROPERTY_GRID_CELLS,
  PROPERTY_GRID_SIZE,
  propertyGridRules,
} from './property-grid.logic';

@Component({
  selector: 'app-property-grid-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './property-grid.page.html',
  styleUrl: './property-grid.page.scss',
})
export class PropertyGridPage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly notice = signal('');

  protected readonly size = PROPERTY_GRID_SIZE;
  protected readonly puzzle = signal(createPropertyGrid());
  protected readonly placed = signal<(number | null)[]>(PROPERTY_GRID_CELLS.map(() => null));
  protected readonly picked = signal<number | null>(null);
  protected readonly drag = new NumberDrag(inject(DOCUMENT), () => this.clearSelection());
  protected readonly errors = computed(() =>
    this.placed().map((number, index) => {
      if (number === null) return [];
      const [row, column] = propertyGridRules(this.puzzle(), index);
      const failed: string[] = [];
      if (!row.accepts(number)) failed.push(`la règle de ligne « ${row.label} »`);
      if (!column.accepts(number)) failed.push(`la règle de colonne « ${column.label} »`);
      return failed;
    }),
  );
  protected readonly placedCount = computed(
    () => this.placed().filter((number) => number !== null).length,
  );
  protected readonly solved = computed(
    () =>
      this.placedCount() === PROPERTY_GRID_CELLS.length &&
      this.errors().every((cell) => !cell.length),
  );
  protected readonly feedback = computed(() => {
    if (this.solved()) return 'Les six règles sont respectées.';
    if (this.notice()) return this.notice();
    const index = this.errors().findIndex((cell) => cell.length > 0);
    if (index >= 0) {
      return `Déplace ${this.placed()[index]} pour respecter ${this.errors()[index].join(' et ')}.`;
    }
    return `${this.placedCount()} / ${PROPERTY_GRID_CELLS.length} nombres placés`;
  });

  protected selectNumber(number: number, event: MouseEvent): void {
    if (this.solved() || this.drag.blocksClick(event)) return;
    this.picked.update((picked) => (picked === number ? null : number));
    this.notice.set('');
  }

  protected selectCell(index: number, event: MouseEvent): void {
    if (this.solved() || this.drag.blocksClick(event)) return;
    const current = this.placed()[index];
    const picked = this.picked();
    this.notice.set('');

    if (picked === null) {
      this.picked.set(current);
      if (current === null) this.notice.set('Choisis un nombre dans la réserve.');
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
    const [row, column] = propertyGridRules(this.puzzle(), index);
    const value = this.placed()[index];
    const content = value === null ? 'case vide' : `nombre ${value}`;
    const conflicts = this.errors()[index];
    const position = `Ligne ${Math.floor(index / this.size) + 1}, colonne ${(index % this.size) + 1}`;
    return `${position}, ${content}. ${row.label} et ${column.label}.${conflicts.length ? ' Règle à revoir.' : ''}`;
  }

  protected revealHint(): void {
    if (this.solved()) return;
    const placed = this.placed();
    const solution = findPropertyGridSolution(this.puzzle(), placed);
    if (!solution) {
      this.picked.set(null);
      this.notice.set('Déplace un nombre pour libérer la solution.');
      return;
    }

    const index = placed.indexOf(null);
    this.moveNumber(solution[index], index);
    this.notice.set(`Le nombre ${solution[index]} respecte les deux règles de sa case.`);
  }

  protected restart(): void {
    this.drag.reset();
    this.placed.set(PROPERTY_GRID_CELLS.map(() => null));
    this.clearSelection();
  }

  protected newPuzzle(): void {
    this.puzzle.update((previous) => createPropertyGrid(previous));
    this.restart();
  }

  private clearSelection(): void {
    this.picked.set(null);
    this.notice.set('');
  }

  private returnNumber(number: number): void {
    this.placed.update((placed) => placed.map((value) => (value === number ? null : value)));
    this.clearSelection();
  }

  private moveNumber(number: number, index: number): void {
    this.placed.update((placed) => placeNumber(placed, number, index));
    this.clearSelection();
    if (this.solved()) this.playHistory.markSolved('/grille-proprietes');
  }
}
