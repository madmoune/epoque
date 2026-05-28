import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    DicePathCell,
    DiceSymbol,
} from '../../puzzles/dice/dice.model';
import { DiceService } from '../../puzzles/dice/dice.service';

type ConnectionDirection = 'up' | 'down' | 'left' | 'right';

type CompactGridBounds = {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
};

@Component({
    selector: 'app-dice-page',
    imports: [RouterLink],
    templateUrl: './dice.page.html',
    styleUrl: './dice.page.scss',
})
export class DicePage {
    protected readonly diceService = inject(DiceService);

    protected readonly puzzle = signal(this.diceService.createPuzzle());
    protected readonly selectedSymbolId = signal<string | null>(null);

    protected readonly compactBounds = computed<CompactGridBounds>(() => {
        const path = this.puzzle().path;

        const rows = path.map((cell) => cell.row);
        const cols = path.map((cell) => cell.col);

        return {
            minRow: Math.min(...rows),
            maxRow: Math.max(...rows),
            minCol: Math.min(...cols),
            maxCol: Math.max(...cols),
        };
    });

    protected readonly compactRows = computed(() => {
        const bounds = this.compactBounds();

        return Array.from(
            { length: bounds.maxRow - bounds.minRow + 1 },
            (_, index) => bounds.minRow + index,
        );
    });

    protected readonly compactCols = computed(() => {
        const bounds = this.compactBounds();

        return Array.from(
            { length: bounds.maxCol - bounds.minCol + 1 },
            (_, index) => bounds.minCol + index,
        );
    });

    protected readonly gridTemplateColumns = computed(
        () => `repeat(${this.compactCols().length}, var(--dice-cell-size))`,
    );

    protected readonly hasAnswered = computed(
        () => this.selectedSymbolId() !== null,
    );

    protected readonly isCorrect = computed(
        () => this.selectedSymbolId() === this.puzzle().answerSymbolId,
    );

    protected readonly isIncorrect = computed(
        () => this.hasAnswered() && !this.isCorrect(),
    );

    protected selectSymbol(symbol: DiceSymbol): void {
        if (this.hasAnswered()) {
            return;
        }

        this.selectedSymbolId.set(symbol.id);
    }

    protected nextPuzzle(): void {
        this.puzzle.set(this.diceService.createPuzzle());
        this.selectedSymbolId.set(null);
    }

    protected getSymbolIcon(symbolId: string): string {
        return this.diceService.getSymbolById(symbolId).icon;
    }

    protected getSymbolLabel(symbolId: string): string {
        return this.diceService.getSymbolById(symbolId).label;
    }

    protected getCell(row: number, col: number): DicePathCell | null {
        return (
            this.puzzle().path.find(
                (cell) => cell.row === row && cell.col === col,
            ) ?? null
        );
    }

    protected hasConnection(
        row: number,
        col: number,
        direction: ConnectionDirection,
    ): boolean {
        const path = this.puzzle().path;
        const index = path.findIndex(
            (cell) => cell.row === row && cell.col === col,
        );

        if (index === -1) {
            return false;
        }

        const current = path[index];
        const previous = path[index - 1];
        const next = path[index + 1];

        return (
            this.isNeighborInDirection(current, previous, direction) ||
            this.isNeighborInDirection(current, next, direction)
        );
    }

    private isNeighborInDirection(
        current: DicePathCell,
        other: DicePathCell | undefined,
        direction: ConnectionDirection,
    ): boolean {
        if (!other) {
            return false;
        }

        if (direction === 'up') {
            return other.row === current.row - 1 && other.col === current.col;
        }

        if (direction === 'down') {
            return other.row === current.row + 1 && other.col === current.col;
        }

        if (direction === 'left') {
            return other.row === current.row && other.col === current.col - 1;
        }

        return other.row === current.row && other.col === current.col + 1;
    }
}