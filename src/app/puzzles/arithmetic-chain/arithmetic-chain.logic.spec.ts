import { describe, expect, it } from 'vitest';
import { createArithmeticChain } from './arithmetic-chain.logic';

function applySymbol(value: number, symbol: string): number {
  switch (symbol) {
    case 'x²':
      return value * value;
    case 'x³':
      return value * value * value;
    case '√x':
      return Math.sqrt(value);
    case '× ¼':
      return value / 4;
    case '× ⅗':
      return (value / 5) * 3;
    case '× 2⅓':
      return value * 2 + value / 3;
    case '× 10 %':
      return (value * 10) / 100;
  }

  const [operator, operand] = symbol.split(' ');
  const number = Number(operand);
  switch (operator) {
    case '+':
      return value + number;
    case '−':
      return value - number;
    case '×':
      return value * number;
    case '÷':
      return value / number;
    default:
      throw new Error(`Unexpected operation ${symbol}`);
  }
}

describe('Calcul en chaîne', () => {
  it('produces full chains with positive integer results and all the reference operations', () => {
    let seed = 7143892;
    const draw = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const seen = new Set<string>();
    for (let round = 0; round < 180; round++) {
      const chain = createArithmeticChain(undefined, draw);
      expect(chain.steps).toHaveLength(9);
      let value = chain.start;
      const visited = new Set([value]);
      for (const { operation, result } of chain.steps) {
        expect(result).toBe(applySymbol(value, operation.symbol));
        expect(Number.isSafeInteger(result)).toBe(true);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(2_500);
        expect(visited.has(result)).toBe(false);
        visited.add(result);
        seen.add(operation.symbol);
        value = result;
      }
      expect(chain.answer).toBe(value);
    }

    expect([...seen]).toEqual(
      expect.arrayContaining([
        '÷ 2',
        '× 2',
        'x²',
        'x³',
        '√x',
        '× ¼',
        '× ⅗',
        '× 2⅓',
        '× 10 %',
        '÷ 9',
      ]),
    );
  });

  it('can generate a different start and nine steps even with the same draw each time', () => {
    const first = createArithmeticChain(undefined, () => 0);
    const second = createArithmeticChain(first.start, () => 0);

    expect(second.start).not.toBe(first.start);
    expect(first.steps).toHaveLength(9);
    expect(second.steps).toHaveLength(9);
  });
});
