import { createCryptarithm, isCryptarithmSolved, solveCryptarithm } from './cryptarithms.logic';
import {
  createDropQuote,
  DROP_PHRASES,
  isDropQuoteSolved,
  remainingDropLetters,
} from './drop-quote.logic';
import { createKakuro, isKakuroSolved, solveKakuro } from './kakuro.logic';
import {
  createSkyscrapers,
  isSkyscrapersSolved,
  solveSkyscrapers,
  visibleTowers,
} from './skyscrapers.logic';
import { createSumplete, isSumpleteSolved, solveSumplete, sumpleteTotals } from './sumplete.logic';
import {
  canPlaceWord,
  createWordFit,
  isWordFitSolved,
  solveWordFit,
  wordFitLetters,
} from './word-fit.logic';

describe('New game generators and rules', () => {
  beforeEach(() => {
    let seed = 734821;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('generates short cryptarithms with distinct digits and one solution', () => {
    for (let i = 0; i < 20; i++) {
      const puzzle = createCryptarithm();
      expect(puzzle.letters.length).toBeGreaterThanOrEqual(4);
      expect(puzzle.letters.length).toBeLessThanOrEqual(6);
      expect(Object.keys(puzzle.givens).length).toBeLessThanOrEqual(2);
      expect(solveCryptarithm(puzzle)).toEqual([puzzle.solution]);
      expect(isCryptarithmSolved(puzzle, puzzle.solution)).toBe(true);
      expect(isCryptarithmSolved(puzzle, {})).toBe(false);
      expect(
        isCryptarithmSolved(
          puzzle,
          Object.fromEntries(puzzle.letters.map((letter) => [letter, 1])),
        ),
      ).toBe(false);
    }
  });

  it('rejects leading zeroes and verifies the final carry', () => {
    expect(solveCryptarithm({ terms: ['A', 'A', 'BA'], givens: { A: 5, B: 1 } })).toEqual([]);
    expect(solveCryptarithm({ terms: ['A', 'A', 'BC'], givens: { A: 7, B: 1, C: 4 } })).toEqual([
      { A: 7, B: 1, C: 4 },
    ]);
    expect(solveCryptarithm({ terms: ['AB', 'AB', 'CD'], givens: { A: 0 } })).toEqual([]);
  });

  it('has a bounded, uniquely solvable cryptarithm fallback', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const puzzle = createCryptarithm();
    expect(solveCryptarithm(puzzle)).toEqual([puzzle.solution]);
    expect(isCryptarithmSolved(puzzle, puzzle.solution)).toBe(true);
  });

  it('counts visible towers by direction, not just distinct heights', () => {
    expect(visibleTowers([2, 1, 4, 3])).toBe(2);
    expect(visibleTowers([3, 4, 1, 2])).toBe(2);
    expect(visibleTowers([4, 3, 2, 1])).toBe(1);
    expect(visibleTowers([1, 2, 3, 4])).toBe(4);
  });

  it('keeps skyscrapers unique even after hiding redundant edge clues', () => {
    for (let i = 0; i < 20; i++) {
      const puzzle = createSkyscrapers();
      expect(solveSkyscrapers(puzzle)).toEqual([puzzle.solution]);
      expect(isSkyscrapersSolved(puzzle, puzzle.solution)).toBe(true);
      expect(isSkyscrapersSolved(puzzle, Array(16).fill(1))).toBe(false);
      const changed = [...puzzle.solution];
      changed[0] = changed[1];
      expect(isSkyscrapersSolved(puzzle, changed)).toBe(false);
      expect([...puzzle.top, ...puzzle.bottom, ...puzzle.left, ...puzzle.right].includes(0)).toBe(
        true,
      );
    }
  });

  it('gives every Kakuro cell two valid crossing groups and a unique solution', () => {
    for (let i = 0; i < 12; i++) {
      const puzzle = createKakuro();
      expect(isKakuroSolved(puzzle, puzzle.solution)).toBe(true);
      expect(isKakuroSolved(puzzle, {})).toBe(false);
      expect(solveKakuro(puzzle)).toEqual([puzzle.solution]);
      for (const cell of puzzle.whiteCells)
        expect(puzzle.runs.filter((run) => run.cells.includes(cell))).toHaveLength(2);
      for (const run of puzzle.runs) {
        expect(run.cells.length).toBeGreaterThanOrEqual(2);
        expect(run.cells.length).toBeLessThanOrEqual(5);
        expect(puzzle.whiteCells.includes(run.clue)).toBe(false);
      }
      const repeated = { ...puzzle.solution };
      const run = puzzle.runs[0];
      repeated[run.cells[0]] = repeated[run.cells[1]];
      expect(isKakuroSolved(puzzle, repeated)).toBe(false);
    }
  }, 15000);

  it('generates Sumplete with one keep/remove solution and checks both axes', () => {
    for (let i = 0; i < 20; i++) {
      const puzzle = createSumplete();
      expect(solveSumplete(puzzle)).toEqual([puzzle.solution]);
      expect(sumpleteTotals(puzzle, puzzle.solution)).toEqual({
        rows: puzzle.rowTargets,
        columns: puzzle.columnTargets,
      });
      expect(isSumpleteSolved(puzzle, puzzle.solution)).toBe(true);
      expect(isSumpleteSolved(puzzle, Array(25).fill(true))).toBe(false);
      expect(
        isSumpleteSolved(
          puzzle,
          puzzle.solution.map((keep, cell) => (cell === 0 ? !keep : keep)),
        ),
      ).toBe(false);
      expect(puzzle.numbers.every((n) => n >= 1 && n <= 9)).toBe(true);
    }
  });

  it('builds connected, compact word grids with matching crossings and one placement', () => {
    for (let i = 0; i < 12; i++) {
      const puzzle = createWordFit();
      expect(puzzle.words.length).toBeGreaterThanOrEqual(8);
      expect(puzzle.words.length).toBeLessThanOrEqual(10);
      expect(puzzle.width).toBeLessThanOrEqual(12);
      expect(puzzle.height).toBeLessThanOrEqual(12);
      expect(new Set(puzzle.words).size).toBe(puzzle.words.length);
      const assignments = Object.fromEntries(puzzle.solution.map((word, slot) => [slot, word]));
      expect(solveWordFit(puzzle)).toEqual([assignments]);
      expect(isWordFitSolved(puzzle, assignments)).toBe(true);
      expect(isWordFitSolved(puzzle, {})).toBe(false);
      const letters = wordFitLetters(puzzle, assignments);
      puzzle.slots.forEach((slot, i) => {
        expect(slot.cells.map((cell) => letters[cell]).join('')).toBe(puzzle.solution[i]);
        expect(slot.cells.every((cell) => cell >= 0 && cell < puzzle.width * puzzle.height)).toBe(
          true,
        );
        expect(canPlaceWord(puzzle, assignments, i, puzzle.solution[i])).toBe(true);
      });
      const reached = new Set([0]);
      for (let pass = 0; pass < puzzle.slots.length; pass++)
        puzzle.slots.forEach((slot, i) => {
          if (
            [...reached].some((other) =>
              puzzle.slots[other].cells.some((cell) => slot.cells.includes(cell)),
            )
          )
            reached.add(i);
        });
      expect(reached.size).toBe(puzzle.slots.length);
    }
  }, 15000);

  it('preserves every dropped letter in its own column, including duplicates', () => {
    const seen = new Set<string>();
    let previous: string | undefined;
    for (let i = 0; i < 50; i++) {
      const puzzle = createDropQuote(previous);
      expect(puzzle.phrase).not.toBe(previous);
      previous = puzzle.phrase;
      seen.add(puzzle.phrase);
      expect(puzzle.rows.every((row) => row.length === puzzle.width)).toBe(true);
      const normalized = puzzle.phrase
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toUpperCase();
      expect(puzzle.rows.map((row) => row.trim()).join(' ')).toBe(normalized);
      puzzle.columns.forEach((letters, col) => {
        expect([...letters].sort()).toEqual(
          puzzle.rows
            .map((row) => row[col])
            .filter((letter) => letter !== ' ')
            .sort(),
        );
      });
      expect(isDropQuoteSolved(puzzle, puzzle.solution)).toBe(true);
      expect(isDropQuoteSolved(puzzle, {})).toBe(false);
      expect(
        remainingDropLetters(puzzle, puzzle.solution).every((column) => column.length === 0),
      ).toBe(true);
      const [cell, letter] = Object.entries(puzzle.solution)[0];
      expect(
        remainingDropLetters(puzzle, { [cell]: letter })[Number(cell) % puzzle.width].length,
      ).toBe(puzzle.columns[Number(cell) % puzzle.width].length - 1);
    }
    expect(seen.size).toBeGreaterThan(10);
    expect(DROP_PHRASES.length).toBeGreaterThanOrEqual(20);
  });
});
