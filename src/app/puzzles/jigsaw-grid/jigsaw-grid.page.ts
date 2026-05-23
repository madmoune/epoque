import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    GridCoordinate,
    JigsawPiece,
    JigsawPuzzle,
    PlacedJigsawPiece,
} from '../../puzzles/jigsaw-grid/jigsaw-grid.model';
import { JigsawGridService } from '../../puzzles/jigsaw-grid/jigsaw-grid.service';

type BoardCell = {
    row: number;
    column: number;
    isBlocked: boolean;
    piece: JigsawPiece | null;
    placedPiece: PlacedJigsawPiece | null;
    isLocked: boolean;
};

type DragPosition = {
    x: number;
    y: number;
};

type PieceRotationMap = Record<string, number>;

@Component({
    selector: 'app-jigsaw-grid-page',
    imports: [RouterLink],
    templateUrl: './jigsaw-grid.page.html',
    styleUrl: './jigsaw-grid.page.scss',
})
export class JigsawGridPage {
    protected readonly jigsawGridService = inject(JigsawGridService);

    protected readonly puzzle = signal<JigsawPuzzle>(
        this.jigsawGridService.createPuzzle(),
    );

    protected readonly placedPieces = signal<PlacedJigsawPiece[]>([]);
    protected readonly selectedPieceId = signal<string | null>(null);
    protected readonly selectedRotation = signal(0);
    protected readonly pieceRotations = signal<PieceRotationMap>(
        this.createRandomPieceRotations(this.puzzle().pieces),
    );
    protected readonly errorMessage = signal<string | null>(null);
    protected readonly dragPosition = signal<DragPosition | null>(null);
    protected readonly hoveredAnchor = signal<GridCoordinate | null>(null);
    protected readonly isDraggingPiece = signal(false);

    protected readonly rows = computed(() =>
        Array.from({ length: this.puzzle().size }, (_, index) => index),
    );

    protected readonly columns = computed(() =>
        Array.from({ length: this.puzzle().size }, (_, index) => index),
    );

    protected readonly unplacedPieces = computed(() => {
        const placedPieceIds = new Set(
            this.placedPieces().map((piece) => piece.pieceId),
        );

        return this.puzzle().pieces.filter((piece) => !placedPieceIds.has(piece.id));
    });

    protected readonly selectedPiece = computed(() => {
        const selectedPieceId = this.selectedPieceId();

        if (!selectedPieceId) {
            return null;
        }

        return this.getPieceById(selectedPieceId) ?? null;
    });

    protected readonly previewPlacementCells = computed(() => {
        const piece = this.selectedPiece();
        const anchor = this.hoveredAnchor();

        if (!piece || !anchor) {
            return [];
        }

        return this.jigsawGridService.getAbsoluteCells(piece, {
            pieceId: piece.id,
            anchor,
            rotation: this.selectedRotation(),
        });
    });

    protected readonly previewPlacementCellKeys = computed(() =>
        new Set(
            this.previewPlacementCells().map((cell) =>
                this.jigsawGridService.cellKey(cell),
            ),
        ),
    );

    protected readonly isPreviewPlacementValid = computed(() => {
        const piece = this.selectedPiece();
        const anchor = this.hoveredAnchor();

        if (!piece || !anchor) {
            return false;
        }

        return this.canPlacePiece(piece, {
            pieceId: piece.id,
            anchor,
            rotation: this.selectedRotation(),
        });
    });

    protected readonly boardCells = computed<BoardCell[]>(() => {
        const puzzle = this.puzzle();

        return Array.from({ length: puzzle.size * puzzle.size }, (_, index) => {
            const row = Math.floor(index / puzzle.size);
            const column = index % puzzle.size;
            const coordinate = { row, column };
            const placedPiece = this.getPlacedPieceAtCell(coordinate);
            const piece = placedPiece
                ? this.getPieceById(placedPiece.pieceId) ?? null
                : null;

            return {
                row,
                column,
                isBlocked: this.isBlockedCell(coordinate),
                piece,
                placedPiece,
                isLocked: placedPiece?.locked === true,
            };
        });
    });

