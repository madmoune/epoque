import { Injectable } from '@angular/core';
import {
  GridCoordinate,
  JigsawColor,
  JigsawPiece,
  JigsawPuzzle,
  JigsawHint,
  JigsawPlacementAnalysis,
  JigsawSolutionCount,
  PlacedJigsawPiece,
} from './jigsaw-grid.model';

type GeneratedPiece = {
  cells: GridCoordinate[];
};

type PlacementOption = {
  pieceId: string;
  anchor: GridCoordinate;
  rotation: number;
  cellKeys: string[];
};

type SolverContext = {
  fillableCells: GridCoordinate[];
  optionsByCell: Map<string, PlacementOption[]>;
  memo: Map<string, number>;
};

type PlacementConflict = 'outside' | 'blocked' | 'occupied';

@Injectable({
  providedIn: 'root',
})
export class JigsawGridService {
  private readonly gridSize = 6;
  private readonly blockedCellCount = 3;
  private readonly maxGenerationAttempts = 500;
  private readonly solutionCountLimit = 1000;

  private readonly colors: JigsawColor[] = ['purple', 'green', 'cyan', 'orange', 'pink', 'yellow'];

  createPuzzle(): JigsawPuzzle {
    for (let attempt = 0; attempt < this.maxGenerationAttempts; attempt++) {
      const blockedCells = this.createRandomBlockedCells();
      const fillableCells = this.getFillableCells(blockedCells);

      if (!this.isConnectedGroup(fillableCells)) {
        continue;
      }

      const generatedPieces = this.partitionCellsIntoPieces(fillableCells);

      if (!generatedPieces) {
        continue;
      }

      const pieces = generatedPieces.map((generatedPiece, index) =>
        this.createPieceFromCells(generatedPiece.cells, index),
      );

      const solution = generatedPieces.map((generatedPiece, index) =>
        this.createSolutionPlacement(generatedPiece.cells, pieces[index].id),
      );

      return {
        size: this.gridSize,
        blockedCells,
        pieces: this.shuffle(pieces),
        solution,
      };
    }

    throw new Error('Could not generate a valid jigsaw puzzle.');
  }

  countSolutions(puzzle: JigsawPuzzle): JigsawSolutionCount {
    const context = this.createSolverContext(puzzle);
    const remainingPieceIds = new Set(puzzle.pieces.map((piece) => piece.id));
    const count = this.countCompletions(
      context,
      remainingPieceIds,
      new Set(),
      this.solutionCountLimit,
    );

    return {
      count,
      isCapped: count >= this.solutionCountLimit,
    };
  }

  findBestHint(puzzle: JigsawPuzzle, placedPieces: PlacedJigsawPiece[]): JigsawHint | null {
    const occupiedKeys = new Set<string>();
    const usedPieceIds = new Set<string>();

    for (const placedPiece of placedPieces) {
      if (usedPieceIds.has(placedPiece.pieceId)) {
        return null;
      }

      const piece = puzzle.pieces.find((candidate) => candidate.id === placedPiece.pieceId);

      if (!piece) {
        return null;
      }

      const cells = this.getAbsoluteCells(piece, placedPiece);

      if (this.findPlacementConflict(puzzle, cells, occupiedKeys)) {
        return null;
      }

      usedPieceIds.add(placedPiece.pieceId);
      this.addCellsToSet(occupiedKeys, cells);
    }

    const context = this.createSolverContext(puzzle);
    const remainingPieceIds = new Set(
      puzzle.pieces.map((piece) => piece.id).filter((pieceId) => !usedPieceIds.has(pieceId)),
    );
    const constrainedCell = this.findMostConstrainedCell(context, remainingPieceIds, occupiedKeys);

    if (!constrainedCell || constrainedCell.options.length === 0) {
      return null;
    }

    const viableOptions = constrainedCell.options.filter((option) => {
      if (!this.canUseOption(option, remainingPieceIds, occupiedKeys)) {
        return false;
      }

      const nextOccupiedKeys = new Set(occupiedKeys);
      this.addCellsToSet(nextOccupiedKeys, option.cellKeys);
      const nextRemainingPieceIds = new Set(remainingPieceIds);
      nextRemainingPieceIds.delete(option.pieceId);

      return this.countCompletions(context, nextRemainingPieceIds, nextOccupiedKeys, 1) > 0;
    });
    const hintOption = viableOptions[0];

    if (!hintOption) {
      return null;
    }

    return {
      placement: {
        pieceId: hintOption.pieceId,
        anchor: hintOption.anchor,
        rotation: hintOption.rotation,
      },
      focusCell: this.parseCellKey(constrainedCell.key),
      optionCount: viableOptions.length,
    };
  }

