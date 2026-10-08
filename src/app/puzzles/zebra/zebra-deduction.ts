export type ZebraCategory = {
  id: string;
  label: string;
  values: string[];
};

type ZebraPairClue = {
  firstCategoryId: string;
  firstValue: string;
  secondCategoryId: string;
  secondValue: string;
  text: string;
};

type ZebraChoiceClue = {
  firstCategoryId: string;
  firstValue: string;
  secondCategoryId: string;
  secondValues: [string, string];
  text: string;
};

type ZebraPositionClue = {
  categoryId: string;
  value: string;
  houseIndex: number;
  text: string;
};

type ZebraOrderedClue = {
  leftCategoryId: string;
  leftValue: string;
  rightCategoryId: string;
  rightValue: string;
  text: string;
};

export type ZebraClue =
  | ({ type: 'same' } & ZebraPairClue)
  | ({ type: 'notSame' } & ZebraPairClue)
  | ({ type: 'oneOf' } & ZebraChoiceClue)
  | ({ type: 'neither' } & ZebraChoiceClue)
  | ({ type: 'adjacent' } & ZebraPairClue)
  | ({ type: 'oneBetween' } & ZebraPairClue)
  | ({ type: 'position' } & ZebraPositionClue)
  | ({ type: 'notPosition' } & ZebraPositionClue)
  | ({ type: 'adjacentRight' } & ZebraOrderedClue)
  | ({ type: 'leftOf' } & ZebraOrderedClue);

type ZebraDeductionReason =
  | {
      type: 'clue';
      clue: ZebraClue;
      otherCategoryId?: string;
      otherValue?: string;
      otherPositions?: number[];
      relatedValues?: { categoryId: string; value: string; positions: number[] }[];
    }
  | { type: 'occupied'; otherValue: string; houseIndex: number }
  | { type: 'onlyPlace'; houseIndex: number };

export type ZebraDeductionStep = {
  categoryId: string;
  value: string;
  before: number[];
  after: number[];
  reason: ZebraDeductionReason;
};

export type ZebraDeduction = {
  positions: Record<string, Record<string, number[]>>;
  steps: ZebraDeductionStep[];
  solved: boolean;
};

