export type Orientation = 'horizontal' | 'vertical';

export type Vehicle = {
  id: string;
  orientation: Orientation;
  length: 2 | 3;
  row: number;
  column: number;
  target?: boolean;
};

const SIZE = 6;

export function generateRushHourPuzzle(onBatch: (batch: number) => void): Vehicle[] {
  for (let batch = 1; ; batch++) {
    onBatch(batch);
    const layout = createSolvedLayout();
    const solvedStates = enumerateSolvedStates(layout, 120_000);
    if (!solvedStates) continue;
    const puzzle = reverseBreadthFirstSearch(layout, solvedStates, 1_200_000);
    if (puzzle) return puzzle;
  }
}

function enumerateSolvedStates(vehicles: Vehicle[], limit: number): number[][] | null {
  const states: number[][] = [];
  const state = new Array<number>(vehicles.length).fill(0);
  const occupied = new Uint8Array(36);
  state[0] = 4;
  for (const cell of positionedCells(vehicles[0], 4)) occupied[cell.row * SIZE + cell.column] = 1;
  let exceededLimit = false;

  const placeVehicle = (index: number): void => {
    if (exceededLimit) return;
    if (index === vehicles.length) {
      states.push([...state]);
      if (states.length > limit) exceededLimit = true;
      return;
    }

    const vehicle = vehicles[index];
    for (let position = 0; position <= SIZE - vehicle.length; position++) {
      const vehicleCells = positionedCells(vehicle, position);
      if (vehicleCells.some((cell) => occupied[cell.row * SIZE + cell.column])) continue;
      state[index] = position;
      vehicleCells.forEach((cell) => (occupied[cell.row * SIZE + cell.column] = 1));
      placeVehicle(index + 1);
      vehicleCells.forEach((cell) => (occupied[cell.row * SIZE + cell.column] = 0));
    }
  };

  placeVehicle(1);
  return exceededLimit || !states.length ? null : states;
}

function reverseBreadthFirstSearch(
  vehicles: Vehicle[],
  solvedStates: number[][],
  visitLimit: number,
): Vehicle[] | null {
  const queue = solvedStates;
  const distances: number[] = solvedStates.map(() => 0);
  const visited = new Set(solvedStates.map((state) => state.join('')));
  let head = 0;

  while (head < queue.length && visited.size <= visitLimit) {
    const state = queue[head];
    const distance = distances[head++];
    if (distance > 50) return null;
    if (distance >= 30 && state[0] === 0) return applyState(vehicles, state);

    const occupied = new Int8Array(36);
    occupied.fill(-1);
    vehicles.forEach((vehicle, index) => {
      positionedCells(vehicle, state[index]).forEach(
        (cell) => (occupied[cell.row * SIZE + cell.column] = index),
      );
    });

    vehicles.forEach((vehicle, index) => {
      for (const direction of [-1, 1] as const) {
        const nextPosition = state[index] + direction;
        if (nextPosition < 0 || nextPosition + vehicle.length > SIZE) continue;
        const leadingCell =
          direction < 0
            ? positionedCells(vehicle, nextPosition)[0]
            : positionedCells(vehicle, nextPosition).at(-1)!;
        if (occupied[leadingCell.row * SIZE + leadingCell.column] !== -1) continue;
        const next = [...state];
        next[index] = nextPosition;
        const key = next.join('');
        if (visited.has(key)) continue;
        visited.add(key);
        queue.push(next);
        distances.push(distance + 1);
      }
    });
  }

  return null;
}

function positionedCells(vehicle: Vehicle, position: number): Array<{ row: number; column: number }> {
  return Array.from({ length: vehicle.length }, (_, offset) => ({
    row: vehicle.orientation === 'vertical' ? position + offset : vehicle.row,
    column: vehicle.orientation === 'horizontal' ? position + offset : vehicle.column,
  }));
}

function applyState(vehicles: Vehicle[], state: number[]): Vehicle[] {
  return vehicles.map((vehicle, index) =>
    vehicle.orientation === 'horizontal'
      ? { ...vehicle, column: state[index] }
      : { ...vehicle, row: state[index] },
  );
}

