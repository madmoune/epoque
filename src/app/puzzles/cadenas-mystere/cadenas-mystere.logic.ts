import { Mechanic, MysteryRound, pick } from './cadenas-mystere.model';
import { COLLECTION_GRID_MECHANICS } from './collection-grilles';
import { COLLECTION_ROUTE_MECHANICS } from './collection-parcours';
import { COLLECTION_SYMBOL_MECHANICS } from './collection-symboles';
import { DEDUCTION_MECHANICS } from './deductions';
import { GEOMETRY_MECHANICS } from './geometrie';
import { GRID_MECHANICS } from './grilles';
import { NUMBER_MECHANICS } from './nombres';
import { SPATIAL_MECHANICS } from './spatial';
import { SYMBOL_MECHANICS } from './symboles';
import { STROKE_MECHANICS } from './traits';

export const MYSTERY_MECHANICS: readonly Mechanic[] = [
  ...GEOMETRY_MECHANICS,
  ...SPATIAL_MECHANICS,
  ...SYMBOL_MECHANICS,
  ...NUMBER_MECHANICS,
  ...GRID_MECHANICS,
  ...DEDUCTION_MECHANICS,
  ...COLLECTION_SYMBOL_MECHANICS,
  ...COLLECTION_ROUTE_MECHANICS,
  ...COLLECTION_GRID_MECHANICS,
  ...STROKE_MECHANICS,
];

export function createMysteryRound(previousTitle?: string): MysteryRound {
  const { title, generate } = pick(
    MYSTERY_MECHANICS.filter((mechanic) => mechanic.title !== previousTitle),
  );
  return { title, ...generate() };
}
