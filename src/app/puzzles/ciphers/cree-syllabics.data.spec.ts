import { describe, expect, it } from 'vitest';
import {
  CREE_FINALS,
  CREE_LEARNING_SYMBOLS,
  CREE_SYLLABIC_COLUMNS,
  CREE_SYLLABIC_ROWS,
  encodeFrenchTextAsEasternCree,
  encodeFrenchWordAsEasternCree,
} from './cree-syllabics.data';

describe('Eastern Cree syllabics data', () => {
  it('contains the complete talking-chart rows, columns and finals', () => {
    expect(CREE_SYLLABIC_COLUMNS.map((column) => column.label)).toEqual([
      'e',
      'we',
      'i',
      'ii',
      'u',
      'uu',
      'a',
      'aa',
      'waa',
    ]);
    expect(CREE_SYLLABIC_ROWS).toHaveLength(15);
    expect(CREE_SYLLABIC_ROWS.find((row) => row.label === 'K')?.cells[8]).toMatchObject({
      glyph: 'ᒀ',
      reading: 'kwaa',
    });
    expect(CREE_FINALS.find((final) => final.label === 'SH')).toMatchObject({
      glyph: 'ᔥ',
      reading: 'sh',
    });
    expect(CREE_LEARNING_SYMBOLS).toContainEqual({
      glyph: 'ᐁ',
      reading: 'e',
      audioKey: 'e',
    });
    expect(CREE_LEARNING_SYMBOLS.find((symbol) => symbol.glyph === 'ᔥ')).toEqual(
      expect.objectContaining({
        reading: 'sh',
        audioKey: 'sh',
        isFinal: true,
      }),
    );
  });
});

describe('French to Eastern Cree sound transcription', () => {
  it.each([
    ['canotage', 'ᑳᓍᑖᔥ', 'kaa·nwaa·taa·sh'],
    ['aviron', 'ᐋᕖᕎᓐ', 'aa·vii·rwaa·n'],
    ['pagayage', 'ᐹᑳᔮᔥ', 'paa·kaa·yaa·sh'],
    ['rame', 'ᕌᒻ', 'raa·m'],
    ['rythme', 'ᕇᑦᒻ', 'rii·t·m'],
    ['papillon', 'ᐹᐲᔻᓐ', 'paa·pii·ywaa·n'],
    ['rivière', 'ᕇᕝᔦᕐ', 'rii·v·ye·r'],
  ])('approximates the French pronunciation of %s', (word, glyphs, roman) => {
    const encoded = encodeFrenchWordAsEasternCree(word);

    expect(encoded.tokens.map((token) => token.glyph).join('')).toBe(glyphs);
    expect(encoded.roman).toBe(roman);
    expect(encoded.tokens.every((token) => token.audioKey.length > 0)).toBe(true);
  });

  it('transcribes words while preserving punctuation and spacing', () => {
    expect(encodeFrenchTextAsEasternCree('Canotage, rame!')).toBe('ᑳᓍᑖᔥ, ᕌᒻ!');
  });
});
