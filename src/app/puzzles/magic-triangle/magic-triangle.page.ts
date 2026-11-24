import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  createMagicTriangle,
  TRIANGLE_SIDES,
  TRIANGLE_SLOTS,
  triangleSums,
} from './magic-triangle.logic';

const DRAG_TYPE = 'application/x-epique-triangle-digit';

@Component({
  selector: 'app-magic-triangle-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './magic-triangle.page.html',
  styleUrl: './magic-triangle.page.scss',
})
export class MagicTrianglePage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly notice = signal('');

  protected readonly slots = TRIANGLE_SLOTS;
  protected readonly sides = TRIANGLE_SIDES;
  protected readonly puzzle = signal(createMagicTriangle());
  protected readonly placements = signal<(number | null)[]>(TRIANGLE_SLOTS.map(() => null));
  protected readonly selected = signal<number | null>(null);
  protected readonly sums = computed(() => triangleSums(this.placements()));
  protected readonly isComplete = computed(() =>
    this.placements().every((digit) => digit !== null),
  );
  protected readonly isSolved = computed(() => {
    const [left, right, bottom] = this.sums();
    return left !== null && left === right && left === bottom;
  });
  protected readonly feedback = computed(() =>
    this.isComplete() && !this.isSolved()
      ? 'Les sommes diffèrent. Déplace un chiffre pour équilibrer le triangle.'
      : this.notice(),
  );

  protected selectDigit(digit: number): void {
    if (this.isSolved()) return;
    this.selected.update((selected) => (selected === digit ? null : digit));
    this.notice.set('');
  }

  protected selectSlot(index: number): void {
    if (this.isSolved()) return;

    const digit = this.selected();
    const current = this.placements()[index];
    this.notice.set('');
    if (digit === null) {
      this.selected.set(current);
      if (current === null) this.notice.set('Choisis d’abord un chiffre.');
    } else if (digit === current) {
      const placements = [...this.placements()];
      placements[index] = null;
      this.applyPlacements(placements);
    } else {
      this.moveDigit(digit, index);
    }
  }

  protected startDrag(digit: number, event: DragEvent): void {
    if (this.isSolved() || !event.dataTransfer) return;
    event.dataTransfer.setData(DRAG_TYPE, String(digit));
    event.dataTransfer.effectAllowed = 'move';
  }

  protected allowDrop(event: DragEvent): void {
    if (!this.isSolved() && event.dataTransfer?.types.includes(DRAG_TYPE)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  }

  protected dropDigit(index: number, event: DragEvent): void {
    event.preventDefault();
    const digit = Number(event.dataTransfer?.getData(DRAG_TYPE));
    if (
      !this.isSolved() &&
      this.puzzle().digits.includes(digit) &&
      this.placements()[index] !== digit
    ) {
      this.notice.set('');
      this.moveDigit(digit, index);
    }
  }

  protected slotLabel(index: number): string {
    const digit = this.placements()[index];
    return `${this.slots[index].label}, ${digit === null ? 'case vide' : `chiffre ${digit}`}`;
  }

  protected revealHint(): void {
    if (this.isComplete()) return;

    const current = this.placements();
    const compatible = this.puzzle().solutions.find((solution) =>
      current.every((digit, index) => digit === null || digit === solution[index]),
    );
    if (!compatible) {
      this.notice.set(
        'Ce placement bloque le triangle. Déplace un chiffre pour retrouver une solution.',
      );
      return;
    }

    const index = current.indexOf(null);
    const digit = compatible[index];
    this.moveDigit(digit, index);
    this.notice.set(`Le chiffre ${digit} a été placé dans une case vide.`);
  }

  protected restart(): void {
    this.placements.set(this.slots.map(() => null));
    this.selected.set(null);
    this.notice.set('');
  }

  protected newPuzzle(): void {
    this.puzzle.set(createMagicTriangle(this.puzzle()));
    this.restart();
  }

  private moveDigit(digit: number, index: number): void {
    const placements = [...this.placements()];
    const source = placements.indexOf(digit);
    if (source >= 0) placements[source] = placements[index];
    placements[index] = digit;
    this.applyPlacements(placements);
  }

  private applyPlacements(placements: (number | null)[]): void {
    this.placements.set(placements);
    this.selected.set(null);
    if (this.isSolved()) this.playHistory.markSolved('/triangle-magique');
  }
}
