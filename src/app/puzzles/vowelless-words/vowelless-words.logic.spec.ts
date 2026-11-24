import { describe, expect, it } from 'vitest';
import { indexVowellessWords, resolveVowellessAnswer, vowelHint } from './vowelless-words.logic';

describe('Mots sans voyelles', () => {
  it('groups words by ordered consonants and length and includes compatible lexical variants', () => {
    const puzzles = indexVowellessWords(
      'porter\r\nPORTER\r\nportage\r\nà part',
      'partir\nportier\nprotège',
    );
    expect(puzzles.map(({ key }) => key)).toEqual(['6:PRTR', '7:PRTG']);
    expect(resolveVowellessAnswer(puzzles[0], ' PARTIR ')).toBe('partir');
    expect(resolveVowellessAnswer(puzzles[0], 'portier')).toBeNull();
    expect(resolveVowellessAnswer(puzzles[0], 'por ter')).toBeNull();
    expect(resolveVowellessAnswer(puzzles[1], 'protege')).toBe('protège');
  });

  it('removes accented vowels, Y and ligatures while preserving the original letters for hints', () => {
    const puzzles = indexVowellessWords('rythme\nœillet\ngénérique\nœuf', '');
    expect(puzzles.map(({ key }) => key)).toEqual(['6:RTHM', '6:LLT', '9:GNRQ']);
    expect(vowelHint('rythme', 0)).toEqual(['R', null, 'T', 'H', 'M', null]);
    expect(vowelHint('rythme', 1)).toEqual(['R', 'Y', 'T', 'H', 'M', null]);
    expect(vowelHint('générique', 1)).toEqual(['G', 'É', 'N', null, 'R', null, 'Q', null, null]);
    expect(resolveVowellessAnswer(puzzles[1], 'OEILLET')).toBe('œillet');
    expect(resolveVowellessAnswer(puzzles[2], 'Ge\u0301ne\u0301rique')).toBe('générique');
  });
});
