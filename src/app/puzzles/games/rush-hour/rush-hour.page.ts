import { Component, HostListener, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../../shared/puzzle-success-popup/puzzle-success-popup.component';
import { Orientation, Vehicle } from './rush-hour.generator';

@Component({
  selector: 'app-rush-hour-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './rush-hour.page.html',
  styleUrl: './rush-hour.page.scss',
})
export class RushHourPage implements OnDestroy {
  private readonly size = 6;
  private generatorWorker: Worker | null = null;
  private readonly preparedPuzzles: Vehicle[][] = [];
  private initialVehicles: Vehicle[] = [];
  private waitingForPuzzle = false;
  private dragState: {
    vehicleId: string;
    orientation: Orientation;
    startX: number;
    startY: number;
    cellSize: number;
    appliedSteps: number;
  } | null = null;

  protected readonly cells = Array.from({ length: 36 });
  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly moves = signal(0);
  protected readonly isGenerating = signal(false);
  protected readonly generationBatch = signal(0);
  protected readonly isSolved = computed(() => {
    if (this.isGenerating()) return false;
    const target = this.vehicles().find((vehicle) => vehicle.target);
    return !!target && target.column + target.length === this.size;
  });

  constructor() {
    this.newGame();
  }

  protected newGame(): void {
    const preparedPuzzle = this.preparedPuzzles.shift();
    if (preparedPuzzle) {
      this.showPuzzle(preparedPuzzle);
      this.startBackgroundGeneration();
      return;
    }

    if (this.waitingForPuzzle) return;
    this.waitingForPuzzle = true;
    this.isGenerating.set(true);
    if (!this.generatorWorker) this.startBackgroundGeneration();
  }

  ngOnDestroy(): void {
    this.generatorWorker?.terminate();
  }

  protected resetGame(): void {
    if (!this.initialVehicles.length || this.isGenerating()) return;
    this.vehicles.set(this.initialVehicles.map((vehicle) => ({ ...vehicle })));
    this.moves.set(0);
    this.dragState = null;
  }

  protected move(vehicleId: string, direction: -1 | 1): void {
    if (this.isSolved() || !this.canMove(vehicleId, direction)) return;

    this.vehicles.update((vehicles) =>
      vehicles.map((vehicle) => {
        if (vehicle.id !== vehicleId) return vehicle;
        return vehicle.orientation === 'horizontal'
          ? { ...vehicle, column: vehicle.column + direction }
          : { ...vehicle, row: vehicle.row + direction };
      }),
    );
    this.moves.update((value) => value + 1);
  }

  protected canMove(vehicleId: string, direction: -1 | 1): boolean {
    const vehicles = this.vehicles();
    const vehicle = vehicles.find((candidate) => candidate.id === vehicleId);
    if (!vehicle) return false;
    return this.canVehicleMove(vehicle, direction, vehicles);
  }

  protected gridColumn(vehicle: Vehicle): string {
    return `${vehicle.column + 1} / span ${vehicle.orientation === 'horizontal' ? vehicle.length : 1}`;
  }

  protected gridRow(vehicle: Vehicle): string {
    return `${vehicle.row + 1} / span ${vehicle.orientation === 'vertical' ? vehicle.length : 1}`;
  }

  protected vehicleLabel(vehicle: Vehicle): string {
    return vehicle.target ? 'Voiture rouge à libérer' : `Véhicule ${vehicle.id}`;
  }

  protected beginDrag(vehicle: Vehicle, event: PointerEvent): void {
    if (this.isGenerating() || this.isSolved()) return;
    const board = (event.currentTarget as HTMLElement).closest('.board');
    if (!(board instanceof HTMLElement)) return;
    event.preventDefault();
    this.dragState = {
      vehicleId: vehicle.id,
      orientation: vehicle.orientation,
      startX: event.clientX,
      startY: event.clientY,
      cellSize: board.getBoundingClientRect().width / this.size,
      appliedSteps: 0,
    };
  }

  @HostListener('document:pointermove', ['$event'])
  protected continueDrag(event: PointerEvent): void {
    const drag = this.dragState;
    if (!drag) return;
    event.preventDefault();
    const distance =
      drag.orientation === 'horizontal' ? event.clientX - drag.startX : event.clientY - drag.startY;
    const requestedSteps = Math.round(distance / drag.cellSize);

    while (drag.appliedSteps !== requestedSteps) {
      const direction: -1 | 1 = requestedSteps > drag.appliedSteps ? 1 : -1;
      if (!this.canMove(drag.vehicleId, direction)) break;
      this.move(drag.vehicleId, direction);
      drag.appliedSteps += direction;
    }
  }

  @HostListener('document:pointerup')
  @HostListener('document:pointercancel')
  protected endDrag(): void {
    this.dragState = null;
  }

  private startBackgroundGeneration(): void {
    if (this.generatorWorker) return;
    const requestedCount = 3 - this.preparedPuzzles.length + (this.waitingForPuzzle ? 1 : 0);
    if (requestedCount <= 0) return;

    const worker = new Worker(new URL('./rush-hour.worker', import.meta.url), { type: 'module' });
    this.generatorWorker = worker;
    worker.onmessage = ({ data }: MessageEvent<{ type: string; batch?: number; puzzle?: Vehicle[] }>) => {
      if (data.type === 'progress' && data.batch) {
        this.generationBatch.set(data.batch);
        return;
      }
      if (data.type !== 'ready' || !data.puzzle) return;

      if (this.waitingForPuzzle) {
        this.showPuzzle(data.puzzle);
        this.waitingForPuzzle = false;
        this.isGenerating.set(false);
      } else if (this.preparedPuzzles.length < 3) {
        this.preparedPuzzles.push(data.puzzle);
      }
    };
    worker.addEventListener('message', ({ data }: MessageEvent<{ type: string }>) => {
      if (data.type !== 'complete') return;
      worker.terminate();
      if (this.generatorWorker === worker) this.generatorWorker = null;
      if (!this.waitingForPuzzle && this.preparedPuzzles.length < 3) {
        this.startBackgroundGeneration();
      }
    });
    worker.onerror = () => {
      worker.terminate();
      if (this.generatorWorker === worker) this.generatorWorker = null;
      this.waitingForPuzzle = false;
      this.isGenerating.set(false);
    };
    worker.postMessage({ count: requestedCount });
  }

  private showPuzzle(puzzle: Vehicle[]): void {
    this.initialVehicles = puzzle.map((vehicle) => ({ ...vehicle }));
    this.vehicles.set(puzzle.map((vehicle) => ({ ...vehicle })));
    this.moves.set(0);
  }

  private async createPuzzle(): Promise<Vehicle[]> {
    for (let batch = 1; ; batch++) {
      this.generationBatch.set(batch);
      const candidates: Array<{ vehicles: Vehicle[]; score: number; qualifies: boolean }> = [];

      for (let attempt = 0; attempt < 80; attempt++) {
        const vehicles = this.createSolvedLayout();
        vehicles[0].column = 0;
        const movedVehicles = this.shuffleWithLegalMoves(vehicles, 420, true);
        const blockerCount = this.targetBlockerCount(vehicles);
        const dependencies = this.blockingDependencies(vehicles);
        const movableVehicles = vehicles.filter(
          (vehicle) =>
            this.canVehicleMove(vehicle, -1, vehicles) || this.canVehicleMove(vehicle, 1, vehicles),
        ).length;
        const score =
          vehicles.length +
          blockerCount * 10 +
          dependencies.immobileBlockers * 12 +
          dependencies.horizontalDependencies * 8 +
          movedVehicles.size;

        candidates.push({
          vehicles,
          score,
          qualifies:
            vehicles.length >= 12 &&
            blockerCount >= 3 &&
            dependencies.immobileBlockers >= 2 &&
            dependencies.horizontalDependencies >= 1 &&
            movedVehicles.size >= 7 &&
            movableVehicles >= 4,
        });
      }

      const qualifiedCandidates = candidates
        .filter((candidate) => candidate.qualifies)
        .sort((a, b) => b.score - a.score);
      const finalists = [
        ...qualifiedCandidates.slice(0, 16),
        ...candidates.sort(() => Math.random() - 0.5).slice(0, 24),
      ].filter((candidate, index, all) => all.indexOf(candidate) === index);

      for (const candidate of finalists) {
        const solutionLength = this.shortestSolutionLength(candidate.vehicles, 750_000, 50);
        if (solutionLength === null) continue;
        if (solutionLength >= 30) return candidate.vehicles;
      }

      await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 20));
    }
  }

  private createSolvedLayout(): Vehicle[] {
    const vehicles: Vehicle[] = [
      { id: 'X', orientation: 'horizontal', length: 2, row: 2, column: 4, target: true },
    ];
    const blockerColumns = [2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 3);
    blockerColumns.forEach((column, index) => {
      vehicles.push({
        id: String.fromCharCode(65 + index),
        orientation: 'vertical',
        length: index === 1 ? 3 : 2,
        row: 3,
        column,
      });
    });
    const desiredCount = 12 + Math.floor(Math.random() * 3);
    let placementAttempts = 0;

    while (vehicles.length < desiredCount && placementAttempts < 500) {
      placementAttempts++;
      const orientation: Orientation = Math.random() < 0.52 ? 'vertical' : 'horizontal';
      const length: 2 | 3 = Math.random() < 0.78 ? 2 : 3;
      const maxRow = orientation === 'vertical' ? this.size - length : this.size - 1;
      const maxColumn = orientation === 'horizontal' ? this.size - length : this.size - 1;
      const candidate: Vehicle = {
        id: String.fromCharCode(65 + vehicles.length - 1),
        orientation,
        length,
        row: Math.floor(Math.random() * (maxRow + 1)),
        column: Math.floor(Math.random() * (maxColumn + 1)),
      };

      const blocksTargetLane = this.vehicleCells(candidate).some((cell) => cell.row === 2);
      if (!blocksTargetLane && !this.overlapsAny(candidate, vehicles)) vehicles.push(candidate);
    }

    return vehicles;
  }

  private shuffleWithLegalMoves(
    vehicles: Vehicle[],
    steps: number,
    keepTargetFixed = false,
  ): Set<string> {
    let previous: { id: string; direction: -1 | 1 } | null = null;
    const movedVehicles = new Set<string>();

    for (let step = 0; step < steps; step++) {
      const legalMoves = vehicles
        .filter((vehicle) => !keepTargetFixed || !vehicle.target)
        .flatMap((vehicle) =>
        ([-1, 1] as const)
          .filter((direction) => this.canVehicleMove(vehicle, direction, vehicles))
          .map((direction) => ({ vehicle, direction })),
      );
      const moves = legalMoves.filter(
        ({ vehicle, direction }) => previous?.id !== vehicle.id || previous.direction !== -direction,
      );
      if (!moves.length) moves.push(...legalMoves);
      if (!moves.length) break;

      const choice = moves[Math.floor(Math.random() * moves.length)];
      if (choice.vehicle.orientation === 'horizontal') choice.vehicle.column += choice.direction;
      else choice.vehicle.row += choice.direction;
      movedVehicles.add(choice.vehicle.id);
      previous = { id: choice.vehicle.id, direction: choice.direction };
    }

    return movedVehicles;
  }

  private canVehicleMove(vehicle: Vehicle, direction: -1 | 1, vehicles: Vehicle[]): boolean {
    let row = vehicle.row;
    let column = vehicle.column;

    if (vehicle.orientation === 'horizontal') {
      column += direction < 0 ? -1 : vehicle.length;
    } else {
      row += direction < 0 ? -1 : vehicle.length;
    }

    if (row < 0 || row >= this.size || column < 0 || column >= this.size) return false;
    return !vehicles.some(
      (other) => other.id !== vehicle.id && this.occupiesCell(other, row, column),
    );
  }

  private overlapsAny(candidate: Vehicle, vehicles: Vehicle[]): boolean {
    return this.vehicleCells(candidate).some(({ row, column }) =>
      vehicles.some((vehicle) => this.occupiesCell(vehicle, row, column)),
    );
  }

  private targetBlockerCount(vehicles: Vehicle[]): number {
    const target = vehicles[0];
    let blockers = 0;
    for (let column = target.column + target.length; column < this.size; column++) {
      if (vehicles.slice(1).some((vehicle) => this.occupiesCell(vehicle, target.row, column))) {
        blockers++;
      }
    }
    return blockers;
  }

  private blockingDependencies(vehicles: Vehicle[]): {
    immobileBlockers: number;
    horizontalDependencies: number;
  } {
    const target = vehicles[0];
    const blockers = vehicles.slice(1).filter(
      (vehicle) =>
        vehicle.orientation === 'vertical' &&
        this.occupiesCell(vehicle, target.row, vehicle.column) &&
        vehicle.column >= target.column + target.length,
    );
    let immobileBlockers = 0;
    const horizontalDependencyIds = new Set<string>();

    for (const blocker of blockers) {
      const canMoveUp = this.canVehicleMove(blocker, -1, vehicles);
      const canMoveDown = this.canVehicleMove(blocker, 1, vehicles);
      if (!canMoveUp && !canMoveDown) immobileBlockers++;

      const dependencyCells = [
        { row: blocker.row - 1, column: blocker.column },
        { row: blocker.row + blocker.length, column: blocker.column },
      ];
      for (const cell of dependencyCells) {
        if (cell.row < 0 || cell.row >= this.size) continue;
        const dependency = vehicles.find(
          (vehicle) =>
            vehicle.id !== blocker.id && this.occupiesCell(vehicle, cell.row, cell.column),
        );
        if (dependency?.orientation === 'horizontal') horizontalDependencyIds.add(dependency.id);
      }
    }

    return {
      immobileBlockers,
      horizontalDependencies: horizontalDependencyIds.size,
    };
  }

  private shortestSolutionLength(
    vehicles: Vehicle[],
    visitLimit: number,
    maximumDepth: number,
  ): number | null {
    const initial = vehicles.map((vehicle) =>
      vehicle.orientation === 'horizontal' ? vehicle.column : vehicle.row,
    );
    const queue: Array<{ state: number[]; distance: number }> = [{ state: initial, distance: 0 }];
    const visited = new Set<string>([initial.join('')]);
    let head = 0;

    while (head < queue.length && visited.size <= visitLimit) {
      const { state, distance } = queue[head++];
      if (state[0] + vehicles[0].length === this.size) return distance;
      if (distance >= maximumDepth) continue;

      const occupied = new Int8Array(36);
      occupied.fill(-1);
      vehicles.forEach((vehicle, vehicleIndex) => {
        for (let offset = 0; offset < vehicle.length; offset++) {
          const row = vehicle.orientation === 'vertical' ? state[vehicleIndex] + offset : vehicle.row;
          const column =
            vehicle.orientation === 'horizontal' ? state[vehicleIndex] + offset : vehicle.column;
          occupied[row * this.size + column] = vehicleIndex;
        }
      });

      vehicles.forEach((vehicle, vehicleIndex) => {
        for (const direction of [-1, 1] as const) {
          const nextPosition = state[vehicleIndex] + direction;
          if (nextPosition < 0 || nextPosition + vehicle.length > this.size) continue;
          const row =
            vehicle.orientation === 'vertical'
              ? direction < 0
                ? nextPosition
                : nextPosition + vehicle.length - 1
              : vehicle.row;
          const column =
            vehicle.orientation === 'horizontal'
              ? direction < 0
                ? nextPosition
                : nextPosition + vehicle.length - 1
              : vehicle.column;
          if (occupied[row * this.size + column] !== -1) continue;

          const nextState = [...state];
          nextState[vehicleIndex] = nextPosition;
          const key = nextState.join('');
          if (visited.has(key)) continue;
          visited.add(key);
          queue.push({ state: nextState, distance: distance + 1 });
        }
      });
    }

    return null;
  }

  private occupiesCell(vehicle: Vehicle, row: number, column: number): boolean {
    return this.vehicleCells(vehicle).some((cell) => cell.row === row && cell.column === column);
  }

  private vehicleCells(vehicle: Vehicle): Array<{ row: number; column: number }> {
    return Array.from({ length: vehicle.length }, (_, offset) => ({
      row: vehicle.row + (vehicle.orientation === 'vertical' ? offset : 0),
      column: vehicle.column + (vehicle.orientation === 'horizontal' ? offset : 0),
    }));
  }
}
