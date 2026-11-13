import { describe, expect, it } from 'vitest';
import {
  MENTAL_ARITHMETIC_TEMPLATE_COUNT,
  createArithmeticProblem,
  createQuickArithmeticProblem,
} from './mental-arithmetic-problem';

describe('createQuickArithmeticProblem', () => {
  it('keeps quick divisions simple while varying multiplication lengths and adjustments', () => {
    let state = 0x42cafe;
    const random = (): number => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state / 0x1_0000_0000;
    };
    const factorLengths = new Set<number>();
    const dividendLengths = new Set<number>();
    const adjustmentOperators = new Set<string>();

    for (let index = 0; index < 500; index += 1) {
      const { expression, answer } = createQuickArithmeticProblem(random);
      const match = expression.match(/^([1-9]\d{0,2}) ([x/]) ([1-9]\d{0,2})(?: ([+-]) (\d+))?$/);
      expect(match).not.toBeNull();
      const [, left, operator, right, adjustmentOperator = '', adjustment = '0'] = match!;
      expect([left.length, right.length]).toContain(2);

      const a = Number(left);
      const b = Number(right);
      if (operator === '/') {
        expect(a % b).toBe(0);
        dividendLengths.add(left.length);
      } else {
        expect(left).toHaveLength(2);
        factorLengths.add(right.length);
      }

      const offset = Number(adjustment);
      if (adjustmentOperator) {
        expect(offset).toBeGreaterThanOrEqual(1);
        expect(offset).toBeLessThanOrEqual(20);
      }
      adjustmentOperators.add(adjustmentOperator);
      const base = operator === '/' ? a / b : a * b;
      if (operator === '/') {
        expect(left).toHaveLength(2);
        expect(right).toHaveLength(1);
      }
      expect(answer).toBe(base + (adjustmentOperator === '-' ? -offset : offset));
    }

    expect(factorLengths).toEqual(new Set([1, 2, 3]));
    expect(dividendLengths).toEqual(new Set([2]));
    expect(adjustmentOperators).toEqual(new Set(['', '+', '-']));
  });
});

describe('createArithmeticProblem', () => {
  it('keeps every advanced template exact and integer-valued', () => {
    for (let template = 0; template < MENTAL_ARITHMETIC_TEMPLATE_COUNT; template += 1) {
      let call = 0;
      const random = (): number => {
        call += 1;
        return call === 1 ? (template + 0.5) / MENTAL_ARITHMETIC_TEMPLATE_COUNT : 0.47;
      };
      const problem = createArithmeticProblem(random);

      expect(problem.answer).toBe(evaluateExpression(problem.expression));
      expect(Number.isInteger(problem.answer)).toBe(true);
      expect(problem.expression).toMatch(/\(.+\)/);
      expect(problem.expression).toContain('^');
      expect(problem.expression).toContain(' / ');
      expect(problem.expression).toContain(' x ');
      expect(problem.expression).toContain(' + ');
      expect(problem.expression).toContain(' - ');
      expect(problem.expression).toMatch(/\+ \(\d{4} - \d{4}\)$/);
    }
  });

  it('generates varied hard problems without fractional answers', () => {
    let state = 0x5eed1234;
    const random = (): number => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state / 0x1_0000_0000;
    };
    const problems = Array.from({ length: 600 }, () => createArithmeticProblem(random));

    for (const problem of problems) {
      expect(problem.answer).toBe(evaluateExpression(problem.expression));
      expect(Number.isInteger(problem.answer)).toBe(true);
    }

    expect(new Set(problems.map((problem) => problem.expression)).size).toBeGreaterThan(550);
    expect(problems.some((problem) => problem.expression.includes('^3'))).toBe(true);
    expect(problems.some((problem) => /\([^()]*(?:\([^()]+\))/.test(problem.expression))).toBe(
      true,
    );
  });

  it('does not cancel adjacent division and multiplication factors', () => {
    let state = 0x7eed1234;
    const random = (): number => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state / 0x1_0000_0000;
    };
    const problems = Array.from({ length: 2_000 }, () => createArithmeticProblem(random));

    for (const problem of problems) {
      const directFactors = problem.expression.match(/\/ (\d+) x (\d+)/);
      if (directFactors) {
        expect(directFactors[1]).not.toBe(directFactors[2]);
      }

      const groupedFactors = problem.expression.match(/\/ \((\d+) \+ (\d+)\) x (\d+)/);
      if (groupedFactors) {
        expect(Number(groupedFactors[1]) + Number(groupedFactors[2])).not.toBe(
          Number(groupedFactors[3]),
        );
      }
    }
  });
});

function evaluateExpression(expression: string): number {
  const javascriptExpression = expression
    .replace(/sqrt\((\d+)\)/g, 'Math.sqrt($1)')
    .replaceAll(' x ', ' * ')
    .replaceAll('^', '**');

  return Function(`"use strict"; return (${javascriptExpression});`)() as number;
}
