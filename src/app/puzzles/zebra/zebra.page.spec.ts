import '@angular/compiler';
import { beforeEach, describe, expect, it } from 'vitest';
import { ZebraPage } from './zebra.page';

describe('ZebraPage', () => {
  let page: any;

  beforeEach(() => {
    page = new ZebraPage() as any;
  });

  it('supports the new spatial deduction types', () => {
    const assignments = {
      person: { Nora: 0, Omar: 2 },
      color: { Orange: 1, Violette: 2 },
    };

    expect(
      page.clueMatches(
        {
          type: 'adjacent',
          firstCategoryId: 'person',
          firstValue: 'Nora',
          secondCategoryId: 'color',
          secondValue: 'Orange',
          text: '',
        },
        assignments,
      ),
    ).toBe(true);
    expect(
      page.clueMatches(
        {
          type: 'leftOf',
          leftCategoryId: 'person',
          leftValue: 'Nora',
          rightCategoryId: 'color',
          rightValue: 'Violette',
          text: '',
        },
        assignments,
      ),
    ).toBe(true);
    expect(
      page.clueMatches(
        {
          type: 'oneBetween',
          firstCategoryId: 'person',
          firstValue: 'Nora',
          secondCategoryId: 'color',
          secondValue: 'Violette',
          text: '',
        },
        assignments,
      ),
    ).toBe(true);
  });

  it('rejects spatial relations that do not match the positions', () => {
    const assignments = {
      person: { Nora: 0, Omar: 2 },
      color: { Orange: 1, Violette: 2 },
    };

    expect(
      page.clueMatches(
        {
          type: 'adjacent',
          firstCategoryId: 'person',
          firstValue: 'Nora',
          secondCategoryId: 'color',
          secondValue: 'Violette',
          text: '',
        },
        assignments,
      ),
    ).toBe(false);
    expect(
      page.clueMatches(
        {
          type: 'leftOf',
          leftCategoryId: 'person',
          leftValue: 'Omar',
          rightCategoryId: 'color',
          rightValue: 'Orange',
          text: '',
        },
        assignments,
      ),
    ).toBe(false);
    expect(
      page.clueMatches(
        {
          type: 'oneBetween',
          firstCategoryId: 'person',
          firstValue: 'Nora',
          secondCategoryId: 'color',
          secondValue: 'Orange',
          text: '',
        },
        assignments,
      ),
    ).toBe(false);
  });

  it('generates candidates for every deduction type and keeps a unique solution', () => {
    const puzzle = page.puzzle();
    const candidates = page.createCandidateClues(puzzle.categories, puzzle.solution);
    const candidateTypes = new Set(candidates.map((clue: any) => clue.type));

    expect(candidateTypes).toEqual(
      new Set([
        'same',
        'notSame',
        'position',
        'notPosition',
        'adjacentRight',
        'adjacent',
        'leftOf',
        'oneBetween',
      ]),
    );
    expect(page.countMatchingSolutions(puzzle.categories, puzzle.logicalClues, 2)).toBe(1);
  });

  it('keeps a unique solution at every grid size', () => {
    for (const level of [3, 4, 5]) {
      page.setLevel(level);
      const puzzle = page.puzzle();

      expect(page.countMatchingSolutions(puzzle.categories, puzzle.logicalClues, 2)).toBe(1);
    }
  });
});
