import { range, shuffle } from '../new-games/random';
import {
  boardRound,
  CODE_POSITIONS,
  diagram,
  ExplainedExercise,
  individualRound,
  label,
  line,
  Mechanic,
  pick,
  Point,
  randomInt,
  shiftPoint,
} from './cadenas-mystere.model';
import { drawDigit, drawSegments, SEGMENT_MASKS, SEGMENT_NAMES } from './seven-segment';

function bracedGrid(rows: number, columns: number, down: number, up: number, solved: boolean) {
  const width = 128;
  const height = 114;
  const unit = 19;
  const left = (width - columns * unit) / 2;
  const base = 85;
  const top = base - rows * unit;
  const p = (x: number, y: number): Point => [left + x * unit, top + y * unit];
  const cells = range(rows * columns);
  const descending = new Set(shuffle(cells).slice(0, down));
  const ascending = new Set(shuffle(cells).slice(0, up));
  const digits = [rows, columns, down, up];
  const marks = [
    ...range(rows).map((y) => line(p(0, y), p(columns, y), 'muted', 1.4)),
    ...range(columns + 1).map((x) => line(p(x, 0), p(x, rows), 'muted', 1.4)),
    line([left - 8, base], [width - left + 8, base], 'muted', 1.4),
  ];

  const descriptions = range(rows).map((y) => {
    const row = range(columns).map((x) => {
      const cell = y * columns + x;
      const falls = descending.has(cell);
      const rises = ascending.has(cell);
      if (falls) marks.push(line(p(x, y), p(x + 1, y + 1), 'ink', 2.2));
      if (rises) marks.push(line(p(x, y + 1), p(x + 1, y), 'ink', 2.2));
      if (falls && rises) return 'croix';
      if (falls) return 'diagonale descendante';
      if (rises) return 'diagonale montante';
      return 'case vide';
    });
    return `Rangée ${y + 1} : ${row.join(', ')}.`;
  });

  const output = solved ? digits : CODE_POSITIONS;
  output.forEach((value, i) => marks.push(label([31 + 22 * i, 103], value, 16, 'focus')));
  const result = solved ? `Code ${digits.join(', ')}.` : 'Code A, B, C et D à trouver.';
  const clue = diagram(
    width,
    height,
    marks,
    `Grille de ${rows} par ${columns}. ${descriptions.join(' ')} ${result}`,
    solved ? 'Exemple résolu' : 'À résoudre',
  );
  return { clue, digits };
}

function bracedGrids() {
  const examples = [
    bracedGrid(1, 3, 0, 2, true),
    bracedGrid(3, 2, 5, 2, true),
    bracedGrid(2, 2, 3, 0, true),
  ];
  const {
    clue,
    digits: [rows, columns, down, up],
  } = examples[1];
  const [height, width] = pick([
    [2, 4],
    [3, 3],
    [3, 4],
    [4, 2],
    [4, 3],
    [4, 4],
  ]);
  const maxDiagonals = Math.min(9, height * width);
  const descending = randomInt(0, maxDiagonals);
  const target = bracedGrid(
    height,
    width,
    descending,
    randomInt(descending === 0 ? 1 : 0, maxDiagonals),
    false,
  );

  return boardRound(target.digits, [...examples.map((example) => example.clue), target.clue], {
    solutionHint:
      'Lis dans l’ordre le nombre de rangées, le nombre de colonnes, le nombre de diagonales qui descendent vers la droite, puis le nombre de diagonales qui montent vers la droite. Une croix compte une fois dans chaque sens.',
    workedExample: {
      clue,
      explanation: `La grille a ${rows} rangées et ${columns} colonnes. Elle contient ${down} diagonales descendantes et ${up} montantes. Une croix fournit une diagonale de chaque type. On lit donc ${rows}${columns}${down}${up}.`,
    },
  });
}

