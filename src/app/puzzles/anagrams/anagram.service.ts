import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AnagramWord } from './anagram-word.model';

@Injectable({
    providedIn: 'root',
})
export class AnagramService {
    private readonly http = inject(HttpClient);

    private words: AnagramWord[] = [];

    async loadWords(): Promise<void> {
        if (this.words.length > 0) {
            return;
        }

        const text = await firstValueFrom(
            this.http.get('words.txt', {
                responseType: 'text',
            }),
        );

        this.words = text
            .split(/\r?\n/)
            .map((word) => word.trim())
            .filter(Boolean)
            .map((answer) => ({ answer }));
    }

    getRandomWord(): AnagramWord {
        if (this.words.length === 0) {
            throw new Error('Anagram words have not been loaded yet.');
        }

        const index = Math.floor(Math.random() * this.words.length);
        return this.words[index];
    }

    scrambleWord(word: string): string {
        const letters = word.split('');

        for (let index = letters.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [letters[index], letters[swapIndex]] = [letters[swapIndex], letters[index]];
        }

        const scrambled = letters.join('');

        return scrambled.toLowerCase() === word.toLowerCase()
            ? this.scrambleWord(word)
            : scrambled;
    }

    isCorrectAnswer(input: string, answer: string): boolean {
        return this.normalize(input) === this.normalize(answer);
    }

    private normalize(value: string): string {
        return value
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .trim()
            .toLowerCase();
    }
}