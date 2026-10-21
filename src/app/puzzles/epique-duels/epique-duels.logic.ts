export type Player = 1 | 2;
export type Difficulty = 'facile' | 'intermediaire' | 'expert';

function randomItem<T>(items: readonly T[], random: () => number = Math.random): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

export const BOARD_SIZE = 5;
export const BOARD_CELLS = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, cell) => cell);

export function otherPlayer(player: Player): Player {
  return player === 1 ? 2 : 1;
}

export function cellRow(cell: number): number {
  return Math.floor(cell / BOARD_SIZE);
}

export function cellColumn(cell: number): number {
  return cell % BOARD_SIZE;
}

export function adjacentCells(cell: number): number[] {
  const row = cellRow(cell);
  const column = cellColumn(cell);
  const result: number[] = [];

  for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
    for (let columnDelta = -1; columnDelta <= 1; columnDelta += 1) {
      if (rowDelta === 0 && columnDelta === 0) continue;
      const nextRow = row + rowDelta;
      const nextColumn = column + columnDelta;
      if (nextRow >= 0 && nextRow < BOARD_SIZE && nextColumn >= 0 && nextColumn < BOARD_SIZE) {
        result.push(nextRow * BOARD_SIZE + nextColumn);
      }
    }
  }

  return result;
}

export function hexAdjacentCells(cell: number): number[] {
  const row = cellRow(cell);
  const column = cellColumn(cell);
  const offsets = [
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
  ];
  return offsets
    .map(([rowDelta, columnDelta]) => [row + rowDelta, column + columnDelta])
    .filter(
      ([nextRow, nextColumn]) =>
        nextRow >= 0 && nextRow < BOARD_SIZE && nextColumn >= 0 && nextColumn < BOARD_SIZE,
    )
    .map(([nextRow, nextColumn]) => nextRow * BOARD_SIZE + nextColumn);
}

export type WythoffMove = {
  pileIndex: 0 | 1;
  removeCount: number;
  both: boolean;
};

export function wythoffMoves(piles: readonly [number, number]): WythoffMove[] {
  const moves: WythoffMove[] = [];
  for (const pileIndex of [0, 1] as const) {
    for (let removeCount = 1; removeCount <= piles[pileIndex]; removeCount += 1) {
      moves.push({ pileIndex, removeCount, both: false });
    }
  }

  const diagonalLimit = Math.min(piles[0], piles[1]);
  for (let removeCount = 1; removeCount <= diagonalLimit; removeCount += 1) {
    moves.push({ pileIndex: 0, removeCount, both: true });
  }

  return moves;
}

export function applyWythoffMove(
  piles: readonly [number, number],
  move: WythoffMove,
): [number, number] {
  const next: [number, number] = [piles[0], piles[1]];
  next[move.pileIndex] -= move.removeCount;
  if (move.both) next[move.pileIndex === 0 ? 1 : 0] -= move.removeCount;
  return next;
}

function isWythoffColdPosition(piles: readonly [number, number]): boolean {
  const low = Math.min(piles[0], piles[1]);
  const high = Math.max(piles[0], piles[1]);
  const difference = high - low;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  return low === Math.floor(difference * goldenRatio);
}

export function chooseWythoffMove(
  piles: readonly [number, number],
  difficulty: Difficulty,
): WythoffMove | null {
  const moves = wythoffMoves(piles);
  if (moves.length === 0) return null;

  if (difficulty === 'facile') return moves[0];

  const winningMove = moves.find((move) => isWythoffColdPosition(applyWythoffMove(piles, move)));
  if (winningMove && difficulty === 'expert') return winningMove;
  if (winningMove && (piles[0] + piles[1]) % 2 === 0) return winningMove;
  return moves[0];
}

export type NimEmissionState = {
  flags: number;
  maxRemoval: 3 | 4 | 5;
  lastFlagLoses: boolean;
};

export type NimEmissionMove = {
  removeCount: number;
};

