import { range, shuffle } from '../new-games/random';

const STOPS_PER_TRACK = 11;

export const SHUNT_NODES = range(2 * STOPS_PER_TRACK).map((node) => ({
  node,
  x: 7.5 + (node % STOPS_PER_TRACK) * 8.5,
  y: node < STOPS_PER_TRACK ? 29 : 71,
  track: node < STOPS_PER_TRACK ? 'voie principale' : 'voie de garage',
  position: (node % STOPS_PER_TRACK) + 1,
}));

export const SHUNT_SWITCHES = [
  { node: 13, stem: 12, straight: 14, branch: 5 },
  { node: 5, stem: 6, straight: 4, branch: 13 },
  { node: 7, stem: 6, straight: 8, branch: 20 },
  { node: 20, stem: 21, straight: 19, branch: 7 },
] as const;

export const SHUNT_TRAINS = [
  { letter: 'A', color: '#79d8af', bay: 14 },
  { letter: 'B', color: '#ff9b9d', bay: 15 },
  { letter: 'C', color: '#8ac0ff', bay: 17 },
  { letter: 'D', color: '#f8d180', bay: 18 },
] as const;

export const SHUNT_CROSSOVERS: readonly (readonly [number, number])[] = [
  [13, 5],
  [7, 20],
];
export const SHUNT_MAIN_LINES: readonly (readonly [number, number])[] = [
  [0, STOPS_PER_TRACK - 1],
  [STOPS_PER_TRACK, 2 * STOPS_PER_TRACK - 1],
];

const SWITCH_AT = new Map<number, number>(SHUNT_SWITCHES.map(({ node }, index) => [node, index]));
export const SHUNT_STOPS = SHUNT_NODES.filter(({ node }) => !SWITCH_AT.has(node));

export interface ShuntingState {
  readonly positions: readonly number[];
  readonly switches: number;
}

const TRACK_LINKS: readonly (readonly [number, number])[] = [
  ...SHUNT_NODES.flatMap(({ node }): [number, number][] =>
    (node + 1) % STOPS_PER_TRACK === 0 ? [] : [[node, node + 1]],
  ),
  ...SHUNT_CROSSOVERS,
];

const NEIGHBORS_BY_SWITCHES = range(1 << SHUNT_SWITCHES.length).map((switches) => {
  const neighbors = SHUNT_NODES.map((): number[] => []);
  for (const [from, to] of TRACK_LINKS) {
    if (switchAllows(switches, from, to) && switchAllows(switches, to, from)) {
      neighbors[from].push(to);
      neighbors[to].push(from);
    }
  }
  return neighbors;
});

export function createShuntingState(previous?: ShuntingState, random = Math.random): ShuntingState {
  const left = shuffle([0, 1, 2, 3, 4], random).slice(0, 2);
  const right = shuffle([8, 9, 10], random).slice(0, 2);
  const positions = shuffle([...left, ...right], random);
  if (positions.every((node, index) => previous?.positions[index] === node)) {
    positions.push(positions.shift()!);
  }
  return { positions, switches: 0 };
}

export function isSwitchDiverging(switches: number, index: number): boolean {
  return (switches & (1 << index)) !== 0;
}

export function isShuntLinkOpen(switches: number, from: number, to: number): boolean {
  return NEIGHBORS_BY_SWITCHES[switches][from].includes(to);
}

export function shuntingRoutes(
  state: ShuntingState,
  train: number,
): ReadonlyMap<number, readonly number[]> {
  const start = state.positions[train];
  const routes = new Map<number, readonly number[]>();
  if (start === undefined) return routes;

  const occupied = new Set(state.positions);
  const neighbors = NEIGHBORS_BY_SWITCHES[state.switches];
  const pending = [[start]];
  for (const path of pending) {
    for (const next of neighbors[path[path.length - 1]]) {
      if (occupied.has(next)) continue;
      occupied.add(next);
      const route = [...path, next];
      if (!SWITCH_AT.has(next)) routes.set(next, route);
      pending.push(route);
    }
  }
  return routes;
}

export function moveShuntingTrain(
  state: ShuntingState,
  train: number,
  destination: number,
): ShuntingState {
  if (!shuntingRoutes(state, train).has(destination)) return state;
  const positions = [...state.positions];
  positions[train] = destination;
  return { ...state, positions };
}

export function parkedTrainCount(state: ShuntingState): number {
  return SHUNT_TRAINS.filter(({ bay }, index) => state.positions[index] === bay).length;
}

function switchAllows(switches: number, from: number, to: number): boolean {
  const index = SWITCH_AT.get(from);
  if (index === undefined) return true;
  const turnout = SHUNT_SWITCHES[index];
  return (
    to === turnout.stem ||
    to === (isSwitchDiverging(switches, index) ? turnout.branch : turnout.straight)
  );
}
