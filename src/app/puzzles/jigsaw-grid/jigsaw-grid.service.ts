import { Injectable } from '@angular/core';
import {
    GridCoordinate,
    JigsawColor,
    JigsawPiece,
    JigsawPuzzle,
    PlacedJigsawPiece,
} from './jigsaw-grid.model';

type GeneratedPiece = {
    cells: GridCoordinate[];
};

@Injectable({
    providedIn: 'root',
})
export class JigsawGridService {
    private readonly gridSize = 6;
    private readonly blockedCellCount = 3;
    private readonly maxGenerationAttempts = 500;

    private readonly colors: JigsawColor[] = [
        'purple',
        'green',
        'cyan',
        'orange',
        'pink',
        'yellow',
    ];

    createPuzzle(): JigsawPuzzle {
        for (let attempt = 0; attempt < this.maxGenerationAttempts; attempt++) {
            const blockedCells = this.createRandomBlockedCells();
            const fillableCells = this.getFillableCells(blockedCells);

            if (!this.isConnectedGroup(fillableCells)) {
                continue;
            }

            const generatedPieces = this.partitionCellsIntoPieces(fillableCells);

            if (!generatedPieces) {
                continue;
            }

            const pieces = generatedPieces.map((generatedPiece, index) =>
                this.createPieceFromCells(generatedPiece.cells, index),
            );

            const solution = generatedPieces.map((generatedPiece, index) =>
                this.createSolutionPlacement(generatedPiece.cells, pieces[index].id),
            );

            return {
                size: this.gridSize,
                blockedCells,
                pieces: this.shuffle(pieces),
                solution,
            };
        }

        throw new Error('Could not generate a valid jigsaw puzzle.');
    }

    rotateCells(cells: GridCoordinate[], rotation: number): GridCoordinate[] {
        const normalizedRotation = ((rotation % 360) + 360) % 360;

        const rotated = cells.map((cell) => {
            if (normalizedRotation === 90) {
                return {
                    row: cell.column,
                    column: -cell.row,
                };
            }

            if (normalizedRotation === 180) {
                return {
                    row: -cell.row,
                    column: -cell.column,
                };
            }

            if (normalizedRotation === 270) {
                return {
                    row: -cell.column,
                    column: cell.row,
                };
            }

            return cell;
        });

        return this.normalizeCells(rotated);
    }

    getAbsoluteCells(
        piece: JigsawPiece,
        placedPiece: PlacedJigsawPiece,
    ): GridCoordinate[] {
        const rotatedCells = this.rotateCells(piece.cells, placedPiece.rotation);

        return rotatedCells.map((cell) => ({
            row: placedPiece.anchor.row + cell.row,
            column: placedPiece.anchor.column + cell.column,
        }));
    }

    areSameCell(first: GridCoordinate, second: GridCoordinate): boolean {
        return first.row === second.row && first.column === second.column;
    }

    cellKey(cell: GridCoordinate): string {
        return `${cell.row}:${cell.column}`;
    }

    private createRandomBlockedCells(): GridCoordinate[] {
        const allCells = Array.from(
            { length: this.gridSize * this.gridSize },
            (_, index) => ({
                row: Math.floor(index / this.gridSize),
                column: index % this.gridSize,
            }),
        );

        return this.shuffle(allCells).slice(0, this.blockedCellCount);
    }

    private getFillableCells(blockedCells: GridCoordinate[]): GridCoordinate[] {
        const blockedCellKeys = new Set(
            blockedCells.map((cell) => this.cellKey(cell)),
        );

        return Array.from(
            { length: this.gridSize * this.gridSize },
            (_, index) => ({
                row: Math.floor(index / this.gridSize),
                column: index % this.gridSize,
            }),
        ).filter((cell) => !blockedCellKeys.has(this.cellKey(cell)));
    }

    private partitionCellsIntoPieces(
        cells: GridCoordinate[],
    ): GeneratedPiece[] | null {
        const targetSizes = this.shuffle([5, 5, 5, 6, 6, 6]);

        for (let attempt = 0; attempt < this.maxGenerationAttempts; attempt++) {
            const remainingCells = [...cells];
            const pieces: GeneratedPiece[] = [];

            let failed = false;

            for (const targetSize of targetSizes) {
                const pieceCells = this.carveConnectedPiece(
                    remainingCells,
                    targetSize,
                );

                if (!pieceCells) {
                    failed = true;
                    break;
                }

                this.removeCells(remainingCells, pieceCells);
                pieces.push({ cells: pieceCells });

                if (!this.remainingCellsAreViable(remainingCells)) {
                    failed = true;
                    break;
                }
            }

            if (!failed && remainingCells.length === 0) {
                return pieces;
            }
        }

        return null;
    }

