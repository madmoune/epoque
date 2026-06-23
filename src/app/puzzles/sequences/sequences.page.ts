import { Component, HostListener, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    CustomKeyboardComponent,
    CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { MathSequencePuzzle } from '../../puzzles/sequences/sequences.model';
import { SequencesService } from '../../puzzles/sequences/sequences.service';

@Component({
    selector: 'app-sequences-page',
    imports: [RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
    templateUrl: './sequences.page.html',
    styleUrl: './sequences.page.scss',
})
export class SequencesPage {
    @ViewChild('answerField')
    private readonly answerField?: ElementRef<HTMLInputElement>;
    private suppressNextSelection = false;

    private readonly sequencesService = inject(SequencesService);

    protected readonly puzzle = signal<MathSequencePuzzle>(
        this.sequencesService.createPuzzle(),
    );

    protected readonly mathAnswer = signal('');
    protected readonly hintCount = signal(0);
    protected readonly keyboardVisible = signal(false);
    protected readonly numberKeyboardRows: CustomKeyboardKey[][] = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['-', '0', 'backspace'],
    ];

    protected readonly isHintVisible = computed(() => this.hintCount() >= 1);
    protected readonly isAnswerHintVisible = computed(() => this.hintCount() >= 2);

    protected readonly isCorrect = computed(() => {
        const answer = this.mathAnswer().trim();

        if (answer.length === 0) {
            return false;
        }

        return Number(answer) === this.puzzle().answer;
    });

    protected readonly isIncorrect = computed(
        () => this.mathAnswer().trim().length > 0 && !this.isCorrect(),
    );

    protected updateMathAnswer(event: Event): void {
        const input = event.target;

        if (!(input instanceof HTMLInputElement)) {
            return;
        }

        this.mathAnswer.set(input.value);
    }

    protected handleKeyboardKey(key: CustomKeyboardKey): void {
        if (this.isCorrect()) return;

        if (key === 'backspace') {
            this.mathAnswer.update((answer) => answer.slice(0, -1));
            this.focusAnswerField(false);
            return;
        }

        if (key === 'space') return;

        if (key === '-') {
            this.mathAnswer.update((answer) => (answer.startsWith('-') ? answer.slice(1) : `-${answer}`));
            this.focusAnswerField(false);
            return;
        }

        this.mathAnswer.update((answer) => `${answer}${key}`);
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

    protected showHint(): void {
        this.hintCount.update((count) => Math.min(count + 1, 2));
    }

    protected nextPuzzle(): void {
        this.puzzle.set(this.sequencesService.createPuzzle());
        this.mathAnswer.set('');
        this.hintCount.set(0);
        this.focusAnswerField(false);
    }

    private focusAnswerField(selectOnFocus = true): void {
        this.suppressNextSelection = !selectOnFocus;
        window.setTimeout(() => this.answerField?.nativeElement.focus());
    }
}