  analyzePlacement(
    puzzle: JigsawPuzzle,
    placedPieces: PlacedJigsawPiece[],
    candidate: PlacedJigsawPiece,
  ): JigsawPlacementAnalysis {
    const occupiedKeys = new Set<string>();
    const usedPieceIds = new Set<string>();

    for (const placedPiece of placedPieces) {
      if (usedPieceIds.has(placedPiece.pieceId)) {
        return {
          canPlace: false,
          canComplete: false,
          reason: 'occupied',
        };
      }

      const piece = puzzle.pieces.find(
        (candidatePiece) => candidatePiece.id === placedPiece.pieceId,
      );

      if (!piece) {
        return {
          canPlace: false,
          canComplete: false,
          reason: 'outside',
        };
      }

      const conflict = this.findPlacementConflict(
        puzzle,
        this.getAbsoluteCells(piece, placedPiece),
        occupiedKeys,
      );

      if (conflict) {
        return {
          canPlace: false,
          canComplete: false,
          reason: conflict,
        };
      }

      usedPieceIds.add(placedPiece.pieceId);
      this.addCellsToSet(occupiedKeys, this.getAbsoluteCells(piece, placedPiece));
    }

    if (usedPieceIds.has(candidate.pieceId)) {
      return {
        canPlace: false,
        canComplete: false,
        reason: 'occupied',
      };
    }

    const candidatePiece = puzzle.pieces.find((piece) => piece.id === candidate.pieceId);

    if (!candidatePiece) {
      return {
        canPlace: false,
        canComplete: false,
        reason: 'outside',
      };
    }

    const candidateCells = this.getAbsoluteCells(candidatePiece, candidate);
    const candidateConflict = this.findPlacementConflict(puzzle, candidateCells, occupiedKeys);

    if (candidateConflict) {
      return {
        canPlace: false,
        canComplete: false,
        reason: candidateConflict,
      };
    }

    usedPieceIds.add(candidate.pieceId);
    this.addCellsToSet(occupiedKeys, candidateCells);

    const context = this.createSolverContext(puzzle);
    const remainingPieceIds = new Set(
      puzzle.pieces.map((piece) => piece.id).filter((pieceId) => !usedPieceIds.has(pieceId)),
    );
    const unavailableCell = this.findUnavailableCell(context, remainingPieceIds, occupiedKeys);

    if (unavailableCell) {
      return {
        canPlace: true,
        canComplete: false,
        reason: 'no-fitting-piece',
        cell: unavailableCell,
      };
    }

    const completionCount = this.countCompletions(context, remainingPieceIds, occupiedKeys, 1);

    return completionCount > 0
      ? {
          canPlace: true,
          canComplete: true,
          reason: 'completable',
        }
      : {
          canPlace: true,
          canComplete: false,
          reason: 'dead-end',
        };
  }

  rotateCells(cells: GridCoordinate[], rotation: number): GridCoordinate[] {
    const normalizedRotation = ((rotation % 360) + 360) % 360;

    const rotated = cells.map((cell) => {
      if (normalizedRotation === 90) {
        return {
          row: cell.column,
          column: -cell.row,
        };
      }

      if (normalizedRotation === 180) {
        return {
          row: -cell.row,
          column: -cell.column,
        };
      }

      if (normalizedRotation === 270) {
        return {
          row: -cell.column,
          column: cell.row,
        };
      }

      return cell;
    });

    return this.normalizeCells(rotated);
  }

  getAbsoluteCells(piece: JigsawPiece, placedPiece: PlacedJigsawPiece): GridCoordinate[] {
    const rotatedCells = this.rotateCells(piece.cells, placedPiece.rotation);

    return rotatedCells.map((cell) => ({
      row: placedPiece.anchor.row + cell.row,
      column: placedPiece.anchor.column + cell.column,
    }));
  }

  areSameCell(first: GridCoordinate, second: GridCoordinate): boolean {
    return first.row === second.row && first.column === second.column;
  }

  cellKey(cell: GridCoordinate): string {
    return `${cell.row}:${cell.column}`;
  }

