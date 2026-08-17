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
  WeightDeductionPuzzle,
  WeightDeductionService,
  WeightPanToken,
  WeightRelation,
  WeightStone,
} from './weight-deduction.service';

type WeightFeedback = {
  tone: 'error' | 'hint';
  text: string;
};

type PieceLocation = 'tray' | 'left' | 'right';

type WeighablePiece = {
  id: string;
  token: WeightPanToken;
  location: PieceLocation;
};

type WeightDragState = {
  pointerId: number;
  pieceId: string;
  startX: number;
  startY: number;
  clientX: number;
  clientY: number;
  moved: boolean;
  over: PieceLocation | null;
  trayIndex: number | null;
};

@Component({
  selector: 'app-weight-deduction-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './weight-deduction.page.html',
  styleUrl: './weight-deduction.page.scss',
})
export class WeightDeductionPage {
  private readonly weightService = inject(WeightDeductionService);
  private dragCaptureTarget: HTMLElement | null = null;
  private usageSequence = 0;

  @ViewChild('pieceTray') private pieceTray?: ElementRef<HTMLElement>;
  @ViewChild('leftPan') private leftPan?: ElementRef<HTMLElement>;
  @ViewChild('rightPan') private rightPan?: ElementRef<HTMLElement>;

  protected readonly puzzle = signal<WeightDeductionPuzzle>(this.weightService.createPuzzle());
  protected readonly pieces = signal<WeighablePiece[]>([]);
  protected readonly answers = signal<Record<string, string>>({});
  protected readonly hintedStoneIds = signal<Set<string>>(new Set());
  protected readonly feedback = signal<WeightFeedback | null>(null);
  protected readonly selectedPieceId = signal<string | null>(null);
  protected readonly dragState = signal<WeightDragState | null>(null);
  protected readonly isSolved = signal(false);
  protected readonly generationError = signal<string | null>(null);

  protected readonly trayPieces = computed(() =>
    this.pieces().filter((piece) => piece.location === 'tray'),
  );
  protected readonly leftPieces = computed(() =>
    this.pieces().filter((piece) => piece.location === 'left'),
  );
  protected readonly rightPieces = computed(() =>
    this.pieces().filter((piece) => piece.location === 'right'),
  );
  protected readonly stonePieces = computed(() =>
    this.pieces().filter((piece) => piece.token.kind === 'stone'),
  );
  protected readonly currentResult = computed<WeightRelation | null>(() => {
    const left = this.leftPieces().map((piece) => ({ ...piece.token }));
    const right = this.rightPieces().map((piece) => ({ ...piece.token }));

    if (left.length === 0 && right.length === 0) {
      return null;
    }

    return this.weightService.relationForClue(
      {
        id: 'pesee-en-direct',
        left,
        right,
        relation: 'balanced',
      },
      this.puzzle().solution,
    );
  });
  protected readonly draggedPiece = computed(() => {
    const pieceId = this.dragState()?.pieceId;

    return pieceId ? (this.pieces().find((piece) => piece.id === pieceId) ?? null) : null;
  });
  protected readonly allAnswered = computed(() =>
    this.puzzle().stones.every((stone) => this.answerForStone(stone.id) !== ''),
  );
  protected readonly hasAvailableHint = computed(() =>
    this.puzzle().stones.some((stone) => !this.hintedStoneIds().has(stone.id)),
  );
  protected readonly successAnswer = computed(() =>
    this.puzzle()
      .stones.map((stone) => `${stone.label} = ${this.puzzle().solution[stone.id]}`)
      .join(' · '),
  );

  constructor() {
    this.initializePieces();
  }

