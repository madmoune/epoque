import { Injectable } from '@angular/core';
import { RecentRandomPicker } from '../shared/recent-random-picker';
import { PIVOT_WORD_PUZZLES, PivotWordPuzzle } from './pivot-word.data';

@Injectable({
  providedIn: 'root',
})
export class PivotWordService {
  private readonly recentPuzzlePicker = new RecentRandomPicker<PivotWordPuzzle>(40);

  createPuzzle(): PivotWordPuzzle {
    const puzzle = this.recentPuzzlePicker.pick(PIVOT_WORD_PUZZLES, (candidate) =>
      this.normalizeAnswer(candidate.answer),
    );

    return {
      ...puzzle,
      links: this.shuffle(puzzle.links),
    };
  }

  isCorrect(puzzle: PivotWordPuzzle, answer: string): boolean {
    const normalizedAnswer = this.normalizeAnswer(answer);
    const acceptedAnswers = [puzzle.answer, ...(puzzle.acceptedAnswers ?? [])];

    return acceptedAnswers.some(
      (acceptedAnswer) => this.normalizeAnswer(acceptedAnswer) === normalizedAnswer,
    );
  }

  normalizeAnswer(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\p{Letter}]/gu, '')
      .toLocaleLowerCase('fr-CA');
  }

  private shuffle<T>(values: readonly T[]): T[] {
    const shuffledValues = [...values];

    for (let index = shuffledValues.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));

      [shuffledValues[index], shuffledValues[randomIndex]] = [
        shuffledValues[randomIndex],
        shuffledValues[index],
      ];
    }

    return shuffledValues;
  }
}
