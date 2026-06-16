import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RecentRandomPicker } from '../shared/recent-random-picker';
import { PhrasePuzzle } from './phrase.model';

@Injectable({
  providedIn: 'root',
})
export class PhraseService {
  private readonly http = inject(HttpClient);
  private readonly randomPhrases = new RecentRandomPicker<string>(60);

  private phrases: string[] = [];

  async loadPhrases(): Promise<void> {
    if (this.phrases.length > 0) {
      return;
    }

    const text = await firstValueFrom(
      this.http.get('phrases.txt', {
        responseType: 'text',
      }),
    );

    const phrases = text
      .split(/\r?\n/)
      .map((phrase) => phrase.trim())
      .filter(Boolean);

    if (phrases.length === 0) {
      throw new Error('The phrase list is empty.');
    }

    this.phrases = phrases;
  }

  getRandomPuzzle(): PhrasePuzzle {
    if (this.phrases.length === 0) {
      throw new Error('Phrases have not been loaded yet.');
    }

    const answer = this.normalizePhrase(this.getRandomPhrase());
    const lockedIndexes = this.getRandomLockedIndexes(answer, 3);

    return {
      answer,
      lockedIndexes,
      revealedIndexes: new Set<number>(),
    };
  }

  private getRandomPhrase(): string {
    return this.randomPhrases.pick(this.phrases, (phrase) => this.normalizePhrase(phrase));
  }

  private getRandomLockedIndexes(answer: string, count: number): Set<number> {
    const letterIndexes = answer
      .split('')
      .map((character, index) => ({
        character,
        index,
      }))
      .filter(({ character }) => this.isLetter(character))
      .map(({ index }) => index);

    const shuffledIndexes = this.shuffle([...letterIndexes]);

    return new Set(shuffledIndexes.slice(0, Math.min(count, shuffledIndexes.length)));
  }

  private normalizePhrase(phrase: string): string {
    return phrase
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toUpperCase();
  }

  private shuffle<T>(items: T[]): T[] {
    for (let index = items.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }

    return items;
  }

  private isLetter(character: string): boolean {
    return /^[A-Z]$/.test(character);
  }
}
