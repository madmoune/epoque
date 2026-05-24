import { Injectable } from '@angular/core';
import {
    PathwayPort,
    PathwaySlot,
    PathwayTile,
    PathwaysPuzzle,
    PlacedPathwayTile,
} from './jigsaw-blocks.model';

type Point = {
    x: number;
    y: number;
};

type GeneratedTile = {
    tile: PathwayTile;
    slotId: string;
};

type SlotWithConnections = {
    slot: PathwaySlot;
    ports: PathwayPort[];
};

@Injectable({
    providedIn: 'root',
})
export class PathwaysService {
    private readonly maxGenerationAttempts = 500;

    createPuzzle(): PathwaysPuzzle {
        const slots = this.createSlots();
        const path = this.createRandomPath(slots);
        const generatedTiles = this.createTilesFromPath(path);

        const tiles = generatedTiles.map((generatedTile) => generatedTile.tile);

        return {
            slots,
            tiles: this.shuffle(tiles),
            solution: this.createSolution(generatedTiles),
        };
    }

    private createSlots(): PathwaySlot[] {
        return [
            { id: 'slot-1', row: 0, column: 0 },

            { id: 'slot-2', row: 1, column: 0 },
            { id: 'slot-3', row: 1, column: 1 },

            { id: 'slot-4', row: 2, column: 0 },
            { id: 'slot-5', row: 2, column: 1 },
            { id: 'slot-6', row: 2, column: 2 },

            { id: 'slot-7', row: 3, column: 0 },
            { id: 'slot-8', row: 3, column: 1 },
            { id: 'slot-9', row: 3, column: 2 },
            { id: 'slot-10', row: 3, column: 3 },
        ];
    }

    private createRandomPath(slots: PathwaySlot[]): PathwaySlot[] {
        for (let attempt = 0; attempt < this.maxGenerationAttempts; attempt++) {
            const startSlot = this.getRandomItem(slots);
            const path = this.walkPath(startSlot, slots, [startSlot]);

            if (path.length === slots.length) {
                return path;
            }
        }

        throw new Error('Could not generate a continuous pyramid path.');
    }

    private walkPath(
        currentSlot: PathwaySlot,
        allSlots: PathwaySlot[],
        path: PathwaySlot[],
    ): PathwaySlot[] {
        if (path.length === allSlots.length) {
            return path;
        }

        const visitedSlotIds = new Set(path.map((slot) => slot.id));

        const nextSlots = this.shuffle(
            this.getNeighborSlots(currentSlot, allSlots).filter(
                (slot) => !visitedSlotIds.has(slot.id),
            ),
        );

        for (const nextSlot of nextSlots) {
            const nextPath = this.walkPath(nextSlot, allSlots, [
                ...path,
                nextSlot,
            ]);

            if (nextPath.length === allSlots.length) {
                return nextPath;
            }
        }

        return path;
    }

    private getNeighborSlots(
        slot: PathwaySlot,
        allSlots: PathwaySlot[],
    ): PathwaySlot[] {
        return allSlots.filter((candidate) => {
            if (candidate.id === slot.id) {
                return false;
            }

            return this.areNeighborSlots(slot, candidate);
        });
    }

    private areNeighborSlots(first: PathwaySlot, second: PathwaySlot): boolean {
        const sameRowNeighbor =
            first.row === second.row &&
            Math.abs(first.column - second.column) === 1;

        const lowerLeftNeighbor =
            second.row === first.row + 1 &&
            second.column === first.column;

        const lowerRightNeighbor =
            second.row === first.row + 1 &&
            second.column === first.column + 1;

        const upperLeftNeighbor =
            second.row === first.row - 1 &&
            second.column === first.column - 1;

        const upperRightNeighbor =
            second.row === first.row - 1 &&
            second.column === first.column;

        return (
            sameRowNeighbor ||
            lowerLeftNeighbor ||
            lowerRightNeighbor ||
            upperLeftNeighbor ||
            upperRightNeighbor
        );
    }

    private createTilesFromPath(path: PathwaySlot[]): GeneratedTile[] {
        const slotConnections = this.getSlotConnections(path);

        return slotConnections.map((connection, index) => ({
            slotId: connection.slot.id,
            tile: {
                id: `tile-${index + 1}`,
                name: `Block ${index + 1}`,
                ports: connection.ports,
                pathData: this.createPathData(connection.ports),
            },
        }));
    }

