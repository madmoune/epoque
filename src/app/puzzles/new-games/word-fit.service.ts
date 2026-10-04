import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { WordFitPuzzle, createWordFit, parseWordFitWords } from './word-fit.logic';

@Injectable({ providedIn: 'root' })
export class WordFitService {
  private readonly http = inject(HttpClient);
  private words: string[] = [];

  async loadWords(): Promise<void> {
    if (this.words.length > 0) return;

    const text = await firstValueFrom(this.http.get('words.txt', { responseType: 'text' }));
    const words = parseWordFitWords(text);
    if (words.length < 8) throw new Error('La liste doit contenir au moins huit mots à caser.');
    this.words = words;
  }

  createPuzzle(): WordFitPuzzle {
    return createWordFit(this.words);
  }
}
