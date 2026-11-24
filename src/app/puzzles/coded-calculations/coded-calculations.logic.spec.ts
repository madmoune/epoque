import { describe, expect, it } from 'vitest';
import { BinaryOperator } from '../shared/binary-operation';
import {
  calculateSymbol,
  calculationKey,
  CODED_CALCULATION_LIMIT,
  CODED_DIGITS,
  createCodedDigits,
} from './coded-calculations.logic';

function decode(digits: readonly number[]) {
  let count = 0;
  const test = (left: number, operator: BinaryOperator, right: number) => {
    count++;
    return calculateSymbol(digits, { left, operator, right });
  };

  let one = -1;
  for (let left = 0; left < digits.length; left += 2) {
    const right = left + 1;
    const product = test(left, '×', right);
    if (product === left) one = right;
    if (product === right) one = left;
    if (one !== -1) break;
  }
  if (one === -1) throw new Error('No symbol for 1');

  const anchor = one === 0 ? 1 : 0;
  const descending = [anchor];
  for (let step = 0; step < digits.length - 1; step++) {
    const next = test(descending.at(-1)!, '−', one);
    if (next === null) throw new Error('Missing predecessor');
    if (next === one) break;
    descending.push(next);
  }
  const decoded = Array<number>(digits.length).fill(0);
  decoded[one] = 1;
  descending.forEach((symbol, index) => (decoded[symbol] = descending.length + 1 - index));
  let current = anchor;
  for (let digit = decoded[anchor] + 1; digit <= digits.length; digit++) {
    const next = test(current, '+', one);
    if (next === null) throw new Error('Missing successor');
    decoded[next] = digit;
    current = next;
  }
  return { decoded, count };
}

describe('Calcul codé', () => {
  it('randomizes the digits and returns a symbol only for an integer between 1 and 8', () => {
    const first = createCodedDigits(undefined, () => 0);
    expect([...first].sort()).toEqual(CODED_DIGITS);
    expect(createCodedDigits(first, () => 0)).not.toEqual(first);
    expect(calculateSymbol(CODED_DIGITS, { left: 1, operator: '−', right: 0 })).toBe(0);
    expect(calculateSymbol(CODED_DIGITS, { left: 5, operator: '÷', right: 2 })).toBe(1);
    expect(calculateSymbol(CODED_DIGITS, { left: 6, operator: '÷', right: 2 })).toBeNull();
    expect(calculateSymbol(CODED_DIGITS, { left: 7, operator: '+', right: 0 })).toBeNull();
    expect(calculateSymbol(CODED_DIGITS, { left: 0, operator: '−', right: 1 })).toBeNull();
    expect(calculationKey({ left: 1, operator: '×', right: 0 })).toBe('0×1');
    expect(calculationKey({ left: 1, operator: '÷', right: 0 })).toBe('1÷0');
  });

  it('can deduce every possible mapping within the calculation limit with distinct operands', () => {
    const digits = [...CODED_DIGITS];
    let cases = 0;
    let maxTests = 0;
    function visit(depth: number): void {
      if (depth === digits.length) {
        const { decoded, count } = decode(digits);
        if (decoded.some((digit, index) => digit !== digits[index])) {
          throw new Error(`Incorrect deduction for ${digits.join('')}`);
        }
        maxTests = Math.max(maxTests, count);
        cases++;
        return;
      }
      for (let index = depth; index < digits.length; index++) {
        [digits[depth], digits[index]] = [digits[index], digits[depth]];
        visit(depth + 1);
        [digits[depth], digits[index]] = [digits[index], digits[depth]];
      }
    }

    visit(0);
    expect(cases).toBe(40320);
    expect(maxTests).toBeLessThanOrEqual(CODED_CALCULATION_LIMIT);
  });
});
