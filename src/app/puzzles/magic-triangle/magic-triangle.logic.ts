export const TRIANGLE_SLOTS = [
  { label: 'Sommet', x: 50, y: 15 },
  { label: 'Milieu du côté gauche', x: 31.5, y: 47.5 },
  { label: 'Milieu du côté droit', x: 68.5, y: 47.5 },
  { label: 'Coin en bas à gauche', x: 13, y: 80 },
  { label: 'Milieu de la base', x: 50, y: 80 },
  { label: 'Coin en bas à droite', x: 87, y: 80 },
] as const;

export const TRIANGLE_SIDES = [
  { label: 'Côté gauche', slots: [0, 1, 3] },
  { label: 'Côté droit', slots: [0, 2, 5] },
  { label: 'Base', slots: [3, 4, 5] },
] as const;

export type MagicTrianglePuzzle = {
  digits: readonly number[];
  sums: ReadonlySet<number>;
  solutions: readonly (readonly number[])[];
};

function buildPuzzles(): MagicTrianglePuzzle[] {
  const puzzles = new Map<string, { digits: number[]; sums: Set<number>; solutions: number[][] }>();

  // For equal side sums, every midpoint differs from its opposite corner by the same amount.
  for (let gap = 1; gap < 9; gap++) {
    for (let a = 1; a + gap <= 9; a++) {
      for (let b = a + 1; b + gap <= 9; b++) {
        for (let c = b + 1; c + gap <= 9; c++) {
          const digits = [a, b, c, a + gap, b + gap, c + gap].sort(
            (first, second) => first - second,
          );
          if (new Set(digits).size !== 6 || c + gap === 6) continue;

          const key = digits.join('');
          const puzzle = puzzles.get(key) ?? {
            digits,
            sums: new Set<number>(),
            solutions: [] as number[][],
          };
          puzzles.set(key, puzzle);

          const orders = [
            [a, b, c],
            [a, c, b],
            [b, a, c],
            [b, c, a],
            [c, a, b],
            [c, b, a],
          ];
          for (const order of orders) {
            for (const difference of [gap, -gap]) {
              const shift = difference < 0 ? gap : 0;
              const [top, left, right] = order.map((digit) => digit + shift);
              puzzle.sums.add(top + left + right + difference);
              puzzle.solutions.push([
                top,
                right + difference,
                left + difference,
                left,
                top + difference,
                right,
              ]);
            }
          }
        }
      }
    }
  }

  return [...puzzles.values()];
}

const PUZZLES = buildPuzzles();

export function createMagicTriangle(
  previous?: MagicTrianglePuzzle,
  random: () => number = Math.random,
): MagicTrianglePuzzle {
  const choices = previous
    ? PUZZLES.filter(({ sums }) => [...sums].every((sum) => !previous.sums.has(sum)))
    : PUZZLES;
  return choices[Math.floor(random() * choices.length)];
}

export function triangleSums(placements: readonly (number | null)[]): (number | null)[] {
  return TRIANGLE_SIDES.map(({ slots: [first, second, third] }) => {
    const a = placements[first];
    const b = placements[second];
    const c = placements[third];
    return a == null || b == null || c == null ? null : a + b + c;
  });
}
