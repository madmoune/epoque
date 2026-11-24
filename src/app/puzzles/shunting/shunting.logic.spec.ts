import { describe, expect, it } from 'vitest';
import {
  createShuntingState,
  moveShuntingTrain,
  parkedTrainCount,
  SHUNT_NODES,
  SHUNT_STOPS,
  SHUNT_TRAINS,
  shuntingRoutes,
} from './shunting.logic';

describe('Triage ferroviaire', () => {
  it('honors both points of a crossover, avoids occupied stops, and lets the train reverse', () => {
    const start = { positions: [6, 0, 9, 21], switches: 0 };
    expect(shuntingRoutes(start, 0).get(4)).toEqual([6, 5, 4]);
    expect(shuntingRoutes(start, 0).has(10)).toBe(false);
    expect(shuntingRoutes({ ...start, switches: 2 }, 0).has(12)).toBe(false);

    const crossover = { ...start, switches: 3 };
    expect(shuntingRoutes(crossover, 0).get(12)).toEqual([6, 5, 13, 12]);
    expect(moveShuntingTrain(crossover, 0, 13)).toBe(crossover);
    expect(moveShuntingTrain(crossover, 0, 14)).toBe(crossover);

    const siding = moveShuntingTrain(crossover, 0, 12);
    expect(moveShuntingTrain(siding, 0, 6)).toEqual(crossover);
    const parked = moveShuntingTrain({ ...siding, switches: 2 }, 0, 14);
    expect(parkedTrainCount(parked)).toBe(1);
  });

  it('can reach all 720 starting layouts by reversing legal shunting moves', () => {
    const routes = SHUNT_NODES.map((): { to: number; occupied: number }[] => []);
    for (const { node } of SHUNT_STOPS) {
      const distinct = new Map<string, { to: number; occupied: number }>();
      for (let switches = 0; switches < 16; switches++) {
        for (const [to, path] of shuntingRoutes({ positions: [node], switches }, 0)) {
          distinct.set(path.join(','), {
            to,
            occupied: path.slice(1).reduce((mask, stop) => mask | (1 << stop), 0),
          });
        }
      }
      routes[node] = [...distinct.values()];
    }

    const key = (positions: readonly number[]) =>
      positions.reduce((code, stop, index) => code | (stop << (5 * index)), 0);
    const goal = SHUNT_TRAINS.map(({ bay }): number => bay);
    const queue = [goal];
    const visited = new Set([key(goal)]);
    let starts = 0;
    for (const positions of queue) {
      const left = positions.filter((stop) => stop <= 4).length;
      const right = positions.filter((stop) => stop >= 8 && stop <= 10).length;
      if (left === 2 && right === 2) starts++;

      const occupied = positions.reduce((mask, stop) => mask | (1 << stop), 0);
      positions.forEach((from, train) => {
        for (const route of routes[from]) {
          if (route.occupied & occupied) continue;
          const next = [...positions];
          next[train] = route.to;
          const id = key(next);
          if (visited.has(id)) continue;
          queue.push(next);
          visited.add(id);
        }
      });
    }

    expect(starts).toBe(720);
    const first = createShuntingState(undefined, () => 0);
    const next = createShuntingState(first, () => 0);
    expect(visited.has(key(first.positions))).toBe(true);
    expect(visited.has(key(next.positions))).toBe(true);
    expect(next.positions).not.toEqual(first.positions);
    expect(next.switches).toBe(0);
  });
});
