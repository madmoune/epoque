export type PiecePoint = {
  x: number;
  y: number;
};

export type MemoryPieceShape = {
  id: string;
  points: PiecePoint[];
  path: string;
  width: number;
  height: number;
  viewBox: string;
};

export type MemoryPuzzlePiece = MemoryPieceShape & {
  target: PiecePoint;
};

export type MemoryPiecesPuzzle = {
  outline: PiecePoint[];
  outlinePath: string;
  pieces: MemoryPuzzlePiece[];
  studyPieces: MemoryPieceShape[];
  choices: MemoryPieceShape[];
};

export const MEMORY_PIECE_COUNT = 5;
export const MEMORY_BOARD_SIZE = 100;
export const MEMORY_SNAP_DISTANCE = 6;