  private createSolverContext(puzzle: JigsawPuzzle): SolverContext {
    const blockedCellKeys = new Set(puzzle.blockedCells.map((cell) => this.cellKey(cell)));
    const fillableCells = Array.from({ length: puzzle.size * puzzle.size }, (_, index) => ({
      row: Math.floor(index / puzzle.size),
      column: index % puzzle.size,
    })).filter((cell) => !blockedCellKeys.has(this.cellKey(cell)));
    const optionsByCell = new Map<string, PlacementOption[]>(
      fillableCells.map((cell) => [this.cellKey(cell), []]),
    );

    for (const piece of puzzle.pieces) {
      for (const option of this.createPlacementOptions(puzzle, piece, blockedCellKeys)) {
        for (const cellKey of option.cellKeys) {
          optionsByCell.get(cellKey)?.push(option);
        }
      }
    }

    return {
      fillableCells,
      optionsByCell,
      memo: new Map(),
    };
  }

  private createPlacementOptions(
    puzzle: JigsawPuzzle,
    piece: JigsawPiece,
    blockedCellKeys: Set<string>,
  ): PlacementOption[] {
    const options: PlacementOption[] = [];
    const rotations = [0, 90, 180, 270];
    const seenCellSets = new Set<string>();

    for (const rotation of rotations) {
      for (let row = 0; row < puzzle.size; row += 1) {
        for (let column = 0; column < puzzle.size; column += 1) {
          const placement: PlacedJigsawPiece = {
            pieceId: piece.id,
            anchor: { row, column },
            rotation,
          };
          const cells = this.getAbsoluteCells(piece, placement);

          if (
            !cells.every(
              (cell) =>
                cell.row >= 0 &&
                cell.column >= 0 &&
                cell.row < puzzle.size &&
                cell.column < puzzle.size &&
                !blockedCellKeys.has(this.cellKey(cell)),
            )
          ) {
            continue;
          }

          const cellKeys = cells.map((cell) => this.cellKey(cell));
          const cellSetKey = [...cellKeys].sort().join('|');

          if (seenCellSets.has(cellSetKey)) {
            continue;
          }

          seenCellSets.add(cellSetKey);
          options.push({
            pieceId: piece.id,
            anchor: { row, column },
            rotation,
            cellKeys,
          });
        }
      }
    }

    return options;
  }

  private countCompletions(
    context: SolverContext,
    remainingPieceIds: Set<string>,
    occupiedKeys: Set<string>,
    limit: number,
  ): number {
    if (occupiedKeys.size === context.fillableCells.length) {
      return remainingPieceIds.size === 0 ? 1 : 0;
    }

    if (remainingPieceIds.size === 0) {
      return 0;
    }

    const stateKey = this.solverStateKey(remainingPieceIds, occupiedKeys);
    const cachedCount = context.memo.get(stateKey);

    if (cachedCount !== undefined) {
      return cachedCount;
    }

    const constrainedCell = this.findMostConstrainedCell(context, remainingPieceIds, occupiedKeys);

    if (!constrainedCell || constrainedCell.options.length === 0) {
      context.memo.set(stateKey, 0);
      return 0;
    }

    let total = 0;

    for (const option of constrainedCell.options) {
      const nextOccupiedKeys = new Set(occupiedKeys);
      this.addCellsToSet(nextOccupiedKeys, option.cellKeys);
      const nextRemainingPieceIds = new Set(remainingPieceIds);
      nextRemainingPieceIds.delete(option.pieceId);
      total += this.countCompletions(context, nextRemainingPieceIds, nextOccupiedKeys, limit);

      if (total >= limit) {
        context.memo.set(stateKey, limit);
        return limit;
      }
    }

    context.memo.set(stateKey, total);
    return total;
  }

  private findMostConstrainedCell(
    context: SolverContext,
    remainingPieceIds: Set<string>,
    occupiedKeys: Set<string>,
  ): { key: string; options: PlacementOption[] } | null {
    let mostConstrainedCell: { key: string; options: PlacementOption[] } | null = null;

    for (const cell of context.fillableCells) {
      const key = this.cellKey(cell);

      if (occupiedKeys.has(key)) {
        continue;
      }

      const options = (context.optionsByCell.get(key) ?? []).filter((option) =>
        this.canUseOption(option, remainingPieceIds, occupiedKeys),
      );

      if (!mostConstrainedCell || options.length < mostConstrainedCell.options.length) {
        mostConstrainedCell = { key, options };
      }

      if (options.length === 0) {
        break;
      }
    }

    return mostConstrainedCell;
  }

