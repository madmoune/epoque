import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { drawRailRoute, drawRailTiles, parkedTrain, railViewBox } from './railway.drawing';
import {
  cellsForSize,
  createRailPuzzle,
  cycleRailMark,
  EMPTY_RAILS,
  gateAt,
  hasRailCross,
  hasRailLink,
  hasRailMark,
  inspectRailState,
  RAIL_SIZES,
  railColumn,
  railRow,
  RailState,
  railSweep,
  sideBetween,
  toggleRailCross,
  toggleRailLink,
} from './railway.logic';

interface RailGesture {
  pointerId: number;
  before: RailState;
  lastCell: number | null;
  moved: boolean;
}

type RailHint = readonly [from: number, to: number];

@Component({
  selector: 'app-railway-page',
  imports: [NgTemplateOutlet, RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './railway.page.html',
  styleUrl: './railway.page.scss',
})
export class RailwayPage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private gesture: RailGesture | null = null;
  private recordedWin = false;
  private readonly notice = signal('');
  private readonly trainAnimations =
    viewChildren<ElementRef<SVGAnimationElement>>('trainAnimation');

  protected readonly sizes = RAIL_SIZES;
  protected readonly puzzle = signal(createRailPuzzle());
  protected readonly viewBox = computed(() => railViewBox(this.puzzle().size));
  protected readonly state = signal(EMPTY_RAILS);
  protected readonly undoStates = signal<readonly RailState[]>([]);
  protected readonly redoStates = signal<readonly RailState[]>([]);
  protected readonly drawing = signal(false);
  protected readonly keyboardCell = signal<number | null>(null);
  protected readonly hintedLink = signal<RailHint | null>(null);
  protected readonly progress = computed(() => inspectRailState(this.puzzle(), this.state()));
  protected readonly solved = computed(() => !this.drawing() && this.progress().solved);
  protected readonly cells = computed(() =>
    cellsForSize(this.puzzle().size).map((cell) => {
      const gate = gateAt(this.puzzle(), cell);
      const crossed = hasRailCross(this.state(), cell);
      const marked = hasRailMark(this.state(), cell);
      const occupied = this.progress().occupied.includes(cell);
      const hinted = this.hintedLink()?.includes(cell) ?? false;
      const detail = gate
        ? `accès ${gate}`
        : crossed
          ? 'case barrée'
          : marked
            ? 'indicateur de rail'
            : occupied
              ? 'rail'
              : 'case vide';
      return {
        index: cell,
        gate,
        crossed,
        marked,
        hinted,
        label: `Ligne ${railRow(cell, this.puzzle().size) + 1}, colonne ${railColumn(cell, this.puzzle().size) + 1}, ${detail}${hinted ? ', indice' : ''}`,
      };
    }),
  );
  protected readonly tiles = computed(() =>
    drawRailTiles(this.puzzle(), this.progress().neighbors),
  );
  protected readonly trainStation = computed(() =>
    parkedTrain(this.puzzle().start, this.puzzle().size),
  );
  protected readonly trainRoute = computed(() => {
    const route = this.progress().route;
    return this.solved() && route ? drawRailRoute(this.puzzle(), route) : null;
  });
  protected readonly needed = computed(() =>
    this.puzzle().rows.reduce((total, row) => total + row, 0),
  );
  protected readonly feedback = computed(() => {
    if (this.notice()) return this.notice();
    const progress = this.progress();
    if (progress.solved) {
      return this.drawing()
        ? 'Relâche pour valider la voie.'
        : 'La voie respecte tous les compteurs.';
    }
    if (progress.route && !progress.connected)
      return 'Il reste des tronçons isolés à raccorder ou à retirer.';
    if (progress.route) return 'A et B sont reliés. Ajuste la voie pour respecter les compteurs.';
    return `${progress.occupied.length} / ${this.needed()} cases avec un rail`;
  });

  constructor() {
    afterRenderEffect({
      write: () => {
        for (const animation of this.trainAnimations()) animation.nativeElement.beginElement?.();
      },
    });
  }

  protected beginPointer(event: PointerEvent): void {
    if (this.solved() || this.gesture || event.button !== 0) return;
    const cell = this.pointerCell(event);
    if (cell === null) return;

    this.clearSelection();
    this.gesture = {
      pointerId: event.pointerId,
      before: this.state(),
      lastCell: cell,
      moved: false,
    };
    this.drawing.set(true);
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  protected movePointer(event: PointerEvent): void {
    const gesture = this.gesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;

    const cell = this.pointerCell(event);
    if (cell === gesture.lastCell) return;
    gesture.moved = true;
    const previous = gesture.lastCell;
    gesture.lastCell = cell;
    if (previous === null || cell === null) return;

    let from = previous;
    for (const to of railSweep(previous, cell, this.puzzle().size)) {
      if (!this.editLink(from, to)) break;
      from = to;
    }
  }

  protected endPointer(event: PointerEvent): void {
    const gesture = this.gesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    this.movePointer(event);

    const cell = gesture.lastCell;
    if (!gesture.moved && cell !== null) {
      this.state.update((state) => cycleRailMark(this.puzzle(), state, cell));
    }
    this.gesture = null;
    this.drawing.set(false);
    this.recordEdit(gesture.before);
  }

  protected cancelPointer(event: PointerEvent): void {
    if (this.gesture?.pointerId !== event.pointerId) return;
    this.state.set(this.gesture.before);
    this.gesture = null;
    this.drawing.set(false);
    this.clearSelection();
  }

  protected activateCell(cell: number, event: MouseEvent): void {
    if (event.detail !== 0 || this.drawing() || this.solved()) return;
    const from = this.keyboardCell();
    const before = this.state();
    this.notice.set('');
    this.hintedLink.set(null);

    if (from === cell) {
      this.state.set(cycleRailMark(this.puzzle(), before, cell));
      this.keyboardCell.set(null);
    } else {
      this.keyboardCell.set(cell);
      if (from !== null && sideBetween(from, cell, this.puzzle().size)) {
        this.editLink(from, cell);
      } else {
        this.notice.set('Choisis une case voisine pour tracer, ou valide à nouveau pour barrer.');
      }
    }
    this.recordEdit(before);
  }

  protected barCell(cell: number, event: MouseEvent): void {
    event.preventDefault();

    if (this.drawing() || this.solved()) return;

    const before = this.state();
    this.clearSelection();
    this.state.set(toggleRailCross(this.puzzle(), before, cell));
    this.recordEdit(before);
  }

  protected undo(): void {
    const history = this.undoStates();
    const previous = history.at(-1);
    if (!previous || this.drawing()) return;
    this.redoStates.update((states) => [...states, this.state()]);
    this.undoStates.set(history.slice(0, -1));
    this.state.set(previous);
    this.clearSelection();
  }

  protected redo(): void {
    const history = this.redoStates();
    const next = history.at(-1);
    if (!next || this.drawing()) return;
    this.undoStates.update((states) => [...states, this.state()]);
    this.redoStates.set(history.slice(0, -1));
    this.state.set(next);
    this.clearSelection();
    this.recordWin();
  }

  protected restart(): void {
    this.gesture = null;
    this.recordedWin = false;
    this.drawing.set(false);
    this.state.set(EMPTY_RAILS);
    this.undoStates.set([]);
    this.redoStates.set([]);
    this.clearSelection();
  }

  protected changeSize(value: string): void {
    const size = this.sizes.find(({ id }) => id === value);
    if (!size || size.id === this.puzzle().size.id) return;
    this.puzzle.set(createRailPuzzle(undefined, Math.random, size));
    this.restart();
  }

  protected newPuzzle(): void {
    this.puzzle.update((previous) => createRailPuzzle(previous));
    this.restart();
  }

  protected revealHint(): void {
    if (this.solved()) return;

    const puzzle = this.puzzle();
    const route = puzzle.solution;
    const link = route
      .slice(1)
      .map((to, index): RailHint => [route[index], to])
      .find(([from, to]) => !hasRailLink(puzzle, this.state(), from, to));

    if (!link) {
      this.notice.set('Annule un tronçon incorrect pour retrouver la voie solution.');
      return;
    }

    this.hintedLink.set(link);
    this.notice.set(
      `Indice : relie ${this.cellDescription(link[0])} à ${this.cellDescription(link[1])}.`,
    );
  }

  private pointerCell(event: PointerEvent): number | null {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const size = this.puzzle().size;
    const column = Math.floor(((event.clientX - rect.left) / rect.width) * size.columns);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * size.rows);
    return row >= 0 && row < size.rows && column >= 0 && column < size.columns
      ? row * size.columns + column
      : null;
  }

  private editLink(from: number, to: number): boolean {
    const before = this.state();
    const after = toggleRailLink(this.puzzle(), before, from, to);
    if (after === before) {
      this.notice.set('Retire un raccord de la case pour pouvoir en ajouter un autre.');
      return false;
    }
    this.state.set(after);
    this.notice.set('');
    return true;
  }

  private recordEdit(before: RailState): void {
    const current = this.state();
    if (
      before.tracks === current.tracks &&
      before.crosses === current.crosses &&
      before.marks === current.marks
    ) {
      return;
    }
    this.undoStates.update((states) => [...states, before]);
    this.redoStates.set([]);
    this.recordWin();
  }

  private recordWin(): void {
    if (!this.solved() || this.recordedWin) return;
    this.recordedWin = true;
    this.playHistory.markSolved('/voie-ferree');
  }

  private clearSelection(): void {
    this.keyboardCell.set(null);
    this.hintedLink.set(null);
    this.notice.set('');
  }

  private cellDescription(cell: number): string {
    const size = this.puzzle().size;
    return `la case ${railRow(cell, size) + 1},${railColumn(cell, size) + 1}`;
  }
}
