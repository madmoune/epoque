import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { WordSearchService } from './word-search.service';
import { RecentRandomPicker } from '../shared/recent-random-picker';

describe('WordSearchService', () => {
  it('creates a grid whose remaining letters form a word from the list', () => {
    const words = [
      'animal',
      'bateau',
      'cabinet',
      'canard',
      'cascade',
      'dragon',
      'etoile',
      'forest',
      'garage',
      'hiver',
      'image',
      'jardin',
      'kayak',
      'lampe',
      'maison',
      'nuage',
      'orange',
      'piano',
      'quatre',
      'reserve',
      'robot',
      'soleil',
      'table',
      'utile',
      'valise',
      'wagon',
      'xenon',
      'yogourt',
      'zenith',
    ];
    const service = Object.create(WordSearchService.prototype) as any;

    service.words = words.map((answer) => ({
      answer,
      normalizedAnswer: service.normalize(answer),
    }));
    service.recentFinalWords = new RecentRandomPicker(30);
    service.size = 7;
    service.directions = [
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: -1 },
      { row: 0, col: -1 },
      { row: -1, col: -1 },
    ];

    const puzzle = service.createPuzzle();
    const hiddenCellCount = new Set<string>(
      puzzle.hiddenWords.flatMap((word: any) => word.cells.map((cell: any) => `${cell.row}:${cell.col}`)),
    ).size;
    const finalCellCount = puzzle.grid.flat().filter((cell: any) => cell.isFinalLetter).length;

    expect(hiddenCellCount + finalCellCount).toBe(puzzle.size * puzzle.size);
    expect(finalCellCount).toBe(puzzle.normalizedFinalWord.length);
    expect(words.map((word) => service.normalize(word))).toContain(puzzle.normalizedFinalWord);
    const orientationCounts = orientationCountsFor(puzzle.hiddenWords);

    expect(orientationCounts['horizontal']).toBeGreaterThan(0);
    expect(orientationCounts['vertical']).toBeGreaterThan(0);
    expect(orientationCounts['diagonal']).toBeGreaterThan(0);
    expect(Math.max(...Object.values(orientationCounts))).toBeLessThanOrEqual(
      Math.ceil(puzzle.hiddenWords.length / 2),
    );
    expect(hasSimilarWords(puzzle.hiddenWords.map((word: any) => word.normalizedAnswer))).toBe(false);
  });

  it('can place words horizontally and diagonally', () => {
    const service = Object.create(WordSearchService.prototype) as any;

    service.size = 7;
    service.directions = [
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: -1 },
      { row: 0, col: -1 },
      { row: -1, col: -1 },
    ];

    const placements = service.createPlacements('SOLEIL');
    const hasHorizontalPlacement = placements.some((placement: any[]) =>
      placement.every((cell, index) => cell.row === placement[0].row && cell.col === placement[0].col + index),
    );
    const hasDiagonalPlacement = placements.some((placement: any[]) =>
      placement.every((cell, index) => cell.row === placement[0].row + index && cell.col === placement[0].col + index),
    );

    expect(hasHorizontalPlacement).toBe(true);
    expect(hasDiagonalPlacement).toBe(true);
  });

  it('allows hidden words to share matching letters', () => {
    const service = Object.create(WordSearchService.prototype) as any;
    const grid = Array.from({ length: 7 }, (_, row) =>
      Array.from({ length: 7 }, (_, col) => ({
        row,
        col,
        letter: '',
        hiddenWordIds: [],
        isFinalLetter: false,
      })),
    );

    grid[0][0].letter = 'R';

    expect(service.canPlaceWord('ROUTE', [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }], grid)).toBe(true);
    expect(service.canPlaceWord('SOUPE', [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }], grid)).toBe(false);
  });

  it('rejects words that contain another selected word', () => {
    const service = Object.create(WordSearchService.prototype) as any;
    const selectedWords = [{ normalizedAnswer: 'PORTE' }];

    expect(service.conflictsWithSelectedWords('PORTER', selectedWords)).toBe(true);
    expect(service.conflictsWithSelectedWords('ROUTE', selectedWords)).toBe(false);
  });
});

function orientationCountsFor(words: any[]): Record<string, number> {
  return words.reduce(
    (counts, word) => ({
      ...counts,
      [word.orientation]: counts[word.orientation] + 1,
    }),
    { horizontal: 0, vertical: 0, diagonal: 0 },
  );
}

function hasSimilarWords(words: string[]): boolean {
  return words.some((word, index) =>
    words.some((otherWord, otherIndex) =>
      index !== otherIndex && (word.includes(otherWord) || otherWord.includes(word)),
    ),
  );
}
