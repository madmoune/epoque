import { describe, expect, it } from 'vitest';
import { deduceZebraPositions, ZebraCategory, ZebraClue } from './zebra-deduction';

const categories: ZebraCategory[] = [
  { id: 'house', label: 'Maison', values: ['Maison 1', 'Maison 2', 'Maison 3', 'Maison 4'] },
  { id: 'person', label: 'Personne', values: ['Alice', 'Bruno', 'Clara', 'Diego'] },
  { id: 'color', label: 'Couleur', values: ['Rouge', 'Bleu', 'Vert', 'Jaune'] },
];

const anchor: ZebraClue = {
  type: 'position',
  categoryId: 'person',
  value: 'Alice',
  houseIndex: 1,
  text: '',
};

describe('deduceZebraPositions', () => {
  it.each([
    ['same', [1]],
    ['notSame', [0, 2, 3]],
    ['adjacent', [0, 2]],
    ['oneBetween', [3]],
  ] as const)('applies %s without assuming a direction', (type, expected) => {
    const clue: ZebraClue = {
      type,
      firstCategoryId: 'person',
      firstValue: 'Alice',
      secondCategoryId: 'color',
      secondValue: 'Rouge',
      text: '',
    };

    const deduction = deduceZebraPositions(categories, [anchor, clue]);

    expect(deduction.positions['color']['Rouge']).toEqual(expected);
    expect(deduction.solved).toBe(false);
  });

  it.each([
    ['adjacentRight', false, [2]],
    ['adjacentRight', true, [0]],
    ['leftOf', false, [2, 3]],
    ['leftOf', true, [0]],
  ] as const)('applies %s with reversed=%s', (type, reversed, expected) => {
    const clue: ZebraClue = {
      type,
      leftCategoryId: reversed ? 'color' : 'person',
      leftValue: reversed ? 'Rouge' : 'Alice',
      rightCategoryId: reversed ? 'person' : 'color',
      rightValue: reversed ? 'Alice' : 'Rouge',
      text: '',
    };

    expect(deduceZebraPositions(categories, [clue, anchor]).positions['color']['Rouge']).toEqual(
      expected,
    );
  });

  it('keeps both alternatives open until another clue excludes one', () => {
    const choice: ZebraClue = {
      type: 'oneOf',
      firstCategoryId: 'person',
      firstValue: 'Alice',
      secondCategoryId: 'color',
      secondValues: ['Rouge', 'Bleu'],
      text: '',
    };
    const initial = deduceZebraPositions(categories, [anchor, choice]);

    expect(initial.positions['color']['Rouge']).toEqual([0, 1, 2, 3]);
    expect(initial.positions['color']['Bleu']).toEqual([0, 1, 2, 3]);
    expect(initial.positions['color']['Vert']).toEqual([0, 2, 3]);
    expect(initial.positions['color']['Jaune']).toEqual([0, 2, 3]);
    expect(initial.solved).toBe(false);

    const deduction = deduceZebraPositions(categories, [
      anchor,
      choice,
      { type: 'notPosition', categoryId: 'color', value: 'Rouge', houseIndex: 1, text: '' },
    ]);

    expect(deduction.positions['color']['Bleu']).toEqual([1]);
    expect(deduction.positions['color']['Rouge']).toEqual([0, 2, 3]);
    expect(deduction.steps.some((step) => step.reason.type === 'onlyPlace')).toBe(true);
  });

  it('applies both exclusions without choosing one of the remaining values', () => {
    const deduction = deduceZebraPositions(categories, [
      anchor,
      {
        type: 'neither',
        firstCategoryId: 'person',
        firstValue: 'Alice',
        secondCategoryId: 'color',
        secondValues: ['Rouge', 'Bleu'],
        text: '',
      },
    ]);

    expect(deduction.positions['color']).toEqual({
      Rouge: [0, 2, 3],
      Bleu: [0, 2, 3],
      Vert: [0, 1, 2, 3],
      Jaune: [0, 1, 2, 3],
    });
    expect(deduction.solved).toBe(false);
  });

  it.each([
    ['oneOf', [0, 3]],
    ['neither', [1, 2]],
  ] as const)('uses known alternatives to restrict the subject of a %s clue', (type, expected) => {
    const deduction = deduceZebraPositions(categories, [
      { type: 'position', categoryId: 'color', value: 'Rouge', houseIndex: 0, text: '' },
      { type: 'position', categoryId: 'color', value: 'Bleu', houseIndex: 3, text: '' },
      {
        type,
        firstCategoryId: 'person',
        firstValue: 'Alice',
        secondCategoryId: 'color',
        secondValues: ['Rouge', 'Bleu'],
        text: '',
      },
    ]);

    expect(deduction.positions['person']['Alice']).toEqual(expected);
    expect(deduction.steps.find((step) => step.value === 'Alice')?.reason).toMatchObject({
      type: 'clue',
      clue: { type },
      relatedValues: expect.any(Array),
    });
    expect(deduction.solved).toBe(false);
  });

  it('chains spatial clues, associations and the last remaining value', () => {
    const clues: ZebraClue[] = [
      { ...anchor, houseIndex: 0 },
      {
        type: 'adjacentRight',
        leftCategoryId: 'person',
        leftValue: 'Alice',
        rightCategoryId: 'person',
        rightValue: 'Bruno',
        text: '',
      },
      {
        type: 'oneBetween',
        firstCategoryId: 'person',
        firstValue: 'Alice',
        secondCategoryId: 'person',
        secondValue: 'Clara',
        text: '',
      },
      ...(['Alice', 'Bruno', 'Clara'] as const).map(
        (person, index): ZebraClue => ({
          type: 'same',
          firstCategoryId: 'person',
          firstValue: person,
          secondCategoryId: 'color',
          secondValue: categories[2].values[index],
          text: '',
        }),
      ),
    ];

    const deduction = deduceZebraPositions(categories, clues);

    expect(deduction.solved).toBe(true);
    expect(deduction.positions['person']).toEqual({
      Alice: [0],
      Bruno: [1],
      Clara: [2],
      Diego: [3],
    });
    expect(deduction.positions['color']).toEqual({ Rouge: [0], Bleu: [1], Vert: [2], Jaune: [3] });
  });

  it('places the only value available for a house and preserves unresolved choices', () => {
    const clues: ZebraClue[] = ['Rouge', 'Bleu', 'Vert'].flatMap((value) =>
      (value === 'Vert' ? [3] : [2, 3]).map(
        (houseIndex): ZebraClue => ({
          type: 'notPosition',
          categoryId: 'color',
          value,
          houseIndex,
          text: '',
        }),
      ),
    );

    const deduction = deduceZebraPositions(categories, clues);

    expect(deduction.positions['color']).toEqual({
      Rouge: [0, 1],
      Bleu: [0, 1],
      Vert: [2],
      Jaune: [3],
    });
    expect(deduction.steps.some((step) => step.reason.type === 'onlyPlace')).toBe(true);
    expect(deduction.solved).toBe(false);
  });

  it('rejects contradictory placements', () => {
    const deduction = deduceZebraPositions(categories, [anchor, { ...anchor, value: 'Bruno' }]);

    expect(deduction.solved).toBe(false);
    expect(
      Object.values(deduction.positions['person']).some((positions) => positions.length === 0),
    ).toBe(true);
  });

  it('preserves every valid arrangement when combining choices and spatial clues', () => {
    const clues: ZebraClue[] = [
      anchor,
      {
        type: 'oneOf',
        firstCategoryId: 'person',
        firstValue: 'Alice',
        secondCategoryId: 'color',
        secondValues: ['Rouge', 'Bleu'],
        text: '',
      },
      {
        type: 'neither',
        firstCategoryId: 'person',
        firstValue: 'Bruno',
        secondCategoryId: 'color',
        secondValues: ['Rouge', 'Vert'],
        text: '',
      },
      {
        type: 'leftOf',
        leftCategoryId: 'person',
        leftValue: 'Clara',
        rightCategoryId: 'color',
        rightValue: 'Rouge',
        text: '',
      },
    ];
    const deduction = deduceZebraPositions(categories, clues);
    const permutations = (values: number[]): number[][] =>
      values.length === 0
        ? [[]]
        : values.flatMap((value, index) =>
            permutations(values.filter((_, otherIndex) => index !== otherIndex)).map((rest) => [
              value,
              ...rest,
            ]),
          );
    const arrangements = permutations([0, 1, 2, 3]);
    let validArrangements = 0;

    // An independent, exhaustive check ensures propagation never removes a
    // placement that occurs in an actual solution of these combined clues.
    for (const people of arrangements) {
      for (const colours of arrangements) {
        const [alice, bruno, clara] = people;
        const [red, blue, green] = colours;

        if (
          alice !== 1 ||
          (alice !== red && alice !== blue) ||
          bruno === red ||
          bruno === green ||
          clara >= red
        ) {
          continue;
        }

        validArrangements += 1;
        for (const [categoryIndex, positions] of [
          [1, people],
          [2, colours],
        ] as const) {
          for (const [valueIndex, value] of categories[categoryIndex].values.entries()) {
            expect(deduction.positions[categories[categoryIndex].id][value]).toContain(
              positions[valueIndex],
            );
          }
        }
      }
    }

    expect(validArrangements).toBeGreaterThan(0);
    expect(deduceZebraPositions(categories, clues, false).positions).toEqual(deduction.positions);
    expect(deduceZebraPositions(categories, clues, false).steps).toEqual([]);
  });

  it('does not mistake a unique solution for a solution reachable by simple deductions', () => {
    const clues: ZebraClue[] = [
      {
        type: 'leftOf',
        leftCategoryId: 'person',
        leftValue: 'Alice',
        rightCategoryId: 'person',
        rightValue: 'Clara',
        text: '',
      },
      {
        type: 'leftOf',
        leftCategoryId: 'person',
        leftValue: 'Bruno',
        rightCategoryId: 'person',
        rightValue: 'Clara',
        text: '',
      },
      {
        type: 'adjacent',
        firstCategoryId: 'person',
        firstValue: 'Bruno',
        secondCategoryId: 'person',
        secondValue: 'Clara',
        text: '',
      },
      {
        type: 'adjacent',
        firstCategoryId: 'person',
        firstValue: 'Clara',
        secondCategoryId: 'person',
        secondValue: 'Diego',
        text: '',
      },
    ];
    const solutions: number[][] = [];

    for (let alice = 0; alice < 4; alice += 1) {
      for (let bruno = 0; bruno < 4; bruno += 1) {
        for (let clara = 0; clara < 4; clara += 1) {
          for (let diego = 0; diego < 4; diego += 1) {
            if (
              new Set([alice, bruno, clara, diego]).size === 4 &&
              alice < clara &&
              bruno < clara &&
              clara - bruno === 1 &&
              Math.abs(clara - diego) === 1
            ) {
              solutions.push([alice, bruno, clara, diego]);
            }
          }
        }
      }
    }

    expect(solutions).toEqual([[0, 1, 2, 3]]);
    expect(deduceZebraPositions(categories.slice(0, 2), clues).solved).toBe(false);
    expect(
      deduceZebraPositions(categories.slice(0, 2), [{ ...anchor, value: 'Bruno' }, ...clues])
        .solved,
    ).toBe(true);
  });
});
