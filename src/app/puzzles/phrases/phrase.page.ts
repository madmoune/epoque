import { Component, HostListener, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
    PhraseCharacter,
    PhrasePuzzle,
} from '../../puzzles/phrases/phrase.model';
import { PhraseService } from '../../puzzles/phrases/phrase.service';
import {
    CustomKeyboardComponent,
    CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

@Component({
    selector: 'app-phrases-page',
    imports: [RouterLink, FormsModule, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
    templateUrl: './phrase.page.html',
    styleUrl: './phrase.page.scss',
})
export class PhrasesPage {
    @ViewChild('answerField')
    private readonly answerField?: ElementRef<HTMLInputElement>;
    private suppressNextSelection = false;

    private readonly phraseService = inject(PhraseService);

    protected readonly isLoading = signal(true);
    protected readonly loadError = signal<string | null>(null);

    protected readonly puzzle = signal<PhrasePuzzle | null>(null);
    protected readonly answerInput = signal('');
    protected readonly keyboardVisible = signal(false);
    protected readonly letterKeyboardRows: CustomKeyboardKey[][] = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'backspace'],
        ['space', 'clear'],
    ];

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

    protected handleKeyboardKey(key: CustomKeyboardKey): void {
        if (this.isSolved()) return;

        if (key === 'backspace') {
            this.answerInput.update((answer) => answer.slice(0, -1));
            this.focusAnswerField(false);
            return;
        }

        if (key === 'clear') {
            this.answerInput.set('');
            this.focusAnswerField(false);
            return;
        }

        this.answerInput.update((answer) => `${answer}${key === 'space' ? ' ' : key}`);
        this.focusAnswerField(false);
    }

    protected selectInputContent(event: Event): void {
        if (event.target instanceof HTMLInputElement) {
            this.keyboardVisible.set(true);
            if (this.suppressNextSelection) {
                this.suppressNextSelection = false;
                return;
            }
            event.target.select();
        }
    }

    @HostListener('document:pointerdown', ['$event'])
    protected hideKeyboardWhenClickingAway(event: PointerEvent): void {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.closest('.answer-input') || target.closest('app-custom-keyboard')) return;
        this.keyboardVisible.set(false);
    }

    protected nextPuzzle(): void {
        this.puzzle.set(this.phraseService.getRandomPuzzle());
        this.answerInput.set('');
        this.focusAnswerField(false);
    }

    private async loadPuzzle(): Promise<void> {
        try {
            await this.phraseService.loadPhrases();
            this.nextPuzzle();
        } catch (error) {
            console.error('Impossible de charger les phrases :', error);
            this.loadError.set('Impossible de charger la liste de phrases.');
        } finally {
            this.isLoading.set(false);
        }
    }

    private normalizeAnswer(value: string): string {
        return value
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^\p{Letter}\p{Number}\s]/gu, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    private isLetter(character: string): boolean {
        return /^[A-Z]$/.test(character);
    }

    private focusAnswerField(selectOnFocus = true): void {
        this.suppressNextSelection = !selectOnFocus;
        window.setTimeout(() => this.answerField?.nativeElement.focus());
    }
}
