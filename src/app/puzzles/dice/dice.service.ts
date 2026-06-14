import { Injectable } from '@angular/core';
import {
    DiceOrientation,
    DicePathCell,
    DicePuzzle,
    DiceSymbol,
} from './dice.model';

type Direction = 'up' | 'down' | 'left' | 'right';

type Position = {
    row: number;
    col: number;
};

@Injectable({
    providedIn: 'root',
})
export class DiceService {
    readonly symbols: DiceSymbol[] = [
        {
            id: 'star',
            label: 'Étoile',
            icon: '★',
        },
        {
            id: 'moon',
            label: 'Lune',
            icon: '☾',
        },
        {
            id: 'heart',
            label: 'Cœur',
            icon: '♥',
        },
        {
            id: 'bolt',
            label: 'Éclair',
            icon: '⚡',
        },
        {
            id: 'flower',
            label: 'Fleur',
            icon: '✿',
        },
        {
            id: 'diamond',
            label: 'Diamant',
            icon: '◆',
        },
    ];

    createPuzzle(): DicePuzzle {
        const maxAttempts = 1000;
        const gridSize = 5;
        const minimumVisibleStamps = 6;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const shuffledSymbols = this.shuffle(this.symbols);

            const orientation: DiceOrientation = {
                top: shuffledSymbols[0].id,
                bottom: shuffledSymbols[1].id,
                front: shuffledSymbols[2].id,
                back: shuffledSymbols[3].id,
                left: shuffledSymbols[4].id,
                right: shuffledSymbols[5].id,
            };

            const pathLength = this.randomInt(minimumVisibleStamps + 1, 10);
            const positions = this.createPathPositions(gridSize, pathLength);
            const path = this.createStampedPath(positions, orientation);
            const answerSymbolId = path[path.length - 1].symbolId;

            const hiddenPath = path.map((cell, index) => ({
                ...cell,
                hidden: index === path.length - 1,
            }));

            const possibleAnswers = this.findPossibleLastSymbols(hiddenPath);

            if (
                possibleAnswers.size === 1 &&
                possibleAnswers.has(answerSymbolId)
            ) {
                return {
                    symbols: this.symbols,
                    orientation,
                    gridSize,
                    path: hiddenPath,
                    answerSymbolId,
                };
            }
        }

