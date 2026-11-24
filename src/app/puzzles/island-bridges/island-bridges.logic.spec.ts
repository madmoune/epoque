import { describe, expect, it } from 'vitest';
import {
  bridgeDestination,
  bridgeId,
  createBridgePuzzle,
  findBridgeHint,
} from './island-bridges.logic';

describe('Ponts et îles', () => {
  it('keeps each of the fifteen bridges clear of other islands and supports every starting island', () => {
    for (const mapSeed of [0, 0.4, 0.8]) {
      for (const cutSeed of [0, 0.4, 0.8]) {
        const draws = [mapSeed, cutSeed];
        const puzzle = createBridgePuzzle(undefined, () => draws.shift() ?? 0.6);
        expect(puzzle.islands).toHaveLength(7);
        expect(new Set(puzzle.bridges.map((bridge) => bridge.id)).size).toBe(15);

        const points = new Map(puzzle.islands.map((island) => [island.id, island]));
        for (const bridge of puzzle.bridges) {
          const from = points.get(bridge.from)!;
          const to = points.get(bridge.to)!;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          for (const island of puzzle.islands) {
            if (island.id === from.id || island.id === to.id) continue;
            const along = Math.max(
              0,
              Math.min(
                1,
                ((island.x - from.x) * dx + (island.y - from.y) * dy) / (dx * dx + dy * dy),
              ),
            );
            const distance = Math.hypot(
              island.x - (from.x + along * dx),
              island.y - (from.y + along * dy),
            );
            expect(distance).toBeGreaterThan(36);
          }
        }

        for (const start of puzzle.islands) {
          let current = start.id;
          let remaining = [...puzzle.bridges];
          for (let move = 0; move < 15; move++) {
            const bridge = findBridgeHint(remaining, current)!;
            expect(bridge).toBeDefined();
            const next = bridgeDestination(bridge, current);
            expect(next).not.toBeNull();
            current = next!;
            remaining = remaining.filter((candidate) => candidate.id !== bridge.id);
          }
          expect(remaining).toHaveLength(0);
          expect(current).toBe(start.id);
        }

        expect(createBridgePuzzle(puzzle, () => mapSeed).map).not.toBe(puzzle.map);
      }
    }
  });

  it('suggests a crossing that leaves the remaining bridges reachable', () => {
    const bridges = [
      [1, 2],
      [1, 3],
      [3, 4],
      [4, 1],
    ].map(([from, to]) => ({ id: bridgeId(from, to), from, to }));
    expect(findBridgeHint(bridges, 1)?.id).toBe('1-3');
    expect(findBridgeHint(bridges.slice(1), 2)).toBeUndefined();
  });
});
