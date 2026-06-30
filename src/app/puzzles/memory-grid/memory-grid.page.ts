import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    MemoryGridCell,
    MemoryGridColor,
    MemoryGridShape,
    PlayerMemoryGridCell,
} from '../../puzzles/memory-grid/memory-grid.model';
import { MemoryGridService } from '../../puzzles/memory-grid/memory-grid.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type GamePhase = 'memorize' | 'play';

type MnemonicLegendItem = {
    label: string;
    object: string;
    quality: string;
    action: string;
};

type MemoryPalaceLocation = {
    position: number;
    location: string;
};

@Component({
    selector: 'app-memory-grid-page',
    imports: [RouterLink, PuzzleSuccessPopupComponent],
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
            object: 'Pompier',
            quality: 'Roti',
            action: 'Brûler',
        },
        {
            label: 'Jaune',
            object: 'Citron',
            quality: 'Surette',
            action: 'Grimacer de surette',
        },
        {
            label: 'Gris',
            object: 'Nassim',
            quality: 'Riche',
            action: 'Ramer avec un arc',
        },
        {
            label: 'Vert',
            object: 'Grinch',
            quality: 'Malade',
            action: 'Vomir',
        },
        {
            label: 'Bleu',
            object: 'Schtroumpf',
            quality: 'Triste',
            action: 'Pleurer',
        },
        {
            label: 'Orange',
            object: 'Citrouille',
            quality: 'Déguisé',
            action: 'Demander des bonbons',
        },
        {
            label: 'Mauve',
            object: 'Grosse douceur',
            quality: 'Sexy',
            action: 'Faire un câlin',
        },
        {
            label: 'Rose',
            object: 'Princesse',
            quality: 'Fleuri',
            action: 'Faire de la slackline',
        },
    ];

    protected readonly shapeMnemonics: MnemonicLegendItem[] = [
        {
            label: 'Cercle',
            object: 'Soleil',
            quality: 'Chaud',
            action: 'Orbiter',
        },
        {
            label: 'Triangle',
            object: 'Pizza',
            quality: 'Gratiné',
            action: 'Manger',
        },
        {
            label: 'Rectangle',
            object: 'Lit',
            quality: 'Fatigué',
            action: 'Dormir',
        },
        {
            label: 'Carré',
            object: 'Cric Crac et Croc',
            quality: 'Trempé de lait',
            action: 'Danser',
        },
        {
            label: 'Losange',
            object: 'Diamant',
            quality: 'Brille',
            action: 'Porter une bague',
        },
        {
            label: 'Pentagone',
            object: 'Diable',
            quality: 'Maléfique',
            action: 'Invoquer',
        },
        {
            label: 'Hexagone',
            object: 'Ruche',
            quality: 'Bourdonne',
            action: 'Faire une réaction allergique',
        },
    ];

    protected readonly memoryPalaceLocations: MemoryPalaceLocation[] = [
        {
            position: 1,
            location: 'Balcon avant',
        },
        {
            position: 2,
            location: 'Portique',
        },
        {
            position: 3,
            location: 'Salle de bain',
        },
        {
            position: 4,
            location: 'Garde-manger',
        },
        {
            position: 5,
            location: 'Îlot de cuisine',
        },
        {
            position: 6,
            location: 'Divan du salon',
        },
        {
            position: 7,
            location: 'Télévision',
        },
        {
            position: 8,
            location: 'Table de la cuisine',
        },
        {
            position: 9,
            location: 'Patio arrière',
        },
        {
            position: 10,
            location: 'Piscine',
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

    protected placeHint(): void {
        if (this.phase() !== 'play' || this.isSolved()) {
            return;
        }

        const hintIndex = this.answerGrid().findIndex(
            (answerCell, index) =>
                !this.memoryGridService.areCellsEqual(answerCell, this.playerGrid()[index]),
        );

        if (hintIndex < 0) {
            return;
        }

        const nextGrid = [...this.playerGrid()];
        nextGrid[hintIndex] = { ...this.answerGrid()[hintIndex] };

        this.playerGrid.set(nextGrid);
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
