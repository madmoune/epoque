import { range, shuffle } from '../new-games/random';

export interface CalculationStick {
  readonly id: number;
  readonly symbol: string;
  readonly vertical: boolean;
  readonly x: number;
  readonly y: number;
  readonly angle: number;
}

export interface CalculationSticksPuzzle {
  readonly sticks: readonly CalculationStick[];
  readonly answer: number;
  readonly product: string;
  readonly productValue: number;
}

export const STICK_LENGTH = 84;

export function createCalculationSticks(
  previous?: CalculationSticksPuzzle,
  random = Math.random,
): CalculationSticksPuzzle {
  const choose = <T>(values: readonly T[]) => values[Math.floor(random() * values.length)];
  const multiplicand = choose(range(18).map((index) => index + 12));
  const multiplier = choose([2, 3, 4, 5, 6]);
  const subtrahend = choose([2, 3, 4, 5, 6, 7, 8, 9]);
  const productValue = multiplicand * multiplier;
  const addend = choose(
    range(26)
      .map((index) => index + 12)
      .filter((value) => value + productValue - subtrahend !== previous?.answer),
  );
  const product = choose([`${multiplicand}×${multiplier}`, `${multiplier}×${multiplicand}`]);
  const expression = choose([
    `${addend}+${product}−${subtrahend}`,
    `${addend}−${subtrahend}+${product}`,
    `${product}+${addend}−${subtrahend}`,
    `${product}−${subtrahend}+${addend}`,
  ]);

  const tilt = choose([-12, -7, 8, 12]);
  const rotation = (tilt * Math.PI) / 180;
  const horizontalOffsets = shuffle([-24, -8, 8, 24], random);
  const verticalOffsets = shuffle([-26, -13, 0, 13, 26], random);
  const sticks = [...expression].map((symbol, id) => {
    // Every stick crosses the next one. The next layer stays blocked until the top is lifted.
    const vertical = id % 2 === 0;
    const offset = (vertical ? verticalOffsets : horizontalOffsets)[Math.floor(id / 2)];
    return {
      id,
      symbol,
      vertical,
      x: 50 + offset * (vertical ? Math.cos(rotation) : -Math.sin(rotation)),
      y: 50 + offset * (vertical ? Math.sin(rotation) : Math.cos(rotation)),
      angle: tilt + (vertical ? 90 : 0),
    };
  });

  return {
    sticks,
    answer: addend + productValue - subtrahend,
    product: formatCalculationSticks(product),
    productValue,
  };
}

export function formatCalculationSticks(symbols: string): string {
  return symbols.replace(/[+−×]/g, (symbol) => ` ${symbol} `).trim();
}
