import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    MnemonicDecodePuzzle,
    MnemonicEncodeOption,
    MnemonicEncodePuzzle,
    MnemonicPuzzle,
} from '../../puzzles/mnemonic/mnemonic.model';
import { MnemonicService } from '../../puzzles/mnemonic/mnemonic.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

@Component({
    selector: 'app-mnemonic-page',
    imports: [RouterLink, PuzzleSuccessPopupComponent],
    templateUrl: './mnemonic.page.html',
    styleUrl: './mnemonic.page.scss',
})
export class MnemonicPage {
    protected readonly mnemonicService = inject(MnemonicService);

    protected readonly puzzle = signal<MnemonicPuzzle>(
        this.mnemonicService.createPuzzle(),
    );

    protected readonly selectedColorId = signal<string | null>(null);
    protected readonly selectedShapeId = signal<string | null>(null);
    protected readonly selectedPosition = signal<number | null>(null);
    protected readonly selectedOptionId = signal<string | null>(null);

    protected readonly decodePuzzle = computed(() =>
        this.puzzle().mode === 'decode'
            ? (this.puzzle() as MnemonicDecodePuzzle)
            : null,
    );

    protected readonly encodePuzzle = computed(() =>
        this.puzzle().mode === 'encode'
            ? (this.puzzle() as MnemonicEncodePuzzle)
            : null,
    );

    protected readonly isDecodeReady = computed(
        () =>
            this.selectedColorId() !== null &&
            this.selectedShapeId() !== null &&
            this.selectedPosition() !== null,
    );

    protected readonly hasAnswered = computed(() => {
        const puzzle = this.puzzle();

        if (puzzle.mode === 'decode') {
            return this.isDecodeReady();
        }

        return this.selectedOptionId() !== null;
    });

    protected readonly isCorrect = computed(() => {
        const puzzle = this.puzzle();

        if (puzzle.mode === 'decode') {
            return (
                this.selectedColorId() === puzzle.colorId &&
                this.selectedShapeId() === puzzle.shapeId &&
                this.selectedPosition() === puzzle.position
            );
        }

        return this.selectedOptionId() === puzzle.answerOptionId;
    });

    protected readonly isIncorrect = computed(
        () => this.hasAnswered() && !this.isCorrect(),
    );

    protected selectColor(colorId: string): void {
        if (this.isCorrect()) {
            return;
        }

        this.selectedColorId.set(colorId);
    }

    protected selectShape(shapeId: string): void {
        if (this.isCorrect()) {
            return;
        }

        this.selectedShapeId.set(shapeId);
    }

    protected selectPosition(position: number): void {
        if (this.isCorrect()) {
            return;
        }

        this.selectedPosition.set(position);
    }

    protected selectOption(option: MnemonicEncodeOption): void {
        if (this.selectedOptionId() !== null) {
            return;
        }

        this.selectedOptionId.set(option.id);
    }

    protected nextPuzzle(): void {
        this.puzzle.set(this.mnemonicService.createPuzzle());
        this.selectedColorId.set(null);
        this.selectedShapeId.set(null);
        this.selectedPosition.set(null);
        this.selectedOptionId.set(null);
    }
}