    protected readonly isSolved = computed(() => {
        if (this.unplacedPieces().length > 0) {
            return false;
        }

        return this.placedPieces().every((placedPiece) =>
            this.isPlacedPieceInSolutionPosition(placedPiece),
        );
    });

    @HostListener('document:pointermove', ['$event'])
    protected updateCarriedPiecePosition(event: PointerEvent): void {
        if (!this.selectedPiece()) {
            return;
        }

        if (this.isDraggingPiece()) {
            event.preventDefault();
        }

        this.dragPosition.set({
            x: event.clientX,
            y: event.clientY,
        });

        const boardCoordinate = this.getBoardCoordinateFromPoint(
            event.clientX,
            event.clientY,
        );

        if (boardCoordinate) {
            this.setHoveredAnchor(boardCoordinate);
        } else {
            this.clearHoveredAnchor();
        }
    }

    @HostListener('document:pointerup', ['$event'])
    protected finishPieceDrag(event: PointerEvent): void {
        if (!this.isDraggingPiece() || !this.selectedPiece()) {
            return;
        }

        event.preventDefault();

        this.isDraggingPiece.set(false);

        const boardCoordinate = this.getBoardCoordinateFromPoint(
            event.clientX,
            event.clientY,
        );

        if (!boardCoordinate) {
            return;
        }

        this.placeSelectedPiece(boardCoordinate);
    }

    @HostListener('document:pointercancel', ['$event'])
    protected cancelPieceDrag(event: PointerEvent): void {
        if (!this.isDraggingPiece()) {
            return;
        }

        event.preventDefault();
        this.isDraggingPiece.set(false);
    }

    @HostListener('document:contextmenu', ['$event'])
    protected handleRightClick(event: MouseEvent): void {
        if (!this.selectedPiece()) {
            return;
        }

        event.preventDefault();
        this.rotateSelectedPiece();
    }

    @HostListener('document:click', ['$event'])
    protected handleDocumentClick(event: MouseEvent): void {
        if (!this.selectedPiece() || this.isDraggingPiece()) {
            return;
        }

        const target = event.target;

        if (!(target instanceof HTMLElement)) {
            return;
        }

        const wasUsefulGameClick =
            target.closest('.jigsaw-board') ||
            target.closest('.piece-tray') ||
            target.closest('.actions');

        if (wasUsefulGameClick) {
            return;
        }

        this.cancelSelectedPiece();
    }

    protected startPieceDrag(pieceId: string, event: PointerEvent): void {
        event.preventDefault();

        const target = event.currentTarget;

        if (target instanceof HTMLElement) {
            target.setPointerCapture(event.pointerId);
        }

        const rotation = this.pieceRotations()[pieceId] ?? 0;

        this.selectedPieceId.set(pieceId);
        this.selectedRotation.set(rotation);
        this.hoveredAnchor.set(null);
        this.errorMessage.set(null);
        this.isDraggingPiece.set(true);
        this.dragPosition.set({
            x: event.clientX,
            y: event.clientY,
        });
    }

    protected selectPiece(pieceId: string, event?: PointerEvent): void {
        const rotation = this.pieceRotations()[pieceId] ?? 0;

        this.selectedPieceId.set(pieceId);
        this.selectedRotation.set(rotation);
        this.hoveredAnchor.set(null);
        this.errorMessage.set(null);

        if (event) {
            this.dragPosition.set({
                x: event.clientX,
                y: event.clientY,
            });
        }
    }

    protected rotateSelectedPiece(): void {
        const selectedPieceId = this.selectedPieceId();

        if (!selectedPieceId || !this.selectedPiece()) {
            return;
        }

        const nextRotation = (this.selectedRotation() + 90) % 360;

        this.selectedRotation.set(nextRotation);
        this.setPieceRotation(selectedPieceId, nextRotation);

        const piece = this.selectedPiece();
        const currentAnchor = this.hoveredAnchor();

        if (!piece || !currentAnchor) {
            return;
        }

        this.hoveredAnchor.set(
            this.getCenteredAnchor(piece, currentAnchor, this.selectedRotation()),
        );
    }

