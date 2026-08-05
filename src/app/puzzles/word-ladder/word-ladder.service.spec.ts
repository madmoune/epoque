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
    expect(service.areNeighbors('chat', 'chaz')).toBe(false);
  });

  it('keeps supported word lengths and compares Unicode letters by position', () => {
    const service = createService(['chat', 'chats', 'char', 'côte', 'note']);

    expect(service.resolveWord('chats')).toBe('chats');
    expect(service.areNeighbors('côte', 'note')).toBe(true);
    expect(service.areNeighbors('chat', 'chats')).toBe(false);
    expect(service.areNeighbors('chat', 'cher')).toBe(false);
  });

  it('creates a puzzle with the requested five-letter length', () => {
    const service = createService(['acide', 'aride', 'bride', 'brode', 'broie']);

    vi.spyOn(Math, 'random').mockReturnValue(0);

    const puzzle = service.createPuzzle(5);
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

  it('prefers three moves for the four-letter list', () => {
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
});

function createService(words: string[]): WordLadderService {
  const service = Object.create(WordLadderService.prototype) as any;

  service.supportedWordLengths = [4, 5];
  service.minimumMoves = 3;
  service.maximumMoves = 7;
  service.maximumGenerationAttempts = 400;
  service.recentPuzzleLimit = 80;
  service.recentPuzzleKeys = [];
  service.initializeWords(words);

  return service as WordLadderService;
}
