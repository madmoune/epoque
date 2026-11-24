import { shuffle } from '../new-games/random';

export const CODE_LENGTH = 4;
const CLUE_COUNT = 5;
const DIGITS = [...'0123456789'];
const ALL_CODES = enumerateCodes('');

// Ces cinq essais isolent 0123. Une permutation des chiffres conserve les indices.
const FALLBACK_ATTEMPTS = ['3526', '0419', '7291', '3164', '0753'];

export type CodeClue = {
  attempt: string;
  wellPlaced: number;
  misplaced: number;
};

type CodeDeductionPuzzle = {
  solution: string;
  clues: CodeClue[];
};

export function createCodeDeductionPuzzle(previousSolution?: string): CodeDeductionPuzzle {
  const digits = shuffle(DIGITS);
  if (digits.slice(0, CODE_LENGTH).join('') === previousSolution) {
    [digits[CODE_LENGTH - 1], digits[CODE_LENGTH]] = [digits[CODE_LENGTH], digits[CODE_LENGTH - 1]];
  }

  const solution = digits.slice(0, CODE_LENGTH).join('');
  const clues: CodeClue[] = [];
  let candidates = ALL_CODES;

  for (const attempt of shuffle(ALL_CODES)) {
    const clue = scoreAttempt(attempt, solution);
    if (clue.wellPlaced + clue.misplaced !== 2) continue;

    const matchingCodes = candidates.filter((code) => {
      const { wellPlaced, misplaced } = scoreAttempt(attempt, code);
      return wellPlaced === clue.wellPlaced && misplaced === clue.misplaced;
    });

    const isFinalClue = clues.length === CLUE_COUNT - 1;
    const isolatesSolution = matchingCodes.length === 1;
    if (matchingCodes.length === candidates.length || isolatesSolution !== isFinalClue) continue;

    clues.push(clue);
    if (isFinalClue) return { solution, clues };
    candidates = matchingCodes;
  }

  return {
    solution,
    clues: shuffle(FALLBACK_ATTEMPTS).map((attempt) =>
      scoreAttempt([...attempt].map((digit) => digits[Number(digit)]).join(''), solution),
    ),
  };
}

function enumerateCodes(prefix: string): string[] {
  if (prefix.length === CODE_LENGTH) return [prefix];

  return DIGITS.filter((digit) => !prefix.includes(digit)).flatMap((digit) =>
    enumerateCodes(prefix + digit),
  );
}

function scoreAttempt(attempt: string, code: string): CodeClue {
  let wellPlaced = 0;
  let misplaced = 0;

  for (let index = 0; index < CODE_LENGTH; index++) {
    const digit = attempt[index];
    if (digit === code[index]) wellPlaced++;
    else if (code.includes(digit)) misplaced++;
  }

  return { attempt, wellPlaced, misplaced };
}
