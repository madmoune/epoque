import { range, shuffle } from './random';

export interface SkyscrapersPuzzle {
  size: number;
  solution: number[];
  givens: Record<number, number>;
  top: number[];
  bottom: number[];
  left: number[];
  right: number[];
}

export function visibleTowers(heights: readonly number[]): number {
  let highest = 0;
  let visible = 0;
  for (const height of heights) {
    if (height > highest) {
      highest = height;
      visible++;
    }
  }
  return visible;
}

function permutations(values: number[]): number[][] {
  if (!values.length) return [[]];
  return values.flatMap((value) =>
    permutations(values.filter((other) => other !== value)).map((rest) => [value, ...rest]),
  );
}

export function solveSkyscrapers(puzzle: SkyscrapersPuzzle, limit = 2): number[][] {
  const { size } = puzzle;
  const allRows = permutations(range(size).map((i) => i + 1));
  const options = range(size).map((row) =>
    allRows.filter(
      (values) =>
        (!puzzle.left[row] || visibleTowers(values) === puzzle.left[row]) &&
        (!puzzle.right[row] || visibleTowers([...values].reverse()) === puzzle.right[row]) &&
        values.every(
          (value, column) =>
            puzzle.givens[row * size + column] === undefined ||
            puzzle.givens[row * size + column] === value,
        ),
    ),
  );
  const grid: number[][] = [];
  const solutions: number[][] = [];
  const visit = (row: number): void => {
    if (solutions.length >= limit) return;
    if (row === size) {
      if (
        range(size).every((column) => {
          const values = grid.map((line) => line[column]);
          return (
            (!puzzle.top[column] || visibleTowers(values) === puzzle.top[column]) &&
            (!puzzle.bottom[column] || visibleTowers(values.reverse()) === puzzle.bottom[column])
          );
        })
      )
        solutions.push(grid.flat());
      return;
    }
    for (const values of options[row]) {
      if (values.some((value, column) => grid.some((line) => line[column] === value))) continue;
      grid.push(values);
      if (
        range(size).every((column) => {
          const seen = visibleTowers(grid.map((line) => line[column]));
          return (
            !puzzle.top[column] ||
            (seen <= puzzle.top[column] && seen + size - row - 1 >= puzzle.top[column])
          );
        })
      )
        visit(row + 1);
      grid.pop();
      if (solutions.length >= limit) return;
    }
  };
  visit(0);
  return solutions;
}

export function createSkyscrapers(): SkyscrapersPuzzle {
  const size = 4;
  const symbols = shuffle([1, 2, 3, 4]);
  const rows = shuffle(range(size));
  const columns = shuffle(range(size));
  const solution = rows.flatMap((row) => columns.map((column) => symbols[(row + column) % size]));
  const lines = range(size).map((row) => solution.slice(row * size, (row + 1) * size));
  const cols = range(size).map((column) => lines.map((row) => row[column]));
  const puzzle: SkyscrapersPuzzle = {
    size,
    solution,
    givens: {},
    top: cols.map(visibleTowers),
    bottom: cols.map((col) => visibleTowers([...col].reverse())),
    left: lines.map(visibleTowers),
    right: lines.map((row) => visibleTowers([...row].reverse())),
  };
  for (const index of shuffle(range(size * size))) {
    if (solveSkyscrapers(puzzle).length === 1) break;
    puzzle.givens[index] = solution[index];
  }
  // Remove redundant edge clues while preserving uniqueness (not all clues are needed).
  const edges = shuffle(['top', 'bottom', 'left', 'right'] as const);
  let removed = 0;
  for (const edge of edges) {
    for (const index of shuffle(range(size))) {
      const clue = puzzle[edge][index];
      puzzle[edge][index] = 0;
      if (solveSkyscrapers(puzzle).length !== 1) puzzle[edge][index] = clue;
      else removed++;
      if (removed === 5) return puzzle;
    }
  }
  return puzzle;
}

export function isSkyscrapersSolved(puzzle: SkyscrapersPuzzle, values: number[]): boolean {
  const { size } = puzzle;
  if (
    values.length !== size * size ||
    values.some((v) => !Number.isInteger(v) || v < 1 || v > size)
  )
    return false;
  if (!Object.entries(puzzle.givens).every(([index, value]) => values[Number(index)] === value))
    return false;
  const rows = range(size).map((row) => values.slice(row * size, (row + 1) * size));
  const cols = range(size).map((column) => rows.map((row) => row[column]));
  return (
    [...rows, ...cols].every((line) => new Set(line).size === size) &&
    rows.every(
      (row, i) =>
        (!puzzle.left[i] || visibleTowers(row) === puzzle.left[i]) &&
        (!puzzle.right[i] || visibleTowers([...row].reverse()) === puzzle.right[i]),
    ) &&
    cols.every(
      (col, i) =>
        (!puzzle.top[i] || visibleTowers(col) === puzzle.top[i]) &&
        (!puzzle.bottom[i] || visibleTowers([...col].reverse()) === puzzle.bottom[i]),
    )
  );
}
