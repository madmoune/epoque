import { NgStyle } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type ShapeKind = 'circle' | 'square' | 'rectangle' | 'triangle' | 'diamond';

type ShapePiece = {
  id: string;
  kind: ShapeKind;
  color: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  backgroundColor?: string;
  accentColor?: string;
};

@Component({
  selector: 'app-shape-layers-page',
  imports: [RouterLink, NgStyle, PuzzleSuccessPopupComponent],
  templateUrl: './shape-layers.page.html',
  styleUrl: './shape-layers.page.scss',
})
export class ShapeLayersPage {
  protected readonly solution = signal<ShapePiece[]>([]);
  protected readonly piecePool = signal<ShapePiece[]>([]);
  protected readonly pieces = signal<ShapePiece[]>([]);
  protected readonly selectedPieceId = signal<string | null>(null);
  protected readonly moves = signal(0);
  protected readonly isSolved = computed(() => {
    const pieces = this.pieces();
    return pieces.length > 0 && this.visibleCompositionsMatch(pieces, this.solution());
  });

  constructor() {
    this.newPuzzle();
  }

  protected newPuzzle(): void {
    const pool = this.createPiecePool();
    const usedCount = 6 + Math.floor(Math.random() * 3);
    const backedPieces = pool.filter((piece) => piece.backgroundColor);
    const transparentPieces = pool.filter((piece) => !piece.backgroundColor).sort(() => Math.random() - 0.5);
    const backedPiece = backedPieces[Math.floor(Math.random() * backedPieces.length)];
    const solution = [backedPiece, ...transparentPieces.slice(0, usedCount - 1)];

    this.piecePool.set(pool);
    this.solution.set(solution);
    this.pieces.set([]);
    this.selectedPieceId.set(null);
    this.moves.set(0);
  }

  protected pieceStyle(piece: ShapePiece): Record<string, string> {
    return {
      left: `${piece.x * 20}%`,
      top: `${piece.y * 20}%`,
      width: `${piece.width}%`,
      height: `${piece.height}%`,
      transform: `translate(-50%, -50%) rotate(${piece.rotation}deg)`,
      '--piece-color': piece.color,
      '--piece-background': piece.backgroundColor ?? 'transparent',
      '--piece-accent': piece.accentColor ?? 'transparent',
    };
  }

  protected selectPiece(pieceId: string): void {
    this.selectedPieceId.set(pieceId);
  }

  protected choosePiece(piece: ShapePiece): void {
    const placedPiece = this.pieces().find((candidate) => candidate.id === piece.id);
    if (placedPiece) {
      this.removePiece(piece.id);
      return;
    }
    if (this.isSolved()) return;
    this.pieces.update((pieces) => [...pieces, { ...piece, x: 2.5, y: 2.5, rotation: 0 }]);
    this.selectedPieceId.set(piece.id);
    this.moves.update((value) => value + 1);
  }

  protected isPlaced(pieceId: string): boolean {
    return this.pieces().some((piece) => piece.id === pieceId);
  }

  protected removeSelected(): void {
    const id = this.selectedPieceId();
    if (!id || this.isSolved()) return;
    this.removePiece(id);
  }

  protected removePiece(pieceId: string): void {
    if (this.isSolved() || !this.isPlaced(pieceId)) return;
    this.pieces.update((pieces) => pieces.filter((piece) => piece.id !== pieceId));
    if (this.selectedPieceId() === pieceId) this.selectedPieceId.set(null);
    this.moves.update((value) => value + 1);
  }

  protected rotateSelected(): void {
    const id = this.selectedPieceId();
    if (id) this.rotatePiece(id);
  }

  protected rotateSelectedFromContextMenu(event: Event): void {
    event.preventDefault();
    this.rotateSelected();
  }

  protected rotatePiece(pieceId: string, event?: Event): void {
    event?.preventDefault();
    const piece = this.pieces().find((candidate) => candidate.id === pieceId);
    if (!piece || piece.kind === 'circle' || this.isSolved()) return;
    this.selectedPieceId.set(pieceId);
    this.pieces.update((pieces) =>
      pieces.map((candidate) =>
        candidate.id === pieceId
          ? { ...candidate, rotation: (candidate.rotation + 90) % 360 }
          : candidate,
      ),
    );
    this.moves.update((value) => value + 1);
  }

  protected changeLayer(direction: -1 | 1): void {
    const id = this.selectedPieceId();
    const pieces = [...this.pieces()];
    const index = pieces.findIndex((piece) => piece.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= pieces.length || this.isSolved()) return;
    [pieces[index], pieces[nextIndex]] = [pieces[nextIndex], pieces[index]];
    this.pieces.set(pieces);
    this.moves.update((value) => value + 1);
  }

