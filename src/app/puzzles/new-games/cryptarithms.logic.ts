import { range, shuffle } from './random';

export type CryptarithmMode = 'deduction' | 'classic';

export interface CryptarithmPuzzle {
  terms: [string, string, string];
  letters: string[];
  solution: Record<string, number>;
  givens: Record<string, number>;
  digits?: number[];
}

export function isCryptarithmSolved(
  puzzle: Pick<CryptarithmPuzzle, 'terms' | 'letters' | 'givens' | 'digits'>,
  values: Record<string, number>,
): boolean {
  const digits = puzzle.letters.map((letter) => values[letter]);
  if (digits.some((digit) => !Number.isInteger(digit) || digit < 0 || digit > 9)) return false;
  if (new Set(digits).size !== digits.length) return false;
  if (puzzle.digits && digits.some((digit) => !puzzle.digits!.includes(digit))) return false;
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
  puzzle: Pick<CryptarithmPuzzle, 'terms' | 'givens' | 'digits'>,
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
        !Number.isInteger(digit) ||
        digit < 0 ||
        digit > 9 ||
        (puzzle.digits && !puzzle.digits.includes(digit)) ||
        (digit === 0 && leading.has(letter)),
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
    for (const digit of puzzle.digits ?? range(10)) {
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

export interface CryptarithmDeduction {
  candidates: Record<string, number[]>;
  carries: number[][];
  solved: boolean;
}

/** Eliminate candidates using individual columns and distinct digits, without guessing. */
export function deduceCryptarithm(
  puzzle: Pick<CryptarithmPuzzle, 'terms' | 'givens' | 'digits'>,
): CryptarithmDeduction {
  const letters = [...new Set(puzzle.terms.join(''))];
  const leading = new Set(puzzle.terms.map((term) => term[0]));
  const digits = puzzle.digits ?? range(10);
  const candidates: Record<string, number[]> = Object.fromEntries(
    letters.map((letter) => [
      letter,
      digits.filter(
        (digit) =>
          (digit !== 0 || !leading.has(letter)) &&
          (puzzle.givens[letter] === undefined || puzzle.givens[letter] === digit),
      ),
    ]),
  );
  const reversed = puzzle.terms.map((term) => [...term].reverse());
  const width = Math.max(...puzzle.terms.map((term) => term.length));
  const carries = range(width + 1).map((i) => (i === 0 || i === width ? [0] : [0, 1]));
  let changed = true;
  while (changed) {
    changed = false;
    const narrow = (current: number[], supported: Set<number>): number[] => {
      const next = current.filter((value) => supported.has(value));
      if (next.length !== current.length) changed = true;
      return next;
    };

    for (const letter of letters) {
      const taken = new Set(
        letters.flatMap((other) =>
          other !== letter && candidates[other].length === 1 ? candidates[other] : [],
        ),
      );
      candidates[letter] = narrow(
        candidates[letter],
        new Set(candidates[letter].filter((digit) => !taken.has(digit))),
      );
    }
    // When the bank contains exactly one digit per letter, a digit with only one
    // remaining home must belong to that letter.
    if (digits.length === letters.length) {
      for (const digit of digits) {
        const homes = letters.filter((letter) => candidates[letter].includes(digit));
        if (homes.length === 1)
          candidates[homes[0]] = narrow(candidates[homes[0]], new Set([digit]));
      }
    }

    for (const column of range(width)) {
      const [aLetter, bLetter, cLetter] = reversed.map((term) => term[column]);
      const columnLetters = [...new Set([aLetter, bLetter, cLetter].filter(Boolean))];
      const supported: Record<string, Set<number>> = Object.fromEntries(
        columnLetters.map((letter) => [letter, new Set<number>()]),
      );
      const incoming = new Set<number>();
      const outgoing = new Set<number>();
      for (const a of aLetter ? candidates[aLetter] : [0]) {
        for (const b of bLetter ? candidates[bLetter] : [0]) {
          for (const carry of carries[column]) {
            const sum = a + b + carry;
            const c = sum % 10;
            const nextCarry = Math.floor(sum / 10);
            if (!carries[column + 1].includes(nextCarry)) continue;
            if (cLetter ? !candidates[cLetter].includes(c) : c !== 0) continue;
            const assignments = [
              [aLetter, a],
              [bLetter, b],
              [cLetter, c],
            ] as const;
            // Repeated letters must agree; different letters cannot share a digit.
            if (
              assignments.some(([letter, digit], i) =>
                assignments
                  .slice(i + 1)
                  .some(
                    ([other, value]) =>
                      letter && other && (letter === other ? digit !== value : digit === value),
                  ),
              )
            )
              continue;
            for (const [letter, digit] of assignments) {
              if (letter) supported[letter].add(digit);
            }
            incoming.add(carry);
            outgoing.add(nextCarry);
          }
        }
      }
      for (const letter of columnLetters)
        candidates[letter] = narrow(candidates[letter], supported[letter]);
      carries[column] = narrow(carries[column], incoming);
      carries[column + 1] = narrow(carries[column + 1], outgoing);
    }
  }
  const values = Object.fromEntries(letters.map((letter) => [letter, candidates[letter][0]]));
  return {
    candidates,
    carries,
    solved:
      letters.every((letter) => candidates[letter].length === 1) &&
      isCryptarithmSolved({ ...puzzle, letters }, values),
  };
}

export function createCryptarithm(mode: CryptarithmMode = 'classic'): CryptarithmPuzzle {
  if (mode === 'deduction') return createDeductionCryptarithm();
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

function createDeductionCryptarithm(): CryptarithmPuzzle {
  for (let attempt = 0; attempt < 250; attempt++) {
    const a = 100 + Math.floor(Math.random() * 900);
    const b = 100 + Math.floor(Math.random() * 900);
    const numbers = [String(a), String(b), String(a + b)];
    const digits = [...new Set(numbers.join(''))].map(Number).sort((a, b) => a - b);
    if (digits.length < 5 || digits.length > 6) continue;
    const symbols = shuffle([...'ABCDEFGHLMNPRST']).slice(0, digits.length);
    const encoding = Object.fromEntries(digits.map((digit, i) => [digit, symbols[i]]));
    const solution = Object.fromEntries(digits.map((digit, i) => [symbols[i], digit]));
    const terms = numbers.map((number) => [...number].map((digit) => encoding[digit]).join('')) as [
      string,
      string,
      string,
    ];
    const puzzle: CryptarithmPuzzle = {
      terms,
      letters: [...symbols].sort(),
      solution,
      givens: {},
      digits,
    };
    if (deduceCryptarithm(puzzle).solved) return puzzle;
    for (const letter of shuffle(symbols)) {
      puzzle.givens = { [letter]: solution[letter] };
      if (deduceCryptarithm(puzzle).solved) return puzzle;
    }
  }
  return {
    terms: ['ABC', 'DBA', 'EFF'],
    letters: ['A', 'B', 'C', 'D', 'E', 'F'],
    solution: { A: 2, B: 3, C: 4, D: 5, E: 7, F: 6 },
    givens: { B: 3 },
    digits: [2, 3, 4, 5, 6, 7],
  };
}
