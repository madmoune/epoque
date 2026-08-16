import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type Direction = 'up' | 'right' | 'down' | 'left';
type MirrorOrientation = 0 | 1 | 2 | 3 | 4 | 5;
type MirrorState = 0 | 1 | 2;
type MirrorClicks = Record<number, number>;

type Mirror = {
  id: number;
  row: number;
  col: number;
  orientation: MirrorOrientation;
  orientationOptions: [MirrorOrientation, MirrorOrientation, MirrorOrientation];
  orientationIndex: MirrorState;
  initialOrientation: MirrorOrientation;
  solution: MirrorOrientation;
  solutionIndex: MirrorState;
};

type MirrorEffect = {
  mirrorId: number;
};

type MirrorControl = {
  mirrorId: number;
  effects: MirrorEffect[];
};

type LaserPuzzle = {
  rows: number;
  cols: number;
  startRow: number;
  targetRow: number;
  mirrors: Mirror[];
  controls: MirrorControl[];
  solutionClicks: MirrorClicks;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LaserPage {
  protected readonly puzzle = signal<LaserPuzzle>(this.createPuzzle());
  protected readonly mirrorClicks = signal<MirrorClicks>({});
  protected readonly mirrorsByPosition = computed(
    () =>
      new Map(
        this.puzzle().mirrors.map((mirror) => [this.positionKey(mirror.row, mirror.col), mirror]),
      ),
  );
  protected readonly boardCells = computed(() =>
    Array.from({ length: this.puzzle().rows * this.puzzle().cols }, (_, index) => ({
      row: Math.floor(index / this.puzzle().cols),
      col: index % this.puzzle().cols,
    })),
  );
  protected readonly trace = computed(() => this.traceLaser());
  protected readonly tracePath = computed(() =>
    this.createTracePath(this.trace().segments),
  );
  protected readonly isSolved = computed(
    () => this.trace().reachedTarget && this.mirrorsMatchSolution(),
  );
  protected readonly lockedControls = signal<Set<number>>(new Set());
  protected readonly allControlsLocked = computed(() =>
    this.puzzle().controls.every((control) => this.lockedControls().has(control.mirrorId)),
  );

  protected newPuzzle(): void {
    this.puzzle.set(this.createPuzzle());
    this.mirrorClicks.set({});
    this.lockedControls.set(new Set());
  }

  protected useHint(): void {
    if (this.isSolved()) return;

    const availableControls = this.puzzle().controls.filter(
      (control) => !this.lockedControls().has(control.mirrorId),
    );
    const controlsNeedingAdjustment = availableControls.filter((control) => {
      const currentClicks = (this.mirrorClicks()[control.mirrorId] ?? 0) % 3;

      return currentClicks !== this.puzzle().solutionClicks[control.mirrorId];
    });
    const hintCandidates = controlsNeedingAdjustment.length
      ? controlsNeedingAdjustment
      : availableControls;
    const control = hintCandidates[this.randomInt(0, hintCandidates.length - 1)];

    if (!control) {
      return;
    }

    const currentClicks = (this.mirrorClicks()[control.mirrorId] ?? 0) % 3;
    const targetClicks = this.puzzle().solutionClicks[control.mirrorId];
    const additionalClicks = (targetClicks - currentClicks + 3) % 3;

    this.puzzle.update((puzzle) => {
      let mirrors = puzzle.mirrors;

      for (let click = 0; click < additionalClicks; click += 1) {
        mirrors = this.applyMirrorControl(mirrors, control);
      }

      return { ...puzzle, mirrors };
    });
    this.mirrorClicks.update((clicks) => ({
      ...clicks,
      [control.mirrorId]: targetClicks,
    }));
    this.lockedControls.update((locked) => new Set([...locked, control.mirrorId]));
  }

  protected clickMirror(mirrorId: number): void {
    if (this.isSolved() || this.lockedControls().has(mirrorId)) {
      return;
    }

    const control = this.puzzle().controls.find((candidate) => candidate.mirrorId === mirrorId);

    if (!control) {
      return;
    }

    this.puzzle.update((puzzle) => ({
      ...puzzle,
      mirrors: this.applyMirrorControl(puzzle.mirrors, control),
    }));
    this.mirrorClicks.update((clicks) => ({
      ...clicks,
      [mirrorId]: (clicks[mirrorId] ?? 0) + 1,
    }));
  }

  protected mirrorAt(row: number, col: number): Mirror | undefined {
    return this.mirrorsByPosition().get(this.positionKey(row, col));
  }

  protected controlLocked(mirrorId: number): boolean {
    return this.lockedControls().has(mirrorId);
  }

  protected mirrorOrientationLabel(orientation: MirrorOrientation): string {
    return `${orientation * 90} degrés`;
  }

  private createPuzzle(): LaserPuzzle {
    for (let attempt = 0; attempt < 800; attempt += 1) {
      const candidate = this.createCandidatePuzzle();

      if (this.isValidCandidate(candidate)) {
        return candidate;
      }
    }

    while (true) {
      const candidate = this.createCandidatePuzzle();

      if (this.isValidCandidate(candidate)) {
        return candidate;
      }
    }
  }

  private createCandidatePuzzle(): LaserPuzzle {
    const rows = 5;
    const cols = 7;
    const mirrorCount = 8;
    const startRow = this.randomInt(1, rows - 2);
    const verticalLegs = this.randomInt(2, 3);
    const columns = this.shuffle(Array.from({ length: cols - 2 }, (_, index) => index + 1))
      .slice(0, verticalLegs)
      .sort((first, second) => first - second);
    const solutionPlacements: Array<Pick<Mirror, 'row' | 'col' | 'solution'>> = [];
    const passThroughCandidates: Array<Pick<Mirror, 'row' | 'col' | 'solution'>> = [];
    let currentRow = startRow;
    let previousColumn = -1;

    for (const column of columns) {
      for (let passColumn = previousColumn + 1; passColumn < column; passColumn += 1) {
        passThroughCandidates.push({ row: currentRow, col: passColumn, solution: 4 });
      }

      const nextRow = this.randomRowDifferentFrom(currentRow, rows);
      const turnOrientation = nextRow > currentRow ? 1 : 0;

      solutionPlacements.push({ row: currentRow, col: column, solution: turnOrientation });

      const rowStep = nextRow > currentRow ? 1 : -1;

      for (let passRow = currentRow + rowStep; passRow !== nextRow; passRow += rowStep) {
        passThroughCandidates.push({ row: passRow, col: column, solution: 5 });
      }

      solutionPlacements.push({ row: nextRow, col: column, solution: turnOrientation });
      currentRow = nextRow;
      previousColumn = column;
    }

    for (let passColumn = previousColumn + 1; passColumn < cols; passColumn += 1) {
      passThroughCandidates.push({ row: currentRow, col: passColumn, solution: 4 });
    }

    solutionPlacements.push(
      ...this.shuffle(passThroughCandidates).slice(0, mirrorCount - solutionPlacements.length),
    );
    const controls = this.createMirrorControls(mirrorCount);
    const solutionClicks = Object.fromEntries(
      controls.map((control) => [control.mirrorId, this.randomInt(1, 2)]),
    );
    const mirrors: Mirror[] = solutionPlacements.map((placement, id) => {
      const orientationOptions = this.createOrientationOptions(placement.solution);
      const solutionIndex = orientationOptions.indexOf(placement.solution) as MirrorState;
      const totalRotation = controls.reduce(
        (sum, control) =>
          sum +
          (solutionClicks[control.mirrorId] ?? 0) *
            (control.effects.some((effect) => effect.mirrorId === id) ? 1 : 0),
        0,
      );
      const orientationIndex = ((((solutionIndex - totalRotation) % 3) + 3) % 3) as MirrorState;
      const initialOrientation = orientationOptions[orientationIndex];

      return {
        id,
        row: placement.row,
        col: placement.col,
        orientation: initialOrientation,
        orientationOptions,
        orientationIndex,
        initialOrientation,
        solution: placement.solution,
        solutionIndex,
      };
    });

    return {
      rows,
      cols,
      startRow,
      targetRow: currentRow,
      mirrors,
      controls,
      solutionClicks,
    };
  }

  private createMirrorControls(mirrorCount: number): MirrorControl[] {
    const shuffledIds = this.shuffle(Array.from({ length: mirrorCount }, (_, index) => index));
    const cycleLengths = mirrorCount % 2 === 0 ? [3, mirrorCount - 3] : [mirrorCount];
    const fallbackControls: MirrorControl[] = [];
    let cycleStart = 0;

    for (const cycleLength of cycleLengths) {
      const cycle = shuffledIds.slice(cycleStart, cycleStart + cycleLength);

      cycle.forEach((mirrorId, index) => {
        const nextMirrorId = cycle[(index + 1) % cycle.length];

        fallbackControls.push({
          mirrorId,
          effects: [{ mirrorId }, { mirrorId: nextMirrorId }],
        });
      });

      cycleStart += cycleLength;
    }

    // Odd-length cycles make the control matrix invertible modulo three.
    return fallbackControls.sort((first, second) => first.mirrorId - second.mirrorId);
  }

  private isValidCandidate(puzzle: LaserPuzzle): boolean {
    const solvedMirrors = this.applyMirrorClicks(
      puzzle.mirrors,
      puzzle.controls,
      puzzle.solutionClicks,
    );
    const solvedPuzzle = { ...puzzle, mirrors: solvedMirrors };

    if (
      !this.mirrorsMatchSolutionFor(solvedPuzzle) ||
      !this.tracePuzzle(solvedPuzzle).reachedTarget
    ) {
      return false;
    }

    if (
      this.mirrorsMatchSolutionFor(puzzle) ||
      !this.isInvertibleControlMatrix(puzzle.controls, puzzle.mirrors.length) ||
      !this.hasAtMostOneLinkedMirror(puzzle.controls, puzzle.mirrors.length) ||
      puzzle.controls.some(
        (control) =>
          control.effects.length < 2 ||
          !control.effects.some((effect) => effect.mirrorId === control.mirrorId),
      )
    ) {
      return false;
    }

    return !this.tracePuzzle(puzzle).reachedTarget;
  }

  private hasAtMostOneLinkedMirror(controls: MirrorControl[], mirrorCount: number): boolean {
    const incomingLinks = Array.from({ length: mirrorCount }, () => 0);

    for (const control of controls) {
      const linkedMirrorIds = new Set(
        control.effects
          .map((effect) => effect.mirrorId)
          .filter((mirrorId) => mirrorId !== control.mirrorId),
      );

      if (linkedMirrorIds.size > 1) {
        return false;
      }

      for (const linkedMirrorId of linkedMirrorIds) {
        incomingLinks[linkedMirrorId] += 1;

        if (incomingLinks[linkedMirrorId] > 1) {
          return false;
        }
      }
    }

    return true;
  }

  private traceLaser(): LaserTrace {
    return this.tracePuzzle(this.puzzle());
  }

  private createTracePath(segments: LaserSegment[]): string {
    const compactSegments: LaserSegment[] = [];

    for (const segment of segments) {
      const previous = compactSegments[compactSegments.length - 1];

      if (
        previous &&
        previous.x2 === segment.x1 &&
        previous.y2 === segment.y1 &&
        ((previous.x1 === previous.x2 && segment.x1 === segment.x2) ||
          (previous.y1 === previous.y2 && segment.y1 === segment.y2))
      ) {
        previous.x2 = segment.x2;
        previous.y2 = segment.y2;
      } else {
        compactSegments.push({ ...segment });
      }
    }

    return compactSegments
      .map((segment) => `M ${segment.x1} ${segment.y1} L ${segment.x2} ${segment.y2}`)
      .join(' ');
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

  private applyMirrorControl(mirrors: Mirror[], control: MirrorControl): Mirror[] {
    const affectedMirrors = new Set(control.effects.map((effect) => effect.mirrorId));

    return mirrors.map((mirror) =>
      affectedMirrors.has(mirror.id)
        ? {
            ...mirror,
            orientationIndex: ((mirror.orientationIndex + 1) % 3) as MirrorState,
            orientation:
              mirror.orientationOptions[((mirror.orientationIndex + 1) % 3) as MirrorState],
          }
        : { ...mirror },
    );
  }

  private applyMirrorClicks(
    mirrors: Mirror[],
    controls: MirrorControl[],
    clicks: MirrorClicks,
  ): Mirror[] {
    const controlByMirrorId = new Map(controls.map((control) => [control.mirrorId, control]));
    let result = mirrors.map((mirror) => ({ ...mirror }));

    for (const [mirrorId, count] of Object.entries(clicks)) {
      const control = controlByMirrorId.get(Number(mirrorId));

      for (let click = 0; control && click < count; click += 1) {
        result = this.applyMirrorControl(result, control);
      }
    }

    return result;
  }

  private mirrorsMatchSolution(): boolean {
    return this.mirrorsMatchSolutionFor(this.puzzle());
  }

  private mirrorsMatchSolutionFor(puzzle: LaserPuzzle): boolean {
    return puzzle.mirrors.every((mirror) => mirror.orientationIndex === mirror.solutionIndex);
  }

  private isInvertibleControlMatrix(controls: MirrorControl[], mirrorCount: number): boolean {
    if (controls.length !== mirrorCount) {
      return false;
    }

    const matrix: number[][] = Array.from({ length: mirrorCount }, (_, mirrorId) =>
      controls.map((control) =>
        control.effects.some((effect) => effect.mirrorId === mirrorId) ? 1 : 0,
      ),
    );
    const moduloThree = (value: number) => ((value % 3) + 3) % 3;
    let pivotRow = 0;

    for (let column = 0; column < mirrorCount && pivotRow < mirrorCount; column += 1) {
      const candidateRow = matrix.findIndex(
        (row, rowIndex) => rowIndex >= pivotRow && row[column] !== 0,
      );

      if (candidateRow < 0) {
        continue;
      }

      [matrix[pivotRow], matrix[candidateRow]] = [matrix[candidateRow], matrix[pivotRow]];

      if (matrix[pivotRow][column] === 2) {
        for (let valueIndex = column; valueIndex < mirrorCount; valueIndex += 1) {
          matrix[pivotRow][valueIndex] = moduloThree(matrix[pivotRow][valueIndex] * 2);
        }
      }

      for (let rowIndex = 0; rowIndex < mirrorCount; rowIndex += 1) {
        if (rowIndex === pivotRow || matrix[rowIndex][column] === 0) {
          continue;
        }

        const factor = matrix[rowIndex][column];

        for (let valueIndex = column; valueIndex < mirrorCount; valueIndex += 1) {
          matrix[rowIndex][valueIndex] = moduloThree(
            matrix[rowIndex][valueIndex] - factor * matrix[pivotRow][valueIndex],
          );
        }
      }

      pivotRow += 1;
    }

    return pivotRow === mirrorCount;
  }

  private reflect(direction: Direction, orientation: MirrorOrientation): Direction {
    if (orientation === 4) {
      return direction === 'left' || direction === 'right'
        ? direction
        : this.oppositeDirection(direction);
    }

    if (orientation === 5) {
      return direction === 'up' || direction === 'down'
        ? direction
        : this.oppositeDirection(direction);
    }

    const reflections: Record<'slash' | 'backslash', Record<Direction, Direction>> = {
      slash: { up: 'right', right: 'up', down: 'left', left: 'down' },
      backslash: { up: 'left', right: 'down', down: 'right', left: 'up' },
    };

    return reflections[this.isSlashOrientation(orientation) ? 'slash' : 'backslash'][direction];
  }

  private oppositeDirection(direction: Direction): Direction {
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      right: 'left',
      down: 'up',
      left: 'right',
    };

    return opposites[direction];
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

  private randomRowDifferentFrom(row: number, rowCount: number): number {
    const candidates = Array.from({ length: rowCount }, (_, index) => index).filter(
      (candidate) => Math.abs(candidate - row) >= 2,
    );

    return this.shuffle(candidates)[0] ?? (row === 0 ? 1 : 0);
  }

  private createOrientationOptions(
    solution: MirrorOrientation,
  ): [MirrorOrientation, MirrorOrientation, MirrorOrientation] {
    const distinctOrientations: MirrorOrientation[] = [0, 1, 4, 5];
    const otherOrientations = this.shuffle(
      distinctOrientations.filter((orientation) => orientation !== solution),
    ).slice(0, 2);

    return this.shuffle([solution, ...otherOrientations]) as [
      MirrorOrientation,
      MirrorOrientation,
      MirrorOrientation,
    ];
  }

  private isSlashOrientation(orientation: MirrorOrientation): boolean {
    return orientation % 2 === 0;
  }

  private positionKey(row: number, col: number): string {
    return `${row}:${col}`;
  }

  private shuffle<T>(items: T[]): T[] {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = this.randomInt(0, index);
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
  }

  private randomInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
}