const SEGMENT_LETTERS: Record<string, number> = {
  A: 0b1110111,
  C: 0b0111001,
  E: 0b1111001,
  F: 0b1110001,
  H: 0b1110110,
  J: 0b0011110,
  L: 0b0111000,
  O: SEGMENT_MASKS[0],
  P: 0b1110011,
  S: SEGMENT_MASKS[5],
  U: 0b0111110,
};

const HORIZONTAL_SEGMENTS = 0b1001001;

function segmentNames(mask: number): string[] {
  return SEGMENT_NAMES.filter((_, i) => mask & (1 << i));
}

function segmentLetter(letter: string): ExplainedExercise {
  const mask = SEGMENT_LETTERS[letter];
  const horizontal = segmentNames(mask & HORIZONTAL_SEGMENTS).length;
  const vertical = segmentNames(mask & ~HORIZONTAL_SEGMENTS).length;
  const digit = horizontal * vertical;
  return {
    clue: diagram(
      60,
      64,
      drawSegments(mask, 18, 8),
      `Lettre ${letter}. Segments visibles : ${segmentNames(mask).join(', ')}.`,
    ),
    digit,
    explanation: `${letter} a ${horizontal} bâtonnets horizontaux et ${vertical} bâtonnets verticaux. En les multipliant, on obtient ${horizontal} × ${vertical} = ${digit}.`,
  };
}

function segmentLetters() {
  const sample = [pick(['A', 'O']), pick(['E', 'P', 'S']), pick(['J', 'L'])];
  const examples = sample.map(segmentLetter);
  const letters = Object.keys(SEGMENT_LETTERS).filter((letter) => !sample.includes(letter));
  return individualRound(shuffle(letters).slice(0, 4).map(segmentLetter), {
    examples,
    solutionHint:
      'Compte séparément les bâtonnets horizontaux et les bâtonnets verticaux de chaque lettre. Multiplie les deux nombres.',
    workedExample: examples[0],
  });
}

type Stroke = readonly [Point, Point];

const topLeft: Point = [0, 0];
const topCenter: Point = [12, 0];
const topRight: Point = [24, 0];
const midLeft: Point = [0, 24];
const midCenter: Point = [12, 24];
const midRight: Point = [24, 24];
const bottomLeft: Point = [0, 48];
const bottomCenter: Point = [12, 48];
const bottomRight: Point = [24, 48];

const STROKE_LETTERS: Record<string, readonly Stroke[]> = {
  A: [
    [bottomLeft, topCenter],
    [topCenter, bottomRight],
    [
      [6, 24],
      [18, 24],
    ],
  ],
  E: [
    [topLeft, bottomLeft],
    [topLeft, topRight],
    [midLeft, midRight],
    [bottomLeft, bottomRight],
  ],
  F: [
    [topLeft, bottomLeft],
    [topLeft, topRight],
    [midLeft, midRight],
  ],
  H: [
    [topLeft, bottomLeft],
    [topRight, bottomRight],
    [midLeft, midRight],
  ],
  I: [[topCenter, bottomCenter]],
  K: [
    [topLeft, bottomLeft],
    [midLeft, topRight],
    [midLeft, bottomRight],
  ],
  L: [
    [topLeft, bottomLeft],
    [bottomLeft, bottomRight],
  ],
  M: [
    [topLeft, bottomLeft],
    [topLeft, midCenter],
    [midCenter, topRight],
    [topRight, bottomRight],
  ],
  N: [
    [topLeft, bottomLeft],
    [topLeft, bottomRight],
    [topRight, bottomRight],
  ],
  T: [
    [topLeft, topRight],
    [topCenter, bottomCenter],
  ],
  V: [
    [topLeft, bottomCenter],
    [topRight, bottomCenter],
  ],
  W: [
    [topLeft, [6, 48]],
    [
      [6, 48],
      [12, 17],
    ],
    [
      [12, 17],
      [18, 48],
    ],
    [[18, 48], topRight],
  ],
  X: [
    [topLeft, bottomRight],
    [topRight, bottomLeft],
  ],
  Y: [
    [topLeft, midCenter],
    [topRight, midCenter],
    [midCenter, bottomCenter],
  ],
  Z: [
    [topLeft, topRight],
    [topRight, bottomLeft],
    [bottomLeft, bottomRight],
  ],
};

