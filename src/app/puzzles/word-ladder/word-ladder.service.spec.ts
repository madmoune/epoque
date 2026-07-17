import '@angular/compiler';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WordLadderService } from './word-ladder.service';

describe('WordLadderService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds the shortest sequence between two words', () => {
    const service = createService(['pain', 'main', 'mais', 'mats', 'mots']);

    expect(service.findShortestPath('pain', 'mots')).toEqual([
      'pain',
      'main',
      'mais',
      'mats',
      'mots',
    ]);
    expect(service.findShortestPath('pain', 'mots', ['main'])).toBeNull();
  });

  it('accepts an unaccented answer for an accented dictionary word', () => {
    const service = createService(['côte', 'coteau', 'chat', 'char']);

    expect(service.resolveWord('COTE')).toBe('côte');
    expect(service.sameWord('CÔTE', 'cote')).toBe(true);
    expect(service.areNeighbors('chat', 'char')).toBe(true);
    expect(service.areNeighbors('chat', 'cher')).toBe(false);
  });

  it('prefers three moves for four-letter words', () => {
    const service = createService(['pain', 'main', 'mais', 'mats', 'mots']);

    vi.spyOn(Math, 'random').mockReturnValue(0);

    const puzzle = service.createPuzzle();
    const path = service.findShortestPath(puzzle.start, puzzle.target);

    expect(puzzle).toEqual({
      start: 'pain',
      target: 'mats',
      letterCount: 4,
      minimumMoves: 3,
    });
    expect(path).not.toBeNull();
    expect((path?.length ?? 1) - 1).toBe(puzzle.minimumMoves);
  });

  it('prefers four moves for five-letter words', () => {
    const service = createService(['acide', 'aride', 'bride', 'brode', 'broie']);

    vi.spyOn(Math, 'random').mockReturnValue(0);

    const puzzle = service.createPuzzle();
    const path = service.findShortestPath(puzzle.start, puzzle.target);

    expect(puzzle).toEqual({
      start: 'acide',
      target: 'broie',
      letterCount: 5,
      minimumMoves: 4,
    });
    expect(path).not.toBeNull();
    expect((path?.length ?? 1) - 1).toBe(puzzle.minimumMoves);
  });
});

function createService(words: string[]): WordLadderService {
  const service = Object.create(WordLadderService.prototype) as any;

  service.minimumMoves = 3;
  service.maximumMoves = 7;
  service.maximumGenerationAttempts = 400;
  service.recentPuzzleLimit = 80;
  service.recentPuzzleKeys = [];
  service.initializeWords(words);

  return service as WordLadderService;
}
