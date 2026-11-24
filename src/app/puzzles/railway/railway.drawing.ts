import {
  RAIL_CELLS,
  RAIL_DIRECTIONS,
  RAIL_SIZE,
  railColumn,
  RailGate,
  RailPuzzle,
  railRow,
  RailSide,
  sideBetween,
} from './railway.logic';

const HALF_TILE = 32;
const BOARD_WIDTH = 2 * HALF_TILE * RAIL_SIZE;

export const RAIL_VIEWBOX = `0 0 ${BOARD_WIDTH} ${BOARD_WIDTH}`;

export function drawRailTiles(puzzle: RailPuzzle, neighbors: readonly (readonly number[])[]) {
  return RAIL_CELLS.flatMap((cell) => {
    const sides = neighbors[cell].map((neighbor) => sideBetween(cell, neighbor)!);
    if (cell === puzzle.start.cell) sides.push(puzzle.start.side);
    if (cell === puzzle.end.cell) sides.push(puzzle.end.side);
    if (sides.length === 0) return [];

    const [from, to] = sides;
    const draw = (offset: number) => {
      const stroke = railStroke(cell, from, to, offset);
      return `M ${stroke.start} ${stroke.segment}`;
    };
    return [{ cell, bed: draw(0), rails: `${draw(-5.5)} ${draw(5.5)}` }];
  });
}

export function drawRailRoute(puzzle: RailPuzzle, route: readonly number[]): string {
  return route
    .map((cell, index) => {
      const from = index === 0 ? puzzle.start.side : sideBetween(cell, route[index - 1])!;
      const to =
        index === route.length - 1 ? puzzle.end.side : sideBetween(cell, route[index + 1])!;
      const { start, segment } = railStroke(cell, from, to, 0);
      return index === 0 ? `M ${start} ${segment}` : segment;
    })
    .join(' ');
}

export function parkedTrain(gate: RailGate): string {
  const direction = RAIL_DIRECTIONS[gate.side];
  const { x, y } = centerOf(gate.cell);
  const angle = Math.atan2(-direction.y, -direction.x) * (180 / Math.PI);
  return `translate(${x + 12 * direction.x} ${y + 12 * direction.y}) rotate(${angle})`;
}

function railStroke(cell: number, from: RailSide, to: RailSide | undefined, offset: number) {
  const { x, y } = centerOf(cell);
  const entry = RAIL_DIRECTIONS[from];
  const start = `${x + HALF_TILE * entry.x + offset * entry.y} ${y + HALF_TILE * entry.y - offset * entry.x}`;
  if (to === undefined) {
    return { start, segment: `L ${x + offset * entry.y} ${y - offset * entry.x}` };
  }

  const exit = RAIL_DIRECTIONS[to];
  const end = `${x + HALF_TILE * exit.x - offset * exit.y} ${y + HALF_TILE * exit.y + offset * exit.x}`;
  const turn = entry.y * exit.x - entry.x * exit.y;
  const radius = HALF_TILE - offset * turn;
  return {
    start,
    segment: turn === 0 ? `L ${end}` : `A ${radius} ${radius} 0 0 ${turn > 0 ? 1 : 0} ${end}`,
  };
}

function centerOf(cell: number): { x: number; y: number } {
  return { x: (2 * railColumn(cell) + 1) * HALF_TILE, y: (2 * railRow(cell) + 1) * HALF_TILE };
}
