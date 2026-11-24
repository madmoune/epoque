import { range, shuffle } from '../new-games/random';

export const BRIDGE_MAP_WIDTH = 420;
export const BRIDGE_MAP_HEIGHT = 310;

interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Island extends Point {
  readonly id: number;
}

export interface Bridge {
  readonly id: string;
  readonly from: number;
  readonly to: number;
}

export interface BridgePuzzle {
  readonly map: number;
  readonly islands: readonly Island[];
  readonly bridges: readonly Bridge[];
}

const MAPS = [
  {
    points: [
      [53, 79],
      [187, 35],
      [344, 70],
      [370, 205],
      [230, 267],
      [51, 231],
      [199, 154],
    ],
    cuts: [[[0, 2, 5, 1, 4, 3]], [[0, 2, 5, 4, 1, 3]], [[0, 1, 4, 2, 5, 3]]],
  },
  {
    points: [
      [51, 80],
      [193, 37],
      [347, 87],
      [359, 224],
      [208, 262],
      [54, 215],
      [230, 163],
    ],
    cuts: [[[0, 1, 4, 2, 5, 3]], [[0, 3, 5, 2, 1, 4]]],
  },
  {
    points: [
      [59, 103],
      [110, 41],
      [277, 40],
      [366, 123],
      [325, 257],
      [145, 263],
      [190, 150],
    ],
    cuts: [
      [[0, 3, 2, 5, 1, 4]],
      [
        [0, 1, 4],
        [2, 3, 5],
      ],
    ],
  },
];

export function bridgeId(first: number, second: number): string {
  return `${Math.min(first, second)}-${Math.max(first, second)}`;
}

export function createBridgePuzzle(previous?: BridgePuzzle, random = Math.random): BridgePuzzle {
  const maps = range(MAPS.length).filter((map) => map !== previous?.map);
  const map = maps[Math.floor(random() * maps.length)];
  const { points, cuts } = MAPS[map];
  const cycles = cuts[Math.floor(random() * cuts.length)];
  // Removing disjoint cycles from the complete graph preserves all even degrees.
  const omitted = new Set(
    cycles.flatMap((cycle) =>
      cycle.map((from, i) => bridgeId(from, cycle[(i + 1) % cycle.length])),
    ),
  );
  const ids = shuffle(
    range(points.length).map((index) => index + 1),
    random,
  );
  const mirrorX = random() < 0.5;
  const mirrorY = random() < 0.5;
  const islands = points.map(([x, y], index) => ({
    id: ids[index],
    x: mirrorX ? BRIDGE_MAP_WIDTH - x : x,
    y: mirrorY ? BRIDGE_MAP_HEIGHT - y : y,
  }));
  const bridges: Bridge[] = [];
  for (const [firstIndex, first] of islands.entries()) {
    for (let secondIndex = firstIndex + 1; secondIndex < islands.length; secondIndex++) {
      if (omitted.has(bridgeId(firstIndex, secondIndex))) continue;
      const second = islands[secondIndex];
      bridges.push({ id: bridgeId(first.id, second.id), from: first.id, to: second.id });
    }
  }

  return { map, islands, bridges };
}

export function bridgeDestination(bridge: Bridge, from: number | null): number | null {
  if (from === bridge.from) return bridge.to;
  if (from === bridge.to) return bridge.from;
  return null;
}

export function findBridgeHint(remaining: readonly Bridge[], from: number): Bridge | undefined {
  return remaining.find((bridge) => {
    const destination = bridgeDestination(bridge, from);
    if (destination === null) return false;

    // A valid walk preserves the required degree parity. The remaining bridges
    // only need to stay reachable from the island where this move ends.
    const afterMove = remaining.filter((candidate) => candidate !== bridge);
    const reachable = new Set([destination]);
    const queue = [destination];
    for (let index = 0; index < queue.length; index++) {
      for (const candidate of afterMove) {
        const end = bridgeDestination(candidate, queue[index]);
        if (end === null || reachable.has(end)) continue;
        reachable.add(end);
        queue.push(end);
      }
    }
    return afterMove.every(
      (candidate) => reachable.has(candidate.from) && reachable.has(candidate.to),
    );
  });
}
