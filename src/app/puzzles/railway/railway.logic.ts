export interface RailBoardSize {
  readonly id: string;
  readonly label: string;
  readonly rows: number;
  readonly columns: number;
}

export const RAIL_SIZES = [
  { id: '4x4', label: '4 × 4', rows: 4, columns: 4 },
  { id: '5x5', label: '5 × 5', rows: 5, columns: 5 },
  { id: '6x5', label: '6 × 5', rows: 5, columns: 6 },
] as const satisfies readonly RailBoardSize[];

const DEFAULT_RAIL_SIZE = RAIL_SIZES[2];

// Kept as the default dimensions for callers that do not pass a board size.
export const RAIL_SIZE = DEFAULT_RAIL_SIZE.columns;
export const RAIL_CELLS = cellsForSize(DEFAULT_RAIL_SIZE);

export const RAIL_DIRECTIONS = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
} as const;

export type RailSide = keyof typeof RAIL_DIRECTIONS;

export interface RailGate {
  readonly cell: number;
  readonly side: RailSide;
}

export interface RailPuzzle {
  readonly size: RailBoardSize;
  readonly start: RailGate;
  readonly end: RailGate;
  readonly rows: readonly number[];
  readonly columns: readonly number[];
  readonly solution: readonly number[];
}

export interface RailState {
  readonly tracks: bigint;
  readonly crosses: bigint;
  readonly marks: bigint;
}

interface RailCounts {
  rows: readonly number[];
  columns: readonly number[];
}

export const EMPTY_RAILS: RailState = { tracks: 0n, crosses: 0n, marks: 0n };

export function cellsForSize(size: RailBoardSize): number[] {
  return Array.from({ length: size.rows * size.columns }, (_, cell) => cell);
}

export function railRow(cell: number, sizeOrColumns: RailBoardSize | number = RAIL_SIZE): number {
  const columns = typeof sizeOrColumns === 'number' ? sizeOrColumns : sizeOrColumns.columns;
  return Math.floor(cell / columns);
}

export function railColumn(
  cell: number,
  sizeOrColumns: RailBoardSize | number = RAIL_SIZE,
): number {
  const columns = typeof sizeOrColumns === 'number' ? sizeOrColumns : sizeOrColumns.columns;
  return cell % columns;
}

export function sideBetween(
  from: number,
  to: number,
  size: RailBoardSize = DEFAULT_RAIL_SIZE,
): RailSide | undefined {
  const x = railColumn(to, size) - railColumn(from, size);
  const y = railRow(to, size) - railRow(from, size);
  return (Object.keys(RAIL_DIRECTIONS) as RailSide[]).find((side) => {
    const direction = RAIL_DIRECTIONS[side];
    return direction.x === x && direction.y === y;
  });
}

export function createRailPuzzle(
  previous?: RailPuzzle,
  random = Math.random,
  requestedSize?: RailBoardSize,
): RailPuzzle {
  const size = requestedSize ?? previous?.size ?? DEFAULT_RAIL_SIZE;
  const previousCells =
    previous?.size.id === size.id ? [previous.start.cell, previous.end.cell] : [];
  const pairs = gatePairsFor(size).filter(
    ({ start, end }) => !(previousCells.includes(start.cell) && previousCells.includes(end.cell)),
  );
  const firstPair = randomIndex(pairs.length, random);
  for (let offset = 0; offset < pairs.length; offset++) {
    const { start, end } = pairs[(firstPair + offset) % pairs.length];
    const candidates = uniqueRoutes(start.cell, end.cell, size);
    const candidate = candidates[randomIndex(candidates.length, random)];
    if (candidate) return { size, start, end, ...candidate };
  }
  throw new Error(`Unable to create a ${size.label} railway puzzle.`);
}

