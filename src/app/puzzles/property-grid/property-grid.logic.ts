import { range, shuffle } from '../new-games/random';
import { isPrime } from '../shared/is-prime';

export const PROPERTY_GRID_SIZE = 3;
export const PROPERTY_GRID_CELLS = range(PROPERTY_GRID_SIZE ** 2);

export interface NumberProperty {
  readonly id: string;
  readonly label: string;
  readonly accepts: (number: number) => boolean;
}

export interface PropertyGridPuzzle {
  readonly rows: readonly NumberProperty[];
  readonly columns: readonly NumberProperty[];
  readonly numbers: readonly number[];
}

const NUMBER_POOL = range(60).map((number) => number + 1);
const PROPERTIES: readonly NumberProperty[] = [
  { id: 'odd', label: 'Impair', accepts: (number) => number % 2 === 1 },
  { id: 'even', label: 'Pair', accepts: (number) => number % 2 === 0 },
  { id: 'prime', label: 'Nombre premier', accepts: isPrime },
  {
    id: 'square',
    label: 'Carré parfait',
    accepts: (number) => Number.isInteger(Math.sqrt(number)),
  },
  ...[3, 4, 5, 6, 7, 8, 9].map((divisor) => ({
    id: `multiple-${divisor}`,
    label: `Multiple de ${divisor}`,
    accepts: (number: number) => number % divisor === 0,
  })),
  ...[24, 36, 48, 60, 72, 90, 120, 168].map((multiple) => ({
    id: `divisor-${multiple}`,
    label: `Diviseur de ${multiple}`,
    accepts: (number: number) => multiple % number === 0,
  })),
  ...[15, 25, 35, 45].map((upper) => ({
    id: `below-${upper}`,
    label: `Moins de ${upper}`,
    accepts: (number: number) => number < upper,
  })),
  ...[10, 20, 30, 40].map((lower) => ({
    id: `above-${lower}`,
    label: `Plus de ${lower}`,
    accepts: (number: number) => number > lower,
  })),
  ...[
    [8, 30],
    [12, 38],
    [18, 50],
    [25, 54],
  ].map(([lower, upper]) => ({
    id: `between-${lower}-${upper}`,
    label: `De ${lower} à ${upper}`,
    accepts: (number: number) => number >= lower && number <= upper,
  })),
];

const FALLBACKS: readonly PropertyGridPuzzle[] = [
  preset(
    ['divisor-36', 'multiple-7', 'divisor-90'],
    ['above-20', 'even', 'multiple-6'],
    [2, 6, 10, 12, 14, 21, 30, 36, 42],
  ),
  preset(
    ['multiple-9', 'above-30', 'between-18-50'],
    ['above-10', 'divisor-72', 'square'],
    [9, 18, 24, 25, 36, 40, 49, 54, 60],
  ),
  preset(
    ['multiple-8', 'below-25', 'multiple-4'],
    ['multiple-5', 'divisor-120', 'multiple-3'],
    [1, 4, 6, 12, 20, 24, 40, 48, 60],
  ),
  preset(
    ['between-8-30', 'divisor-60', 'between-12-38'],
    ['divisor-48', 'prime', 'between-25-54'],
    [2, 8, 11, 12, 17, 24, 25, 30, 31],
  ),
];

export function propertyGridRules(
  puzzle: Pick<PropertyGridPuzzle, 'rows' | 'columns'>,
  index: number,
): readonly [NumberProperty, NumberProperty] {
  return [
    puzzle.rows[Math.floor(index / PROPERTY_GRID_SIZE)],
    puzzle.columns[index % PROPERTY_GRID_SIZE],
  ];
}

export function createPropertyGrid(
  previous?: PropertyGridPuzzle,
  random = Math.random,
): PropertyGridPuzzle {
  const previousRules = previous ? [...previous.rows, ...previous.columns] : [];
  const previousIds = new Set(previousRules.map(({ id }) => id));
  const hasFreshRule = (line: readonly NumberProperty[]) =>
    line.some(({ id }) => !previousIds.has(id));
  const hasFreshNumbers = (numbers: readonly number[]) =>
    !previous || numbers.filter((number) => !previous.numbers.includes(number)).length >= 3;

  for (let attempt = 0; attempt < 160; attempt++) {
    const rules = shuffle(PROPERTIES, random).slice(0, 2 * PROPERTY_GRID_SIZE);
    const rows = rules.slice(0, PROPERTY_GRID_SIZE);
    const columns = rules.slice(PROPERTY_GRID_SIZE);
    if (!hasFreshRule(rows) || !hasFreshRule(columns)) continue;

    const intersections = cellCandidates({ rows, columns, numbers: NUMBER_POOL });
    if (intersections.some((choices) => choices.length === 0)) continue;

    const numbers: number[] = [];
    for (const index of narrowestFirst(intersections)) {
      const options = intersections[index].filter((number) => !numbers.includes(number));
      if (!options.length) break;
      numbers.push(options[Math.floor(random() * options.length)]);
    }
    if (numbers.length !== PROPERTY_GRID_CELLS.length || !hasFreshNumbers(numbers)) continue;

    const puzzle = { rows, columns, numbers: numbers.sort((a, b) => a - b) };
    const choices = cellCandidates(puzzle);
    const totalChoices = choices.reduce((total, cell) => total + cell.length, 0);
    if (totalChoices >= 12 && findAssignments(choices, 2).length === 1) return puzzle;
  }

  // At most two presets can lose a full axis of fresh rules, since the presets share no rules.
  // Any two presets share at most four numbers, so at most one can fail the number check.
  const choices = FALLBACKS.filter(
    ({ rows, columns, numbers }) =>
      hasFreshRule(rows) && hasFreshRule(columns) && hasFreshNumbers(numbers),
  );
  return choices[Math.floor(random() * choices.length)];
}

export function findPropertyGridSolution(
  puzzle: PropertyGridPuzzle,
  placed: readonly (number | null)[],
): number[] | null {
  const choices = cellCandidates(puzzle).map((options, index) => {
    const value = placed[index];
    return value === null ? options : options.filter((number) => number === value);
  });
  return findAssignments(choices, 1)[0] ?? null;
}

function cellCandidates(puzzle: PropertyGridPuzzle): number[][] {
  return PROPERTY_GRID_CELLS.map((index) => {
    const [row, column] = propertyGridRules(puzzle, index);
    return puzzle.numbers.filter((number) => row.accepts(number) && column.accepts(number));
  });
}

function narrowestFirst(choices: readonly (readonly number[])[]): number[] {
  return [...PROPERTY_GRID_CELLS].sort((a, b) => choices[a].length - choices[b].length);
}

function findAssignments(choices: readonly (readonly number[])[], limit: number): number[][] {
  const solutions: number[][] = [];
  const order = narrowestFirst(choices);
  const assignment = Array<number>(order.length);
  const used = new Set<number>();

  function visit(depth: number): void {
    if (depth === order.length) {
      solutions.push([...assignment]);
      return;
    }

    const index = order[depth];
    for (const number of choices[index]) {
      if (used.has(number)) continue;
      assignment[index] = number;
      used.add(number);
      visit(depth + 1);
      used.delete(number);
      if (solutions.length === limit) return;
    }
  }

  visit(0);
  return solutions;
}

function preset(
  rows: readonly string[],
  columns: readonly string[],
  numbers: readonly number[],
): PropertyGridPuzzle {
  const resolve = (id: string) => PROPERTIES.find((rule) => rule.id === id)!;
  return { rows: rows.map(resolve), columns: columns.map(resolve), numbers };
}
