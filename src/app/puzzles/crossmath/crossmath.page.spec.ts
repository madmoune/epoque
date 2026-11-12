import { CrossmathPage } from './crossmath.page';

describe.each([
  { size: 3, seed: 14, givens: 2, maxLineGivens: 1 },
  { size: 4, seed: 26, givens: 5, maxLineGivens: 2 },
] as const)('Crossmath generation ($size×$size)', ({ size, seed, givens, maxLineGivens }) => {
  afterEach(() => vi.restoreAllMocks());

  it('skips a unique puzzle when deduction stalls', () => {
    const page = new CrossmathPage();
    let randomState: number = seed;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
      return randomState / 4294967296;
    });

    const stalled = page['createPuzzleCandidate'](size, givens, maxLineGivens);
    expect(page['isSolvableByDeduction'](stalled)).toBe(false);

    randomState = seed;
    const puzzle = page['createPuzzle'](size);
    expect(puzzle).not.toEqual(stalled);
    expect(page['isSolvableByDeduction'](puzzle)).toBe(true);
  });

  it('keeps a solvable fallback with several blanks', () => {
    const page = new CrossmathPage();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const stalled = page['createPuzzleCandidate'](size, givens, maxLineGivens);
    page['createPuzzleCandidate'] = () => stalled;

    const puzzle = page['createPuzzle'](size);
    const blanks = puzzle.cells.flat().filter((cell) => !cell.given);

    expect(blanks).toHaveLength(2 * size - 1);
    expect(puzzle).not.toEqual(stalled);
    expect(page['isSolvableByDeduction'](puzzle)).toBe(true);
  });
});
