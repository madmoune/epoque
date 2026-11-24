import { line, Point, Tone } from './cadenas-mystere.model';

export const SEGMENT_MASKS = [
  0b0111111, 0b0000110, 0b1011011, 0b1001111, 0b1100110, 0b1101101, 0b1111101, 0b0000111, 0b1111111,
  0b1101111,
];

export const SEGMENT_NAMES = [
  'haut',
  'haut droit',
  'bas droit',
  'bas',
  'bas gauche',
  'haut gauche',
  'milieu',
];

const SEGMENTS: readonly (readonly [Point, Point])[] = [
  [
    [3, 0],
    [21, 0],
  ],
  [
    [24, 3],
    [24, 21],
  ],
  [
    [24, 27],
    [24, 45],
  ],
  [
    [3, 48],
    [21, 48],
  ],
  [
    [0, 27],
    [0, 45],
  ],
  [
    [0, 3],
    [0, 21],
  ],
  [
    [3, 24],
    [21, 24],
  ],
];

export function drawDigit(
  digit: number,
  x: number,
  y: number,
  tone: Tone = 'ink',
  flipped = false,
) {
  return drawSegments(SEGMENT_MASKS[digit], x, y, tone, flipped);
}

export function drawSegments(
  mask: number,
  x: number,
  y: number,
  tone: Tone = 'ink',
  flipped = false,
) {
  const place = ([dx, dy]: Point): Point => [
    x + (flipped ? 24 - dx : dx),
    y + (flipped ? 48 - dy : dy),
  ];
  return SEGMENTS.flatMap(([a, b], i) =>
    mask & (1 << i) ? [line(place(a), place(b), tone, 3.4)] : [],
  );
}

export function segmentDescription(digit: number): string {
  const rotatedIndices = [3, 4, 5, 0, 1, 2, 6];
  return SEGMENT_NAMES.filter((_, i) => SEGMENT_MASKS[digit] & (1 << rotatedIndices[i])).join(', ');
}
