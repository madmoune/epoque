import { Component, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MemoryGridColor, MemoryGridShape } from '../memory-grid/memory-grid.model';
import {
  MEMORY_GRID_COLORS,
  MEMORY_GRID_SHAPES,
} from '../memory-grid/memory-grid.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type PairSymbol = {
  id: string;
  name: string;
  color: MemoryGridColor;
  shape: MemoryGridShape;
};

type PairCard = PairSymbol & {
  cardId: string;
};

const PAIR_COUNT = 8;
const MISMATCH_DELAY = 850;

@Component({
  selector: 'app-symbol-pairs-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './symbol-pairs.page.html',
  styleUrl: './symbol-pairs.page.scss',
})
export class SymbolPairsPage implements OnDestroy {
  private mismatchTimer: number | null = null;

  protected readonly cards = signal<PairCard[]>([]);
  protected readonly revealedIndexes = signal<number[]>([]);
  protected readonly matchedIndexes = signal<Set<number>>(new Set());
  protected readonly moves = signal(0);
  protected readonly locked = signal(false);
  protected readonly pairsFound = computed(() => this.matchedIndexes().size / 2);
  protected readonly totalPairs = PAIR_COUNT;
  protected readonly isSolved = computed(
    () => this.cards().length > 0 && this.matchedIndexes().size === this.cards().length,
  );

  constructor() {
    this.newGame();
  }

  protected flipCard(index: number): void {
    if (
      this.locked() ||
      this.matchedIndexes().has(index) ||
      this.revealedIndexes().includes(index)
    ) {
      return;
    }

    const nextRevealed = [...this.revealedIndexes(), index];
    this.revealedIndexes.set(nextRevealed);

    if (nextRevealed.length < 2) {
      return;
    }

    this.moves.update((moves) => moves + 1);
    const [firstIndex, secondIndex] = nextRevealed;
    const cards = this.cards();

    if (cards[firstIndex].id === cards[secondIndex].id) {
      this.matchedIndexes.update(
        (matchedIndexes) => new Set([...matchedIndexes, firstIndex, secondIndex]),
      );
      this.revealedIndexes.set([]);
      return;
    }

    this.locked.set(true);
    this.mismatchTimer = window.setTimeout(() => {
      this.revealedIndexes.set([]);
      this.locked.set(false);
      this.mismatchTimer = null;
    }, MISMATCH_DELAY);
  }

  protected newGame(): void {
    this.clearMismatchTimer();
    const selectedSymbols = this.createSymbols();
    const cards = selectedSymbols.flatMap((symbol) => [
      { ...symbol, cardId: `${symbol.id}-a` },
      { ...symbol, cardId: `${symbol.id}-b` },
    ]);

    this.cards.set(this.shuffle(cards));
    this.revealedIndexes.set([]);
    this.matchedIndexes.set(new Set());
    this.moves.set(0);
    this.locked.set(false);
  }

  protected isCardVisible(index: number): boolean {
    return this.matchedIndexes().has(index) || this.revealedIndexes().includes(index);
  }

  protected cardLabel(card: PairCard, index: number): string {
    if (this.matchedIndexes().has(index)) {
      return `Carte ${index + 1}, paire ${card.name} trouvée`;
    }

    if (this.revealedIndexes().includes(index)) {
      return `Carte ${index + 1}, symbole ${card.name}`;
    }

    return `Carte ${index + 1}, cachée`;
  }

  ngOnDestroy(): void {
    this.clearMismatchTimer();
  }

  private clearMismatchTimer(): void {
    if (this.mismatchTimer !== null) {
      window.clearTimeout(this.mismatchTimer);
      this.mismatchTimer = null;
    }
  }

  private createSymbols(): PairSymbol[] {
    const colors = this.shuffle([...MEMORY_GRID_COLORS]).slice(0, PAIR_COUNT);
    const shapes = this.shuffle([...MEMORY_GRID_SHAPES]);

    return colors.map((color, index) => {
      const shape = shapes[index % shapes.length];

      return {
        id: `${shape}-${color}`,
        name: `${this.shapeLabel(shape)} ${this.colorLabel(color)}`,
        color,
        shape,
      };
    });
  }

  private colorLabel(color: MemoryGridColor): string {
    const labels: Record<MemoryGridColor, string> = {
      blue: 'bleu',
      red: 'rouge',
      gray: 'gris',
      yellow: 'jaune',
      green: 'vert',
      orange: 'orange',
      pink: 'rose',
      purple: 'mauve',
    };

    return labels[color];
  }

  private shapeLabel(shape: MemoryGridShape): string {
    const labels: Record<MemoryGridShape, string> = {
      circle: 'cercle',
      square: 'carré',
      rectangle: 'rectangle',
      triangle: 'triangle',
      losange: 'losange',
      pentagon: 'pentagone',
      hexagon: 'hexagone',
    };

    return labels[shape];
  }

  private shuffle<T>(values: T[]): T[] {
    for (let index = values.length - 1; index > 0; index -= 1) {
      const targetIndex = Math.floor(Math.random() * (index + 1));
      [values[index], values[targetIndex]] = [values[targetIndex], values[index]];
    }

    return values;
  }
}