export function nimEmissionMoves(state: NimEmissionState): NimEmissionMove[] {
  const maximum = Math.min(state.flags, state.maxRemoval);
  return Array.from({ length: maximum }, (_, index) => ({ removeCount: index + 1 }));
}

export function applyNimEmissionMove(
  state: NimEmissionState,
  move: NimEmissionMove,
): NimEmissionState {
  return {
    ...state,
    flags: state.flags - move.removeCount,
  };
}

export function nimEmissionMoveIsWinning(
  state: NimEmissionState,
  move: NimEmissionMove,
): boolean {
  if (
    move.removeCount < 1 ||
    move.removeCount > state.maxRemoval ||
    move.removeCount > state.flags
  ) {
    return false;
  }

  const remaining = state.flags - move.removeCount;
  if (remaining === 0) return !state.lastFlagLoses;

  const targetRemainder = state.lastFlagLoses ? 1 : 0;
  return remaining % (state.maxRemoval + 1) === targetRemainder;
}

export function chooseNimEmissionMove(
  state: NimEmissionState,
  difficulty: Difficulty,
): NimEmissionMove | null {
  const moves = nimEmissionMoves(state);
  if (moves.length === 0) return null;
  if (difficulty === 'facile') return moves[0];

  const winningMove = moves.find((move) => nimEmissionMoveIsWinning(state, move));
  if (winningMove) return winningMove;
  return moves[moves.length - 1];
}

export type IsolaState = {
  blocked: boolean[];
  positions: { 1: number; 2: number };
};

export type IsolaMove = {
  to: number;
  block: number;
};

export function isolaMovableCells(state: IsolaState, player: Player): number[] {
  const opponentPosition = state.positions[otherPlayer(player)];
  return adjacentCells(state.positions[player]).filter(
    (cell) => !state.blocked[cell] && cell !== opponentPosition,
  );
}

export function isolaMoves(state: IsolaState, player: Player): IsolaMove[] {
  const moves: IsolaMove[] = [];
  for (const to of isolaMovableCells(state, player)) {
    for (const block of BOARD_CELLS) {
      if (state.blocked[block] || block === to || block === state.positions[otherPlayer(player)]) {
        continue;
      }
      moves.push({ to, block });
    }
  }
  return moves;
}

export function applyIsolaMove(state: IsolaState, player: Player, move: IsolaMove): IsolaState {
  const next: IsolaState = {
    blocked: [...state.blocked],
    positions: { ...state.positions },
  };
  next.positions[player] = move.to;
  next.blocked[move.block] = true;
  return next;
}

export function chooseIsolaMove(
  state: IsolaState,
  player: Player,
  difficulty: Difficulty,
): IsolaMove | null {
  const moves = isolaMoves(state, player);
  if (moves.length === 0) return null;
  if (difficulty === 'facile') return moves[0];

  const scored = moves.map((move) => {
    const next = applyIsolaMove(state, player, move);
    const opponentMoves = isolaMovableCells(next, otherPlayer(player)).length;
    const ownMoves = isolaMovableCells(next, player).length;
    const distanceToCenter = Math.abs(cellRow(move.to) - 2) + Math.abs(cellColumn(move.to) - 2);
    return {
      move,
      score:
        (opponentMoves === 0 ? 10_000 : 0) - opponentMoves * (difficulty === 'expert' ? 12 : 5) +
        ownMoves * 2 -
        distanceToCenter,
    };
  });
  scored.sort((first, second) => second.score - first.score || first.move.block - second.move.block);
  return scored[0].move;
}

export type DominoMove = {
  cells: [number, number];
};

export function domineeringMoves(occupied: readonly boolean[], player: Player): DominoMove[] {
  const moves: DominoMove[] = [];
  if (player === 1) {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let column = 0; column < BOARD_SIZE - 1; column += 1) {
        const first = row * BOARD_SIZE + column;
        const second = first + 1;
        if (!occupied[first] && !occupied[second]) moves.push({ cells: [first, second] });
      }
    }
  } else {
    for (let row = 0; row < BOARD_SIZE - 1; row += 1) {
      for (let column = 0; column < BOARD_SIZE; column += 1) {
        const first = row * BOARD_SIZE + column;
        const second = first + BOARD_SIZE;
        if (!occupied[first] && !occupied[second]) moves.push({ cells: [first, second] });
      }
    }
  }
  return moves;
}

