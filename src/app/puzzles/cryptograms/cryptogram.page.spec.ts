import '@angular/compiler';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { CryptogramsPage } from './cryptogram.page';
import { CryptogramPuzzle } from '../../puzzles/cryptograms/cryptogram.model';

function createPage(initialGuesses: string[], encrypted = 'XYZ') {
  const page = Object.create(CryptogramsPage.prototype) as any;
  const puzzle = signal<CryptogramPuzzle>({ answer: 'ABC', encrypted });
  const inputs = initialGuesses.map((_, index) => {
    const input = document.createElement('input');
    input.dataset['characterIndex'] = String(index);
    vi.spyOn(input, 'focus');
    return input;
  });

  page.puzzle = puzzle;
  page.guesses = signal([...initialGuesses]);
  page.activeCharacterIndex = signal<number | null>(0);
  page.fillOccurrencesAutomatically = signal(false);
  page.suppressNextSelection = false;
  page.isCorrect = () => false;
  page.guessInputs = { toArray: () => inputs.map((input) => ({ nativeElement: input })) };

  return { page, inputs };
}

function enterLetter(page: any, input: HTMLInputElement, letter = 'A'): void {
  page.handleGuessKeydown(
    Number(input.dataset['characterIndex']),
    new KeyboardEvent('keydown', { key: letter }),
    input,
  );
}

describe('CryptogramsPage', () => {
  it('focuses the next empty letter after keyboard entry', () => {
    const { page, inputs } = createPage(['', '', '']);

    enterLetter(page, inputs[0]);

    expect(inputs[1].focus).toHaveBeenCalledOnce();
    expect(inputs[2].focus).not.toHaveBeenCalled();
    expect(page.activeCharacterIndex()).toBe(1);
  });

  it('keeps the focus when the next letter is already filled', () => {
    const { page, inputs } = createPage(['', 'B', '']);

    enterLetter(page, inputs[0]);

    expect(inputs[1].focus).not.toHaveBeenCalled();
    expect(inputs[2].focus).not.toHaveBeenCalled();
    expect(page.activeCharacterIndex()).toBe(0);
  });

  it('applies the same rule to the input event and virtual keyboard', () => {
    const inputEntry = createPage(['', '', '']);
    inputEntry.page.updateGuess(0, 'A');
    expect(inputEntry.inputs[1].focus).toHaveBeenCalledOnce();

    const keyboardEntry = createPage(['', 'B', '']);
    keyboardEntry.page.handleKeyboardKey('A');
    expect(keyboardEntry.inputs[1].focus).not.toHaveBeenCalled();
  });
});