  protected startPieceDrag(pieceId: string, event: PointerEvent): void {
    if (this.isSolved() || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    const piece = this.pieces().find((candidate) => candidate.id === pieceId);
    const target = event.currentTarget;

    if (!piece) {
      return;
    }

    event.preventDefault();

    if (target instanceof HTMLElement) {
      target.focus({ preventScroll: true });
      target.setPointerCapture?.(event.pointerId);
      this.dragCaptureTarget = target;
    }

    this.dragState.set({
      pointerId: event.pointerId,
      pieceId,
      startX: event.clientX,
      startY: event.clientY,
      clientX: event.clientX,
      clientY: event.clientY,
      moved: false,
      over: piece.location,
      trayIndex: null,
    });
  }

  @HostListener('document:pointermove', ['$event'])
  protected trackPieceDrag(event: PointerEvent): void {
    const drag = this.dragState();

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const moved =
      drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 5;
    const over = moved ? this.dropZoneAt(event.clientX, event.clientY) : drag.over;
    const trayIndex =
      moved && over === 'tray'
        ? this.trayInsertionIndexAt(event.clientX, event.clientY, drag.pieceId)
        : null;

    this.dragState.set({
      ...drag,
      clientX: event.clientX,
      clientY: event.clientY,
      moved,
      over,
      trayIndex,
    });
  }

  @HostListener('document:pointerup', ['$event'])
  protected finishPieceDrag(event: PointerEvent): void {
    const drag = this.dragState();

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const moved =
      drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 5;
    const dropZone = moved ? this.dropZoneAt(event.clientX, event.clientY) : null;
    const trayIndex =
      dropZone === 'tray'
        ? this.trayInsertionIndexAt(event.clientX, event.clientY, drag.pieceId)
        : null;

    this.releaseDragCapture(event.pointerId);
    this.dragState.set(null);

    if (!moved) {
      this.selectPiece(drag.pieceId);
      return;
    }

    this.selectedPieceId.set(null);

    if (dropZone) {
      this.movePiece(drag.pieceId, dropZone, trayIndex);
    }
  }

  @HostListener('document:pointercancel', ['$event'])
  protected cancelPieceDrag(event: PointerEvent): void {
    const drag = this.dragState();

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    this.releaseDragCapture(event.pointerId);
    this.dragState.set(null);
  }

  protected selectPiece(pieceId: string): void {
    if (this.isSolved()) {
      return;
    }

    this.selectedPieceId.update((selectedId) => (selectedId === pieceId ? null : pieceId));
  }

  protected placeSelected(location: PieceLocation): void {
    const pieceId = this.selectedPieceId();

    if (!pieceId || this.isSolved()) {
      return;
    }

    if (this.movePiece(pieceId, location)) {
      this.selectedPieceId.set(null);
    }
  }

  protected handleDropZoneKey(event: KeyboardEvent, location: PieceLocation): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.placeSelected(location);
  }

  protected handlePieceKey(event: KeyboardEvent, pieceId: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.selectPiece(pieceId);
  }

  protected clearScale(): void {
    if (this.isSolved()) {
      return;
    }

    this.pieces.update((pieces) => pieces.filter((piece) => piece.location === 'tray'));
    this.selectedPieceId.set(null);
  }

  protected clearPan(location: 'left' | 'right'): void {
    if (this.isSolved()) {
      return;
    }

    this.pieces.update((pieces) => pieces.filter((piece) => piece.location !== location));
    this.selectedPieceId.set(null);
  }

  protected removePiece(pieceId: string): void {
    if (this.isSolved()) {
      return;
    }

    const piece = this.pieces().find((candidate) => candidate.id === pieceId);

    if (!piece || piece.location === 'tray') {
      return;
    }

    this.pieces.update((pieces) => pieces.filter((candidate) => candidate.id !== pieceId));
    this.selectedPieceId.set(null);
  }

  protected updateAnswer(pieceId: string, event: Event): void {
    if (this.isSolved()) {
      return;
    }

    const piece = this.pieces().find((candidate) => candidate.id === pieceId);

    if (!piece || piece.token.kind !== 'stone' || this.hintedStoneIds().has(piece.token.stoneId)) {
      return;
    }

    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';

    this.setAnswerForStone(piece.token.stoneId, value);
    this.validateAnswers();
  }

  private setAnswerForStone(stoneId: string, value: string): void {
    this.answers.update((answers) => {
      const nextAnswers = { ...answers };

      for (const piece of this.stonePieces()) {
        if (piece.token.kind === 'stone' && piece.token.stoneId === stoneId) {
          nextAnswers[piece.id] = value;
        }
      }

      return nextAnswers;
    });
  }

  protected answerFor(pieceId: string): string {
    return this.answers()[pieceId] ?? '';
  }

  private answerForStone(stoneId: string): string {
    const piece = this.stonePieces().find(
      (candidate) => candidate.token.kind === 'stone' && candidate.token.stoneId === stoneId,
    );

    return piece ? this.answerFor(piece.id) : '';
  }

  protected isWeightUsedByOther(weight: number, pieceId: string): boolean {
    if (!this.puzzle().allDifferent) {
      return false;
    }

    const piece = this.pieces().find((candidate) => candidate.id === pieceId);

    if (!piece || piece.token.kind !== 'stone') {
      return false;
    }

    return this.puzzle().stones.some(
      (candidate) =>
        candidate.id !== piece.token.stoneId &&
        Number(this.answerForStone(candidate.id)) === weight,
    );
  }

