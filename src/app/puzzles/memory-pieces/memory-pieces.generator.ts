import {
  MEMORY_BOARD_SIZE,
  MEMORY_SNAP_DISTANCE,
  MemoryPieceShape,
  MemoryPieceLayout,
  MemoryPiecesPuzzle,
  MemoryPuzzlePiece,
  MemorySilhouette,
  PiecePoint,
} from './memory-pieces.model';

type RandomSource = () => number;
type SharedEdge = {
  start: PiecePoint;
  end: PiecePoint;
  cells: PiecePoint[][];
  points: PiecePoint[];
};
type Partition = { cells: PiecePoint[][]; outline: PiecePoint[] };

const SILHOUETTES: readonly MemorySilhouette[] = [
  'pebble',
  'bean',
  'drop',
  'ribbon',
  'flower',
  'star',
  'rounded',
];
const LAYOUTS: readonly MemoryPieceLayout[] = ['fan', 'center', 'staggered', 'bands', 'scattered'];

export function createMemoryPiecesPuzzle(
  random: RandomSource = Math.random,
  previous?: MemoryPiecesPuzzle,
): MemoryPiecesPuzzle {
  const silhouette = chooseDifferent(SILHOUETTES, previous?.silhouette, random);
  const layout = chooseDifferent(LAYOUTS, previous?.layout, random);
  const partition = createPartition(silhouette, layout, random);
  const pieces = partition.cells.map((points, index) => createPiece(points, `piece-${index}`));
  const decoys = pieces.map((piece, index) => createDecoy(piece, index, random));

  return {
    silhouette,
    layout,
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

function createPartition(
  silhouette: MemorySilhouette,
  layout: MemoryPieceLayout,
  random: RandomSource,
): Partition {
  const warp = createSilhouetteWarp(silhouette, random);
  let best: Partition | undefined;
  let bestArea = -Infinity;
  // Keep even the elongated silhouettes playable: reject tiny fragments and
  // choose the most balanced candidate if all bounded attempts are exhausted.
  for (let attempt = 0; attempt < 16; attempt++) {
    const cells = createCells(createSites(layout, random));
    const partition = shapePartition(cells, warp, random);
    const areas = partition.cells.map(polygonArea);
    const smallest = Math.min(...areas);
    if (smallest > bestArea) {
      best = partition;
      bestArea = smallest;
    }
    const total = areas.reduce((sum, area) => sum + area, 0);
    if (smallest >= 300 && smallest / total >= 0.085 && Math.max(...areas) / total <= 0.38) {
      return partition;
    }
  }
  return best!;
}

function createSites(layout: MemoryPieceLayout, random: RandomSource): PiecePoint[] {
  let sites: PiecePoint[];
  if (layout === 'fan' || layout === 'center') {
    const count = layout === 'center' ? 4 : 5;
    const startAngle = between(0, Math.PI * 2, random);
    sites = Array.from({ length: count }, (_, index) => {
      const angle = startAngle + (index * Math.PI * 2) / count + between(-0.22, 0.22, random);
      const radius = between(27, 39, random);
      return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
    });
    if (layout === 'center') {
      sites.push({ x: between(39, 61, random), y: between(39, 61, random) });
    }
    return sites;
  }

  if (layout === 'scattered') {
    sites = [];
    for (let attempt = 0; attempt < 100 && sites.length < 5; attempt++) {
      const candidate = { x: between(13, 87, random), y: between(13, 87, random) };
      if (sites.every((site) => Math.hypot(candidate.x - site.x, candidate.y - site.y) >= 24)) {
        sites.push(candidate);
      }
    }
    if (sites.length === 5) return sites;
  }

  const template =
    layout === 'bands'
      ? [
          { x: 15, y: 50 },
          { x: 32, y: 50 },
          { x: 50, y: 50 },
          { x: 68, y: 50 },
          { x: 85, y: 50 },
        ]
      : [
          { x: 20, y: 25 },
          { x: 50, y: 23 },
          { x: 80, y: 25 },
          { x: 32, y: 73 },
          { x: 70, y: 73 },
        ];
  const rotation = between(0, Math.PI * 2, random);
  return template.map((point) => {
    const x = point.x - 50 + between(-5, 5, random);
    const y = point.y - 50 + between(-8, 8, random);
    return {
      x: 50 + x * Math.cos(rotation) - y * Math.sin(rotation),
      y: 50 + x * Math.sin(rotation) + y * Math.cos(rotation),
    };
  });
}

function createCells(sites: PiecePoint[]): PiecePoint[][] {
  return sites.map((site) => {
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
}

function shapePartition(
  cells: PiecePoint[][],
  warp: (point: PiecePoint) => PiecePoint,
  random: RandomSource,
): Partition {
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
    const depth = Math.min(between(5, 13, random), length * 0.24);
    const direction = random() < 0.5 ? -1 : 1;
    const profile = createCutProfile(random);
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
        const offset = Math.min(depth, clearance * 0.35) * profile(fraction) * direction;
        return {
          x: point.x - (dy / length) * offset,
          y: point.y + (dx / length) * offset,
        };
      }),
      edge.end,
    ];
  }

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

function createCutProfile(random: RandomSource): (fraction: number) => number {
  const style = Math.floor(random() * 5);
  const center = between(0.35, 0.65, random);
  if (style === 0) return (t) => Math.sin(Math.PI * t) ** 2;
  if (style === 1) return (t) => Math.sin(2 * Math.PI * t) * Math.sin(Math.PI * t);
  if (style === 2) {
    return (t) => Math.sin(Math.PI * t) ** 2 * Math.exp(-(((t - center) / 0.14) ** 2));
  }
  const knots = style === 3 ? [0, 0, 0.85, 0.85, 0, 0] : [0, 0.65, -0.8, 0.9, -0.45, 0];
  return (t) => {
    const position = t * (knots.length - 1);
    const index = Math.min(Math.floor(position), knots.length - 2);
    return knots[index] + (knots[index + 1] - knots[index]) * (position - index);
  };
}

function createSilhouetteWarp(
  silhouette: MemorySilhouette,
  random: RandomSource,
): (point: PiecePoint) => PiecePoint {
  const rotation = between(0, Math.PI * 2, random);
  const phase = between(0, Math.PI * 2, random);
  const aspect =
    silhouette === 'ribbon'
      ? between(1.65, 2.1, random)
      : silhouette === 'rounded'
        ? between(1.1, 1.7, random)
        : silhouette === 'flower' || silhouette === 'star'
          ? between(0.9, 1.15, random)
          : between(1.05, 1.4, random);
  const width = Math.sqrt(aspect);
  const height = 1 / width;
  const frequency = 3 + Math.floor(random() * 3);
  const depth = between(0.22, 0.32, random);
  const rounding = between(3, 5, random);

  const contourAt = (angle: number): number => {
    const theta = angle + phase;
    switch (silhouette) {
      case 'bean': {
        const notchAngle = Math.atan2(Math.sin(theta), Math.cos(theta));
        return (
          1 +
          0.1 * Math.sin(2 * theta) +
          0.07 * Math.sin(3 * theta) -
          (depth + 0.15) * Math.exp(-((notchAngle / 0.48) ** 2))
        );
      }
      case 'drop':
        return 1 + 0.34 * Math.cos(theta) - 0.12 * Math.cos(2 * theta) + 0.04 * Math.sin(3 * theta);
      case 'ribbon':
        return 1 + 0.12 * Math.sin(2 * theta) + 0.08 * Math.cos(3 * theta);
      case 'flower':
        return 1 + depth * Math.cos(frequency * theta) + 0.03 * Math.cos(2 * frequency * theta);
      case 'star':
        return 0.78 + (depth + 0.3) * ((1 + Math.cos(frequency * theta)) / 2) ** 3;
      case 'rounded':
        return (
          (Math.abs(Math.cos(theta)) ** rounding + Math.abs(Math.sin(theta)) ** rounding) **
            (-1 / rounding) +
          0.025 * Math.sin(3 * theta)
        );
      default:
        return 1 + 0.06 * Math.sin(3 * theta) + 0.035 * Math.cos(5 * theta);
    }
  };

  return (point) => {
    const u = point.x / 50 - 1;
    const v = point.y / 50 - 1;
    // Map the whole partition to a disk, then deform it to the chosen contour.
    // Positive radii keep this map invertible, including for concave outlines.
    const x = u * Math.sqrt(1 - (v * v) / 2);
    const y = v * Math.sqrt(1 - (u * u) / 2);
    const angle = Math.atan2(y, x);
    const radius = Math.hypot(x, y) * contourAt(angle);
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

function chooseDifferent<T>(
  values: readonly T[],
  previous: T | undefined,
  random: RandomSource,
): T {
  const available = values.filter((value) => value !== previous);
  return available[Math.floor(random() * available.length)];
}

function polygonArea(points: PiecePoint[]): number {
  return (
    Math.abs(
      points.reduce((area, point, index) => {
        const next = points[(index + 1) % points.length];
        return area + point.x * next.y - next.x * point.y;
      }, 0),
    ) / 2
  );
}

function shuffle<T>(values: readonly T[], random: RandomSource): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const targetIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[targetIndex]] = [shuffled[targetIndex], shuffled[index]];
  }
  return shuffled;
}
