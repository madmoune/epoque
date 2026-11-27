import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  createNumberNeighborsPuzzle,
  describeConflict,
  findSeatingSolution,
  NEIGHBOR_RULES,
  seatingConflicts,
} from './number-neighbors.logic';

type DragSource = {
  number: number;
  chairIndex: number | null;
};

@Component({
  selector: 'app-number-neighbors-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './number-neighbors.page.html',
  styleUrl: './number-neighbors.page.scss',
})
export class NumberNeighborsPage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly notice = signal('');

  protected readonly rules = NEIGHBOR_RULES;
  protected readonly puzzle = signal(createNumberNeighborsPuzzle());
  protected readonly placements = signal<(number | null)[]>(this.emptyChairs());
  protected readonly selected = signal<number | null>(null);
  private readonly draggedSource = signal<DragSource | null>(null);
  private readonly dragMimeType = 'application/x-number-neighbors';
  protected readonly selectedRule = computed(
    () => this.rules.find(({ id }) => id === this.puzzle().rule)!,
  );
  protected readonly placedCount = computed(
    () => this.placements().filter((number) => number !== null).length,
  );
  protected readonly conflicts = computed(() => seatingConflicts(this.puzzle(), this.placements()));
  protected readonly conflictingChairs = computed(() => new Set(this.conflicts().flat()));
  protected readonly isSolved = computed(
    () => this.placedCount() === this.puzzle().numbers.length && this.conflicts().length === 0,
  );
  protected readonly feedback = computed(() => {
    const [conflict] = this.conflicts();
    if (!conflict) return this.notice();

    const [first, second] = conflict;
    const placement = this.placements();
    return describeConflict(this.puzzle().rule, placement[first]!, placement[second]!);
  });

  protected selectNumber(number: number): void {
    if (this.isSolved()) return;
    this.selected.update((selected) => (selected === number ? null : number));
    this.notice.set('');
  }

  protected selectChair(index: number): void {
    if (this.isSolved()) return;

    const number = this.selected();
    const occupant = this.placements()[index];
    this.notice.set('');

    if (number === null) {
      this.selected.set(occupant);
      if (occupant === null) this.notice.set('Sélectionne d’abord un nombre.');
      return;
    }

    this.placeNumberAt(index, number);
  }

  protected startDraggingNumber(number: number, event: DragEvent): void {
    if (
      this.isSolved() ||
      !this.puzzle().numbers.includes(number) ||
      this.placements().includes(number)
    ) {
      return;
    }

    this.selected.set(null);
    this.notice.set('');
    this.setDragPayload({ number, chairIndex: null }, event);
  }

  protected startDraggingChair(index: number, event: DragEvent): void {
    const number = this.placements()[index];
    if (this.isSolved() || number === null) return;

    this.selected.set(null);
    this.notice.set('');
    this.setDragPayload({ number, chairIndex: index }, event);
  }

  protected allowDrop(event: DragEvent): void {
    if (this.isSolved()) return;

    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  protected dropOnChair(index: number, event: DragEvent): void {
    event.preventDefault();

    if (this.isSolved()) return;

    const source = this.readDragSource(event);
    if (!source) return;

    if (source.chairIndex === null) {
      this.placeNumberAt(index, source.number);
    } else if (source.chairIndex !== index) {
      this.moveOrSwapNumbers(source.chairIndex, index);
    }
    this.draggedSource.set(null);
  }

  protected dropOnTray(event: DragEvent): void {
    event.preventDefault();

    if (this.isSolved()) return;

    const source = this.readDragSource(event);
    if (!source || source.chairIndex === null) return;

    this.removeNumberAt(source.chairIndex);
    this.draggedSource.set(null);
  }

  protected endDragging(): void {
    this.draggedSource.set(null);
  }

  protected chairLabel(index: number): string {
    const { row, column } = this.puzzle().layout.chairs[index];
    const value = this.placements()[index];
    const position = `Chaise, rangée ${row + 1}, colonne ${column + 1}`;
    const occupant = value === null ? 'libre' : `nombre ${value}`;
    return `${position}, ${occupant}${this.conflictingChairs().has(index) ? ', conflit' : ''}`;
  }

  protected revealHint(): void {
    if (this.isSolved() || this.conflicts().length) return;

    const next = [...this.placements()];
    const solution = findSeatingSolution(this.puzzle(), next);
    if (!solution) {
      this.notice.set(
        'Ces placements bloquent la grille. Déplace un nombre déjà assis pour continuer.',
      );
      return;
    }

    const index = next.indexOf(null);
    const value = solution[index];
    next[index] = value;
    this.placeNumbers(next);
    const { row, column } = this.puzzle().layout.chairs[index];
    this.notice.set(`Le nombre ${value} a été placé en rangée ${row + 1}, colonne ${column + 1}.`);
  }

  protected restart(): void {
    this.placements.set(this.emptyChairs());
    this.selected.set(null);
    this.notice.set('');
    this.draggedSource.set(null);
  }

  protected newPuzzle(): void {
    this.loadPuzzle();
  }

  private loadPuzzle(): void {
    this.puzzle.set(createNumberNeighborsPuzzle(this.puzzle()));
    this.restart();
  }

  private emptyChairs(): (number | null)[] {
    return this.puzzle().layout.chairs.map(() => null);
  }

  private placeNumbers(next: (number | null)[]): void {
    this.placements.set(next);
    this.selected.set(null);
    if (this.isSolved()) this.playHistory.markSolved('/voisins-numerotes');
  }

  private placeNumberAt(index: number, number: number): void {
    if (index < 0 || index >= this.placements().length || !this.puzzle().numbers.includes(number)) {
      return;
    }

    const next = [...this.placements()];
    const source = next.indexOf(number);
    if (source === index) {
      next[index] = null;
    } else {
      if (source >= 0) next[source] = next[index];
      next[index] = number;
    }
    this.placeNumbers(next);
  }

  private moveOrSwapNumbers(sourceIndex: number, targetIndex: number): void {
    if (
      sourceIndex < 0 ||
      sourceIndex >= this.placements().length ||
      targetIndex < 0 ||
      targetIndex >= this.placements().length ||
      sourceIndex === targetIndex ||
      this.placements()[sourceIndex] === null
    ) {
      return;
    }

    const next = [...this.placements()];
    [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
    this.placeNumbers(next);
  }

  private removeNumberAt(index: number): void {
    if (index < 0 || index >= this.placements().length || this.placements()[index] === null) {
      return;
    }

    const next = [...this.placements()];
    next[index] = null;
    this.placeNumbers(next);
  }

  private setDragPayload(source: DragSource, event: DragEvent): void {
    this.draggedSource.set(source);

    if (!event.dataTransfer) return;

    const payload = JSON.stringify(source);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(this.dragMimeType, payload);
    event.dataTransfer.setData('text/plain', payload);
  }

  private readDragSource(event: DragEvent): DragSource | null {
    const rawPayload =
      event.dataTransfer?.getData(this.dragMimeType) ||
      event.dataTransfer?.getData('text/plain') ||
      null;

    if (!rawPayload) return this.draggedSource();

    try {
      const payload: unknown = JSON.parse(rawPayload);
      if (!payload || typeof payload !== 'object') return null;

      const record = payload as Record<string, unknown>;
      const number = record['number'];
      const chairIndex = record['chairIndex'];
      if (
        typeof number !== 'number' ||
        !Number.isInteger(number) ||
        !this.puzzle().numbers.includes(number) ||
        !(
          chairIndex === null ||
          (typeof chairIndex === 'number' &&
            Number.isInteger(chairIndex) &&
            chairIndex >= 0 &&
            chairIndex < this.placements().length)
        )
      ) {
        return null;
      }

      return { number, chairIndex };
    } catch {
      return null;
    }
  }
}
