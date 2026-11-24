import { type CodeClue } from '../code-deduction/code-deduction.logic';

export const CODE_POSITIONS = ['A', 'B', 'C', 'D'] as const;

export type Point = readonly [x: number, y: number];
export type Tone = 'ink' | 'muted' | 'accent' | 'focus' | 'paper';
export type DrawingMark =
  | { kind: 'line'; from: Point; to: Point; tone: Tone; width: number; dashed: boolean }
  | { kind: 'dot'; at: Point; radius: number; fill: Tone; stroke?: Tone }
  | { kind: 'box'; at: Point; width: number; height: number; fill?: Tone; stroke?: Tone }
  | { kind: 'label'; at: Point; text: string; size: number; tone: Tone };

export type Cell = {
  text: string;
  role?: 'heading' | 'column-clue' | 'target' | 'filled' | 'blocked' | 'spacer';
  markable?: boolean;
  choices?: string;
};

export type DiagramEdge = {
  from: Point;
  to: Point;
  description: string;
  double?: boolean;
};

export type Clue =
  | { kind: 'text'; lines: readonly string[]; reading: boolean; title?: string }
  | { kind: 'grid'; rows: readonly (readonly Cell[])[]; columns: number; title?: string }
  | { kind: 'code-deduction'; clues: readonly CodeClue[]; title?: string }
  | {
      kind: 'diagram';
      width: number;
      height: number;
      marks: readonly DrawingMark[];
      description: string;
      title?: string;
      edges?: readonly DiagramEdge[];
    };

export type Exercise = { clue: Clue; digit: number };
export type ExplainedExercise = Exercise & { explanation: string };

type WorkedExample = { clue?: Clue; explanation: string };

type RoundGuidance = {
  instruction?: string;
  solutionHint: string;
  workedExample: WorkedExample;
};

export type PuzzleContent = RoundGuidance & {
  shared?: readonly Clue[];
  examples?: readonly Exercise[];
  challenges?: readonly Clue[];
  answer: string;
};

export type Mechanic = { title: string; generate: () => PuzzleContent };
export type MysteryRound = PuzzleContent & { title: string };

export const line = (
  from: Point,
  to: Point,
  tone: Tone = 'ink',
  width = 2,
  dashed = false,
): DrawingMark => ({ kind: 'line', from, to, tone, width, dashed });

export function arrow(from: Point, to: Point, tone: Tone = 'ink'): DrawingMark[] {
  const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const ux = (to[0] - from[0]) / distance;
  const uy = (to[1] - from[1]) / distance;
  return [
    line(from, to, tone),
    line([to[0] - 5 * ux - 3 * uy, to[1] - 5 * uy + 3 * ux], to, tone),
    line([to[0] - 5 * ux + 3 * uy, to[1] - 5 * uy - 3 * ux], to, tone),
  ];
}

export function latticeEdges(
  size: number,
  offset: number,
  unit: number,
  includeBorder: boolean,
): DiagramEdge[] {
  const edges: DiagramEdge[] = [];
  const p = (x: number, y: number): Point => [offset + x * unit, offset + y * unit];
  for (let y = 0; y <= size; y++) {
    for (let x = 0; x <= size; x++) {
      if (x < size && (includeBorder || (y > 0 && y < size))) {
        edges.push({
          from: p(x, y),
          to: p(x + 1, y),
          description: `Trait horizontal, rangée ${y + 1}, colonne ${x + 1}`,
        });
      }
      if (y < size && (includeBorder || (x > 0 && x < size))) {
        edges.push({
          from: p(x, y),
          to: p(x, y + 1),
          description: `Trait vertical, rangée ${y + 1}, colonne ${x + 1}`,
        });
      }
    }
  }
  return edges;
}

export const dot = (at: Point, radius = 3, fill: Tone = 'ink', stroke?: Tone): DrawingMark => ({
  kind: 'dot',
  at,
  radius,
  fill,
  stroke,
});

