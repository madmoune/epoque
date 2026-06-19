import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    PathwayPort,
    PathwaySlot,
    PathwayTile,
    PathwaysPuzzle,
    PlacedPathwayTile,
} from '../../puzzles/jigsaw-blocks/jigsaw-blocks.model';
import { PathwaysService } from '../../puzzles/jigsaw-blocks/jigsaw-blocks.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type DragPosition = {
    x: number;
    y: number;
};

type TileRotationMap = Record<string, number>;

type Point = {
    x: number;
    y: number;
};

@Component({
    selector: 'app-pathways-page',
    imports: [RouterLink, PuzzleSuccessPopupComponent],
    templateUrl: './jigsaw-blocks.page.html',
    styleUrl: './jigsaw-blocks.page.scss',
})
export class PathwaysPage {
    private readonly pathwaysService = inject(PathwaysService);

    protected readonly puzzle = signal<PathwaysPuzzle>(
        this.pathwaysService.createPuzzle(),
    );

    protected readonly placedTiles = signal<PlacedPathwayTile[]>([]);
    protected readonly selectedTileId = signal<string | null>(null);
    protected readonly selectedRotation = signal(0);
    protected readonly tileRotations = signal<TileRotationMap>(
        this.createRandomTileRotations(this.puzzle().tiles),
    );
    protected readonly dragPosition = signal<DragPosition | null>(null);
    protected readonly hoveredSlotId = signal<string | null>(null);
    protected readonly isDraggingTile = signal(false);
    protected readonly errorMessage = signal<string | null>(null);

    protected readonly unplacedTiles = computed(() => {
        const placedTileIds = new Set(
            this.placedTiles().map((placedTile) => placedTile.tileId),
        );

        return this.puzzle().tiles.filter((tile) => !placedTileIds.has(tile.id));
    });

    protected readonly selectedTile = computed(() => {
        const selectedTileId = this.selectedTileId();

        if (!selectedTileId) {
            return null;
        }

        return this.getTileById(selectedTileId) ?? null;
    });

    protected readonly isSolved = computed(() => {
        if (this.unplacedTiles().length > 0) {
            return false;
        }

        return this.placedTiles().every((placedTile) =>
            this.isPlacedTileVisuallyCorrectForSlot(placedTile),
        );
    });

    @HostListener('document:pointermove', ['$event'])
    protected updateCarriedTilePosition(event: PointerEvent): void {
        if (!this.selectedTile()) {
            return;
        }

        if (this.isDraggingTile()) {
            event.preventDefault();
        }

        this.dragPosition.set({
            x: event.clientX,
            y: event.clientY,
        });

        const slotId = this.getSlotIdFromPoint(event.clientX, event.clientY);
        this.hoveredSlotId.set(slotId);
    }

    @HostListener('document:pointerup', ['$event'])
    protected finishTileDrag(event: PointerEvent): void {
        if (!this.isDraggingTile() || !this.selectedTile()) {
            return;
        }

        event.preventDefault();
        this.isDraggingTile.set(false);

        const slotId = this.getSlotIdFromPoint(event.clientX, event.clientY);

        if (!slotId) {
            this.cancelSelectedTile();
            return;
        }

        this.placeSelectedTile(slotId);
    }

    @HostListener('document:pointercancel', ['$event'])
    protected cancelTileDrag(event: PointerEvent): void {
        if (!this.isDraggingTile()) {
            return;
        }

        event.preventDefault();
        this.isDraggingTile.set(false);
    }

    @HostListener('document:contextmenu', ['$event'])
    protected handleRightClick(event: MouseEvent): void {
        if (!this.selectedTile()) {
            return;
        }

        event.preventDefault();
        this.rotateSelectedTile();
    }

    @HostListener('document:click', ['$event'])
    protected handleDocumentClick(event: MouseEvent): void {
        if (!this.selectedTile() || this.isDraggingTile()) {
            return;
        }

        const target = event.target;

        if (!(target instanceof HTMLElement)) {
            return;
        }

        const wasUsefulGameClick =
            target.closest('.pyramid-board') ||
            target.closest('.tile-tray') ||
            target.closest('.actions');

        if (wasUsefulGameClick) {
            return;
        }

        this.cancelSelectedTile();
    }

    protected startTileDrag(tileId: string, event: PointerEvent): void {
        event.preventDefault();

        const target = event.currentTarget;

        if (target instanceof HTMLElement) {
            target.setPointerCapture(event.pointerId);
        }

        const rotation = this.tileRotations()[tileId] ?? 0;

        this.selectedTileId.set(tileId);
        this.selectedRotation.set(rotation);
        this.dragPosition.set({
            x: event.clientX,
            y: event.clientY,
        });
        this.hoveredSlotId.set(null);
        this.errorMessage.set(null);
        this.isDraggingTile.set(true);
    }

    protected selectTile(tileId: string, event?: PointerEvent): void {
        const rotation = this.tileRotations()[tileId] ?? 0;

        this.selectedTileId.set(tileId);
        this.selectedRotation.set(rotation);
        this.hoveredSlotId.set(null);
        this.errorMessage.set(null);

        if (event) {
            this.dragPosition.set({
                x: event.clientX,
                y: event.clientY,
            });
        }
    }

