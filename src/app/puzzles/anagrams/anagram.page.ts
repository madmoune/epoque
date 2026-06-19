import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnagramService } from '../../puzzles/anagrams/anagram.service';
import { AnagramWord } from '../../puzzles/anagrams/anagram-word.model';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type LetterDisplayMode = 'default' | 'alphabetical' | 'vowelsFirst';
type LetterLayoutMode = 'line' | 'circle';

@Component({
    selector: 'app-anagrams-page',
    imports: [FormsModule, RouterLink, PuzzleSuccessPopupComponent],
    templateUrl: './anagram.page.html',
    styleUrl: './anagram.page.scss',
})
export class AnagramsPage {
    @ViewChild('answerField')
    private readonly answerField?: ElementRef<HTMLInputElement>;

    private readonly anagramService = inject(AnagramService);

    protected readonly isLoading = signal(true);
    protected readonly loadError = signal<string | null>(null);

    protected readonly currentWord = signal<AnagramWord | null>(null);
    protected readonly scrambledLetters = signal('');
    protected readonly answerInput = signal('');

    protected readonly hintLetterCount = signal(0);

    protected readonly letterDisplayMode = signal<LetterDisplayMode>('default');
    protected readonly letterLayoutMode = signal<LetterLayoutMode>('line');

    protected readonly displayedLetters = computed(() => {
        const letters = this.scrambledLetters().split('');

        if (this.letterDisplayMode() === 'alphabetical') {
            return [...letters].sort((first, second) =>
                this.normalizeLetter(first).localeCompare(
                    this.normalizeLetter(second),
                    'fr-CA',
                ),
            );
        }

        if (this.letterDisplayMode() === 'vowelsFirst') {
            const vowels = letters.filter((letter) => this.isVowel(letter));
            const consonants = letters.filter((letter) => !this.isVowel(letter));

            return [...vowels, ...consonants];
        }

        return letters;
    });

    protected readonly vowelCount = computed(
        () =>
            this.scrambledLetters()
                .split('')
                .filter((letter) => this.isVowel(letter)).length,
    );

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
        this.resetLetters();
        this.focusAnswerField();
    }

    protected setAlphabeticalOrder(): void {
        this.letterDisplayMode.set('alphabetical');
    }

    protected setVowelsFirstOrder(): void {
        this.letterDisplayMode.set('vowelsFirst');
    }

    protected setCircleLayout(): void {
        this.letterLayoutMode.set('circle');
    }

    protected resetLetters(): void {
        this.letterDisplayMode.set('default');
        this.letterLayoutMode.set('line');
    }

    protected getCircleLetterStyle(index: number): Record<string, string> {
        const letters = this.displayedLetters();
        const totalLetters = letters.length;

        if (totalLetters === 0) {
            return {};
        }

        const radius = totalLetters <= 6 ? 5.25 : 6;
        const angle = (index / totalLetters) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return {
            transform: `translate(${x}rem, ${y}rem)`,
        };
    }

    protected shouldShowVowelDivider(index: number): boolean {
        return (
            this.letterDisplayMode() === 'vowelsFirst' &&
            this.vowelCount() > 0 &&
            index === this.vowelCount() - 1 &&
            this.vowelCount() < this.displayedLetters().length
        );
    }

    private async loadPuzzle(): Promise<void> {
        try {
            await this.anagramService.loadWords();
            this.nextPuzzle();
        } catch {
            this.loadError.set('Impossible de charger la liste d’anagrammes.');
        } finally {
            this.isLoading.set(false);
        }
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

    protected isVowel(letter: string): boolean {
        return ['A', 'E', 'I', 'O', 'U', 'Y'].includes(
            this.normalizeLetter(letter),
        );
    }

    private normalizeLetter(letter: string): string {
        return letter
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toUpperCase();
    }

    private focusAnswerField(): void {
        window.setTimeout(() => this.answerField?.nativeElement.focus());
    }
}
