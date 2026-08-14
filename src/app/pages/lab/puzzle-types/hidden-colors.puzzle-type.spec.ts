import { describe, expect, it } from 'vitest';
import { HIDDEN_COLOR_DEFINITIONS } from './hidden-colors.puzzle-type';

describe('hidden color definitions', () => {
  it('places each color in the indicated direction', () => {
    for (const definition of HIDDEN_COLOR_DEFINITIONS) {
      const segment = definition.answer.slice(
        definition.colorStart,
        definition.colorStart + definition.colorLength,
      );
      const visibleColor =
        definition.direction === 'left' ? [...segment].reverse().join('') : segment;

      expect(visibleColor, definition.id).toBe(definition.color);
    }
  });

  it('extracts NATURE in definition order', () => {
    expect(HIDDEN_COLOR_DEFINITIONS.map((definition) => definition.extractedLetter).join('')).toBe(
      'NATURE',
    );

    for (const definition of HIDDEN_COLOR_DEFINITIONS) {
      const colorEnd = definition.colorStart + definition.colorLength;
      const nonColorLetters = [...definition.answer].filter(
        (_, index) => index < definition.colorStart || index >= colorEnd,
      );

      expect(nonColorLetters[definition.extractedSlotIndex], definition.id).toBe(
        definition.extractedLetter,
      );
    }
  });
});
