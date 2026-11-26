export type PolygonSize = 3 | 4 | 5 | 6;

type Layout = readonly [
  centerGap: number,
  firstRadius: number,
  secondRadius: number,
  firstAngle: number,
  secondAngle: number,
  tilt: number,
];

export interface StarChallenge {
  label: string;
  sizes: readonly [PolygonSize, PolygonSize];
  fallback: Layout;
}

export const STAR_CHALLENGES: readonly StarChallenge[] = [
  { label: 'Deux carrés', sizes: [4, 4], fallback: [25.12, 30.25, 30.05, 1.4058, 4.1365, 2.4105] },
  {
    label: 'Deux triangles',
    sizes: [3, 3],
    fallback: [25.58, 35.06, 27.8, 2.0896, 3.0803, 0.0711],
  },
  {
    label: 'Un triangle et un carré',
    sizes: [3, 4],
    fallback: [17.37, 31.05, 28.16, 2.0949, 1.5727, 5.2172],
  },
  {
    label: 'Un triangle et un pentagone',
    sizes: [3, 5],
    fallback: [21.17, 31.98, 29.28, 4.1949, 1.7787, 0.687],
  },
  {
    label: 'Un carré et un pentagone',
    sizes: [4, 5],
    fallback: [21.1, 35.41, 30.15, 2.0792, 4.0324, 3.6653],
  },
  {
    label: 'Un triangle et un hexagone',
    sizes: [3, 6],
    fallback: [26.76, 33.3, 26.04, 4.3148, 3.9389, 5.1709],
  },
  {
    label: 'Un carré et un hexagone',
    sizes: [4, 6],
    fallback: [17.77, 25.69, 30.88, 3.6926, 4.0345, 5.9616],
  },
  {
    label: 'Deux pentagones',
    sizes: [5, 5],
    fallback: [20.27, 33.99, 31.5, 4.8254, 3.6363, 2.9485],
  },
];

export function randomStarChallenge(previous?: StarChallenge, random = Math.random): StarChallenge {
  const candidates = STAR_CHALLENGES.filter((challenge) => challenge !== previous);
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return candidates[index];
}

interface Point {
  x: number;
  y: number;
}

interface StarPuzzle {
  stars: readonly Point[];
  outlines: readonly (readonly number[])[];
}

const FULL_TURN = 2 * Math.PI;
const MIN_STAR_DISTANCE = 15.5;
const EDGE_CLEARANCE = 3;

export function createStarPuzzle(challenge: StarChallenge, random = Math.random): StarPuzzle {
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const polygons = placePolygons(challenge.sizes, [
      16 + 18 * random(),
      25 + 11 * random(),
      25 + 11 * random(),
      FULL_TURN * random(),
      FULL_TURN * random(),
      FULL_TURN * random(),
    ]);
    if (isReadable(polygons)) return indexStars(polygons);
  }

  const [gap, radiusA, radiusB, angleA, angleB, tilt] = challenge.fallback;
  const quarterTurn = Math.floor(4 * random()) * (Math.PI / 2);
  return indexStars(
    placePolygons(challenge.sizes, [gap, radiusA, radiusB, angleA, angleB, tilt + quarterTurn]),
  );
}

export function nextStarInOutline(
  outline: readonly number[],
  drawn: readonly number[],
): number | null {
  if (!drawn.length) return outline[0];

  const start = outline.indexOf(drawn[0]);
  const size = outline.length;
  if (start < 0 || drawn.length > size) return null;

  for (const direction of [1, -1]) {
    const vertex = (offset: number) => outline[(start + size + offset * direction) % size];
    if (drawn.every((star, index) => star === vertex(index))) return vertex(drawn.length);
  }
  return null;
}

export function isRegularOutline(vertices: readonly Point[], tolerance = 1e-6): boolean {
  const size = vertices.length;
  if (size < 3) return false;
  const side = edges(vertices).reduce((sum, [a, b]) => sum + distance(a, b), 0) / size;
  const diagonal = side * 2 * Math.cos(Math.PI / size);
  const direction = Math.sign(cross(vertices[0], vertices[1], vertices[2]));

  return (
    direction !== 0 &&
    vertices.every((point, index) => {
      const next = vertices[(index + 1) % size];
      const after = vertices[(index + 2) % size];
      return (
        Math.sign(cross(point, next, after)) === direction &&
        Math.abs(distance(point, next) - side) < tolerance &&
        Math.abs(distance(point, after) - diagonal) < tolerance
      );
    })
  );
}