    private getSlotConnections(path: PathwaySlot[]): SlotWithConnections[] {
        return path.map((slot, index) => {
            const previousSlot = path[index - 1] ?? null;
            const nextSlot = path[index + 1] ?? null;

            const ports: PathwayPort[] = [];

            if (previousSlot) {
                ports.push(this.getConnectionPort(slot, previousSlot));
            }

            if (nextSlot) {
                ports.push(this.getConnectionPort(slot, nextSlot));
            }

            return {
                slot,
                ports,
            };
        });
    }

    private getConnectionPort(from: PathwaySlot, to: PathwaySlot): PathwayPort {
        if (to.row === from.row && to.column === from.column - 1) {
            return 'left';
        }

        if (to.row === from.row && to.column === from.column + 1) {
            return 'right';
        }

        if (to.row === from.row - 1 && to.column === from.column - 1) {
            return 'topLeft';
        }

        if (to.row === from.row - 1 && to.column === from.column) {
            return 'topRight';
        }

        if (to.row === from.row + 1 && to.column === from.column) {
            return 'bottomLeft';
        }

        if (to.row === from.row + 1 && to.column === from.column + 1) {
            return 'bottomRight';
        }

        throw new Error(`Slots ${from.id} and ${to.id} are not neighbors.`);
    }

    private createPathData(ports: PathwayPort[]): string {
        if (ports.length === 1) {
            return this.createEndPathData(ports[0]);
        }

        const [firstPort, secondPort] = ports;

        return this.createConnectedPathData(firstPort, secondPort);
    }

    private createEndPathData(port: PathwayPort): string {
        const edgePoint = this.getOuterPortPoint(port);
        const insidePoint = this.getInteriorEndPoint(port);

        const firstControl = this.getControlPointTowardCenter(edgePoint, 0.45);
        const secondControl = this.getControlPointTowardCenter(insidePoint, 0.15);

        return [
            `M${this.formatPoint(edgePoint)}`,
            `C${this.formatPoint(firstControl)} ${this.formatPoint(secondControl)} ${this.formatPoint(insidePoint)}`,
        ].join(' ');
    }

    private createConnectedPathData(
        firstPort: PathwayPort,
        secondPort: PathwayPort,
    ): string {
        const start = this.getOuterPortPoint(firstPort);
        const end = this.getOuterPortPoint(secondPort);

        const firstControl = this.getControlPointTowardCenter(start, 0.72);
        const secondControl = this.getControlPointTowardCenter(end, 0.72);

        return [
            `M${this.formatPoint(start)}`,
            `C${this.formatPoint(firstControl)} ${this.formatPoint(secondControl)} ${this.formatPoint(end)}`,
        ].join(' ');
    }

    private getPortPoint(port: PathwayPort): Point {
        const points: Record<PathwayPort, Point> = {
            left: { x: 0, y: 50 },
            right: { x: 100, y: 50 },
            topLeft: { x: 25, y: 0 },
            topRight: { x: 75, y: 0 },
            bottomLeft: { x: 25, y: 100 },
            bottomRight: { x: 75, y: 100 },
        };

        return points[port];
    }

    private getOuterPortPoint(port: PathwayPort): Point {
        const point = this.getPortPoint(port);
        const center = {
            x: 50,
            y: 50,
        };

        return {
            x: center.x + (point.x - center.x) * 1.16,
            y: center.y + (point.y - center.y) * 1.16,
        };
    }

    private getInteriorEndPoint(port: PathwayPort): Point {
        const point = this.getPortPoint(port);
        const center = {
            x: 50,
            y: 50,
        };

        return {
            x: center.x + (point.x - center.x) * 0.18,
            y: center.y + (point.y - center.y) * 0.18,
        };
    }

    private getControlPointTowardCenter(
        point: Point,
        strength: number,
    ): Point {
        const center = {
            x: 50,
            y: 50,
        };

        return {
            x: point.x + (center.x - point.x) * strength,
            y: point.y + (center.y - point.y) * strength,
        };
    }

    private createSolution(
        generatedTiles: GeneratedTile[],
    ): PlacedPathwayTile[] {
        return generatedTiles.map((generatedTile) => ({
            tileId: generatedTile.tile.id,
            slotId: generatedTile.slotId,
            rotation: 0,
        }));
    }

    private formatPoint(point: Point): string {
        return `${this.round(point.x)} ${this.round(point.y)}`;
    }

    private round(value: number): number {
        return Math.round(value * 100) / 100;
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