function createSolvedLayout(): Vehicle[] {
  const vehicles: Vehicle[] = [
    { id: 'X', orientation: 'horizontal', length: 2, row: 2, column: 4, target: true },
  ];
  const blockerColumns = [2, 3, 4, 5].sort(() => Math.random() - 0.5);
  blockerColumns.forEach((column, index) =>
    vehicles.push({
      id: String.fromCharCode(65 + index),
      orientation: 'vertical',
      length: index === 1 ? 3 : 2,
      row: 3,
      column,
    }),
  );
  const desiredCount = 13 + Math.floor(Math.random() * 2);

  for (let attempts = 0; vehicles.length < desiredCount && attempts < 500; attempts++) {
    const orientation: Orientation = Math.random() < 0.52 ? 'vertical' : 'horizontal';
    const length: 2 | 3 = Math.random() < 0.78 ? 2 : 3;
    const candidate: Vehicle = {
      id: String.fromCharCode(65 + vehicles.length - 1),
      orientation,
      length,
      row: Math.floor(Math.random() * ((orientation === 'vertical' ? SIZE - length : SIZE - 1) + 1)),
      column: Math.floor(
        Math.random() * ((orientation === 'horizontal' ? SIZE - length : SIZE - 1) + 1),
      ),
    };
    const blocksTargetLane = cells(candidate).some((cell) => cell.row === 2);
    if (!blocksTargetLane && !overlaps(candidate, vehicles)) vehicles.push(candidate);
  }
  return vehicles;
}

function shuffleWithLegalMoves(vehicles: Vehicle[], steps: number, keepTargetFixed: boolean): Set<string> {
  let previous: { id: string; direction: -1 | 1 } | null = null;
  const moved = new Set<string>();
  for (let step = 0; step < steps; step++) {
    const legal = vehicles
      .filter((vehicle) => !keepTargetFixed || !vehicle.target)
      .flatMap((vehicle) =>
        ([-1, 1] as const)
          .filter((direction) => canMove(vehicle, direction, vehicles))
          .map((direction) => ({ vehicle, direction })),
      );
    const choices = legal.filter(
      ({ vehicle, direction }) => previous?.id !== vehicle.id || previous.direction !== -direction,
    );
    if (!choices.length) choices.push(...legal);
    if (!choices.length) break;
    const choice = choices[Math.floor(Math.random() * choices.length)];
    if (choice.vehicle.orientation === 'horizontal') choice.vehicle.column += choice.direction;
    else choice.vehicle.row += choice.direction;
    moved.add(choice.vehicle.id);
    previous = { id: choice.vehicle.id, direction: choice.direction };
  }
  return moved;
}

function canMove(vehicle: Vehicle, direction: -1 | 1, vehicles: Vehicle[]): boolean {
  let row = vehicle.row;
  let column = vehicle.column;
  if (vehicle.orientation === 'horizontal') column += direction < 0 ? -1 : vehicle.length;
  else row += direction < 0 ? -1 : vehicle.length;
  if (row < 0 || row >= SIZE || column < 0 || column >= SIZE) return false;
  return !vehicles.some((other) => other.id !== vehicle.id && occupies(other, row, column));
}

function targetBlockerCount(vehicles: Vehicle[]): number {
  const target = vehicles[0];
  let count = 0;
  for (let column = target.column + target.length; column < SIZE; column++) {
    if (vehicles.slice(1).some((vehicle) => occupies(vehicle, target.row, column))) count++;
  }
  return count;
}

function blockingDependencies(vehicles: Vehicle[]): {
  immobileBlockers: number;
  horizontalDependencies: number;
} {
  const target = vehicles[0];
  const blockers = vehicles.slice(1).filter(
    (vehicle) =>
      vehicle.orientation === 'vertical' &&
      occupies(vehicle, target.row, vehicle.column) &&
      vehicle.column >= target.column + target.length,
  );
  let immobileBlockers = 0;
  const horizontalIds = new Set<string>();
  for (const blocker of blockers) {
    if (!canMove(blocker, -1, vehicles) && !canMove(blocker, 1, vehicles)) immobileBlockers++;
    for (const row of [blocker.row - 1, blocker.row + blocker.length]) {
      if (row < 0 || row >= SIZE) continue;
      const dependency = vehicles.find(
        (vehicle) => vehicle.id !== blocker.id && occupies(vehicle, row, blocker.column),
      );
      if (dependency?.orientation === 'horizontal') horizontalIds.add(dependency.id);
    }
  }
  return { immobileBlockers, horizontalDependencies: horizontalIds.size };
}