// Only eliminate unsupported positions and apply the one-value-per-house rule.
// No trial assignments, permutations or access to the puzzle's solution.
export function deduceZebraPositions(
  categories: ZebraCategory[],
  clues: ZebraClue[],
  recordSteps = true,
): ZebraDeduction {
  const houseCategory = categories[0];
  const houseIndexes = houseCategory.values.map((_, index) => index);
  const positions = Object.fromEntries(
    categories.map((category) => [
      category.id,
      Object.fromEntries(
        category.values.map((value, index) => [
          value,
          category.id === houseCategory.id ? [index] : [...houseIndexes],
        ]),
      ),
    ]),
  );
  const steps: ZebraDeductionStep[] = [];
  let changed = true;

  const restrict = (
    categoryId: string,
    value: string,
    allowed: number[],
    reason: ZebraDeductionReason | (() => ZebraDeductionReason),
  ): void => {
    const before = positions[categoryId][value];
    const after = before.filter((houseIndex) => allowed.includes(houseIndex));

    if (after.length !== before.length) {
      positions[categoryId][value] = after;
      if (recordSteps) {
        steps.push({
          categoryId,
          value,
          before,
          after,
          reason: typeof reason === 'function' ? reason() : reason,
        });
      }
      changed = true;
    }
  };

  while (changed) {
    changed = false;

    for (const clue of clues) {
      if (clue.type === 'position' || clue.type === 'notPosition') {
        restrict(
          clue.categoryId,
          clue.value,
          clue.type === 'position'
            ? [clue.houseIndex]
            : houseIndexes.filter((index) => index !== clue.houseIndex),
          { type: 'clue', clue },
        );
        continue;
      }

      if (clue.type === 'oneOf' || clue.type === 'neither') {
        const values = [
          { categoryId: clue.firstCategoryId, value: clue.firstValue },
          ...clue.secondValues.map((value) => ({ categoryId: clue.secondCategoryId, value })),
        ];
        const domains = values.map(({ categoryId, value }) => positions[categoryId][value]);
        const supported = values.map(() => new Set<number>());

        // Check support within this clue only. A choice stays open until another
        // deduction rules out an option; neither option is assumed to be true.
        for (const first of domains[0]) {
          for (const optionA of domains[1]) {
            for (const optionB of domains[2]) {
              if ((optionA === optionB) !== (clue.secondValues[0] === clue.secondValues[1])) {
                continue;
              }

              if (
                clue.firstCategoryId === clue.secondCategoryId &&
                ((first === optionA) !== (clue.firstValue === clue.secondValues[0]) ||
                  (first === optionB) !== (clue.firstValue === clue.secondValues[1]))
              ) {
                continue;
              }

              const matches =
                clue.type === 'oneOf'
                  ? first === optionA || first === optionB
                  : first !== optionA && first !== optionB;

              if (matches) {
                supported[0].add(first);
                supported[1].add(optionA);
                supported[2].add(optionB);
              }
            }
          }
        }

        values.forEach(({ categoryId, value }, index) => {
          restrict(categoryId, value, [...supported[index]], () => ({
            type: 'clue',
            clue,
            relatedValues: values
              .map((other, otherIndex) => ({ ...other, positions: domains[otherIndex] }))
              .filter((_, otherIndex) => otherIndex !== index),
          }));
        });

        if (clue.type === 'oneOf') {
          // The two named alternatives also exclude every other value of the
          // same category, even while neither alternative has a fixed house.
          const excludedValues = categories
            .find((category) => category.id === clue.secondCategoryId)!
            .values.filter((value) => !clue.secondValues.includes(value));

          for (const excludedValue of excludedValues) {
            for (const reversed of [false, true]) {
              const categoryId = reversed ? clue.secondCategoryId : clue.firstCategoryId;
              const value = reversed ? excludedValue : clue.firstValue;
              const otherCategoryId = reversed ? clue.firstCategoryId : clue.secondCategoryId;
              const otherValue = reversed ? clue.firstValue : excludedValue;
              const otherPositions = positions[otherCategoryId][otherValue];

              restrict(
                categoryId,
                value,
                positions[categoryId][value].filter((houseIndex) =>
                  otherPositions.some((other) => houseIndex !== other),
                ),
                { type: 'clue', clue, otherCategoryId, otherValue, otherPositions },
              );
            }
          }
        }
        continue;
      }

      const [firstCategoryId, firstValue, secondCategoryId, secondValue] =
        'leftCategoryId' in clue
          ? [clue.leftCategoryId, clue.leftValue, clue.rightCategoryId, clue.rightValue]
          : [clue.firstCategoryId, clue.firstValue, clue.secondCategoryId, clue.secondValue];
      const matches = (first: number, second: number): boolean => {
        // Two different values in one category always occupy different houses.
        if (
          firstCategoryId === secondCategoryId &&
          firstValue !== secondValue &&
          first === second
        ) {
          return false;
        }

        switch (clue.type) {
          case 'same':
            return first === second;
          case 'notSame':
            return first !== second;
          case 'adjacentRight':
            return first + 1 === second;
          case 'adjacent':
            return Math.abs(first - second) === 1;
          case 'oneBetween':
            return Math.abs(first - second) === 2;
          case 'leftOf':
            return first < second;
        }
      };

      for (const reversed of [false, true]) {
        const categoryId = reversed ? secondCategoryId : firstCategoryId;
        const value = reversed ? secondValue : firstValue;
        const otherCategoryId = reversed ? firstCategoryId : secondCategoryId;
        const otherValue = reversed ? firstValue : secondValue;
        const otherPositions = positions[otherCategoryId][otherValue];

        restrict(
          categoryId,
          value,
          positions[categoryId][value].filter((houseIndex) =>
            otherPositions.some((other) =>
              reversed ? matches(other, houseIndex) : matches(houseIndex, other),
            ),
          ),
          { type: 'clue', clue, otherCategoryId, otherValue, otherPositions },
        );
      }
    }

    for (const category of categories.slice(1)) {
      for (const value of category.values) {
        const possiblePositions = positions[category.id][value];

        if (possiblePositions.length !== 1) {
          continue;
        }

        const houseIndex = possiblePositions[0];

        for (const otherValue of category.values) {
          if (otherValue !== value) {
            restrict(
              category.id,
              otherValue,
              houseIndexes.filter((index) => index !== houseIndex),
              { type: 'occupied', otherValue: value, houseIndex },
            );
          }
        }
      }

      for (const houseIndex of houseIndexes) {
        const possibleValues = category.values.filter((value) =>
          positions[category.id][value].includes(houseIndex),
        );

        if (possibleValues.length === 1) {
          restrict(category.id, possibleValues[0], [houseIndex], { type: 'onlyPlace', houseIndex });
        }
      }
    }
  }

  return {
    positions,
    steps,
    solved: categories.every((category) =>
      category.values.every((value) => positions[category.id][value].length === 1),
    ),
  };
}
