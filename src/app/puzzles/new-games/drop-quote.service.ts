import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RecentRandomPicker } from '../shared/recent-random-picker';
import {
  DropQuotePuzzle,
  createDropQuote,
  normalizeDropQuotePhrase,
  parseDropQuotePhrases,
} from './drop-quote.logic';

@Injectable({ providedIn: 'root' })
export class DropQuoteService {
  private readonly http = inject(HttpClient);
  private readonly recentPhrases = new RecentRandomPicker<string>(60);
  private phrases: string[] = [];

  async loadPhrases(): Promise<void> {
    if (this.phrases.length > 0) return;

    const text = await firstValueFrom(
      this.http.get('mid-mid-sentences.txt', { responseType: 'text' }),
    );
    const phrases = parseDropQuotePhrases(text);
    if (phrases.length === 0) throw new Error('The Dropquote phrase list is empty.');
    this.phrases = phrases;
  }

  createPuzzle(): DropQuotePuzzle {
    return createDropQuote(this.recentPhrases.pick(this.phrases, normalizeDropQuotePhrase));
  }
}
