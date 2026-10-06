import {
  MEMORY_BOARD_SIZE,
  MEMORY_SNAP_DISTANCE,
  MemoryPieceShape,
  MemoryPiecesPuzzle,
  MemoryPuzzlePiece,
  PiecePoint,
} from './memory-pieces.model';

type RandomSource = () => number;
type SharedEdge = {
  start: PiecePoint;
  end: PiecePoint;
  cells: PiecePoint[][];
  points: PiecePoint[];
};

export function createMemoryPiecesPuzzle(random: RandomSource = Math.random): MemoryPiecesPuzzle {
  const partition = createPartition(random);
  const pieces = partition.cells.map((points, index) => createPiece(points, `piece-${index}`));
  const decoys = pieces.map((piece, index) => createDecoy(piece, index, random));

  return {
    outline: partition.outline,
    outlinePath: polygonPath(partition.outline),
    pieces,
    studyPieces: shuffle(pieces, random),
    choices: shuffle([...pieces, ...decoys], random),
  };
}

export function canSnapPiece(piece: MemoryPuzzlePiece, center: PiecePoint): boolean {
  return (
    Number.isFinite(center.x) &&
    Number.isFinite(center.y) &&
    Math.hypot(
      center.x - (piece.target.x + piece.width / 2),
      center.y - (piece.target.y + piece.height / 2),
    ) <= MEMORY_SNAP_DISTANCE
  );
}

function createPartition(random: RandomSource): { cells: PiecePoint[][]; outline: PiecePoint[] } {
  const ringCount = random() < 0.5 ? 5 : 4;
  const startAngle = between(0, Math.PI * 2, random);
  const sites = Array.from({ length: ringCount }, (_, index) => {
    const angle = startAngle + (index * Math.PI * 2) / ringCount + between(-0.16, 0.16, random);
    const radius = between(26, 34, random);
    return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
  });
  if (ringCount === 4) {
    sites.push({ x: between(44, 56, random), y: between(44, 56, random) });
  }
  const cells = sites.map((site) => {
    let points: PiecePoint[] = [
      { x: 0, y: 0 },
      { x: MEMORY_BOARD_SIZE, y: 0 },
      { x: MEMORY_BOARD_SIZE, y: MEMORY_BOARD_SIZE },
      { x: 0, y: MEMORY_BOARD_SIZE },
    ];

    for (const other of sites) {
      if (other === site) continue;
      const normal = { x: other.x - site.x, y: other.y - site.y };
      const limit = (other.x * other.x + other.y * other.y - site.x * site.x - site.y * site.y) / 2;
      points = clipPolygon(points, normal, limit);
    }

    return points;
  });

  // Build each shared cut once, then reuse it in opposite directions. Deforming
  // this whole partition preserves its complementary boundaries.
  const edges = new Map<string, SharedEdge>();
  for (const cell of cells) {
    cell.forEach((start, index) => {
      const end = cell[(index + 1) % cell.length];
      const key = edgeKey(start, end);
      const edge = edges.get(key);
      if (edge) {
        edge.cells.push(cell);
      } else {
        edges.set(key, { start, end, cells: [cell], points: [start, end] });
      }
    });
  }

  for (const [key, edge] of edges) {
    if (edge.cells.length !== 2) continue;
    const dx = edge.end.x - edge.start.x;
    const dy = edge.end.y - edge.start.y;
    const length = Math.hypot(dx, dy);
    if (length < 10) continue;
    const depth = Math.min(between(6, 10, random), length * 0.18);
    const direction = random() < 0.5 ? -1 : 1;
    const waveCount = random() < 0.5 ? 1 : 2;
    edge.points = [
      edge.start,
      ...Array.from({ length: 23 }, (_, index) => {
        const fraction = (index + 1) / 24;
        const point = interpolate(edge.start, edge.end, fraction);
        let clearance = Infinity;
        for (const cell of edge.cells) {
          cell.forEach((start, index) => {
            const end = cell[(index + 1) % cell.length];
            if (edgeKey(start, end) === key) return;
            const sideLength = Math.hypot(end.x - start.x, end.y - start.y);
            if (sideLength > 0) {
              clearance = Math.min(
                clearance,
                Math.abs(
                  (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x),
                ) / sideLength,
              );
            }
          });
        }
        const offset =
          Math.min(depth, clearance * 0.35) *
          Math.sin(Math.PI * fraction) ** 2 *
          Math.sin(Math.PI * fraction * waveCount) *
          direction;
        return {
          x: point.x - (dy / length) * offset,
          y: point.y + (dx / length) * offset,
        };
      }),
      edge.end,
    ];
  }

  const warp = createOrganicWarp(random);
  for (const edge of edges.values()) {
    edge.points = sampleEdge(edge.points).map(warp);
  }
  const allPoints = [...edges.values()].flatMap((edge) => edge.points);
  const minX = Math.min(...allPoints.map((point) => point.x));
  const minY = Math.min(...allPoints.map((point) => point.y));
  const maxX = Math.max(...allPoints.map((point) => point.x));
  const maxY = Math.max(...allPoints.map((point) => point.y));
  const scale = 88 / Math.max(maxX - minX, maxY - minY);
  for (const edge of edges.values()) {
    edge.points = edge.points.map((point) => ({
      x: 50 + (point.x - (minX + maxX) / 2) * scale,
      y: 50 + (point.y - (minY + maxY) / 2) * scale,
    }));
  }

  const outline = [...edges.values()]
    .filter((edge) => edge.cells.length === 1)
    .sort((first, second) => perimeterPosition(first.start) - perimeterPosition(second.start))
    .flatMap((edge) => edge.points.slice(0, -1));
  const warpedCells = cells.map((cell) =>
    cell.flatMap((start, index) => {
      const edge = edges.get(edgeKey(start, cell[(index + 1) % cell.length]))!;
      const points =
        pointKey(start) === pointKey(edge.start) ? edge.points : [...edge.points].reverse();
      return points.slice(0, -1);
    }),
  );
  return { cells: warpedCells, outline };
}

