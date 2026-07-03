import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  HiddenPhrasePuzzle,
  HiddenPhraseService,
  HiddenPhraseTile,
} from './hidden-phrase.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

@Component({
  selector: 'app-hidden-phrase-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './hidden-phrase.page.html',
  styleUrl: './hidden-phrase.page.scss',
})
export class HiddenPhrasePage {
  private readonly hiddenPhraseService = inject(HiddenPhraseService);

  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly puzzle = signal<HiddenPhrasePuzzle | null>(null);
  protected readonly crossedTileIds = signal<Set<string>>(new Set());

  protected readonly isSolved = computed(() => {
    const puzzle = this.puzzle();

    if (!puzzle) {
      return false;
    }

    return puzzle.tiles.every((tile) => this.crossedTileIds().has(tile.id) === tile.isNoise);
  });

  protected readonly canUseHint = computed(() => {
    const puzzle = this.puzzle();

    if (!puzzle || this.isSolved()) {
      return false;
    }

    return this.findUncrossedNoiseTile(puzzle) !== null;
  });

  constructor() {
    void this.loadPuzzle();
  }

  protected toggleTile(tile: HiddenPhraseTile): void {
    if (this.isSolved()) {
      return;
    }

    this.crossedTileIds.update((crossedTileIds) => {
      const nextCrossedTileIds = new Set(crossedTileIds);

      if (nextCrossedTileIds.has(tile.id)) {
        nextCrossedTileIds.delete(tile.id);
      } else {
        nextCrossedTileIds.add(tile.id);
      }

      return nextCrossedTileIds;
    });
  }

  protected tileClass(tile: HiddenPhraseTile): string {
    return this.crossedTileIds().has(tile.id) ? 'letter-tile crossed' : 'letter-tile';
  }

  protected useHint(): void {
    const puzzle = this.puzzle();

    if (!puzzle || this.isSolved()) {
      return;
    }

    const tile = this.findUncrossedNoiseTile(puzzle);

    if (!tile) {
      return;
    }

    this.crossedTileIds.update((crossedTileIds) => new Set([...crossedTileIds, tile.id]));
  }

  protected restartPuzzle(): void {
    this.crossedTileIds.set(new Set());
  }

  protected newPuzzle(): void {
    try {
      this.puzzle.set(this.hiddenPhraseService.createPuzzle());
      this.crossedTileIds.set(new Set());
    } catch {
      this.loadError.set('Impossible de créer une phrase cachée.');
    }
  }

  private async loadPuzzle(): Promise<void> {
    try {
      await this.hiddenPhraseService.loadPhrases();
      this.newPuzzle();
    } catch {
      this.loadError.set('Impossible de charger la liste de phrases.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private findUncrossedNoiseTile(puzzle: HiddenPhrasePuzzle): HiddenPhraseTile | null {
    const crossedTileIds = this.crossedTileIds();
    const candidates = puzzle.tiles.filter((tile) => tile.isNoise && !crossedTileIds.has(tile.id));

    return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
  }
}
