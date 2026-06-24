import { Component, HostListener, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type TangramPiece = {
  id: string;
  name: string;
  color: string;
  points: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
};

type PlacedPiece = {
  pieceId: string;
  x: number;
  y: number;
  rotation: number;
};

type DragState = {
  pieceId: string;
  pointerX: number;
  pointerY: number;
  offsetX: number;
  offsetY: number;
  startedOnBoard: boolean;
};

type PieceRotationMap = Record<string, number>;

type Point = {
  x: number;
  y: number;
};

type SnapCandidate = Point & {
  distance: number;
};

type ScoredSilhouette = {
  placements: PlacedPiece[];
  score: number;
};

type Edge = {
  start: Point;
  end: Point;
};

@Component({
  selector: 'app-tangram-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './tangram.page.html',
  styleUrl: './tangram.page.scss',
})
export class TangramPage {
  private readonly gridDivisions = 50;
  private readonly gridStep = 100 / this.gridDivisions;
  private readonly magneticSnapDistance = 3;
  private readonly longTangramUnit = 20 * Math.SQRT2;
  private readonly shortTangramUnit = 10 * Math.SQRT2;

  protected readonly pieces: TangramPiece[] = [
    {
      id: 'large-blue',
      name: 'Grand triangle bleu',
      color: '#4f8cff',
      points: '0,0 100,0 0,100',
      width: this.longTangramUnit,
      height: this.longTangramUnit,
      anchorX: 0,
      anchorY: 0,
    },
    {
      id: 'large-coral',
      name: 'Grand triangle corail',
      color: '#ff725e',
      points: '0,0 100,0 0,100',
      width: this.longTangramUnit,
      height: this.longTangramUnit,
      anchorX: 0,
      anchorY: 0,
    },
    {
      id: 'medium-yellow',
      name: 'Triangle moyen jaune',
      color: '#f7c948',
      points: '0,0 100,0 0,100',
      width: 20,
      height: 20,
      anchorX: 0,
      anchorY: 0,
    },
    {
      id: 'small-green',
      name: 'Petit triangle vert',
      color: '#58c58b',
      points: '0,0 100,0 0,100',
      width: this.shortTangramUnit,
      height: this.shortTangramUnit,
      anchorX: 0,
      anchorY: 0,
    },
    {
      id: 'small-purple',
      name: 'Petit triangle violet',
      color: '#aa7ee8',
      points: '0,0 100,0 0,100',
      width: this.shortTangramUnit,
      height: this.shortTangramUnit,
      anchorX: 0,
      anchorY: 0,
    },
    {
      id: 'square-pink',
      name: 'Carré rose',
      color: '#ef83b5',
      points: '0,0 100,0 100,100 0,100',
      width: this.shortTangramUnit,
      height: this.shortTangramUnit,
      anchorX: 0,
      anchorY: 0,
    },
    {
      id: 'parallelogram-orange',
      name: 'Parallélogramme orange',
      color: '#f49a45',
      points: '50,0 100,0 50,100 0,100',
      width: this.longTangramUnit,
      height: this.shortTangramUnit,
      anchorX: 50,
      anchorY: 0,
    },
  ];

  protected readonly placedPieces = signal<PlacedPiece[]>([]);
  protected readonly targetPieces = signal<PlacedPiece[]>([]);
  protected readonly selectedPieceId = signal<string | null>(null);
  protected readonly lastSelectedPieceId = signal<string | null>(null);
  protected readonly dragState = signal<DragState | null>(null);
  protected readonly pieceRotations = signal<PieceRotationMap>(
    Object.fromEntries(this.pieces.map((piece) => [piece.id, 0])),
  );

  protected readonly unplacedPieces = computed(() => {
    const placedIds = new Set(this.placedPieces().map((piece) => piece.pieceId));
    return this.pieces.filter((piece) => !placedIds.has(piece.id));
  });

  protected readonly selectedPiece = computed(() => {
    const id = this.selectedPieceId();
    return id ? this.pieces.find((piece) => piece.id === id) ?? null : null;
  });

  protected readonly needsHint = computed(() =>
    this.targetPieces().some(
      (targetPiece) => !this.placedPieceCoveringTarget(targetPiece),
    ),
  );

  protected readonly isSolved = computed(
    () =>
      this.placedPieces().length === this.targetPieces().length &&
      this.matchesTargetSilhouette(),
  );

  constructor() {
    this.newPuzzle();
  }

  @HostListener('document:pointermove', ['$event'])
  protected movePiece(event: PointerEvent): void {
    const drag = this.dragState();
    if (!drag) {
      return;
    }

    event.preventDefault();
    this.dragState.set({
      ...drag,
      pointerX: event.clientX,
      pointerY: event.clientY,
    });
  }

  @HostListener('document:pointerup', ['$event'])
  protected dropPiece(event: PointerEvent): void {
    const drag = this.dragState();
    if (!drag) {
      return;
    }

    event.preventDefault();
    const board = document.querySelector<HTMLElement>('.tangram-board');

    let droppedOnBoard = false;

    if (board) {
      const bounds = board.getBoundingClientRect();
      const x = ((event.clientX - bounds.left - drag.offsetX) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top - drag.offsetY) / bounds.height) * 100;

      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        this.placePiece(drag.pieceId, x, y);
        droppedOnBoard = true;
      }
    }

    if (!droppedOnBoard && drag.startedOnBoard) {
      this.returnPieceToTray(drag.pieceId);
    }

    this.dragState.set(null);
  }

  @HostListener('document:pointercancel')
  protected cancelDrag(): void {
    this.dragState.set(null);
  }

  @HostListener('document:contextmenu', ['$event'])
  protected rotateWithRightClick(event: MouseEvent): void {
    if (!this.lastSelectedPieceId()) {
      return;
    }

    event.preventDefault();
    this.rotateSelectedPiece();
  }

  protected startTrayDrag(pieceId: string, event: PointerEvent): void {
    event.preventDefault();
    this.capturePointer(event);
    const piece = this.getDefinition(pieceId);
    const board = document.querySelector<HTMLElement>('.tangram-board');
    const boardSize = board?.getBoundingClientRect().width ?? 0;
    const trayOffset = this.rotatedCenterOffset(
      piece,
      this.pieceRotation(pieceId),
      boardSize,
    );

    this.selectedPieceId.set(pieceId);
    this.lastSelectedPieceId.set(pieceId);
    this.dragState.set({
      pieceId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: trayOffset.x,
      offsetY: trayOffset.y,
      startedOnBoard: false,
    });
  }

  protected startBoardDrag(placedPiece: PlacedPiece, event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.capturePointer(event);

    const board = document.querySelector<HTMLElement>('.tangram-board');
    if (!board) {
      return;
    }

    const bounds = board.getBoundingClientRect();
    const anchorX = bounds.left + (placedPiece.x / 100) * bounds.width;
    const anchorY = bounds.top + (placedPiece.y / 100) * bounds.height;

    this.selectedPieceId.set(placedPiece.pieceId);
    this.lastSelectedPieceId.set(placedPiece.pieceId);
    this.dragState.set({
      pieceId: placedPiece.pieceId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: event.clientX - anchorX,
      offsetY: event.clientY - anchorY,
      startedOnBoard: true,
    });
  }

  protected selectPlacedPiece(pieceId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedPieceId.set(pieceId);
    this.lastSelectedPieceId.set(pieceId);
  }

  protected clearSelection(): void {
    if (!this.dragState()) {
      this.selectedPieceId.set(null);
    }
  }

  protected rotateSelectedPiece(): void {
    const pieceId = this.lastSelectedPieceId();
    if (!pieceId) {
      return;
    }

    const nextRotation = (this.pieceRotation(pieceId) + 45) % 360;

    this.pieceRotations.update((rotations) => ({
      ...rotations,
      [pieceId]: nextRotation,
    }));

    this.placedPieces.update((pieces) =>
      pieces.map((piece) =>
        piece.pieceId === pieceId
          ? this.snapRotatedPieceToTarget(
              { ...piece, rotation: nextRotation },
              nextRotation,
            )
          : piece,
      ),
    );
  }

  protected resetBoard(): void {
    this.placedPieces.set([]);
    this.selectedPieceId.set(null);
    this.lastSelectedPieceId.set(null);
    this.dragState.set(null);
    this.pieceRotations.set(
      Object.fromEntries(this.pieces.map((piece) => [piece.id, 0])),
    );
  }

  protected newPuzzle(): void {
    this.targetPieces.set(this.generateSilhouette());
    this.resetBoard();
  }

  protected placeHintPiece(): void {
    const hintPiece = this.targetPieces().find(
      (targetPiece) => !this.placedPieceCoveringTarget(targetPiece),
    );

    if (!hintPiece) {
      return;
    }

    const compatiblePiece =
      this.pieces.find(
        (piece) =>
          this.samePieceShape(piece, this.getDefinition(hintPiece.pieceId)) &&
          !this.placedPieces().some(
            (placedPiece) => placedPiece.pieceId === piece.id,
          ),
      ) ??
      this.pieces.find((piece) =>
        this.samePieceShape(piece, this.getDefinition(hintPiece.pieceId)),
      );

    if (!compatiblePiece) {
      return;
    }

    const placedHint = {
      ...hintPiece,
      pieceId: compatiblePiece.id,
    };

    this.placedPieces.update((pieces) => [
      ...pieces.filter((piece) => piece.pieceId !== compatiblePiece.id),
      placedHint,
    ]);
    this.pieceRotations.update((rotations) => ({
      ...rotations,
      [compatiblePiece.id]: hintPiece.rotation,
    }));
    this.selectedPieceId.set(compatiblePiece.id);
    this.lastSelectedPieceId.set(compatiblePiece.id);
  }

  protected getDefinition(pieceId: string): TangramPiece {
    return this.pieces.find((piece) => piece.id === pieceId)!;
  }

  protected pieceStyle(placedPiece: PlacedPiece): Record<string, string> {
    const piece = this.getDefinition(placedPiece.pieceId);
    return {
      left: `${placedPiece.x}%`,
      top: `${placedPiece.y}%`,
      width: `${piece.width}%`,
      aspectRatio: `${piece.width} / ${piece.height}`,
      transform: this.pieceTransform(piece, placedPiece.rotation),
    };
  }

  protected dragPreviewStyle(drag: DragState): Record<string, string> {
    const piece = this.getDefinition(drag.pieceId);
    const scale = 3.2;
    return {
      left: `${drag.pointerX - drag.offsetX}px`,
      top: `${drag.pointerY - drag.offsetY}px`,
      width: `${piece.width * scale}px`,
      aspectRatio: `${piece.width} / ${piece.height}`,
      transform: this.pieceTransform(piece, this.pieceRotation(piece.id)),
    };
  }

  protected trayPreviewStyle(piece: TangramPiece): Record<string, string> {
    return {
      width: `${Math.max(2.4, piece.width / 7)}rem`,
      aspectRatio: `${piece.width} / ${piece.height}`,
      transform: `rotate(${this.pieceRotation(piece.id)}deg)`,
    };
  }

  protected pieceRotation(pieceId: string): number {
    return this.pieceRotations()[pieceId] ?? 0;
  }

  protected silhouettePoints(placedPiece: PlacedPiece): string {
    return this.transformedVertices(
      this.getDefinition(placedPiece.pieceId),
      placedPiece.x,
      placedPiece.y,
      placedPiece.rotation,
    )
      .map((point) => `${point.x},${point.y}`)
      .join(' ');
  }

  private placePiece(pieceId: string, x: number, y: number): void {
    const rotation = this.pieceRotation(pieceId);
    const position = this.getSnappedPosition(pieceId, x, y, rotation);
    const nextPiece: PlacedPiece = {
      pieceId,
      x: position.x,
      y: position.y,
      rotation,
    };

    this.placedPieces.update((pieces) => [
      ...pieces.filter((piece) => piece.pieceId !== pieceId),
      nextPiece,
    ]);
    this.selectedPieceId.set(pieceId);
    this.lastSelectedPieceId.set(pieceId);
  }

  private getSnappedPosition(
    pieceId: string,
    x: number,
    y: number,
    rotation: number,
  ): Point {
    const targetPosition = this.targetSnapPosition(pieceId, x, y, rotation);

    if (targetPosition) {
      return targetPosition;
    }

    const piece = this.getDefinition(pieceId);
    const movingVertices = this.transformedVertices(piece, x, y, rotation);
    const otherPieces = this.placedPieces().filter(
      (placedPiece) => placedPiece.pieceId !== pieceId,
    );
    const snapCandidates: SnapCandidate[] = [];

    for (const targetPiece of otherPieces) {
      const targetVertices = this.transformedVertices(
        this.getDefinition(targetPiece.pieceId),
        targetPiece.x,
        targetPiece.y,
        targetPiece.rotation,
      );

      for (const movingVertex of movingVertices) {
        for (const targetVertex of targetVertices) {
          const offset = {
            x: targetVertex.x - movingVertex.x,
            y: targetVertex.y - movingVertex.y,
          };
          const distance = Math.hypot(offset.x, offset.y);

          if (distance <= this.magneticSnapDistance) {
            snapCandidates.push({
              x: this.clampToBoard(x + offset.x),
              y: this.clampToBoard(y + offset.y),
              distance,
            });
          }
        }
      }
    }

    snapCandidates.sort((first, second) => first.distance - second.distance);

    for (const candidate of snapCandidates) {
      if (!this.overlapsPlacedPiece(pieceId, candidate.x, candidate.y, rotation)) {
        return candidate;
      }
    }

    return {
      x: this.snapToGrid(x),
      y: this.snapToGrid(y),
    };
  }

  private targetSnapPosition(
    pieceId: string,
    x: number,
    y: number,
    rotation: number,
  ): Point | null {
    const piece = this.getDefinition(pieceId);
    const snapDistance = this.targetSnapDistance(piece);
    const movingVertices = this.transformedVertices(piece, x, y, rotation);
    const movingCenter = this.polygonCenter(movingVertices);
    const targetCenters = this.targetPieces()
      .filter(
        (targetPiece) =>
          !this.targetCenterOccupiedByAnotherPiece(targetPiece, pieceId),
      )
      .map((targetPiece) =>
        this.polygonCenter(
          this.transformedVertices(
            this.getDefinition(targetPiece.pieceId),
            targetPiece.x,
            targetPiece.y,
            targetPiece.rotation,
          ),
        ),
      )
      .sort(
        (first, second) =>
          Math.hypot(first.x - movingCenter.x, first.y - movingCenter.y) -
          Math.hypot(second.x - movingCenter.x, second.y - movingCenter.y),
      );
    const closestCenter = targetCenters[0];

    if (
      closestCenter &&
      Math.hypot(
        closestCenter.x - movingCenter.x,
        closestCenter.y - movingCenter.y,
      ) <= snapDistance
    ) {
      return {
        x: this.clampToBoard(x + closestCenter.x - movingCenter.x),
        y: this.clampToBoard(y + closestCenter.y - movingCenter.y),
      };
    }

    return this.snapAnyPieceToSilhouette(
      movingVertices,
      x,
      y,
      snapDistance,
    );
  }

  private snapAnyPieceToSilhouette(
    movingVertices: Point[],
    x: number,
    y: number,
    snapDistance: number,
  ): Point | null {
    const silhouetteVertices = this.uniquePoints(
      this.exposedEdges(this.targetPieces()).flatMap((edge) => [
        edge.start,
        edge.end,
      ]),
    );
    let closestOffset: Point | null = null;
    let closestDistance = snapDistance;

    for (const movingVertex of movingVertices) {
      for (const targetVertex of silhouetteVertices) {
        const offset = {
          x: targetVertex.x - movingVertex.x,
          y: targetVertex.y - movingVertex.y,
        };
        const distance = Math.hypot(offset.x, offset.y);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestOffset = offset;
        }
      }
    }

    return closestOffset
      ? {
          x: this.clampToBoard(x + closestOffset.x),
          y: this.clampToBoard(y + closestOffset.y),
        }
      : null;
  }

  private targetSnapDistance(piece: TangramPiece): number {
    return Math.max(10, Math.min(piece.width, piece.height) * 0.7);
  }

  private polygonCenter(polygon: Point[]): Point {
    return {
      x: polygon.reduce((total, point) => total + point.x, 0) / polygon.length,
      y: polygon.reduce((total, point) => total + point.y, 0) / polygon.length,
    };
  }

  private uniquePoints(points: Point[]): Point[] {
    return points.filter(
      (point, index) =>
        !points.some(
          (candidate, candidateIndex) =>
            candidateIndex < index && this.samePoint(point, candidate),
        ),
    );
  }

  private snapRotatedPieceToTarget(
    piece: PlacedPiece,
    rotation: number,
  ): PlacedPiece {
    const targetPosition = this.targetSnapPosition(
      piece.pieceId,
      piece.x,
      piece.y,
      rotation,
    );

    return targetPosition
      ? { ...piece, x: targetPosition.x, y: targetPosition.y }
      : piece;
  }

  private transformedVertices(
    piece: TangramPiece,
    anchorX: number,
    anchorY: number,
    rotation: number,
  ): Point[] {
    const radians = (rotation * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);

    return this.polygonVertices(piece).map((vertex) => {
      const localX = ((vertex.x - piece.anchorX) / 100) * piece.width;
      const localY = ((vertex.y - piece.anchorY) / 100) * piece.height;

      return {
        x: anchorX + localX * cosine - localY * sine,
        y: anchorY + localX * sine + localY * cosine,
      };
    });
  }

  private polygonVertices(piece: TangramPiece): Point[] {
    return piece.points.split(' ').map((point) => {
      const [x, y] = point.split(',').map(Number);
      return { x, y };
    });
  }

  private overlapsPlacedPiece(
    pieceId: string,
    x: number,
    y: number,
    rotation: number,
  ): boolean {
    const movingPolygon = this.transformedVertices(
      this.getDefinition(pieceId),
      x,
      y,
      rotation,
    );

    return this.placedPieces().some((placedPiece) => {
      if (placedPiece.pieceId === pieceId) {
        return false;
      }

      const placedPolygon = this.transformedVertices(
        this.getDefinition(placedPiece.pieceId),
        placedPiece.x,
        placedPiece.y,
        placedPiece.rotation,
      );

      return this.polygonsOverlap(movingPolygon, placedPolygon);
    });
  }

  private polygonsOverlap(first: Point[], second: Point[]): boolean {
    const axes = [...this.polygonAxes(first), ...this.polygonAxes(second)];
    const overlapTolerance = 0.01;

    return axes.every((axis) => {
      const firstProjection = this.projectPolygon(first, axis);
      const secondProjection = this.projectPolygon(second, axis);
      const overlap =
        Math.min(firstProjection.max, secondProjection.max) -
        Math.max(firstProjection.min, secondProjection.min);

      return overlap > overlapTolerance;
    });
  }

  private polygonAxes(polygon: Point[]): Point[] {
    return polygon.map((point, index) => {
      const nextPoint = polygon[(index + 1) % polygon.length];
      const edge = {
        x: nextPoint.x - point.x,
        y: nextPoint.y - point.y,
      };
      const length = Math.hypot(edge.x, edge.y);

      return {
        x: -edge.y / length,
        y: edge.x / length,
      };
    });
  }

  private projectPolygon(
    polygon: Point[],
    axis: Point,
  ): { min: number; max: number } {
    const projections = polygon.map((point) => point.x * axis.x + point.y * axis.y);

    return {
      min: Math.min(...projections),
      max: Math.max(...projections),
    };
  }

  private generateSilhouette(): PlacedPiece[] {
    const candidates: ScoredSilhouette[] = [];

    for (let attempt = 0; attempt < 180; attempt += 1) {
      const firstPiece = this.randomItem(this.pieces);
      const firstPlacement: PlacedPiece = {
        pieceId: firstPiece.id,
        x: 0,
        y: 0,
        rotation: this.randomItem(this.rotations()),
      };
      const remainingPieces = this.shuffle(
        this.pieces.filter((piece) => piece.id !== firstPiece.id),
      );
      const generated = this.buildSilhouette([firstPlacement], remainingPieces);

      if (!generated) {
        continue;
      }

      const centered = this.centerSilhouette(generated);
      if (centered) {
        candidates.push({
          placements: centered,
          score: this.silhouetteDifficulty(centered),
        });
      }
    }

    if (candidates.length > 0) {
      candidates.sort((first, second) => second.score - first.score);
      const hardCandidates = candidates.slice(
        0,
        Math.max(1, Math.ceil(candidates.length * 0.12)),
      );
      return this.randomItem(hardCandidates).placements;
    }

    return this.centerSilhouette(this.fallbackSilhouette()) ?? [];
  }

  private silhouetteDifficulty(placements: PlacedPiece[]): number {
    const polygons = placements.map((placement) =>
      this.transformedVertices(
        this.getDefinition(placement.pieceId),
        placement.x,
        placement.y,
        placement.rotation,
      ),
    );
    const vertices = polygons.flat();
    const hull = this.convexHull(vertices);
    const pieceArea = polygons.reduce(
      (total, polygon) => total + this.polygonArea(polygon),
      0,
    );
    const hullArea = this.polygonArea(hull);
    const concavity = Math.max(0, hullArea - pieceArea);
    const exposedEdgeCount = this.exposedEdges(placements).length;
    const rotationVariety = new Set(
      placements.map((placement) => placement.rotation),
    ).size;

    return concavity * 4 + exposedEdgeCount * 1.5 + rotationVariety;
  }

  private convexHull(points: Point[]): Point[] {
    const sorted = [...points].sort(
      (first, second) => first.x - second.x || first.y - second.y,
    );

    if (sorted.length <= 2) {
      return sorted;
    }

    const cross = (origin: Point, first: Point, second: Point): number =>
      (first.x - origin.x) * (second.y - origin.y) -
      (first.y - origin.y) * (second.x - origin.x);
    const lower: Point[] = [];
    const upper: Point[] = [];

    for (const point of sorted) {
      while (
        lower.length >= 2 &&
        cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
      ) {
        lower.pop();
      }
      lower.push(point);
    }

    for (const point of [...sorted].reverse()) {
      while (
        upper.length >= 2 &&
        cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
      ) {
        upper.pop();
      }
      upper.push(point);
    }

    lower.pop();
    upper.pop();
    return [...lower, ...upper];
  }

  private polygonArea(polygon: Point[]): number {
    if (polygon.length < 3) {
      return 0;
    }

    const doubledArea = polygon.reduce((total, point, index) => {
      const nextPoint = polygon[(index + 1) % polygon.length];
      return total + point.x * nextPoint.y - nextPoint.x * point.y;
    }, 0);

    return Math.abs(doubledArea) / 2;
  }

  private buildSilhouette(
    placed: PlacedPiece[],
    remaining: TangramPiece[],
  ): PlacedPiece[] | null {
    if (remaining.length === 0) {
      return placed;
    }

    const exposedEdges = this.shuffle(this.exposedEdges(placed));
    const pieces = this.shuffle(remaining);

    for (const piece of pieces) {
      const otherPieces = remaining.filter((candidate) => candidate.id !== piece.id);

      for (const rotation of this.shuffle(this.rotations())) {
        const movingVertices = this.transformedVertices(piece, 0, 0, rotation);
        const movingEdges = this.shuffle(this.edgesOf(movingVertices));

        for (const targetEdge of exposedEdges) {
          for (const movingEdge of movingEdges) {
            if (!this.sameLength(targetEdge, movingEdge)) {
              continue;
            }

            const movingVector = {
              x: movingEdge.end.x - movingEdge.start.x,
              y: movingEdge.end.y - movingEdge.start.y,
            };
            const targetVector = {
              x: targetEdge.start.x - targetEdge.end.x,
              y: targetEdge.start.y - targetEdge.end.y,
            };

            if (!this.samePoint(movingVector, targetVector)) {
              continue;
            }

            const candidate: PlacedPiece = {
              pieceId: piece.id,
              x: targetEdge.end.x - movingEdge.start.x,
              y: targetEdge.end.y - movingEdge.start.y,
              rotation,
            };

            if (!this.validSilhouettePlacement(candidate, placed, targetEdge)) {
              continue;
            }

            const result = this.buildSilhouette(
              [...placed, candidate],
              otherPieces,
            );

            if (result) {
              return result;
            }
          }
        }
      }
    }

    return null;
  }

  private validSilhouettePlacement(
    candidate: PlacedPiece,
    placed: PlacedPiece[],
    joinedEdge: Edge,
  ): boolean {
    const candidatePolygon = this.transformedVertices(
      this.getDefinition(candidate.pieceId),
      candidate.x,
      candidate.y,
      candidate.rotation,
    );

    for (const placedPiece of placed) {
      const placedPolygon = this.transformedVertices(
        this.getDefinition(placedPiece.pieceId),
        placedPiece.x,
        placedPiece.y,
        placedPiece.rotation,
      );

      if (this.polygonsOverlap(candidatePolygon, placedPolygon)) {
        return false;
      }
    }

    const candidateEdges = this.edgesOf(candidatePolygon);
    const placedEdges = placed.flatMap((placedPiece) =>
      this.edgesOf(
        this.transformedVertices(
          this.getDefinition(placedPiece.pieceId),
          placedPiece.x,
          placedPiece.y,
          placedPiece.rotation,
        ),
      ),
    );

    let sharedFullEdges = 0;

    for (const candidateEdge of candidateEdges) {
      for (const placedEdge of placedEdges) {
        if (this.sameEdge(candidateEdge, placedEdge)) {
          sharedFullEdges += 1;
        } else if (this.edgesOverlapInLength(candidateEdge, placedEdge)) {
          return false;
        }
      }
    }

    return (
      sharedFullEdges === 1 &&
      placedEdges.some((edge) => this.sameEdge(edge, joinedEdge))
    );
  }

  private exposedEdges(placed: PlacedPiece[]): Edge[] {
    const edges = placed.flatMap((placedPiece) =>
      this.edgesOf(
        this.transformedVertices(
          this.getDefinition(placedPiece.pieceId),
          placedPiece.x,
          placedPiece.y,
          placedPiece.rotation,
        ),
      ),
    );

    return edges.filter(
      (edge, index) =>
        !edges.some(
          (candidate, candidateIndex) =>
            candidateIndex !== index && this.sameEdge(edge, candidate),
        ),
    );
  }

  private edgesOf(polygon: Point[]): Edge[] {
    return polygon.map((point, index) => ({
      start: point,
      end: polygon[(index + 1) % polygon.length],
    }));
  }

  private sameEdge(first: Edge, second: Edge): boolean {
    return (
      (this.samePoint(first.start, second.start) &&
        this.samePoint(first.end, second.end)) ||
      (this.samePoint(first.start, second.end) &&
        this.samePoint(first.end, second.start))
    );
  }

  private sameLength(first: Edge, second: Edge): boolean {
    return Math.abs(this.edgeLength(first) - this.edgeLength(second)) < 0.02;
  }

  private edgeLength(edge: Edge): number {
    return Math.hypot(edge.end.x - edge.start.x, edge.end.y - edge.start.y);
  }

  private edgesOverlapInLength(first: Edge, second: Edge): boolean {
    const firstVector = {
      x: first.end.x - first.start.x,
      y: first.end.y - first.start.y,
    };
    const secondVector = {
      x: second.end.x - second.start.x,
      y: second.end.y - second.start.y,
    };
    const cross =
      firstVector.x * secondVector.y - firstVector.y * secondVector.x;
    const offset = {
      x: second.start.x - first.start.x,
      y: second.start.y - first.start.y,
    };
    const offsetCross = firstVector.x * offset.y - firstVector.y * offset.x;

    if (Math.abs(cross) > 0.02 || Math.abs(offsetCross) > 0.02) {
      return false;
    }

    const lengthSquared =
      firstVector.x * firstVector.x + firstVector.y * firstVector.y;
    const start =
      (offset.x * firstVector.x + offset.y * firstVector.y) / lengthSquared;
    const endOffset = {
      x: second.end.x - first.start.x,
      y: second.end.y - first.start.y,
    };
    const end =
      (endOffset.x * firstVector.x + endOffset.y * firstVector.y) /
      lengthSquared;
    const overlap =
      Math.min(1, Math.max(start, end)) - Math.max(0, Math.min(start, end));

    return overlap > 0.001;
  }

  private centerSilhouette(placements: PlacedPiece[]): PlacedPiece[] | null {
    const vertices = placements.flatMap((placement) =>
      this.transformedVertices(
        this.getDefinition(placement.pieceId),
        placement.x,
        placement.y,
        placement.rotation,
      ),
    );
    const minX = Math.min(...vertices.map((point) => point.x));
    const maxX = Math.max(...vertices.map((point) => point.x));
    const minY = Math.min(...vertices.map((point) => point.y));
    const maxY = Math.max(...vertices.map((point) => point.y));
    const width = maxX - minX;
    const height = maxY - minY;

    if (width > 86 || height > 86) {
      return null;
    }

    const offsetX = 50 - (minX + maxX) / 2;
    const offsetY = 50 - (minY + maxY) / 2;

    return placements.map((placement) => ({
      ...placement,
      x: placement.x + offsetX,
      y: placement.y + offsetY,
    }));
  }

  private fallbackSilhouette(): PlacedPiece[] {
    return [
      { pieceId: 'large-blue', x: 55, y: 65, rotation: 315 },
      { pieceId: 'large-coral', x: 55, y: 65, rotation: 45 },
      { pieceId: 'medium-yellow', x: 55, y: 45, rotation: 0 },
      { pieceId: 'small-purple', x: 45, y: 55, rotation: 315 },
      { pieceId: 'square-pink', x: 55, y: 45, rotation: 135 },
      { pieceId: 'small-green', x: 35, y: 45, rotation: 45 },
      { pieceId: 'parallelogram-orange', x: 45, y: 35, rotation: 135 },
    ];
  }

  private rotations(): number[] {
    return [0, 45, 90, 135, 180, 225, 270, 315];
  }

  private shuffle<T>(values: T[]): T[] {
    const shuffled = [...values];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [
        shuffled[swapIndex],
        shuffled[index],
      ];
    }

    return shuffled;
  }

  private randomItem<T>(values: T[]): T {
    return values[Math.floor(Math.random() * values.length)];
  }

  private samePoint(first: Point, second: Point): boolean {
    return Math.hypot(first.x - second.x, first.y - second.y) < 0.02;
  }

  private samePlacement(first: PlacedPiece, second: PlacedPiece): boolean {
    return (
      this.samePieceShape(
        this.getDefinition(first.pieceId),
        this.getDefinition(second.pieceId),
      ) &&
      Math.hypot(first.x - second.x, first.y - second.y) < 0.02 &&
      this.normalizedRotation(first.rotation) ===
        this.normalizedRotation(second.rotation)
    );
  }

  private matchesTargetSilhouette(): boolean {
    const placedPolygons = this.placedPieces().map((piece) =>
      this.transformedVertices(
        this.getDefinition(piece.pieceId),
        piece.x,
        piece.y,
        piece.rotation,
      ),
    );
    const targetPolygons = this.targetPieces().map((piece) =>
      this.transformedVertices(
        this.getDefinition(piece.pieceId),
        piece.x,
        piece.y,
        piece.rotation,
      ),
    );
    const sampleStep = 0.4;
    let mismatchCount = 0;
    let targetSampleCount = 0;

    for (let y = sampleStep / 2; y < 100; y += sampleStep) {
      for (let x = sampleStep / 2; x < 100; x += sampleStep) {
        const point = { x, y };
        const placedFilled = placedPolygons.some((polygon) =>
          this.pointInsidePolygon(point, polygon),
        );
        const targetFilled = targetPolygons.some((polygon) =>
          this.pointInsidePolygon(point, polygon),
        );

        if (targetFilled) {
          targetSampleCount += 1;
        }

        if (placedFilled !== targetFilled) {
          mismatchCount += 1;
        }
      }
    }

    const allowedMismatches = Math.max(
      24,
      Math.ceil(targetSampleCount * 0.015),
    );

    return mismatchCount <= allowedMismatches;
  }

  private pointInsidePolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;

    for (
      let current = 0, previous = polygon.length - 1;
      current < polygon.length;
      previous = current, current += 1
    ) {
      const currentPoint = polygon[current];
      const previousPoint = polygon[previous];
      const crossesHorizontalRay =
        currentPoint.y > point.y !== previousPoint.y > point.y;
      const intersectionX =
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
        currentPoint.x;

      if (crossesHorizontalRay && point.x < intersectionX) {
        inside = !inside;
      }
    }

    return inside;
  }

  private normalizedRotation(rotation: number): number {
    return ((rotation % 360) + 360) % 360;
  }

  private placedPieceCoveringTarget(
    targetPiece: PlacedPiece,
  ): PlacedPiece | undefined {
    return this.placedPieces().find((placedPiece) =>
      this.samePlacement(placedPiece, targetPiece),
    );
  }

  private targetCenterOccupiedByAnotherPiece(
    targetPiece: PlacedPiece,
    movingPieceId: string,
  ): boolean {
    const targetCenter = this.polygonCenter(
      this.transformedVertices(
        this.getDefinition(targetPiece.pieceId),
        targetPiece.x,
        targetPiece.y,
        targetPiece.rotation,
      ),
    );

    return this.placedPieces().some(
      (placedPiece) => {
        if (placedPiece.pieceId === movingPieceId) {
          return false;
        }

        const placedCenter = this.polygonCenter(
          this.transformedVertices(
            this.getDefinition(placedPiece.pieceId),
            placedPiece.x,
            placedPiece.y,
            placedPiece.rotation,
          ),
        );

        return this.samePoint(placedCenter, targetCenter);
      },
    );
  }

  private samePieceShape(first: TangramPiece, second: TangramPiece): boolean {
    return (
      first.points === second.points &&
      Math.abs(first.width - second.width) < 0.02 &&
      Math.abs(first.height - second.height) < 0.02
    );
  }

  private snapToGrid(value: number): number {
    const clampedValue = this.clampToBoard(value);
    return Math.round(clampedValue / this.gridStep) * this.gridStep;
  }

  private clampToBoard(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  private pieceTransform(piece: TangramPiece, rotation: number): string {
    return `rotate(${rotation}deg) translate(-${piece.anchorX}%, -${piece.anchorY}%)`;
  }

  private rotatedCenterOffset(
    piece: TangramPiece,
    rotation: number,
    boardSize: number,
  ): { x: number; y: number } {
    const localX = boardSize * (piece.width / 100) * (0.5 - piece.anchorX / 100);
    const localY = boardSize * (piece.height / 100) * (0.5 - piece.anchorY / 100);
    const radians = (rotation * Math.PI) / 180;

    return {
      x: localX * Math.cos(radians) - localY * Math.sin(radians),
      y: localX * Math.sin(radians) + localY * Math.cos(radians),
    };
  }

  private returnPieceToTray(pieceId: string): void {
    this.placedPieces.update((pieces) =>
      pieces.filter((piece) => piece.pieceId !== pieceId),
    );
    this.selectedPieceId.set(pieceId);
    this.lastSelectedPieceId.set(pieceId);
  }

  private capturePointer(event: PointerEvent): void {
    const target = event.currentTarget;
    if (target instanceof HTMLElement) {
      target.setPointerCapture(event.pointerId);
    }
  }
}
