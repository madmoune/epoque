import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type Direction = 'up' | 'right' | 'down' | 'left';
type MirrorOrientation = 0 | 1 | 2 | 3;

type Mirror = {
  id: number;
  row: number;
  col: number;
  orientation: MirrorOrientation;
  initialOrientation: MirrorOrientation;
  solution: MirrorOrientation;
  decoy: boolean;
};

type LaserPuzzle = {
  rows: number;
  cols: number;
  startRow: number;
  targetRow: number;
  mirrors: Mirror[];
};

type LaserSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type LaserTrace = {
  segments: LaserSegment[];
  reachedTarget: boolean;
  escaped: boolean;
  looped: boolean;
};

@Component({
  selector: 'app-laser-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './laser.page.html',
  styleUrl: './laser.page.scss',
})
export class LaserPage {
  protected readonly puzzle = signal<LaserPuzzle>(this.createPuzzle());
  protected readonly moves = signal(0);
  protected readonly boardCells = computed(() =>
    Array.from(
      { length: this.puzzle().rows * this.puzzle().cols },
      (_, index) => ({
        row: Math.floor(index / this.puzzle().cols),
        col: index % this.puzzle().cols,
      }),
    ),
  );
  protected readonly trace = computed(() => this.traceLaser());
  protected readonly isSolved = computed(() => this.trace().reachedTarget);
  protected readonly hintVisible = signal(false);
  protected readonly hintMirrorId = computed(() => {
    const mirror = this.puzzle().mirrors.find(
      (candidate) =>
        !candidate.decoy && !this.orientationMatches(candidate.orientation, candidate.solution),
    );

    return mirror?.id ?? null;
  });
  protected readonly hintText = computed(() => {
    const mirror = this.puzzle().mirrors.find((candidate) => candidate.id === this.hintMirrorId());

    return mirror
      ? `Essaie le miroir à la ligne ${mirror.row + 1}, colonne ${mirror.col + 1}.`
      : 'Tous les miroirs utiles sont bien orientés.';
  });

  protected newPuzzle(): void {
    this.puzzle.set(this.createPuzzle());
    this.moves.set(0);
    this.hintVisible.set(false);
  }

  protected resetPuzzle(): void {
    this.puzzle.update((puzzle) => ({
      ...puzzle,
      mirrors: puzzle.mirrors.map((mirror) => ({
        ...mirror,
        orientation: mirror.initialOrientation,
      })),
    }));
    this.moves.set(0);
    this.hintVisible.set(false);
  }

  protected showHint(): void {
    if (this.isSolved()) return;

    this.hintVisible.set(true);
  }

  protected rotateMirror(id: number): void {
    if (this.isSolved()) return;

    this.puzzle.update((puzzle) => ({
      ...puzzle,
      mirrors: puzzle.mirrors.map((mirror) =>
        mirror.id === id
          ? {
              ...mirror,
              orientation: ((mirror.orientation + 1) % 4) as MirrorOrientation,
            }
          : mirror,
      ),
    }));
    this.moves.update((value) => value + 1);
  }

  protected mirrorAt(row: number, col: number): Mirror | undefined {
    return this.puzzle().mirrors.find((mirror) => mirror.row === row && mirror.col === col);
  }

  protected directionLabel(direction: Direction): string {
    return {
      up: 'vers le haut',
      right: 'vers la droite',
      down: 'vers le bas',
      left: 'vers la gauche',
    }[direction];
  }

  protected mirrorOrientationLabel(orientation: MirrorOrientation): string {
    return `${orientation * 90} degrés`;
  }

  protected statusText(): string {
    const trace = this.trace();
    if (trace.reachedTarget) return 'Le laser a atteint la cible.';
    if (trace.looped) return 'Le laser tourne en boucle.';
    return 'Le laser sort de la boîte avant la cible.';
  }

