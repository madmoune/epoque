import { Injectable } from '@angular/core';
import {
    PathwayPort,
    PathwaySlot,
    PathwayTile,
    PathwaysPuzzle,
    PlacedPathwayTile,
} from './jigsaw-blocks.model';

type DirectionInfo = {
    fromPort: PathwayPort;
    toPort: PathwayPort;
};

type Point = {
    x: number;
    y: number;
};

type Vector = {
    x: number;
    y: number;
};

@Injectable({
    providedIn: 'root',
})
export class PathwaysService {
    createPuzzle(): PathwaysPuzzle {
        const slots = this.createPyramidSlots();
        const path = this.createRandomFullPath(slots);

        const tiles: PathwayTile[] = path.map((slot, index) => {
            const ports = this.createPortsForPathSlot(path, slot);

            return {
                id: `tile-${index}`,
                name: `Pièce ${index + 1}`,
                ports,
                pathData: this.createSmoothRandomPathData(ports),
            };
        });

        const solution = this.createSolutionFromPath(path);

        return {
            slots,
            tiles: this.shuffle(tiles),
            solution,
        };
    }

    private createPyramidSlots(): PathwaySlot[] {
        return [
            {
                id: 'slot-0-0',
                row: 0,
                column: 0,
            },

            {
                id: 'slot-1-0',
                row: 1,
                column: 0,
            },
            {
                id: 'slot-1-1',
                row: 1,
                column: 1,
            },

            {
                id: 'slot-2-0',
                row: 2,
                column: 0,
            },
            {
                id: 'slot-2-1',
                row: 2,
                column: 1,
            },
            {
                id: 'slot-2-2',
                row: 2,
                column: 2,
            },

            {
                id: 'slot-3-0',
                row: 3,
                column: 0,
            },
            {
                id: 'slot-3-1',
                row: 3,
                column: 1,
            },
            {
                id: 'slot-3-2',
                row: 3,
                column: 2,
            },
            {
                id: 'slot-3-3',
                row: 3,
                column: 3,
            },
        ];
    }

    private createRandomFullPath(slots: PathwaySlot[]): PathwaySlot[] {
        const maxAttempts = 500;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const startSlot = this.getRandomItem(slots);
            const path = this.findHamiltonianPath(startSlot, slots);

            if (path.length === slots.length) {
                return path;
            }
        }