        return this.createFallbackPuzzle();
    }

    getSymbolById(symbolId: string): DiceSymbol {
        const symbol = this.symbols.find((item) => item.id === symbolId);

        if (!symbol) {
            throw new Error(`Dice symbol not found: ${symbolId}`);
        }

        return symbol;
    }

    private createFallbackPuzzle(): DicePuzzle {
        const orientation: DiceOrientation = {
            top: 'star',
            bottom: 'moon',
            front: 'heart',
            back: 'bolt',
            left: 'flower',
            right: 'diamond',
        };

        const positions: Position[] = [
            { row: 2, col: 0 },
            { row: 2, col: 1 },
            { row: 1, col: 1 },
            { row: 1, col: 2 },
            { row: 2, col: 2 },
            { row: 2, col: 3 },
            { row: 3, col: 3 },
            { row: 3, col: 2 },
            { row: 4, col: 2 },
        ];

        const path = this.createStampedPath(positions, orientation);
        const answerSymbolId = path[path.length - 1].symbolId;

        const hiddenPath = path.map((cell, index) => ({
            ...cell,
            hidden: index === path.length - 1,
        }));

        return {
            symbols: this.symbols,
            orientation,
            gridSize: 5,
            path: hiddenPath,
            answerSymbolId,
        };
    }

    private findPossibleLastSymbols(path: DicePathCell[]): Set<string> {
        const possibleAnswers = new Set<string>();
        const symbolIds = this.symbols.map((symbol) => symbol.id);
        const possibleOrientations = this.createAllPossibleOrientations(symbolIds);

        for (const orientation of possibleOrientations) {
            const simulatedPath = this.createStampedPath(path, orientation);

            const matchesVisibleStamps = path.every((cell, index) => {
                if (cell.hidden) {
                    return true;
                }

                return cell.symbolId === simulatedPath[index].symbolId;
            });

            if (!matchesVisibleStamps) {
                continue;
            }

            const hiddenCellIndex = path.findIndex((cell) => cell.hidden);

            if (hiddenCellIndex === -1) {
                continue;
            }

            possibleAnswers.add(simulatedPath[hiddenCellIndex].symbolId);
        }

        return possibleAnswers;
    }

    private createAllPossibleOrientations(symbolIds: string[]): DiceOrientation[] {
        return this.permute(symbolIds).map((permutation) => ({
            top: permutation[0],
            bottom: permutation[1],
            front: permutation[2],
            back: permutation[3],
            left: permutation[4],
            right: permutation[5],
        }));
    }

    private createPathPositions(
        gridSize: number,
        pathLength: number,
    ): Position[] {
        const maxAttempts = 500;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const start: Position = {
                row: this.randomInt(1, gridSize - 2),
                col: this.randomInt(1, gridSize - 2),
            };

            const positions: Position[] = [start];
            const visited = new Set<string>([this.positionKey(start)]);

            while (positions.length < pathLength) {
                const current = positions[positions.length - 1];

                const candidates = this.shuffle(
                    this.getNeighbors(current, gridSize).filter(
                        (neighbor) => !visited.has(this.positionKey(neighbor)),
                    ),
                );

                if (candidates.length === 0) {
                    break;
                }

                const next = candidates[0];
                positions.push(next);
                visited.add(this.positionKey(next));
            }

            if (positions.length === pathLength) {
                return positions;
            }
        }

        return [
            { row: 2, col: 0 },
            { row: 2, col: 1 },
            { row: 1, col: 1 },
            { row: 1, col: 2 },
            { row: 2, col: 2 },
            { row: 2, col: 3 },
            { row: 3, col: 3 },
        ];
    }

    private createStampedPath(
        positions: Position[],
        startOrientation: DiceOrientation,
    ): DicePathCell[] {
        const path: DicePathCell[] = [];
        let orientation = { ...startOrientation };

        path.push({
            row: positions[0].row,
            col: positions[0].col,
            step: 1,
            symbolId: orientation.bottom,
            hidden: false,
        });

        for (let index = 1; index < positions.length; index++) {
            const previous = positions[index - 1];
            const current = positions[index];
            const direction = this.getDirection(previous, current);

            orientation = this.roll(orientation, direction);

            path.push({
                row: current.row,
                col: current.col,
                step: index + 1,
                symbolId: orientation.bottom,
                hidden: false,
            });
        }

        return path;
    }

    private getNeighbors(position: Position, gridSize: number): Position[] {
        const neighbors: Position[] = [];

        if (position.row > 0) {
            neighbors.push({
                row: position.row - 1,
                col: position.col,
            });
        }

        if (position.row < gridSize - 1) {
            neighbors.push({
                row: position.row + 1,
                col: position.col,
            });
        }

        if (position.col > 0) {
            neighbors.push({
                row: position.row,
                col: position.col - 1,
            });
        }

        if (position.col < gridSize - 1) {
            neighbors.push({
                row: position.row,
                col: position.col + 1,
            });
        }

        return neighbors;
    }

    private getDirection(from: Position, to: Position): Direction {
        if (to.row === from.row - 1 && to.col === from.col) {
            return 'up';
        }

        if (to.row === from.row + 1 && to.col === from.col) {
            return 'down';
        }

        if (to.row === from.row && to.col === from.col - 1) {
            return 'left';
        }

        if (to.row === from.row && to.col === from.col + 1) {
            return 'right';
        }

        throw new Error('Invalid path direction.');
    }

    private roll(
        orientation: DiceOrientation,
        direction: Direction,
    ): DiceOrientation {
        if (direction === 'up') {
            return {
                top: orientation.front,
                bottom: orientation.back,
                front: orientation.bottom,
                back: orientation.top,
                left: orientation.left,
                right: orientation.right,
            };
        }

        if (direction === 'down') {
            return {
                top: orientation.back,
                bottom: orientation.front,
                front: orientation.top,
                back: orientation.bottom,
                left: orientation.left,
                right: orientation.right,
            };
        }

        if (direction === 'left') {
            return {
                top: orientation.right,
                bottom: orientation.left,
                front: orientation.front,
                back: orientation.back,
                left: orientation.top,
                right: orientation.bottom,
            };
        }

        return {
            top: orientation.left,
            bottom: orientation.right,
            front: orientation.front,
            back: orientation.back,
            left: orientation.bottom,
            right: orientation.top,
        };
    }

    private positionKey(position: Position): string {
        return `${position.row},${position.col}`;
    }

    private permute<T>(items: T[]): T[][] {
        if (items.length <= 1) {
            return [items];
        }

        const permutations: T[][] = [];

        for (let index = 0; index < items.length; index++) {
            const currentItem = items[index];
            const remainingItems = [
                ...items.slice(0, index),
                ...items.slice(index + 1),
            ];

            for (const permutation of this.permute(remainingItems)) {
                permutations.push([currentItem, ...permutation]);
            }
        }

        return permutations;
    }

    private randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
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