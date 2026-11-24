import { range, shuffle } from '../new-games/random';
import {
  CARDINAL,
  diagram,
  dot,
  ExplainedExercise,
  Exercise,
  individualRound,
  label,
  line,
  Mechanic,
  orientPoint,
  pick,
  Point,
  pointKey,
  randomInt,
  shiftPoint,
} from './cadenas-mystere.model';

type Segment = readonly [Point, Point];
type Edge = readonly [number, number];

function lineDrawing(segments: readonly Segment[]) {
  const coordinates = segments.map(
    ([from, to]) => `(${from.map(Math.round).join(', ')}) à (${to.map(Math.round).join(', ')})`,
  );
  return diagram(
    144,
    110,
    segments.map(([from, to]) => line(from, to)),
    `Segments sur un repère, origine en haut à gauche. ${coordinates.join(' ; ')}.`,
  );
}

function splitCases(cases: readonly ExplainedExercise[], solutionHint: string) {
  return individualRound(cases.slice(-4), {
    examples: cases.slice(0, -4),
    instruction: 'Déduis la règle à partir des exemples.',
    solutionHint,
    workedExample: cases[0],
  });
}

function intersections() {
  return splitCases(
    shuffle(range(10))
      .slice(0, 7)
      .map((digit) => {
        const levels = [27, 51, 75];
        const segments: Segment[] = levels.map((y) => [
          [13, y],
          [131, y],
        ]);
        let remaining = digit;
        const crossings = shuffle(
          range(3).map((i) => {
            const count = randomInt(Math.max(0, remaining - (2 - i) * 3), Math.min(3, remaining));
            remaining -= count;
            return count;
          }),
        );
        crossings.forEach((count, i) => {
          const x = 40 + i * 29 + randomInt(-3, 3);
          if (count === 0) {
            segments.push([
              [x, 75],
              [x, 95],
            ]);
          } else {
            const first = randomInt(0, 3 - count);
            segments.push([
              [x, levels[first] - 11],
              [x, levels[first + count - 1] + 11],
            ]);
          }
        });
        // These endpoints touch a horizontal line without passing through it.
        segments.push([
          [23, 10],
          [23, 27],
        ]);
        return {
          digit,
          clue: lineDrawing(segments),
          explanation: `Le premier trait vertical se termine en T. Pour les trois autres, de gauche à droite, le nombre de croisements est ${crossings.join(', ')}. On additionne ${crossings.join(' + ')} = ${digit}.`,
        };
      }),
    'Compte les points où un trait horizontal et un trait vertical se traversent. Écarte les jonctions en T, où un trait se termine sur l’autre.',
  );
}

function enclosedRegions() {
  return splitCases(
    shuffle(range(9).map((i) => i + 1))
      .slice(0, 7)
      .map((digit) => {
        const nested = digit >= 3 && randomInt(0, 1) === 1;
        const compartments = digit - Number(nested);
        const rowCount = randomInt(Math.ceil(compartments / 4), Math.min(3, compartments));
        const height = 66;
        const segments: Segment[] = [
          [
            [17, 19],
            [126, 19],
          ],
          [
            [126, 19],
            [126, 85],
          ],
          [
            [126, 85],
            [17, 85],
          ],
          [
            [17, 85],
            [17, 19],
          ],
          [
            [60, 85],
            [60, 99],
          ],
        ];
        let remaining = compartments;

        const regionCounts = range(rowCount).map((row) => {
          const rowsAfter = rowCount - row - 1;
          const columns = randomInt(
            Math.max(1, remaining - 4 * rowsAfter),
            Math.min(4, remaining - rowsAfter),
          );
          const top = 19 + Math.round((row * height) / rowCount);
          const bottom = 19 + Math.round(((row + 1) * height) / rowCount);
          const bounds = range(columns + 1).map(
            (column) => 17 + Math.round((column * 109) / columns),
          );
          if (row > 0)
            segments.push([
              [17, top],
              [126, top],
            ]);
          bounds.slice(1, -1).forEach((x) =>
            segments.push([
              [x, top],
              [x, bottom],
            ]),
          );
          if (row === 0 && nested) {
            const left = 23;
            const right = bounds[1] - 6;
            segments.push(
              [
                [left, top + 5],
                [right, top + 5],
              ],
              [
                [right, top + 5],
                [right, bottom - 5],
              ],
              [
                [right, bottom - 5],
                [left, bottom - 5],
              ],
              [
                [left, bottom - 5],
                [left, top + 5],
              ],
            );
          }
          remaining -= columns;
          return columns;
        });
        return {
          digit,
          clue: lineDrawing(segments),
          explanation: `En parcourant les bandes horizontales de haut en bas, le nombre de compartiments est ${regionCounts.join(', ')}.${nested ? ' Le petit contour fermé ajoute une région dans la première bande.' : ''} Cela donne ${[...regionCounts, ...(nested ? [1] : [])].join(' + ')} = ${digit}.`,
        };
      }),
    'Compte chaque espace entièrement entouré de traits. Un contour fermé à l’intérieur d’une région la divise en deux espaces distincts.',
  );
}

