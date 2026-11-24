export const RAIL_SIZE = 4;
export const RAIL_CELLS = Array.from({ length: RAIL_SIZE ** 2 }, (_, cell) => cell);

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
  readonly start: RailGate;
  readonly end: RailGate;
  readonly rows: readonly number[];
  readonly columns: readonly number[];
  readonly solution: readonly number[];
}

export interface RailState {
  readonly tracks: number;
  readonly crosses: number;
}

interface RailCounts {
  rows: readonly number[];
  columns: readonly number[];
}

export const EMPTY_RAILS: RailState = { tracks: 0, crosses: 0 };

export function railRow(cell: number): number {
  return Math.floor(cell / RAIL_SIZE);
}

export function railColumn(cell: number): number {
  return cell % RAIL_SIZE;
}

export function sideBetween(from: number, to: number): RailSide | undefined {
  const x = railColumn(to) - railColumn(from);
  const y = railRow(to) - railRow(from);
  return (Object.keys(RAIL_DIRECTIONS) as RailSide[]).find((side) => {
    const direction = RAIL_DIRECTIONS[side];
    return direction.x === x && direction.y === y;
  });
}

const NEIGHBORS = RAIL_CELLS.map((cell) => RAIL_CELLS.filter((other) => sideBetween(cell, other)));

// There are 24 possible links on the 4 × 4 board. Keep each as one bit so a sweep can be
// compared with its starting state and undone in a single step.
const LINKS = NEIGHBORS.flatMap((neighbors, from) =>
  neighbors.filter((to) => to > from).map((to) => ({ from, to })),
).map((link, index) => ({ ...link, bit: 1 << index }));

const BOUNDARY_GATES = RAIL_CELLS.slice(0, RAIL_SIZE).flatMap<RailGate>((offset) => [
  { cell: offset, side: 'north' },
  { cell: offset * RAIL_SIZE + RAIL_SIZE - 1, side: 'east' },
  { cell: (RAIL_SIZE - 1) * RAIL_SIZE + offset, side: 'south' },
  { cell: offset * RAIL_SIZE, side: 'west' },
]);

const GATE_PAIRS = BOUNDARY_GATES.flatMap((start, index) =>
  BOUNDARY_GATES.slice(index + 1)
    .filter(
      (end) =>
        start.side !== end.side &&
        Math.abs(railRow(start.cell) - railRow(end.cell)) +
          Math.abs(railColumn(start.cell) - railColumn(end.cell)) >=
          3,
    )
    .map((end) => ({ start, end })),
);

export function createRailPuzzle(previous?: RailPuzzle, random = Math.random): RailPuzzle {
  const previousCells = previous ? [previous.start.cell, previous.end.cell] : [];
  const pairs = GATE_PAIRS.filter(
    ({ start, end }) => !(previousCells.includes(start.cell) && previousCells.includes(end.cell)),
  );
  const { start, end } = pairs[Math.floor(random() * pairs.length)];
  const candidates = uniqueRoutes(start.cell, end.cell);
  const candidate = candidates[Math.floor(random() * candidates.length)];
  return { start, end, ...candidate };
}

export function toggleRailLink(
  puzzle: RailPuzzle,
  state: RailState,
  from: number,
  to: number,
): RailState {
  const low = Math.min(from, to);
  const high = Math.max(from, to);
  const link = LINKS.find((candidate) => candidate.from === low && candidate.to === high);
  if (!link) return state;
  if (state.tracks & link.bit) return { ...state, tracks: state.tracks ^ link.bit };

  const neighbors = linkedCells(state);
  const atLimit = (cell: number) => neighbors[cell].length >= (gateAt(puzzle, cell) ? 1 : 2);
  if (atLimit(from) || atLimit(to)) return state;

  return { tracks: state.tracks | link.bit, crosses: state.crosses & ~((1 << from) | (1 << to)) };
}

export function toggleRailCross(puzzle: RailPuzzle, state: RailState, cell: number): RailState {
  if (!RAIL_CELLS.includes(cell) || gateAt(puzzle, cell) || linkedCells(state)[cell].length) {
    return state;
  }
  return { ...state, crosses: state.crosses ^ (1 << cell) };
}

export function hasRailCross(state: RailState, cell: number): boolean {
  return (state.crosses & (1 << cell)) !== 0;
}

export function gateAt(puzzle: RailPuzzle, cell: number): 'A' | 'B' | null {
  if (puzzle.start.cell === cell) return 'A';
  if (puzzle.end.cell === cell) return 'B';
  return null;
}

export function inspectRailState(puzzle: RailPuzzle, state: RailState) {
  const neighbors = linkedCells(state);
  const occupied = RAIL_CELLS.filter((cell) => neighbors[cell].length || gateAt(puzzle, cell));
  const counts = countLines(occupied);
  const route = followRail(puzzle, neighbors);
  const connected = route !== null && route.length === occupied.length;
  const solved =
    connected &&
    counts.rows.every((count, row) => count === puzzle.rows[row]) &&
    counts.columns.every((count, column) => count === puzzle.columns[column]);

  return { ...counts, neighbors, occupied, route, connected, solved };
}

export function railSweep(from: number, to: number): number[] {
  if (from === to || (railRow(from) !== railRow(to) && railColumn(from) !== railColumn(to))) {
    return [];
  }
  const step = (railRow(from) === railRow(to) ? 1 : RAIL_SIZE) * Math.sign(to - from);
  return Array.from({ length: (to - from) / step }, (_, index) => from + (index + 1) * step);
}

function linkedCells(state: RailState): number[][] {
  const neighbors = RAIL_CELLS.map((): number[] => []);
  for (const { from, to, bit } of LINKS) {
    if (state.tracks & bit) {
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

function countLines(cells: readonly number[]): RailCounts {
  const rows = Array<number>(RAIL_SIZE).fill(0);
  const columns = Array<number>(RAIL_SIZE).fill(0);
  for (const cell of cells) {
    rows[railRow(cell)]++;
    columns[railColumn(cell)]++;
  }
  return { rows, columns };
}

function uniqueRoutes(
  from: number,
  to: number,
): Pick<RailPuzzle, 'solution' | 'rows' | 'columns'>[] {
  type Route = Pick<RailPuzzle, 'solution' | 'rows' | 'columns'>;
  const routes = new Map<string, Route | null>();
  const path = [from];

  function visit(cell: number, occupied: number): void {
    if (cell === to) {
      if (path.length < 8) return;
      const { rows, columns } = countLines(path);
      const counts = [...rows, ...columns];
      if (counts.includes(0) || !counts.includes(RAIL_SIZE)) return;
      const key = counts.join(',');
      // Other routes with these clues have the same length and are counted here as well.
      routes.set(key, routes.has(key) ? null : { rows, columns, solution: [...path] });
      return;
    }
    if (path.length === 13) return;

    for (const next of NEIGHBORS[cell]) {
      const bit = 1 << next;
      if (occupied & bit) continue;
      path.push(next);
      visit(next, occupied | bit);
      path.pop();
    }
  }

  visit(from, 1 << from);
  return [...routes.values()].filter((route) => route !== null);
}
