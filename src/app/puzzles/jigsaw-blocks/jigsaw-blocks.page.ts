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

type DragPosition = {
    x: number;
    y: number;
};

type TileRotationMap = Record<string, number>;

@Component({
    selector: 'app-pathways-page',
    imports: [RouterLink],
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
                'No hint is available. Try moving one of your placed tiles.',
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
        const placedTileIds = new Set(
            this.placedTiles().map((tile) => tile.tileId),
        );

        const filledSlotIds = new Set(
            this.placedTiles().map((tile) => tile.slotId),
        );

        return (
            this.puzzle().solution.find(
                (solutionTile) =>
                    !placedTileIds.has(solutionTile.tileId) &&
                    !filledSlotIds.has(solutionTile.slotId),
            ) ?? null
        );
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

        const placedPorts = this.getRotatedPorts(
            placedTileData.ports,
            placedTile.rotation,
        );

        const expectedPorts = this.getRotatedPorts(
            expectedTileData.ports,
            expectedSolutionTile.rotation,
        );

        return this.haveSamePorts(placedPorts, expectedPorts);
    }

    private getRotatedPorts(
        ports: PathwayPort[],
        rotation: number,
    ): PathwayPort[] {
        const normalizedRotation = this.normalizeRotation(rotation);
        const quarterTurns = normalizedRotation / 90;

        return ports.map((port) => {
            let rotatedPort = port;

            for (let turn = 0; turn < quarterTurns; turn++) {
                rotatedPort = this.rotatePortClockwise(rotatedPort);
            }

            return rotatedPort;
        });
    }

    private rotatePortClockwise(port: PathwayPort): PathwayPort {
        const rotatedPorts: Record<PathwayPort, PathwayPort> = {
            topLeft: 'topRight',
            topRight: 'bottomRight',
            bottomRight: 'bottomLeft',
            bottomLeft: 'topLeft',
            left: 'topLeft',
            right: 'bottomRight',
        };

        return rotatedPorts[port];
    }

    private haveSamePorts(
        firstPorts: PathwayPort[],
        secondPorts: PathwayPort[],
    ): boolean {
        if (firstPorts.length !== secondPorts.length) {
            return false;
        }

        const firstSignature = this.createPortsSignature(firstPorts);
        const secondSignature = this.createPortsSignature(secondPorts);

        return firstSignature === secondSignature;
    }

    private createPortsSignature(ports: PathwayPort[]): string {
        return [...ports].sort().join('|');
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

    private getRandomRotation(): number {
        const rotations = [0, 90, 180, 270];
        return rotations[Math.floor(Math.random() * rotations.length)];
    }
}