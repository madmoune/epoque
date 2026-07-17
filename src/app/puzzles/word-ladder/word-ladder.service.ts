import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type WordLadderPuzzle = {
  start: string;
  target: string;
  letterCount: number;
  minimumMoves: number;
};

@Injectable({
  providedIn: 'root',
})
export class WordLadderService {
  private readonly http = inject(HttpClient);
  private readonly minimumMoves = 3;
  private readonly maximumMoves = 7;
  private readonly maximumGenerationAttempts = 400;
  private readonly recentPuzzleLimit = 80;

  private wordsByKey = new Map<string, string>();
  private wordKeysByLength = new Map<number, string[]>();
  private neighborsByKey = new Map<string, string[]>();
  private recentPuzzleKeys: string[] = [];

  async loadWords(): Promise<void> {
    if (this.wordsByKey.size > 0) {
      return;
    }

    const text = await firstValueFrom(
      this.http.get('word-ladder.txt', {
        responseType: 'text',
      }),
    );

    this.initializeWords(
      text
        .split(/\r?\n/)
        .map((word) => word.trim())
        .filter(Boolean),
    );
  }

  createPuzzle(): WordLadderPuzzle {
    if (this.wordsByKey.size === 0) {
      throw new Error('Word ladder words have not been loaded yet.');
    }

    for (const preferredOnly of [true, false]) {
      for (const ignoreRecentPuzzles of [false, true]) {
        const puzzle = this.tryCreatePuzzle(ignoreRecentPuzzles, preferredOnly);

        if (puzzle) {
          return puzzle;
        }
      }
    }

    throw new Error('Unable to create a word ladder puzzle.');
  }

  resolveWord(value: string): string | null {
    return this.wordsByKey.get(this.normalize(value)) ?? null;
  }

  areNeighbors(first: string, second: string): boolean {
    const firstKey = this.normalize(first);
    const secondKey = this.normalize(second);

    if (firstKey.length !== secondKey.length || firstKey === secondKey) {
      return false;
    }

    let differenceCount = 0;

    for (let index = 0; index < firstKey.length; index += 1) {
      if (firstKey[index] !== secondKey[index]) {
        differenceCount += 1;
      }

      if (differenceCount > 1) {
        return false;
      }
    }

    return differenceCount === 1;
  }

  sameWord(first: string, second: string): boolean {
    return this.normalize(first) === this.normalize(second);
  }

  normalizedLength(value: string): number {
    return [...this.normalize(value)].length;
  }

  normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\p{Letter}]/gu, '')
      .toLocaleLowerCase('fr-CA');
  }

  findShortestPath(
    from: string,
    target: string,
    blockedWords: Iterable<string> = [],
  ): string[] | null {
    const startKey = this.normalize(from);
    const targetKey = this.normalize(target);

    if (!this.wordsByKey.has(startKey) || !this.wordsByKey.has(targetKey)) {
      return null;
    }

    const blockedKeys = new Set([...blockedWords].map((word) => this.normalize(word)));
    blockedKeys.delete(startKey);
    blockedKeys.delete(targetKey);

    const parents = new Map<string, string | null>([[startKey, null]]);
    const queue = [startKey];

    for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
      const currentKey = queue[queueIndex];

      if (currentKey === targetKey) {
        break;
      }

      for (const neighborKey of this.neighborsByKey.get(currentKey) ?? []) {
        if (blockedKeys.has(neighborKey) || parents.has(neighborKey)) {
          continue;
        }

        parents.set(neighborKey, currentKey);
        queue.push(neighborKey);
      }
    }

    if (!parents.has(targetKey)) {
      return null;
    }

    const pathKeys: string[] = [];
    let currentKey: string | null = targetKey;

    while (currentKey !== null) {
      pathKeys.push(currentKey);
      currentKey = parents.get(currentKey) ?? null;
    }

    return pathKeys
      .reverse()
      .map((wordKey) => this.wordsByKey.get(wordKey))
      .filter((word): word is string => word !== undefined);
  }

  private initializeWords(words: string[]): void {
    const wordsByKey = new Map<string, string>();

    for (const word of words) {
      const wordKey = this.normalize(word);

      if (![4, 5].includes(wordKey.length) || wordsByKey.has(wordKey)) {
        continue;
      }

      wordsByKey.set(wordKey, word.toLocaleLowerCase('fr-CA'));
    }

    if (wordsByKey.size === 0) {
      throw new Error('The word ladder list is empty.');
    }

    const wordKeysByLength = new Map<number, string[]>([
      [4, []],
      [5, []],
    ]);

    for (const wordKey of wordsByKey.keys()) {
      wordKeysByLength.get(wordKey.length)?.push(wordKey);
    }

    const neighborSets = new Map<string, Set<string>>();
    const patternBuckets = new Map<string, string[]>();

    for (const wordKey of wordsByKey.keys()) {
      neighborSets.set(wordKey, new Set());

      for (let index = 0; index < wordKey.length; index += 1) {
        const pattern = `${wordKey.length}:${wordKey.slice(0, index)}*${wordKey.slice(index + 1)}`;
        const bucket = patternBuckets.get(pattern) ?? [];

        bucket.push(wordKey);
        patternBuckets.set(pattern, bucket);
      }
    }

    for (const bucket of patternBuckets.values()) {
      for (let firstIndex = 0; firstIndex < bucket.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < bucket.length; secondIndex += 1) {
          const firstKey = bucket[firstIndex];
          const secondKey = bucket[secondIndex];

          neighborSets.get(firstKey)?.add(secondKey);
          neighborSets.get(secondKey)?.add(firstKey);
        }
      }
    }

    this.wordsByKey = wordsByKey;
    this.wordKeysByLength = wordKeysByLength;
    this.neighborsByKey = new Map(
      [...neighborSets].map(([wordKey, neighbors]) => [wordKey, [...neighbors]]),
    );
  }

  private tryCreatePuzzle(
    ignoreRecentPuzzles: boolean,
    preferredOnly: boolean,
  ): WordLadderPuzzle | null {
    const availableLengths = [...this.wordKeysByLength]
      .filter(([, wordKeys]) => wordKeys.length > 0)
      .map(([length]) => length);

    for (let attempt = 0; attempt < this.maximumGenerationAttempts; attempt += 1) {
      const letterCount = this.randomItem(availableLengths);
      const wordKeys = this.wordKeysByLength.get(letterCount) ?? [];
      const startKey = this.randomItem(wordKeys);
      const distances = this.distancesFrom(startKey, this.maximumMoves);
      const availableDistances = this.moveCountPreferences(letterCount, preferredOnly).filter(
        (distance) =>
          [...distances].some(
            ([targetKey, targetDistance]) =>
              targetDistance === distance &&
              (ignoreRecentPuzzles || !this.isRecentPuzzle(startKey, targetKey)),
          ),
      );

      if (availableDistances.length === 0) {
        continue;
      }

      const targetDistance = availableDistances[0];
      const targetKeys = [...distances]
        .filter(
          ([targetKey, distance]) =>
            distance === targetDistance &&
            (ignoreRecentPuzzles || !this.isRecentPuzzle(startKey, targetKey)),
        )
        .map(([targetKey]) => targetKey);
      const targetKey = this.randomItem(targetKeys);
      const start = this.wordsByKey.get(startKey);
      const target = this.wordsByKey.get(targetKey);

      if (!start || !target) {
        continue;
      }

      this.rememberPuzzle(startKey, targetKey);

      return {
        start,
        target,
        letterCount,
        minimumMoves: targetDistance,
      };
    }

    return null;
  }

  private moveCountPreferences(letterCount: number, preferredOnly: boolean): number[] {
    const preferredMoveCount = letterCount === 4 ? 3 : 4;

    if (preferredOnly) {
      return [preferredMoveCount];
    }

    const fallbackMoveCounts = Array.from(
      { length: this.maximumMoves - this.minimumMoves + 1 },
      (_, index) => this.minimumMoves + index,
    ).filter((moveCount) => moveCount !== preferredMoveCount);

    fallbackMoveCounts.sort(
      (first, second) =>
        Math.abs(first - preferredMoveCount) - Math.abs(second - preferredMoveCount),
    );

    return [preferredMoveCount, ...fallbackMoveCounts];
  }

  private distancesFrom(startKey: string, maximumDistance: number): Map<string, number> {
    const distances = new Map<string, number>([[startKey, 0]]);
    const queue = [startKey];

    for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
      const currentKey = queue[queueIndex];
      const currentDistance = distances.get(currentKey) ?? 0;

      if (currentDistance >= maximumDistance) {
        continue;
      }

      for (const neighborKey of this.neighborsByKey.get(currentKey) ?? []) {
        if (distances.has(neighborKey)) {
          continue;
        }

        distances.set(neighborKey, currentDistance + 1);
        queue.push(neighborKey);
      }
    }

    return distances;
  }

  private isRecentPuzzle(firstKey: string, secondKey: string): boolean {
    return this.recentPuzzleKeys.includes(this.puzzleKey(firstKey, secondKey));
  }

  private rememberPuzzle(firstKey: string, secondKey: string): void {
    this.recentPuzzleKeys.unshift(this.puzzleKey(firstKey, secondKey));
    this.recentPuzzleKeys.splice(this.recentPuzzleLimit);
  }

  private puzzleKey(firstKey: string, secondKey: string): string {
    return [firstKey, secondKey].sort().join(':');
  }

  private randomItem<T>(values: readonly T[]): T {
    return values[Math.floor(Math.random() * values.length)];
  }
}
