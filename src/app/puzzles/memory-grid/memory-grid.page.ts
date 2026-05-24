import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    MemoryGridCell,
    MemoryGridColor,
    MemoryGridShape,
    PlayerMemoryGridCell,
} from '../../puzzles/memory-grid/memory-grid.model';
import { MemoryGridService } from '../../puzzles/memory-grid/memory-grid.service';

type GamePhase = 'memorize' | 'play';

type MnemonicLegendItem = {
    label: string;
    mnemonic: string;
    explanation: string;
};

@Component({
    selector: 'app-memory-grid-page',
    imports: [RouterLink],
    templateUrl: './memory-grid.page.html',
    styleUrl: './memory-grid.page.scss',
})
export class MemoryGridPage {
    protected readonly memoryGridService = inject(MemoryGridService);

    protected readonly colors = this.memoryGridService.colors;
    protected readonly shapes = this.memoryGridService.shapes;

    protected readonly colorMnemonics: MnemonicLegendItem[] = [
        {
            label: 'Rouge',
            mnemonic: 'Arrosé',
            explanation: 'Rouge pompier "qui arrose" un feu',
        },
        {
            label: 'Jaune',
            mnemonic: 'Chantant',
            explanation:
                'Jaune pâle, la couleur préférée de Sean Paul, le chanteur',
        },
        {
            label: 'Gris',
            mnemonic: 'Puant',
            explanation: "Gris-aille, l'ail ça pue.",
        },
        {
            label: 'Vert',
            mnemonic: 'Sous-terrain',
            explanation: 'Vert de terre, sous la terre',
        },
        {
            label: 'Bleu',
            mnemonic: 'Endormi',
            explanation: 'Bleu nuit, la nuit on dort',
        },
        {
            label: 'Orange',
            mnemonic: 'Mécanique',
            explanation: 'Orange Mécanique',
        },
        {
            label: 'Mauve',
            mnemonic: 'Sexy',
            explanation: 'Dildo mauve',
        },
        {
            label: 'Rose',
            mnemonic: 'Équilibré',
            explanation: 'Faire du slackline professionnellement.',
        },
    ];

    protected readonly shapeMnemonics: MnemonicLegendItem[] = [
        {
            label: 'Cercle',
            mnemonic: "Film d'horreur",
            explanation: 'Le Cercle',
        },
        {
            label: 'Triangle',
            mnemonic: 'Bac à recyclage',
            explanation: 'TRIangle, on trie nos déchets',
        },
        {
            label: 'Rectangle',
            mnemonic: 'Manque de respect',
            explanation: 'RECKED → Diss → Disrespect',
        },
        {
            label: 'Carré',
            mnemonic: 'Calendrier',
            explanation: 'Carré aux dates',
        },
        {
            label: 'Losange',
            mnemonic: 'Magicien',
            explanation: "lOZange, magicien d'OZ",
        },
        {
            label: 'Pentagone',
            mnemonic: 'Diable',
            explanation: 'Pentagramme',
        },
        {
            label: 'Hexagone',
            mnemonic: 'Saucisse',
            explanation: 'SauSIX côté.',
        },
    ];

    protected readonly answerGrid = signal<MemoryGridCell[]>(
        this.memoryGridService.createAnswerGrid(),
    );

    protected readonly playerGrid = signal<PlayerMemoryGridCell[]>(
        this.memoryGridService.createEmptyPlayerGrid(),
    );

    protected readonly phase = signal<GamePhase>('memorize');
    protected readonly revealStep = signal(1);
    protected readonly selectedCellIndex = signal<number | null>(null);
    protected readonly isPickerOpen = signal(false);

    protected readonly revealChunks = signal<number[][]>(
        this.createRevealChunks(),
    );

    protected readonly visibleAnswerIndexes = computed(() => {
        const currentStep = this.revealStep();
        const chunks = this.revealChunks();

        return new Set(chunks[currentStep - 1] ?? []);
    });

    protected readonly selectedCell = computed(() => {
        const index = this.selectedCellIndex();

        if (index === null) {
            return null;
        }

        return this.playerGrid()[index];
    });

    protected readonly isGridComplete = computed(() =>
        this.playerGrid().every((cell) => cell.color && cell.shape),
    );