  protected shapeLabel(piece: ShapePiece): string {
    const labels: Record<ShapeKind, string> = {
      circle: 'cercle',
      square: 'carré',
      rectangle: 'rectangle',
      triangle: 'triangle',
      diamond: 'losange',
    };
    return labels[piece.kind];
  }

  private createPiecePool(): ShapePiece[] {
    const definitions: Array<{
      kind: ShapeKind;
      color: string;
      backgroundColor?: string;
      accentColor?: string;
    }> = [
      { kind: 'circle', color: '#ef4444' },
      { kind: 'square', color: '#3b82f6', accentColor: '#facc15' },
      { kind: 'rectangle', color: '#f59e0b', backgroundColor: '#f8e7c3' },
      { kind: 'triangle', color: '#8b5cf6', accentColor: '#38bdf8' },
      { kind: 'diamond', color: '#10b981' },
      { kind: 'rectangle', color: '#06b6d4', backgroundColor: '#17313a' },
      { kind: 'circle', color: '#ec4899', accentColor: '#fb923c' },
      { kind: 'triangle', color: '#4ca82e', backgroundColor: '#f7c744', accentColor: '#5eb0df' },
      { kind: 'diamond', color: '#f97316', accentColor: '#a855f7' },
      { kind: 'square', color: '#a855f7', backgroundColor: '#e9d5ff' },
    ];
    return definitions.map((definition, index) => ({
      id: `piece-${index}`,
      ...definition,
      x: 2.5,
      y: 2.5,
      rotation: definition.kind === 'circle' ? 0 : Math.floor(Math.random() * 4) * 90,
      width: 84,
      height: 84,
    }));
  }

  private normalizedRotation(piece: ShapePiece): number {
    if (piece.accentColor) return piece.rotation % 360;
    if (piece.kind === 'circle' || piece.kind === 'square' || piece.kind === 'diamond') {
      return piece.rotation % 90;
    }
    if (piece.kind === 'rectangle') return piece.rotation % 180;
    return piece.rotation % 360;
  }

  private visibleCompositionsMatch(actual: ShapePiece[], expected: ShapePiece[]): boolean {
    const resolution = 84;
    for (let row = 0; row < resolution; row++) {
      for (let column = 0; column < resolution; column++) {
        const x = (column + 0.5) / resolution - 0.5;
        const y = (row + 0.5) / resolution - 0.5;
        if (this.visibleColorAt(actual, x, y) !== this.visibleColorAt(expected, x, y)) return false;
      }
    }
    return true;
  }

  private visibleColorAt(pieces: ShapePiece[], boardX: number, boardY: number): string | null {
    let visibleColor: string | null = null;
    for (const piece of pieces) {
      const color = this.pieceColorAt(piece, boardX, boardY);
      if (color) visibleColor = color;
    }
    return visibleColor;
  }

  private pieceColorAt(piece: ShapePiece, boardX: number, boardY: number): string | null {
    const cardScale = piece.width / 100;
    const x = boardX / cardScale;
    const y = boardY / cardScale;
    const angle = (-piece.rotation * Math.PI) / 180;
    const localX = Math.cos(angle) * x - Math.sin(angle) * y;
    const localY = Math.sin(angle) * x + Math.cos(angle) * y;
    if (Math.abs(localX) > 0.5 || Math.abs(localY) > 0.5) return null;

    let color = piece.backgroundColor ?? null;
    if (
      piece.accentColor &&
      localX >= 0.06 &&
      localY >= 0.06 &&
      (localX - 0.06) / 0.44 + (localY - 0.06) / 0.44 >= 1
    ) {
      color = piece.accentColor;
    }
    if (this.isInsidePrimaryShape(piece.kind, localX, localY)) color = piece.color;
    return color;
  }

  private isInsidePrimaryShape(kind: ShapeKind, x: number, y: number): boolean {
    switch (kind) {
      case 'circle':
        return x * x + y * y <= 0.34 * 0.34;
      case 'square':
        return Math.abs(x) <= 0.34 && Math.abs(y) <= 0.34;
      case 'rectangle': {
        const halfWidth = 0.41;
        const halfHeight = 0.18;
        const centerWidth = halfWidth - halfHeight;
        if (Math.abs(x) <= centerWidth && Math.abs(y) <= halfHeight) return true;
        const circleX = x < 0 ? -centerWidth : centerWidth;
        return (x - circleX) ** 2 + y ** 2 <= halfHeight ** 2;
      }
      case 'triangle':
        return y >= -0.42 && y <= 0.42 && Math.abs(x) <= (y + 0.42) / 2;
      case 'diamond':
        return Math.abs(x) + Math.abs(y) <= 0.34;
    }
  }
}