export function applyDomineeringMove(occupied: readonly boolean[], move: DominoMove): boolean[] {
  const next = [...occupied];
  next[move.cells[0]] = true;
  next[move.cells[1]] = true;
  return next;
}

export function chooseDomineeringMove(
  occupied: readonly boolean[],
  player: Player,
  difficulty: Difficulty,
  random: () => number = Math.random,
): DominoMove | null {
  const moves = domineeringMoves(occupied, player);
  if (moves.length === 0) return null;
  if (difficulty === 'facile') return randomItem(moves, random);

  const scored = moves.map((move) => {
    const next = applyDomineeringMove(occupied, move);
    const opponentMoves = domineeringMoves(next, otherPlayer(player)).length;
    const ownMoves = domineeringMoves(next, player).length;
    const centerDistance = move.cells.reduce(
      (total, cell) => total + Math.abs(cellRow(cell) - 2) + Math.abs(cellColumn(cell) - 2),
      0,
    );
    return {
      move,
      score:
        -opponentMoves * (difficulty === 'expert' ? 5 : 2) + ownMoves + (12 - centerDistance),
    };
  });
  scored.sort((first, second) => second.score - first.score || first.move.cells[0] - second.move.cells[0]);
  const candidateLimit = difficulty === 'expert' ? 2 : 4;
  return randomItem(scored.slice(0, candidateLimit), random).move;
}

export type SimEdge = {
  a: number;
  b: number;
  owner: 0 | Player;
};

export const SIM_POINTS = Array.from({ length: 6 }, (_, index) => {
  const angle = -Math.PI / 2 + (index * Math.PI) / 3;
  return { x: 50 + Math.cos(angle) * 39, y: 50 + Math.sin(angle) * 39 };
});

export const SIM_EDGES: ReadonlyArray<{ a: number; b: number }> = Array.from(
  { length: 6 },
  (_, a) => Array.from({ length: 6 - a - 1 }, (_, offset) => ({ a, b: a + offset + 1 })),
).flat();

export const SIM_TRIANGLES: ReadonlyArray<[number, number, number]> = (() => {
  const triangles: [number, number, number][] = [];
  for (let a = 0; a < 6; a += 1) {
    for (let b = a + 1; b < 6; b += 1) {
      for (let c = b + 1; c < 6; c += 1) triangles.push([a, b, c]);
    }
  }
  return triangles;
})();

export function simHasTriangle(edges: readonly SimEdge[], player: Player): boolean {
  return SIM_TRIANGLES.some(([a, b, c]) => {
    const pairs: [number, number][] = [
      [a, b],
      [a, c],
      [b, c],
    ];
    return pairs.every(([first, second]) =>
      edges.some(
        (edge) =>
          edge.owner === player &&
          ((edge.a === first && edge.b === second) || (edge.a === second && edge.b === first)),
      ),
    );
  });
}

export function chooseSimEdge(
  edges: readonly SimEdge[],
  player: Player,
  difficulty: Difficulty,
): number | null {
  const legal = edges.flatMap((edge, index) => (edge.owner === 0 ? [index] : []));
  if (legal.length === 0) return null;
  if (difficulty === 'facile') return legal[0];

  const safe = legal.filter((index) => {
    const next = edges.map((edge, edgeIndex) =>
      edgeIndex === index ? { ...edge, owner: player as 0 | Player } : edge,
    );
    return !simHasTriangle(next, player);
  });
  if (safe.length === 0) return legal[0];
  if (difficulty === 'intermediaire') return safe[0];

  const scored = safe.map((index) => {
    const next = edges.map((edge, edgeIndex) =>
      edgeIndex === index ? { ...edge, owner: player as 0 | Player } : edge,
    );
    const opponentSafeChoices = next.filter((edge, edgeIndex) => {
      if (edge.owner !== 0) return false;
      const afterOpponent = next.map((candidate, candidateIndex) =>
        candidateIndex === edgeIndex
          ? { ...candidate, owner: otherPlayer(player) as 0 | Player }
          : candidate,
      );
      return !simHasTriangle(afterOpponent, otherPlayer(player));
    }).length;
    return { index, score: -opponentSafeChoices };
  });
  scored.sort((first, second) => second.score - first.score || first.index - second.index);
  return scored[0].index;
}

