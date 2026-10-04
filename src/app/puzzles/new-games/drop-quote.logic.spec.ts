import {
  createDropQuote,
  isDropQuoteSolved,
  normalizeDropQuotePhrase,
  parseDropQuotePhrases,
  remainingDropLetters,
} from './drop-quote.logic';

describe('Dropquote rules', () => {
  it.each([
    'Un bon indice transforme le doute en certitude',
    'Au cœur du défi, l’équipe garde son calme malgré le bruit',
    'La lettre du passe-temps révèle le mot caché',
  ])('preserves every dropped letter in its column for %s', (phrase) => {
    for (let i = 0; i < 10; i++) {
      const puzzle = createDropQuote(phrase);
      expect(puzzle.rows.every((row) => row.length === puzzle.width)).toBe(true);
      expect(puzzle.rows.map((row) => row.trim()).join(' ')).toBe(normalizeDropQuotePhrase(phrase));
      puzzle.columns.forEach((letters, col) => {
        expect([...letters].sort()).toEqual(
          puzzle.rows
            .map((row) => row[col])
            .filter((letter) => /^[A-Z]$/.test(letter))
            .sort(),
        );
      });
      expect(Object.values(puzzle.solution).every((letter) => /^[A-Z]$/.test(letter))).toBe(true);
      expect(
        puzzle.columns.every((column) =>
          column.every((letter, i) => !i || column[i - 1] <= letter),
        ),
      ).toBe(true);
      expect(isDropQuoteSolved(puzzle, puzzle.solution)).toBe(true);
      expect(isDropQuoteSolved(puzzle, {})).toBe(false);
      expect(
        remainingDropLetters(puzzle, puzzle.solution).every((column) => column.length === 0),
      ).toBe(true);
      const [cell, letter] = Object.entries(puzzle.solution)[0];
      expect(
        remainingDropLetters(puzzle, { [cell]: letter })[Number(cell) % puzzle.width].length,
      ).toBe(puzzle.columns[Number(cell) % puzzle.width].length - 1);
    }
  });

  it('filters phrases to five to seven rows and deduplicates normalized text', () => {
    const phrase = 'Au cœur du défi, l’équipe garde son calme malgré le bruit';
    const other = 'Le mot caché emprunte une lettre à chaque ligne du tableau';
    const phrases = parseDropQuotePhrases(
      [
        '',
        `  ${phrase}  `,
        "AU COEUR DU DEFI, L'EQUIPE GARDE SON CALME MALGRE LE BRUIT",
        'Trop court',
        'Le défi traverse Chaudière-Appalaches avant le dernier contrôle',
        'Les finalistes comparent plusieurs indices avant de choisir le parcours qui rejoint la rivière puis le refuge au pied du sommet',
        other,
      ].join('\r\n'),
    );
    expect(phrases).toEqual([phrase, other]);
    expect(() => createDropQuote('Chaudière-Appalaches')).toThrow();
    expect(() => createDropQuote('')).toThrow();
  });
});
