import { createWordFit, parseWordFitWords } from './word-fit.logic';

describe('Word fit word lists', () => {
  it('normalizes accents and ligatures and removes duplicate grid spellings', () => {
    expect(
      parseWordFitWords('  ÉNIGME \r\nénigme\ncœur\nCŒUR\n\nnœud\nforêt\nforet\næther'),
    ).toEqual(['ENIGME', 'COEUR', 'NOEUD', 'FORET', 'AETHER']);
  });

  it('only keeps whole alphabetic words that fit the twelve-cell grid', () => {
    expect(
      parseWordFitWords('dé\narc\nabcdefghijkl\nabcdefghijklm\narc-en-ciel\nl’été\nabc1\nde ux\n'),
    ).toEqual(['ARC', 'ABCDEFGHIJKL']);
  });

  it('rejects an insufficient word list without using a built-in dictionary', () => {
    expect(() => createWordFit([])).toThrow(/huit mots/);
    expect(() => createWordFit(['ENIGME', 'CIBLE', 'FORET'])).toThrow(/huit mots/);
  });

  it('stops trying when the supplied words cannot form enough crossings', () => {
    expect(() => createWordFit(['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'GGG', 'HHH'])).toThrow(
      /Impossible de créer une grille/,
    );
  });
});
