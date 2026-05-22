import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnagramService } from '../../puzzles/anagrams/anagram.service';
import { AnagramWord } from '../../puzzles/anagrams/anagram-word.model';

@Component({
    selector: 'app-anagrams-page',
    imports: [FormsModule, RouterLink],
    templateUrl: './anagram.page.html',
    styleUrl: './anagram.page.scss',
})
export class AnagramsPage {
    private readonly anagramService = inject(AnagramService);

    protected readonly isLoading = signal(true);
    protected readonly loadError = signal<string | null>(null);

    protected readonly currentWord = signal<AnagramWord | null>(null);
    protected readonly scrambledLetters = signal('');
    protected readonly answerInput = signal('');

    protected readonly hintLetterCount = signal(0);

    protected readonly revealedHint = computed(() => {
        const word = this.currentWord();

        if (!word || this.hintLetterCount() === 0) {
            return '';
        }

        return word.answer.slice(0, this.hintLetterCount());
    });

    protected readonly isCorrect = computed(() => {
        const word = this.currentWord();

        if (!word) {
            return false;
        }

        return this.anagramService.isCorrectAnswer(
            this.answerInput(),
            word.answer,
        );
    });

    constructor() {
        void this.loadPuzzle();
    }

    protected updateAnswer(value: string): void {
        this.answerInput.set(value);
    }

    protected nextPuzzle(): void {
        const nextWord = this.anagramService.getRandomWord();

        this.currentWord.set(nextWord);
        this.scrambledLetters.set(
            this.anagramService.scrambleWord(nextWord.answer),
        );
        this.answerInput.set('');
        this.hintLetterCount.set(0);
    }

    private async loadPuzzle(): Promise<void> {
        try {
            await this.anagramService.loadWords();
            this.nextPuzzle();
        } catch {
            this.loadError.set('Could not load the anagram word list.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected goToNextPuzzleIfCorrect(event: Event): void {
        event.preventDefault();

        if (!this.isCorrect()) {
            return;
        }

        this.nextPuzzle();
    }

    protected showNextHintLetter(): void {
        const word = this.currentWord();

        if (!word) {
            return;
        }

        this.hintLetterCount.update((count) =>
            Math.min(count + 1, word.answer.length),
        );
    }
}