        return this.createFallbackPath(slots);
    }

    private findHamiltonianPath(
        startSlot: PathwaySlot,
        allSlots: PathwaySlot[],
    ): PathwaySlot[] {
        const targetLength = allSlots.length;
        const visitedSlotIds = new Set<string>([startSlot.id]);
        const path = [startSlot];

        const search = (): boolean => {
            if (path.length === targetLength) {
                return true;
            }

            const currentSlot = path[path.length - 1];

            const candidateNeighbors = this.shuffle(
                this.getNeighborSlots(currentSlot, allSlots).filter(
                    (neighbor) => !visitedSlotIds.has(neighbor.id),
                ),
            ).sort(
                (first, second) =>
                    this.countUnvisitedNeighbors(first, allSlots, visitedSlotIds) -
                    this.countUnvisitedNeighbors(second, allSlots, visitedSlotIds),
            );

            for (const neighbor of candidateNeighbors) {
                visitedSlotIds.add(neighbor.id);
                path.push(neighbor);

                if (search()) {
                    return true;
                }

                path.pop();
                visitedSlotIds.delete(neighbor.id);
            }

            return false;
        };

        search();

        return path;
    }

    private createFallbackPath(slots: PathwaySlot[]): PathwaySlot[] {
        const fallbackSlotIds = [
            'slot-3-0',
            'slot-3-1',
            'slot-3-2',
            'slot-3-3',
            'slot-2-2',
            'slot-2-1',
            'slot-2-0',
            'slot-1-0',
            'slot-1-1',
            'slot-0-0',
        ];

        return fallbackSlotIds.map((slotId) => this.getSlotById(slots, slotId));
    }

    private createSolutionFromPath(path: PathwaySlot[]): PlacedPathwayTile[] {
        return path.map((slot, index) => ({
            tileId: `tile-${index}`,
            slotId: slot.id,
            rotation: 0,
        }));
    }

    private createPortsForPathSlot(
        path: PathwaySlot[],
        slot: PathwaySlot,
    ): PathwayPort[] {
        const slotIndex = path.findIndex((pathSlot) => pathSlot.id === slot.id);
        const ports: PathwayPort[] = [];

        const previousSlot = path[slotIndex - 1];
        const nextSlot = path[slotIndex + 1];

        if (previousSlot) {
            ports.push(this.getDirectionInfo(slot, previousSlot).fromPort);
        }

        if (nextSlot) {
            ports.push(this.getDirectionInfo(slot, nextSlot).fromPort);
        }

        return this.sortPorts(ports);
    }

    private createSmoothRandomPathData(ports: PathwayPort[]): string {
        if (ports.length === 0) {
            return '';
        }

        if (ports.length === 1) {
            return this.createSmoothEndPathData(ports[0]);
        }

        return this.createSmoothConnectorPathData(ports[0], ports[1]);
    }

    private createSmoothEndPathData(port: PathwayPort): string {
        const start = this.getOuterPortPoint(port);
        const startVector = this.getInwardVector(port);
        const end = this.getRandomInnerEndPoint(port);

        const controlDistance = this.randomInt(26, 42);
        const curvePull = this.randomInt(-16, 16);

        const firstControl = this.addVector(
            start,
            this.scaleVector(startVector, controlDistance),
        );

        const secondControl = this.addVector(
            end,
            this.getPerpendicularOffset(startVector, curvePull),
        );

        return [
            `M ${this.formatPoint(start)}`,
            `C ${this.formatPoint(firstControl)}`,
            `${this.formatPoint(secondControl)}`,
            `${this.formatPoint(end)}`,
        ].join(' ');
    }

    private createSmoothConnectorPathData(
        firstPort: PathwayPort,
        secondPort: PathwayPort,
    ): string {
        const start = this.getOuterPortPoint(firstPort);
        const end = this.getOuterPortPoint(secondPort);

        const startVector = this.getInwardVector(firstPort);
        const endVector = this.getInwardVector(secondPort);

        const startDistance = this.randomInt(28, 44);
        const endDistance = this.randomInt(28, 44);

        const sharedCurveOffset = this.randomInt(-14, 14);

        const firstControl = this.addVector(
            start,
            this.addVectors(
                this.scaleVector(startVector, startDistance),
                this.getPerpendicularOffset(startVector, sharedCurveOffset),
            ),
        );

        const secondControl = this.addVector(
            end,
            this.addVectors(
                this.scaleVector(endVector, endDistance),
                this.getPerpendicularOffset(endVector, -sharedCurveOffset),
            ),
        );

        return [
            `M ${this.formatPoint(start)}`,
            `C ${this.formatPoint(firstControl)}`,
            `${this.formatPoint(secondControl)}`,
            `${this.formatPoint(end)}`,
        ].join(' ');
    }

    private getRandomInnerEndPoint(port: PathwayPort): Point {
        const inwardVector = this.getInwardVector(port);
        const basePoint = this.getOuterPortPoint(port);
        const distance = this.randomInt(40, 62);
        const sideOffset = this.randomInt(-18, 18);

        return this.clampPoint(
            this.addVector(
                basePoint,
                this.addVectors(
                    this.scaleVector(inwardVector, distance),
                    this.getPerpendicularOffset(inwardVector, sideOffset),
                ),
            ),
        );
    }

    private getOuterPortPoint(port: PathwayPort): Point {
        const points: Record<PathwayPort, Point> = {
            left: {
                x: 0,
                y: 50,
            },
            right: {
                x: 100,
                y: 50,
            },
            topLeft: {
                x: 25,
                y: 0,
            },
            topRight: {
                x: 75,
                y: 0,
            },
            bottomLeft: {
                x: 25,
                y: 100,
            },
            bottomRight: {
                x: 75,
                y: 100,
            },
        };

        return points[port];
    }

    private getInwardVector(port: PathwayPort): Vector {
        const vectors: Record<PathwayPort, Vector> = {
            left: {
                x: 1,
                y: 0,
            },
            right: {
                x: -1,
                y: 0,
            },
            topLeft: {
                x: 0.45,
                y: 1,
            },
            topRight: {
                x: -0.45,
                y: 1,
            },
            bottomLeft: {
                x: 0.45,
                y: -1,
            },
            bottomRight: {
                x: -0.45,
                y: -1,
            },
        };

        return this.normalizeVector(vectors[port]);
    }

    private getPerpendicularOffset(vector: Vector, distance: number): Vector {
        return {
            x: -vector.y * distance,
            y: vector.x * distance,
        };
    }

    private normalizeVector(vector: Vector): Vector {
        const length = Math.sqrt(vector.x ** 2 + vector.y ** 2);

        if (length === 0) {
            return {
                x: 0,
                y: 0,
            };
        }

        return {
            x: vector.x / length,
            y: vector.y / length,
        };
    }

    private scaleVector(vector: Vector, scale: number): Vector {
        return {
            x: vector.x * scale,
            y: vector.y * scale,
        };
    }

    private addVector(point: Point, vector: Vector): Point {
        return {
            x: point.x + vector.x,
            y: point.y + vector.y,
        };
    }

    private addVectors(first: Vector, second: Vector): Vector {
        return {
            x: first.x + second.x,
            y: first.y + second.y,
        };
    }

    private clampPoint(point: Point): Point {
        return {
            x: this.clamp(point.x, 12, 88),
            y: this.clamp(point.y, 12, 88),
        };
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    private formatPoint(point: Point): string {
        return `${this.round(point.x)} ${this.round(point.y)}`;
    }

    private round(value: number): number {
        return Math.round(value * 100) / 100;
    }

    private getNeighborSlots(
        slot: PathwaySlot,
        allSlots: PathwaySlot[],
    ): PathwaySlot[] {
        return allSlots.filter((candidateSlot) => {
            if (candidateSlot.id === slot.id) {
                return false;
            }

            return this.areSlotsAdjacent(slot, candidateSlot);
        });
    }

    private areSlotsAdjacent(first: PathwaySlot, second: PathwaySlot): boolean {
        return this.getDirectionInfoOrNull(first, second) !== null;
    }

    private getDirectionInfo(
        fromSlot: PathwaySlot,
        toSlot: PathwaySlot,
    ): DirectionInfo {
        const directionInfo = this.getDirectionInfoOrNull(fromSlot, toSlot);

        if (!directionInfo) {
            throw new Error(
                `Slots are not adjacent: ${fromSlot.id} -> ${toSlot.id}`,
            );
        }

        return directionInfo;
    }

    private getDirectionInfoOrNull(
        fromSlot: PathwaySlot,
        toSlot: PathwaySlot,
    ): DirectionInfo | null {
        const rowDifference = toSlot.row - fromSlot.row;
        const columnDifference = toSlot.column - fromSlot.column;

        if (rowDifference === 0 && columnDifference === -1) {
            return {
                fromPort: 'left',
                toPort: 'right',
            };
        }

        if (rowDifference === 0 && columnDifference === 1) {
            return {
                fromPort: 'right',
                toPort: 'left',
            };
        }

        if (rowDifference === 1 && columnDifference === 0) {
            return {
                fromPort: 'bottomLeft',
                toPort: 'topRight',
            };
        }

        if (rowDifference === 1 && columnDifference === 1) {
            return {
                fromPort: 'bottomRight',
                toPort: 'topLeft',
            };
        }

        if (rowDifference === -1 && columnDifference === 0) {
            return {
                fromPort: 'topRight',
                toPort: 'bottomLeft',
            };
        }

        if (rowDifference === -1 && columnDifference === -1) {
            return {
                fromPort: 'topLeft',
                toPort: 'bottomRight',
            };
        }

        return null;
    }

    private countUnvisitedNeighbors(
        slot: PathwaySlot,
        allSlots: PathwaySlot[],
        visitedSlotIds: Set<string>,
    ): number {
        return this.getNeighborSlots(slot, allSlots).filter(
            (neighbor) => !visitedSlotIds.has(neighbor.id),
        ).length;
    }

    private getSlotById(slots: PathwaySlot[], slotId: string): PathwaySlot {
        const slot = slots.find((item) => item.id === slotId);

        if (!slot) {
            throw new Error(`Slot not found: ${slotId}`);
        }

        return slot;
    }

    private sortPorts(ports: PathwayPort[]): PathwayPort[] {
        const portOrder: PathwayPort[] = [
            'topLeft',
            'topRight',
            'right',
            'bottomRight',
            'bottomLeft',
            'left',
        ];

        return [...ports].sort(
            (first, second) => portOrder.indexOf(first) - portOrder.indexOf(second),
        );
    }

    private randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private getRandomItem<T>(items: T[]): T {
        return items[Math.floor(Math.random() * items.length)];
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