import { PuzzleType } from './lab.model';
import { CountBySymbolPuzzleType } from './puzzle-types/count-by-symbol.puzzle-type';

export const LAB_PUZZLE_TYPES: PuzzleType[] = [new CountBySymbolPuzzleType()];