    protected readonly isSolved = computed(() => {
        if (!this.isGridComplete()) {
            return false;
        }

        return this.answerGrid().every((answerCell, index) =>
            this.memoryGridService.areCellsEqual(answerCell, this.playerGrid()[index]),
        );
    });

    protected readonly correctCellCount = computed(() =>
        this.answerGrid().filter((answerCell, index) =>
            this.memoryGridService.areCellsEqual(answerCell, this.playerGrid()[index]),
        ).length,
    );

    protected goToNextRevealStep(): void {
        if (this.revealStep() < 3) {
            this.revealStep.update((step) => step + 1);
            return;
        }

        this.phase.set('play');
    }

    protected openCellPicker(index: number): void {
        if (this.phase() !== 'play' || this.isSolved()) {
            return;
        }

        this.selectedCellIndex.set(index);
        this.isPickerOpen.set(true);
    }

    protected closePicker(): void {
        this.isPickerOpen.set(false);
    }

    protected selectColor(color: MemoryGridColor): void {
        const index = this.selectedCellIndex();

        if (index === null || this.isSolved()) {
            return;
        }

        const nextGrid = [...this.playerGrid()];
        nextGrid[index] = {
            ...nextGrid[index],
            color,
        };

        this.playerGrid.set(nextGrid);
        this.closePickerIfCellComplete(index);
    }

    protected selectShape(shape: MemoryGridShape): void {
        const index = this.selectedCellIndex();

        if (index === null || this.isSolved()) {
            return;
        }

        const nextGrid = [...this.playerGrid()];
        nextGrid[index] = {
            ...nextGrid[index],
            shape,
        };

        this.playerGrid.set(nextGrid);
        this.closePickerIfCellComplete(index);
    }

    protected clearSelectedCell(): void {
        const index = this.selectedCellIndex();

        if (index === null || this.isSolved()) {
            return;
        }

        const nextGrid = [...this.playerGrid()];
        nextGrid[index] = {
            color: null,
            shape: null,
        };

        this.playerGrid.set(nextGrid);
    }

    protected resetPlayerGrid(): void {
        if (this.isSolved()) {
            return;
        }

        this.playerGrid.set(this.memoryGridService.createEmptyPlayerGrid());
        this.selectedCellIndex.set(null);
        this.isPickerOpen.set(false);
    }

    protected nextPuzzle(): void {
        this.answerGrid.set(this.memoryGridService.createAnswerGrid());
        this.playerGrid.set(this.memoryGridService.createEmptyPlayerGrid());
        this.phase.set('memorize');
        this.revealStep.set(1);
        this.selectedCellIndex.set(null);
        this.isPickerOpen.set(false);
        this.revealChunks.set(this.createRevealChunks());
    }

    protected colorLabel(color: MemoryGridColor): string {
        const labels: Record<MemoryGridColor, string> = {
            blue: 'bleu',
            red: 'rouge',
            gray: 'gris',
            yellow: 'jaune',
            green: 'vert',
            orange: 'orange',
            pink: 'rose',
            purple: 'mauve',
        };

        return labels[color];
    }

    protected shapeLabel(shape: MemoryGridShape): string {
        const labels: Record<MemoryGridShape, string> = {
            circle: 'cercle',
            square: 'carré',
            rectangle: 'rectangle',
            triangle: 'triangle',
            losange: 'losange',
            pentagon: 'pentagone',
            hexagon: 'hexagone',
        };

        return labels[shape];
    }

    private closePickerIfCellComplete(index: number): void {
        const cell = this.playerGrid()[index];

        if (cell.color && cell.shape) {
            this.isPickerOpen.set(false);
        }
    }

    private createRevealChunks(): number[][] {
        const shuffledIndexes = this.shuffle(
            Array.from({ length: 9 }, (_, index) => index),
        );

        return [
            shuffledIndexes.slice(0, 3),
            shuffledIndexes.slice(3, 6),
            shuffledIndexes.slice(6, 9),
        ];
    }

    private shuffle<T>(items: T[]): T[] {
        const shuffledItems = [...items];

        for (let index = shuffledItems.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));

            [shuffledItems[index], shuffledItems[swapIndex]] = [
                shuffledItems[swapIndex],
                shuffledItems[index],
            ];
        }

        return shuffledItems;
    }
}