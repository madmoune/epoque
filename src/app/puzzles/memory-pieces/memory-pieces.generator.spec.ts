import { describe, expect, it } from 'vitest';
import { canSnapPiece, createMemoryPiecesPuzzle } from './memory-pieces.generator';
import { MEMORY_SNAP_DISTANCE, MemoryPiecesPuzzle, PiecePoint } from './memory-pieces.model';

describe('memory pieces generation', () => {
  const samples = Array.from({ length: 120 }, (_, index) =>
    createMemoryPiecesPuzzle(seededRandom((index + 1) * 7919)),
  );

  it('offers the five memorized silhouettes unchanged among ten distinct choices', () => {
    for (const puzzle of samples) {
      expect(puzzle.pieces).toHaveLength(5);
      expect(puzzle.studyPieces).toHaveLength(5);
      expect(puzzle.choices).toHaveLength(10);
      expect(new Set(puzzle.choices.map((piece) => piece.id)).size).toBe(10);
      expect(new Set(puzzle.choices.map((piece) => piece.path)).size).toBe(10);
      for (const piece of puzzle.studyPieces) {
        expect(puzzle.choices.find((choice) => choice.id === piece.id)?.path).toBe(piece.path);
      }
      for (const piece of puzzle.pieces) {
        const decoy = puzzle.choices.find(
          (choice) => choice.id === piece.id.replace('piece-', 'decoy-'),
        )!;
        expect(decoy.width / decoy.height).not.toBeCloseTo(piece.width / piece.height, 3);
      }
    }
  });

  it('creates complementary pieces for every silhouette and layout with no gaps or overlaps', () => {
    expect(new Set(samples.map((puzzle) => `${puzzle.silhouette}/${puzzle.layout}`)).size).toBe(35);
    for (const puzzle of samples) {
      const polygons = puzzle.pieces.map((piece) =>
        piece.points.map((point) => ({ x: point.x + piece.target.x, y: point.y + piece.target.y })),
      );
      expect(polygons.reduce((sum, points) => sum + polygonArea(points), 0)).toBeCloseTo(
        polygonArea(puzzle.outline),
        6,
      );
      for (const points of polygons) {
        expect(polygonArea(points)).toBeGreaterThan(300);
        for (const point of points) {
          expect(point.x).toBeGreaterThanOrEqual(-1e-8);
          expect(point.y).toBeGreaterThanOrEqual(-1e-8);
          expect(point.x).toBeLessThanOrEqual(100 + 1e-8);
          expect(point.y).toBeLessThanOrEqual(100 + 1e-8);
        }
      }
      for (let x = 0.37; x < 100; x += 5) {
        for (let y = 0.61; y < 100; y += 5) {
          expect(polygons.filter((points) => containsPoint(points, { x, y }))).toHaveLength(
            containsPoint(puzzle.outline, { x, y }) ? 1 : 0,
          );
        }
      }
    }
  });

  it('removes square corners and varies the outer silhouette and piece arrangement', () => {
    const outlines = new Set<string>();
    const borderPieceCounts = new Set<number>();
    for (const puzzle of samples) {
      outlines.add(puzzle.outlinePath);
      borderPieceCounts.add(
        puzzle.pieces.filter((piece) =>
          piece.points.some((point) =>
            puzzle.outline.some(
              (outer) =>
                Math.hypot(point.x + piece.target.x - outer.x, point.y + piece.target.y - outer.y) <
                1e-6,
            ),
          ),
        ).length,
      );
      for (let index = 0; index < puzzle.outline.length; index++) {
        const point = puzzle.outline[index];
        const previous =
          puzzle.outline[(index + puzzle.outline.length - 1) % puzzle.outline.length];
        const next = puzzle.outline[(index + 1) % puzzle.outline.length];
        const incoming = { x: point.x - previous.x, y: point.y - previous.y };
        const outgoing = { x: next.x - point.x, y: next.y - point.y };
        const lengths = Math.hypot(incoming.x, incoming.y) * Math.hypot(outgoing.x, outgoing.y);
        if (lengths > 1e-10) {
          expect((incoming.x * outgoing.x + incoming.y * outgoing.y) / lengths).toBeGreaterThan(
            Math.cos(Math.PI / 4),
          );
        }
        expect(point.x).toBeGreaterThanOrEqual(6 - 1e-8);
        expect(point.y).toBeGreaterThanOrEqual(6 - 1e-8);
        expect(point.x).toBeLessThanOrEqual(94 + 1e-8);
        expect(point.y).toBeLessThanOrEqual(94 + 1e-8);
      }
    }
    expect(outlines.size).toBe(samples.length);
    expect(borderPieceCounts.size).toBeGreaterThanOrEqual(2);
  });

  it('varies elongation, concavity and which pieces connect, beyond small contour changes', () => {
    const proportions = samples.map((puzzle) => {
      const width = extent(puzzle.outline.map((point) => point.x));
      const height = extent(puzzle.outline.map((point) => point.y));
      return Math.max(width / height, height / width);
    });
    const compactness = samples.map((puzzle) => {
      const perimeter = puzzle.outline.reduce((sum, point, index) => {
        const next = puzzle.outline[(index + 1) % puzzle.outline.length];
        return sum + Math.hypot(next.x - point.x, next.y - point.y);
      }, 0);
      return (4 * Math.PI * polygonArea(puzzle.outline)) / perimeter ** 2;
    });
    expect(Math.max(...proportions)).toBeGreaterThan(1.8);
    expect(Math.min(...proportions)).toBeLessThan(1.15);
    expect(Math.min(...compactness)).toBeLessThan(0.5);
    expect(Math.max(...compactness)).toBeGreaterThan(0.8);
    const connections = new Set(samples.map(connectionSignature));
    expect(connections.has('1,1,2,2,2')).toBe(true);
    expect(connections.has('3,3,3,3,4')).toBe(true);
    expect(connections.size).toBeGreaterThanOrEqual(5);
  });

  it('changes silhouette and cut layout on consecutive rounds', () => {
    const random = seededRandom(2026);
    let previous = createMemoryPiecesPuzzle(random);
    for (let round = 0; round < 30; round++) {
      const next = createMemoryPiecesPuzzle(random, previous);
      expect(next.silhouette).not.toBe(previous.silhouette);
      expect(next.layout).not.toBe(previous.layout);
      previous = next;
    }
  });

  it('creates new shapes and independently shuffled lists for another round', () => {
    const first = createMemoryPiecesPuzzle(seededRandom(1));
    const second = createMemoryPiecesPuzzle(seededRandom(2));
    expect(first.pieces.map((piece) => piece.path)).not.toEqual(
      second.pieces.map((piece) => piece.path),
    );
    expect(first.studyPieces.map((piece) => piece.id)).not.toEqual(
      first.choices.filter((piece) => piece.id.startsWith('piece-')).map((piece) => piece.id),
    );
  });

  it('accepts a nearby placement and rejects distant or invalid coordinates', () => {
    const piece = createMemoryPiecesPuzzle(seededRandom(1)).pieces[0];
    const center = { x: piece.target.x + piece.width / 2, y: piece.target.y + piece.height / 2 };
    expect(canSnapPiece(piece, center)).toBe(true);
    expect(canSnapPiece(piece, { x: center.x + MEMORY_SNAP_DISTANCE - 0.1, y: center.y })).toBe(
      true,
    );
    expect(canSnapPiece(piece, { x: center.x + MEMORY_SNAP_DISTANCE + 0.1, y: center.y })).toBe(
      false,
    );
    expect(canSnapPiece(piece, { x: NaN, y: center.y })).toBe(false);
    expect(canSnapPiece(piece, { x: Infinity, y: center.y })).toBe(false);
  });
});

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function extent(values: number[]): number {
  return Math.max(...values) - Math.min(...values);
}

function connectionSignature(puzzle: MemoryPiecesPuzzle): string {
  const vertices = puzzle.pieces.map(
    (piece) =>
      new Set(
        piece.points.map(
          (point) =>
            `${(point.x + piece.target.x).toFixed(5)},${(point.y + piece.target.y).toFixed(5)}`,
        ),
      ),
  );
  return vertices
    .map(
      (points, index) =>
        vertices.filter(
          (other, otherIndex) =>
            otherIndex !== index && [...points].filter((key) => other.has(key)).length > 2,
        ).length,
    )
    .sort()
    .join(',');
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

function containsPoint(points: PiecePoint[], point: PiecePoint): boolean {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
    const first = points[index];
    const second = points[previous];
    if (
      first.y > point.y !== second.y > point.y &&
      point.x < ((second.x - first.x) * (point.y - first.y)) / (second.y - first.y) + first.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}
