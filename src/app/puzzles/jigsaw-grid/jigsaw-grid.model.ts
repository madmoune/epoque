export type JigsawColor = 'purple' | 'green' | 'cyan' | 'orange' | 'pink' | 'yellow';

export type GridCoordinate = {
  row: number;
  column: number;
};

export type JigsawPiece = {
  id: string;
  name: string;
  color: JigsawColor;
  cells: GridCoordinate[];
};

export type PlacedJigsawPiece = {
  pieceId: string;
  anchor: GridCoordinate;
  rotation: number;
  locked?: boolean;
};

export type JigsawPuzzle = {
  size: number;
  blockedCells: GridCoordinate[];
  pieces: JigsawPiece[];
  solution: PlacedJigsawPiece[];
};

export type JigsawSolutionCount = {
  count: number;
  isCapped: boolean;
};

export type JigsawHint = {
  placement: PlacedJigsawPiece;
  focusCell: GridCoordinate;
  optionCount: number;
};

export type JigsawPlacementAnalysisReason =
  | 'outside'
  | 'blocked'
  | 'occupied'
  | 'no-fitting-piece'
  | 'dead-end'
  | 'completable';

export type JigsawPlacementAnalysis = {
  canPlace: boolean;
  canComplete: boolean;
  reason: JigsawPlacementAnalysisReason;
  cell?: GridCoordinate;
};
