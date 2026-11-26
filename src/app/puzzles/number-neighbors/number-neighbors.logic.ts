import { range, shuffle } from '../new-games/random';
import { greatestCommonDivisor } from '../shared/greatest-common-divisor';

export const NEIGHBOR_RULES = [
  {
    id: 'consecutive-digits',
    label: 'Chiffres consécutifs',
    instruction: 'Deux voisins ne peuvent pas avoir des nombres consécutifs.',
  },
  {
    id: 'common-factor',
    label: 'Diviseur commun',
    instruction: 'Deux voisins ne peuvent pas avoir de diviseur commun supérieur à 1.',
  },
  {
    id: 'multiple-of-five',
    label: 'Somme multiple de 5',
    instruction: 'La somme de deux voisins ne peut pas être un multiple de 5.',
  },
] as const;

export type NeighborRule = (typeof NEIGHBOR_RULES)[number]['id'];

export function randomNeighborRule(previous?: NeighborRule, random = Math.random): NeighborRule {
  const candidates = NEIGHBOR_RULES.filter(({ id }) => id !== previous);
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return candidates[index].id;
}

type Chair = { row: number; column: number };
type SeatingLayout = {
  rows: number;
  columns: number;
  chairs: readonly Chair[];
  neighbors: readonly (readonly number[])[];
};

export type NumberNeighborsPuzzle = {
  rule: NeighborRule;
  layout: SeatingLayout;
  numbers: readonly number[];
};

const LAYOUTS = [
  ['###.', '##.#', '.##.'],
  ['.##.', '####', '#..#'],
  ['#.#.', '####', '.#.#'],
].map(createLayout);

const NUMBERS = range(16).map((index) => index + 1);
const GENERATION_ATTEMPTS = 48;
const MIN_FORBIDDEN_PAIRS: Record<NeighborRule, number> = {
  'consecutive-digits': 3,
  'common-factor': 7,
  'multiple-of-five': 7,
};

type PuzzlePreset = readonly [layout: number, numbers: readonly number[]];

const FALLBACKS: Record<NeighborRule, readonly [PuzzlePreset, PuzzlePreset]> = {
  'consecutive-digits': [
    [0, [1, 3, 5, 7, 9, 11, 13, 15]],
    [2, [2, 4, 6, 8, 10, 12, 14, 16]],
  ],
  'common-factor': [
    [1, [5, 7, 8, 9, 11, 12, 14, 15]],
    [2, [2, 3, 7, 10, 11, 12, 13, 16]],
  ],
  'multiple-of-five': [
    [0, [2, 3, 5, 7, 11, 12, 13, 15]],
    [1, [2, 3, 4, 8, 9, 11, 12, 16]],
  ],
};

function createLayout(shape: readonly string[]): SeatingLayout {
  const chairs = shape.flatMap((line, row) =>
    [...line].flatMap((cell, column) => (cell === '#' ? [{ row, column }] : [])),
  );
  const neighbors = chairs.map(({ row, column }, index) =>
    range(chairs.length).filter(
      (other) =>
        other !== index &&
        Math.abs(row - chairs[other].row) <= 1 &&
        Math.abs(column - chairs[other].column) <= 1,
    ),
  );
  return { rows: shape.length, columns: shape[0].length, chairs, neighbors };
}

export function canSitTogether(rule: NeighborRule, first: number, second: number): boolean {
  switch (rule) {
    case 'consecutive-digits':
      return Math.abs(first - second) !== 1;
    case 'common-factor':
      return greatestCommonDivisor(first, second) === 1;
    case 'multiple-of-five':
      return (first + second) % 5 !== 0;
  }
}

export function describeConflict(rule: NeighborRule, first: number, second: number): string {
  switch (rule) {
    case 'consecutive-digits':
      return `${first} et ${second} sont consécutifs : leur écart vaut 1.`;
    case 'common-factor':
      return `${first} et ${second} ont ${greatestCommonDivisor(first, second)} comme diviseur commun.`;
    case 'multiple-of-five':
      return `La somme de ${first} et ${second} vaut ${first + second}, un multiple de 5.`;
  }
}

