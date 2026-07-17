import { Injectable } from '@angular/core';
import {
    MemoryGridCell,
    MemoryGridColor,
    MemoryGridShape,
    PlayerMemoryGridCell,
} from './memory-grid.model';

export const MEMORY_GRID_COLORS: MemoryGridColor[] = [
    'blue',
    'red',
    'gray',
    'yellow',
    'green',
    'orange',
    'pink',
    'purple',
];

export const MEMORY_GRID_SHAPES: MemoryGridShape[] = [
    'circle',
    'square',
    'rectangle',
    'triangle',
    'losange',
    'pentagon',
    'hexagon',
];

@Injectable({
    providedIn: 'root',
})
export class MemoryGridService {
    readonly colors = MEMORY_GRID_COLORS;
    readonly shapes = MEMORY_GRID_SHAPES;

    createAnswerGrid(): MemoryGridCell[] {
        return Array.from({ length: 9 }, () => ({
            color: this.getRandomItem(this.colors),
            shape: this.getRandomItem(this.shapes),
        }));
    }

    createEmptyPlayerGrid(): PlayerMemoryGridCell[] {
        return Array.from({ length: 9 }, () => ({
            color: null,
            shape: null,
        }));
    }

    areCellsEqual(
        answerCell: MemoryGridCell,
        playerCell: PlayerMemoryGridCell,
    ): boolean {
        return (
            answerCell.color === playerCell.color &&
            answerCell.shape === playerCell.shape
        );
    }

    private getRandomItem<T>(items: T[]): T {
        return items[Math.floor(Math.random() * items.length)];
    }
}
