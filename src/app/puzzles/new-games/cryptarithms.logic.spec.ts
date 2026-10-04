import {
  createCryptarithm,
  deduceCryptarithm,
  isCryptarithmSolved,
  solveCryptarithm,
} from './cryptarithms.logic';

describe('Deduction cryptarithms', () => {
  beforeEach(() => {
    let seed = 734821;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('generates deduction cryptarithms with at least four unknowns and no guessing required', () => {
    for (let i = 0; i < 100; i++) {
      const puzzle = createCryptarithm('deduction');
      expect(puzzle.letters.length).toBeGreaterThanOrEqual(5);
      expect(puzzle.letters.length).toBeLessThanOrEqual(6);
      expect(Object.keys(puzzle.givens).length).toBeLessThanOrEqual(1);
      expect(puzzle.letters.length - Object.keys(puzzle.givens).length).toBeGreaterThanOrEqual(4);
      expect(puzzle.digits).toEqual(
        [...new Set(Object.values(puzzle.solution))].sort((a, b) => a - b),
      );
      const deduction = deduceCryptarithm(puzzle);
      expect(deduction.solved).toBe(true);
      for (const letter of puzzle.letters)
        expect(deduction.candidates[letter]).toEqual([puzzle.solution[letter]]);
      expect(solveCryptarithm(puzzle)).toEqual([puzzle.solution]);
      expect(isCryptarithmSolved(puzzle, puzzle.solution)).toBe(true);
    }
  });

  it('keeps the deduction fallback solvable by logic with five unknowns', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const puzzle = createCryptarithm('deduction');
    expect(puzzle.letters.length - Object.keys(puzzle.givens).length).toBe(5);
    expect(deduceCryptarithm(puzzle).solved).toBe(true);
    expect(solveCryptarithm(puzzle)).toEqual([puzzle.solution]);
    expect(isCryptarithmSolved(puzzle, puzzle.solution)).toBe(true);
  });

  it('uses the digit bank as a rule for givens and submitted solutions', () => {
    const puzzle = {
      terms: ['AB', 'AB', 'CD'] as [string, string, string],
      letters: ['A', 'B', 'C', 'D'],
      givens: { A: 1, B: 3 },
      digits: [1, 2, 3, 4],
    };
    // 13 + 13 = 26 is valid arithmetic but uses an unavailable digit.
    expect(isCryptarithmSolved(puzzle, { A: 1, B: 3, C: 2, D: 6 })).toBe(false);
    expect(solveCryptarithm({ ...puzzle, givens: { A: 1, B: 3, C: 2, D: 6 } })).toEqual([]);
    expect(solveCryptarithm(puzzle)).toEqual([]);
  });

  it('deduces repeated letters and carries but leaves a stalled unique puzzle unresolved', () => {
    expect(deduceCryptarithm({ terms: ['A', 'A', 'BA'], givens: {} }).solved).toBe(false);
    const repeated = deduceCryptarithm({
      terms: ['A', 'A', 'BC'],
      givens: { A: 7 },
      digits: [1, 4, 7],
    });
    expect(repeated.solved).toBe(true);
    expect(repeated.candidates).toEqual({ A: [7], B: [1], C: [4] });
    expect(repeated.carries).toEqual([[0], [1], [0]]);
    const stalled = { terms: ['SEND', 'MORE', 'MONEY'] as [string, string, string], givens: {} };
    expect(solveCryptarithm(stalled)).toHaveLength(1);
    expect(deduceCryptarithm(stalled).solved).toBe(false);
  });
});
