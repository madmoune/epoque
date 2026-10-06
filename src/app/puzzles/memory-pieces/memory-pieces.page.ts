import { Component, ElementRef, HostListener, ViewChild, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { canSnapPiece, createMemoryPiecesPuzzle } from './memory-pieces.generator';
import {
  MEMORY_BOARD_SIZE,
  MEMORY_PIECE_COUNT,
  MemoryPuzzlePiece,
  PiecePoint,
} from './memory-pieces.model';

type GamePhase = 'memorize' | 'recognize' | 'assemble';
type PieceDrag = {
  pieceId: string;
  pointerId: number;
  start: PiecePoint;
  current: PiecePoint;
  active: boolean;
};

@Component({
  selector: 'app-memory-pieces-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './memory-pieces.page.html',
  styleUrl: './memory-pieces.page.scss',
})
export class MemoryPiecesPage {
  private board: ElementRef<HTMLDivElement> | undefined;
  private suppressTrayClick = false;
  private hasShownStage = false;

  protected readonly pieceCount = MEMORY_PIECE_COUNT;
  protected readonly boardSize = MEMORY_BOARD_SIZE;
  protected readonly puzzle = signal(createMemoryPiecesPuzzle());
  protected readonly phase = signal<GamePhase>('memorize');
  protected readonly foundIds = signal<Set<string>>(new Set());
  protected readonly rejectedIds = signal<Set<string>>(new Set());
  protected readonly placedIds = signal<Set<string>>(new Set());
  protected readonly placedCenters = signal<Record<string, PiecePoint>>({});
  protected readonly snappedIds = signal<Set<string>>(new Set());
  protected readonly mistakes = signal(0);
  protected readonly selectedPieceId = signal<string | null>(null);
  protected readonly previewCenter = signal<PiecePoint | null>(null);
  protected readonly drag = signal<PieceDrag | null>(null);
  protected readonly pointerOverBoard = signal(false);
  protected readonly feedback = signal('');
  protected readonly feedbackIsError = signal(false);

  protected readonly steps = [
    { phase: 'memorize', label: 'Mémoriser' },
    { phase: 'recognize', label: 'Retrouver' },
    { phase: 'assemble', label: 'Assembler' },
  ] as const;
  protected readonly stepIndex = computed(() =>
    this.steps.findIndex((step) => step.phase === this.phase()),
  );
  protected readonly isSolved = computed(
    () =>
      this.phase() === 'assemble' &&
      this.placedIds().size === MEMORY_PIECE_COUNT &&
      this.snappedIds().size === MEMORY_PIECE_COUNT &&
      this.puzzle().pieces.every((piece) => {
        const center = this.placedCenters()[piece.id];
        return center ? canSnapPiece(piece, center) : false;
      }),
  );
  protected readonly assemblyPieces = computed(() =>
    this.puzzle().choices.flatMap((choice) => {
      const piece = this.puzzle().pieces.find((candidate) => candidate.id === choice.id);
      return piece ? [piece] : [];
    }),
  );
  protected readonly unplacedPieces = computed(() =>
    this.assemblyPieces().filter((piece) => !this.placedIds().has(piece.id)),
  );
  protected readonly placedPieces = computed(() =>
    this.assemblyPieces().filter((piece) => this.placedIds().has(piece.id)),
  );
  protected readonly selectedPiece = computed(
    () => this.assemblyPieces().find((piece) => piece.id === this.selectedPieceId()) ?? null,
  );
  protected readonly successMessage = computed(() =>
    this.mistakes() === 0
      ? 'Les cinq morceaux sont retrouvés et assemblés, sans erreur de mémoire!'
      : `Les cinq morceaux sont retrouvés et assemblés, avec ${this.mistakes()} ${this.mistakes() === 1 ? 'erreur' : 'erreurs'} de mémoire.`,
  );

  @ViewChild('assemblyBoard')
  private set boardElement(value: ElementRef<HTMLDivElement> | undefined) {
    this.board = value;
  }

  @ViewChild('stageTitle')
  private set stageTitle(value: ElementRef<HTMLHeadingElement> | undefined) {
    if (!value) return;
    if (this.hasShownStage) {
      value.nativeElement.focus({ preventScroll: true });
      value.nativeElement.scrollIntoView?.({ block: 'start' });
    }
    this.hasShownStage = true;
  }

  protected startRecognition(): void {
    if (this.phase() !== 'memorize') return;
    this.phase.set('recognize');
    this.setFeedback('Choisis les cinq morceaux que tu as mémorisés.');
  }

  protected recognizePiece(id: string): void {
    if (
      this.phase() !== 'recognize' ||
      this.foundIds().has(id) ||
      this.rejectedIds().has(id) ||
      !this.puzzle().choices.some((piece) => piece.id === id)
    )
      return;

    if (!this.puzzle().pieces.some((piece) => piece.id === id)) {
      this.rejectedIds.update((ids) => new Set([...ids, id]));
      this.mistakes.update((count) => count + 1);
      this.setFeedback('Ce morceau ne faisait pas partie des cinq. Continue à chercher.', true);
      return;
    }

    this.foundIds.update((ids) => new Set([...ids, id]));
    if (this.foundIds().size === MEMORY_PIECE_COUNT) {
      this.phase.set('assemble');
      this.setFeedback('Les cinq morceaux sont retrouvés! Assemble-les maintenant.');
    } else {
      this.setFeedback(
        `Bien vu! ${this.foundIds().size} ${this.foundIds().size === 1 ? 'morceau retrouvé' : 'morceaux retrouvés'} sur ${MEMORY_PIECE_COUNT}.`,
      );
    }
  }

  protected selectPiece(id: string, event?: MouseEvent): void {
    if (event && event.detail > 0 && this.suppressTrayClick) {
      this.suppressTrayClick = false;
      return;
    }
    if (
      this.phase() !== 'assemble' ||
      this.isSolved() ||
      !this.unplacedPieces().some((piece) => piece.id === id)
    )
      return;
    this.selectedPieceId.set(id);
    this.previewCenter.set({ x: 50, y: 50 });
    this.setFeedback('Déplace ce morceau sur le plateau.');
  }

  protected startDrag(id: string, event: PointerEvent): void {
    if (event.button !== 0 || this.drag() || this.isSolved()) return;
    this.suppressTrayClick = false;
    this.selectPiece(id);
    if (this.selectedPieceId() !== id) return;

    const point = { x: event.clientX, y: event.clientY };
    this.drag.set({
      pieceId: id,
      pointerId: event.pointerId,
      start: point,
      current: point,
      active: false,
    });
    const target = event.currentTarget;
    if (target instanceof Element && typeof target.setPointerCapture === 'function') {
      target.setPointerCapture(event.pointerId);
    }
  }

  protected selectPlacedPiece(id: string, event?: Event): void {
    event?.stopPropagation();
    if (this.phase() !== 'assemble' || this.isSolved() || !this.placedIds().has(id)) return;
    const center = this.placedCenters()[id];
    if (!center) return;
    this.selectedPieceId.set(id);
    this.previewCenter.set(center);
    this.setFeedback('Déplace ce morceau pour trouver sa place.');
  }

  protected startPlacedDrag(id: string, event: PointerEvent): void {
    event.stopPropagation();
    if (event.button !== 0 || this.drag() || this.isSolved() || !this.placedIds().has(id)) return;
    const center = this.placedCenters()[id];
    if (!center) return;
    this.selectedPieceId.set(id);
    this.previewCenter.set(center);
    const point = { x: event.clientX, y: event.clientY };
    this.drag.set({
      pieceId: id,
      pointerId: event.pointerId,
      start: point,
      current: point,
      active: false,
    });
    const target = event.currentTarget;
    if (target instanceof Element && typeof target.setPointerCapture === 'function') {
      target.setPointerCapture(event.pointerId);
    }
  }

  @HostListener('document:pointermove', ['$event'])
  protected moveDrag(event: PointerEvent): void {
    const drag = this.drag();
    if (!drag || event.pointerId !== drag.pointerId) return;
    const current = { x: event.clientX, y: event.clientY };
    const active =
      drag.active || Math.hypot(current.x - drag.start.x, current.y - drag.start.y) >= 6;
    if (!active) return;
    if (!drag.active && this.placedIds().has(drag.pieceId)) {
      this.snappedIds.update((ids) => {
        if (!ids.has(drag.pieceId)) return ids;
        const next = new Set(ids);
        next.delete(drag.pieceId);
        return next;
      });
    }
    if (event.cancelable) event.preventDefault();
    this.drag.set({ ...drag, current, active });
    const center = this.boardPoint(current);
    this.pointerOverBoard.set(center !== null);
    this.previewCenter.set(center);
  }

  @HostListener('document:pointerup', ['$event'])
  protected finishDrag(event: PointerEvent): void {
    const drag = this.drag();
    if (!drag || event.pointerId !== drag.pointerId) return;
    this.drag.set(null);
    this.pointerOverBoard.set(false);
    if (!drag.active) return;
    this.suppressTrayClick = !this.placedIds().has(drag.pieceId);
    const center = this.boardPoint({ x: event.clientX, y: event.clientY });
    if (center) {
      this.attemptPlacement(center);
    } else {
      this.previewCenter.set(this.placedCenters()[drag.pieceId] ?? null);
      this.setFeedback('Dépose le morceau sur le plateau.', true);
    }
  }

  @HostListener('document:pointercancel', ['$event'])
  protected cancelDrag(event: PointerEvent): void {
    if (event.pointerId !== this.drag()?.pointerId) return;
    this.drag.set(null);
    this.pointerOverBoard.set(false);
    this.previewCenter.set(null);
  }

  protected previewOnBoard(event: PointerEvent): void {
    const selectedId = this.selectedPieceId();
    if (this.drag() || !selectedId || this.placedIds().has(selectedId)) return;
    this.previewCenter.set(this.boardPoint({ x: event.clientX, y: event.clientY }));
  }

  protected placeOnBoard(event: MouseEvent): void {
    if (this.drag()?.active) return;
    const center = this.boardPoint({ x: event.clientX, y: event.clientY });
    if (center) this.attemptPlacement(center);
  }

  protected handleBoardKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.selectedPieceId.set(null);
      this.previewCenter.set(null);
      this.drag.set(null);
      return;
    }
    const selected = this.selectedPiece();
    if (!selected || this.isSolved()) return;
    const center = this.previewCenter() ?? this.placedCenters()[selected.id] ?? { x: 50, y: 50 };
    const offsets: Record<string, PiecePoint> = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    };
    const offset = offsets[event.key];
    if (offset) {
      event.preventDefault();
      if (this.placedIds().has(selected.id)) {
        this.snappedIds.update((ids) => {
          if (!ids.has(selected.id)) return ids;
          const next = new Set(ids);
          next.delete(selected.id);
          return next;
        });
      }
      const step = event.shiftKey ? 1 : 3;
      this.previewCenter.set({
        x: Math.max(0, Math.min(MEMORY_BOARD_SIZE, center.x + offset.x * step)),
        y: Math.max(0, Math.min(MEMORY_BOARD_SIZE, center.y + offset.y * step)),
      });
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.attemptPlacement(center);
    }
  }

  protected attemptPlacement(center: PiecePoint): void {
    const piece = this.selectedPiece();
    if (this.phase() !== 'assemble' || !piece || this.isSolved()) return;
    const targetCenter = this.targetCenter(piece);
    const isNearTarget = canSnapPiece(piece, center);
    const finalCenter = isNearTarget ? targetCenter : center;
    const wasPlaced = this.placedIds().has(piece.id);
    this.placedIds.update((ids) => new Set([...ids, piece.id]));
    this.placedCenters.update((centers) => ({ ...centers, [piece.id]: finalCenter }));
    this.snappedIds.update((ids) => {
      const next = new Set(ids);
      if (isNearTarget) next.add(piece.id);
      else next.delete(piece.id);
      return next;
    });
    this.previewCenter.set(null);
    if (this.isSolved()) {
      this.setFeedback('Bravo! Le casse-tête est complété.');
      return;
    }
    this.setFeedback(
      isNearTarget
        ? `Morceau reconnu! Il s’est aimanté à sa place. ${this.snappedIds().size} sur ${MEMORY_PIECE_COUNT}.`
        : `${wasPlaced ? 'Morceau déplacé.' : 'Morceau placé.'} ${this.snappedIds().size} sur ${MEMORY_PIECE_COUNT} reconnus.`,
    );
  }

  protected pieceTransform(piece: MemoryPuzzlePiece, center?: PiecePoint | null): string {
    return center
      ? `translate(${center.x - piece.width / 2} ${center.y - piece.height / 2})`
      : `translate(${piece.target.x} ${piece.target.y})`;
  }

  protected pieceCenter(piece: MemoryPuzzlePiece): PiecePoint {
    if (piece.id === this.selectedPieceId()) {
      const preview = this.previewCenter();
      if (preview) return preview;
    }
    return this.placedCenters()[piece.id] ?? this.targetCenter(piece);
  }

  protected targetCenter(piece: MemoryPuzzlePiece): PiecePoint {
    return {
      x: piece.target.x + piece.width / 2,
      y: piece.target.y + piece.height / 2,
    };
  }

  protected dragWidth(piece: MemoryPuzzlePiece): number {
    return (
      (piece.width / MEMORY_BOARD_SIZE) *
      (this.board?.nativeElement.getBoundingClientRect().width ?? 300)
    );
  }

  protected dragHeight(piece: MemoryPuzzlePiece): number {
    return (
      (piece.height / MEMORY_BOARD_SIZE) *
      (this.board?.nativeElement.getBoundingClientRect().height ?? 300)
    );
  }

  protected resetAssembly(): void {
    if (this.phase() !== 'assemble' || this.isSolved()) return;
    this.placedIds.set(new Set());
    this.placedCenters.set({});
    this.snappedIds.set(new Set());
    this.selectedPieceId.set(null);
    this.previewCenter.set(null);
    this.drag.set(null);
    this.pointerOverBoard.set(false);
    this.setFeedback('Le plateau est prêt. Replace les cinq morceaux.');
  }

  protected newGame(): void {
    this.phase.set('memorize');
    this.puzzle.set(createMemoryPiecesPuzzle());
    this.foundIds.set(new Set());
    this.rejectedIds.set(new Set());
    this.placedIds.set(new Set());
    this.placedCenters.set({});
    this.snappedIds.set(new Set());
    this.mistakes.set(0);
    this.selectedPieceId.set(null);
    this.previewCenter.set(null);
    this.drag.set(null);
    this.pointerOverBoard.set(false);
    this.suppressTrayClick = false;
    this.setFeedback('');
  }

  private boardPoint(point: PiecePoint): PiecePoint | null {
    const bounds = this.board?.nativeElement.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;
    const x = ((point.x - bounds.left) / bounds.width) * MEMORY_BOARD_SIZE;
    const y = ((point.y - bounds.top) / bounds.height) * MEMORY_BOARD_SIZE;
    return x >= 0 && x <= MEMORY_BOARD_SIZE && y >= 0 && y <= MEMORY_BOARD_SIZE ? { x, y } : null;
  }

  private setFeedback(message: string, error = false): void {
    this.feedback.set(message);
    this.feedbackIsError.set(error);
  }
}
