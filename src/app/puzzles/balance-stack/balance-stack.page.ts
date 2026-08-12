import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  BALANCE_STACK_DIFFICULTIES,
  BalanceGridPoint,
  BalanceStackCell,
  BalanceStackDifficultyId,
  BalanceStackPiece,
  BalanceStackPuzzle,
  BalanceStackService,
} from './balance-stack.service';

type BalanceStackFeedback = {
  tone: 'error' | 'hint';
  text: string;
};

type BalanceStackHistoryEntry = {
  cells: BalanceStackCell[];
  pieceIndex: number;
  rotation: number;
  x: number;
};

type BalanceStackDragState = {
  pointerId: number;
  clientX: number;
  clientY: number;
  cellSize: number;
  overBoard: boolean;
};

@Component({
  selector: 'app-balance-stack-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './balance-stack.page.html',
  styleUrl: './balance-stack.page.scss',
})
export class BalanceStackPage {
  private readonly balanceStackService = inject(BalanceStackService);

  @ViewChild('stackBoard') private stackBoard?: ElementRef<HTMLElement>;

  protected readonly difficulties = BALANCE_STACK_DIFFICULTIES;
  protected readonly selectedDifficulty = signal<BalanceStackDifficultyId>('classic');
  protected readonly puzzle = signal<BalanceStackPuzzle>(
    this.balanceStackService.createPuzzle(this.selectedDifficulty()),
  );
  protected readonly placedCells = signal<BalanceStackCell[]>([]);
  protected readonly currentPieceIndex = signal(0);
  protected readonly selectedRotation = signal(0);
  protected readonly selectedX = signal(0);
  protected readonly history = signal<BalanceStackHistoryEntry[]>([]);
  protected readonly feedback = signal<BalanceStackFeedback | null>(null);
  protected readonly rejectedPreview = signal(false);
  protected readonly hintPreview = signal(false);
  protected readonly dragState = signal<BalanceStackDragState | null>(null);
  protected readonly isSolved = signal(false);
  protected readonly generationError = signal<string | null>(null);