export function seatingConflicts(
  puzzle: NumberNeighborsPuzzle,
  placements: readonly (number | null)[],
): (readonly [number, number])[] {
  const conflicts: (readonly [number, number])[] = [];
  puzzle.layout.neighbors.forEach((neighbors, seat) => {
    const first = placements[seat];
    if (first == null) return;

    for (const other of neighbors) {
      const second = placements[other];
      if (other > seat && second != null && !canSitTogether(puzzle.rule, first, second)) {
        conflicts.push([seat, other]);
      }
    }
  });
  return conflicts;
}

export function findSeatingSolution(
  puzzle: NumberNeighborsPuzzle,
  placements: readonly (number | null)[] = puzzle.layout.chairs.map(() => null),
): number[] | null {
  const { chairs, neighbors } = puzzle.layout;
  const seats = [...placements];
  const used = seats.filter((value): value is number => value !== null);
  if (
    seats.length !== chairs.length ||
    new Set(used).size !== used.length ||
    used.some((number) => !puzzle.numbers.includes(number)) ||
    seatingConflicts(puzzle, seats).length > 0
  ) {
    return null;
  }

  const empty = range(seats.length)
    .filter((index) => seats[index] === null)
    .sort((a, b) => neighbors[b].length - neighbors[a].length);

  function placeNext(index: number, available: readonly number[]): boolean {
    if (index === empty.length) return true;
    const chair = empty[index];

    for (const number of available) {
      const blocked = neighbors[chair].some((other) => {
        const neighbor = seats[other];
        return neighbor !== null && !canSitTogether(puzzle.rule, number, neighbor);
      });
      if (blocked) continue;

      seats[chair] = number;
      if (
        placeNext(
          index + 1,
          available.filter((value) => value !== number),
        )
      )
        return true;
      seats[chair] = null;
    }
    return false;
  }

  const available = puzzle.numbers.filter((number) => !used.includes(number));
  return placeNext(0, available) ? seats.filter((value): value is number => value !== null) : null;
}

function hasEnoughConstraints(puzzle: NumberNeighborsPuzzle): boolean {
  const { rule, numbers } = puzzle;
  let pairs = 0;
  for (let first = 0; first < numbers.length; first++) {
    for (let second = 0; second < first; second++) {
      if (!canSitTogether(rule, numbers[first], numbers[second])) pairs++;
    }
  }
  return pairs >= MIN_FORBIDDEN_PAIRS[rule];
}

export function createNumberNeighborsPuzzle(
  previous?: NumberNeighborsPuzzle,
): NumberNeighborsPuzzle;
export function createNumberNeighborsPuzzle(
  rule: NeighborRule,
  previous?: NumberNeighborsPuzzle,
): NumberNeighborsPuzzle;
export function createNumberNeighborsPuzzle(
  ruleOrPrevious?: NeighborRule | NumberNeighborsPuzzle,
  previous?: NumberNeighborsPuzzle,
): NumberNeighborsPuzzle {
  const explicitRule = typeof ruleOrPrevious === 'string' ? ruleOrPrevious : undefined;
  const previousPuzzle = typeof ruleOrPrevious === 'string' ? previous : ruleOrPrevious;
  const rule = explicitRule ?? randomNeighborRule(previousPuzzle?.rule);
  const layouts = LAYOUTS.filter((layout) => layout !== previousPuzzle?.layout);
  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt++) {
    const layout = layouts[Math.floor(Math.random() * layouts.length)];
    const numbers = shuffle(NUMBERS)
      .slice(0, layout.chairs.length)
      .sort((a, b) => a - b);
    const puzzle = { rule, layout, numbers };
    if (hasEnoughConstraints(puzzle) && findSeatingSolution(puzzle)) {
      return puzzle;
    }
  }

  const presets = FALLBACKS[rule];
  const [layout, numbers] =
    presets.find(([index]) => LAYOUTS[index] !== previousPuzzle?.layout) ?? presets[0];
  return { rule, layout: LAYOUTS[layout], numbers };
}
