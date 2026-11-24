import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  createNumberNeighborsPuzzle,
  describeConflict,
  findSeatingSolution,
  NEIGHBOR_RULES,
  NeighborRule,
  seatingConflicts,
} from './number-neighbors.logic';

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
  protected readonly puzzle = signal(createNumberNeighborsPuzzle('prime-gap'));
  protected readonly placements = signal<(number | null)[]>(this.emptyChairs());
  protected readonly selected = signal<number | null>(null);
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
    const next = [...this.placements()];
    const occupant = next[index];
    this.notice.set('');

    if (number === null) {
      this.selected.set(occupant);
      if (occupant === null) this.notice.set('Sélectionne d’abord un nombre.');
      return;
    }

    const source = next.indexOf(number);
    if (source === index) {
      next[index] = null;
    } else {
      if (source >= 0) next[source] = occupant;
      next[index] = number;
    }
    this.placeNumbers(next);
  }

  protected chairLabel(index: number): string {
    const { row, column } = this.puzzle().layout.chairs[index];
    const value = this.placements()[index];
    const position = `Chaise, rangée ${row + 1}, colonne ${column + 1}`;
    const occupant = value === null ? 'libre' : `nombre ${value}`;
    return `${position}, ${occupant}${this.conflictingChairs().has(index) ? ', conflit' : ''}`;
  }

  protected changeRule(value: string): void {
    const next = this.rules.find(({ id }) => id === value);
    if (next && next.id !== this.puzzle().rule) this.loadPuzzle(next.id);
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
  }

  protected newPuzzle(): void {
    this.loadPuzzle(this.puzzle().rule);
  }

  private loadPuzzle(rule: NeighborRule): void {
    this.puzzle.set(createNumberNeighborsPuzzle(rule, this.puzzle()));
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
}
