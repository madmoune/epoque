import { range, shuffle } from './random';

export interface CryptarithmPuzzle {
  terms: [string, string, string];
  letters: string[];
  solution: Record<string, number>;
  givens: Record<string, number>;
}

export function isCryptarithmSolved(
  puzzle: Pick<CryptarithmPuzzle, 'terms' | 'letters' | 'givens'>,
  values: Record<string, number>,
): boolean {
  const digits = puzzle.letters.map((letter) => values[letter]);
  if (digits.some((digit) => !Number.isInteger(digit) || digit < 0 || digit > 9)) return false;
  if (new Set(digits).size !== digits.length) return false;
  if (!Object.entries(puzzle.givens).every(([letter, digit]) => values[letter] === digit))
    return false;
  if (puzzle.terms.some((term) => values[term[0]] === 0)) return false;
  const numbers = puzzle.terms.map((term) =>
    Number([...term].map((letter) => values[letter]).join('')),
  );
  return numbers[0] + numbers[1] === numbers[2];
}

/** Column-by-column search also checks carries, including the last carry. */
export function solveCryptarithm(
  puzzle: Pick<CryptarithmPuzzle, 'terms' | 'givens'>,
  limit = 2,
): Record<string, number>[] {
  const values: Record<string, number> = { ...puzzle.givens };
  const used = new Set(Object.values(values));
  const leading = new Set(puzzle.terms.map((term) => term[0]));
  const solutions: Record<string, number>[] = [];
  if (
    used.size !== Object.keys(values).length ||
    Object.entries(values).some(
      ([letter, digit]) =>
        !Number.isInteger(digit) || digit < 0 || digit > 9 || (digit === 0 && leading.has(letter)),
    )
  )
    return [];

  const reversed = puzzle.terms.map((term) => [...term].reverse());
  const width = Math.max(...puzzle.terms.map((term) => term.length));
  const assign = (letter: string | undefined, next: (digit: number) => void): void => {
    if (!letter) {
      next(0);
      return;
    }
    if (values[letter] !== undefined) {
      next(values[letter]);
      return;
    }
    for (const digit of range(10)) {
      if (used.has(digit) || (digit === 0 && leading.has(letter))) continue;
      values[letter] = digit;
      used.add(digit);
      next(digit);
      used.delete(digit);
      delete values[letter];
      if (solutions.length >= limit) return;
    }
  };
  const visit = (column: number, carry: number): void => {
    if (solutions.length >= limit) return;
    if (column === width) {
      if (carry === 0) solutions.push({ ...values });
      return;
    }
    assign(reversed[0][column], (a) =>
      assign(reversed[1][column], (b) => {
        const sum = a + b + carry;
        assign(reversed[2][column], (c) => {
          if (c === sum % 10) visit(column + 1, Math.floor(sum / 10));
        });
      }),
    );
  };
  visit(0, 0);
  return solutions;
}

export function createCryptarithm(): CryptarithmPuzzle {
  // Short additions are readable at a glance; at most two digits are supplied.
  for (let attempt = 0; attempt < 250; attempt++) {
    const a = 20 + Math.floor(Math.random() * 480);
    const b = 20 + Math.floor(Math.random() * 480);
    const numbers = [String(a), String(b), String(a + b)];
    const digits = [...new Set(numbers.join(''))];
    if (digits.length < 4 || digits.length > 6) continue;
    const letters = shuffle([...'ABCDEFGHLMNPRST']).slice(0, digits.length);
    const encoding = Object.fromEntries(digits.map((digit, i) => [digit, letters[i]]));
    const solution = Object.fromEntries(digits.map((digit, i) => [letters[i], Number(digit)]));
    const terms = numbers.map((number) => [...number].map((digit) => encoding[digit]).join('')) as [
      string,
      string,
      string,
    ];
    const puzzle: CryptarithmPuzzle = { terms, letters: [...letters].sort(), solution, givens: {} };
    for (const letter of shuffle(letters)) {
      if (solveCryptarithm(puzzle).length === 1) return puzzle;
      if (Object.keys(puzzle.givens).length === 2) break;
      puzzle.givens[letter] = solution[letter];
    }
  }
  // A valid fallback also keeps generation bounded if randomness is unavailable.
  return {
    terms: ['ABC', 'CBA', 'DDD'],
    letters: ['A', 'B', 'C', 'D'],
    solution: { A: 1, B: 2, C: 3, D: 4 },
    givens: { A: 1, B: 2 },
  };
}
