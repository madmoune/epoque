import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
    PhraseCharacter,
    PhrasePuzzle,
} from '../../puzzles/phrases/phrase.model';
import { PhraseService } from '../../puzzles/phrases/phrase.service';

@Component({
    selector: 'app-phrases-page',
    imports: [RouterLink, FormsModule],
    templateUrl: './phrase.page.html',
    styleUrl: './phrase.page.scss',
})
export class PhrasesPage {
    private readonly phraseService = inject(PhraseService);

    protected readonly isLoading = signal(true);
    protected readonly loadError = signal<string | null>(null);

    protected readonly puzzle = signal<PhrasePuzzle | null>(null);
    protected readonly answerInput = signal('');

    protected readonly characters = computed<PhraseCharacter[]>(() => {
        const puzzle = this.puzzle();

        if (!puzzle) {
            return [];
        }

        return puzzle.answer.split('').map((character, index) => {
            const isLetter = this.isLetter(character);
            const isLocked = puzzle.lockedIndexes.has(index);

            return {
                character,
                index,
                isLetter,
                isLocked,
                isRevealed:
                    !isLetter ||
                    puzzle.revealedIndexes.has(index),
            };
        });
    });

    protected readonly wordGroups = computed(() => {
        const groups: PhraseCharacter[][] = [];
        let currentGroup: PhraseCharacter[] = [];

        for (const character of this.characters()) {
            if (character.character === ' ') {
                if (currentGroup.length > 0) {
                    groups.push(currentGroup);
                    currentGroup = [];
                }

                continue;
            }

            currentGroup.push(character);
        }

        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return groups;
    });

    protected readonly isAnswerCorrect = computed(() => {
        const puzzle = this.puzzle();

        if (!puzzle) {
            return false;
        }

        return (
            this.normalizeAnswer(this.answerInput()) ===
            this.normalizeAnswer(puzzle.answer)
        );
    });

    protected readonly isSolved = computed(() => {
        const puzzle = this.puzzle();

        if (!puzzle) {
            return false;
        }

        const allUnlockedLettersRevealed = puzzle.answer
            .split('')
            .every((character, index) =>
                !this.isLetter(character) ||
                puzzle.lockedIndexes.has(index) ||
                puzzle.revealedIndexes.has(index),
            );

        return allUnlockedLettersRevealed || this.isAnswerCorrect();
    });

    constructor() {
        void this.loadPuzzle();
    }

    protected revealCharacter(index: number): void {
        const puzzle = this.puzzle();

        if (!puzzle || this.isSolved() || puzzle.lockedIndexes.has(index)) {
            return;
        }

        const character = puzzle.answer[index];

        if (!this.isLetter(character)) {
            return;
        }

        this.puzzle.set({
            ...puzzle,
            revealedIndexes: new Set([...puzzle.revealedIndexes, index]),
        });
    }

    protected revealAllUnlocked(): void {
        const puzzle = this.puzzle();

        if (!puzzle) {
            return;
        }

        const revealedIndexes = new Set<number>();

        puzzle.answer.split('').forEach((character, index) => {
            if (this.isLetter(character) && !puzzle.lockedIndexes.has(index)) {
                revealedIndexes.add(index);
            }
        });

        this.puzzle.set({
            ...puzzle,
            revealedIndexes,
        });
    }

    protected updateAnswer(value: string): void {
        this.answerInput.set(value);
    }

    protected nextPuzzle(): void {
        this.puzzle.set(this.phraseService.getRandomPuzzle());
        this.answerInput.set('');
    }

    private async loadPuzzle(): Promise<void> {
        try {
            await this.phraseService.loadPhrases();
            this.nextPuzzle();
        } catch (error) {
            console.error('Could not load phrases:', error);
            this.loadError.set('Could not load the phrase list.');
        } finally {
            this.isLoading.set(false);
        }
    }

    private normalizeAnswer(value: string): string {
        return value
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .trim()
            .replace(/\s+/g, ' ')
            .toUpperCase();
    }

    private isLetter(character: string): boolean {
        return /^[A-Z]$/.test(character);
    }
}