  private createPuzzle(): LaserPuzzle {
    const rows = 7;
    const cols = 8;
    const startRow = this.randomInt(2, rows - 3);
    const upperRow = this.randomInt(1, startRow - 1);
    const lowerRow = this.randomInt(startRow + 1, rows - 2);
    const firstCol = this.randomInt(1, 2);
    const secondCol = this.randomInt(firstCol + 2, cols - 2);

    const solutionPlacements: Array<Pick<Mirror, 'row' | 'col' | 'solution'>> = [
      { row: startRow, col: firstCol, solution: 1 },
      { row: lowerRow, col: firstCol, solution: 1 },
      { row: lowerRow, col: secondCol, solution: 0 },
      { row: upperRow, col: secondCol, solution: 0 },
    ];
    const occupied = new Set(solutionPlacements.map((mirror) => this.positionKey(mirror.row, mirror.col)));
    const decoyPositions: Array<{ row: number; col: number }> = [];

    while (decoyPositions.length < 5) {
      const row = this.randomInt(0, rows - 1);
      const col = this.randomInt(0, cols - 1);
      const key = this.positionKey(row, col);

      if (occupied.has(key) || decoyPositions.some((mirror) => mirror.row === row && mirror.col === col)) {
        continue;
      }

      decoyPositions.push({ row, col });
    }

    const mirrors: Mirror[] = solutionPlacements.map((placement, id) => ({
      id,
      row: placement.row,
      col: placement.col,
      orientation: ((placement.solution + 1) % 4) as MirrorOrientation,
      initialOrientation: ((placement.solution + 1) % 4) as MirrorOrientation,
      solution: placement.solution,
      decoy: false,
    }));

    decoyPositions.forEach((position, index) => {
      mirrors.push({
        id: solutionPlacements.length + index,
        ...position,
        orientation: this.randomOrientation(),
        initialOrientation: 0,
        solution: 0,
        decoy: true,
      });
    });

    const scrambled = mirrors.map((mirror) => ({
      ...mirror,
      initialOrientation: mirror.orientation,
      orientation: mirror.orientation,
    }));

    if (scrambled.slice(0, solutionPlacements.length).every((mirror) =>
      this.orientationMatches(mirror.orientation, mirror.solution),
    )) {
      scrambled[0] = {
        ...scrambled[0],
        orientation: ((scrambled[0].orientation + 1) % 4) as MirrorOrientation,
        initialOrientation: ((scrambled[0].orientation + 1) % 4) as MirrorOrientation,
      };
    }

    const puzzle: LaserPuzzle = {
      rows,
      cols,
      startRow,
      targetRow: upperRow,
      mirrors: scrambled,
    };

    const solutionPuzzle: LaserPuzzle = {
      ...puzzle,
      mirrors: puzzle.mirrors.map((mirror) => ({
        ...mirror,
        orientation: mirror.solution,
      })),
    };

    return this.tracePuzzle(solutionPuzzle).reachedTarget ? puzzle : this.createPuzzle();
  }

  private traceLaser(): LaserTrace {
    return this.tracePuzzle(this.puzzle());
  }

  private tracePuzzle(puzzle: LaserPuzzle): LaserTrace {
    const mirrorByPosition = new Map(
      puzzle.mirrors.map((mirror) => [this.positionKey(mirror.row, mirror.col), mirror]),
    );
    const segments: LaserSegment[] = [];
    const visited = new Set<string>();
    let row = puzzle.startRow;
    let col = 0;
    let direction: Direction = 'right';
    let entry = { x: 0, y: row + 0.5 };

    for (let step = 0; step < puzzle.rows * puzzle.cols * 4; step += 1) {
      if (row < 0 || row >= puzzle.rows || col < 0 || col >= puzzle.cols) {
        const reachedTarget = col >= puzzle.cols && row === puzzle.targetRow;
        return { segments, reachedTarget, escaped: true, looped: false };
      }

      const stateKey = `${row}:${col}:${direction}`;
      if (visited.has(stateKey)) {
        return { segments, reachedTarget: false, escaped: false, looped: true };
      }
      visited.add(stateKey);

      const center = { x: col + 0.5, y: row + 0.5 };
      const mirror = mirrorByPosition.get(this.positionKey(row, col));
      const outgoingDirection: Direction = mirror
        ? this.reflect(direction, mirror.orientation)
        : direction;
      const exit = this.boundaryPoint(row, col, outgoingDirection);

      if (mirror) {
        segments.push({ x1: entry.x, y1: entry.y, x2: center.x, y2: center.y });
        segments.push({ x1: center.x, y1: center.y, x2: exit.x, y2: exit.y });
      } else {
        segments.push({ x1: entry.x, y1: entry.y, x2: exit.x, y2: exit.y });
      }

      const next = this.nextCell(row, col, outgoingDirection);
      row = next.row;
      col = next.col;
      direction = outgoingDirection;
      entry = exit;
    }

    return { segments, reachedTarget: false, escaped: false, looped: true };
  }

  private reflect(direction: Direction, orientation: MirrorOrientation): Direction {
    const reflections: Record<'slash' | 'backslash', Record<Direction, Direction>> = {
      slash: { up: 'right', right: 'up', down: 'left', left: 'down' },
      backslash: { up: 'left', right: 'down', down: 'right', left: 'up' },
    };

    return reflections[this.isSlashOrientation(orientation) ? 'slash' : 'backslash'][direction];
  }

  private boundaryPoint(row: number, col: number, direction: Direction): { x: number; y: number } {
    const center = { x: col + 0.5, y: row + 0.5 };

    return {
      up: { x: center.x, y: row },
      right: { x: col + 1, y: center.y },
      down: { x: center.x, y: row + 1 },
      left: { x: col, y: center.y },
    }[direction];
  }

  private nextCell(row: number, col: number, direction: Direction): { row: number; col: number } {
    const offsets: Record<Direction, { row: number; col: number }> = {
      up: { row: -1, col: 0 },
      right: { row: 0, col: 1 },
      down: { row: 1, col: 0 },
      left: { row: 0, col: -1 },
    };
    const offset = offsets[direction];

    return { row: row + offset.row, col: col + offset.col };
  }

  private randomOrientation(): MirrorOrientation {
    return this.randomInt(0, 3) as MirrorOrientation;
  }

  private isSlashOrientation(orientation: MirrorOrientation): boolean {
    return orientation % 2 === 0;
  }

  private orientationMatches(first: MirrorOrientation, second: MirrorOrientation): boolean {
    return first % 2 === second % 2;
  }

  private positionKey(row: number, col: number): string {
    return `${row}:${col}`;
  }

  private randomInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
}
