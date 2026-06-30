import { Component, HostListener, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type CubeFace = 'front' | 'right' | 'top';

type ShellPosition = {
  id: string;
  x: number;
  y: number;
  z: number;
  faces: CubeFace[];
};

type FaceFragmentDot = {
  cx: number;
  cy: number;
  r: number;
  fill: string;
};

type FaceFragment = {
  background: string;
  stroke: string;
  strokeWidth: number;
  paths: string[];
  ports: RoutePorts | null;
  dots: FaceFragmentDot[];
};

type CubePiece = ShellPosition & {
  name: string;
  fragments: Record<CubeFace, FaceFragment>;
};

type PlacedPiece = {
  pieceId: string;
  positionId: string;
  anchorFace: CubeFace;
  locked?: boolean;
};

type FaceCell = {
  face: CubeFace;
  positionId: string;
  row: number;
  col: number;
};

type DragPosition = {
  x: number;
  y: number;
};

type PlacementTarget = {
  positionId: string;
  face: CubeFace;
};

type RoutePort = 'L' | 'R' | 'T' | 'B';

type RoutePorts = [RoutePort] | [RoutePort, RoutePort];

type RoutePortMap = Partial<Record<CubeFace, Record<string, RoutePorts>>>;

type RouteNode = {
  face: CubeFace;
  row: number;
  col: number;
  id: string;
};

type RouteEdge = {
  to: string;
  fromPort: RoutePort;
  toPort: RoutePort;
};

type SvgPoint = {
  x: number;
  y: number;
};

@Component({
  selector: 'app-corner-cube-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './corner-cube.page.html',
  styleUrl: './corner-cube.page.scss',
})
export class CornerCubePage {
  private readonly size = 3;
  private suppressNextCellClick = false;

  protected readonly faceLabels: Record<CubeFace, string> = {
    front: 'Face avant',
    right: 'Face droite',
    top: 'Face du haut',
  };

  protected readonly faceHints: Record<CubeFace, string> = {
    front: 'jardin',
    right: 'carte',
    top: 'ciel',
  };

  protected readonly faces: CubeFace[] = ['front', 'right', 'top'];
  protected readonly positions = this.createShellPositions();
  protected readonly faceCells = this.createFaceCells();
  protected readonly routePorts = signal<RoutePortMap>(this.createRandomRoutePorts());
  protected readonly pieces = signal<CubePiece[]>(this.createPieces());

  protected readonly placedPieces = signal<PlacedPiece[]>([]);
  protected readonly selectedPieceId = signal<string | null>(null);
  protected readonly message = signal('Choisis une piece, puis touche une case du cube.');
  protected readonly dragPosition = signal<DragPosition | null>(null);
  protected readonly hoveredPositionId = signal<string | null>(null);
  protected readonly isDraggingPiece = signal(false);

  protected readonly unplacedPieces = computed(() => {
    const placedPieceIds = new Set(this.placedPieces().map((piece) => piece.pieceId));

    return this.pieces()
      .filter((piece) => !placedPieceIds.has(piece.id))
      .sort((first, second) => second.faces.length - first.faces.length);
  });

  protected readonly selectedPiece = computed(() => {
    const selectedPieceId = this.selectedPieceId();

    if (!selectedPieceId) {
      return null;
    }

    return this.getPieceById(selectedPieceId) ?? null;
  });

  protected readonly isSolved = computed(() => {
    if (this.placedPieces().length !== this.positions.length) {
      return false;
    }

    return this.isDisplayedRouteContinuous();
  });

  protected selectPiece(pieceId: string): void {
    this.selectedPieceId.set(pieceId);
    this.message.set('Place la piece sur n’importe quel emplacement du cube.');
  }

  protected startPieceDrag(pieceId: string, event: PointerEvent): void {
    event.preventDefault();

    const target = event.currentTarget;

    if (target instanceof Element && 'setPointerCapture' in target) {
      target.setPointerCapture(event.pointerId);
    }

    this.selectedPieceId.set(pieceId);
    this.dragPosition.set({
      x: event.clientX,
      y: event.clientY,
    });
    this.hoveredPositionId.set(null);
    this.isDraggingPiece.set(true);
    this.message.set('Glisse le morceau sur une case compatible du cube.');
  }

  protected startPlacedPieceDrag(cell: FaceCell, event: PointerEvent): void {
    const placedPiece = this.getPlacedPieceForPosition(cell.positionId);

    if (!placedPiece || placedPiece.locked || this.isSolved()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget;

    if (target instanceof Element && 'setPointerCapture' in target) {
      target.setPointerCapture(event.pointerId);
    }

    this.placedPieces.update((pieces) =>
      pieces.filter((piece) => piece.positionId !== cell.positionId),
    );
    this.selectedPieceId.set(placedPiece.pieceId);
    this.dragPosition.set({
      x: event.clientX,
      y: event.clientY,
    });
    this.hoveredPositionId.set(cell.positionId);
    this.isDraggingPiece.set(true);
    this.message.set('Déplace le morceau vers un autre emplacement du cube.');
  }

  @HostListener('document:pointermove', ['$event'])
  protected updateDraggedPiece(event: PointerEvent): void {
    if (!this.isDraggingPiece()) {
      return;
    }

    event.preventDefault();
    this.dragPosition.set({
      x: event.clientX,
      y: event.clientY,
    });
    this.hoveredPositionId.set(this.getPlacementTargetFromPoint(event.clientX, event.clientY)?.positionId ?? null);
  }

  @HostListener('document:pointerup', ['$event'])
  protected finishPieceDrag(event: PointerEvent): void {
    if (!this.isDraggingPiece()) {
      return;
    }

    event.preventDefault();
    this.isDraggingPiece.set(false);

    const target = this.getPlacementTargetFromPoint(event.clientX, event.clientY);

    if (!target) {
      this.dragPosition.set(null);
      this.hoveredPositionId.set(null);
      this.message.set('Morceau garde en main. Clique une case ou glisse-le sur le cube.');
      this.suppressNextCellClick = true;
      return;
    }

    this.placeSelectedPieceAtPosition(target.positionId, target.face);
    this.suppressNextCellClick = true;
  }

  @HostListener('document:pointercancel', ['$event'])
  protected cancelPieceDrag(event: PointerEvent): void {
    if (!this.isDraggingPiece()) {
      return;
    }

    event.preventDefault();
    this.isDraggingPiece.set(false);
    this.dragPosition.set(null);
    this.hoveredPositionId.set(null);
  }

  protected handleCellClick(cell: FaceCell): void {
    if (this.suppressNextCellClick) {
      this.suppressNextCellClick = false;
      return;
    }

    if (!this.selectedPiece()) {
      this.removePiece(cell.positionId);
      return;
    }

    this.placeSelectedPieceAtPosition(cell.positionId, cell.face);
  }

  protected removePiece(positionId: string): void {
    const placedPiece = this.getPlacedPieceForPosition(positionId);

    if (!placedPiece || placedPiece.locked || this.isSolved()) {
      return;
    }

    this.placedPieces.update((pieces) => pieces.filter((piece) => piece.positionId !== positionId));
    this.selectedPieceId.set(placedPiece.pieceId);
    this.message.set('Morceau repris. Essaie une autre position.');
  }

  protected placeHint(): void {
    if (this.isSolved()) {
      return;
    }

    const occupiedPositions = new Set(this.placedPieces().map((piece) => piece.positionId));
    const placedPieceIds = new Set(this.placedPieces().map((piece) => piece.pieceId));
    const hintPosition = this.positions.find(
      (position) => !occupiedPositions.has(position.id) && !placedPieceIds.has(position.id),
    );

    if (!hintPosition) {
      this.message.set('Retire un morceau mal place pour liberer le prochain indice.');
      return;
    }

    this.placedPieces.update((pieces) => [
      ...pieces,
      {
        pieceId: hintPosition.id,
        positionId: hintPosition.id,
        anchorFace: hintPosition.faces[0],
        locked: true,
      },
    ]);

    if (this.selectedPieceId() === hintPosition.id) {
      this.selectedPieceId.set(null);
    }

    this.message.set('Indice place: observe comment ce morceau touche ses faces.');
  }

  protected resetPuzzle(): void {
    this.placedPieces.set([]);
    this.selectedPieceId.set(null);
    this.dragPosition.set(null);
    this.hoveredPositionId.set(null);
    this.isDraggingPiece.set(false);
    this.message.set('Choisis une piece, puis touche une case du cube.');
  }

  protected newCube(): void {
    this.routePorts.set(this.createRandomRoutePorts());
    this.pieces.set(this.createPieces());
    this.resetPuzzle();
  }

  protected cellFragment(cell: FaceCell): FaceFragment | null {
    const placedPiece = this.getPlacedPieceForPosition(cell.positionId);

    if (!placedPiece) {
      return null;
    }

    const piece = this.getPieceById(placedPiece.pieceId);

    const sourceFace = piece ? this.getSourceFaceForDisplayedCell(piece, placedPiece, cell.face) : null;

    return sourceFace ? piece?.fragments[sourceFace] ?? null : null;
  }

  protected cellClasses(cell: FaceCell): string {
    const placedPiece = this.getPlacedPieceForPosition(cell.positionId);
    const classes = ['cube-cell', cell.face];

    if (placedPiece) {
      classes.push('filled');
    }

    if (placedPiece?.locked) {
      classes.push('locked');
    }

    if (placedPiece && placedPiece.pieceId === cell.positionId) {
      classes.push('correct');
    }

    if (this.selectedPiece()) {
      classes.push('candidate');
    }

    if (this.hoveredPositionId() === cell.positionId && this.selectedPiece()) {
      classes.push(placedPiece ? 'preview-invalid' : 'preview-valid');
    }

    return classes.join(' ');
  }

  protected pieceClasses(piece: CubePiece): string {
    const classes = ['piece-button'];

    if (this.selectedPieceId() === piece.id) {
      classes.push('selected');
    }

    return classes.join(' ');
  }

  protected getFaceCells(face: CubeFace): FaceCell[] {
    return this.faceCells.filter((cell) => cell.face === face);
  }

  protected getPlacedPieceForPosition(positionId: string): PlacedPiece | null {
    return this.placedPieces().find((piece) => piece.positionId === positionId) ?? null;
  }

  protected getFaceInitial(face: CubeFace): string {
    return this.faceLabels[face].replace('Face ', '').slice(0, 1).toUpperCase();
  }

  protected dragPreviewTransform(position: DragPosition): string {
    return `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`;
  }

  protected cellPolygonPoints(cell: FaceCell): string {
    return this.getCellCorners(cell)
      .map((point) => `${point.x},${point.y}`)
      .join(' ');
  }

  protected cellClipId(cell: FaceCell): string {
    return `cube-cell-${cell.face}-${cell.positionId}`;
  }

  protected cellFragmentTransform(cell: FaceCell): string {
    const corners = this.getCellCorners(cell);
    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const width = Math.max(...xs) - minX;
    const height = Math.max(...ys) - minY;

    return `translate(${minX} ${minY}) scale(${width / 100} ${height / 100})`;
  }

  protected cellFill(cell: FaceCell): string {
    const fills: Record<CubeFace, string> = {
      front: '#d8753f',
      right: '#c96b38',
      top: '#ef8148',
    };

    return this.cellFragment(cell)?.background ? fills[cell.face] : '#f3f3f3';
  }

  protected pieceFacePolygonPoints(face: CubeFace): string {
    return this.getPieceFaceCorners(face)
      .map((point) => `${point.x},${point.y}`)
      .join(' ');
  }

  protected pieceFaceClipId(piece: CubePiece, face: CubeFace): string {
    return `piece-${piece.id}-${face}`;
  }

  protected pieceFragmentTransform(face: CubeFace): string {
    const corners = this.getPieceFaceCorners(face);
    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const width = Math.max(...xs) - minX;
    const height = Math.max(...ys) - minY;

    return `translate(${minX} ${minY}) scale(${width / 100} ${height / 100})`;
  }

  protected pieceFaceFill(face: CubeFace): string {
    const fills: Record<CubeFace, string> = {
      front: '#d8753f',
      right: '#c96b38',
      top: '#ef8148',
    };

    return fills[face];
  }

  private placeSelectedPieceAtPosition(positionId: string, anchorFace: CubeFace): void {
    const selectedPiece = this.selectedPiece();

    if (!selectedPiece || this.isSolved()) {
      return;
    }

    const position = this.getPositionById(positionId);

    if (!position) {
      return;
    }

    if (this.getPlacedPieceForPosition(position.id)?.locked) {
      this.message.set('Cette piece est verrouillee par un indice.');
      this.clearDragState();
      return;
    }

    const replacedPiece = this.getPlacedPieceForPosition(position.id);

    this.placedPieces.update((pieces) => [
      ...pieces.filter((piece) => piece.positionId !== position.id),
      {
        pieceId: selectedPiece.id,
        positionId: position.id,
        anchorFace,
      },
    ]);

    this.selectedPieceId.set(replacedPiece ? replacedPiece.pieceId : null);
    this.clearDragState();
    this.message.set(
      selectedPiece.id === position.id
        ? 'Bon morceau: ses fragments alignent les faces du cube.'
        : replacedPiece
          ? 'Le morceau a ete remplace. L’ancien morceau reste selectionne.'
          : 'Le morceau est place. Les faces visibles s’ajustent a cet emplacement.',
    );
  }

  private clearDragState(clearHover = true): void {
    this.dragPosition.set(null);
    this.isDraggingPiece.set(false);

    if (clearHover) {
      this.hoveredPositionId.set(null);
    }
  }

  private getPlacementTargetFromPoint(clientX: number, clientY: number): PlacementTarget | null {
    const element = document.elementFromPoint(clientX, clientY);

    if (!element) {
      return null;
    }

    const cell = element.closest('[data-cube-cell="true"]');
    const positionId = cell?.getAttribute('data-position-id') ?? null;
    const face = cell?.getAttribute('data-face') as CubeFace | null;

    if (!positionId || !face) {
      return null;
    }

    return {
      positionId,
      face,
    };
  }

  private isDisplayedRouteContinuous(): boolean {
    const routeNodes = this.faceCells.map((cell) => this.createRouteNode(cell.face, cell.row, cell.col));
    const adjacency = this.createRouteAdjacency(routeNodes);
    const cellsByNodeId = new Map(
      this.faceCells.map((cell) => [this.createRouteNode(cell.face, cell.row, cell.col).id, cell]),
    );
    const visitedNodeIds = new Set<string>();
    const connectedNodeIds = new Set<string>();
    const routeEdgeIds = new Set<string>();
    let endpointCount = 0;

    for (const cell of this.faceCells) {
      const fragment = this.cellFragment(cell);
      const nodeId = this.createRouteNode(cell.face, cell.row, cell.col).id;

      if (!fragment?.ports) {
        return false;
      }

      visitedNodeIds.add(nodeId);

      for (const port of fragment.ports) {
        const edge = (adjacency.get(nodeId) ?? []).find((candidate) => candidate.fromPort === port);

        if (!edge) {
          endpointCount += 1;
          continue;
        }

        const neighborCell = cellsByNodeId.get(edge.to);
        const neighborFragment = neighborCell ? this.cellFragment(neighborCell) : null;

        if (!neighborFragment?.ports?.includes(edge.toPort)) {
          return false;
        }

        connectedNodeIds.add(nodeId);
        connectedNodeIds.add(edge.to);
        routeEdgeIds.add([nodeId, edge.to].sort().join('|'));
      }
    }

    if (endpointCount !== 2 || visitedNodeIds.size !== this.faceCells.length) {
      return false;
    }

    const firstNodeId = [...connectedNodeIds][0];

    if (!firstNodeId) {
      return false;
    }

    return this.countConnectedRouteNodes(firstNodeId, routeEdgeIds) === this.faceCells.length;
  }

  private countConnectedRouteNodes(startNodeId: string, routeEdgeIds: Set<string>): number {
    const visitedNodeIds = new Set<string>();
    const pendingNodeIds = [startNodeId];

    while (pendingNodeIds.length > 0) {
      const nodeId = pendingNodeIds.pop();

      if (!nodeId || visitedNodeIds.has(nodeId)) {
        continue;
      }

      visitedNodeIds.add(nodeId);

      for (const edgeId of routeEdgeIds) {
        const [firstNodeId, secondNodeId] = edgeId.split('|');

        if (firstNodeId === nodeId && !visitedNodeIds.has(secondNodeId)) {
          pendingNodeIds.push(secondNodeId);
        }

        if (secondNodeId === nodeId && !visitedNodeIds.has(firstNodeId)) {
          pendingNodeIds.push(firstNodeId);
        }
      }
    }

    return visitedNodeIds.size;
  }

  private getSourceFaceForDisplayedCell(
    piece: CubePiece,
    placedPiece: PlacedPiece,
    displayFace: CubeFace,
  ): CubeFace | null {
    const position = this.getPositionById(placedPiece.positionId);

    if (!position || !position.faces.includes(displayFace)) {
      return null;
    }

    const visibleFaces = [
      placedPiece.anchorFace,
      ...position.faces.filter((face) => face !== placedPiece.anchorFace),
    ];
    const displayIndex = visibleFaces.indexOf(displayFace);

    if (displayIndex < 0 || displayIndex >= piece.faces.length) {
      return null;
    }

    return piece.faces[displayIndex];
  }

  private getCellCorners(cell: FaceCell): SvgPoint[] {
    const faceCorners = this.getFaceCorners(cell.face);
    const startU = cell.col / this.size;
    const endU = (cell.col + 1) / this.size;
    const startV = cell.row / this.size;
    const endV = (cell.row + 1) / this.size;

    return [
      this.interpolateFacePoint(faceCorners, startU, startV),
      this.interpolateFacePoint(faceCorners, endU, startV),
      this.interpolateFacePoint(faceCorners, endU, endV),
      this.interpolateFacePoint(faceCorners, startU, endV),
    ];
  }

  private getCellCenter(cell: FaceCell): SvgPoint {
    const corners = this.getCellCorners(cell);

    return {
      x: corners.reduce((sum, point) => sum + point.x, 0) / corners.length,
      y: corners.reduce((sum, point) => sum + point.y, 0) / corners.length,
    };
  }

  private getCellPortPoint(cell: FaceCell, port: RoutePort): SvgPoint {
    const [topLeft, topRight, bottomRight, bottomLeft] = this.getCellCorners(cell);
    const midpoint = (first: SvgPoint, second: SvgPoint): SvgPoint => ({
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    });

    const portPoints: Record<RoutePort, SvgPoint> = {
      L: midpoint(topLeft, bottomLeft),
      R: midpoint(topRight, bottomRight),
      T: midpoint(topLeft, topRight),
      B: midpoint(bottomLeft, bottomRight),
    };

    return portPoints[port];
  }

  private getFaceCorners(face: CubeFace): [SvgPoint, SvgPoint, SvgPoint, SvgPoint] {
    const corners: Record<CubeFace, [SvgPoint, SvgPoint, SvgPoint, SvgPoint]> = {
      top: [
        { x: 210, y: 24 },
        { x: 340, y: 98 },
        { x: 210, y: 172 },
        { x: 80, y: 98 },
      ],
      front: [
        { x: 80, y: 98 },
        { x: 210, y: 172 },
        { x: 210, y: 304 },
        { x: 80, y: 230 },
      ],
      right: [
        { x: 210, y: 172 },
        { x: 340, y: 98 },
        { x: 340, y: 230 },
        { x: 210, y: 304 },
      ],
    };

    return corners[face];
  }

  private getPieceFaceCorners(face: CubeFace): [SvgPoint, SvgPoint, SvgPoint, SvgPoint] {
    const corners: Record<CubeFace, [SvgPoint, SvgPoint, SvgPoint, SvgPoint]> = {
      top: [
        { x: 60, y: 6 },
        { x: 108, y: 33 },
        { x: 60, y: 60 },
        { x: 12, y: 33 },
      ],
      front: [
        { x: 12, y: 33 },
        { x: 60, y: 60 },
        { x: 60, y: 92 },
        { x: 12, y: 65 },
      ],
      right: [
        { x: 60, y: 60 },
        { x: 108, y: 33 },
        { x: 108, y: 65 },
        { x: 60, y: 92 },
      ],
    };

    return corners[face];
  }

  private interpolateFacePoint(
    [topLeft, topRight, bottomRight, bottomLeft]: [SvgPoint, SvgPoint, SvgPoint, SvgPoint],
    u: number,
    v: number,
  ): SvgPoint {
    return {
      x:
        topLeft.x * (1 - u) * (1 - v) +
        topRight.x * u * (1 - v) +
        bottomRight.x * u * v +
        bottomLeft.x * (1 - u) * v,
      y:
        topLeft.y * (1 - u) * (1 - v) +
        topRight.y * u * (1 - v) +
        bottomRight.y * u * v +
        bottomLeft.y * (1 - u) * v,
    };
  }

  private createShellPositions(): ShellPosition[] {
    const positions: ShellPosition[] = [];

    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        for (let z = 0; z < this.size; z += 1) {
          const faces: CubeFace[] = [];

          if (z === 0) {
            faces.push('front');
          }

          if (x === this.size - 1) {
            faces.push('right');
          }

          if (y === 0) {
            faces.push('top');
          }

          if (faces.length > 0) {
            positions.push({
              id: this.createPositionId(x, y, z),
              x,
              y,
              z,
              faces,
            });
          }
        }
      }
    }

    return positions;
  }

  private createPieces(): CubePiece[] {
    const pieces = this.positions.map((position) => {
      const fragments = {
        front: this.createFragment('front', position.y, position.x),
        right: this.createFragment('right', position.y, position.z),
        top: this.createFragment('top', this.size - 1 - position.z, position.x),
      };

      return {
        ...position,
        name: this.getPieceName(position),
        fragments,
      };
    });

    return this.shufflePieces(pieces);
  }

  private createFaceCells(): FaceCell[] {
    const cells: FaceCell[] = [];

    for (let row = 0; row < this.size; row += 1) {
      for (let col = 0; col < this.size; col += 1) {
        cells.push({
          face: 'top',
          positionId: this.createPositionId(col, 0, this.size - 1 - row),
          row,
          col,
        });
        cells.push({
          face: 'front',
          positionId: this.createPositionId(col, row, 0),
          row,
          col,
        });
        cells.push({
          face: 'right',
          positionId: this.createPositionId(this.size - 1, row, col),
          row,
          col,
        });
      }
    }

    return cells;
  }

  private getPieceById(pieceId: string): CubePiece | undefined {
    return this.pieces().find((piece) => piece.id === pieceId);
  }

  private getPositionById(positionId: string): ShellPosition | undefined {
    return this.positions.find((position) => position.id === positionId);
  }

  private getPieceName(position: ShellPosition): string {
    if (position.faces.length === 3) {
      return 'Coin triple';
    }

    if (position.faces.length === 2) {
      return `Arete ${position.faces.map((face) => this.getFaceInitial(face)).join('+')}`;
    }

    return `Face ${this.getFaceInitial(position.faces[0])}`;
  }

  private createPositionId(x: number, y: number, z: number): string {
    return `${x}-${y}-${z}`;
  }

  private createFragment(face: CubeFace, row: number, col: number): FaceFragment {
    const fragmentMakers: Record<CubeFace, (row: number, col: number) => FaceFragment> = {
      front: (fragmentRow, fragmentCol) => ({
        background: 'linear-gradient(135deg, #e47c43, #c96534)',
        stroke: '#ffe7a8',
        strokeWidth: 12,
        paths: this.getContinuousRoutePaths('front', fragmentRow, fragmentCol),
        ports: this.getRoutePorts('front', fragmentRow, fragmentCol),
        dots: [],
      }),
      right: (fragmentRow, fragmentCol) => ({
        background: 'linear-gradient(135deg, #e47c43, #c96534)',
        stroke: '#ffe7a8',
        strokeWidth: 12,
        paths: this.getContinuousRoutePaths('right', fragmentRow, fragmentCol),
        ports: this.getRoutePorts('right', fragmentRow, fragmentCol),
        dots: [],
      }),
      top: (fragmentRow, fragmentCol) => ({
        background: 'linear-gradient(135deg, #e47c43, #c96534)',
        stroke: '#ffe7a8',
        strokeWidth: 12,
        paths: this.getContinuousRoutePaths('top', fragmentRow, fragmentCol),
        ports: this.getRoutePorts('top', fragmentRow, fragmentCol),
        dots: [],
      }),
    };

    return fragmentMakers[face](row, col);
  }

  private getContinuousRoutePaths(face: CubeFace, row: number, col: number): string[] {
    const ports = this.getRoutePorts(face, row, col);

    return ports ? [this.createRoutePath(ports[0], ports[1] ?? null)] : [];
  }

  protected cellRoutePath(cell: FaceCell, fragment: FaceFragment): string {
    if (!fragment.ports) {
      return '';
    }

    const firstPoint = this.getCellPortPoint(cell, fragment.ports[0]);
    const center = this.getCellCenter(cell);

    if (fragment.ports.length === 1) {
      return `M${firstPoint.x} ${firstPoint.y} L${center.x} ${center.y}`;
    }

    const secondPoint = this.getCellPortPoint(cell, fragment.ports[1]);

    if (this.areOppositeRoutePorts(fragment.ports[0], fragment.ports[1])) {
      return `M${firstPoint.x} ${firstPoint.y} L${secondPoint.x} ${secondPoint.y}`;
    }

    return `M${firstPoint.x} ${firstPoint.y} L${center.x} ${center.y} L${secondPoint.x} ${secondPoint.y}`;
  }

  private getRoutePorts(face: CubeFace, row: number, col: number): RoutePorts | null {
    return this.routePorts()[face]?.[`${row}-${col}`] ?? null;
  }

  private createRoutePath(firstPort: RoutePort, secondPort: RoutePort | null): string {
    const portPoints: Record<RoutePort, { x: number; y: number }> = {
      L: { x: 0, y: 50 },
      R: { x: 100, y: 50 },
      T: { x: 50, y: 0 },
      B: { x: 50, y: 100 },
    };

    const firstPoint = portPoints[firstPort];

    if (!secondPort) {
      return `M${firstPoint.x} ${firstPoint.y} L50 50`;
    }

    const secondPoint = portPoints[secondPort];

    if (firstPoint.x === secondPoint.x || firstPoint.y === secondPoint.y) {
      return `M${firstPoint.x} ${firstPoint.y} L${secondPoint.x} ${secondPoint.y}`;
    }

    return `M${firstPoint.x} ${firstPoint.y} L50 50 L${secondPoint.x} ${secondPoint.y}`;
  }

  private areOppositeRoutePorts(firstPort: RoutePort, secondPort: RoutePort): boolean {
    return (
      (firstPort === 'L' && secondPort === 'R') ||
      (firstPort === 'R' && secondPort === 'L') ||
      (firstPort === 'T' && secondPort === 'B') ||
      (firstPort === 'B' && secondPort === 'T')
    );
  }

  private createRandomRoutePorts(): RoutePortMap {
    const routeNodes = this.faceCells.map((cell) => this.createRouteNode(cell.face, cell.row, cell.col));
    const routeNodeIds = routeNodes.map((node) => node.id);
    const routeNodeIdsSet = new Set(routeNodeIds);
    const adjacency = this.createRouteAdjacency(routeNodes);

    for (let attempt = 0; attempt < 500; attempt += 1) {
      const startId = routeNodeIds[Math.floor(Math.random() * routeNodeIds.length)];
      const path = this.findRoutePath(startId, adjacency, routeNodeIdsSet);

      if (path) {
        return this.createRoutePortMapFromPath(path, adjacency);
      }
    }

    return this.createFallbackRoutePorts();
  }

  private findRoutePath(
    startId: string,
    adjacency: Map<string, RouteEdge[]>,
    routeNodeIds: Set<string>,
  ): string[] | null {
    const path = [startId];
    const visited = new Set([startId]);

    const visit = (nodeId: string): boolean => {
      if (path.length === routeNodeIds.size) {
        return true;
      }

      const edges = this.shuffleArray([...(adjacency.get(nodeId) ?? [])])
        .filter((edge) => !visited.has(edge.to))
        .sort(
          (first, second) =>
            this.countUnvisitedNeighbors(first.to, adjacency, visited) -
            this.countUnvisitedNeighbors(second.to, adjacency, visited),
        );

      for (const edge of edges) {
        visited.add(edge.to);
        path.push(edge.to);

        if (visit(edge.to)) {
          return true;
        }

        path.pop();
        visited.delete(edge.to);
      }

      return false;
    };

    return visit(startId) ? path : null;
  }

  private createRoutePortMapFromPath(
    path: string[],
    adjacency: Map<string, RouteEdge[]>,
  ): RoutePortMap {
    const routePorts: RoutePortMap = {};

    for (let index = 0; index < path.length; index += 1) {
      const nodeId = path[index];
      const node = this.parseRouteNodeId(nodeId);
      const ports: RoutePort[] = [];

      if (index > 0) {
        const previousEdge = this.getRouteEdge(nodeId, path[index - 1], adjacency);

        if (previousEdge) {
          ports.push(previousEdge.fromPort);
        }
      }

      if (index < path.length - 1) {
        const nextEdge = this.getRouteEdge(nodeId, path[index + 1], adjacency);

        if (nextEdge) {
          ports.push(nextEdge.fromPort);
        }
      }

      routePorts[node.face] ??= {};
      routePorts[node.face]![`${node.row}-${node.col}`] =
        ports.length === 1 ? [ports[0]] : [ports[0], ports[1]];
    }

    return routePorts;
  }

  private createRouteAdjacency(routeNodes: RouteNode[]): Map<string, RouteEdge[]> {
    const adjacency = new Map<string, RouteEdge[]>();

    for (const node of routeNodes) {
      adjacency.set(node.id, []);
    }

    const addEdge = (first: RouteNode, second: RouteNode, firstPort: RoutePort, secondPort: RoutePort): void => {
      adjacency.get(first.id)?.push({
        to: second.id,
        fromPort: firstPort,
        toPort: secondPort,
      });
      adjacency.get(second.id)?.push({
        to: first.id,
        fromPort: secondPort,
        toPort: firstPort,
      });
    };

    const getNode = (face: CubeFace, row: number, col: number): RouteNode =>
      this.createRouteNode(face, row, col);

    for (const face of this.faces) {
      for (let row = 0; row < this.size; row += 1) {
        for (let col = 0; col < this.size; col += 1) {
          const node = getNode(face, row, col);

          if (col < this.size - 1) {
            addEdge(node, getNode(face, row, col + 1), 'R', 'L');
          }

          if (row < this.size - 1) {
            addEdge(node, getNode(face, row + 1, col), 'B', 'T');
          }
        }
      }
    }

    for (let col = 0; col < this.size; col += 1) {
      addEdge(getNode('front', 0, col), getNode('top', this.size - 1, col), 'T', 'B');
      addEdge(getNode('front', col, this.size - 1), getNode('right', col, 0), 'R', 'L');
      addEdge(getNode('right', 0, col), getNode('top', this.size - 1 - col, this.size - 1), 'T', 'R');
    }

    return adjacency;
  }

  private createFallbackRoutePorts(): RoutePortMap {
    return {
      front: {
        '0-0': ['B', 'R'],
        '0-1': ['L', 'R'],
        '0-2': ['L', 'T'],
        '1-0': ['R', 'T'],
        '1-1': ['R', 'L'],
        '1-2': ['B', 'L'],
        '2-0': ['R'],
        '2-1': ['L', 'R'],
        '2-2': ['L', 'T'],
      },
      top: {
        '0-0': ['B', 'R'],
        '0-1': ['L', 'B'],
        '0-2': ['B', 'R'],
        '1-0': ['B', 'T'],
        '1-1': ['T', 'R'],
        '1-2': ['L', 'T'],
        '2-0': ['R', 'T'],
        '2-1': ['R', 'L'],
        '2-2': ['B', 'L'],
      },
      right: {
        '0-0': ['R', 'B'],
        '0-1': ['B', 'L'],
        '0-2': ['T', 'B'],
        '1-0': ['T', 'B'],
        '1-1': ['B', 'T'],
        '1-2': ['T', 'B'],
        '2-0': ['T', 'R'],
        '2-1': ['R', 'T'],
        '2-2': ['T', 'L'],
      },
    };
  }

  private countUnvisitedNeighbors(
    nodeId: string,
    adjacency: Map<string, RouteEdge[]>,
    visited: Set<string>,
  ): number {
    return (adjacency.get(nodeId) ?? []).filter((edge) => !visited.has(edge.to)).length;
  }

  private getRouteEdge(
    fromNodeId: string,
    toNodeId: string,
    adjacency: Map<string, RouteEdge[]>,
  ): RouteEdge | undefined {
    return adjacency.get(fromNodeId)?.find((edge) => edge.to === toNodeId);
  }

  private createRouteNode(face: CubeFace, row: number, col: number): RouteNode {
    return {
      face,
      row,
      col,
      id: `${face}:${row}:${col}`,
    };
  }

  private parseRouteNodeId(nodeId: string): RouteNode {
    const [face, row, col] = nodeId.split(':');

    return this.createRouteNode(face as CubeFace, Number(row), Number(col));
  }

  private shuffleArray<T>(items: T[]): T[] {
    return items.sort(() => 0.5 - Math.random());
  }

  private getFrontGardenPaths(row: number, col: number): string[] {
    const paths = [
      ['M48 100 C48 76 61 58 100 55', 'M76 10 L94 28'],
      ['M0 55 C34 51 70 45 100 30'],
      ['M0 30 C30 40 46 66 48 100', 'M58 18 C70 28 80 28 92 18'],
      ['M48 0 C42 26 50 55 100 70'],
      ['M0 70 C33 70 61 47 55 0', 'M42 82 L62 82'],
      ['M55 0 C62 34 56 64 18 100'],
      ['M100 46 C67 50 45 69 36 100', 'M14 26 C26 36 42 36 54 26'],
      ['M36 0 C33 30 48 55 100 58'],
      ['M0 58 C32 61 52 78 62 100', 'M68 30 L86 48'],
    ];

    return paths[row * this.size + col];
  }

  private getFrontGardenDots(row: number, col: number): FaceFragmentDot[] {
    const dots = [
      [{ cx: 23, cy: 30, r: 8, fill: '#ef7b68' }],
      [{ cx: 57, cy: 72, r: 7, fill: '#f2c94c' }],
      [{ cx: 78, cy: 72, r: 8, fill: '#7a4fb0' }],
      [{ cx: 19, cy: 80, r: 7, fill: '#f2c94c' }],
      [{ cx: 76, cy: 31, r: 8, fill: '#ef7b68' }],
      [{ cx: 76, cy: 74, r: 7, fill: '#f2c94c' }],
      [{ cx: 70, cy: 24, r: 8, fill: '#7a4fb0' }],
      [{ cx: 19, cy: 34, r: 7, fill: '#ef7b68' }],
      [{ cx: 30, cy: 24, r: 8, fill: '#f2c94c' }],
    ];

    return dots[row * this.size + col];
  }

  private getRightMapPaths(row: number, col: number): string[] {
    const paths = [
      ['M35 0 C48 31 46 62 100 70', 'M0 24 L30 54'],
      ['M0 70 C38 83 66 50 100 56', 'M42 0 L46 38'],
      ['M0 56 C31 50 62 52 100 24'],
      ['M35 0 C31 35 44 60 100 42'],
      ['M0 42 C34 38 58 69 54 100', 'M66 0 L100 30'],
      ['M54 0 C57 33 40 67 0 82'],
      ['M100 58 C73 66 45 57 28 100'],
      ['M28 0 C17 29 35 59 100 66'],
      ['M0 66 C34 69 62 80 76 100', 'M60 18 L100 18'],
    ];

    return paths[row * this.size + col];
  }

  private getRightMapDots(row: number, col: number): FaceFragmentDot[] {
    const dots = [
      [{ cx: 73, cy: 24, r: 6, fill: '#c54f3f' }],
      [{ cx: 25, cy: 25, r: 5, fill: '#f3d36b' }],
      [{ cx: 76, cy: 73, r: 6, fill: '#c54f3f' }],
      [{ cx: 18, cy: 62, r: 5, fill: '#f3d36b' }],
      [{ cx: 70, cy: 62, r: 6, fill: '#c54f3f' }],
      [{ cx: 80, cy: 28, r: 5, fill: '#f3d36b' }],
      [{ cx: 52, cy: 33, r: 6, fill: '#c54f3f' }],
      [{ cx: 18, cy: 75, r: 5, fill: '#f3d36b' }],
      [{ cx: 33, cy: 31, r: 6, fill: '#c54f3f' }],
    ];

    return dots[row * this.size + col];
  }

  private getTopSkyPaths(row: number, col: number): string[] {
    const paths = [
      ['M100 72 L48 38', 'M18 84 L48 38'],
      ['M0 72 L43 22 L100 46'],
      ['M0 46 L38 72 L74 28'],
      ['M48 0 L60 54 L100 75'],
      ['M0 75 L60 54 L72 0', 'M28 28 L60 54'],
      ['M72 0 L55 42 L0 48'],
      ['M16 24 L68 0', 'M68 0 L100 42'],
      ['M0 0 L38 44 L100 32'],
      ['M0 32 L46 64 L86 22'],
    ];

    return paths[row * this.size + col];
  }

  private getTopSkyDots(row: number, col: number): FaceFragmentDot[] {
    const dots = [
      [
        { cx: 48, cy: 38, r: 6, fill: '#fff4b5' },
        { cx: 18, cy: 84, r: 4, fill: '#fff4b5' },
      ],
      [
        { cx: 43, cy: 22, r: 6, fill: '#fff4b5' },
        { cx: 100, cy: 46, r: 5, fill: '#fff4b5' },
      ],
      [
        { cx: 38, cy: 72, r: 5, fill: '#fff4b5' },
        { cx: 74, cy: 28, r: 7, fill: '#fff4b5' },
      ],
      [
        { cx: 60, cy: 54, r: 6, fill: '#fff4b5' },
        { cx: 100, cy: 75, r: 4, fill: '#fff4b5' },
      ],
      [
        { cx: 28, cy: 28, r: 5, fill: '#fff4b5' },
        { cx: 72, cy: 0, r: 5, fill: '#fff4b5' },
      ],
      [
        { cx: 55, cy: 42, r: 6, fill: '#fff4b5' },
        { cx: 0, cy: 48, r: 4, fill: '#fff4b5' },
      ],
      [
        { cx: 16, cy: 24, r: 5, fill: '#fff4b5' },
        { cx: 68, cy: 0, r: 5, fill: '#fff4b5' },
      ],
      [
        { cx: 38, cy: 44, r: 6, fill: '#fff4b5' },
        { cx: 100, cy: 32, r: 4, fill: '#fff4b5' },
      ],
      [
        { cx: 46, cy: 64, r: 6, fill: '#fff4b5' },
        { cx: 86, cy: 22, r: 5, fill: '#fff4b5' },
      ],
    ];

    return dots[row * this.size + col];
  }

  private shufflePieces(pieces: CubePiece[]): CubePiece[] {
    return [...pieces]
      .sort((first, second) => first.id.localeCompare(second.id))
      .sort(() => 0.5 - Math.random());
  }
}
