const VOWEL = /[AEIOUYŒÆ]/;
const VOWELS = /[AEIOUYŒÆ]/g;

export interface VowellessPuzzle {
  readonly key: string;
  readonly word: string;
  readonly consonants: string;
  readonly length: number;
  readonly answers: ReadonlyMap<string, string>;
}

function foldLetters(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleUpperCase('fr-CA');
}

function answerKey(value: string): string {
  return foldLetters(value).replace(/Œ/g, 'OE').replace(/Æ/g, 'AE');
}

function entryFor(word: string) {
  const spelling = word.trim().normalize('NFC').toLocaleLowerCase('fr-CA');
  const letters = foldLetters(spelling);
  const consonants = letters.replace(VOWELS, '');
  const length = letters.length;
  if (
    !/^[A-ZŒÆ]{5,11}$/.test(letters) ||
    spelling.length !== length ||
    consonants.length < 3 ||
    length - consonants.length < 2
  ) {
    return null;
  }
  return { key: `${length}:${consonants}`, word: spelling, consonants, length };
}

export function indexVowellessWords(source: string, alternatives: string): VowellessPuzzle[] {
  const puzzles = new Map<
    string,
    Omit<VowellessPuzzle, 'answers'> & { answers: Map<string, string> }
  >();

  for (const line of source.split(/\r?\n/)) {
    const entry = entryFor(line);
    if (!entry) continue;
    const puzzle = puzzles.get(entry.key) ?? { ...entry, answers: new Map<string, string>() };
    const key = answerKey(entry.word);
    if (!puzzle.answers.has(key)) puzzle.answers.set(key, entry.word);
    puzzles.set(entry.key, puzzle);
  }

  for (const line of alternatives.split(/\r?\n/)) {
    const entry = entryFor(line);
    if (!entry) continue;
    const answers = puzzles.get(entry.key)?.answers;
    const key = answerKey(entry.word);
    if (answers && !answers.has(key)) answers.set(key, entry.word);
  }

  return [...puzzles.values()];
}

export function resolveVowellessAnswer(puzzle: VowellessPuzzle, value: string): string | null {
  return puzzle.answers.get(answerKey(value)) ?? null;
}

export function vowelHint(word: string, vowelsToReveal: number): (string | null)[] {
  let revealed = 0;
  return [...word.toLocaleUpperCase('fr-CA')].map((letter) => {
    if (!VOWEL.test(foldLetters(letter))) return letter;
    return revealed++ < vowelsToReveal ? letter : null;
  });
}
