import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RecentRandomPicker } from '../shared/recent-random-picker';

export type HiddenPhraseTile = {
  id: string;
  letter: string;
  isNoise: boolean;
};

export type HiddenPhrasePuzzle = {
  phrase: string;
  normalizedPhrase: string;
  rows: number;
  cols: number;
  tiles: HiddenPhraseTile[];
  noiseLetters: string[];
  noiseCount: number;
};

@Injectable({
  providedIn: 'root',
})
export class HiddenPhraseService {
  private readonly http = inject(HttpClient);
  private readonly recentPhrases = new RecentRandomPicker<string>(45);
  private readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private readonly standardNoiseLetters = 'EEEEEEEEAAAAAAASSSSSSIIIINNNNRRRRTTTTLLLLUUUOOODDCCMMPPVVBBG';
  private readonly preferredRows = 11;
  private readonly preferredCols = 11;

  private phrases: string[] = [];

  async loadPhrases(): Promise<void> {
    if (this.phrases.length > 0) {
      return;
    }

    const text = await firstValueFrom(
      this.http.get('mid-mid-sentences.txt', {
        responseType: 'text',
      }),
    );

    const phrases = text
      .split(/\r?\n/)
      .map((phrase) => phrase.trim())
      .filter((phrase) => {
        const normalizedWords = this.normalizeWords(phrase);
        const normalizedPhrase = normalizedWords.join('');

        return (
          normalizedPhrase.length >= 18 &&
          this.availableNoiseLetters(normalizedPhrase).length >= 4 &&
          this.fitsPreferredGrid(normalizedWords)
        );
      });

    if (phrases.length === 0) {
      throw new Error('The phrase list is empty.');
    }

    this.phrases = phrases;
  }

  createPuzzle(): HiddenPhrasePuzzle {
    if (this.phrases.length === 0) {
      throw new Error('Hidden phrase phrases have not been loaded yet.');
    }

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const phrase = this.recentPhrases.pick(this.phrases, (candidate) => this.normalize(candidate));
      const puzzle = this.createPuzzleForPhrase(phrase);

      if (this.hasValidNoiseLetters(puzzle)) {
        return puzzle;
      }
    }

