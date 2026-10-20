import { describe, expect, it } from 'vitest';
import { scoreWordleGuess } from './wordle.logic';

describe('scoreWordleGuess', () => {
  it('marks exact, present and absent letters', () => {
    expect(scoreWordleGuess('maman', 'pomme').map((tile) => tile.state)).toEqual([
      'present',
      'absent',
      'correct',
      'absent',
      'absent',
    ]);
  });

  it('does not mark a repeated letter present more times than it appears', () => {
    expect(scoreWordleGuess('llama', 'salon').map((tile) => tile.state)).toEqual([
      'present',
      'absent',
      'present',
      'absent',
      'absent',
    ]);
  });

  it('ignores accents when comparing letters', () => {
    expect(scoreWordleGuess('melee', 'mélée').map((tile) => tile.state)).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });
});
