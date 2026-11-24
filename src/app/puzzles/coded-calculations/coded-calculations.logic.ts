import { range, shuffle } from '../new-games/random';
import { applyBinaryOperation, BinaryOperator } from '../shared/binary-operation';

export const CODED_CALCULATION_LIMIT = 13;
export const CODED_SYMBOLS = [
  { glyph: '⚽', label: 'Ballon de soccer' },
  { glyph: '🏀', label: 'Ballon de basket' },
  { glyph: '🎾', label: 'Balle de tennis' },
  { glyph: '🏈', label: 'Ballon de football américain' },
  { glyph: '🥏', label: 'Disque volant' },
  { glyph: '🏓', label: 'Raquette de ping-pong' },
  { glyph: '🏸', label: 'Raquette de badminton' },
  { glyph: '🏐', label: 'Ballon de volley' },
] as const;

export const CODED_DIGITS = range(CODED_SYMBOLS.length).map((index) => index + 1);

export interface CodedCalculation {
  readonly left: number;
  readonly operator: BinaryOperator;
  readonly right: number;
}

export interface CalculationTrial extends CodedCalculation {
  readonly result: number | null;
}

export function createCodedDigits(previous?: readonly number[], random = Math.random): number[] {
  const digits = shuffle(CODED_DIGITS, random);
  if (previous && digits.every((digit, index) => digit === previous[index])) {
    [digits[0], digits[1]] = [digits[1], digits[0]];
  }
  return digits;
}

export function calculationKey({ left, operator, right }: CodedCalculation): string {
  if ((operator === '+' || operator === '×') && left > right) {
    return `${right}${operator}${left}`;
  }
  return `${left}${operator}${right}`;
}

export function calculateSymbol(
  digits: readonly number[],
  { left, operator, right }: CodedCalculation,
): number | null {
  const value = applyBinaryOperation(digits[left], operator, digits[right]);
  const symbol = digits.indexOf(value);
  return symbol === -1 ? null : symbol;
}
