import {
  cellsForSize,
  RAIL_DIRECTIONS,
  railColumn,
  RailBoardSize,
  RailGate,
  RailPuzzle,
  railRow,
  RailSide,
  sideBetween,
} from './railway.logic';

const HALF_TILE = 32;

export function railViewBox(size: RailBoardSize): string {
  return `0 0 ${2 * HALF_TILE * size.columns} ${2 * HALF_TILE * size.rows}`;
}

export function drawRailTiles(puzzle: RailPuzzle, neighbors: readonly (readonly number[])[]) {
  return cellsForSize(puzzle.size).flatMap((cell) => {
    const sides = neighbors[cell].map((neighbor) => sideBetween(cell, neighbor, puzzle.size)!);
    if (cell === puzzle.start.cell) sides.push(puzzle.start.side);
    if (cell === puzzle.end.cell) sides.push(puzzle.end.side);
    if (sides.length === 0) return [];

    const [from, to] = sides;
    const draw = (offset: number) => {
      const stroke = railStroke(cell, from, to, puzzle.size, offset);
      return `M ${stroke.start} ${stroke.segment}`;
    };
    return [{ cell, bed: draw(0), rails: `${draw(-5.5)} ${draw(5.5)}` }];
  });
}

export function drawRailRoute(puzzle: RailPuzzle, route: readonly number[]): string {
  return route
    .map((cell, index) => {
      const from =
        index === 0 ? puzzle.start.side : sideBetween(cell, route[index - 1], puzzle.size)!;
      const to =
        index === route.length - 1
          ? puzzle.end.side
          : sideBetween(cell, route[index + 1], puzzle.size)!;
      const { start, segment } = railStroke(cell, from, to, puzzle.size, 0);
      return index === 0 ? `M ${start} ${segment}` : segment;
    })
    .join(' ');
}

export function parkedTrain(gate: RailGate, size: RailBoardSize): string {
  const direction = RAIL_DIRECTIONS[gate.side];
  const { x, y } = centerOf(gate.cell, size);
  const angle = Math.atan2(-direction.y, -direction.x) * (180 / Math.PI);
  return `translate(${x + 12 * direction.x} ${y + 12 * direction.y}) rotate(${angle})`;
}

function railStroke(
  cell: number,
  from: RailSide,
  to: RailSide | undefined,
  size: RailBoardSize,
  offset: number,
) {
  const { x, y } = centerOf(cell, size);
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

function centerOf(cell: number, size: RailBoardSize): { x: number; y: number } {
  return {
    x: (2 * railColumn(cell, size) + 1) * HALF_TILE,
    y: (2 * railRow(cell, size) + 1) * HALF_TILE,
  };
}
