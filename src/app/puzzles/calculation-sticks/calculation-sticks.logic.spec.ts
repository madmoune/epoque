import { describe, expect, it } from 'vitest';
import {
  CalculationStick,
  CalculationSticksPuzzle,
  createCalculationSticks,
  STICK_LENGTH,
} from './calculation-sticks.logic';

function direction(stick: CalculationStick): readonly [number, number] {
  const radians = (stick.angle * Math.PI) / 180;
  return [Math.cos(radians), Math.sin(radians)];
}

describe('Bâtonnets de calcul', () => {
  it('makes each successive pair cross, keeps the sticks on the board and varies the result', () => {
    let seed = 1564;
    const random = () => {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    let previous: CalculationSticksPuzzle | undefined;
    for (let round = 0; round < 64; round++) {
      const puzzle = createCalculationSticks(previous, random);
      expect(puzzle.sticks).toHaveLength(9);
      expect(puzzle.answer).not.toBe(previous?.answer);
      previous = puzzle;

      for (const stick of puzzle.sticks) {
        const [dx, dy] = direction(stick);
        const halfWidth = 5.25;
        const extentX = (Math.abs(dx) * STICK_LENGTH) / 2 + Math.abs(dy) * halfWidth;
        const extentY = (Math.abs(dy) * STICK_LENGTH) / 2 + Math.abs(dx) * halfWidth;
        expect(stick.x - extentX).toBeGreaterThan(0);
        expect(stick.x + extentX).toBeLessThan(100);
        expect(stick.y - extentY).toBeGreaterThan(0);
        expect(stick.y + extentY).toBeLessThan(100);

        const next = puzzle.sticks[stick.id + 1];
        if (!next) continue;
        expect(next.vertical).not.toBe(stick.vertical);
        const [otherDx, otherDy] = direction(next);
        const x = next.x - stick.x;
        const y = next.y - stick.y;
        expect(Math.abs(x * dx + y * dy)).toBeLessThan(STICK_LENGTH / 2);
        expect(Math.abs(x * otherDx + y * otherDy)).toBeLessThan(STICK_LENGTH / 2);
      }

      const expression = puzzle.sticks.map(({ symbol }) => symbol).join('');
      expect(expression).toMatch(/^\d{1,2}[+−×]\d{1,2}[+−×]\d{1,2}[+−×]\d{1,2}$/);
      const operands = expression.split(/[+−×]/).map(Number);
      const operators = expression.match(/[+−×]/g)!;
      expect([...operators].sort()).toEqual(['+', '×', '−']);
      const multiplication = operators.indexOf('×');
      operands.splice(multiplication, 2, operands[multiplication] * operands[multiplication + 1]);
      operators.splice(multiplication, 1);
      const expected = operators.reduce(
        (total, operator, index) => total + (operator === '+' ? 1 : -1) * operands[index + 1],
        operands[0],
      );
      expect(puzzle.answer).toBe(expected);
    }
  });
});
