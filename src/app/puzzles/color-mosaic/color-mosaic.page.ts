import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { greatestCommonDivisor } from '../shared/greatest-common-divisor';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  checkColorMosaic,
  createColorMosaic,
  MOSAIC_CELLS,
  MOSAIC_COLORS,
  MOSAIC_INDEXES,
  MOSAIC_SIZE,
  MosaicCell,
  MosaicCheck,
  MosaicClue,
  MosaicColor,
  mosaicColorTotals,
} from './color-mosaic.logic';

const ROUTE = '/mosaique-logique';
const EMPTY_GRID = MOSAIC_CELLS.map(() => null);
const COLOR_LABELS = {
  red: { name: 'Rouge', adjective: 'rouge', letter: 'R' },
  green: { name: 'Vert', adjective: 'verte', letter: 'V' },
  yellow: { name: 'Jaune', adjective: 'jaune', letter: 'J' },
  blue: { name: 'Bleu', adjective: 'bleue', letter: 'B' },
};

interface PaintMove {
  readonly cell: number;
  readonly before: MosaicCell;
}

@Component({
  selector: 'app-color-mosaic-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './color-mosaic.page.html',
  styleUrl: './color-mosaic.page.scss',
})
export class ColorMosaicPage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly puzzle = signal(createColorMosaic());
  private readonly moves = signal<readonly PaintMove[]>([]);
  private readonly result = signal<MosaicCheck | null>(null);

  protected readonly indexes = MOSAIC_INDEXES;
  protected readonly size = MOSAIC_SIZE;
  protected readonly colors = MOSAIC_COLORS;
  protected readonly labels = COLOR_LABELS;
  protected readonly values = signal<readonly MosaicCell[]>(EMPTY_GRID);
  protected readonly brush = signal<MosaicColor | null>(null);
  protected readonly counts = computed(() => mosaicColorTotals(this.values()));
  protected readonly canUndo = computed(() => this.moves().length > 0 && !this.solved());
  protected readonly solved = computed(() => this.result()?.kind === 'solved');
  protected readonly ratios = computed(() => [
    this.describeRatio('green', 'red'),
    this.describeRatio('red', 'yellow'),
  ]);
  protected readonly clues = computed(() =>
    this.puzzle().clues.map((clue) => ({ clue, text: this.describeClue(clue) })),
  );
  protected readonly failedClue = computed(() => {
    const result = this.result();
    return result?.kind === 'position' ? result.clue : null;
  });
  protected readonly feedback = computed(() => {
    const result = this.result();
    switch (result?.kind) {
      case 'incomplete':
        return result.blanks === 1
          ? 'Il reste une case à colorier.'
          : `Il reste ${result.blanks} cases à colorier.`;
      case 'symmetry':
        return `Vérifie la symétrie par rapport à l’axe ${result.axis}.`;
      case 'blue':
        return 'Place une seule case bleue.';
      case 'ratios':
        return 'Vérifie les proportions entre les couleurs.';
      case 'position':
        return 'Vérifie l’indice de position mis en évidence.';
      case 'solved':
        return 'Le motif respecte tous les indices.';
      default:
        return '';
    }
  });

  protected toggleBrush(color: MosaicColor): void {
    if (this.solved()) return;
    this.brush.update((brush) => (brush === color ? null : color));
  }

  protected paint(cell: number): void {
    if (this.solved()) return;
    const before = this.values()[cell];
    const nextIndex = before === null ? 0 : this.colors.indexOf(before) + 1;
    const after = this.brush() ?? this.colors[nextIndex] ?? null;
    if (before === after) return;
    this.moves.update((moves) => [...moves, { cell, before }]);
    this.setColor(cell, after);
    this.validateIfComplete();
  }

  protected undo(): void {
    const move = this.moves().at(-1);
    if (!move || this.solved()) return;
    this.moves.update((moves) => moves.slice(0, -1));
    this.setColor(move.cell, move.before);
    this.validateIfComplete();
  }

  private validate(): void {
    if (this.solved()) return;
    const result = checkColorMosaic(this.puzzle(), this.values());
    this.result.set(result);
    if (result.kind === 'solved') this.playHistory.markSolved(ROUTE);
  }

  protected newPuzzle(): void {
    this.puzzle.update((previous) => createColorMosaic(previous));
    this.values.set(EMPTY_GRID);
    this.brush.set(null);
    this.moves.set([]);
    this.result.set(null);
  }

  private setColor(cell: number, color: MosaicCell): void {
    this.values.update((values) => values.map((value, index) => (index === cell ? color : value)));
    this.result.set(null);
  }

  private validateIfComplete(): void {
    if (this.values().every((value) => value !== null)) this.validate();
  }

  private describeRatio(first: MosaicColor, second: MosaicColor): string {
    const totals = this.puzzle().totals;
    const divisor = greatestCommonDivisor(totals[first], totals[second]);
    return `${this.describeCount(totals[first] / divisor, first)} pour ${this.describeCount(totals[second] / divisor, second)}.`;
  }

  private describeCount(count: number, color: MosaicColor): string {
    const adjective = this.labels[color].adjective;
    return count === 1 ? `1 case ${adjective}` : `${count} cases ${adjective}s`;
  }

  private describeClue(clue: MosaicClue): string {
    if (clue.kind === 'cell') {
      const row = Math.floor(clue.cell / this.size) + 1;
      const column = (clue.cell % this.size) + 1;
      return `La case en ligne ${row}, colonne ${column} est ${this.labels[clue.color].adjective}.`;
    }

    const count = clue.count
      ? this.describeCount(clue.count, clue.color)
      : `Aucune case ${this.labels[clue.color].adjective}`;
    const line = clue.axis === 'row' ? 'sur la ligne' : 'dans la colonne';
    return `${count} ${line} ${clue.line + 1}.`;
  }
}
