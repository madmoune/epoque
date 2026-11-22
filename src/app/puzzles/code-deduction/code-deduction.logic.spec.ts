import { createCodeDeductionPuzzle } from './code-deduction.logic';

const distinctCodes = Array.from({ length: 10_000 }, (_, value) =>
  String(value).padStart(4, '0'),
).filter((code) => new Set(code).size === 4);

describe('Cadenas à indices', () => {
  afterEach(() => vi.restoreAllMocks());

  it('generates five distinct clues consistent with exactly one code', () => {
    let seed = 734821;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    });

    for (let round = 0; round < 100; round++) {
      const { solution, clues } = createCodeDeductionPuzzle();

      expect(clues).toHaveLength(5);
      expect(new Set(clues.map(({ attempt }) => attempt)).size).toBe(5);
      for (const { attempt } of clues) {
        expect(attempt).toMatch(/^\d{4}$/);
        expect(new Set(attempt).size).toBe(4);
      }

      const matches = distinctCodes.filter((code) =>
        clues.every(({ attempt, wellPlaced, misplaced }) => {
          const digits = [...attempt];
          return (
            digits.filter((digit, position) => digit === code[position]).length === wellPlaced &&
            digits.filter((digit) => code.includes(digit)).length === wellPlaced + misplaced
          );
        }),
      );

      expect(matches).toEqual([solution]);
    }
  });

  it('keeps leading zeroes and generates a different code even after the same draw', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);

    const first = createCodeDeductionPuzzle();
    const next = createCodeDeductionPuzzle(first.solution);

    expect(first.solution).toBe('0123');
    expect(next.solution).not.toBe(first.solution);
  });
});
