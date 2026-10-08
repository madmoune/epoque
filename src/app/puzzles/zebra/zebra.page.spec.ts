import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZebraPage } from './zebra.page';
import { deduceZebraPositions } from './zebra-deduction';

function seededRandom(seed: number): () => number {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

describe('ZebraPage', () => {
  let page: any;

  beforeEach(() => {
    page = new ZebraPage() as any;
    page.clueWordingChoices.clear();
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

  it.each(['oneOf', 'neither'])('checks %s choices and partial assignments safely', (type) => {
    const clue = {
      type,
      firstCategoryId: 'person',
      firstValue: 'Alice',
      secondCategoryId: 'pet',
      secondValues: ['Chat', 'Chien'],
      text: '',
    };
    const pets = { Chat: 0, Chien: 1, Lapin: 2, Oiseau: 3 };

    for (let houseIndex = 0; houseIndex < 4; houseIndex += 1) {
      expect(page.clueMatches(clue, { person: { Alice: houseIndex }, pet: pets })).toBe(
        type === 'oneOf' ? houseIndex <= 1 : houseIndex >= 2,
      );
    }

    expect(page.clueCouldMatch(clue, { person: { Alice: 0 } })).toBe(true);
    expect(page.clueCouldMatch(clue, { pet: pets })).toBe(true);
    expect(page.clueMatches(clue, { pet: pets })).toBe(false);
    expect(page.clueCouldMatch(clue, { person: { Alice: 0 }, pet: { Chat: 0 } })).toBe(
      type === 'oneOf',
    );
  });

  it('words alternatives and double exclusions as relations between attributes', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    try {
      expect(
        page.describeChoiceClue('oneOf', { id: 'person' }, 'Adam', { id: 'hobby' }, [
          'Lecture',
          'Echecs',
        ]),
      ).toBe('Adam pratique soit la lecture, soit les échecs.');
      expect(
        page.describeChoiceClue('neither', { id: 'color' }, 'Vert', { id: 'pet' }, [
          'Chat',
          'Chien',
        ]),
      ).toBe('La personne qui habite la maison verte n’a ni le chat ni le chien comme animal.');
      expect(
        page.describeChoiceClue('oneOf', { id: 'pet' }, 'Chat', { id: 'person' }, ['Adam', 'Emma']),
      ).toBe('La maison où vit le chat est habitée par Adam ou Emma.');
    } finally {
      randomSpy.mockRestore();
    }
  });

  it.each(['oneOf', 'neither'])('only crosses out guaranteed exclusions for a %s hint', (type) => {
    page.setLevel(4);
    const puzzle = page.puzzle();
    const [firstCategory, secondCategory] = puzzle.categories.slice(1, 3);
    const firstValue = firstCategory.values[0];
    const secondValues = secondCategory.values.slice(0, 2);
    const clue = {
      type,
      firstCategoryId: firstCategory.id,
      firstValue,
      secondCategoryId: secondCategory.id,
      secondValues,
      text: '',
    };
    const expectedExclusions = type === 'oneOf' ? secondCategory.values.slice(2) : secondValues;

    for (const value of expectedExclusions) {
      const move = page.hintMoveFromClue(clue);

      expect(move?.mark).toBe('no');
      expect(move?.secondValue).toBe(value);
      page.setManualGridMark(firstCategory.id, firstValue, secondCategory.id, value, 'no');
    }

    expect(page.hintMoveFromClue(clue)).toBeNull();
    expect(
      secondCategory.values
        .filter((value: string) => !expectedExclusions.includes(value))
        .every(
          (value: string) =>
            page.gridMark(firstCategory.id, firstValue, secondCategory.id, value) !== 'yes',
        ),
    ).toBe(true);
  });

  it('generates candidates for every deduction type and keeps a unique solution', () => {
    const puzzle = page.puzzle();
    const candidates = page.createCandidateClues(puzzle.categories, puzzle.solution);
    const candidateTypes = new Set(candidates.map((clue: any) => clue.type));

    expect(candidateTypes).toEqual(
      new Set([
        'same',
        'notSame',
        'oneOf',
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

  it('keeps a helpful anchor even when spatial clues already force the solution', () => {
    const categories = [
      { id: 'house', label: 'Maison', values: ['Maison 1', 'Maison 2', 'Maison 3'] },
      { id: 'person', label: 'Personne', values: ['Alice', 'Bruno', 'Clara'] },
      { id: 'color', label: 'Couleur', values: ['Rouge', 'Bleu', 'Vert'] },
    ];
    const spatialClues = [
      {
        type: 'adjacentRight',
        leftCategoryId: 'person',
        leftValue: 'Alice',
        rightCategoryId: 'color',
        rightValue: 'Bleu',
        text: '',
      },
      {
        type: 'adjacentRight',
        leftCategoryId: 'person',
        leftValue: 'Bruno',
        rightCategoryId: 'color',
        rightValue: 'Vert',
        text: '',
      },
      {
        type: 'oneBetween',
        firstCategoryId: 'person',
        firstValue: 'Alice',
        secondCategoryId: 'color',
        secondValue: 'Vert',
        text: '',
      },
    ];
    const directClue = {
      type: 'position',
      categoryId: 'person',
      value: 'Alice',
      houseIndex: 0,
      text: '',
    };

    const compactClues = page.reduceToEssentialClues(
      [...spatialClues, directClue],
      categories,
      new Set([directClue]),
      true,
    );

    expect(page.countMatchingSolutions(categories, spatialClues, 2)).toBe(1);
    expect(compactClues).toContain(directClue);
    expect(deduceZebraPositions(categories, compactClues).solved).toBe(true);
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
      expect(page.describeLeftOfClue({ id: 'person' }, 'Félix', { id: 'pet' }, 'Hamster')).toBe(
        'La maison de Félix se trouve quelque part à gauche de la maison où vit le hamster.',
      );
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('makes one-between clues explicit for small grids', () => {
    const randomSpy = vi.spyOn(Math, 'random');

    try {
      for (const randomValue of [0, 0.2, 0.4, 0.6, 0.8]) {
        randomSpy.mockReturnValue(randomValue);

        expect(
          page.describeOneBetweenClue({ id: 'color' }, 'Violette', { id: 'person' }, 'Bruno'),
        ).toMatch(/une seule maison/i);
      }
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
        expect(
          clues.every(
            (clue: string) => clue.includes('Félix') && clue.toLowerCase().includes('hamster'),
          ),
        ).toBe(true);
        expect(clues.some((clue: string) => /Félix (précède|est) le hamster/i.test(clue))).toBe(
          false,
        );
      }
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('spells out direction and distance in spatial hint explanations', () => {
    expect(
      page.explainClueRule({
        type: 'adjacentRight',
        leftCategoryId: 'person',
        leftValue: 'Félix',
        rightCategoryId: 'pet',
        rightValue: 'Hamster',
        text: '',
      }),
    ).toContain('le numéro de droite vaut celui de gauche + 1');
    expect(
      page.explainClueRule({
        type: 'adjacent',
        firstCategoryId: 'person',
        firstValue: 'Félix',
        secondCategoryId: 'pet',
        secondValue: 'Hamster',
        text: '',
      }),
    ).toContain('leurs numéros diffèrent de 1');
    expect(
      page.explainClueRule({
        type: 'oneBetween',
        firstCategoryId: 'person',
        firstValue: 'Félix',
        secondCategoryId: 'pet',
        secondValue: 'Hamster',
        text: '',
      }),
    ).toContain('leurs numéros diffèrent exactement de 2');
  });

  it('uses natural articles for drinks and hobbies', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    try {
      expect(page.describeSameClue({ id: 'person' }, 'Félix', { id: 'drink' }, 'Cafe')).toBe(
        'Félix boit du café.',
      );
      page.clueWordingChoices.clear();
      expect(page.describeSameClue({ id: 'person' }, 'Félix', { id: 'hobby' }, 'Jardin')).toBe(
        'Félix pratique le jardinage.',
      );
      expect(page.hobbyWithArticle('Yoga')).toBe('le yoga');
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('explains a direct hint with numbered, actionable steps', () => {
    const categories = [
      { id: 'house', label: 'Maison', values: ['Maison 1', 'Maison 2', 'Maison 3'] },
      { id: 'person', label: 'Personne', values: ['Alice', 'Bruno', 'Clara'] },
      { id: 'color', label: 'Couleur', values: ['Rouge', 'Bleu', 'Vert'] },
    ];
    const directClue = {
      type: 'same',
      firstCategoryId: 'person',
      firstValue: 'Alice',
      secondCategoryId: 'color',
      secondValue: 'Rouge',
      text: 'Alice habite la maison rouge.',
    };

    page.activePuzzle.set({
      level: 3,
      title: 'Test',
      intro: '',
      positions: categories[0].values,
      categories,
      clues: [directClue.text],
      logicalClues: [directClue],
      solution: [
        { house: 'Maison 1', person: 'Alice', color: 'Rouge' },
        { house: 'Maison 2', person: 'Bruno', color: 'Bleu' },
        { house: 'Maison 3', person: 'Clara', color: 'Vert' },
      ],
    });

    page.showHint();

    expect(page.hintMessage()).toContain('Indice utilisé :');
    expect(page.hintMessage()).toContain('« Alice habite la maison rouge. »');
    expect(page.hintMessage()).toContain('1. Cet indice affirme');
    expect(page.hintMessage()).toContain('Conclusion :');
    expect(page.hintMessage()).toContain('✓');
  });

  it('names every clue used for a multi-step deduction', () => {
    const categories = [
      { id: 'house', label: 'Maison', values: ['Maison 1', 'Maison 2', 'Maison 3'] },
      { id: 'person', label: 'Personne', values: ['Alice', 'Bruno', 'Clara'] },
      { id: 'color', label: 'Couleur', values: ['Rouge', 'Bleu', 'Vert'] },
      { id: 'pet', label: 'Animal', values: ['Chat', 'Chien', 'Oiseau'] },
    ];
    const logicalClues = [
      {
        type: 'same',
        firstCategoryId: 'person',
        firstValue: 'Alice',
        secondCategoryId: 'color',
        secondValue: 'Rouge',
        text: 'Alice habite la maison rouge.',
      },
      {
        type: 'same',
        firstCategoryId: 'color',
        firstValue: 'Rouge',
        secondCategoryId: 'pet',
        secondValue: 'Chat',
        text: 'Le chat vit dans la maison rouge.',
      },
    ];

    page.activePuzzle.set({
      level: 3,
      title: 'Test',
      intro: '',
      positions: categories[0].values,
      categories,
      clues: logicalClues.map((clue) => clue.text),
      logicalClues,
      solution: [
        { house: 'Maison 1', person: 'Alice', color: 'Rouge', pet: 'Chat' },
        { house: 'Maison 2', person: 'Bruno', color: 'Bleu', pet: 'Chien' },
        { house: 'Maison 3', person: 'Clara', color: 'Vert', pet: 'Oiseau' },
      ],
    });

    const explanation = page.explainHint({
      firstCategory: categories[1],
      firstValue: 'Alice',
      secondCategory: categories[3],
      secondValue: 'Chat',
    });

    expect(explanation).toContain('Indices à combiner :');
    expect(explanation).toContain('« Alice habite la maison rouge. »');
    expect(explanation).toContain('« Le chat vit dans la maison rouge. »');
    expect(explanation).toContain('Chacune de ces possibilités crée une contradiction');
    expect(explanation).toContain('Conclusion : seule « Chat » reste possible');
  });

  it('allows only one three-clue support before requiring shorter hints', () => {
    const categories = [
      { id: 'house', label: 'Maison', values: ['Maison 1', 'Maison 2', 'Maison 3'] },
      { id: 'person', label: 'Personne', values: ['Alice', 'Bruno', 'Clara'] },
      { id: 'color', label: 'Couleur', values: ['Rouge', 'Bleu', 'Vert'] },
      { id: 'pet', label: 'Animal', values: ['Chat', 'Chien', 'Oiseau'] },
      { id: 'hobby', label: 'Loisir', values: ['Échecs', 'Peinture', 'Course'] },
    ];
    const logicalClues = [
      {
        type: 'same',
        firstCategoryId: 'person',
        firstValue: 'Alice',
        secondCategoryId: 'color',
        secondValue: 'Rouge',
        text: 'Alice habite la maison rouge.',
      },
      {
        type: 'same',
        firstCategoryId: 'color',
        firstValue: 'Rouge',
        secondCategoryId: 'pet',
        secondValue: 'Chat',
        text: 'Le chat vit dans la maison rouge.',
      },
      {
        type: 'same',
        firstCategoryId: 'pet',
        firstValue: 'Chat',
        secondCategoryId: 'hobby',
        secondValue: 'Échecs',
        text: 'La personne qui joue aux échecs a le chat.',
      },
    ];

    page.activePuzzle.set({
      level: 5,
      title: 'Test',
      intro: '',
      positions: categories[0].values,
      categories,
      clues: logicalClues.map((clue) => clue.text),
      logicalClues,
      solution: [
        {
          house: 'Maison 1',
          person: 'Alice',
          color: 'Rouge',
          pet: 'Chat',
          hobby: 'Échecs',
        },
        {
          house: 'Maison 2',
          person: 'Bruno',
          color: 'Bleu',
          pet: 'Chien',
          hobby: 'Peinture',
        },
        {
          house: 'Maison 3',
          person: 'Clara',
          color: 'Vert',
          pet: 'Oiseau',
          hobby: 'Course',
        },
      ],
    });

    const relation = {
      firstCategory: categories[1],
      firstValue: 'Alice',
      secondCategory: categories[4],
      secondValue: 'Échecs',
    };

    expect(page.supportingCluesFor(relation)).toHaveLength(3);

    page.complexHintCount = 1;
    expect(page.supportingCluesFor(relation)).toBeNull();
  });

  it('generates varied 4x4 puzzles that can be fully deduced without guesses', () => {
    const randomSpy = vi.spyOn(Math, 'random');

    try {
      for (let seed = 1; seed <= 80; seed += 1) {
        randomSpy.mockImplementation(seededRandom(seed));
        page.setLevel(4);
        const puzzle = page.puzzle();
        const deduction = deduceZebraPositions(puzzle.categories, puzzle.logicalClues);
        const anchors = puzzle.logicalClues.filter((clue: any) => clue.type === 'position');
        const clueTypes = new Set(puzzle.logicalClues.map((clue: any) => clue.type));
        const directClues = puzzle.logicalClues.filter((clue: any) =>
          ['position', 'same', 'notPosition', 'notSame'].includes(clue.type),
        );
        const assignments = Object.fromEntries(
          puzzle.categories.map((category: any) => [
            category.id,
            Object.fromEntries(
              puzzle.solution.map((row: any, houseIndex: number) => [row[category.id], houseIndex]),
            ),
          ]),
        );

        expect(deduction.solved, `seed ${seed}`).toBe(true);
        expect(page.countMatchingSolutions(puzzle.categories, puzzle.logicalClues, 2)).toBe(1);
        expect(clueTypes.size).toBeGreaterThanOrEqual(8);
        expect(clueTypes.has('oneOf')).toBe(true);
        expect(clueTypes.has('neither')).toBe(true);
        expect(clueTypes.has('leftOf')).toBe(true);
        expect(anchors).toHaveLength(1);
        expect(
          puzzle.logicalClues.filter((clue: any) => clue.type === 'same').length,
        ).toBeLessThanOrEqual(2);
        expect(deduceZebraPositions(puzzle.categories, directClues).solved).toBe(false);
        expect(
          puzzle.logicalClues.every((clue: any) => page.clueMatches(clue, assignments)),
          `every clue must be true for seed ${seed}`,
        ).toBe(true);
        expect(puzzle.clues).toEqual(puzzle.logicalClues.map((clue: any) => clue.text));

        for (const [houseIndex, row] of puzzle.solution.entries()) {
          for (const category of puzzle.categories) {
            expect(deduction.positions[category.id][row[category.id]]).toEqual([houseIndex]);
          }
        }
      }
    } finally {
      randomSpy.mockRestore();
    }
  }, 15000);

  it('finishes 4x4 games with explained deductions and no supplemental clues', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    const rescueSpy = vi.spyOn(page, 'createRescueHintMove');

    try {
      for (let seed = 1; seed <= 8; seed += 1) {
        randomSpy.mockImplementation(seededRandom(seed));
        page.setLevel(4);
        const initialClues = [...page.puzzle().clues];

        for (let hintIndex = 0; hintIndex < 80 && !page.isSolved(); hintIndex += 1) {
          page.showHint();
          const message = page.hintMessage() ?? '';

          expect(message, `seed ${seed}, hint ${hintIndex}`).toContain('Conclusion :');
          expect(message).not.toContain('supplémentaire');
          expect(message).not.toContain('essaie les autres valeurs');
        }

        expect(page.isSolved(), `seed ${seed}`).toBe(true);
        expect(page.puzzle().clues).toEqual(initialClues);
      }

      expect(rescueSpy).not.toHaveBeenCalled();
    } finally {
      randomSpy.mockRestore();
      rescueSpy.mockRestore();
    }
  }, 15000);

  it('keeps a mix of clue types and fresh wording at every level', () => {
    const randomSpy = vi.spyOn(Math, 'random');

    try {
      for (const level of [3, 4, 5]) {
        for (let seed = 1; seed <= 4; seed += 1) {
          randomSpy.mockImplementation(seededRandom(seed));
          page.setLevel(level);
          const puzzle = page.puzzle();

          expect(
            new Set(puzzle.logicalClues.map((clue: any) => clue.type)).size,
          ).toBeGreaterThanOrEqual(5);
          expect(page.countMatchingSolutions(puzzle.categories, puzzle.logicalClues, 2)).toBe(1);
          expect(puzzle.clues.every((clue: string) => /^[A-ZÉÀÇ]/.test(clue))).toBe(true);
          expect(puzzle.clues.join(' ')).not.toMatch(
            /On sait que|L’indice à retenir|Il est certain que|Les deux indices/,
          );
          expect(puzzle.clues.join(' ')).not.toMatch(/\bvit la maison|peinte en bleue/);
        }
      }
    } finally {
      randomSpy.mockRestore();
    }
  }, 15000);
});
