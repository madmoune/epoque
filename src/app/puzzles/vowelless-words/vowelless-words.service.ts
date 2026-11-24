import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RecentRandomPicker } from '../shared/recent-random-picker';
import { indexVowellessWords, VowellessPuzzle } from './vowelless-words.logic';

@Injectable({ providedIn: 'root' })
export class VowellessWordsService {
  private readonly http = inject(HttpClient);
  private readonly picker = new RecentRandomPicker<VowellessPuzzle>(40);
  private puzzles: VowellessPuzzle[] = [];
  private pending?: Promise<void>;

  loadWords(): Promise<void> {
    if (this.puzzles.length) return Promise.resolve();
    return (this.pending ??= this.loadPuzzleBank().finally(() => {
      this.pending = undefined;
    }));
  }

  nextPuzzle(): VowellessPuzzle {
    return this.picker.pick(this.puzzles, ({ key }) => key);
  }

  private async loadPuzzleBank(): Promise<void> {
    const [source, alternatives] = await Promise.all([
      firstValueFrom(this.http.get('words.txt', { responseType: 'text' })),
      firstValueFrom(
        this.http.get('mots-sans-voyelles-alternatives.txt', { responseType: 'text' }),
      ),
    ]);
    const puzzles = indexVowellessWords(source, alternatives);
    if (!puzzles.length) throw new Error('La liste de mots sans voyelles est vide.');
    this.puzzles = puzzles;
  }
}