    protected rotateSelectedTile(): void {
        const selectedTileId = this.selectedTileId();

        if (!selectedTileId || !this.selectedTile()) {
            return;
        }

        const nextRotation = this.normalizeRotation(this.selectedRotation() + 90);

        this.selectedRotation.set(nextRotation);
        this.setTileRotation(selectedTileId, nextRotation);
    }

    protected handleSlotClick(slot: PathwaySlot, event: PointerEvent): void {
        if (this.isDraggingTile()) {
            return;
        }

        const placedTile = this.getPlacedTileForSlot(slot.id);

        if (this.selectedTile()) {
            this.placeSelectedTile(slot.id);
            return;
        }

        if (placedTile && !placedTile.locked) {
            this.removeTile(placedTile.tileId, event);
        }
    }

    protected placeSelectedTile(slotId: string): void {
        const selectedTile = this.selectedTile();

        if (!selectedTile) {
            return;
        }

        this.placeTile(selectedTile.id, slotId, this.selectedRotation(), false);
    }

    protected removeTile(tileId: string, event?: PointerEvent): void {
        const placedTile = this.placedTiles().find((tile) => tile.tileId === tileId);

        if (placedTile?.locked) {
            return;
        }

        const preservedRotation = placedTile?.rotation ?? 0;

        this.placedTiles.update((tiles) =>
            tiles.filter((tile) => tile.tileId !== tileId),
        );

        this.setTileRotation(tileId, preservedRotation);
        this.selectedTileId.set(tileId);
        this.selectedRotation.set(preservedRotation);
        this.hoveredSlotId.set(null);
        this.errorMessage.set(null);

        if (event) {
            this.dragPosition.set({
                x: event.clientX,
                y: event.clientY,
            });
        }
    }

    protected placeHintTile(): void {
        if (this.isSolved()) {
            return;
        }

        const hintPlacement = this.findHintPlacement();

        if (!hintPlacement) {
            this.errorMessage.set(
                'Aucun indice n’est disponible. Essaie de déplacer une pièce déjà placée.',
            );
            return;
        }

        this.placedTiles.update((tiles) => [
            ...tiles,
            {
                ...hintPlacement,
                locked: true,
            },
        ]);

        this.setTileRotation(hintPlacement.tileId, hintPlacement.rotation);

        if (this.selectedTileId() === hintPlacement.tileId) {
            this.cancelSelectedTile();
        }

        this.errorMessage.set(null);
    }

    protected resetPuzzle(): void {
        this.placedTiles.set([]);
        this.selectedTileId.set(null);
        this.selectedRotation.set(0);
        this.tileRotations.set(this.createRandomTileRotations(this.puzzle().tiles));
        this.dragPosition.set(null);
        this.hoveredSlotId.set(null);
        this.errorMessage.set(null);
        this.isDraggingTile.set(false);
    }

    protected newPuzzle(): void {
        const nextPuzzle = this.pathwaysService.createPuzzle();

        this.puzzle.set(nextPuzzle);
        this.placedTiles.set([]);
        this.selectedTileId.set(null);
        this.selectedRotation.set(0);
        this.tileRotations.set(this.createRandomTileRotations(nextPuzzle.tiles));
        this.dragPosition.set(null);
        this.hoveredSlotId.set(null);
        this.errorMessage.set(null);
        this.isDraggingTile.set(false);
    }

    protected getTileForSlot(slotId: string): PathwayTile | null {
        const placedTile = this.getPlacedTileForSlot(slotId);

        if (!placedTile) {
            return null;
        }

        return this.getTileById(placedTile.tileId) ?? null;
    }

    protected getPlacedTileForSlot(slotId: string): PlacedPathwayTile | null {
        return this.placedTiles().find((tile) => tile.slotId === slotId) ?? null;
    }

    protected slotClasses(slot: PathwaySlot): string {
        const classes = ['pyramid-slot'];
        const placedTile = this.getPlacedTileForSlot(slot.id);

        if (placedTile) {
            classes.push('filled');
        }

        if (placedTile?.locked) {
            classes.push('locked');
        }

        if (this.hoveredSlotId() === slot.id && this.selectedTile()) {
            classes.push(placedTile ? 'preview-invalid' : 'preview-valid');
        }

        return classes.join(' ');
    }

    protected tileRotation(tileId: string): number {
        return this.tileRotations()[tileId] ?? 0;
    }

    protected svgRotationTransform(rotation: number): string {
        return `rotate(${rotation} 50 50)`;
    }

    protected dragPreviewTransform(position: DragPosition): string {
        return `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`;
    }