export function toggleRailLink(
  puzzle: RailPuzzle,
  state: RailState,
  from: number,
  to: number,
): RailState {
  const link = linksFor(puzzle.size).find(
    (candidate) => candidate.from === Math.min(from, to) && candidate.to === Math.max(from, to),
  );
  if (!link) return state;
  if ((state.tracks & link.bit) !== 0n) return { ...state, tracks: state.tracks ^ link.bit };

  const neighbors = linkedCells(state, puzzle.size);
  const atLimit = (cell: number) => neighbors[cell].length >= (gateAt(puzzle, cell) ? 1 : 2);
  if (atLimit(from) || atLimit(to)) return state;

  return {
    tracks: state.tracks | link.bit,
    crosses: state.crosses & ~((1n << BigInt(from)) | (1n << BigInt(to))),
    marks: state.marks & ~((1n << BigInt(from)) | (1n << BigInt(to))),
  };
}

export function hasRailLink(
  puzzle: RailPuzzle,
  state: RailState,
  from: number,
  to: number,
): boolean {
  const link = linksFor(puzzle.size).find(
    (candidate) => candidate.from === Math.min(from, to) && candidate.to === Math.max(from, to),
  );
  return link !== undefined && (state.tracks & link.bit) !== 0n;
}

export function toggleRailCross(puzzle: RailPuzzle, state: RailState, cell: number): RailState {
  if (
    !cellsForSize(puzzle.size).includes(cell) ||
    gateAt(puzzle, cell) ||
    linkedCells(state, puzzle.size)[cell].length
  ) {
    return state;
  }
  const bit = 1n << BigInt(cell);
  return { ...state, crosses: state.crosses ^ bit, marks: state.marks & ~bit };
}

export function hasRailCross(state: RailState, cell: number): boolean {
  return (state.crosses & (1n << BigInt(cell))) !== 0n;
}

export function hasRailMark(state: RailState, cell: number): boolean {
  return (state.marks & (1n << BigInt(cell))) !== 0n;
}

export function cycleRailMark(puzzle: RailPuzzle, state: RailState, cell: number): RailState {
  if (
    !cellsForSize(puzzle.size).includes(cell) ||
    gateAt(puzzle, cell) ||
    linkedCells(state, puzzle.size)[cell].length
  ) {
    return state;
  }

  const bit = 1n << BigInt(cell);
  if (hasRailCross(state, cell)) {
    return { ...state, crosses: state.crosses & ~bit, marks: state.marks | bit };
  }
  if (hasRailMark(state, cell)) {
    return { ...state, marks: state.marks & ~bit };
  }
  return { ...state, crosses: state.crosses | bit };
}

export function gateAt(puzzle: RailPuzzle, cell: number): 'A' | 'B' | null {
  if (puzzle.start.cell === cell) return 'A';
  if (puzzle.end.cell === cell) return 'B';
  return null;
}

export function inspectRailState(puzzle: RailPuzzle, state: RailState) {
  const neighbors = linkedCells(state, puzzle.size);
  const occupied = cellsForSize(puzzle.size).filter(
    (cell) => neighbors[cell].length || gateAt(puzzle, cell),
  );
  const counts = countLines(occupied, puzzle.size);
  const route = followRail(puzzle, neighbors);
  const connected = route !== null && route.length === occupied.length;
  const solved =
    connected &&
    counts.rows.every((count, row) => count === puzzle.rows[row]) &&
    counts.columns.every((count, column) => count === puzzle.columns[column]);

  return { ...counts, neighbors, occupied, route, connected, solved };
}

export function railSweep(
  from: number,
  to: number,
  size: RailBoardSize = DEFAULT_RAIL_SIZE,
): number[] {
  if (
    from === to ||
    (railRow(from, size) !== railRow(to, size) && railColumn(from, size) !== railColumn(to, size))
  ) {
    return [];
  }
  const step =
    (railRow(from, size) === railRow(to, size) ? 1 : size.columns) * Math.sign(to - from);
  return Array.from({ length: (to - from) / step }, (_, index) => from + (index + 1) * step);
}

function linkedCells(state: RailState, size: RailBoardSize): number[][] {
  const neighbors = cellsForSize(size).map((): number[] => []);
  for (const { from, to, bit } of linksFor(size)) {
    if ((state.tracks & bit) !== 0n) {
      neighbors[from].push(to);
      neighbors[to].push(from);
    }
  }
  return neighbors;
}

