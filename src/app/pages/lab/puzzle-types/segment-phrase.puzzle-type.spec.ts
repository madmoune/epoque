import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { LabPage } from '../lab.page';
import { SEGMENT_PHRASE_DEFINITIONS } from './segment-phrase.puzzle-type';

const SUPPORTED_LETTERS = /^[A-JLOPSU]+$/;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('segment-phrase definitions', () => {
  const labPage = Object.create(LabPage.prototype) as any;

  it('uses readable filler words and valid answer-word mappings', () => {
    for (const definition of SEGMENT_PHRASE_DEFINITIONS) {
      const words = definition.definition.split(/\s+/).filter(Boolean);

      expect(definition.answerWordIndexes).toHaveLength(definition.answer.length);
      expect(new Set(definition.answerWordIndexes).size).toBe(definition.answer.length);
      expect(definition.answerWordIndexes).toEqual(
        [...definition.answerWordIndexes].sort((first, second) => first - second),
      );
      expect(words.length).toBeGreaterThan(definition.answer.length);
      expect(Math.max(...definition.answerWordIndexes)).toBeLessThan(words.length);

      for (const word of words) {
        expect(normalize(word)).toMatch(SUPPORTED_LETTERS);
      }
    }
  });

  it('forms every answer letter while leaving intact letters in encoded words', () => {
    for (const definition of SEGMENT_PHRASE_DEFINITIONS) {
      const words = definition.definition.split(/\s+/).filter(Boolean);

      definition.answerWordIndexes.forEach((wordIndex, answerIndex) => {
        const letters = [...normalize(words[wordIndex])];
        const fullMasks = letters.map((letter) => labPage.segmentPhraseLetterMask(letter));
        const targetMask = labPage.segmentPhraseLetterMask(definition.answer[answerIndex]);

        for (let seed = 1; seed <= 24; seed += 1) {
          const context = `${definition.id}: ${words[wordIndex]} -> ${definition.answer[answerIndex]} (seed ${seed})`;
          const missingMasks = labPage.segmentPhraseMissingMasks(
            fullMasks,
            targetMask,
            seededRandom(seed),
          );
          const combinedMissingMask = targetMask.map((_: boolean, segmentIndex: number) =>
            missingMasks.some((mask: boolean[]) => mask[segmentIndex]),
          );

          expect(combinedMissingMask, context).toEqual(targetMask);
          expect(
            Math.max(...missingMasks.map((mask: boolean[]) => mask.filter(Boolean).length)),
            context,
          ).toBeLessThanOrEqual(1);
          expect(
            missingMasks.some((mask: boolean[]) => mask.every((missing) => !missing)),
            context,
          ).toBe(true);
        }
      });
    }
  });

  it('leaves every context word completely intact', () => {
    for (const definition of SEGMENT_PHRASE_DEFINITIONS) {
      const figure = labPage.createSegmentPhraseFigure(seededRandom(7), {
        id: `segment-phrase-example-${definition.id}`,
      });
      const answerWordIndexes = new Set(definition.answerWordIndexes);
      const segmentPhraseWords = figure.segmentPhraseWords ?? [];

      segmentPhraseWords.forEach((word: any, wordIndex: number) => {
        const missingSegmentCount = word.letters
          .flatMap((letter: any) => letter.missingSegments)
          .filter(Boolean).length;

        if (answerWordIndexes.has(wordIndex)) {
          expect(missingSegmentCount).toBeGreaterThan(0);
        } else {
          expect(missingSegmentCount).toBe(0);
        }
      });
    }
  });
});
