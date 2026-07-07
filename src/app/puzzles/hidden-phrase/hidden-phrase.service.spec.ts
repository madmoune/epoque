import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { RecentRandomPicker } from '../shared/recent-random-picker';
import { HiddenPhraseService } from './hidden-phrase.service';

describe('HiddenPhraseService', () => {
  it('creates a puzzle whose useful letters rebuild the hidden phrase', () => {
    const service = Object.create(HiddenPhraseService.prototype) as any;

    service.phrases = ['La coureuse change de plan sans paniquer'];
    service.recentPhrases = new RecentRandomPicker<string>(45);
    service.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    service.standardNoiseLetters = 'EEEEEEEEAAAAAAASSSSSSIIIINNNNRRRRTTTTLLLLUUUOOODDCCMMPPVVBBG';
    service.preferredRows = 11;
    service.preferredCols = 11;

    const puzzle = service.createPuzzle();
    const usefulLetters = puzzle.tiles
      .filter((tile: any) => !tile.isNoise)
      .map((tile: any) => tile.letter)
      .join('');

    expect(usefulLetters).toBe(puzzle.normalizedPhrase);
    expect(puzzle.normalizedPhrase).toBe(service.normalize(puzzle.phrase));
    expect(puzzle.rows).toBe(11);
    expect(puzzle.cols).toBe(11);
    expect(puzzle.tiles).toHaveLength(puzzle.rows * puzzle.cols);
    expect(puzzle.tiles.filter((tile: any) => tile.isNoise)).toHaveLength(puzzle.noiseCount);
    expect(puzzle.noiseCount).toBeGreaterThanOrEqual(Math.floor(puzzle.normalizedPhrase.length * 0.5));
    expect(puzzle.noiseLetters.every((letter: string) => !puzzle.normalizedPhrase.includes(letter))).toBe(true);
    expect(puzzle.noiseLetters.length).toBeGreaterThanOrEqual(8);
    expect(puzzle.noiseLetters.sort()).toEqual(service.availableNoiseLetters(puzzle.normalizedPhrase).sort());
    expect(
      puzzle.tiles
        .filter((tile: any) => tile.isNoise)
        .every((tile: any) => puzzle.noiseLetters.includes(tile.letter)),
    ).toBe(true);
    expect(
      puzzle.tiles
        .filter((tile: any) => tile.isNoise)
        .every((tile: any) => !puzzle.normalizedPhrase.includes(tile.letter)),
    ).toBe(true);
    expect(hasRepeatedNoiseRun(puzzle.tiles, 3)).toBe(false);

    const normalizedWords = puzzle.phrase
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toUpperCase()
      .match(/[A-Z]+/g) ?? [];
    const realTileIndexes = puzzle.tiles
      .map((tile: any, tileIndex: number) => ({ tile, tileIndex }))
      .filter(({ tile }: any) => !tile.isNoise)
      .map(({ tileIndex }: any) => tileIndex);
    let realLetterOffset = 0;

    for (const word of normalizedWords) {
      if (word.length > 2) {
        const wordRealTileIndexes = realTileIndexes.slice(realLetterOffset, realLetterOffset + word.length);
        const hasNoiseInsideWord = wordRealTileIndexes.some((tileIndex: number, index: number) => {
          return index > 0 && tileIndex - wordRealTileIndexes[index - 1] > 1;
        });

        expect(hasNoiseInsideWord).toBe(true);
        expect(longestConsecutiveRun(wordRealTileIndexes)).toBeLessThanOrEqual(2);
      }

      realLetterOffset += word.length;
    }
  });
});

function longestConsecutiveRun(indexes: number[]): number {
  return indexes.reduce(
    (state, tileIndex, index) => {
      const currentRun = index > 0 && tileIndex === indexes[index - 1] + 1 ? state.currentRun + 1 : 1;

      return {
        currentRun,
        longestRun: Math.max(state.longestRun, currentRun),
      };
    },
    { currentRun: 0, longestRun: 0 },
  ).longestRun;
}

function hasRepeatedNoiseRun(tiles: any[], targetLength: number): boolean {
  let currentLetter = '';
  let currentRun = 0;

  for (const tile of tiles) {
    if (!tile.isNoise || tile.letter !== currentLetter) {
      currentLetter = tile.isNoise ? tile.letter : '';
      currentRun = tile.isNoise ? 1 : 0;
    } else {
      currentRun += 1;
    }

    if (currentRun >= targetLength) {
      return true;
    }
  }

  return false;
}
