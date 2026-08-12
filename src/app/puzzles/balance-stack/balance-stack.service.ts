import { Injectable } from '@angular/core';

export type BalanceStackDifficultyId = 'initiation' | 'classic' | 'vertigo';

export type BalanceStackShapeId =
  | 'bar'
  | 'square'
  | 'tee'
  | 'corner'
  | 'reverse-corner'
  | 'zigzag'
  | 'reverse-zigzag';

export type BalanceGridPoint = {
  x: number;
  y: number;
};

export type BalanceStackPiece = {
  id: string;
  shapeId: BalanceStackShapeId;
  label: string;
  color: string;
};

export type BalanceStackCell = BalanceGridPoint & {
  pieceId: string;
  color: string;
};

export type BalanceStackMove = {
  pieceId: string;
  rotation: number;
  x: number;
};

export type BalanceStackPuzzle = {
  difficultyId: BalanceStackDifficultyId;
  title: string;
  description: string;
  width: number;
  height: number;
  safeRadius: number;
  pieces: BalanceStackPiece[];
  solutionMoves: BalanceStackMove[];
};

export type BalanceDropResult = {
  cells: BalanceStackCell[];
  placedCells: BalanceStackCell[];
  landingY: number;
  centerOfMass: number;
  offset: number;
  localStable: boolean;
  globalStable: boolean;
  connected: boolean;
  compact: boolean;
  stable: boolean;
};

export type BalanceStackPlacement = {
  x: number;
  rotation: number;
  result: BalanceDropResult;
};

export type BalanceStackDifficultyOption = {
  id: BalanceStackDifficultyId;
  title: string;
  description: string;
  pieceCount: number;
};

type ShapeDefinition = {
  id: BalanceStackShapeId;
  label: string;
  color: string;
  cells: readonly BalanceGridPoint[];
};

type DifficultyConfig = BalanceStackDifficultyOption & {
  width: number;
  height: number;
  safeRadius: number;
  minimumTowerHeight: number;
};