    protected setHoveredAnchor(centerCell: GridCoordinate): void {
        const piece = this.selectedPiece();

        if (!piece || this.isSolved()) {
            return;
        }

        this.hoveredAnchor.set(
            this.getCenteredAnchor(piece, centerCell, this.selectedRotation()),
        );
    }

    protected clearHoveredAnchor(): void {
        this.hoveredAnchor.set(null);
    }

    protected handleBoardCellClick(cell: BoardCell, event: PointerEvent): void {
        if (this.isDraggingPiece()) {
            return;
        }

        const coordinate = {
            row: cell.row,
            column: cell.column,
        };

        if (this.selectedPiece()) {
            this.placeSelectedPiece(coordinate);
            return;
        }

        if (cell.piece && !cell.isLocked) {
            this.removePiece(cell.piece.id, event);
        }
    }

    protected placeSelectedPiece(centerCell: GridCoordinate): void {
        const selectedPiece = this.selectedPiece();

        if (!selectedPiece) {
            return;
        }

        const centeredAnchor = this.getCenteredAnchor(
            selectedPiece,
            centerCell,
            this.selectedRotation(),
        );

        this.placePiece(
            selectedPiece.id,
            centeredAnchor,
            this.selectedRotation(),
            false,
        );
    }

    protected placeHintPiece(): void {
        if (this.isSolved()) {
            return;
        }

        const hintPlacement = this.findHintPlacement();

        if (!hintPlacement) {
            this.errorMessage.set(
                'No hint is available. Try moving one of your placed pieces.',
            );
            return;
        }

        this.placedPieces.update((pieces) => [
            ...pieces,
            {
                ...hintPlacement,
                locked: true,
            },
        ]);

        this.setPieceRotation(hintPlacement.pieceId, hintPlacement.rotation);

        if (this.selectedPieceId() === hintPlacement.pieceId) {
            this.cancelSelectedPiece();
        }

        this.errorMessage.set(null);
    }

    protected removePiece(pieceId: string, event?: PointerEvent): void {
        const placedPiece = this.placedPieces().find(
            (piece) => piece.pieceId === pieceId,
        );

        if (placedPiece?.locked) {
            return;
        }

        const preservedRotation = placedPiece?.rotation ?? 0;

        this.placedPieces.update((pieces) =>
            pieces.filter((piece) => piece.pieceId !== pieceId),
        );

        this.setPieceRotation(pieceId, preservedRotation);
        this.selectedPieceId.set(pieceId);
        this.selectedRotation.set(preservedRotation);
        this.hoveredAnchor.set(null);
        this.errorMessage.set(null);

        if (event) {
            this.dragPosition.set({
                x: event.clientX,
                y: event.clientY,
            });
        }
    }

    protected resetPuzzle(): void {
        this.placedPieces.set([]);
        this.selectedPieceId.set(null);
        this.selectedRotation.set(0);
        this.pieceRotations.set(
            this.createRandomPieceRotations(this.puzzle().pieces),
        );
        this.errorMessage.set(null);
        this.dragPosition.set(null);
        this.hoveredAnchor.set(null);
        this.isDraggingPiece.set(false);
    }

    protected newPuzzle(): void {
        const nextPuzzle = this.jigsawGridService.createPuzzle();

        this.puzzle.set(nextPuzzle);
        this.placedPieces.set([]);
        this.selectedPieceId.set(null);
        this.selectedRotation.set(0);
        this.pieceRotations.set(
            this.createRandomPieceRotations(nextPuzzle.pieces),
        );
        this.errorMessage.set(null);
        this.dragPosition.set(null);
        this.hoveredAnchor.set(null);
        this.isDraggingPiece.set(false);
    }

