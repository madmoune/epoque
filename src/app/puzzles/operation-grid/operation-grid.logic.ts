import { range } from '../new-games/random';
import { applyBinaryOperation, BINARY_OPERATORS, BinaryOperator } from '../shared/binary-operation';

export const OPERATION_GRID_CELLS = range(9);
export const OPERATION_GRID_DIGITS = OPERATION_GRID_CELLS.map((index) => index + 1);

type Values = readonly (number | null)[];
type EquationStatus = 'incomplete' | 'correct' | 'incorrect';

interface GridRules {
  readonly columns: readonly [BinaryOperator, BinaryOperator, BinaryOperator];
  readonly bottom: BinaryOperator;
}

export interface OperationGridPuzzle extends GridRules {
  readonly givens: Values;
  readonly solution: readonly number[];
}

interface Column {
  readonly first: number;
  readonly second: number;
  readonly result: number;
  readonly digitMask: number;
}

function possibleColumns(operator: BinaryOperator): Column[] {
  const columns: Column[] = [];
  for (const first of OPERATION_GRID_DIGITS) {
    for (const second of OPERATION_GRID_DIGITS) {
      const result = applyBinaryOperation(first, operator, second);
      if (new Set([first, second, result]).size === 3 && OPERATION_GRID_DIGITS.includes(result)) {
        columns.push({
          first,
          second,
          result,
          digitMask: (1 << first) | (1 << second) | (1 << result),
        });
      }
    }
  }
  return columns;
}

function gridSolutions(
  [left, middle, right]: readonly [Column[], Column[], Column[]],
  bottom: BinaryOperator,
): number[][] {
  const solutions: number[][] = [];
  for (const a of left) {
    for (const b of middle) {
      if (a.digitMask & b.digitMask) continue;
      const result = applyBinaryOperation(a.result, bottom, b.result);
      for (const c of right) {
        if (c.result === result && !((a.digitMask | b.digitMask) & c.digitMask)) {
          solutions.push([
            a.first,
            b.first,
            c.first,
            a.second,
            b.second,
            c.second,
            a.result,
            b.result,
            c.result,
          ]);
        }
      }
    }
  }
  return solutions;
}

function buildPatterns() {
  const operations = BINARY_OPERATORS.map((operator) => ({
    operator,
    triples: possibleColumns(operator),
  }));
  const patterns: { rules: GridRules; solutions: number[][] }[] = [];
  for (const left of operations) {
    for (const middle of operations) {
      for (const right of operations) {
        const columns = [left.operator, middle.operator, right.operator] as const;
        for (const bottom of BINARY_OPERATORS) {
          if (new Set([...columns, bottom]).size < 3) continue;
          const solutions = gridSolutions([left.triples, middle.triples, right.triples], bottom);
          if (solutions.length) patterns.push({ rules: { columns, bottom }, solutions });
        }
      }
    }
  }
  return patterns;
}

const PATTERNS = buildPatterns();

export function createOperationGrid(
  previous?: GridRules,
  random = Math.random,
): OperationGridPuzzle {
  const candidates = PATTERNS.filter(
    ({ rules }) =>
      !previous ||
      rules.bottom !== previous.bottom ||
      rules.columns.some((op, i) => op !== previous.columns[i]),
  );
  const { rules, solutions } = candidates[Math.floor(random() * candidates.length)];
  const solution = solutions[Math.floor(random() * solutions.length)];
  const separates = (cells: readonly number[]) =>
    solutions.every(
      (other) => other === solution || cells.some((index) => other[index] !== solution[index]),
    );

  let clues = OPERATION_GRID_CELLS.map((index) => [index]).filter(separates);
  if (!clues.length) {
    clues = OPERATION_GRID_CELLS.flatMap((first) =>
      OPERATION_GRID_CELLS.slice(first + 1).map((second) => [first, second]),
    ).filter(separates);
  }

  const fixedCells = clues[Math.floor(random() * clues.length)];
  return {
    ...rules,
    solution,
    givens: OPERATION_GRID_CELLS.map((index) =>
      fixedCells.includes(index) ? solution[index] : null,
    ),
  };
}

export function operationGridStatus(rules: GridRules, values: Values): EquationStatus[] {
  const check = (first: number, operator: BinaryOperator, second: number, result: number) => {
    if (values[first] === null || values[second] === null || values[result] === null) {
      return 'incomplete';
    }
    return applyBinaryOperation(values[first], operator, values[second]) === values[result]
      ? 'correct'
      : 'incorrect';
  };
  return [
    ...rules.columns.map((operator, index) => check(index, operator, index + 3, index + 6)),
    check(6, rules.bottom, 7, 8),
  ];
}
