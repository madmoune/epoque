import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { PIVOT_WORD_PUZZLES } from './pivot-word.data';
import { PivotWordService } from './pivot-word.service';

describe('PivotWordService', () => {
  const service = new PivotWordService();

  it('contains a varied and well-formed puzzle bank', () => {
    const answers = new Set<string>();

    expect(PIVOT_WORD_PUZZLES.length).toBeGreaterThanOrEqual(75);

    for (const puzzle of PIVOT_WORD_PUZZLES) {
      const answer = service.normalizeAnswer(puzzle.answer);

      expect(answer).not.toBe('');
      expect(answers.has(answer)).toBe(false);
      expect(puzzle.definition.trim()).not.toBe('');
      expect(puzzle.links).toHaveLength(3);

      for (const link of puzzle.links) {
        expect(link.clue.trim()).not.toBe('');
        expect(service.normalizeAnswer(link.expression)).toContain(answer);
      }

      answers.add(answer);
    }
  });

  it('accepts accents, punctuation and alternate spellings', () => {
    const puzzle = PIVOT_WORD_PUZZLES.find((candidate) => candidate.answer === 'clé');

    expect(puzzle).toBeDefined();
    expect(service.isCorrect(puzzle!, 'CLÉ')).toBe(true);
    expect(service.isCorrect(puzzle!, 'cle')).toBe(true);
    expect(service.isCorrect(puzzle!, 'clef')).toBe(true);
    expect(service.isCorrect(puzzle!, 'carte')).toBe(false);
  });

  it('returns a copy whose three clues can be reordered safely', () => {
    const puzzle = service.createPuzzle();
    const sourcePuzzle = PIVOT_WORD_PUZZLES.find((candidate) => candidate.answer === puzzle.answer);

    expect(sourcePuzzle).toBeDefined();
    expect(puzzle).not.toBe(sourcePuzzle);
    expect(puzzle.links).not.toBe(sourcePuzzle?.links);
    expect(new Set(puzzle.links.map((link) => link.clue))).toEqual(
      new Set(sourcePuzzle?.links.map((link) => link.clue)),
    );
  });
});