    protected previewCells(piece: JigsawPiece): GridCoordinate[] {
        return this.jigsawGridService.rotateCells(
            piece.cells,
            this.getPieceRotation(piece.id),
        );
    }

    protected previewGridSize(piece: JigsawPiece): number {
        const cells = this.previewCells(piece);
        const maxRow = Math.max(...cells.map((cell) => cell.row));
        const maxColumn = Math.max(...cells.map((cell) => cell.column));

        return Math.max(maxRow, maxColumn) + 1;
    }

    protected colorClass(piece: JigsawPiece): string {
        return `piece-${piece.color}`;
    }

    protected boardCellClasses(cell: BoardCell): string {
        const coordinate = {
            row: cell.row,
            column: cell.column,
        };

        const classes = ['board-cell'];
        const isPreviewCell = this.isPreviewCell(coordinate);

        if (cell.isBlocked) {
            classes.push('blocked');
        }

        if (cell.piece) {
            classes.push('filled', this.colorClass(cell.piece));
        }

        if (cell.isLocked) {
            classes.push('locked');
        }

        if (isPreviewCell) {
            classes.push(
                this.isPreviewPlacementValid()
                    ? 'preview-valid'
                    : 'preview-invalid',
            );
        }

        return classes.join(' ');
    }

    protected dragPreviewTransform(position: DragPosition): string {
        return `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`;
    }

    private cancelSelectedPiece(): void {
        this.selectedPieceId.set(null);
        this.selectedRotation.set(0);
        this.dragPosition.set(null);
        this.hoveredAnchor.set(null);
        this.errorMessage.set(null);
        this.isDraggingPiece.set(false);
    }

    private placePiece(
        pieceId: string,
        anchor: GridCoordinate,
        rotation: number,
        locked: boolean,
    ): void {
        const piece = this.getPieceById(pieceId);

        if (!piece || this.isSolved()) {
            return;
        }

        const placedPiece: PlacedJigsawPiece = {
            pieceId: piece.id,
            anchor,
            rotation,
            locked,
        };

        if (!this.canPlacePiece(piece, placedPiece)) {
            this.errorMessage.set('This piece cannot be placed there.');
            return;
        }

        this.placedPieces.update((pieces) => [...pieces, placedPiece]);
        this.setPieceRotation(pieceId, rotation);
        this.selectedPieceId.set(null);
        this.selectedRotation.set(0);
        this.dragPosition.set(null);
        this.hoveredAnchor.set(null);
        this.errorMessage.set(null);
        this.isDraggingPiece.set(false);
    }

    private findHintPlacement(): PlacedJigsawPiece | null {
        const placedPieceIds = new Set(
            this.placedPieces().map((piece) => piece.pieceId),
        );

        const solutionPlacements = this.puzzle().solution.filter(
            (solutionPlacement) => !placedPieceIds.has(solutionPlacement.pieceId),
        );

        for (const solutionPlacement of solutionPlacements) {
            const piece = this.getPieceById(solutionPlacement.pieceId);

            if (!piece) {
                continue;
            }

            if (this.canPlacePiece(piece, solutionPlacement)) {
                return solutionPlacement;
            }
        }

        return null;
    }

    private canPlacePiece(
        piece: JigsawPiece,
        placedPiece: PlacedJigsawPiece,
    ): boolean {
        const absoluteCells = this.jigsawGridService.getAbsoluteCells(
            piece,
            placedPiece,
        );

        return absoluteCells.every((cell) => {
            if (!this.isInsideBoard(cell)) {
                return false;
            }

            if (this.isBlockedCell(cell)) {
                return false;
            }

            if (this.getPieceAtCell(cell)) {
                return false;
            }

            return true;
        });
    }

