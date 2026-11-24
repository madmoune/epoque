import { range } from '../new-games/random';

type ChainOperation = {
  symbol: string;
  description: string;
  caption?: string;
  apply: (value: number) => number;
};

type ChainStep = { operation: ChainOperation; result: number };

export type ArithmeticChain = {
  start: number;
  steps: readonly ChainStep[];
  answer: number;
};

const STEP_COUNT = 9;
const MAX_VALUE = 2_500;

const STARTING_NUMBERS = [...range(37).map((index) => index + 4), 49, 50, 60, 64, 72, 81, 90, 100];
const ADDENDS = range(12).map((index) => index + 1);

const OPERATION_GROUPS: readonly (readonly ChainOperation[])[] = [
  ADDENDS.map((amount) => ({
    symbol: `+ ${amount}`,
    description: `Ajoute ${amount}`,
    apply: (value) => value + amount,
  })),
  ADDENDS.map((amount) => ({
    symbol: `− ${amount}`,
    description: `Soustrais ${amount}`,
    apply: (value) => value - amount,
  })),
  [2, 3, 4, 5, 6].map((factor) => ({
    symbol: `× ${factor}`,
    description: `Multiplie par ${factor}`,
    apply: (value) => value * factor,
  })),
  [2, 3, 4, 5, 6, 7, 8, 9].map((divisor) => ({
    symbol: `÷ ${divisor}`,
    description: `Divise par ${divisor}`,
    apply: (value) => value / divisor,
  })),
  [
    { symbol: 'x²', description: 'Élève au carré', caption: 'Carré', apply: (value) => value ** 2 },
    { symbol: 'x³', description: 'Élève au cube', caption: 'Cube', apply: (value) => value ** 3 },
  ],
  [
    {
      symbol: '√x',
      description: 'Prends la racine carrée',
      caption: 'Racine carrée',
      apply: Math.sqrt,
    },
  ],
  [
    { symbol: '× ¼', description: 'Prends le quart', apply: (value) => value / 4 },
    {
      symbol: '× ⅗',
      description: 'Prends les trois cinquièmes',
      apply: (value) => (value * 3) / 5,
    },
    {
      symbol: '× 2⅓',
      description: 'Multiplie par deux et un tiers',
      caption: 'Deux et un tiers',
      apply: (value) => (value * 7) / 3,
    },
    { symbol: '× 10 %', description: 'Prends dix pour cent', apply: (value) => value / 10 },
  ],
];

export function createArithmeticChain(
  previousStart?: number,
  random: () => number = Math.random,
): ArithmeticChain {
  const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)];
  const start = pick(STARTING_NUMBERS.filter((value) => value !== previousStart));
  const visited = new Set([start]);
  const steps: ChainStep[] = [];
  let value = start;
  let previousGroup = -1;

  for (let index = 0; index < STEP_COUNT; index++) {
    const groups = OPERATION_GROUPS.map((operations, group) => ({
      group,
      steps: operations
        .map((operation) => ({ operation, result: operation.apply(value) }))
        .filter(
          ({ result }) =>
            Number.isSafeInteger(result) &&
            result > 0 &&
            result <= MAX_VALUE &&
            !visited.has(result),
        ),
    })).filter(({ steps }) => steps.length > 0);

    // The twelve addends and subtrahends leave an unvisited result at either end of the range.
    const different = groups.filter(({ group }) => group !== previousGroup);
    const choice = pick(different.length ? different : groups);
    const step = pick(choice.steps);
    steps.push(step);
    visited.add(step.result);
    value = step.result;
    previousGroup = choice.group;
  }

  return { start, steps, answer: value };
}
