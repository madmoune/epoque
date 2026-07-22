import { PuzzleType } from './lab.model';
import { CountBySymbolPuzzleType } from './puzzle-types/count-by-symbol.puzzle-type';
import { GeometricShapesPuzzleType } from './puzzle-types/geometric-shapes.puzzle-type';
import { SevenSegmentPuzzleType } from './puzzle-types/seven-segment.puzzle-type';
import { NavigationPuzzleType } from './puzzle-types/navigation.puzzle-type';
import { ClockLettersPuzzleType } from './puzzle-types/clock-letters.puzzle-type';
import { FauxWordsPuzzleType } from './puzzle-types/faux-words.puzzle-type';

export const LAB_PUZZLE_TYPES: PuzzleType[] = [
  new CountBySymbolPuzzleType(),
  new GeometricShapesPuzzleType(),
  new SevenSegmentPuzzleType(),
  new NavigationPuzzleType(),
  new ClockLettersPuzzleType(),
  new FauxWordsPuzzleType(),
];
