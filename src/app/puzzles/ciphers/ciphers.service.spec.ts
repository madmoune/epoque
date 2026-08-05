import '@angular/compiler';
import { beforeEach, describe, expect, it } from 'vitest';
import { CiphersService } from './ciphers.service';

describe('CiphersService NATO modes', () => {
  let service: CiphersService;

  beforeEach(() => {
    const testService = Object.create(CiphersService.prototype) as any;
    testService.words = ['chat'];
    testService.randomWords = {
      pick: (items: readonly string[]) => items[0],
    };
    testService.natoWords = {
      a: 'Alpha',
      c: 'Charlie',
      h: 'Hotel',
      t: 'Tango',
      x: 'X-ray',
    };
    service = testService as CiphersService;
  });

  it('uses letter-to-code as the default NATO mode', () => {
    (service as any).words = [];
    const puzzle = service.createPuzzle('nato');

    expect(puzzle).toEqual({
      answer: 'Alpha',
      normalizedAnswer: 'alpha',
      cipher: 'nato',
      encoded: ['A'],
      note: 'Écris le mot-code NATO correspondant à la lettre affichée.',
      caesarShift: null,
    });
  });

  it('keeps the existing NATO word-decoding mode', () => {
    const puzzle = service.createPuzzle('nato', 'decode-word');

    expect(puzzle.answer).toBe('chat');
    expect(puzzle.encoded).toEqual(['Charlie', 'Hotel', 'Alpha', 'Tango']);
  });

  it('accepts NATO codes regardless of case or hyphen', () => {
    expect(service.isCorrectAnswer('xray', 'xray')).toBe(true);
    expect(service.isCorrectAnswer('X-Ray', 'xray')).toBe(true);
    expect(service.isCorrectAnswer('x ray', 'xray')).toBe(true);
  });
});
