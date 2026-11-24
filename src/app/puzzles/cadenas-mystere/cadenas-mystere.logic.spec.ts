import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCodeDeductionPuzzle } from '../code-deduction/code-deduction.logic';
import { createMysteryRound, MYSTERY_MECHANICS } from './cadenas-mystere.logic';
import { Clue } from './cadenas-mystere.model';
import { drawDigit, SEGMENT_MASKS } from './seven-segment';

function seedDraws(seed: number): void {
  vi.spyOn(Math, 'random').mockImplementation(() => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  });
}

function drawingMarks(clue: Clue) {
  expect(clue.kind).toBe('diagram');
  return (clue as Extract<Clue, { kind: 'diagram' }>).marks;
}

describe('Cadenas mystère generators', () => {
  afterEach(() => vi.restoreAllMocks());

  it('generates progressive hints, four-digit codes and varied clues for all 71 mechanics', () => {
    seedDraws(813415);
    expect(MYSTERY_MECHANICS).toHaveLength(71);
    expect(new Set(MYSTERY_MECHANICS.map(({ title }) => title)).size).toBe(71);

    for (const { title, generate } of MYSTERY_MECHANICS) {
      const boards = new Set<string>();
      for (let i = 0; i < 14; i++) {
        const puzzle = generate();
        expect(puzzle.answer, title).toMatch(/^\d{4}$/);
        expect(puzzle.solutionHint, title).toMatch(/\S/);
        expect(puzzle.solutionHint, title).not.toBe(puzzle.instruction);
        expect(puzzle.workedExample.explanation, title).toMatch(/\S/);
        expect(puzzle.workedExample.explanation, title).not.toBe(puzzle.solutionHint);
        if (puzzle.examples?.length) {
          expect(
            puzzle.examples.map(({ clue }) => clue),
            title,
          ).toContain(puzzle.workedExample.clue);
        }
        expect(puzzle.challenges ?? [], title).not.toContainEqual(puzzle.workedExample.clue);
        expect(puzzle.shared?.length || puzzle.challenges?.length, title).toBeTruthy();
        if (puzzle.challenges) expect(puzzle.challenges, title).toHaveLength(4);
        expect(
          puzzle.examples?.every(({ digit, clue }) => clue && digit >= 0 && digit <= 9) ?? true,
        ).toBe(true);
        boards.add(JSON.stringify([puzzle.challenges, puzzle.shared]));
      }
      expect(boards.size, title).toBeGreaterThan(1);
    }
  });

  it('explains and demonstrates the machine operation selected for the current puzzle', () => {
    seedDraws(3579);
    const { generate } = MYSTERY_MECHANICS.find(({ title }) => title === 'La machine inconnue')!;
    const rules: readonly [RegExp, (a: number, b: number) => number][] = [
      [/^Additionne/, (a, b) => a + b],
      [/^Soustrais/, (a, b) => Math.abs(a - b)],
      [/^Multiplie/, (a, b) => a * b],
      [/^Double.*ajoute/, (a, b) => 2 * a + b],
      [/^Double.*différence/, (a, b) => Math.abs(2 * a - b)],
      [/^Si le premier nombre est pair/, (a, b) => (a % 2 === 0 ? a + b : Math.abs(a - b))],
    ];
    const readInputs = (clue: Clue) =>
      (clue as Extract<Clue, { kind: 'text' }>).lines[0].split('·').map(Number);

    for (const [index, [method, calculate]] of rules.entries()) {
      vi.mocked(Math.random).mockReturnValueOnce((index + 0.5) / rules.length);
      const puzzle = generate();
      expect(puzzle.solutionHint).toMatch(method);
      expect(puzzle.solutionHint).toContain('chiffre des unités');
      const example = puzzle.examples![0];
      const [exampleA, exampleB] = readInputs(example.clue);
      expect(puzzle.workedExample.clue).toBe(example.clue);
      expect(puzzle.workedExample.explanation).toContain(`= ${calculate(exampleA, exampleB)}.`);
      expect(puzzle.workedExample.explanation).toContain(`soit ${example.digit}.`);
      const digits = puzzle.challenges!.map((clue) => {
        const [a, b] = readInputs(clue);
        return calculate(a, b) % 10;
      });
      expect(digits.join('')).toBe(puzzle.answer);
    }
  });

  it('does not immediately choose the same mechanic for a new round', () => {
    const first = createMysteryRound();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const next = createMysteryRound(first.title);
    expect(next.title).not.toBe(first.title);
    expect(next.answer).toMatch(/^\d{4}$/);
  });

  it('provides the original code deduction clues and preserves a leading zero', () => {
    const title = 'Déduction de Nombre';
    const index = MYSTERY_MECHANICS.findIndex((mechanic) => mechanic.title === title);
    expect(index).toBeGreaterThanOrEqual(0);

    const draw = vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const original = createCodeDeductionPuzzle();
    draw.mockReturnValueOnce((index + 0.5) / MYSTERY_MECHANICS.length);
    const round = createMysteryRound();

    expect(round.title).toBe(title);
    expect(round.answer).toBe('0123');
    expect(round.answer).toBe(original.solution);
    expect(round.shared).toEqual([{ kind: 'code-deduction', clues: original.clues }]);
  });

  it('encodes grid height, width, descending diagonals and ascending diagonals in order', () => {
    seedDraws(38217);
    const { generate } = MYSTERY_MECHANICS.find(
      ({ title }) => title === 'Les grilles à diagonales',
    )!;

    for (let i = 0; i < 20; i++) {
      const { shared, answer } = generate();
      for (const clue of shared!) {
        const marks = drawingMarks(clue);
        const slopes = marks
          .filter((mark) => mark.kind === 'line')
          .map(({ from, to }) => [to[0] - from[0], to[1] - from[1]]);
        const digits = [
          slopes.filter(([, dy]) => dy === 0).length - 1,
          slopes.filter(([dx]) => dx === 0).length - 1,
          slopes.filter(([dx, dy]) => dx * dy > 0).length,
          slopes.filter(([dx, dy]) => dx * dy < 0).length,
        ];
        const printed = marks
          .filter((mark) => mark.kind === 'label')
          .map(({ text }) => text)
          .join('');
        expect(digits.join('')).toBe(printed === 'ABCD' ? answer : printed);
      }
    }
  });

  it.each([
    { title: 'Les lettres en bâtonnets', count: (h: number, v: number) => h * v },
    { title: 'Les lettres en traits droits', count: (_h: number, _v: number, all: number) => all },
  ])('calculates the code from the letter drawings in $title', ({ title, count }) => {
    seedDraws(47920);
    const { generate } = MYSTERY_MECHANICS.find((mechanic) => mechanic.title === title)!;

    for (let i = 0; i < 20; i++) {
      const { examples, challenges, answer } = generate();
      const cases = [
        ...examples!,
        ...challenges!.map((clue, j) => ({ clue, digit: Number(answer[j]) })),
      ];
      for (const { clue, digit } of cases) {
        const strokes = drawingMarks(clue).filter((mark) => mark.kind === 'line');
        const horizontal = strokes.filter(({ from, to }) => from[1] === to[1]).length;
        const vertical = strokes.filter(({ from, to }) => from[0] === to[0]).length;
        expect(digit).toBe(count(horizontal, vertical, strokes.length));
      }
    }
  });

  it('counts only the digits containing every bold segment, including digits with extra segments', () => {
    seedDraws(9835);
    const { generate } = MYSTERY_MECHANICS.find(
      ({ title }) => title === 'Les chiffres compatibles',
    )!;
    const segmentKeys = (marks: ReturnType<typeof drawingMarks>) =>
      marks.flatMap((mark) =>
        mark.kind === 'line' && mark.width > 1 ? [`${mark.from}/${mark.to}`] : [],
      );
    const references = SEGMENT_MASKS.map((_, digit) => segmentKeys(drawDigit(digit, 18, 8)));

    for (let i = 0; i < 20; i++) {
      const { examples, challenges, answer } = generate();
      expect(examples!.map(({ digit }) => digit)).toEqual([3, 9, 4]);
      const cases = [
        ...examples!,
        ...challenges!.map((clue, j) => ({ clue, digit: Number(answer[j]) })),
      ];
      for (const { clue, digit } of cases) {
        const bold = segmentKeys(drawingMarks(clue));
        expect(bold.length).toBeGreaterThan(0);
        expect(
          references.filter((reference) => bold.every((segment) => reference.includes(segment))),
        ).toHaveLength(digit);
      }
    }
  });

  it('counts intersections in the drawing and excludes every T-junction', () => {
    seedDraws(81724);
    const { challenges, examples, answer } = MYSTERY_MECHANICS[0].generate();
    const drawings = [
      ...examples!,
      ...challenges!.map((clue, i) => ({ clue, digit: Number(answer[i]) })),
    ];

    for (const { clue, digit } of drawings) {
      expect(clue.kind).toBe('diagram');
      const lines = (clue as Extract<Clue, { kind: 'diagram' }>).marks.filter(
        (mark) => mark.kind === 'line',
      );
      const horizontal = lines.filter(({ from, to }) => from[1] === to[1]);
      const vertical = lines.filter(({ from, to }) => from[0] === to[0]);
      const inside = (point: number, end1: number, end2: number) =>
        Math.min(end1, end2) < point && point < Math.max(end1, end2);
      const strictlyCrosses = horizontal.reduce(
        (total, h) =>
          total +
          vertical.filter(
            (v) => inside(v.from[0], h.from[0], h.to[0]) && inside(h.from[1], v.from[1], v.to[1]),
          ).length,
        0,
      );
      expect(strictlyCrosses).toBe(digit);
      expect(
        vertical.some((v) =>
          horizontal.some(
            (h) =>
              inside(v.from[0], h.from[0], h.to[0]) &&
              (h.from[1] === v.from[1] || h.from[1] === v.to[1]),
          ),
        ),
      ).toBe(true);
    }
  });
});
