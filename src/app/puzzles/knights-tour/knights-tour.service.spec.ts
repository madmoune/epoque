import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { RecentRandomPicker } from '../shared/recent-random-picker';
import { KnightsTourService } from './knights-tour.service';

describe('KnightsTourService', () => {
  it('creates a blocked-letter grid with a valid knight path from the word list', () => {
    const service = createService([
      'canotage',
      'kayakisme',
      'pagayage',
      'pagaillage',
      'catamaran',
      'chaloupe',
      'natation',
      'plongeon',
      'immersion',
      'flottaison',
      'papillon',
      'accostage',
      'amarrage',
      'navigation',
      'cabotage',
      'traverser',
      'sauvetage',
      'gouvernail',
      'orientation',
      'boussole',
      'cartographie',
      'topographie',
      'parcours',
      'itineraire',
      'bifurcation',
      'direction',
    ]);

    const puzzle = service.createPuzzle();
    const pathKeys = new Set(puzzle.path.map((position) => service.positionKey(position)));
    const pathWord = puzzle.path
      .map((position) => puzzle.grid[position.row][position.col].letter)
      .join('');

    expect(puzzle.path).toHaveLength(puzzle.normalizedWord.length);
    expect(new Set(pathKeys).size).toBe(puzzle.path.length);
    expect(pathWord).toBe(puzzle.normalizedWord);
    expect(puzzle.grid.flat().some((cell) => cell.blocked)).toBe(true);
    expect(puzzle.grid.flat().some((cell) => !cell.blocked && cell.letter.length === 1)).toBe(true);
    expect(puzzle.path.every((position) => !puzzle.grid[position.row][position.col].blocked)).toBe(
      true,
    );

    for (let index = 1; index < puzzle.path.length; index += 1) {
      expect(service.isKnightMove(puzzle.path[index - 1], puzzle.path[index])).toBe(true);
    }

    for (let index = 0; index < puzzle.path.length - 1; index += 1) {
      expect(
        service.getLegalMoves(puzzle, puzzle.path.slice(0, index + 1)).length,
      ).toBeGreaterThanOrEqual(2);
    }

    for (const cell of puzzle.grid.flat().filter((candidate) => !candidate.blocked)) {
      const openMoves = puzzle.grid
        .flat()
        .filter((candidate) => !candidate.blocked && service.isKnightMove(cell, candidate));

      expect(openMoves.length).toBeGreaterThanOrEqual(2);
    }

    expect(service.isSolutionPath(puzzle, puzzle.path)).toBe(true);
    expect(service.getLegalMoves(puzzle, puzzle.path.slice(0, -1))).toContainEqual(
      puzzle.path.at(-1),
    );
  });

  it('only accepts the intended next move and rejects a legal decoy', () => {
    const service = createService([
      'canotage',
      'kayakisme',
      'pagayage',
      'pagaillage',
      'catamaran',
      'chaloupe',
      'natation',
      'plongeon',
      'immersion',
      'flottaison',
      'papillon',
      'accostage',
      'amarrage',
      'navigation',
      'cabotage',
      'traverser',
      'sauvetage',
      'gouvernail',
      'orientation',
      'boussole',
      'cartographie',
      'topographie',
      'parcours',
      'itineraire',
      'bifurcation',
      'direction',
    ]);

    let puzzle = service.createPuzzle();
    let path = puzzle.path.slice(0, 1);
    let decoy: { row: number; col: number } | undefined;

    for (let index = 0; index < puzzle.path.length; index += 1) {
      const current = puzzle.path[index];
      const expected = puzzle.path[index + 1];
      const visited = new Set(path.map((position) => service.positionKey(position)));
      const candidate = service
        .getLegalMoves(puzzle, path)
        .find(
          (position) =>
            !visited.has(service.positionKey(position)) &&
            (!expected || service.positionKey(position) !== service.positionKey(expected)),
        );

      if (candidate) {
        decoy = candidate;
        expect(service.isCorrectNextMove(puzzle, path, candidate)).toBe(false);
        break;
      }

      if (expected) {
        path = [...path, expected];
      }
    }

    expect(decoy).toBeDefined();
    expect(service.isCorrectNextMove(puzzle, puzzle.path.slice(0, -1), puzzle.path.at(-1)!)).toBe(
      true,
    );
    expect(service.isSolutionPath(puzzle, puzzle.path.slice(0, -1))).toBe(false);
  });

  it('creates complete classic tours for every supported grid size', () => {
    const service = createService([]);

    for (const size of [5, 6, 7, 8, 9]) {
      const puzzle = service.createClassicPuzzle(size);
      const pathKeys = new Set(puzzle.path.map((position) => service.positionKey(position)));

      expect(puzzle.path).toHaveLength(size * size);
      expect(pathKeys).toHaveLength(size * size);
      expect(service.isSolutionPath(puzzle, puzzle.path)).toBe(true);

      for (let index = 1; index < puzzle.path.length; index += 1) {
        expect(service.isKnightMove(puzzle.path[index - 1], puzzle.path[index])).toBe(true);
      }
    }
  });

  it('normalizes accents before comparing letters', () => {
    const service = createService(['dériveur', 'étoiles', 'boussole', 'traverser']);

    expect(service.normalize('Dériveur')).toBe('DERIVEUR');
    expect(service.normalize('étoiles')).toBe('ETOILES');
  });
});

function createService(words: string[]): KnightsTourService {
  const service = Object.create(KnightsTourService.prototype) as any;

  service.words = words.map((answer) => ({
    answer,
    normalizedAnswer: service.normalize(answer),
  }));
  service.recentWords = new RecentRandomPicker(30);
  service.size = 7;
  service.minimumWordLength = 6;
  service.maximumWordLength = 9;
  service.decoyCellCount = 20;
  service.minimumAvailableMoveCount = 2;
  service.minimumOpenCellCount = 32;
  service.maximumGenerationAttempts = 500;
  service.knightDirections = [
    { row: -2, col: -1 },
    { row: -2, col: 1 },
    { row: -1, col: -2 },
    { row: -1, col: 2 },
    { row: 1, col: -2 },
    { row: 1, col: 2 },
    { row: 2, col: -1 },
    { row: 2, col: 1 },
  ];

  return service as KnightsTourService;
}