function createOrganicWarp(random: RandomSource): (point: PiecePoint) => PiecePoint {
  const rotation = between(0, Math.PI * 2, random);
  const width = between(0.85, 1.15, random);
  const height = between(0.85, 1.15, random);
  const lobes = [
    { frequency: 3, depth: between(0.1, 0.16, random), phase: between(0, Math.PI * 2, random) },
    { frequency: 5, depth: between(0.05, 0.09, random), phase: between(0, Math.PI * 2, random) },
    { frequency: 7, depth: between(0.02, 0.04, random), phase: between(0, Math.PI * 2, random) },
  ];

  return (point) => {
    const u = point.x / 50 - 1;
    const v = point.y / 50 - 1;
    // The square-to-disk map removes the four corner cues. A positive radial
    // deformation then gives both the outline and internal cuts an organic shape.
    const x = u * Math.sqrt(1 - (v * v) / 2);
    const y = v * Math.sqrt(1 - (u * u) / 2);
    const angle = Math.atan2(y, x);
    const contour =
      1 +
      lobes.reduce(
        (sum, lobe) => sum + lobe.depth * Math.sin(lobe.frequency * angle + lobe.phase),
        0,
      );
    const radius = Math.hypot(x, y) * contour;
    return {
      x: Math.cos(angle + rotation) * radius * width,
      y: Math.sin(angle + rotation) * radius * height,
    };
  };
}

function sampleEdge(points: PiecePoint[]): PiecePoint[] {
  return [
    ...points.slice(0, -1).flatMap((start, index) => {
      const end = points[index + 1];
      const divisions = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / 1.2));
      return Array.from({ length: divisions }, (_, step) =>
        interpolate(start, end, step / divisions),
      );
    }),
    points[points.length - 1],
  ];
}

function perimeterPosition(point: PiecePoint): number {
  if (Math.abs(point.y) < 1e-6) return point.x;
  if (Math.abs(point.x - 100) < 1e-6) return 100 + point.y;
  if (Math.abs(point.y - 100) < 1e-6) return 300 - point.x;
  return 400 - point.y;
}

function clipPolygon(points: PiecePoint[], normal: PiecePoint, limit: number): PiecePoint[] {
  const clipped: PiecePoint[] = [];
  const distance = (point: PiecePoint) => point.x * normal.x + point.y * normal.y - limit;

  points.forEach((start, index) => {
    const end = points[(index + 1) % points.length];
    const startDistance = distance(start);
    const endDistance = distance(end);
    if (startDistance <= 0) clipped.push(start);
    if (startDistance <= 0 !== endDistance <= 0) {
      clipped.push(interpolate(start, end, startDistance / (startDistance - endDistance)));
    }
  });

  return clipped;
}

function createPiece(points: PiecePoint[], id: string): MemoryPuzzlePiece {
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const width = Math.max(...points.map((point) => point.x)) - minX;
  const height = Math.max(...points.map((point) => point.y)) - minY;
  const localPoints = points.map((point) => ({ x: point.x - minX, y: point.y - minY }));

  return {
    id,
    points: localPoints,
    path: polygonPath(localPoints),
    width,
    height,
    viewBox: `-3 -3 ${width + 6} ${height + 6}`,
    target: { x: minX, y: minY },
  };
}

function createDecoy(
  piece: MemoryPuzzlePiece,
  index: number,
  random: RandomSource,
): MemoryPieceShape {
  // Alter the proportions, rather than the color or orientation: a decoy is
  // a different silhouette but remains visually plausible beside the originals.
  const stretch = between(0.62, 0.78, random);
  const points = piece.points.map((point) => ({
    x: point.x * (index % 2 === 0 ? stretch : 1),
    y: point.y * (index % 2 === 0 ? 1 : stretch),
  }));
  const { target: _target, ...shape } = createPiece(points, `decoy-${index}`);
  return shape;
}

function pointKey(point: PiecePoint): string {
  return `${point.x.toFixed(6)},${point.y.toFixed(6)}`;
}

function polygonPath(points: PiecePoint[]): string {
  return (
    points
      .map(
        (point, index) =>
          `${index === 0 ? 'M' : 'L'} ${Number(point.x.toFixed(3))} ${Number(point.y.toFixed(3))}`,
      )
      .join(' ') + ' Z'
  );
}

function edgeKey(start: PiecePoint, end: PiecePoint): string {
  return [pointKey(start), pointKey(end)].sort().join('|');
}

function interpolate(start: PiecePoint, end: PiecePoint, fraction: number): PiecePoint {
  return { x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction };
}

function between(min: number, max: number, random: RandomSource): number {
  return min + random() * (max - min);
}

function shuffle<T>(values: readonly T[], random: RandomSource): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const targetIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[targetIndex]] = [shuffled[targetIndex], shuffled[index]];
  }
  return shuffled;
}