function triangles() {
  const shapes = [
    [2, 0],
    [2, 2],
    [3, 0],
    [3, 2],
    [3, 3],
    [4, 2],
    [4, 3],
  ];
  return splitCases(
    shuffle(shapes).map(([rays, crossbar]) => {
      const apex: Point = [randomInt(58, 86), 12];
      const base: Point[] = range(rays).map((i) => [18 + Math.round((i * 108) / (rays - 1)), 94]);
      const segments: Segment[] = [
        ...base.map((end): Segment => [apex, end]),
        [base[0], base.at(-1)!],
      ];
      if (crossbar) {
        const start = randomInt(0, rays - crossbar);
        const offset = pick([31, 40, 49]);
        const pointOnRay = (index: number): Point => [
          apex[0] + ((base[index][0] - apex[0]) * offset) / 82,
          apex[1] + offset,
        ];
        segments.push([pointOnRay(start), pointOnRay(start + crossbar - 1)]);
      }
      // Every triangle uses two rays and one horizontal base.
      const combinations = (n: number) => (n * (n - 1)) / 2;
      const bottom = combinations(rays);
      const middle = combinations(crossbar);
      const digit = bottom + middle;
      return {
        digit,
        clue: lineDrawing(segments),
        explanation: `Avec la base du bas, on choisit deux rayons parmi ${rays}, ce qui donne ${bottom} ${bottom === 1 ? 'triangle' : 'triangles'}.${middle ? ` Le trait du milieu relie ${crossbar} rayons et ajoute ${middle} ${middle === 1 ? 'triangle' : 'triangles'}. Le total est ${digit}.` : ''}`,
      };
    }),
    'Repère le sommet commun. Pour chaque trait horizontal, choisis deux segments qui relient ce trait au sommet pour former un triangle. Compte aussi les grands triangles qui contiennent des petits.',
  );
}

function polygonEdges(polygons: readonly (readonly Point[])[]) {
  const edges = new Map<string, { ends: Segment; count: number }>();
  const edgeKey = (from: Point, to: Point) => [pointKey(from), pointKey(to)].sort().join(':');
  for (const corners of polygons) {
    corners.forEach((from, i) => {
      const to = corners[(i + 1) % corners.length];
      const key = edgeKey(from, to);
      edges.set(key, { ends: [from, to], count: (edges.get(key)?.count ?? 0) + 1 });
    });
  }
  return {
    edges: [...edges.values()],
    hasEdge: (a: Point, b: Point) => edges.has(edgeKey(a, b)),
  };
}

