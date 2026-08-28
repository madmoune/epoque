import { describe, expect, it } from 'vitest';
import {
  applySyllabicRotationMapping,
  createSyllabicRotationMapping,
  parseSyllabicRotationWord,
  selectSyllabicRotationWords,
  SYLLABIC_ROTATION_CHALLENGE,
  SYLLABIC_ROTATION_CONSONANTS,
  SYLLABIC_ROTATION_EXAMPLES,
  SYLLABIC_ROTATION_VOWELS,
  SyllabicRotationAngle,
  SyllabicRotationVowel,
} from './syllabic-rotation.puzzle-type';

describe('syllabic rotation puzzle data', () => {
  it('uses three-syllable words and covers the requested inventory', () => {
    const exampleWords = [...SYLLABIC_ROTATION_EXAMPLES];
    const words = [...exampleWords, SYLLABIC_ROTATION_CHALLENGE];
    const consonants = new Set(
      exampleWords.flatMap((word) => word.syllables.map(({ consonant }) => consonant)),
    );
    const vowels = new Set(
      exampleWords.flatMap((word) => word.syllables.map(({ vowel }) => vowel)),
    );

    expect(words).toHaveLength(4);
    expect(words.every((word) => word.syllables.length === 3)).toBe(true);
    expect(words.every((word) => !word.word.toLocaleLowerCase().includes('er'))).toBe(true);
    expect(words.every((word) => !/(.)\1/.test(word.word))).toBe(true);
    expect(consonants).toEqual(new Set(SYLLABIC_ROTATION_CONSONANTS));
    expect(vowels).toEqual(new Set(SYLLABIC_ROTATION_VOWELS));
  });

  it('keeps the challenge syllables absent from the examples', () => {
    const exampleSyllables = new Set(
      SYLLABIC_ROTATION_EXAMPLES.flatMap((word) =>
        word.syllables.map(({ consonant, vowel }) => `${consonant}${vowel}`),
      ),
    );

    expect(
      SYLLABIC_ROTATION_CHALLENGE.syllables.every(
        ({ consonant, vowel }) => !exampleSyllables.has(`${consonant}${vowel}`),
      ),
    ).toBe(true);
    expect(SYLLABIC_ROTATION_CHALLENGE.word).not.toMatch(/(.)\1/);
  });

  it('assigns one quarter-turn to each vowel', () => {
    const expectedAngles: Record<SyllabicRotationVowel, SyllabicRotationAngle> = {
      e: 0,
      a: 90,
      o: 180,
      u: 270,
    };

    for (const word of [...SYLLABIC_ROTATION_EXAMPLES, SYLLABIC_ROTATION_CHALLENGE]) {
      for (const syllable of word.syllables) {
        expect(syllable.rotation, `${word.word}: ${syllable.vowel}`).toBe(
          expectedAngles[syllable.vowel],
        );
      }
    }
  });

  it('randomizes the consonant symbols and vowel rotations per puzzle', () => {
    const firstRandom = sequenceRandom([0.01, 0.12, 0.23, 0.34, 0.45, 0.56, 0.67, 0.78]);
    const secondRandom = sequenceRandom([0.91, 0.82, 0.73, 0.64, 0.55, 0.46, 0.37, 0.28]);
    const firstMapping = createSyllabicRotationMapping(firstRandom);
    const secondMapping = createSyllabicRotationMapping(secondRandom);

    expect(firstMapping).not.toEqual(secondMapping);
    expect(new Set(Object.values(firstMapping.consonantSymbols)).size).toBe(5);
    expect(new Set(Object.values(firstMapping.vowelRotations)).size).toBe(4);

    const mappedWord = applySyllabicRotationMapping(SYLLABIC_ROTATION_CHALLENGE, firstMapping);

    for (const syllable of mappedWord.syllables) {
      expect(syllable.symbol).toBe(firstMapping.consonantSymbols[syllable.consonant]);
      expect(syllable.rotation).toBe(firstMapping.vowelRotations[syllable.vowel]);
    }
  });

  it('parses compatible words into three consonant-vowel syllables', () => {
    const parsed = parseSyllabicRotationWord('satura');

    expect(parsed?.syllables.map(({ consonant, vowel }) => `${consonant}${vowel}`)).toEqual([
      'sa',
      'tu',
      'ra',
    ]);
    expect(parseSyllabicRotationWord('chuchota')?.syllables.map(({ vowel }) => vowel)).toEqual([
      'u',
      'o',
      'a',
    ]);
    expect(parseSyllabicRotationWord('racheter')).toBeUndefined();
    expect(parseSyllabicRotationWord('chuchoter')).toBeUndefined();
    expect(parseSyllabicRotationWord('chouchota')).toBeUndefined();
    expect(parseSyllabicRotationWord('navigation')).toBeUndefined();
  });

  it('selects three examples covering the full inventory and a separate challenge', () => {
    const candidates = ['chuchota', 'sonate', 'retenu', 'satura']
      .map((word) => parseSyllabicRotationWord(word))
      .filter((word) => word !== undefined);
    const selection = selectSyllabicRotationWords(candidates, sequenceRandom([0.2, 0.4, 0.6, 0.8]));

    expect(selection?.examples).toHaveLength(3);
    expect(
      new Set(
        selection?.examples.flatMap((word) => word.syllables.map(({ consonant }) => consonant)),
      ),
    ).toEqual(new Set(SYLLABIC_ROTATION_CONSONANTS));
    expect(
      new Set(selection?.examples.flatMap((word) => word.syllables.map(({ vowel }) => vowel))),
    ).toEqual(new Set(SYLLABIC_ROTATION_VOWELS));
    expect(selection?.examples.some((word) => word.id === selection.challenge.id)).toBe(false);
  });
});

function sequenceRandom(values: readonly number[]): () => number {
  let index = 0;

  return () => values[index++ % values.length];
}