export function hexHasConnection(cells: readonly (0 | Player)[], player: Player): boolean {
  const starts =
    player === 1
      ? BOARD_CELLS.filter((cell) => cellRow(cell) === 0 && cells[cell] === player)
      : BOARD_CELLS.filter((cell) => cellColumn(cell) === 0 && cells[cell] === player);
  const visited = new Set<number>();
  const queue = [...starts];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    if (player === 1 && cellRow(current) === BOARD_SIZE - 1) return true;
    if (player === 2 && cellColumn(current) === BOARD_SIZE - 1) return true;
    for (const neighbor of hexAdjacentCells(current)) {
      if (cells[neighbor] === player && !visited.has(neighbor)) queue.push(neighbor);
    }
  }

  return false;
}

function hexPathCost(cells: readonly (0 | Player)[], player: Player): number {
  const distance = Array.from({ length: BOARD_CELLS.length }, () => Number.POSITIVE_INFINITY);
  const starts = BOARD_CELLS.filter((cell) =>
    player === 1 ? cellRow(cell) === 0 : cellColumn(cell) === 0,
  );
  for (const start of starts) distance[start] = cells[start] === player ? 0 : cells[start] === 0 ? 1 : 20;

  const pending = [...BOARD_CELLS];
  while (pending.length > 0) {
    pending.sort((first, second) => distance[first] - distance[second]);
    const current = pending.shift()!;
    if (!Number.isFinite(distance[current])) break;
    for (const neighbor of hexAdjacentCells(current)) {
      const weight = cells[neighbor] === player ? 0 : cells[neighbor] === 0 ? 1 : 20;
      const candidate = distance[current] + weight;
      if (candidate < distance[neighbor]) distance[neighbor] = candidate;
    }
  }

  const targets = BOARD_CELLS.filter((cell) =>
    player === 1 ? cellRow(cell) === BOARD_SIZE - 1 : cellColumn(cell) === BOARD_SIZE - 1,
  );
  return Math.min(...targets.map((cell) => distance[cell]));
}

export function chooseHexCell(
  cells: readonly (0 | Player)[],
  player: Player,
  difficulty: Difficulty,
): number | null {
  const legal = BOARD_CELLS.filter((cell) => cells[cell] === 0);
  if (legal.length === 0) return null;
  if (difficulty === 'facile') return legal[0];

  const opponent = otherPlayer(player);
  const immediate = legal.find((cell) => {
    const next = [...cells] as (0 | Player)[];
    next[cell] = player;
    return hexHasConnection(next, player);
  });
  if (immediate !== undefined) return immediate;

  const opponentImmediate = legal.find((cell) => {
    const next = [...cells] as (0 | Player)[];
    next[cell] = opponent;
    return hexHasConnection(next, opponent);
  });
  if (opponentImmediate !== undefined && difficulty === 'expert') return opponentImmediate;

  const scored = legal.map((cell) => {
    const next = [...cells] as (0 | Player)[];
    next[cell] = player;
    const ownPath = hexPathCost(next, player);
    const opponentPath = hexPathCost(next, opponent);
    const centerDistance = Math.abs(cellRow(cell) - 2) + Math.abs(cellColumn(cell) - 2);
    return {
      cell,
      score: opponentPath * 2 - ownPath * (difficulty === 'expert' ? 2 : 1) - centerDistance * 0.1,
    };
  });
  scored.sort((first, second) => second.score - first.score || first.cell - second.cell);
  return scored[0].cell;
}