function drawnCells(cells: readonly Point[]) {
  const { edges, hasEdge } = polygonEdges(
    cells.map(([x, y]): Point[] => [
      [x, y],
      [x + 1, y],
      [x + 1, y + 1],
      [x, y + 1],
    ]),
  );

  const minX = Math.min(...cells.map(([x]) => x));
  const maxX = Math.max(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  const maxY = Math.max(...cells.map(([, y]) => y));
  const unit = Math.min(28, 82 / (maxY - minY + 1), 116 / (maxX - minX + 1));
  const scale = ([x, y]: Point): Point => [
    72 + (x - (minX + maxX + 1) / 2) * unit,
    54 + (y - (minY + maxY + 1) / 2) * unit,
  ];
  const drawn = edges.map(({ ends: [from, to] }): Segment => [scale(from), scale(to)]);
  return { edges, hasEdge, clue: lineDrawing(drawn) };
}

function growCells(cells: Point[], count: number, size: number): Point[] {
  const occupied = new Set(cells.map(pointKey));
  while (cells.length < count) {
    const candidates = cells
      .flatMap((point) => CARDINAL.map((delta) => shiftPoint(point, delta)))
      .filter(
        ([x, y]) => x >= 0 && y >= 0 && x < size && y < size && !occupied.has(pointKey([x, y])),
      );
    const next = pick(candidates);
    occupied.add(pointKey(next));
    cells.push(next);
  }
  return cells;
}

function hiddenSquares() {
  // The demonstration has eight unit squares, more than any challenge can have.
  const orientation = randomInt(0, 7);
  const example: Point[] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
    [2, 2],
    [3, 2],
    [3, 3],
    [2, 3],
  ];
  return splitCases(
    range(7).map((index) => {
      const block: Point[] = [
        [1, 1],
        [1, 2],
        [2, 1],
        [2, 2],
      ];
      const cells =
        index === 0
          ? example.map((point) => orientPoint(point, 4, orientation))
          : growCells(index % 2 ? block : [[1, 1]], randomInt(index % 2 ? 4 : 1, 7), 4);
      const { hasEdge, clue } = drawnCells(cells);
      const counts = [0, 0, 0, 0];
      for (const y of range(4))
        for (const x of range(4)) {
          for (let size = 1; x + size <= 4 && y + size <= 4; size++) {
            if (
              range(size).every(
                (i) =>
                  hasEdge([x + i, y], [x + i + 1, y]) &&
                  hasEdge([x + i, y + size], [x + i + 1, y + size]) &&
                  hasEdge([x, y + i], [x, y + i + 1]) &&
                  hasEdge([x + size, y + i], [x + size, y + i + 1]),
              )
            )
              counts[size - 1]++;
          }
        }
      const digit = counts.reduce((total, count) => total + count, 0);
      const sizes = counts.flatMap((count, i) => (count ? [`${count} de côté ${i + 1}`] : []));
      return {
        digit,
        clue,
        explanation: `En balayant la figure, tu peux compter les carrés par longueur de côté. On en trouve ${sizes.join(', ')}. Cela donne ${digit} ${digit === 1 ? 'carré' : 'carrés'} au total.`,
      };
    }),
    'Compte les petits carrés, puis les carrés plus grands dont chaque côté est formé de plusieurs segments. Vérifie que leurs quatre côtés sont complets et de même longueur.',
  );
}