export const box = (
  at: Point,
  width: number,
  height: number,
  fill?: Tone,
  stroke?: Tone,
): DrawingMark => ({ kind: 'box', at, width, height, fill, stroke });

export const label = (
  at: Point,
  text: string | number,
  size = 14,
  tone: Tone = 'ink',
): DrawingMark => ({ kind: 'label', at, text: String(text), size, tone });

export const diagram = (
  width: number,
  height: number,
  marks: readonly DrawingMark[],
  description: string,
  title?: string,
): Extract<Clue, { kind: 'diagram' }> => ({
  kind: 'diagram',
  width,
  height,
  marks,
  description,
  title,
});

export const textClue = (
  lines: string | readonly string[],
  reading = false,
  title?: string,
): Clue => ({ kind: 'text', lines: typeof lines === 'string' ? [lines] : lines, reading, title });

export const cell = (text: string | number, role?: Cell['role'], markable = false): Cell => ({
  text: String(text),
  role,
  markable,
});

export function grid(rows: readonly (readonly (string | number | Cell)[])[], title?: string): Clue {
  return {
    kind: 'grid',
    rows: rows.map((row) => row.map((value) => (typeof value === 'object' ? value : cell(value)))),
    columns: Math.max(...rows.map((row) => row.length)),
    title,
  };
}

export function choiceCell(text: string, choices: string, role?: Cell['role']): Cell {
  return { text, role, choices };
}

export function clueMinWidth(clue: Clue): number {
  switch (clue.kind) {
    case 'grid':
      return clue.columns * 27 + (clue.columns - 1) * 2;
    case 'text':
      return clue.reading ? 195 : 88;
    case 'code-deduction':
      return 250;
    case 'diagram': {
      const labelSizes = clue.marks
        .filter((mark) => mark.kind === 'label')
        .map((mark) => mark.size);
      const scale = Math.min(1, Math.max(0.72, 13 / Math.min(...labelSizes)));
      return Math.ceil(clue.width * scale);
    }
  }
}

export function individualRound(
  tasks: readonly Exercise[],
  details: Omit<PuzzleContent, 'answer' | 'challenges'>,
): PuzzleContent {
  return {
    ...details,
    challenges: tasks.map(({ clue }) => clue),
    answer: tasks.map(({ digit }) => digit).join(''),
  };
}

export function boardRound(
  digits: readonly number[],
  shared: readonly Clue[],
  guidance: RoundGuidance,
): PuzzleContent {
  return { ...guidance, shared, answer: digits.join('') };
}

export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function pick<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length - 1)];
}

export function samePoint(first: Point, second: Point): boolean {
  return first[0] === second[0] && first[1] === second[1];
}

export function pointKey([x, y]: Point): string {
  return `${x},${y}`;
}

export function shiftPoint([x, y]: Point, [dx, dy]: Point): Point {
  return [x + dx, y + dy];
}

export const CARDINAL: readonly Point[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

const WITH_DIAGONALS: readonly Point[] = [...CARDINAL, [1, 1], [-1, 1], [1, -1], [-1, -1]];

export function gridNeighbors(index: number, size: number, diagonals = false): number[] {
  const x = index % size;
  const y = Math.floor(index / size);
  return (diagonals ? WITH_DIAGONALS : CARDINAL)
    .map(([dx, dy]) => [x + dx, y + dy])
    .filter(([xx, yy]) => xx >= 0 && xx < size && yy >= 0 && yy < size)
    .map(([xx, yy]) => yy * size + xx);
}

export function orientPoint([x, y]: Point, size: number, orientation: number): Point {
  const last = size - 1;
  const column = orientation >= 4 ? last - x : x;
  switch (orientation % 4) {
    case 0:
      return [column, y];
    case 1:
      return [last - y, column];
    case 2:
      return [last - column, last - y];
    default:
      return [y, last - column];
  }
}