function shortestSolutionLength(vehicles: Vehicle[], limit: number, maxDepth: number): number | null {
  const initial = vehicles.map((vehicle) =>
    vehicle.orientation === 'horizontal' ? vehicle.column : vehicle.row,
  );
  type SearchNode = { state: number[]; distance: number; priority: number };
  const heap: SearchNode[] = [
    { state: initial, distance: 0, priority: solutionHeuristic(initial, vehicles) },
  ];
  const bestDistances = new Map<string, number>([[initial.join(''), 0]]);
  let examined = 0;

  const push = (node: SearchNode): void => {
    heap.push(node);
    let index = heap.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (heap[parent].priority <= node.priority) break;
      heap[index] = heap[parent];
      index = parent;
    }
    heap[index] = node;
  };
  const pop = (): SearchNode => {
    const root = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      let index = 0;
      while (true) {
        const left = index * 2 + 1;
        if (left >= heap.length) break;
        const right = left + 1;
        const child = right < heap.length && heap[right].priority < heap[left].priority ? right : left;
        if (heap[child].priority >= last.priority) break;
        heap[index] = heap[child];
        index = child;
      }
      heap[index] = last;
    }
    return root;
  };

  while (heap.length && examined++ < limit) {
    const { state, distance } = pop();
    const stateKey = state.join('');
    if (bestDistances.get(stateKey) !== distance) continue;
    if (state[0] + vehicles[0].length === SIZE) return distance;
    if (distance >= maxDepth) continue;
    const occupied = new Int8Array(36);
    occupied.fill(-1);
    vehicles.forEach((vehicle, index) => {
      for (let offset = 0; offset < vehicle.length; offset++) {
        const row = vehicle.orientation === 'vertical' ? state[index] + offset : vehicle.row;
        const column = vehicle.orientation === 'horizontal' ? state[index] + offset : vehicle.column;
        occupied[row * SIZE + column] = index;
      }
    });
    vehicles.forEach((vehicle, index) => {
      for (const direction of [-1, 1] as const) {
        const position = state[index] + direction;
        if (position < 0 || position + vehicle.length > SIZE) continue;
        const row =
          vehicle.orientation === 'vertical'
            ? direction < 0
              ? position
              : position + vehicle.length - 1
            : vehicle.row;
        const column =
          vehicle.orientation === 'horizontal'
            ? direction < 0
              ? position
              : position + vehicle.length - 1
            : vehicle.column;
        if (occupied[row * SIZE + column] !== -1) continue;
        const next = [...state];
        next[index] = position;
        const key = next.join('');
        const nextDistance = distance + 1;
        if ((bestDistances.get(key) ?? Number.POSITIVE_INFINITY) <= nextDistance) continue;
        bestDistances.set(key, nextDistance);
        push({
          state: next,
          distance: nextDistance,
          priority: nextDistance + solutionHeuristic(next, vehicles),
        });
      }
    });
  }
  return null;
}

function solutionHeuristic(state: number[], vehicles: Vehicle[]): number {
  const targetEnd = state[0] + vehicles[0].length;
  let estimate = SIZE - targetEnd;

  vehicles.forEach((vehicle, index) => {
    if (index === 0 || vehicle.orientation !== 'vertical') return;
    if (vehicle.column < targetEnd || vehicle.column >= SIZE) return;
    const top = state[index];
    const bottom = top + vehicle.length - 1;
    if (top > 2 || bottom < 2) return;

    const movesUp = bottom - 1;
    const movesDown = 3 - top;
    const canClearUp = top - movesUp >= 0;
    const canClearDown = top + movesDown + vehicle.length <= SIZE;
    estimate += Math.min(
      canClearUp ? movesUp : Number.POSITIVE_INFINITY,
      canClearDown ? movesDown : Number.POSITIVE_INFINITY,
    );
  });

  return estimate;
}

function overlaps(candidate: Vehicle, vehicles: Vehicle[]): boolean {
  return cells(candidate).some(({ row, column }) =>
    vehicles.some((vehicle) => occupies(vehicle, row, column)),
  );
}

function occupies(vehicle: Vehicle, row: number, column: number): boolean {
  return cells(vehicle).some((cell) => cell.row === row && cell.column === column);
}

function cells(vehicle: Vehicle): Array<{ row: number; column: number }> {
  return Array.from({ length: vehicle.length }, (_, offset) => ({
    row: vehicle.row + (vehicle.orientation === 'vertical' ? offset : 0),
    column: vehicle.column + (vehicle.orientation === 'horizontal' ? offset : 0),
  }));
}