function placePolygons(
  [firstSize, secondSize]: StarChallenge['sizes'],
  [gap, radiusA, radiusB, angleA, angleB, tilt]: Layout,
): readonly [Point[], Point[]] {
  const offsetX = (gap / 2) * Math.cos(tilt);
  const offsetY = (gap / 2) * Math.sin(tilt);
  const first = regularPolygon(firstSize, radiusA, angleA + tilt, -offsetX, -offsetY);
  const second = regularPolygon(secondSize, radiusB, angleB + tilt, offsetX, offsetY);
  const points = [...first, ...second];
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = 80 / Math.max(maxX - minX, maxY - minY);
  const center = ({ x, y }: Point): Point => ({
    x: 50 + (x - (minX + maxX) / 2) * scale,
    y: 50 + (y - (minY + maxY) / 2) * scale,
  });
  return [first.map(center), second.map(center)];
}

function regularPolygon(
  size: PolygonSize,
  radius: number,
  angle: number,
  centerX: number,
  centerY: number,
): Point[] {
  return Array.from({ length: size }, (_, index) => {
    const theta = angle + (index * FULL_TURN) / size;
    return { x: centerX + radius * Math.cos(theta), y: centerY + radius * Math.sin(theta) };
  });
}

function indexStars(polygons: readonly (readonly Point[])[]): StarPuzzle {
  const stars = polygons.flat().sort((a, b) => a.y - b.y || a.x - b.x);
  return {
    stars,
    outlines: polygons.map((polygon) => polygon.map((point) => stars.indexOf(point))),
  };
}

function isReadable([first, second]: readonly [Point[], Point[]]): boolean {
  const stars = [...first, ...second];
  if (
    stars.some((point, index) =>
      stars.slice(index + 1).some((other) => distance(point, other) < MIN_STAR_DISTANCE),
    )
  ) {
    return false;
  }

  const firstEdges = edges(first);
  const secondEdges = edges(second);
  return (
    firstEdges.every(([a, b]) => second.every((point) => clearsEdge(a, b, point))) &&
    secondEdges.every(([a, b]) => first.every((point) => clearsEdge(a, b, point))) &&
    firstEdges.some(([a, b]) =>
      secondEdges.some(
        ([c, d]) => cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0,
      ),
    ) &&
    !hasSimilarPolygon(stars, first.length, second.length)
  );
}

function edges(points: readonly Point[]): [Point, Point][] {
  return points.map((point, index) => [point, points[(index + 1) % points.length]]);
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function cross(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function clearsEdge(a: Point, b: Point, point: Point): boolean {
  const length = distance(a, b);
  const projection = ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / length;
  return (
    projection <= 0 ||
    projection >= length ||
    Math.abs(cross(a, b, point)) / length >= EDGE_CLEARANCE
  );
}

function hasSimilarPolygon(
  stars: readonly Point[],
  firstSize: number,
  secondSize: number,
): boolean {
  function hasMixedSubset(size: number, start: number, indices: readonly number[]): boolean {
    if (indices.length === size) {
      return (
        indices[0] < firstSize &&
        indices[size - 1] >= firstSize &&
        looksRegular(indices.map((index) => stars[index]))
      );
    }

    for (let index = start; index <= stars.length - (size - indices.length); index += 1) {
      if (hasMixedSubset(size, index + 1, [...indices, index])) return true;
    }
    return false;
  }

  return [...new Set([firstSize, secondSize])].some((size) => hasMixedSubset(size, 0, []));
}

function looksRegular(vertices: readonly Point[]): boolean {
  const size = vertices.length;
  const centerX = vertices.reduce((sum, point) => sum + point.x, 0) / size;
  const centerY = vertices.reduce((sum, point) => sum + point.y, 0) / size;
  const angle = ({ x, y }: Point) => Math.atan2(y - centerY, x - centerX);
  const ring = [...vertices].sort((a, b) => angle(a) - angle(b));

  // Leave a visual margin between a solution and any outline mixing both sets of stars.
  return isRegularOutline(ring, 3.5);
}