    throw new Error('Unable to create a hidden phrase puzzle.');
  }

  private createPuzzleForPhrase(phrase: string): HiddenPhrasePuzzle {
    const normalizedWords = this.normalizeWords(phrase);
    const normalizedPhrase = normalizedWords.join('');
    const minimumNoiseCount = this.minimumNoiseCountForWords(normalizedWords);
    const dimensions = this.pickDimensions(normalizedPhrase.length, minimumNoiseCount);
    const targetNoiseCount = dimensions.rows * dimensions.cols - normalizedPhrase.length;
    const noiseLetters = this.pickNoiseLetters(normalizedPhrase);
    const noisePerGap = this.distributeNoiseThroughWords(normalizedWords, targetNoiseCount);
    const tiles: HiddenPhraseTile[] = [];
    let noiseIndex = 0;

    normalizedPhrase.split('').forEach((letter, index) => {
      this.addNoiseTiles(tiles, noisePerGap[index], noiseIndex, noiseLetters);
      noiseIndex += noisePerGap[index];

      tiles.push({
        id: `real-${index}`,
        letter,
        isNoise: false,
      });
    });

    this.addNoiseTiles(tiles, noisePerGap[normalizedPhrase.length], noiseIndex, noiseLetters);

    return {
      phrase,
      normalizedPhrase,
      rows: dimensions.rows,
      cols: dimensions.cols,
      tiles,
      noiseLetters,
      noiseCount: targetNoiseCount,
    };
  }

  private pickDimensions(phraseLength: number, minimumNoiseCount: number): { rows: number; cols: number } {
    const minimumTileCount = phraseLength + minimumNoiseCount;

    if (minimumTileCount <= this.preferredRows * this.preferredCols) {
      return { rows: this.preferredRows, cols: this.preferredCols };
    }

    return {
      rows: Math.ceil(minimumTileCount / this.preferredCols),
      cols: this.preferredCols,
    };
  }

  private fitsPreferredGrid(words: string[]): boolean {
    const phraseLength = words.reduce((sum, word) => sum + word.length, 0);

    return (
      phraseLength + this.minimumNoiseCountForWords(words) <=
      this.preferredRows * this.preferredCols
    );
  }

  normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase();
  }

  private normalizeWords(value: string): string[] {
    return value
      .split(/\s+/)
      .map((word) => this.normalize(word))
      .filter(Boolean);
  }

  private distributeNoiseThroughWords(words: string[], targetNoiseCount: number): number[] {
    const totalLetterCount = words.reduce((sum, word) => sum + word.length, 0);
    const noisePerGap = Array.from({ length: totalLetterCount + 1 }, () => 0);
    const internalGapIndexes: number[] = [];
    let letterOffset = 0;
    let placedNoiseCount = 0;

    for (const word of words) {
      const wordGapIndexes = Array.from({ length: Math.max(0, word.length - 1) }, (_, index) => {
        return letterOffset + index + 1;
      });

      internalGapIndexes.push(...wordGapIndexes);

      for (let gapIndex = letterOffset + 2; gapIndex < letterOffset + word.length; gapIndex += 2) {
        if (placedNoiseCount >= targetNoiseCount) {
          break;
        }

        noisePerGap[gapIndex] += 1;
        placedNoiseCount += 1;
      }

      letterOffset += word.length;
    }

    const preferredGapIndexes = internalGapIndexes.length > 0 ? internalGapIndexes : noisePerGap.map((_, index) => index);

    while (placedNoiseCount < targetNoiseCount) {
      const gapIndex = this.randomItem(preferredGapIndexes);

      if (noisePerGap[gapIndex] >= 2 && preferredGapIndexes.some((index) => noisePerGap[index] < 2)) {
        continue;
      }

      noisePerGap[gapIndex] += 1;
      placedNoiseCount += 1;
    }

    return noisePerGap;
  }

  private minimumNoiseCountForWords(words: string[]): number {
    return words.reduce((count, word) => count + Math.floor((word.length - 1) / 2), 0);
  }

  private pickNoiseLetters(normalizedPhrase: string): string[] {
    return this.availableNoiseLetters(normalizedPhrase);
  }

  private availableStandardNoiseLetters(normalizedPhrase: string): string[] {
    const phraseLetters = new Set(normalizedPhrase.split(''));
    const commonLetters = this.shuffle([...new Set(this.standardNoiseLetters.split(''))].filter(
      (letter) => !phraseLetters.has(letter),
    ));
    const extraLetters = this.shuffle(
      this.alphabet.split('').filter((letter) => !phraseLetters.has(letter) && !commonLetters.includes(letter)),
    );

    return [...commonLetters, ...extraLetters];
  }

  private availableNoiseLetters(normalizedPhrase: string): string[] {
    const phraseLetters = new Set(normalizedPhrase.split(''));

    return this.alphabet.split('').filter((letter) => !phraseLetters.has(letter));
  }

  private hasValidNoiseLetters(puzzle: HiddenPhrasePuzzle): boolean {
    const phraseLetters = new Set(puzzle.normalizedPhrase.split(''));

    return puzzle.tiles.every((tile) => !tile.isNoise || !phraseLetters.has(tile.letter));
  }

  private addNoiseTiles(
    tiles: HiddenPhraseTile[],
    count: number,
    startIndex: number,
    noiseLetters: string[],
  ): void {
    for (let index = 0; index < count; index += 1) {
      const previousLetter = tiles.at(-1)?.letter ?? null;

      tiles.push({
        id: `noise-${startIndex + index}`,
        letter: this.randomNoiseLetter(noiseLetters, previousLetter),
        isNoise: true,
      });
    }
  }

  private randomNoiseLetter(noiseLetters: string[], previousLetter: string | null): string {
    const candidates =
      previousLetter && noiseLetters.length > 1
        ? noiseLetters.filter((letter) => letter !== previousLetter)
        : noiseLetters;

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private randomItem<T>(values: T[]): T {
    return values[Math.floor(Math.random() * values.length)];
  }

  private shuffle<T>(values: T[]): T[] {
    const shuffled = [...values];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
  }
}