  protected validateAnswers(): void {
    const puzzle = this.puzzle();

    if (!this.allAnswered()) {
      this.feedback.set(null);
      return;
    }

    const values = puzzle.stones.map((stone) => Number(this.answerForStone(stone.id)));

    if (puzzle.allDifferent && new Set(values).size !== values.length) {
      this.feedback.set({
        tone: 'error',
        text: 'Dans cette énigme, chaque pierre doit avoir un poids différent.',
      });
      return;
    }

    const isCorrect = puzzle.stones.every(
      (stone) => Number(this.answerForStone(stone.id)) === puzzle.solution[stone.id],
    );

    if (!isCorrect) {
      this.feedback.set({
        tone: 'error',
        text: 'Cette attribution ne respecte pas tes pesées. Essaie une nouvelle comparaison.',
      });
      return;
    }

    this.feedback.set(null);
    this.isSolved.set(true);
  }

  protected showHint(): void {
    if (this.isSolved()) {
      return;
    }

    const puzzle = this.puzzle();
    const hintPiece =
      this.stonePieces().find(
        (piece) =>
          piece.token.kind === 'stone' &&
          !this.hintedStoneIds().has(piece.token.stoneId) &&
          Number(this.answerFor(piece.id)) !== puzzle.solution[piece.token.stoneId],
      ) ??
      this.stonePieces().find(
        (piece) => piece.token.kind === 'stone' && !this.hintedStoneIds().has(piece.token.stoneId),
      );

    if (!hintPiece) {
      return;
    }

    if (hintPiece.token.kind !== 'stone') {
      return;
    }

    const stoneId = hintPiece.token.stoneId;
    const weight = puzzle.solution[stoneId];

    this.setAnswerForStone(stoneId, String(weight));
    this.hintedStoneIds.update((stoneIds) => new Set([...stoneIds, stoneId]));
    this.validateAnswers();

    if (!this.isSolved()) {
      this.feedback.set({
        tone: 'hint',
        text: `Indice : la pierre ${this.pieceName(hintPiece).toLocaleLowerCase('fr-CA')} pèse ${weight}.`,
      });
    }
  }

  protected resetPuzzle(): void {
    this.initializePieces();
    this.answers.set({});
    this.hintedStoneIds.set(new Set());
    this.selectedPieceId.set(null);
    this.dragState.set(null);
    this.feedback.set(null);
    this.isSolved.set(false);
  }

  protected newPuzzle(): void {
    try {
      this.puzzle.set(this.weightService.createPuzzle());
      this.generationError.set(null);
      this.resetPuzzle();
    } catch {
      this.generationError.set('Impossible de créer une nouvelle énigme pour le moment.');
    }
  }

  protected isHinted(pieceId: string): boolean {
    const piece = this.pieces().find((candidate) => candidate.id === pieceId);

    return piece?.token.kind === 'stone' && this.hintedStoneIds().has(piece.token.stoneId);
  }

  protected isSelected(pieceId: string): boolean {
    return this.selectedPieceId() === pieceId;
  }

  protected isDragging(pieceId: string): boolean {
    return this.dragState()?.pieceId === pieceId;
  }

  protected isDropTarget(location: PieceLocation): boolean {
    const drag = this.dragState();

    return !!drag?.moved && drag.over === location;
  }

  protected isTrayDropBefore(pieceId: string): boolean {
    const drag = this.dragState();

    if (!drag || !drag.moved || drag.over !== 'tray' || drag.trayIndex === null) {
      return false;
    }

    const availableIds = this.trayPieces()
      .filter((piece) => piece.id !== drag.pieceId)
      .map((piece) => piece.id);

    return availableIds[drag.trayIndex] === pieceId;
  }

  protected stoneForId(stoneId: string): WeightStone {
    return this.puzzle().stones.find((stone) => stone.id === stoneId) ?? this.puzzle().stones[0];
  }

  protected stoneInitial(stoneId: string): string {
    return this.stoneForId(stoneId).label.slice(0, 1).toLocaleUpperCase('fr-CA');
  }

  protected pieceName(piece: WeighablePiece): string {
    return this.stoneForId(piece.token.stoneId).label;
  }

  protected pieceAriaLabel(piece: WeighablePiece): string {
    const location =
      piece.location === 'tray'
        ? 'dans la réserve'
        : piece.location === 'left'
          ? 'sur le plateau gauche'
          : 'sur le plateau droit';

    return `${this.pieceName(piece)}, ${location}. Glisse cette pièce ou sélectionne-la.`;
  }

