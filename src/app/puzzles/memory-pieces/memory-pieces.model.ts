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

export type MemorySilhouette =
  | 'pebble'
  | 'bean'
  | 'drop'
  | 'ribbon'
  | 'flower'
  | 'star'
  | 'rounded';
export type MemoryPieceLayout = 'fan' | 'center' | 'staggered' | 'bands' | 'scattered';

export type MemoryPiecesPuzzle = {
  silhouette: MemorySilhouette;
  layout: MemoryPieceLayout;
  outline: PiecePoint[];
  outlinePath: string;
  pieces: MemoryPuzzlePiece[];
  studyPieces: MemoryPieceShape[];
  choices: MemoryPieceShape[];
};

export const MEMORY_PIECE_COUNT = 5;
export const MEMORY_BOARD_SIZE = 100;
// Ten board units gives roughly a 10% landing zone around each target. It is
// forgiving enough for a visually aligned piece without accepting a neighboring slot.
export const MEMORY_SNAP_DISTANCE = 10;