  protected readonly currentPiece = computed(
    () => this.puzzle().pieces[this.currentPieceIndex()] ?? null,
  );
  protected readonly currentOrientation = computed<readonly BalanceGridPoint[]>(() => {
    const piece = this.currentPiece();

    if (!piece) {
      return [];
    }

    const orientations = this.balanceStackService.orientationsFor(piece);
    return orientations[this.selectedRotation() % orientations.length];
  });
  protected readonly currentShapeWidth = computed(() => this.shapeWidth(this.currentOrientation()));
  protected readonly currentShapeHeight = computed(() =>
    this.shapeHeight(this.currentOrientation()),
  );
  protected readonly boardColumns = computed(() =>
    Array.from({ length: this.puzzle().width }, (_, column) => column),
  );
  protected readonly boardRows = computed(() =>
    Array.from({ length: this.puzzle().height }, (_, index) => this.puzzle().height - index - 1),
  );
  protected readonly placementPreview = computed(() => {
    const piece = this.currentPiece();

    if (!piece || this.isSolved()) {
      return null;
    }

    return this.balanceStackService.dropPiece(
      this.puzzle(),
      this.placedCells(),
      piece,
      this.selectedRotation(),
      this.selectedX(),
    );
  });
  protected readonly dragOverBoard = computed(() => this.dragState()?.overBoard ?? false);
  protected readonly showPlacementPreview = computed(
    () => this.dragOverBoard() || this.hintPreview() || this.rejectedPreview(),
  );
  protected readonly activePreview = computed(() =>
    this.showPlacementPreview() ? this.placementPreview() : null,
  );
  private readonly placedCellMap = computed(
    () => new Map(this.placedCells().map((cell) => [this.cellKey(cell.x, cell.y), cell])),
  );
  private readonly previewCellMap = computed(() => {
    const preview = this.activePreview();

    return new Map(
      (preview?.placedCells ?? []).map((cell) => [this.cellKey(cell.x, cell.y), cell]),
    );
  });
  protected readonly towerTilt = computed(() => {
    const cells = this.activePreview()?.cells ?? this.placedCells();
    const ratio =
      this.balanceStackService.balanceOffset(this.puzzle(), cells) / this.puzzle().safeRadius;

    return Math.max(-1.45, Math.min(1.45, ratio)) * 4.4;
  });
  protected readonly towerHeight = computed(() =>
    this.balanceStackService.towerHeight(this.placedCells()),
  );
  protected readonly evaluatedOffset = computed(
    () =>
      this.activePreview()?.offset ??
      this.balanceStackService.balanceOffset(this.puzzle(), this.placedCells()),
  );
  protected readonly balanceMarkerPercent = computed(() => {
    const ratio = this.evaluatedOffset() / this.puzzle().safeRadius;

    return Math.max(4, Math.min(96, 50 + ratio * 20));
  });
  protected readonly balanceLabel = computed(() => {
    const ratio = this.evaluatedOffset() / this.puzzle().safeRadius;

    if (Math.abs(ratio) < 0.12) {
      return 'Tour centrée';
    }

    return ratio < 0 ? 'La tour penche à gauche' : 'La tour penche à droite';
  });
  protected readonly previewIsUnsafe = computed(() => {
    const preview = this.activePreview();

    return preview !== null && !this.previewIsValid();
  });
  protected readonly previewIsValid = computed(() => {
    const preview = this.activePreview();
    const piece = this.currentPiece();

    if (!preview || !piece) {
      return false;
    }

    const isOpeningPlacement =
      this.currentPieceIndex() !== 0 ||
      this.balanceStackService.isOpeningPlacement(
        this.puzzle(),
        piece,
        this.selectedRotation(),
        this.selectedX(),
      );
    const isFinalPlacement =
      this.currentPieceIndex() < this.puzzle().pieces.length - 1 ||
      this.balanceStackService.isPerfectlyBalanced(this.puzzle(), preview.cells);

    return preview.stable && isOpeningPlacement && isFinalPlacement;
  });
  protected readonly placementStatus = computed(() => {
    const preview = this.activePreview();

    if (!this.showPlacementPreview()) {
      return 'Saisis la pièce et glisse-la sur la tour';
    }

    if (!preview) {
      return 'Il n’y a pas assez de place ici';
    }

    if (!preview.localStable) {
      return 'Cette pièce n’a pas assez d’appui';
    }

    if (!preview.globalStable) {
      return 'La plateforme basculerait';
    }

    if (!preview.connected) {
      return 'Le bloc doit rester collé à la tour';
    }

    if (!preview.compact) {
      return 'Évite les espaces vides dans la tour';
    }

    if (
      this.currentPieceIndex() === 0 &&
      !this.balanceStackService.isOpeningPlacement(
        this.puzzle(),
        this.currentPiece()!,
        this.selectedRotation(),
        this.selectedX(),
      )
    ) {
      return 'Commence au centre de la plateforme';
    }

    if (
      this.currentPieceIndex() === this.puzzle().pieces.length - 1 &&
      !this.balanceStackService.isPerfectlyBalanced(this.puzzle(), preview.cells)
    ) {
      return 'La tour doit finir parfaitement centrée';
    }

    return this.dragOverBoard()
      ? 'Bonne position — relâche la pièce'
      : 'La pièce est prête à être déposée';
  });
  protected readonly canUndo = computed(() => this.history().length > 0);
  protected readonly successAnswer = computed(
    () => `${this.puzzle().pieces.length} blocs · tour parfaitement équilibrée`,
  );

  constructor() {
    this.resetPiecePlacement();
  }

  protected selectDifficulty(difficultyId: BalanceStackDifficultyId): void {
    if (this.selectedDifficulty() === difficultyId) {
      return;
    }

    this.selectedDifficulty.set(difficultyId);
    this.newPuzzle();
  }

