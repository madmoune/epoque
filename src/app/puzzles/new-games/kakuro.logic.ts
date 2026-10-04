import { range, shuffle } from './random';

export interface KakuroRun {
  cells: number[];
  total: number;
  clue: number;
  direction: 'across' | 'down';
}

export interface KakuroPuzzle {
  width: number;
  height: number;
  whiteCells: number[];
  runs: KakuroRun[];
  solution: Record<number, number>;
  givens: Record<number, number>;
}

const PATTERN = ['######', '#..#..', '#.....', '##..##', '#.....', '#..#..'];

export function solveKakuro(puzzle: KakuroPuzzle, limit = 2): Record<number, number>[] {
  const values: Record<number, number> = { ...puzzle.givens };
  const solutions: Record<number, number>[] = [];
  const memberships = new Map(
    puzzle.whiteCells.map((cell) => [cell, puzzle.runs.filter((run) => run.cells.includes(cell))]),
  );
  const isRunPossible = (run: KakuroRun): boolean => {
    const assigned = run.cells
      .filter((cell) => values[cell] !== undefined)
      .map((cell) => values[cell]);
    if (assigned.some((v) => !Number.isInteger(v) || v < 1 || v > 9)) return false;
    if (new Set(assigned).size !== assigned.length) return false;
    const sum = assigned.reduce((total, value) => total + value, 0);
    const remaining = run.cells.length - assigned.length;
    if (!remaining) return sum === run.total;
    const available = range(9)
      .map((i) => i + 1)
      .filter((v) => !assigned.includes(v));
    const minimum = available.slice(0, remaining).reduce((a, b) => a + b, 0);
    const maximum = available.slice(-remaining).reduce((a, b) => a + b, 0);
    return sum + minimum <= run.total && sum + maximum >= run.total;
  };
  if (!puzzle.runs.every(isRunPossible)) return [];
  const visit = (): void => {
    if (solutions.length >= limit) return;
    let bestCell: number | undefined;
    let bestDigits: number[] = [];
    for (const cell of puzzle.whiteCells) {
      if (values[cell] !== undefined) continue;
      const digits = range(9)
        .map((i) => i + 1)
        .filter((digit) => {
          values[cell] = digit;
          const possible = memberships.get(cell)!.every(isRunPossible);
          delete values[cell];
          return possible;
        });
      if (!digits.length) return;
      if (bestCell === undefined || digits.length < bestDigits.length) {
        bestCell = cell;
        bestDigits = digits;
        if (digits.length === 1) break;
      }
    }
    if (bestCell === undefined) {
      solutions.push({ ...values });
      return;
    }
    for (const digit of bestDigits) {
      values[bestCell] = digit;
      visit();
      delete values[bestCell];
      if (solutions.length >= limit) return;
    }
  };
  visit();
  return solutions;
}

export function createKakuro(): KakuroPuzzle {
  const width = PATTERN[0].length;
  const height = PATTERN.length;
  const whiteCells = range(width * height).filter(
    (cell) => PATTERN[Math.floor(cell / width)][cell % width] === '.',
  );
  const white = new Set(whiteCells);
  const runs: KakuroRun[] = [];
  for (const cell of whiteCells) {
    for (const direction of ['across', 'down'] as const) {
      const step = direction === 'across' ? 1 : width;
      if (white.has(cell - step)) continue;
      const cells: number[] = [];
      for (let next = cell; white.has(next); next += step) cells.push(next);
      runs.push({ cells, clue: cell - step, direction, total: 0 });
    }
  }
  const digits = shuffle(range(9).map((i) => i + 1));
  // A shuffled Latin pattern never repeats within any horizontal or vertical run.
  const solution = Object.fromEntries(
    whiteCells.map((cell) => [cell, digits[(Math.floor(cell / width) * 2 + (cell % width)) % 9]]),
  );
  for (const run of runs) run.total = run.cells.reduce((total, cell) => total + solution[cell], 0);
  const puzzle: KakuroPuzzle = { width, height, whiteCells, runs, solution, givens: {} };
  // Prefer a clue that distinguishes two actual solutions, never an arbitrary giveaway.
  for (;;) {
    const candidates = solveKakuro(puzzle);
    if (candidates.length === 1) return puzzle;
    const different = shuffle(whiteCells).find((cell) =>
      candidates.some((candidate) => candidate[cell] !== solution[cell]),
    );
    if (different === undefined) throw new Error('Kakuro sans solution');
    puzzle.givens[different] = solution[different];
  }
}

export function isKakuroSolved(puzzle: KakuroPuzzle, values: Record<number, number>): boolean {
  return (
    puzzle.whiteCells.every(
      (cell) => Number.isInteger(values[cell]) && values[cell] >= 1 && values[cell] <= 9,
    ) &&
    Object.entries(puzzle.givens).every(([cell, value]) => values[Number(cell)] === value) &&
    puzzle.runs.every((run) => {
      const digits = run.cells.map((cell) => values[cell]);
      return (
        new Set(digits).size === digits.length && digits.reduce((a, b) => a + b, 0) === run.total
      );
    })
  );
}
