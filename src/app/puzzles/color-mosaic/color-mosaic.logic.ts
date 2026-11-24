import { range, shuffle } from '../new-games/random';

export const MOSAIC_SIZE = 5;
export const MOSAIC_INDEXES = range(MOSAIC_SIZE);
export const MOSAIC_CELLS = range(MOSAIC_SIZE ** 2);
const RATIO_COLORS = ['red', 'green', 'yellow'] as const;
export const MOSAIC_COLORS = [...RATIO_COLORS, 'blue'] as const;

export type MosaicColor = (typeof MOSAIC_COLORS)[number];
export type MosaicCell = MosaicColor | null;
type ColorTotals = Readonly<Record<MosaicColor, number>>;
type LineAxis = 'row' | 'column';

interface LineClue {
  readonly kind: 'line';
  readonly axis: LineAxis;
  readonly line: number;
  readonly color: MosaicColor;
  readonly count: number;
}

export type MosaicClue =
  | LineClue
  | { readonly kind: 'cell'; readonly cell: number; readonly color: MosaicColor };

export interface ColorMosaicPuzzle {
  readonly profile: number;
  readonly totals: ColorTotals;
  readonly clues: readonly MosaicClue[];
}

export type MosaicCheck =
  | { readonly kind: 'incomplete'; readonly blanks: number }
  | { readonly kind: 'symmetry'; readonly axis: 'horizontal' | 'vertical' }
  | { readonly kind: 'blue' | 'ratios' | 'solved' }
  | { readonly kind: 'position'; readonly clue: MosaicClue };

const TOTAL_PROFILES = [
  [4, 6, 14],
  [4, 8, 12],
  [4, 10, 10],
  [6, 6, 12],
  [8, 8, 8],
];
const AXES = ['row', 'column'] as const;
const LINE_CELLS = {
  row: MOSAIC_INDEXES.map((row) => MOSAIC_INDEXES.map((column) => row * MOSAIC_SIZE + column)),
  column: MOSAIC_INDEXES.map((column) => MOSAIC_INDEXES.map((row) => row * MOSAIC_SIZE + column)),
};

const MIRROR_X = MOSAIC_CELLS.map((cell) => {
  const column = cell % MOSAIC_SIZE;
  return cell - column + MOSAIC_SIZE - 1 - column;
});
const MIRROR_Y = MOSAIC_CELLS.map((cell) => {
  const row = Math.floor(cell / MOSAIC_SIZE);
  return (MOSAIC_SIZE - 1 - row) * MOSAIC_SIZE + (cell % MOSAIC_SIZE);
});

// Cells in a group have to agree under both reflections.
const HALF = Math.ceil(MOSAIC_SIZE / 2);
const GROUP_FOR_CELL = MOSAIC_CELLS.map((cell) => {
  const row = Math.floor(cell / MOSAIC_SIZE);
  const column = cell % MOSAIC_SIZE;
  return HALF * Math.min(row, MOSAIC_SIZE - 1 - row) + Math.min(column, MOSAIC_SIZE - 1 - column);
});
const GROUP_SIZES = range(HALF ** 2).map(
  (group) => GROUP_FOR_CELL.filter((id) => id === group).length,
);

function symmetricLayouts(totals: ColorTotals): MosaicColor[][] {
  const remaining = { ...totals };
  const groups: MosaicColor[] = [];
  const layouts: MosaicColor[][] = [];

  function fill(group: number): void {
    if (group === GROUP_SIZES.length) {
      layouts.push(GROUP_FOR_CELL.map((id) => groups[id]));
      return;
    }

    const size = GROUP_SIZES[group];
    for (const color of MOSAIC_COLORS) {
      if (remaining[color] < size) continue;
      remaining[color] -= size;
      groups[group] = color;
      fill(group + 1);
      remaining[color] += size;
    }
  }

  fill(0);
  return layouts;
}

function countLine(
  values: readonly MosaicCell[],
  axis: LineAxis,
  line: number,
  color: MosaicColor,
): number {
  return LINE_CELLS[axis][line].filter((cell) => values[cell] === color).length;
}

function matchesClue(values: readonly MosaicCell[], clue: MosaicClue): boolean {
  return clue.kind === 'cell'
    ? values[clue.cell] === clue.color
    : countLine(values, clue.axis, clue.line, clue.color) === clue.count;
}

function choosePositionClues(
  target: readonly MosaicColor[],
  layouts: readonly MosaicColor[][],
  random: () => number,
): MosaicClue[] {
  const lineClues = shuffle(
    AXES.flatMap((axis) =>
      MOSAIC_INDEXES.flatMap((line) =>
        RATIO_COLORS.map(
          (color): LineClue => ({
            kind: 'line',
            axis,
            line,
            color,
            count: countLine(target, axis, line, color),
          }),
        ),
      ),
    ),
    random,
  );
  const clues: MosaicClue[] = [];
  let remaining = layouts;

  while (remaining.length > 1) {
    let best: MosaicClue | undefined;
    let narrowed = remaining;
    for (const clue of lineClues) {
      const matching = remaining.filter((layout) => matchesClue(layout, clue));
      if (matching.length >= narrowed.length) continue;
      best = clue;
      narrowed = matching;
      if (narrowed.length === 1) break;
    }

    // Equal line totals can still leave two arrangements of the same colors.
    if (!best) {
      const cell = target.findIndex((color, index) =>
        remaining.some((layout) => layout[index] !== color),
      );
      best = { kind: 'cell', cell, color: target[cell] };
      narrowed = remaining.filter((layout) => layout[cell] === target[cell]);
    }

    clues.push(best);
    remaining = narrowed;
  }

  return clues;
}

export function createColorMosaic(
  previous?: ColorMosaicPuzzle,
  random = Math.random,
): ColorMosaicPuzzle {
  const profiles = range(TOTAL_PROFILES.length).filter((profile) => profile !== previous?.profile);
  const profile = profiles[Math.floor(random() * profiles.length)];
  const [red, green, yellow] = shuffle(TOTAL_PROFILES[profile], random);
  const totals = { red, green, yellow, blue: 1 };
  const layouts = symmetricLayouts(totals);
  const target = layouts[Math.floor(random() * layouts.length)];
  return { profile, totals, clues: choosePositionClues(target, layouts, random) };
}

export function mosaicColorTotals(values: readonly MosaicCell[]): ColorTotals {
  const totals = { red: 0, green: 0, yellow: 0, blue: 0 };
  for (const color of values) {
    if (color !== null) totals[color]++;
  }
  return totals;
}

export function checkColorMosaic(
  puzzle: ColorMosaicPuzzle,
  values: readonly MosaicCell[],
): MosaicCheck {
  const blanks = MOSAIC_CELLS.filter((cell) => !values[cell]).length;
  if (blanks) return { kind: 'incomplete', blanks };
  if (MOSAIC_CELLS.some((cell) => values[cell] !== values[MIRROR_Y[cell]])) {
    return { kind: 'symmetry', axis: 'horizontal' };
  }
  if (MOSAIC_CELLS.some((cell) => values[cell] !== values[MIRROR_X[cell]])) {
    return { kind: 'symmetry', axis: 'vertical' };
  }

  const totals = mosaicColorTotals(values);
  if (totals.blue !== puzzle.totals.blue) return { kind: 'blue' };
  if (RATIO_COLORS.some((color) => totals[color] !== puzzle.totals[color])) {
    return { kind: 'ratios' };
  }
  const clue = puzzle.clues.find((constraint) => !matchesClue(values, constraint));
  return clue ? { kind: 'position', clue } : { kind: 'solved' };
}
