import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RecentRandomPicker } from '../shared/recent-random-picker';

export type WordSearchCell = {
  row: number;
  col: number;
  letter: string;
  hiddenWordIds: string[];
  isFinalLetter: boolean;
};

export type WordSearchHiddenWord = {
  id: string;
  answer: string;
  normalizedAnswer: string;
  cells: { row: number; col: number }[];
  orientation: WordSearchOrientation;
};

export type WordSearchOrientation = 'horizontal' | 'vertical' | 'diagonal';

export type WordSearchPuzzle = {
  size: number;
  grid: WordSearchCell[][];
  hiddenWords: WordSearchHiddenWord[];
  finalWord: string;
  normalizedFinalWord: string;
};

type CandidateWord = {
  answer: string;
  normalizedAnswer: string;
};

type Direction = {
  row: number;
  col: number;
};

type MutableGridCell = WordSearchCell;

@Injectable({
  providedIn: 'root',
})
export class WordSearchService {
  private readonly http = inject(HttpClient);
  private readonly recentFinalWords = new RecentRandomPicker<CandidateWord>(30);
  private readonly size = 7;
  private readonly directions: Direction[] = [
    { row: -1, col: 0 },
    { row: -1, col: 1 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: -1 },
    { row: 0, col: -1 },
    { row: -1, col: -1 },
  ];

  private words: CandidateWord[] = [];

  async loadWords(): Promise<void> {
    if (this.words.length > 0) {
      return;
    }

    const text = await firstValueFrom(
      this.http.get('words.txt', {
        responseType: 'text',
      }),
    );

    this.words = text
      .split(/\r?\n/)
      .map((word) => word.trim())
      .filter(Boolean)
      .map((answer) => ({
        answer,
        normalizedAnswer: this.normalize(answer),
      }))
      .filter((word) => /^[A-Z]{3,7}$/.test(word.normalizedAnswer));
  }

  createPuzzle(): WordSearchPuzzle {
    if (this.words.length === 0) {
      throw new Error('Word search words have not been loaded yet.');
    }

    for (let attempt = 0; attempt < 500; attempt += 1) {
      const puzzle = this.createRandomPuzzleCandidate();

      if (puzzle) {
        return puzzle;
      }
    }

    throw new Error('Unable to create a word search puzzle.');
  }

  normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase();
  }

  private pickFinalWord(): CandidateWord {
    const sevenLetterFinalWords = this.words.filter((word) => word.normalizedAnswer.length === this.size);
    const finalWords =
      sevenLetterFinalWords.length > 0
        ? sevenLetterFinalWords
        : this.words.filter((word) => word.normalizedAnswer.length >= 5);

    return this.recentFinalWords.pick(finalWords, (word) => word.normalizedAnswer);
  }

  private createRandomPuzzleCandidate(): WordSearchPuzzle | null {
    const grid = this.createEmptyGrid();
    const hiddenWords: WordSearchHiddenWord[] = [];
    const usedWords = new Set<string>();
    const candidateWords = this.shuffle(
      this.words.filter(
        (word) => word.normalizedAnswer.length >= 4 && word.normalizedAnswer.length <= this.size,
      ),
    );

    for (const word of candidateWords) {
      if (
        usedWords.has(word.normalizedAnswer) ||
        this.conflictsWithSelectedWords(word.normalizedAnswer, hiddenWords)
      ) {
        continue;
      }

      const placement = this.pickPlacementForGrid(word, grid);

      if (!placement) {
        continue;
      }
      const orientation = this.wordOrientation(placement);

      if (!this.canAddOrientation(orientation, hiddenWords)) {
        continue;
      }

      const hiddenWord: WordSearchHiddenWord = {
        id: `${hiddenWords.length}-${word.normalizedAnswer}`,
        answer: word.answer,
        normalizedAnswer: word.normalizedAnswer,
        cells: placement,
        orientation,
      };

      hiddenWords.push(hiddenWord);
      usedWords.add(word.normalizedAnswer);

      placement.forEach((cell, index) => {
        grid[cell.row][cell.col].letter = word.normalizedAnswer[index];
        grid[cell.row][cell.col].hiddenWordIds.push(hiddenWord.id);
      });

      const finalCellCount = this.emptyCells(grid).length;

      if (finalCellCount < 5) {
        return null;
      }

      const finalWord = this.pickFinalWordForLength(finalCellCount, usedWords);

      if (hiddenWords.length >= 6 && finalWord && this.hasBalancedOrientations(hiddenWords)) {
        return this.finishPuzzle(grid, hiddenWords, finalWord);
      }
    }

    return null;
  }

  private createEmptyGrid(): MutableGridCell[][] {
    return Array.from({ length: this.size }, (_, row) =>
      Array.from({ length: this.size }, (_, col) => ({
        row,
        col,
        letter: '',
        hiddenWordIds: [],
        isFinalLetter: false,
      })),
    );
  }

  private pickPlacementForGrid(
    word: CandidateWord,
    grid: MutableGridCell[][],
  ): { row: number; col: number }[] | null {
    const placements = this.shuffle(this.createPlacements(word.normalizedAnswer))
      .filter((cells) => this.canPlaceWord(word.normalizedAnswer, cells, grid))
      .filter((cells) => cells.some((cell) => !grid[cell.row][cell.col].letter));

    if (placements.length === 0) {
      return null;
    }

    return this.randomItem(placements);
  }

  private canPlaceWord(
    word: string,
    cells: { row: number; col: number }[],
    grid: MutableGridCell[][],
  ): boolean {
    return cells.every((cell, index) => {
      const existingLetter = grid[cell.row][cell.col].letter;

      return !existingLetter || existingLetter === word[index];
    });
  }

  private emptyCells(grid: MutableGridCell[][]): MutableGridCell[] {
    return grid.flat().filter((cell) => !cell.letter);
  }

  private pickFinalWordForLength(length: number, usedWords: Set<string>): CandidateWord | null {
    if (length < 5 || length > this.size) {
      return null;
    }

    const finalWords = this.words.filter(
      (word) => word.normalizedAnswer.length === length && !usedWords.has(word.normalizedAnswer),
    );

    return finalWords.length > 0
      ? this.recentFinalWords.pick(finalWords, (word) => word.normalizedAnswer)
      : null;
  }

  private finishPuzzle(
    grid: MutableGridCell[][],
    hiddenWords: WordSearchHiddenWord[],
    finalWord: CandidateWord,
  ): WordSearchPuzzle {
    const finalLetters = this.shuffle(finalWord.normalizedAnswer.split(''));

    for (const cell of this.emptyCells(grid)) {
      cell.letter = finalLetters.pop() ?? 'A';
      cell.isFinalLetter = true;
    }

    return {
      size: this.size,
      grid,
      hiddenWords,
      finalWord: finalWord.answer,
      normalizedFinalWord: finalWord.normalizedAnswer,
    };
  }

  private pickHiddenWords(targetLength: number, finalWord: CandidateWord): CandidateWord[] | null {
    const candidates = this.shuffle(
      this.words.filter(
        (word) =>
          word.normalizedAnswer !== finalWord.normalizedAnswer &&
          word.normalizedAnswer.length >= 3 &&
          word.normalizedAnswer.length <= this.size,
      ),
    ).slice(0, 220);
    const selectedWords: CandidateWord[] = [];

    const search = (startIndex: number, remainingLength: number): boolean => {
      if (remainingLength === 0) {
        return selectedWords.length >= 6;
      }

      if (remainingLength < 0 || selectedWords.length >= 11) {
        return false;
      }

      for (let index = startIndex; index < candidates.length; index += 1) {
        const word = candidates[index];

        if (word.normalizedAnswer.length > remainingLength) {
          continue;
        }

        selectedWords.push(word);

        if (search(index + 1, remainingLength - word.normalizedAnswer.length)) {
          return true;
        }

        selectedWords.pop();
      }

      return false;
    };

    return search(0, targetLength) ? selectedWords : null;
  }

  private placeHiddenWords(words: CandidateWord[]): WordSearchHiddenWord[] | null {
    const occupiedCells = new Set<string>();
    const placedWords: WordSearchHiddenWord[] = [];
    const orderedWords = [...words].sort(
      (first, second) => second.normalizedAnswer.length - first.normalizedAnswer.length,
    );

    const search = (wordIndex: number): boolean => {
      if (wordIndex >= orderedWords.length) {
        return true;
      }

      const word = orderedWords[wordIndex];
      const requiredOrientation = this.requiredOrientationForWord(wordIndex);
      const placements = this.shuffle(this.createPlacements(word.normalizedAnswer)).filter(
        (cells) => !requiredOrientation || this.wordOrientation(cells) === requiredOrientation,
      );

      for (const cells of placements) {
        if (cells.some((cell) => occupiedCells.has(this.cellKey(cell.row, cell.col)))) {
          continue;
        }

        for (const cell of cells) {
          occupiedCells.add(this.cellKey(cell.row, cell.col));
        }

        placedWords.push({
          id: `${word.normalizedAnswer}-${wordIndex}`,
          answer: word.answer,
          normalizedAnswer: word.normalizedAnswer,
          cells,
          orientation: this.wordOrientation(cells),
        });

        if (search(wordIndex + 1)) {
          return true;
        }

        placedWords.pop();

        for (const cell of cells) {
          occupiedCells.delete(this.cellKey(cell.row, cell.col));
        }
      }

      return false;
    };

    return search(0) ? placedWords : null;
  }

  private createPlacements(word: string): { row: number; col: number }[][] {
    const placements: { row: number; col: number }[][] = [];

    for (let row = 0; row < this.size; row += 1) {
      for (let col = 0; col < this.size; col += 1) {
        for (const direction of this.directions) {
          const endRow = row + direction.row * (word.length - 1);
          const endCol = col + direction.col * (word.length - 1);

          if (endRow < 0 || endRow >= this.size || endCol < 0 || endCol >= this.size) {
            continue;
          }

          placements.push(
            Array.from({ length: word.length }, (_, index) => ({
              row: row + direction.row * index,
              col: col + direction.col * index,
            })),
          );
        }
      }
    }

    return placements;
  }

  private hasBalancedOrientations(words: WordSearchHiddenWord[]): boolean {
    const orientations = new Set(words.map((word) => word.orientation));

    if (!orientations.has('horizontal') || !orientations.has('vertical') || !orientations.has('diagonal')) {
      return false;
    }

    const counts = this.orientationCounts(words);
    const maxAllowedCount = Math.ceil(words.length / 2);

    return Object.values(counts).every((count) => count <= maxAllowedCount);
  }

  private canAddOrientation(
    orientation: WordSearchOrientation,
    words: WordSearchHiddenWord[],
  ): boolean {
    const counts = this.orientationCounts(words);

    return counts[orientation] < 3;
  }

  private orientationCounts(words: WordSearchHiddenWord[]): Record<WordSearchOrientation, number> {
    return words.reduce(
      (counts, word) => ({
        ...counts,
        [word.orientation]: counts[word.orientation] + 1,
      }),
      { horizontal: 0, vertical: 0, diagonal: 0 },
    );
  }

  private conflictsWithSelectedWords(word: string, selectedWords: WordSearchHiddenWord[]): boolean {
    return selectedWords.some((selectedWord) => this.areTooSimilar(word, selectedWord.normalizedAnswer));
  }

  private areTooSimilar(firstWord: string, secondWord: string): boolean {
    return firstWord.includes(secondWord) || secondWord.includes(firstWord);
  }

  private requiredOrientationForWord(wordIndex: number): WordSearchOrientation | null {
    if (wordIndex === 0) {
      return 'horizontal';
    }

    if (wordIndex === 1) {
      return 'diagonal';
    }

    return null;
  }

  private wordOrientation(cells: { row: number; col: number }[]): WordSearchOrientation {
    const firstCell = cells[0];
    const secondCell = cells[1];

    if (!firstCell || !secondCell) {
      return 'horizontal';
    }

    if (firstCell.row === secondCell.row) {
      return 'horizontal';
    }

    if (firstCell.col === secondCell.col) {
      return 'vertical';
    }

    return 'diagonal';
  }

  private buildPuzzle(
    hiddenWords: WordSearchHiddenWord[],
    finalWord: CandidateWord,
  ): WordSearchPuzzle {
    const grid = Array.from({ length: this.size }, (_, row) =>
      Array.from({ length: this.size }, (_, col) => ({
        row,
        col,
        letter: '',
        hiddenWordIds: [] as string[],
        isFinalLetter: false,
      })),
    );

    for (const word of hiddenWords) {
      word.cells.forEach((cell, index) => {
        grid[cell.row][cell.col].letter = word.normalizedAnswer[index];
        grid[cell.row][cell.col].hiddenWordIds.push(word.id);
      });
    }

    const finalLetters = this.shuffle(finalWord.normalizedAnswer.split(''));

    for (const row of grid) {
      for (const cell of row) {
        if (cell.letter) {
          continue;
        }

        cell.letter = finalLetters.pop() ?? 'A';
        cell.isFinalLetter = true;
      }
    }

    return {
      size: this.size,
      grid,
      hiddenWords,
      finalWord: finalWord.answer,
      normalizedFinalWord: finalWord.normalizedAnswer,
    };
  }

  private shuffle<T>(values: T[]): T[] {
    const shuffled = [...values];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
  }

  private cellKey(row: number, col: number): string {
    return `${row}:${col}`;
  }

  private randomItem<T>(values: T[]): T | null {
    if (values.length === 0) {
      return null;
    }

    return values[Math.floor(Math.random() * values.length)];
  }
}