  private findUnavailableCell(
    context: SolverContext,
    remainingPieceIds: Set<string>,
    occupiedKeys: Set<string>,
  ): GridCoordinate | null {
    const cell = this.findMostConstrainedCell(context, remainingPieceIds, occupiedKeys);

    if (!cell || cell.options.length > 0) {
      return null;
    }

    return this.parseCellKey(cell.key);
  }

  private parseCellKey(key: string): GridCoordinate {
    const [row, column] = key.split(':').map(Number);

    return { row, column };
  }

  private canUseOption(
    option: PlacementOption,
    remainingPieceIds: Set<string>,
    occupiedKeys: Set<string>,
  ): boolean {
    return (
      remainingPieceIds.has(option.pieceId) &&
      option.cellKeys.every((cellKey) => !occupiedKeys.has(cellKey))
    );
  }

  private solverStateKey(remainingPieceIds: Set<string>, occupiedKeys: Set<string>): string {
    return `${[...remainingPieceIds].sort().join(',')}|${[...occupiedKeys].sort().join(',')}`;
  }

  private findPlacementConflict(
    puzzle: JigsawPuzzle,
    cells: GridCoordinate[],
    occupiedKeys: Set<string>,
  ): PlacementConflict | null {
    const blockedCellKeys = new Set(puzzle.blockedCells.map((cell) => this.cellKey(cell)));

    for (const cell of cells) {
      if (
        cell.row < 0 ||
        cell.column < 0 ||
        cell.row >= puzzle.size ||
        cell.column >= puzzle.size
      ) {
        return 'outside';
      }

      const cellKey = this.cellKey(cell);

      if (blockedCellKeys.has(cellKey)) {
        return 'blocked';
      }

      if (occupiedKeys.has(cellKey)) {
        return 'occupied';
      }
    }

    return null;
  }

  private addCellsToSet(target: Set<string>, cells: GridCoordinate[] | string[]): void {
    for (const cell of cells) {
      target.add(typeof cell === 'string' ? cell : this.cellKey(cell));
    }
  }

  private createRandomBlockedCells(): GridCoordinate[] {
    const allCells = Array.from({ length: this.gridSize * this.gridSize }, (_, index) => ({
      row: Math.floor(index / this.gridSize),
      column: index % this.gridSize,
    }));

    return this.shuffle(allCells).slice(0, this.blockedCellCount);
  }

  private getFillableCells(blockedCells: GridCoordinate[]): GridCoordinate[] {
    const blockedCellKeys = new Set(blockedCells.map((cell) => this.cellKey(cell)));

    return Array.from({ length: this.gridSize * this.gridSize }, (_, index) => ({
      row: Math.floor(index / this.gridSize),
      column: index % this.gridSize,
    })).filter((cell) => !blockedCellKeys.has(this.cellKey(cell)));
  }

  private partitionCellsIntoPieces(cells: GridCoordinate[]): GeneratedPiece[] | null {
    const targetSizes = this.shuffle([5, 5, 5, 6, 6, 6]);

    for (let attempt = 0; attempt < this.maxGenerationAttempts; attempt++) {
      const remainingCells = [...cells];
      const pieces: GeneratedPiece[] = [];

      let failed = false;

      for (const targetSize of targetSizes) {
        const pieceCells = this.carveConnectedPiece(remainingCells, targetSize);

        if (!pieceCells) {
          failed = true;
          break;
        }

        this.removeCells(remainingCells, pieceCells);
        pieces.push({ cells: pieceCells });

        if (!this.remainingCellsAreViable(remainingCells)) {
          failed = true;
          break;
        }
      }

      if (!failed && remainingCells.length === 0) {
        return pieces;
      }
    }

    return null;
  }

  private carveConnectedPiece(
    availableCells: GridCoordinate[],
    targetSize: number,
  ): GridCoordinate[] | null {
    if (availableCells.length < targetSize) {
      return null;
    }

    for (let attempt = 0; attempt < 100; attempt++) {
      const seed = this.getRandomItem(availableCells);
      const pieceCells = [seed];

      while (pieceCells.length < targetSize) {
        const frontier = this.shuffle(this.getPieceFrontier(pieceCells, availableCells));

        if (frontier.length === 0) {
          break;
        }

        pieceCells.push(frontier[0]);
      }

      if (pieceCells.length === targetSize) {
        return pieceCells;
      }
    }

    return null;
  }

  private remainingCellsAreViable(remainingCells: GridCoordinate[]): boolean {
    if (remainingCells.length === 0) {
      return true;
    }

    const components = this.getConnectedComponents(remainingCells);

    return components.every((component) => component.length === 0 || component.length >= 5);
  }