function perimeter() {
  const square = (count: number): Exercise => {
    const cells =
      count === 4
        ? drawnCells([
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ])
        : drawnCells(growCells([[1, 1]], count, 4));
    return { digit: cells.edges.filter(({ count }) => count === 1).length, clue: cells.clue };
  };
  const triangular = (count: number): Exercise => {
    const shapes = range(count).map((i): Point[] => {
      const x = Math.floor(i / 2);
      return i % 2
        ? [
            [x, 1],
            [x + 1, 0],
            [x + 1, 1],
          ]
        : [
            [x, 0],
            [x + 1, 0],
            [x, 1],
          ];
    });
    const { edges } = polygonEdges(shapes);
    const angle = (randomInt(0, 5) * Math.PI) / 3;
    const rotate = ([x, y]: Point): Point => {
      const a = x + y / 2;
      const b = (y * Math.sqrt(3)) / 2;
      return [a * Math.cos(angle) - b * Math.sin(angle), a * Math.sin(angle) + b * Math.cos(angle)];
    };
    const corners = shapes.flat().map(rotate);
    const xs = corners.map(([x]) => x);
    const ys = corners.map(([, y]) => y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const unit = Math.min(27, 82 / (Math.max(...ys) - Math.min(...ys)));
    const toScreen = (point: Point): Point => {
      const [x, y] = rotate(point);
      return [72 + (x - cx) * unit, 54 + (y - cy) * unit];
    };
    return {
      digit: edges.filter(({ count }) => count === 1).length,
      clue: lineDrawing(edges.map(({ ends: [a, b] }) => [toScreen(a), toScreen(b)])),
    };
  };
  const tasks = shuffle([square(1), square(3), ...[1, 2, 4, 5, 6, 7].map(triangular)]).slice(0, 4);
  const examples = [square(2), square(4), triangular(3)];
  return individualRound(tasks, {
    examples,
    instruction: 'Déduis la règle à partir des exemples. Les jonctions délimitent les allumettes.',
    solutionHint:
      'Suis le contour extérieur et compte chaque allumette entre deux jonctions. Les allumettes partagées par deux formes sont à l’intérieur du contour.',
    workedExample: {
      clue: examples[0].clue,
      explanation:
        'Les deux carrés ont quatre côtés chacun. Le côté partagé est intérieur et figure deux fois dans ce compte. Le contour contient donc 4 + 4 − 2 = 6 allumettes.',
    },
  });
}

function graphDrawing(points: readonly Point[], edges: readonly Edge[], endpoints?: Edge) {
  const name = (i: number) =>
    i === endpoints?.[0] ? 'A' : i === endpoints?.[1] ? 'B' : String(i + 1);
  return diagram(
    144,
    110,
    [
      ...edges.map(([a, b]) => line(points[a], points[b])),
      ...points.map((point, i) => dot(point, 3.4, endpoints?.includes(i) ? 'accent' : 'focus')),
      ...(endpoints ?? []).map((i, j) =>
        label([points[i][0], points[i][1] + (j ? 14 : -14)], name(i), 14, 'accent'),
      ),
    ],
    `Connexions du réseau. ${edges.map(([a, b]) => `${name(a)}–${name(b)}`).join(', ')}.`,
  );
}

function polygonNetwork(size: number, cx: number, rx: number, ry: number, offset: number) {
  const points: Point[] = range(size).map((i) => {
    const angle = offset + (i * 2 * Math.PI) / size;
    return [cx + rx * Math.cos(angle), 54 + ry * Math.sin(angle)];
  });
  const edges: Edge[] = range(size).map((i) => [i, (i + 1) % size]);
  for (const i of shuffle(range(size - 3)).slice(0, randomInt(0, size - 3))) {
    edges.push([0, i + 2]);
  }
  return { points, edges };
}

function pointDegrees(size: number, edges: readonly Edge[]) {
  const degrees = range(size).map(() => 0);
  for (const [a, b] of edges) {
    degrees[a]++;
    degrees[b]++;
  }
  return degrees;
}

function oddPoints() {
  return splitCases(
    range(7).map(() => {
      const { points, edges } = polygonNetwork(randomInt(5, 8), 72, 52, 42, Math.random());
      const degrees = pointDegrees(points.length, edges);
      const digit = degrees.filter((degree) => degree % 2).length;
      const start = points.reduce(
        (rightmost, point, i) => (point[0] > points[rightmost][0] ? i : rightmost),
        0,
      );
      const clockwise = [...degrees.slice(start), ...degrees.slice(0, start)];
      return {
        digit,
        clue: graphDrawing(points, edges),
        explanation: `Pars du point le plus à droite et tourne dans le sens horaire. Les nombres de traits qui aboutissent aux points sont ${clockwise.join(', ')}. Le nombre de points dont le total est impair vaut ${digit}.`,
      };
    }),
    'Pour chaque point, compte les traits qui y aboutissent. Le résultat est le nombre de points dont ce total est impair.',
  );
}

function pencilStrokes() {
  return splitCases(
    range(7).map((i) => {
      const split = i % 3 === 0;
      const left = polygonNetwork(
        randomInt(5, 8),
        split ? 34 : 72,
        split ? 25 : 52,
        41,
        Math.random(),
      );
      const groups = split
        ? [left, polygonNetwork(randomInt(4, 7), 108, 24, 40, Math.random())]
        : [left];
      const points: Point[] = [];
      const edges: Edge[] = [];
      const counts: string[] = [];
      let digit = 0;
      for (const [i, group] of groups.entries()) {
        const odd = pointDegrees(group.points.length, group.edges).filter(
          (degree) => degree % 2,
        ).length;
        const strokes = Math.max(1, odd / 2);
        const name = split ? (i === 0 ? 'À gauche' : 'À droite') : 'Dans ce réseau';
        counts.push(
          odd === 0
            ? `${name}, les points ont tous un nombre pair de traits. Un seul tracé suffit.`
            : `${name}, la moitié des ${odd} points impairs donne ${strokes} ${strokes === 1 ? 'tracé' : 'tracés'}.`,
        );
        digit += strokes;
        edges.push(...group.edges.map(([a, b]): Edge => [a + points.length, b + points.length]));
        points.push(...group.points);
      }
      return {
        digit,
        clue: graphDrawing(points, edges),
        explanation: `${counts.join(' ')} Le minimum pour l’ensemble est de ${digit} ${digit === 1 ? 'tracé' : 'tracés'}.`,
      };
    }),
    'Dans chaque groupe de points reliés, compte les points où aboutit un nombre impair de traits. Divise ce compte par deux. Si le compte vaut zéro, le groupe se trace d’un seul coup. Additionne les tracés nécessaires.',
  );
}

const SILHOUETTES = [
  ['010', '111', '010'],
  ['111', '111'],
  ['100', '100', '111'],
  ['101', '101', '111'],
  ['100', '110', '011'],
  ['010', '111', '111'],
  ['111', '101', '111'],
  ['0010', '0110', '1111'],
  ['111', '011', '001'],
  ['010', '111', '101'],
  ['010', '110', '011'],
];

function symmetry() {
  return splitCases(
    shuffle(SILHOUETTES)
      .slice(0, 7)
      .map((shape) => {
        const cells = shape.flatMap((row, y) =>
          [...row].flatMap((value, x): Point[] => (value === '1' ? [[x, y]] : [])),
        );
        const orientation = randomInt(0, 7);
        const oriented = cells.map((point) => orientPoint(point, 5, orientation));
        const columns = oriented.map(([x]) => x);
        const rows = oriented.map(([, y]) => y);
        const xCenter = Math.min(...columns) + Math.max(...columns);
        const yCenter = Math.min(...rows) + Math.max(...rows);
        const centered = oriented.map(([x, y]): Point => [2 * x - xCenter, 2 * y - yCenter]);
        const seen = new Set(centered.map(pointKey));
        const mirrors = [
          ([x, y]: Point): Point => [-x, y],
          ([x, y]: Point): Point => [x, -y],
          ([x, y]: Point): Point => [y, x],
          ([x, y]: Point): Point => [-y, -x],
        ];
        const names = [
          'l’axe vertical',
          'l’axe horizontal',
          'la diagonale descendante',
          'la diagonale montante',
        ];
        const axes = mirrors.flatMap((mirror, i) =>
          centered.every((point) => seen.has(pointKey(mirror(point)))) ? [names[i]] : [],
        );
        const digit = axes.length;
        return {
          digit,
          clue: diagram(
            144,
            110,
            centered.map(([x, y]) => ({
              kind: 'box',
              at: [61 + x * 10, 44 + y * 10],
              width: 20,
              height: 20,
              fill: 'focus',
            })),
            `Silhouette, cases occupées (colonne, rangée) : ${oriented.map(pointKey).join(' ; ')}.`,
          ),
          explanation: digit
            ? `Les deux moitiés se recouvrent exactement si on plie la silhouette suivant ${axes.join(', ')}. Cela donne ${digit} ${digit === 1 ? 'axe de symétrie' : 'axes de symétrie'}.`
            : 'Pour chacun des quatre axes possibles, le reflet d’au moins une case colorée tombe sur une case vide. Le nombre d’axes de symétrie est donc 0.',
        };
      }),
    'Essaie de plier mentalement la silhouette suivant les axes horizontal, vertical et diagonaux qui passent par son centre. Compte les axes pour lesquels les deux moitiés se superposent exactement.',
  );
}

const POLYGONS: readonly (readonly Point[])[] = [
  [
    [0, 0],
    [4, 0],
    [4, 3],
    [0, 3],
  ],
  [
    [0, 0],
    [4, 0],
    [0, 4],
  ],
  [
    [0, 0],
    [4, 0],
    [0, 2],
  ],
  [
    [0, 0],
    [4, 0],
    [3, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [4, 0],
    [3, 2],
    [1, 2],
  ],
  [
    [0, 0],
    [4, 0],
    [4, 3],
    [2, 1],
    [0, 3],
  ],
  [
    [0, 1],
    [3, 1],
    [4, 2],
    [2, 4],
    [0, 4],
  ],
  [
    [0, 0],
    [2, 0],
    [1, 3],
  ],
  [
    [0, 1],
    [3, 1],
    [4, 4],
    [1, 4],
  ],
  [
    [0, 0],
    [4, 0],
    [4, 1],
    [1, 1],
    [1, 4],
    [0, 4],
  ],
];

function internalAngles(polygon: readonly Point[]) {
  const winding = Math.sign(
    polygon.reduce((area, [x, y], i) => {
      const [u, v] = polygon[(i + 1) % polygon.length];
      return area + x * v - y * u;
    }, 0),
  );
  return polygon.map(([x, y], i) => {
    const [px, py] = polygon[(i + polygon.length - 1) % polygon.length];
    const [nx, ny] = polygon[(i + 1) % polygon.length];
    const a: Point = [px - x, py - y];
    const b: Point = [nx - x, ny - y];
    const convex = (a[0] * b[1] - a[1] * b[0]) * winding < 0;
    const cosine = (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b));
    const angle = (Math.acos(cosine) * 180) / Math.PI;
    return convex ? angle : 360 - angle;
  });
}

function specialAngles() {
  const rules = [
    {
      matches: (angle: number) => Math.abs(angle - 90) < 0.01,
      hint: 'Compte les angles droits à l’intérieur de la figure. Ils valent exactement 90°, comme le coin d’un carré.',
    },
    {
      matches: (angle: number) => angle < 89.99,
      hint: 'Compte les angles aigus à l’intérieur de la figure. Ce sont ceux dont l’ouverture est plus petite qu’un angle droit.',
    },
    {
      matches: (angle: number) => Math.abs(angle - 45) < 0.01,
      hint: 'Compte les angles intérieurs de 45°. Leur ouverture vaut exactement la moitié d’un angle droit.',
    },
  ];
  const rule = randomInt(0, rules.length - 1);
  const candidates = shuffle(POLYGONS).map((polygon) => {
    const angles = internalAngles(polygon);
    return { polygon, angles, counts: rules.map(({ matches }) => angles.filter(matches).length) };
  });
  const examples = [candidates.shift()!];
  for (const alternative of range(rules.length).filter((i) => i !== rule)) {
    if (examples.some(({ counts }) => counts[rule] !== counts[alternative])) continue;
    const distinguishing = candidates.findIndex(
      ({ counts }) => counts[rule] !== counts[alternative],
    );
    examples.push(...candidates.splice(distinguishing, 1));
  }
  while (examples.length < 3) examples.push(candidates.shift()!);
  return splitCases(
    [...examples, ...candidates.slice(0, 4)].map(({ polygon, angles, counts }) => {
      const orientation = randomInt(0, 7);
      const points = polygon.map((point): Point => {
        const [x, y] = orientPoint(point, 5, orientation);
        return [32 + x * 19, 15 + y * 19];
      });
      return {
        digit: counts[rule],
        clue: lineDrawing(points.map((p, i) => [p, points[(i + 1) % points.length]])),
        explanation: `En faisant le tour de la figure, les angles intérieurs mesurent environ ${angles.map((angle) => `${String(Math.round(angle * 10) / 10).replace('.', ',')}°`).join(', ')}. ${counts[rule]} ${counts[rule] === 1 ? 'angle correspond' : 'angles correspondent'} au critère donné dans la méthode.`,
      };
    }),
    rules[rule].hint,
  );
}

function multiplePaths() {
  const choices: ExplainedExercise[] = [];
  for (const columns of [3, 4]) {
    const size = columns * 2;
    const points: Point[] = range(size).map((i) => [
      18 + ((i % columns) * 107) / (columns - 1),
      i < columns ? 28 : 82,
    ]);
    const end = size - 1;
    for (let mask = 1; mask < 1 << columns; mask++) {
      const edges: Edge[] = [];
      for (const i of range(columns)) {
        if (i + 1 < columns) edges.push([i, i + 1], [i + columns, i + columns + 1]);
        if (mask & (1 << i)) edges.push([i, i + columns]);
      }
      const adjacent = range(size).map((i) =>
        edges.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])),
      );
      const paths = (at: number, visited: number): number =>
        at === end
          ? 1
          : adjacent[at]
              .filter((next) => !(visited & (1 << next)))
              .reduce((total, next) => total + paths(next, visited | (1 << next)), 0);
      const right = paths(1, 1 | (1 << 1));
      const down = mask & 1 ? paths(columns, 1 | (1 << columns)) : 0;
      const digit = right + down;
      if (digit < 10)
        choices.push({
          digit,
          clue: graphDrawing(points, edges, [0, end]),
          explanation: `Explore séparément les premiers déplacements depuis A. En partant à droite, on trouve ${right} ${right === 1 ? 'trajet' : 'trajets'} vers B en visitant chaque point au plus une fois.${mask & 1 ? ` En partant vers le bas, on en trouve ${down}. On obtient ${right} + ${down} = ${digit}.` : ' C’est la seule direction pour partir de A.'}`,
        });
    }
  }
  return splitCases(
    shuffle(choices).slice(0, 7),
    'Explore les trajets de A vers B. À chaque bifurcation, essaie toutes les branches qui mènent vers un point encore inutilisé dans ce trajet. Compte un trajet dès qu’il atteint B.',
  );
}

export const GEOMETRY_MECHANICS: readonly Mechanic[] = [
  { title: 'Les intersections mystérieuses', generate: intersections },
  { title: 'Les régions emprisonnées', generate: enclosedRegions },
  { title: 'Les triangles imbriqués', generate: triangles },
  { title: 'Les carrés invisibles', generate: hiddenSquares },
  { title: 'Les points impairs', generate: oddPoints },
  { title: 'Les lignes de symétrie', generate: symmetry },
  { title: 'Le périmètre en allumettes', generate: perimeter },
  { title: 'Les angles particuliers', generate: specialAngles },
  { title: 'Les chemins multiples', generate: multiplePaths },
  { title: 'Les traits de crayon', generate: pencilStrokes },
];
