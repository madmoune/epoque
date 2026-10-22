export type Player = 1 | 2;

function randomItem<T>(items: readonly T[], random: () => number = Math.random): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

function chooseCpuMove<T>(moves: readonly T[], expertMoves: readonly T[], random: () => number): T {
  // Sans coup gagnant ou sûr, toutes les réponses restent ouvertes pour varier les parties.
  if (expertMoves.length === 0) return randomItem(moves, random);

  const alternatives = moves.filter((move) => !expertMoves.includes(move));
  // Une erreur sur cinq en moyenne, uniquement si un autre coup est possible.
  const candidates = alternatives.length > 0 && random() < 0.2 ? alternatives : expertMoves;
  return randomItem(candidates, random);
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
  random: () => number = Math.random,
): WythoffMove | null {
  const moves = wythoffMoves(piles);
  if (moves.length === 0) return null;

  const winningMoves = moves.filter((move) => isWythoffColdPosition(applyWythoffMove(piles, move)));
  return chooseCpuMove(moves, winningMoves, random);
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

export function nimEmissionMoveIsWinning(state: NimEmissionState, move: NimEmissionMove): boolean {
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
  random: () => number = Math.random,
): NimEmissionMove | null {
  const moves = nimEmissionMoves(state);
  if (moves.length === 0) return null;
  const winningMoves = moves.filter((move) => nimEmissionMoveIsWinning(state, move));
  return chooseCpuMove(moves, winningMoves, random);
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
  random: () => number = Math.random,
): IsolaMove | null {
  const moves = isolaMoves(state, player);
  if (moves.length === 0) return null;

  const scored = moves.map((move) => {
    const next = applyIsolaMove(state, player, move);
    const opponentMoves = isolaMovableCells(next, otherPlayer(player)).length;
    const ownMoves = isolaMovableCells(next, player).length;
    const distanceToCenter = Math.abs(cellRow(move.to) - 2) + Math.abs(cellColumn(move.to) - 2);
    return {
      move,
      score:
        (opponentMoves === 0 ? 10_000 : 0) - opponentMoves * 12 + ownMoves * 2 - distanceToCenter,
    };
  });
  scored.sort(
    (first, second) => second.score - first.score || first.move.block - second.move.block,
  );
  const expertMoves = scored.filter((candidate) => candidate.score === scored[0].score);
  return chooseCpuMove(
    moves,
    expertMoves.map((candidate) => candidate.move),
    random,
  );
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
  random: () => number = Math.random,
): DominoMove | null {
  const moves = domineeringMoves(occupied, player);
  if (moves.length === 0) return null;

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
      score: -opponentMoves * 5 + ownMoves + (12 - centerDistance),
    };
  });
  scored.sort(
    (first, second) => second.score - first.score || first.move.cells[0] - second.move.cells[0],
  );
  const expertMoves = scored
    .filter((candidate) => candidate.score === scored[0].score)
    .map((candidate) => candidate.move);
  return chooseCpuMove(moves, expertMoves, random);
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
  random: () => number = Math.random,
): number | null {
  const legal = edges.flatMap((edge, index) => (edge.owner === 0 ? [index] : []));
  if (legal.length === 0) return null;

  const safe = legal.filter((index) => {
    const next = edges.map((edge, edgeIndex) =>
      edgeIndex === index ? { ...edge, owner: player as 0 | Player } : edge,
    );
    return !simHasTriangle(next, player);
  });
  if (safe.length === 0) return chooseCpuMove(legal, [], random);

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
  const expertMoves = scored
    .filter((candidate) => candidate.score === scored[0].score)
    .map((candidate) => candidate.index);
  return chooseCpuMove(legal, expertMoves, random);
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

const HEX_NEIGHBORS = BOARD_CELLS.map(hexAdjacentCells);
const HEX_EDGES = ([1, 2] as const).map((player) =>
  [0, BOARD_SIZE - 1].map((edge) =>
    BOARD_CELLS.filter((cell) => (player === 1 ? cellRow(cell) : cellColumn(cell)) === edge),
  ),
);
const HEX_BRIDGES = BOARD_CELLS.flatMap((first) =>
  BOARD_CELLS.filter((second) => second > first && !HEX_NEIGHBORS[first].includes(second))
    .map((second) => ({
      first,
      second,
      carriers: HEX_NEIGHBORS[first].filter((cell) => HEX_NEIGHBORS[second].includes(cell)),
    }))
    .filter((bridge) => bridge.carriers.length === 2),
);
const HEX_POSITION_WEIGHTS = BOARD_CELLS.map((cell) => 3 ** cell);
const HEX_UNREACHABLE = BOARD_CELLS.length + 1;
const HEX_WIN_SCORE = 10_000;
// Limiter les positions évaluées plutôt que le temps rend la recherche stable et reproductible.
const HEX_SEARCH_BUDGET = 6_000;
const HEX_SEARCH_LIMIT = Symbol('hex-search-limit');

type HexEvaluation = {
  score: number;
  costs: [number, number];
};

function hexDistances(cells: readonly (0 | Player)[], player: Player, edge: number): number[] {
  const distance = BOARD_CELLS.map(() => HEX_UNREACHABLE);
  const pending: number[] = [];
  for (const cell of HEX_EDGES[player - 1][edge]) {
    if (cells[cell] === otherPlayer(player)) continue;
    distance[cell] = cells[cell] === player ? 0 : 1;
    pending.push(cell);
  }
  for (let index = 0; index < pending.length; index += 1) {
    const current = pending[index];
    for (const neighbor of HEX_NEIGHBORS[current]) {
      // Une pierre adverse coupe réellement le chemin : on ne peut pas la traverser.
      if (cells[neighbor] === otherPlayer(player)) continue;
      const candidate = distance[current] + (cells[neighbor] === player ? 0 : 1);
      if (candidate >= distance[neighbor]) continue;
      distance[neighbor] = candidate;
      pending.push(neighbor);
    }
  }
  return distance;
}

function evaluateHex(cells: readonly (0 | Player)[]): HexEvaluation {
  const costs: [number, number] = [0, 0];
  const options = [0, 0];
  for (const player of [1, 2] as const) {
    const fromStart = hexDistances(cells, player, 0);
    const fromEnd = hexDistances(cells, player, 1);
    const cost = Math.min(...HEX_EDGES[player - 1][1].map((cell) => fromStart[cell]));
    costs[player - 1] = cost;
    options[player - 1] = BOARD_CELLS.filter(
      (cell) => cells[cell] === 0 && fromStart[cell] + fromEnd[cell] - 1 === cost,
    ).length;
  }
  if (costs[0] === 0) return { score: HEX_WIN_SCORE, costs };
  if (costs[1] === 0) return { score: -HEX_WIN_SCORE, costs };

  let bridges = 0;
  for (const { first, second, carriers } of HEX_BRIDGES) {
    const owner = cells[first];
    if (owner === 0 || owner !== cells[second] || !carriers.every((cell) => cells[cell] === 0)) {
      continue;
    }
    bridges += owner === 1 ? 1 : -1;
  }
  let center = 0;
  for (const cell of BOARD_CELLS) {
    if (cells[cell] === 0) continue;
    const value = 4 - Math.abs(cellRow(cell) - 2) - Math.abs(cellColumn(cell) - 2);
    center += cells[cell] === 1 ? value : -value;
  }
  return {
    score: (costs[1] - costs[0]) * 100 + (options[0] - options[1]) * 3 + bridges * 12 + center,
    costs,
  };
}

function hexWinningCells(
  cells: (0 | Player)[],
  player: Player,
  legal: readonly number[],
): number[] {
  return legal.filter((cell) => {
    cells[cell] = player;
    const wins = hexHasConnection(cells, player);
    cells[cell] = 0;
    return wins;
  });
}

function scoreHexMoves(cells: (0 | Player)[], player: Player, legal: readonly number[]): number[] {
  const evaluations = new Map<number, HexEvaluation>();
  const exactScores = new Map<number, number>();
  const position = cells.reduce<number>(
    (code, owner, cell) => code + owner * HEX_POSITION_WEIGHTS[cell],
    0,
  );

  const evaluation = (code: number): HexEvaluation => {
    const cached = evaluations.get(code);
    if (cached) return cached;
    if (evaluations.size >= HEX_SEARCH_BUDGET) throw HEX_SEARCH_LIMIT;
    const value = evaluateHex(cells);
    evaluations.set(code, value);
    return value;
  };

  const rankedMoves = (moves: readonly number[], turn: Player, code: number) =>
    moves
      .map((cell) => {
        cells[cell] = turn;
        let score: number;
        try {
          score =
            evaluation(code + turn * HEX_POSITION_WEIGHTS[cell]).score * (turn === 1 ? 1 : -1);
        } finally {
          cells[cell] = 0;
        }
        return { cell, score };
      })
      .sort((a, b) => b.score - a.score);

  const search = (
    turn: Player,
    depth: number,
    alpha: number,
    beta: number,
    code: number,
  ): number => {
    const key = code * 64 + depth * 2 + turn - 1;
    const cached = exactScores.get(key);
    if (cached !== undefined) return cached;
    const state = evaluation(code);
    const sign = turn === 1 ? 1 : -1;
    if (Math.abs(state.score) === HEX_WIN_SCORE)
      return state.score * sign + Math.sign(state.score * sign) * depth;
    // Même en bout de recherche, reconnaître un gain immédiat ou une double menace.
    if (state.costs[turn - 1] === 1) return HEX_WIN_SCORE + depth;

    const moves = BOARD_CELLS.filter((cell) => cells[cell] === 0);
    const threats =
      state.costs[otherPlayer(turn) - 1] === 1
        ? hexWinningCells(cells, otherPlayer(turn), moves)
        : [];
    if (threats.length > 1) return -HEX_WIN_SCORE - depth;
    if (depth === 0 && threats.length === 0) return state.score * sign;

    const ranked = rankedMoves(threats.length === 1 ? threats : moves, turn, code);
    const candidates = moves.length <= 8 ? ranked : ranked.slice(0, 8);
    const initialAlpha = alpha;
    let best = Number.NEGATIVE_INFINITY;
    for (const { cell } of candidates) {
      cells[cell] = turn;
      let score: number;
      try {
        score = -search(
          otherPlayer(turn),
          Math.max(0, depth - 1),
          -beta,
          -alpha,
          code + turn * HEX_POSITION_WEIGHTS[cell],
        );
      } finally {
        cells[cell] = 0;
      }
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    if (best > initialAlpha && best < beta) exactScores.set(key, best);
    return best;
  };

  const ranked = rankedMoves(legal, player, position);
  let completed = ranked.map(({ score }) => score);
  const maxDepth = legal.length <= 8 ? legal.length : 4;
  for (let depth = 2; depth <= maxDepth; depth += 1) {
    const scores: number[] = [];
    try {
      for (const { cell } of ranked) {
        cells[cell] = player;
        try {
          scores.push(
            -search(
              otherPlayer(player),
              depth - 1,
              Number.NEGATIVE_INFINITY,
              Number.POSITIVE_INFINITY,
              position + player * HEX_POSITION_WEIGHTS[cell],
            ),
          );
        } finally {
          cells[cell] = 0;
        }
      }
    } catch (error) {
      if (error !== HEX_SEARCH_LIMIT) throw error;
      // Garder uniquement un niveau terminé, afin de comparer tous les coups équitablement.
      break;
    }
    completed = scores;
  }
  const best = Math.max(...completed);
  if (legal.length <= 8 && best <= -HEX_WIN_SCORE) return [];
  return ranked.filter((_, index) => completed[index] === best).map(({ cell }) => cell);
}

export function chooseHexCell(
  cells: readonly (0 | Player)[],
  player: Player,
  random: () => number = Math.random,
): number | null {
  const legal = BOARD_CELLS.filter((cell) => cells[cell] === 0);
  if (legal.length === 0) return null;

  const board = [...cells];
  const opponent = otherPlayer(player);
  const immediate = hexWinningCells(board, player, legal);
  if (immediate.length > 0) return chooseCpuMove(legal, immediate, random);

  const opponentImmediate = hexWinningCells(board, opponent, legal);
  if (opponentImmediate.length === 1) return chooseCpuMove(legal, opponentImmediate, random);
  if (opponentImmediate.length > 1) return chooseCpuMove(legal, [], random);

  const expertMoves = scoreHexMoves(board, player, legal);
  return chooseCpuMove(legal, expertMoves, random);
}
