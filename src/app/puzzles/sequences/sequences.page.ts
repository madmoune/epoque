import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { MathSequencePuzzle } from '../../puzzles/sequences/sequences.model';
import { SequencesService } from '../../puzzles/sequences/sequences.service';

@Component({
    selector: 'app-sequences-page',
    imports: [RouterLink, PuzzleSuccessPopupComponent],
    templateUrl: './sequences.page.html',
    styleUrl: './sequences.page.scss',
})
export class SequencesPage {
    @ViewChild('answerField')
    private readonly answerField?: ElementRef<HTMLInputElement>;

    private readonly sequencesService = inject(SequencesService);

    protected readonly puzzle = signal<MathSequencePuzzle>(
        this.sequencesService.createPuzzle(),
    );

    protected readonly mathAnswer = signal('');
    protected readonly hintCount = signal(0);

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

    protected showHint(): void {
        this.hintCount.update((count) => Math.min(count + 1, 2));
    }

    protected nextPuzzle(): void {
        this.puzzle.set(this.sequencesService.createPuzzle());
        this.mathAnswer.set('');
        this.hintCount.set(0);
        window.setTimeout(() => this.answerField?.nativeElement.focus());
    }
}