    private carveConnectedPiece(
        availableCells: GridCoordinate[],
        targetSize: number,
    ): GridCoordinate[] | null {
        if (availableCells.length < targetSize) {
            return null;
        }

        for (let attempt = 0; attempt < 100; attempt++) {
            const seed = this.getRandomItem(availableCells);
            const pieceCells = [seed];

            while (pieceCells.length < targetSize) {
                const frontier = this.shuffle(
                    this.getPieceFrontier(pieceCells, availableCells),
                );

                if (frontier.length === 0) {
                    break;
                }

                pieceCells.push(frontier[0]);
            }

            if (pieceCells.length === targetSize) {
                return pieceCells;
            }
        }

        return null;
    }

    private remainingCellsAreViable(remainingCells: GridCoordinate[]): boolean {
        if (remainingCells.length === 0) {
            return true;
        }

        const components = this.getConnectedComponents(remainingCells);

        return components.every(
            (component) => component.length === 0 || component.length >= 5,
        );
    }

    private getPieceFrontier(
        pieceCells: GridCoordinate[],
        availableCells: GridCoordinate[],
    ): GridCoordinate[] {
        const pieceCellKeys = new Set(pieceCells.map((cell) => this.cellKey(cell)));
        const availableCellKeys = new Set(
            availableCells.map((cell) => this.cellKey(cell)),
        );

        const frontier = new Map<string, GridCoordinate>();

        for (const cell of pieceCells) {
            for (const neighbor of this.getNeighbors(cell)) {
                const neighborKey = this.cellKey(neighbor);

                if (
                    availableCellKeys.has(neighborKey) &&
                    !pieceCellKeys.has(neighborKey)
                ) {
                    frontier.set(neighborKey, neighbor);
                }
            }
        }

        return [...frontier.values()];
    }

    private createPieceFromCells(
        absoluteCells: GridCoordinate[],
        index: number,
    ): JigsawPiece {
        return {
            id: `piece-${index + 1}`,
            name: `Piece ${index + 1}`,
            color: this.colors[index % this.colors.length],
            cells: this.normalizeCells(absoluteCells),
        };
    }

    private createSolutionPlacement(
        absoluteCells: GridCoordinate[],
        pieceId: string,
    ): PlacedJigsawPiece {
        const minRow = Math.min(...absoluteCells.map((cell) => cell.row));
        const minColumn = Math.min(...absoluteCells.map((cell) => cell.column));

        return {
            pieceId,
            anchor: {
                row: minRow,
                column: minColumn,
            },
            rotation: 0,
        };
    }

    private getConnectedComponents(cells: GridCoordinate[]): GridCoordinate[][] {
        const remainingCellMap = new Map(
            cells.map((cell) => [this.cellKey(cell), cell]),
        );

        const components: GridCoordinate[][] = [];

        while (remainingCellMap.size > 0) {
            const firstCell = remainingCellMap.values().next().value;
            const component: GridCoordinate[] = [];
            const queue: GridCoordinate[] = [firstCell!];

            remainingCellMap.delete(this.cellKey(firstCell!));

            while (queue.length > 0) {
                const cell = queue.shift()!;
                component.push(cell);

                for (const neighbor of this.getNeighbors(cell)) {
                    const neighborKey = this.cellKey(neighbor);
                    const remainingNeighbor = remainingCellMap.get(neighborKey);

                    if (!remainingNeighbor) {
                        continue;
                    }

                    remainingCellMap.delete(neighborKey);
                    queue.push(remainingNeighbor);
                }
            }

            components.push(component);
        }

        return components;
    }

    private isConnectedGroup(cells: GridCoordinate[]): boolean {
        if (cells.length === 0) {
            return false;
        }

        return this.getConnectedComponents(cells).length === 1;
    }

    private getNeighbors(cell: GridCoordinate): GridCoordinate[] {
        return [
            {
                row: cell.row - 1,
                column: cell.column,
            },
            {
                row: cell.row + 1,
                column: cell.column,
            },
            {
                row: cell.row,
                column: cell.column - 1,
            },
            {
                row: cell.row,
                column: cell.column + 1,
            },
        ].filter(
            (neighbor) =>
                neighbor.row >= 0 &&
                neighbor.column >= 0 &&
                neighbor.row < this.gridSize &&
                neighbor.column < this.gridSize,
        );
    }

    private removeCells(
        sourceCells: GridCoordinate[],
        cellsToRemove: GridCoordinate[],
    ): void {
        const keysToRemove = new Set(
            cellsToRemove.map((cell) => this.cellKey(cell)),
        );

        for (let index = sourceCells.length - 1; index >= 0; index--) {
            if (keysToRemove.has(this.cellKey(sourceCells[index]))) {
                sourceCells.splice(index, 1);
            }
        }
    }

    private normalizeCells(cells: GridCoordinate[]): GridCoordinate[] {
        const minRow = Math.min(...cells.map((cell) => cell.row));
        const minColumn = Math.min(...cells.map((cell) => cell.column));

        return cells.map((cell) => ({
            row: cell.row - minRow,
            column: cell.column - minColumn,
        }));
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

    private getRandomItem<T>(items: T[]): T {
        return items[Math.floor(Math.random() * items.length)];
    }
}