    private getCenteredAnchor(
        piece: JigsawPiece,
        centerCell: GridCoordinate,
        rotation: number,
    ): GridCoordinate {
        const rotatedCells = this.jigsawGridService.rotateCells(
            piece.cells,
            rotation,
        );

        const maxRow = Math.max(...rotatedCells.map((cell) => cell.row));
        const maxColumn = Math.max(...rotatedCells.map((cell) => cell.column));

        const centerOffset = {
            row: Math.round(maxRow / 2),
            column: Math.round(maxColumn / 2),
        };

        return {
            row: centerCell.row - centerOffset.row,
            column: centerCell.column - centerOffset.column,
        };
    }

    private getBoardCoordinateFromPoint(
        clientX: number,
        clientY: number,
    ): GridCoordinate | null {
        const element = document.elementFromPoint(clientX, clientY);

        if (!(element instanceof HTMLElement)) {
            return null;
        }

        const boardCell = element.closest<HTMLElement>('[data-board-cell="true"]');

        if (!boardCell) {
            return null;
        }

        const row = Number(boardCell.dataset['row']);
        const column = Number(boardCell.dataset['column']);

        if (Number.isNaN(row) || Number.isNaN(column)) {
            return null;
        }

        return { row, column };
    }

    private isPreviewCell(coordinate: GridCoordinate): boolean {
        return this.previewPlacementCellKeys().has(
            this.jigsawGridService.cellKey(coordinate),
        );
    }

    private getPieceAtCell(coordinate: GridCoordinate): JigsawPiece | null {
        const placedPiece = this.getPlacedPieceAtCell(coordinate);

        if (!placedPiece) {
            return null;
        }

        return this.getPieceById(placedPiece.pieceId) ?? null;
    }

    private getPlacedPieceAtCell(
        coordinate: GridCoordinate,
    ): PlacedJigsawPiece | null {
        for (const placedPiece of this.placedPieces()) {
            const piece = this.getPieceById(placedPiece.pieceId);

            if (!piece) {
                continue;
            }

            const absoluteCells = this.jigsawGridService.getAbsoluteCells(
                piece,
                placedPiece,
            );

            if (
                absoluteCells.some((cell) =>
                    this.jigsawGridService.areSameCell(cell, coordinate),
                )
            ) {
                return placedPiece;
            }
        }

        return null;
    }

    private getPieceById(pieceId: string): JigsawPiece | undefined {
        return this.puzzle().pieces.find((piece) => piece.id === pieceId);
    }

    private isBlockedCell(coordinate: GridCoordinate): boolean {
        return this.puzzle().blockedCells.some((blockedCell) =>
            this.jigsawGridService.areSameCell(blockedCell, coordinate),
        );
    }

    private isInsideBoard(coordinate: GridCoordinate): boolean {
        return (
            coordinate.row >= 0 &&
            coordinate.column >= 0 &&
            coordinate.row < this.puzzle().size &&
            coordinate.column < this.puzzle().size
        );
    }

    private isPlacedPieceInSolutionPosition(
        placedPiece: PlacedJigsawPiece,
    ): boolean {
        const solutionPlacement = this.puzzle().solution.find(
            (solution) => solution.pieceId === placedPiece.pieceId,
        );

        if (!solutionPlacement) {
            return false;
        }

        return (
            solutionPlacement.anchor.row === placedPiece.anchor.row &&
            solutionPlacement.anchor.column === placedPiece.anchor.column &&
            solutionPlacement.rotation === placedPiece.rotation
        );
    }

    private createRandomPieceRotations(pieces: JigsawPiece[]): PieceRotationMap {
        return Object.fromEntries(
            pieces.map((piece) => [piece.id, this.getRandomRotation()]),
        );
    }

    private getPieceRotation(pieceId: string): number {
        return this.pieceRotations()[pieceId] ?? 0;
    }

    private setPieceRotation(pieceId: string, rotation: number): void {
        this.pieceRotations.update((rotations) => ({
            ...rotations,
            [pieceId]: rotation,
        }));
    }

    private getRandomRotation(): number {
        const rotations = [0, 90, 180, 270];
        return rotations[Math.floor(Math.random() * rotations.length)];
    }
}