  private initializePieces(): void {
    const puzzle = this.puzzle();
    const pieces: WeighablePiece[] = [];
    this.usageSequence = 0;

    for (const stone of puzzle.stones) {
      pieces.push({
        id: `pierre-${stone.id}-reserve`,
        token: { kind: 'stone', stoneId: stone.id },
        location: 'tray',
      });
    }

    this.pieces.set(pieces);
  }

  private movePiece(
    pieceId: string,
    location: PieceLocation,
    trayIndex: number | null = null,
  ): boolean {
    const piece = this.pieces().find((candidate) => candidate.id === pieceId);

    if (!piece) {
      return false;
    }

    if (piece.location === location) {
      if (location === 'tray' && trayIndex !== null) {
        this.pieces.set(this.withTrayOrder(this.pieces(), pieceId, trayIndex));
      }

      return true;
    }

    if (piece.location === 'tray' && location !== 'tray') {
      const usagePiece: WeighablePiece = {
        id: `pierre-${piece.token.stoneId}-usage-${++this.usageSequence}`,
        token: { ...piece.token },
        location,
      };
      const sourceAnswer = this.answerFor(piece.id);

      this.pieces.update((pieces) => [...pieces, usagePiece]);
      this.answers.update((answers) => ({ ...answers, [usagePiece.id]: sourceAnswer }));
      return true;
    }

    if (location === 'tray') {
      const reservePiece = this.pieces().find(
        (candidate) =>
          candidate.location === 'tray' &&
          candidate.token.kind === 'stone' &&
          piece.token.kind === 'stone' &&
          candidate.token.stoneId === piece.token.stoneId,
      );

      if (!reservePiece) {
        return false;
      }

      const remainingPieces = this.pieces().filter((candidate) => candidate.id !== pieceId);
      this.pieces.set(
        trayIndex === null
          ? remainingPieces
          : this.withTrayOrder(remainingPieces, reservePiece.id, trayIndex),
      );
      return true;
    }

    this.pieces.update((pieces) => {
      const updatedPieces = pieces.map((candidate) =>
        candidate.id === pieceId ? { ...candidate, location } : candidate,
      );

      return updatedPieces;
    });
    return true;
  }

  private withTrayOrder(
    pieces: readonly WeighablePiece[],
    pieceId: string,
    insertionIndex: number,
  ): WeighablePiece[] {
    const trayPieces = pieces.filter((piece) => piece.location === 'tray');
    const movingPiece = trayPieces.find((piece) => piece.id === pieceId);

    if (!movingPiece) {
      return [...pieces];
    }

    const remainingTrayPieces = trayPieces.filter((piece) => piece.id !== pieceId);
    const safeIndex = Math.max(0, Math.min(insertionIndex, remainingTrayPieces.length));
    remainingTrayPieces.splice(safeIndex, 0, movingPiece);

    let trayCursor = 0;

    return pieces.map((piece) =>
      piece.location === 'tray' ? remainingTrayPieces[trayCursor++] : piece,
    );
  }

  private dropZoneAt(clientX: number, clientY: number): PieceLocation | null {
    const zones: Array<[PieceLocation, ElementRef<HTMLElement> | undefined]> = [
      ['left', this.leftPan],
      ['right', this.rightPan],
      ['tray', this.pieceTray],
    ];

    for (const [location, elementRef] of zones) {
      const rect = elementRef?.nativeElement.getBoundingClientRect();

      if (
        rect &&
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return location;
      }
    }

    return null;
  }

  private trayInsertionIndexAt(clientX: number, clientY: number, draggedPieceId: string): number {
    const trayElement = this.pieceTray?.nativeElement;

    if (!trayElement) {
      return this.trayPieces().filter((piece) => piece.id !== draggedPieceId).length;
    }

    const trayPieces = [...trayElement.querySelectorAll<HTMLElement>('[data-piece-id]')].filter(
      (element) => element.dataset['pieceId'] !== draggedPieceId,
    );

    const insertionIndex = trayPieces.findIndex((element) => {
      const rect = element.getBoundingClientRect();

      if (clientY < rect.top + rect.height / 2) {
        return true;
      }

      return clientY <= rect.bottom && clientX < rect.left + rect.width / 2;
    });

    return insertionIndex === -1 ? trayPieces.length : insertionIndex;
  }

  private releaseDragCapture(pointerId: number): void {
    if (this.dragCaptureTarget?.hasPointerCapture?.(pointerId)) {
      this.dragCaptureTarget.releasePointerCapture(pointerId);
    }

    this.dragCaptureTarget = null;
  }
}