const SHAPE_DEFINITIONS: readonly ShapeDefinition[] = [
  {
    id: 'bar',
    label: 'Barre',
    color: '#5c9ee5',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ],
  },
  {
    id: 'square',
    label: 'Carré',
    color: '#e7b63f',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  {
    id: 'tee',
    label: 'Té',
    color: '#8d6de8',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
    ],
  },
  {
    id: 'corner',
    label: 'Coude',
    color: '#ef7a57',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 0 },
    ],
  },
  {
    id: 'reverse-corner',
    label: 'Coude inversé',
    color: '#43b9ad',
    cells: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 0 },
    ],
  },
  {
    id: 'zigzag',
    label: 'Zigzag',
    color: '#e66f9d',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
  {
    id: 'reverse-zigzag',
    label: 'Zigzag inversé',
    color: '#70ae58',
    cells: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
];

const DIFFICULTY_CONFIGS: readonly DifficultyConfig[] = [
  {
    id: 'initiation',
    title: 'Initiation',
    description: 'Cinq blocs à assembler en une seule tour continue.',
    pieceCount: 5,
    width: 8,
    height: 10,
    safeRadius: 1.45,
    minimumTowerHeight: 4,
  },
  {
    id: 'classic',
    title: 'Classique',
    description: 'Sept blocs à imbriquer sans laisser de morceau isolé.',
    pieceCount: 7,
    width: 9,
    height: 11,
    safeRadius: 1.2,
    minimumTowerHeight: 5,
  },
  {
    id: 'vertigo',
    title: 'Vertige',
    description: 'Neuf blocs à solidariser dans une tour très sensible.',
    pieceCount: 9,
    width: 10,
    height: 12,
    safeRadius: 1,
    minimumTowerHeight: 6,
  },
];

export const BALANCE_STACK_DIFFICULTIES: readonly BalanceStackDifficultyOption[] =
  DIFFICULTY_CONFIGS.map(({ id, title, description, pieceCount }) => ({
    id,
    title,
    description,
    pieceCount,
  }));

@Injectable({ providedIn: 'root' })
export class BalanceStackService {
  private readonly orientationCache = new Map<
    BalanceStackShapeId,
    readonly (readonly BalanceGridPoint[])[]
  >();

  createPuzzle(difficultyId: BalanceStackDifficultyId = 'classic'): BalanceStackPuzzle {
    const config = this.difficultyConfig(difficultyId);
    let bestCompletedPuzzle: BalanceStackPuzzle | null = null;
    let bestQuality = Number.NEGATIVE_INFINITY;

    for (let attempt = 0; attempt < 720; attempt += 1) {
      const pieces = this.createPieceSequence(config.pieceCount);
      const puzzleShell: BalanceStackPuzzle = {
        difficultyId: config.id,
        title: config.title,
        description: config.description,
        width: config.width,
        height: config.height,
        safeRadius: config.safeRadius,
        pieces,
        solutionMoves: [],
      };
      const generated = this.buildStableTower(puzzleShell);

      if (!generated) {
        continue;
      }

      const candidate: BalanceStackPuzzle = { ...puzzleShell, solutionMoves: generated.moves };

      if (this.countSolutions(candidate, 2) !== 1) {
        continue;
      }

      const uniqueSolution = this.findCompletion(candidate, [], 0);

      if (!uniqueSolution || uniqueSolution.length !== pieces.length) {
        continue;
      }

      const puzzle = { ...candidate, solutionMoves: uniqueSolution };
      const towerHeight = this.towerHeight(generated.cells);
      const span = this.occupiedSpan(generated.cells);
      const distinctShapes = new Set(pieces.map((piece) => piece.shapeId)).size;
      const quality = towerHeight * 5 + span * 2 + generated.peakOffset * 4 + distinctShapes * 2;

      if (quality > bestQuality) {
        bestQuality = quality;
        bestCompletedPuzzle = puzzle;
      }

      if (
        towerHeight >= config.minimumTowerHeight &&
        span >= Math.ceil(config.width * 0.55) &&
        generated.peakOffset >= config.safeRadius * 0.35 &&
        distinctShapes >= 3
      ) {
        return puzzle;
      }
    }

    if (bestCompletedPuzzle) {
      return bestCompletedPuzzle;
    }

    throw new Error('Unable to create a stable balance-stack puzzle.');
  }

  orientationsFor(piece: BalanceStackPiece): readonly (readonly BalanceGridPoint[])[] {
    const cached = this.orientationCache.get(piece.shapeId);

    if (cached) {
      return cached;
    }

    const definition = this.shapeDefinition(piece.shapeId);
    const orientations: BalanceGridPoint[][] = [];
    const signatures = new Set<string>();
    let current = this.normalizeCells(definition.cells);

    for (let turn = 0; turn < 4; turn += 1) {
      const signature = this.cellsSignature(current);

      if (!signatures.has(signature)) {
        signatures.add(signature);
        orientations.push(current);
      }

      current = this.normalizeCells(current.map((cell) => ({ x: cell.y, y: -cell.x })));
    }

    this.orientationCache.set(piece.shapeId, orientations);
    return orientations;
  }

  dropPiece(
    puzzle: BalanceStackPuzzle,
    existingCells: readonly BalanceStackCell[],
    piece: BalanceStackPiece,
    rotation: number,
    x: number,
  ): BalanceDropResult | null {
    const orientations = this.orientationsFor(piece);
    const normalizedRotation = this.normalizeRotation(rotation, orientations.length);
    const shape = orientations[normalizedRotation];
    const shapeWidth = Math.max(...shape.map((cell) => cell.x)) + 1;
    const shapeHeight = Math.max(...shape.map((cell) => cell.y)) + 1;

    if (!Number.isInteger(x) || x < 0 || x + shapeWidth > puzzle.width) {
      return null;
    }

    const occupied = new Set(existingCells.map((cell) => this.cellKey(cell.x, cell.y)));
    const canPlaceAt = (y: number): boolean =>
      shape.every((cell) => {
        const boardX = x + cell.x;
        const boardY = y + cell.y;

        return boardY >= 0 && boardY < puzzle.height && !occupied.has(this.cellKey(boardX, boardY));
      });
    let landingY = puzzle.height - shapeHeight;

    if (!canPlaceAt(landingY)) {
      return null;
    }

    while (landingY > 0 && canPlaceAt(landingY - 1)) {
      landingY -= 1;
    }

    const placedCells = shape.map<BalanceStackCell>((cell) => ({
      x: x + cell.x,
      y: landingY + cell.y,
      pieceId: piece.id,
      color: piece.color,
    }));
    const pieceCellKeys = new Set(placedCells.map((cell) => this.cellKey(cell.x, cell.y)));
    const contactCount = placedCells.reduce(
      (count, cell) =>
        count +
        [
          this.cellKey(cell.x - 1, cell.y),
          this.cellKey(cell.x + 1, cell.y),
          this.cellKey(cell.x, cell.y - 1),
          this.cellKey(cell.x, cell.y + 1),
        ].filter((neighborKey) => occupied.has(neighborKey)).length,
      0,
    );
    const connected = existingCells.length === 0 || (landingY > 0 && contactCount >= 3);
    const supportCells = placedCells.filter((cell) => {
      const belowKey = this.cellKey(cell.x, cell.y - 1);
      const hasInternalCellBelow = pieceCellKeys.has(belowKey);
      const touchesSupport = cell.y === 0 || occupied.has(belowKey);

      return !hasInternalCellBelow && touchesSupport;
    });
    const pieceCenterOfMass =
      placedCells.reduce((total, cell) => total + cell.x + 0.5, 0) / placedCells.length;
    const supportStart = Math.min(...supportCells.map((cell) => cell.x));
    const supportEnd = Math.max(...supportCells.map((cell) => cell.x + 1));
    const localStable =
      supportCells.length > 0 &&
      pieceCenterOfMass >= supportStart - 0.0001 &&
      pieceCenterOfMass <= supportEnd + 0.0001;
    const cells = [...existingCells, ...placedCells];
    const compact = this.isCompact(cells);
    const centerOfMass = this.centerOfMass(puzzle, cells);
    const offset = centerOfMass - puzzle.width / 2;
    const globalStable = Math.abs(offset) <= puzzle.safeRadius + 0.0001;

    return {
      cells,
      placedCells,
      landingY,
      centerOfMass,
      offset,
      localStable,
      globalStable,
      connected,
      compact,
      stable: localStable && globalStable && connected && compact,
    };
  }

  availablePlacements(
    puzzle: BalanceStackPuzzle,
    cells: readonly BalanceStackCell[],
    piece: BalanceStackPiece,
  ): BalanceStackPlacement[] {
    const placements: BalanceStackPlacement[] = [];
    const orientations = this.orientationsFor(piece);

    orientations.forEach((orientation, rotation) => {
      const shapeWidth = Math.max(...orientation.map((cell) => cell.x)) + 1;

      for (let x = 0; x <= puzzle.width - shapeWidth; x += 1) {
        if (
          cells.length === 0 &&
          (rotation !== 0 || x !== Math.floor((puzzle.width - shapeWidth) / 2))
        ) {
          continue;
        }

        const result = this.dropPiece(puzzle, cells, piece, rotation, x);

        if (result?.stable) {
          placements.push({ x, rotation, result });
        }
      }
    });

    return placements;
  }

  isOpeningPlacement(
    puzzle: BalanceStackPuzzle,
    piece: BalanceStackPiece,
    rotation: number,
    x: number,
  ): boolean {
    const orientations = this.orientationsFor(piece);
    const normalizedRotation = this.normalizeRotation(rotation, orientations.length);
    const orientation = orientations[normalizedRotation];
    const shapeWidth = Math.max(...orientation.map((cell) => cell.x)) + 1;

    return normalizedRotation === 0 && x === Math.floor((puzzle.width - shapeWidth) / 2);
  }

  countSolutions(puzzle: BalanceStackPuzzle, limit = 2): number {
    const maximumCount = Math.max(1, Math.floor(limit));
    const memo = new Map<string, number>();

    const search = (cells: readonly BalanceStackCell[], pieceIndex: number): number => {
      if (pieceIndex >= puzzle.pieces.length) {
        return this.isPerfectlyBalanced(puzzle, cells) ? 1 : 0;
      }

      const signature = `${pieceIndex}|${this.boardSignature(cells)}`;
      const cached = memo.get(signature);

      if (cached !== undefined) {
        return cached;
      }

      const piece = puzzle.pieces[pieceIndex];
      const nextBoards = new Set<string>();
      let solutionCount = 0;

      for (const placement of this.availablePlacements(puzzle, cells, piece)) {
        const nextSignature = this.boardSignature(placement.result.cells);

        if (nextBoards.has(nextSignature)) {
          continue;
        }

        nextBoards.add(nextSignature);
        solutionCount += search(placement.result.cells, pieceIndex + 1);

        if (solutionCount >= maximumCount) {
          memo.set(signature, maximumCount);
          return maximumCount;
        }
      }

      memo.set(signature, solutionCount);
      return solutionCount;
    };

    return search([], 0);
  }

  findCompletion(
    puzzle: BalanceStackPuzzle,
    cells: readonly BalanceStackCell[],
    pieceIndex: number,
    maximumVisitedStates = 80_000,
  ): BalanceStackMove[] | null {
    const visited = new Set<string>();
    let visitedStateCount = 0;

    const search = (
      currentCells: readonly BalanceStackCell[],
      currentPieceIndex: number,
    ): BalanceStackMove[] | null => {
      if (currentPieceIndex >= puzzle.pieces.length) {
        return this.isPerfectlyBalanced(puzzle, currentCells) ? [] : null;
      }

      if (visitedStateCount >= maximumVisitedStates) {
        return null;
      }

      const signature = `${currentPieceIndex}|${this.boardSignature(currentCells)}`;

      if (visited.has(signature)) {
        return null;
      }

      visited.add(signature);
      visitedStateCount += 1;

      const piece = puzzle.pieces[currentPieceIndex];
      const placements = this.availablePlacements(puzzle, currentCells, piece).sort(
        (first, second) =>
          Math.abs(first.result.offset) - Math.abs(second.result.offset) ||
          this.towerHeight(second.result.cells) - this.towerHeight(first.result.cells),
      );

      for (const placement of placements) {
        const remainingMoves = search(placement.result.cells, currentPieceIndex + 1);

        if (remainingMoves) {
          return [
            { pieceId: piece.id, rotation: placement.rotation, x: placement.x },
            ...remainingMoves,
          ];
        }
      }

      return null;
    };

    return search(cells, pieceIndex);
  }

  centerOfMass(puzzle: BalanceStackPuzzle, cells: readonly BalanceStackCell[]): number {
    if (cells.length === 0) {
      return puzzle.width / 2;
    }

    return cells.reduce((total, cell) => total + cell.x + 0.5, 0) / cells.length;
  }

  balanceOffset(puzzle: BalanceStackPuzzle, cells: readonly BalanceStackCell[]): number {
    return this.centerOfMass(puzzle, cells) - puzzle.width / 2;
  }

  isPerfectlyBalanced(puzzle: BalanceStackPuzzle, cells: readonly BalanceStackCell[]): boolean {
    return Math.abs(this.balanceOffset(puzzle, cells)) <= 0.0001;
  }

  tiltDegrees(puzzle: BalanceStackPuzzle, cells: readonly BalanceStackCell[]): number {
    const ratio = this.balanceOffset(puzzle, cells) / puzzle.safeRadius;

    return Math.max(-1, Math.min(1, ratio)) * 4.2;
  }

  towerHeight(cells: readonly BalanceStackCell[]): number {
    return cells.length === 0 ? 0 : Math.max(...cells.map((cell) => cell.y)) + 1;
  }

  private difficultyConfig(difficultyId: BalanceStackDifficultyId): DifficultyConfig {
    const config = DIFFICULTY_CONFIGS.find((candidate) => candidate.id === difficultyId);

    if (!config) {
      throw new Error(`Unknown balance-stack difficulty: ${difficultyId}`);
    }

    return config;
  }

  private createPieceSequence(pieceCount: number): BalanceStackPiece[] {
    const pieces: BalanceStackPiece[] = [];
    let bag: ShapeDefinition[] = [];

    while (pieces.length < pieceCount) {
      if (bag.length === 0) {
        bag = this.shuffle(SHAPE_DEFINITIONS);
      }

      const definition = bag.shift()!;
      const pieceNumber = pieces.length + 1;

      pieces.push({
        id: `bloc-${pieceNumber}`,
        shapeId: definition.id,
        label: definition.label,
        color: definition.color,
      });
    }

    return pieces;
  }

  private buildStableTower(puzzle: BalanceStackPuzzle): {
    cells: BalanceStackCell[];
    moves: BalanceStackMove[];
    peakOffset: number;
  } | null {
    let cells: BalanceStackCell[] = [];
    const moves: BalanceStackMove[] = [];
    let peakOffset = 0;

    for (const piece of puzzle.pieces) {
      const placements = this.availablePlacements(puzzle, cells, piece);

      if (placements.length === 0) {
        return null;
      }

      const scored = placements
        .map((placement) => ({
          placement,
          score:
            this.towerHeight(placement.result.cells) * 5 +
            this.occupiedSpan(placement.result.cells) * 1.8 +
            (Math.abs(placement.result.offset) / puzzle.safeRadius) * 4 +
            Math.random() * 9,
        }))
        .sort((first, second) => second.score - first.score);
      const candidatePool = scored.slice(
        0,
        Math.max(1, Math.min(8, Math.ceil(scored.length * 0.35))),
      );
      const chosen = this.randomItem(candidatePool).placement;

      cells = chosen.result.cells;
      peakOffset = Math.max(peakOffset, Math.abs(chosen.result.offset));
      moves.push({ pieceId: piece.id, rotation: chosen.rotation, x: chosen.x });
    }

    return { cells, moves, peakOffset };
  }

  private occupiedSpan(cells: readonly BalanceStackCell[]): number {
    if (cells.length === 0) {
      return 0;
    }

    const xPositions = cells.map((cell) => cell.x);
    return Math.max(...xPositions) - Math.min(...xPositions) + 1;
  }

  private isCompact(cells: readonly BalanceStackCell[]): boolean {
    const rowRanges = new Map<number, { min: number; max: number }>();

    for (const cell of cells) {
      const range = rowRanges.get(cell.y);

      if (range) {
        range.min = Math.min(range.min, cell.x);
        range.max = Math.max(range.max, cell.x);
      } else {
        rowRanges.set(cell.y, { min: cell.x, max: cell.x });
      }
    }

    return [...rowRanges].every(([row, range]) => {
      const rowCellCount = cells.filter((cell) => cell.y === row).length;
      return rowCellCount === range.max - range.min + 1;
    });
  }

  private shapeDefinition(shapeId: BalanceStackShapeId): ShapeDefinition {
    const definition = SHAPE_DEFINITIONS.find((candidate) => candidate.id === shapeId);

    if (!definition) {
      throw new Error(`Unknown balance-stack shape: ${shapeId}`);
    }

    return definition;
  }

  private normalizeCells(cells: readonly BalanceGridPoint[]): BalanceGridPoint[] {
    const minX = Math.min(...cells.map((cell) => cell.x));
    const minY = Math.min(...cells.map((cell) => cell.y));

    return cells
      .map((cell) => ({ x: cell.x - minX, y: cell.y - minY }))
      .sort((first, second) => first.y - second.y || first.x - second.x);
  }

  private cellsSignature(cells: readonly BalanceGridPoint[]): string {
    return cells.map((cell) => this.cellKey(cell.x, cell.y)).join('|');
  }

  private boardSignature(cells: readonly BalanceStackCell[]): string {
    return [...cells]
      .sort((first, second) => first.y - second.y || first.x - second.x)
      .map((cell) => this.cellKey(cell.x, cell.y))
      .join('|');
  }

  private cellKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  private normalizeRotation(rotation: number, orientationCount: number): number {
    return ((rotation % orientationCount) + orientationCount) % orientationCount;
  }

  private shuffle<T>(items: readonly T[]): T[] {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
  }

  private randomItem<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }
}