function strokeLetter(letter: string) {
  const strokes = STROKE_LETTERS[letter];
  const offset: Point = [18, 8];
  const marks = strokes.map(([from, to]) =>
    line(shiftPoint(from, offset), shiftPoint(to, offset), 'ink', 3),
  );
  const coordinates = strokes.map(([from, to]) => `de (${from.join(', ')}) à (${to.join(', ')})`);
  return {
    clue: diagram(
      60,
      64,
      marks,
      `Lettre ${letter}, origine en haut à gauche. ${coordinates.join('. ')}.`,
    ),
    digit: strokes.length,
  };
}

function strokeLetters() {
  const sample = ['X', pick(['E', 'M', 'W']), pick(['I', 'H', 'N'])];
  const examples = sample.map(strokeLetter);
  const letters = Object.keys(STROKE_LETTERS).filter((letter) => !sample.includes(letter));
  return individualRound(shuffle(letters).slice(0, 4).map(strokeLetter), {
    examples,
    solutionHint:
      'Compte les traits droits continus, y compris les obliques. Un trait qui traverse un croisement ou reçoit une jonction compte toujours pour un seul trait.',
    workedExample: {
      clue: examples[0].clue,
      explanation:
        'Le X contient un trait du haut gauche au bas droit et un autre du haut droit au bas gauche. Chacun se poursuit à travers le croisement. Cela donne deux traits droits.',
    },
  });
}

function segmentReference() {
  const marks = SEGMENT_MASKS.flatMap((_, digit) => {
    const x = 12 + (digit % 5) * 42;
    const y = 9 + Math.floor(digit / 5) * 70;
    return [...drawDigit(digit, x, y), label([x + 12, y + 58], digit, 13, 'muted')];
  });
  const descriptions = SEGMENT_MASKS.map(
    (mask, digit) => `${digit} : ${segmentNames(mask).join(', ')}`,
  );
  return diagram(
    216,
    146,
    marks,
    `Chiffres de référence. ${descriptions.join('. ')}.`,
    'Chiffres de référence',
  );
}

function partialDisplay(mask: number): ExplainedExercise {
  const compatible = range(10).filter((digit) => (SEGMENT_MASKS[digit] & mask) === mask);
  const guides = drawSegments(SEGMENT_MASKS[8] & ~mask, 18, 8, 'muted').map((mark) => ({
    ...mark,
    width: 0.9,
  }));
  const strokes = drawSegments(mask, 18, 8);
  const position = segmentNames(mask).join(', ');
  const digit = compatible.length;
  return {
    clue: diagram(60, 64, [...guides, ...strokes], `Segments mis en évidence : ${position}.`),
    digit,
    explanation: `Les chiffres ${new Intl.ListFormat('fr').format(compatible.map(String))} contiennent tous les segments épais (${position}). On compte donc ${digit} chiffres compatibles.`,
  };
}

function compatibleDisplays() {
  const sample = [0b0010010, 0b0000100, 0b1100001];
  const examples = sample.map(partialDisplay);
  const masks = range(SEGMENT_MASKS[8])
    .map((i) => i + 1)
    .filter((mask) => !sample.includes(mask) && segmentNames(mask).length <= 4);
  return individualRound(shuffle(masks).slice(0, 4).map(partialDisplay), {
    shared: [segmentReference()],
    examples,
    solutionHint:
      'Pour chaque figure, compte les chiffres de référence qui possèdent tous ses segments épais. Un chiffre est compatible même s’il utilise d’autres segments en plus.',
    workedExample: examples[0],
  });
}

export const STROKE_MECHANICS: readonly Mechanic[] = [
  { title: 'Les grilles à diagonales', generate: bracedGrids },
  { title: 'Les lettres en bâtonnets', generate: segmentLetters },
  { title: 'Les lettres en traits droits', generate: strokeLetters },
  { title: 'Les chiffres compatibles', generate: compatibleDisplays },
];
