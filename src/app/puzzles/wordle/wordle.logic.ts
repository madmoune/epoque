export type WordleTileState = 'empty' | 'tbd' | 'correct' | 'present' | 'absent';

export type WordleTile = {
  letter: string;
  state: WordleTileState;
};

export function normalizeWordleWord(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{Letter}]/gu, '')
    .toLocaleLowerCase('fr-CA');
}

export function scoreWordleGuess(guess: string, target: string): WordleTile[] {
  const guessLetters = [...normalizeWordleWord(guess)];
  const targetLetters = [...normalizeWordleWord(target)];
  const displayLetters = [...guess.normalize('NFC').toLocaleUpperCase('fr-CA')];
  const states: WordleTileState[] = guessLetters.map(() => 'absent');
  const remainingTargetLetters = new Map<string, number>();

  for (const letter of targetLetters) {
    remainingTargetLetters.set(letter, (remainingTargetLetters.get(letter) ?? 0) + 1);
  }

  for (let index = 0; index < guessLetters.length; index += 1) {
    if (guessLetters[index] !== targetLetters[index]) {
      continue;
    }

    states[index] = 'correct';
    remainingTargetLetters.set(
      guessLetters[index],
      (remainingTargetLetters.get(guessLetters[index]) ?? 0) - 1,
    );
  }

  for (let index = 0; index < guessLetters.length; index += 1) {
    if (states[index] === 'correct') {
      continue;
    }

    const remainingCount = remainingTargetLetters.get(guessLetters[index]) ?? 0;

    if (remainingCount > 0) {
      states[index] = 'present';
      remainingTargetLetters.set(guessLetters[index], remainingCount - 1);
    }
  }

  return states.map((state, index) => ({
    letter: displayLetters[index] ?? guessLetters[index]?.toLocaleUpperCase('fr-CA') ?? '',
    state,
  }));
}