  private getPieceFrontier(
    pieceCells: GridCoordinate[],
    availableCells: GridCoordinate[],
  ): GridCoordinate[] {
    const pieceCellKeys = new Set(pieceCells.map((cell) => this.cellKey(cell)));
    const availableCellKeys = new Set(availableCells.map((cell) => this.cellKey(cell)));

    const frontier = new Map<string, GridCoordinate>();

    for (const cell of pieceCells) {
      for (const neighbor of this.getNeighbors(cell)) {
        const neighborKey = this.cellKey(neighbor);

        if (availableCellKeys.has(neighborKey) && !pieceCellKeys.has(neighborKey)) {
          frontier.set(neighborKey, neighbor);
        }
      }
    }

    return [...frontier.values()];
  }

  private createPieceFromCells(absoluteCells: GridCoordinate[], index: number): JigsawPiece {
    return {
      id: `piece-${index + 1}`,
      name: `Piece ${index + 1}`,
      color: this.colors[index % this.colors.length],
      cells: this.normalizeCells(absoluteCells),
    };
  }

  private createSolutionPlacement(
    absoluteCells: GridCoordinate[],
    pieceId: string,
  ): PlacedJigsawPiece {
    const minRow = Math.min(...absoluteCells.map((cell) => cell.row));
    const minColumn = Math.min(...absoluteCells.map((cell) => cell.column));

    return {
      pieceId,
      anchor: {
        row: minRow,
        column: minColumn,
      },
      rotation: 0,
    };
  }

  private getConnectedComponents(cells: GridCoordinate[]): GridCoordinate[][] {
    const remainingCellMap = new Map(cells.map((cell) => [this.cellKey(cell), cell]));

    const components: GridCoordinate[][] = [];

    while (remainingCellMap.size > 0) {
      const firstCell = remainingCellMap.values().next().value;
      const component: GridCoordinate[] = [];
      const queue: GridCoordinate[] = [firstCell!];

      remainingCellMap.delete(this.cellKey(firstCell!));

      while (queue.length > 0) {
        const cell = queue.shift()!;
        component.push(cell);

        for (const neighbor of this.getNeighbors(cell)) {
          const neighborKey = this.cellKey(neighbor);
          const remainingNeighbor = remainingCellMap.get(neighborKey);

          if (!remainingNeighbor) {
            continue;
          }

          remainingCellMap.delete(neighborKey);
          queue.push(remainingNeighbor);
        }
      }

      components.push(component);
    }

    return components;
  }

  private isConnectedGroup(cells: GridCoordinate[]): boolean {
    if (cells.length === 0) {
      return false;
    }

    return this.getConnectedComponents(cells).length === 1;
  }

  private getNeighbors(cell: GridCoordinate): GridCoordinate[] {
    return [
      {
        row: cell.row - 1,
        column: cell.column,
      },
      {
        row: cell.row + 1,
        column: cell.column,
      },
      {
        row: cell.row,
        column: cell.column - 1,
      },
      {
        row: cell.row,
        column: cell.column + 1,
      },
    ].filter(
      (neighbor) =>
        neighbor.row >= 0 &&
        neighbor.column >= 0 &&
        neighbor.row < this.gridSize &&
        neighbor.column < this.gridSize,
    );
  }

  private removeCells(sourceCells: GridCoordinate[], cellsToRemove: GridCoordinate[]): void {
    const keysToRemove = new Set(cellsToRemove.map((cell) => this.cellKey(cell)));

    for (let index = sourceCells.length - 1; index >= 0; index--) {
      if (keysToRemove.has(this.cellKey(sourceCells[index]))) {
        sourceCells.splice(index, 1);
      }
    }
  }

  private normalizeCells(cells: GridCoordinate[]): GridCoordinate[] {
    const minRow = Math.min(...cells.map((cell) => cell.row));
    const minColumn = Math.min(...cells.map((cell) => cell.column));

    return cells.map((cell) => ({
      row: cell.row - minRow,
      column: cell.column - minColumn,
    }));
  }

  private shuffle<T>(items: T[]): T[] {
    const shuffledItems = [...items];

    for (let index = shuffledItems.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));

      [shuffledItems[index], shuffledItems[swapIndex]] = [
        shuffledItems[swapIndex],
        shuffledItems[index],
      ];
    }

    return shuffledItems;
  }

  private getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }
}
