import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('toggles used clues and clears them when restarting', () => {
    expect(page.isClueUsed(0)).toBe(false);

    page.toggleClue(0);
    expect(page.isClueUsed(0)).toBe(true);

    page.toggleClue(0);
    expect(page.isClueUsed(0)).toBe(false);

    page.toggleClue(1);
    expect(page.isClueUsed(1)).toBe(true);

    page.resetPuzzle();
    expect(page.isClueUsed(1)).toBe(false);
  });

  it('uses house-based wording for spatial clues', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    try {
      expect(
        page.describeLeftOfClue(
          { id: 'person' },
          'Félix',
          { id: 'pet' },
          'Hamster',
        ),
      ).toBe(
        'La maison de Félix se trouve quelque part à gauche de la maison où vit le hamster.',
      );
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('keeps every spatial clue anchored to house positions', () => {
    const randomSpy = vi.spyOn(Math, 'random');

    try {
      for (const randomValue of [0, 0.2, 0.4, 0.6, 0.8, 0.999]) {
        randomSpy.mockReturnValue(randomValue);

        const clues = [
          page.describeAdjacentClue({ id: 'person' }, 'Félix', { id: 'pet' }, 'Hamster'),
          page.describeNeighborClue({ id: 'person' }, 'Félix', { id: 'pet' }, 'Hamster'),
          page.describeLeftOfClue({ id: 'person' }, 'Félix', { id: 'pet' }, 'Hamster'),
          page.describeOneBetweenClue({ id: 'person' }, 'Félix', { id: 'pet' }, 'Hamster'),
        ];

        expect(clues.every((clue: string) => clue.toLowerCase().includes('maison'))).toBe(true);
        expect(clues.some((clue: string) => /Félix (précède|est) le hamster/i.test(clue))).toBe(
          false,
        );
      }
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('uses natural articles for drinks and hobbies', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    try {
      expect(
        page.describeSameClue({ id: 'person' }, 'Félix', { id: 'drink' }, 'Cafe'),
      ).toBe('Félix boit du café.');
      expect(
        page.describeSameClue({ id: 'person' }, 'Félix', { id: 'hobby' }, 'Jardin'),
      ).toBe('Félix pratique le jardinage.');
    } finally {
      randomSpy.mockRestore();
    }
  });
});