function followRail(
  puzzle: RailPuzzle,
  neighbors: readonly (readonly number[])[],
): number[] | null {
  const route: number[] = [];
  let cell: number | undefined = puzzle.start.cell;
  while (cell !== undefined) {
    route.push(cell);
    if (cell === puzzle.end.cell) return route;
    cell = neighbors[cell].find((other) => !route.includes(other));
  }
  return null;
}

function countLines(cells: readonly number[], size: RailBoardSize): RailCounts {
  const rows = Array<number>(size.rows).fill(0);
  const columns = Array<number>(size.columns).fill(0);
  for (const cell of cells) {
    rows[railRow(cell, size)]++;
    columns[railColumn(cell, size)]++;
  }
  return { rows, columns };
}

function uniqueRoutes(
  from: number,
  to: number,
  size: RailBoardSize,
): Pick<RailPuzzle, 'solution' | 'rows' | 'columns'>[] {
  type Route = Pick<RailPuzzle, 'solution' | 'rows' | 'columns'>;
  const routes = new Map<string, Route | null>();
  const neighbors = neighborsFor(size);
  const path = [from];
  const minPathLength = size.rows + size.columns;
  const maxPathLength = Math.min(size.rows * size.columns, minPathLength + 5);

  function visit(cell: number, occupied: number): void {
    if (cell === to) {
      if (path.length < minPathLength) return;
      const { rows, columns } = countLines(path, size);
      const counts = [...rows, ...columns];
      if (counts.includes(0) || (!rows.includes(size.columns) && !columns.includes(size.rows)))
        return;
      const key = counts.join(',');
      // Other routes with these clues have the same length and are counted here as well.
      routes.set(key, routes.has(key) ? null : { rows, columns, solution: [...path] });
      return;
    }
    if (path.length >= maxPathLength) return;

    for (const next of neighbors[cell]) {
      const bit = 1 << next;
      if (occupied & bit) continue;
      path.push(next);
      visit(next, occupied | bit);
      path.pop();
    }
  }

  visit(from, 1 << from);
  return [...routes.values()].filter((route): route is Route => route !== null);
}

function neighborsFor(size: RailBoardSize): number[][] {
  const cells = cellsForSize(size);
  return cells.map((cell) => cells.filter((other) => sideBetween(cell, other, size)));
}

function linksFor(size: RailBoardSize): { from: number; to: number; bit: bigint }[] {
  return neighborsFor(size)
    .flatMap((neighbors, from) => neighbors.filter((to) => to > from).map((to) => ({ from, to })))
    .map((link, index) => ({ ...link, bit: 1n << BigInt(index) }));
}

function gatePairsFor(size: RailBoardSize): { start: RailGate; end: RailGate }[] {
  const gates = boundaryGatesFor(size);
  return gates.flatMap((start, index) =>
    gates
      .slice(index + 1)
      .filter(
        (end) =>
          start.side !== end.side &&
          Math.abs(railRow(start.cell, size) - railRow(end.cell, size)) +
            Math.abs(railColumn(start.cell, size) - railColumn(end.cell, size)) >=
            3,
      )
      .map((end) => ({ start, end })),
  );
}

function boundaryGatesFor(size: RailBoardSize): RailGate[] {
  const top = Array.from({ length: size.columns }, (_, column) => ({
    cell: column,
    side: 'north' as const,
  }));
  const right = Array.from({ length: size.rows }, (_, row) => ({
    cell: row * size.columns + size.columns - 1,
    side: 'east' as const,
  }));
  const bottom = Array.from({ length: size.columns }, (_, column) => ({
    cell: (size.rows - 1) * size.columns + column,
    side: 'south' as const,
  }));
  const left = Array.from({ length: size.rows }, (_, row) => ({
    cell: row * size.columns,
    side: 'west' as const,
  }));
  return [...top, ...right, ...bottom, ...left];
}

function randomIndex(length: number, random: () => number): number {
  return Math.max(0, Math.min(length - 1, Math.floor(random() * length)));
}
