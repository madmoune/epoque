import { range, shuffle } from './random';

export interface SumpletePuzzle {
  size: number;
  numbers: number[];
  solution: boolean[];
  rowTargets: number[];
  columnTargets: number[];
  givens: Record<number, boolean>;
}

export function sumpleteTotals(
  puzzle: SumpletePuzzle,
  kept: boolean[],
): { rows: number[]; columns: number[] } {
  const rows = range(puzzle.size).map(() => 0);
  const columns = [...rows];
  puzzle.numbers.forEach((number, cell) => {
    if (!kept[cell]) return;
    rows[Math.floor(cell / puzzle.size)] += number;
    columns[cell % puzzle.size] += number;
  });
  return { rows, columns };
}

export function isSumpleteSolved(puzzle: SumpletePuzzle, kept: boolean[]): boolean {
  if (
    kept.length !== puzzle.numbers.length ||
    !Object.entries(puzzle.givens).every(([cell, value]) => kept[Number(cell)] === value)
  )
    return false;
  const totals = sumpleteTotals(puzzle, kept);
  return (
    totals.rows.every((total, i) => total === puzzle.rowTargets[i]) &&
    totals.columns.every((total, i) => total === puzzle.columnTargets[i])
  );
}

export function solveSumplete(puzzle: SumpletePuzzle, limit = 2): boolean[][] {
  const { size } = puzzle;
  const rowOptions = range(size).map((row) =>
    range(2 ** size)
      .map((mask) => range(size).map((column) => (mask & (1 << column)) !== 0))
      .filter(
        (kept) =>
          kept.reduce(
            (sum, keep, col) => sum + (keep ? puzzle.numbers[row * size + col] : 0),
            0,
          ) === puzzle.rowTargets[row] &&
          kept.every(
            (keep, col) =>
              puzzle.givens[row * size + col] === undefined ||
              puzzle.givens[row * size + col] === keep,
          ),
      ),
  );
  const solutions: boolean[][] = [];
  const rows: boolean[][] = [];
  const totals = range(size).map(() => 0);
  const visit = (row: number): void => {
    if (solutions.length >= limit) return;
    if (row === size) {
      if (totals.every((total, col) => total === puzzle.columnTargets[col]))
        solutions.push(rows.flat());
      return;
    }
    for (const option of rowOptions[row]) {
      const additions = option.map((keep, col) => (keep ? puzzle.numbers[row * size + col] : 0));
      additions.forEach((value, col) => (totals[col] += value));
      rows.push(option);
      if (
        totals.every((total, col) => {
          let min = total;
          let max = total;
          for (let next = row + 1; next < size; next++) {
            if (!rowOptions[next].length) return false;
            const values = rowOptions[next].map((mask) =>
              mask[col] ? puzzle.numbers[next * size + col] : 0,
            );
            min += Math.min(...values);
            max += Math.max(...values);
          }
          return min <= puzzle.columnTargets[col] && max >= puzzle.columnTargets[col];
        })
      )
        visit(row + 1);
      rows.pop();
      additions.forEach((value, col) => (totals[col] -= value));
      if (solutions.length >= limit) return;
    }
  };
  visit(0);
  return solutions;
}

export function createSumplete(): SumpletePuzzle {
  const size = 5;
  const numbers = range(size * size).map(() => 1 + Math.floor(Math.random() * 9));
  // Two or three kept numbers per row avoids empty or already-complete rows.
  const solution = range(size).flatMap(() => {
    const kept = new Set(shuffle(range(size)).slice(0, 2 + Math.floor(Math.random() * 2)));
    return range(size).map((col) => kept.has(col));
  });
  const puzzle: SumpletePuzzle = {
    size,
    numbers,
    solution,
    rowTargets: [],
    columnTargets: [],
    givens: {},
  };
  const totals = sumpleteTotals(puzzle, solution);
  puzzle.rowTargets = totals.rows;
  puzzle.columnTargets = totals.columns;
  for (;;) {
    const candidates = solveSumplete(puzzle);
    if (candidates.length === 1) return puzzle;
    const different = shuffle(range(size * size)).find((cell) =>
      candidates.some((candidate) => candidate[cell] !== solution[cell]),
    );
    if (different === undefined) throw new Error('Sommes à barrer sans solution');
    puzzle.givens[different] = solution[different];
  }
}