  protected rotatePiece(): void {
    const piece = this.currentPiece();

    if (!piece || this.isSolved()) {
      return;
    }

    const orientations = this.balanceStackService.orientationsFor(piece);
    const nextRotation = (this.selectedRotation() + 1) % orientations.length;
    const maximumX = this.puzzle().width - this.shapeWidth(orientations[nextRotation]);

    this.selectedRotation.set(nextRotation);
    this.selectedX.set(Math.min(this.selectedX(), maximumX));
    this.clearTransientFeedback();
  }

  protected handlePieceContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.rotatePiece();
  }

  protected startPieceDrag(event: PointerEvent): void {
    if (event.button !== 0 || !this.currentPiece() || this.isSolved()) {
      return;
    }

    event.preventDefault();
    const target = event.currentTarget;
    const boardRect = this.stackBoard?.nativeElement.getBoundingClientRect();

    if (target instanceof HTMLElement) {
      target.setPointerCapture?.(event.pointerId);
    }

    this.feedback.set(null);
    this.rejectedPreview.set(false);
    this.hintPreview.set(false);
    this.dragState.set({
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      cellSize: boardRect ? boardRect.width / this.puzzle().width : 34,
      overBoard: false,
    });
    this.updateDragPosition(event.clientX, event.clientY);
  }

  protected movePieceDrag(event: PointerEvent): void {
    const drag = this.dragState();

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    this.updateDragPosition(event.clientX, event.clientY);
  }

  @HostListener('document:pointermove', ['$event'])
  protected trackPieceDragAcrossPage(event: PointerEvent): void {
    this.movePieceDrag(event);
  }

  protected endPieceDrag(event: PointerEvent): void {
    const drag = this.dragState();

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const overBoard = this.updateDragPosition(event.clientX, event.clientY);
    const target = event.currentTarget;

    if (target instanceof HTMLElement && target.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    this.dragState.set(null);
    this.hintPreview.set(false);

    if (overBoard) {
      this.placeCurrentPiece();
    }
  }

  @HostListener('document:pointerup', ['$event'])
  protected finishPieceDragAcrossPage(event: PointerEvent): void {
    this.endPieceDrag(event);
  }

  protected cancelPieceDrag(event: PointerEvent): void {
    const drag = this.dragState();

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const target = event.currentTarget;

    if (target instanceof HTMLElement && target.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    this.dragState.set(null);
  }

  @HostListener('document:pointercancel', ['$event'])
  protected cancelPieceDragAcrossPage(event: PointerEvent): void {
    this.cancelPieceDrag(event);
  }

  protected handlePieceKeyboard(event: KeyboardEvent): void {
    if (!this.currentPiece() || this.isSolved()) {
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      const maximumX = this.puzzle().width - this.currentShapeWidth();
      this.selectedX.set(Math.max(0, Math.min(maximumX, this.selectedX() + direction)));
      this.hintPreview.set(true);
      this.feedback.set(null);
      this.rejectedPreview.set(false);
      return;
    }

    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      this.rotatePiece();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.hintPreview.set(true);
      this.placeCurrentPiece();
    }
  }

  protected undoLastPiece(): void {
    const history = this.history();
    const previous = history[history.length - 1];

    if (!previous) {
      return;
    }

    this.history.set(history.slice(0, -1));
    this.placedCells.set(previous.cells);
    this.currentPieceIndex.set(previous.pieceIndex);
    this.selectedRotation.set(previous.rotation);
    this.selectedX.set(previous.x);
    this.isSolved.set(false);
    this.feedback.set(null);
    this.rejectedPreview.set(false);
    this.hintPreview.set(false);
  }

  protected showHint(): void {
    if (this.isSolved()) {
      return;
    }

    const completion = this.balanceStackService.findCompletion(
      this.puzzle(),
      this.placedCells(),
      this.currentPieceIndex(),
    );

    if (!completion?.length) {
      this.feedback.set({
        tone: 'error',
        text: 'Cette construction est bloquée. Retire le dernier bloc pour essayer autrement.',
      });
      return;
    }

    this.selectedRotation.set(completion[0].rotation);
    this.selectedX.set(completion[0].x);
    this.rejectedPreview.set(false);
    this.hintPreview.set(true);
    this.feedback.set({
      tone: 'hint',
      text: 'Indice : cette position respecte les règles d’appui, d’adhérence et d’équilibre.',
    });
  }

  protected resetPuzzle(): void {
    this.placedCells.set([]);
    this.currentPieceIndex.set(0);
    this.selectedRotation.set(0);
    this.selectedX.set(0);
    this.history.set([]);
    this.feedback.set(null);
    this.rejectedPreview.set(false);
    this.hintPreview.set(false);
    this.dragState.set(null);
    this.isSolved.set(false);
    this.resetPiecePlacement();
  }

  protected newPuzzle(): void {
    try {
      this.puzzle.set(this.balanceStackService.createPuzzle(this.selectedDifficulty()));
      this.generationError.set(null);
      this.resetPuzzle();
    } catch {
      this.generationError.set('Impossible de créer une nouvelle tour pour le moment.');
    }
  }

  protected placedCellAt(x: number, y: number): BalanceStackCell | null {
    return this.placedCellMap().get(this.cellKey(x, y)) ?? null;
  }

  protected previewCellAt(x: number, y: number): BalanceStackCell | null {
    return this.previewCellMap().get(this.cellKey(x, y)) ?? null;
  }

  protected miniatureCells(piece: BalanceStackPiece): readonly BalanceGridPoint[] {
    return this.balanceStackService.orientationsFor(piece)[0];
  }

  protected miniatureWidth(piece: BalanceStackPiece): number {
    return this.shapeWidth(this.miniatureCells(piece));
  }

  protected miniatureHeight(piece: BalanceStackPiece): number {
    return this.shapeHeight(this.miniatureCells(piece));
  }

  protected currentMiniatureRow(cell: BalanceGridPoint): number {
    return this.currentShapeHeight() - cell.y;
  }

  protected miniatureRow(piece: BalanceStackPiece, cell: BalanceGridPoint): number {
    return this.miniatureHeight(piece) - cell.y;
  }

  protected pieceState(index: number): 'placed' | 'current' | 'upcoming' {
    if (index < this.currentPieceIndex()) {
      return 'placed';
    }

    return index === this.currentPieceIndex() ? 'current' : 'upcoming';
  }

  protected boardAriaLabel(): string {
    const progress = `${this.currentPieceIndex()} blocs placés sur ${this.puzzle().pieces.length}`;

    if (this.isSolved()) {
      return `Tour terminée, ${progress}.`;
    }

    return this.showPlacementPreview()
      ? `Tour en construction, ${progress}. Aperçu à la colonne ${this.selectedX() + 1}.`
      : `Tour en construction, ${progress}.`;
  }

  private placeCurrentPiece(): void {
    if (this.isSolved()) {
      return;
    }

    const piece = this.currentPiece();
    const preview = this.placementPreview();

    if (!piece || !preview) {
      this.rejectedPreview.set(true);
      this.feedback.set({
        tone: 'error',
        text: 'Cette pièce ne peut pas tomber ici.',
      });
      return;
    }

    if (!preview.localStable) {
      this.rejectedPreview.set(true);
      this.feedback.set({
        tone: 'error',
        text: 'La pièce dépasse trop de ses points d’appui. Tourne-la ou décale-la.',
      });
      return;
    }

    if (!preview.globalStable) {
      this.rejectedPreview.set(true);
      this.feedback.set({
        tone: 'error',
        text: 'La plateforme basculerait. Dépose la pièce plus près du centre.',
      });
      return;
    }

    if (!preview.connected) {
      this.rejectedPreview.set(true);
      this.feedback.set({
        tone: 'error',
        text: 'Ce bloc doit toucher la tour. Il ne peut pas être posé à côté.',
      });
      return;
    }

    if (!preview.compact) {
      this.rejectedPreview.set(true);
      this.feedback.set({
        tone: 'error',
        text: 'La tour ne peut pas contenir d’espace vide entre ses blocs.',
      });
      return;
    }

    if (
      this.currentPieceIndex() === 0 &&
      !this.balanceStackService.isOpeningPlacement(
        this.puzzle(),
        piece,
        this.selectedRotation(),
        this.selectedX(),
      )
    ) {
      this.rejectedPreview.set(true);
      this.feedback.set({
        tone: 'error',
        text: 'Le premier bloc doit commencer au centre de la plateforme.',
      });
      return;
    }

    if (
      this.currentPieceIndex() === this.puzzle().pieces.length - 1 &&
      !this.balanceStackService.isPerfectlyBalanced(this.puzzle(), preview.cells)
    ) {
      this.rejectedPreview.set(true);
      this.feedback.set({
        tone: 'error',
        text: 'La dernière pièce doit laisser la tour parfaitement centrée.',
      });
      return;
    }

    this.history.update((history) => [
      ...history,
      {
        cells: this.placedCells().map((cell) => ({ ...cell })),
        pieceIndex: this.currentPieceIndex(),
        rotation: this.selectedRotation(),
        x: this.selectedX(),
      },
    ]);
    this.placedCells.set(preview.cells);
    this.currentPieceIndex.update((index) => index + 1);
    this.feedback.set(null);
    this.rejectedPreview.set(false);
    this.hintPreview.set(false);

    if (this.currentPieceIndex() >= this.puzzle().pieces.length) {
      this.isSolved.set(true);
      return;
    }

    this.resetPiecePlacement();
  }

  private updateDragPosition(clientX: number, clientY: number): boolean {
    const drag = this.dragState();
    const boardRect = this.stackBoard?.nativeElement.getBoundingClientRect();

    if (!drag || !boardRect) {
      return false;
    }

    const cellSize = boardRect.width / this.puzzle().width;
    const overBoard =
      clientX >= boardRect.left - cellSize * 0.5 &&
      clientX <= boardRect.right + cellSize * 0.5 &&
      clientY >= boardRect.top - cellSize * 1.5 &&
      clientY <= boardRect.bottom + cellSize * 0.75;

    if (overBoard) {
      const maximumX = this.puzzle().width - this.currentShapeWidth();
      const rawX = (clientX - boardRect.left) / cellSize - this.currentShapeWidth() / 2;

      this.selectedX.set(Math.max(0, Math.min(maximumX, Math.round(rawX))));
    }

    this.dragState.set({
      ...drag,
      clientX,
      clientY,
      cellSize,
      overBoard,
    });

    return overBoard;
  }

  private resetPiecePlacement(): void {
    const piece = this.currentPiece();

    if (!piece) {
      return;
    }

    this.selectedRotation.set(0);
    const initialOrientation = this.balanceStackService.orientationsFor(piece)[0];
    this.selectedX.set(
      Math.max(0, Math.floor((this.puzzle().width - this.shapeWidth(initialOrientation)) / 2)),
    );
  }

  private clearTransientFeedback(): void {
    this.feedback.set(null);
    this.rejectedPreview.set(false);
    this.hintPreview.set(false);
  }

  private shapeWidth(cells: readonly BalanceGridPoint[]): number {
    return cells.length === 0 ? 0 : Math.max(...cells.map((cell) => cell.x)) + 1;
  }

  private shapeHeight(cells: readonly BalanceGridPoint[]): number {
    return cells.length === 0 ? 0 : Math.max(...cells.map((cell) => cell.y)) + 1;
  }

  private cellKey(x: number, y: number): string {
    return `${x},${y}`;
  }
}