    private placeTile(
        tileId: string,
        slotId: string,
        rotation: number,
        locked: boolean,
    ): void {
        if (this.isSolved()) {
            return;
        }

        if (this.getPlacedTileForSlot(slotId)) {
            this.errorMessage.set('That slot is already filled.');
            return;
        }

        const placedTile: PlacedPathwayTile = {
            tileId,
            slotId,
            rotation: this.normalizeRotation(rotation),
            locked,
        };

        this.placedTiles.update((tiles) => [...tiles, placedTile]);
        this.setTileRotation(tileId, placedTile.rotation);
        this.selectedTileId.set(null);
        this.selectedRotation.set(0);
        this.dragPosition.set(null);
        this.hoveredSlotId.set(null);
        this.errorMessage.set(null);
        this.isDraggingTile.set(false);
    }

    private findHintPlacement(): PlacedPathwayTile | null {
        const filledSlotIds = new Set(
            this.placedTiles().map((tile) => tile.slotId),
        );

        const placedTileIds = new Set(
            this.placedTiles().map((tile) => tile.tileId),
        );

        const availableTiles = this.puzzle().tiles.filter(
            (tile) => !placedTileIds.has(tile.id),
        );

        for (const solutionTile of this.puzzle().solution) {
            if (filledSlotIds.has(solutionTile.slotId)) {
                continue;
            }

            const expectedTile = this.getTileById(solutionTile.tileId);

            if (!expectedTile) {
                continue;
            }

            const matchingAvailableTile = availableTiles.find((tile) =>
                this.haveSameVisualSignature(
                    tile,
                    solutionTile.rotation,
                    expectedTile,
                    solutionTile.rotation,
                ),
            );

            if (!matchingAvailableTile) {
                continue;
            }

            return {
                tileId: matchingAvailableTile.id,
                slotId: solutionTile.slotId,
                rotation: solutionTile.rotation,
            };
        }

        return null;
    }

    private cancelSelectedTile(): void {
        this.selectedTileId.set(null);
        this.selectedRotation.set(0);
        this.dragPosition.set(null);
        this.hoveredSlotId.set(null);
        this.errorMessage.set(null);
        this.isDraggingTile.set(false);
    }

    private getTileById(tileId: string): PathwayTile | undefined {
        return this.puzzle().tiles.find((tile) => tile.id === tileId);
    }

    private getSlotIdFromPoint(clientX: number, clientY: number): string | null {
        const element = document.elementFromPoint(clientX, clientY);

        if (!(element instanceof HTMLElement)) {
            return null;
        }

        const slot = element.closest<HTMLElement>('[data-pathway-slot="true"]');

        return slot?.dataset['slotId'] ?? null;
    }

    private isPlacedTileVisuallyCorrectForSlot(
        placedTile: PlacedPathwayTile,
    ): boolean {
        const placedTileData = this.getTileById(placedTile.tileId);

        if (!placedTileData) {
            return false;
        }

        const expectedSolutionTile = this.puzzle().solution.find(
            (solution) => solution.slotId === placedTile.slotId,
        );

        if (!expectedSolutionTile) {
            return false;
        }

        const expectedTileData = this.getTileById(expectedSolutionTile.tileId);

        if (!expectedTileData) {
            return false;
        }

        return this.haveSameVisualSignature(
            placedTileData,
            placedTile.rotation,
            expectedTileData,
            expectedSolutionTile.rotation,
        );
    }

    private haveSameVisualSignature(
        firstTile: PathwayTile,
        firstRotation: number,
        secondTile: PathwayTile,
        secondRotation: number,
    ): boolean {
        return (
            this.createVisualSignature(firstTile, firstRotation) ===
            this.createVisualSignature(secondTile, secondRotation)
        );
    }

    private createVisualSignature(tile: PathwayTile, rotation: number): string {
        return tile.ports
            .map((port) => this.getRotatedPortPoint(port, rotation))
            .map((point) => `${point.x}:${point.y}`)
            .sort()
            .join('|');
    }

    private getRotatedPortPoint(port: PathwayPort, rotation: number): Point {
        const point = this.getPortPoint(port);
        const normalizedRotation = this.normalizeRotation(rotation);
        const radians = (normalizedRotation * Math.PI) / 180;

        const center = {
            x: 50,
            y: 50,
        };

        const translatedX = point.x - center.x;
        const translatedY = point.y - center.y;

        return {
            x: this.round(
                center.x +
                translatedX * Math.cos(radians) -
                translatedY * Math.sin(radians),
            ),
            y: this.round(
                center.y +
                translatedX * Math.sin(radians) +
                translatedY * Math.cos(radians),
            ),
        };
    }

    private getPortPoint(port: PathwayPort): Point {
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

    private createRandomTileRotations(tiles: PathwayTile[]): TileRotationMap {
        return Object.fromEntries(
            tiles.map((tile) => [tile.id, this.getRandomRotation()]),
        );
    }

    private setTileRotation(tileId: string, rotation: number): void {
        this.tileRotations.update((rotations) => ({
            ...rotations,
            [tileId]: this.normalizeRotation(rotation),
        }));
    }

    private normalizeRotation(rotation: number): number {
        return ((rotation % 360) + 360) % 360;
    }

    private round(value: number): number {
        return Math.round(value * 100) / 100;
    }

    private getRandomRotation(): number {
        const rotations = [0, 90, 180, 270];
        return rotations[Math.floor(Math.random() * rotations.length)];
    }
}
