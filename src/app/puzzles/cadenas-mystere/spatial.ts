import { range, shuffle } from '../new-games/random';
import {
  arrow,
  boardRound,
  box,
  CARDINAL,
  cell,
  CODE_POSITIONS,
  diagram,
  dot,
  DrawingMark,
  ExplainedExercise,
  grid,
  individualRound,
  label,
  line,
  Mechanic,
  orientPoint,
  pick,
  Point,
  pointKey,
  randomInt,
  samePoint,
  shiftPoint,
  textClue,
} from './cadenas-mystere.model';
import { drawDigit, SEGMENT_MASKS, SEGMENT_NAMES } from './seven-segment';

function inside([x, y]: Point, size: number): boolean {
  return x >= 0 && y >= 0 && x < size && y < size;
}

function coordinates(size: number): Point[] {
  return range(size).flatMap((y) => range(size).map((x): Point => [x, y]));
}

function squareGrid(size: number, unit: number, offset: number, rowOffset = offset): DrawingMark[] {
  const farX = offset + size * unit;
  const farY = rowOffset + size * unit;
  return range(size + 1).flatMap((i) => [
    line([offset + i * unit, rowOffset], [offset + i * unit, farY], 'muted', 0.7),
    line([offset, rowOffset + i * unit], [farX, rowOffset + i * unit], 'muted', 0.7),
  ]);
}

function foldedPaper() {
  const size = 8;
  const unit = 19;
  const steps: string[] = [];
  const stepMarks: DrawingMark[] = [];
  const bounds = (cells: readonly { folded: Point }[], axis: number) => {
    const values = cells.map(({ folded }) => folded[axis]);
    return [Math.min(...values), Math.max(...values)] as const;
  };
  // Record where each original cell ends up after each fold.
  let cells = coordinates(size).map((original) => ({ original, folded: original }));
  const firstAxis = randomInt(0, 1);
  const axes = [firstAxis, 1 - firstAxis, randomInt(0, 1)];
  for (const [step, axis] of axes.entries()) {
    const [min, max] = bounds(cells, axis);
    const keepNear = randomInt(0, 1) === 0;
    const toward = axis === 0 ? ['de gauche', 'de droite'] : ['du haut', 'du bas'];
    steps.push(
      `Rabats la moitié ${toward[keepNear ? 1 : 0]} sur la moitié ${toward[keepNear ? 0 : 1]}.`,
    );
    const [minX, maxX] = bounds(cells, 0);
    const [minY, maxY] = bounds(cells, 1);
    const width = (maxX - minX + 1) * 6;
    const height = (maxY - minY + 1) * 6;
    const cx = 36 + step * 76;
    const cy = 45;
    const delta = (axis === 0 ? width : height) * (keepNear ? 0.29 : -0.29);
    const dx = axis === 0 ? delta : 0;
    const dy = axis === 1 ? delta : 0;
    stepMarks.push(
      label([cx, 11], step + 1, 13, 'focus'),
      box([cx - width / 2, cy - height / 2], width, height, 'paper', 'ink'),
      axis === 0
        ? line([cx, cy - height / 2], [cx, cy + height / 2], 'muted', 1, true)
        : line([cx - width / 2, cy], [cx + width / 2, cy], 'muted', 1, true),
      ...arrow([cx + dx, cy + dy], [cx - dx, cy - dy], 'accent'),
    );
    cells = cells.map(({ original, folded }) => {
      const next: [number, number] = [...folded];
      if (folded[axis] < (min + max) / 2 !== keepNear) next[axis] = min + max - folded[axis];
      return { original, folded: next };
    });
  }
  const hole = pick(cells).folded;
  const holes = cells
    .filter(({ folded }) => samePoint(hole, folded))
    .map(({ original }) => original);
  const borderX = pick([2, 3, 5, 6]);
  const leftY = randomInt(2, 6);
  const rightY = randomInt(2, 6);
  const names = shuffle(CODE_POSITIONS);
  const zone = ([x, y]: Point): number =>
    x < borderX ? Number(y >= leftY) : 2 + Number(y >= rightY);
  const digits = CODE_POSITIONS.map((name) => holes.filter((p) => names[zone(p)] === name).length);
  const margin = 7;
  const width = size * unit;
  const at = (x: number, y: number): Point => [margin + x * unit, margin + y * unit];
  const zones = [
    line(at(borderX, 0), at(borderX, size), 'accent', 2),
    line(at(0, leftY), at(borderX, leftY), 'accent', 2),
    line(at(borderX, rightY), at(size, rightY), 'accent', 2),
    ...[
      [borderX / 2, leftY / 2],
      [borderX / 2, (size + leftY) / 2],
      [(size + borderX) / 2, rightY / 2],
      [(size + borderX) / 2, (size + rightY) / 2],
    ].map(([x, y], i) => label(at(x, y), names[i], 16, 'accent')),
  ];
  const [minX, maxX] = bounds(cells, 0);
  const [minY, maxY] = bounds(cells, 1);
  const columns = maxX - minX + 1;
  const rows = maxY - minY + 1;
  const foldedView = grid(
    range(rows).map((y) =>
      range(columns).map((x) =>
        samePoint([x + minX, y + minY], hole) ? cell('●', 'target') : cell(''),
      ),
    ),
    'Après les trois étapes',
  );
  return boardRound(
    digits,
    [
      diagram(224, 74, stepMarks, steps.join(' '), 'Plis dans l’ordre'),
      foldedView,
      diagram(
        width + margin * 2,
        width + margin * 2,
        [...squareGrid(size, unit, margin), ...zones],
        `Zones à plat. En partant du coin supérieur gauche, la séparation verticale est à ${borderX} colonnes. À gauche, ${names[0]} couvre les ${leftY} premières rangées, puis ${names[1]}. À droite, ${names[2]} couvre les ${rightY} premières rangées, puis ${names[3]}.`,
        'Carré déplié',
      ),
    ],
    {
      instruction:
        'Suis les flèches pour plier le carré. La case marquée est percée une fois les trois plis terminés. Combien de trous apparaissent dans chaque zone après le dépliage ?',
      solutionHint:
        'Pars de la case percée et défais les plis du dernier au premier. À chaque étape, reporte tous les trous dans les cases symétriques de l’autre côté du pli. Compte ensuite les trous dans chaque zone du carré déplié.',
      workedExample: {
        clue: grid([[1, cell('2', 'target'), 3, 4]], 'Un pli entre 2 et 3'),
        explanation:
          'Sur cette bande, rabats la moitié droite sur la gauche. La case 3 se superpose à la case 2 et la 4 à la 1. Si tu perces la case 2 à travers les deux épaisseurs, les trous seront dans les cases 2 et 3 au dépliage.',
      },
    },
  );
}

function rotations() {
  const shape: Point[] = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ];
  const marker: Point = randomInt(0, 1) ? [2, 1] : [2, 2];
  const orientation = randomInt(0, 7);
  const display = (turns: number, title?: string) => {
    const rotate = (point: Point) => orientPoint(orientPoint(point, 3, orientation), 3, turns);
    const positions = shape.map(rotate);
    const accent = rotate(marker);
    const rows = range(3).map((y) =>
      range(3).map((x) => {
        const position: Point = [x, y];
        if (samePoint(position, accent)) return cell('●', 'target');
        return cell('', positions.some((p) => samePoint(p, position)) ? 'filled' : undefined);
      }),
    );
    return grid(rows, title);
  };
  return individualRound(
    shuffle(range(4)).map((turns) => ({
      digit: (4 - turns) % 4,
      clue: display(turns),
    })),
    {
      instruction: 'Combien de quarts de tour horaires ramènent chaque motif au modèle ?',
      shared: [display(0, 'Modèle')],
      solutionHint:
        'Prends le point coloré comme repère. Fais tourner le motif autour du centre dans le sens horaire jusqu’à ce que le point et les cases remplies coïncident avec le modèle. Compte les quarts de tour effectués.',
      workedExample: {
        clue: grid(
          [
            [cell('●', 'target'), cell('', 'filled'), cell('', 'spacer'), '', cell('●', 'target')],
            ['', '', cell('', 'spacer'), '', cell('', 'filled')],
          ],
          'Motif à gauche, modèle à droite',
        ),
        explanation:
          'Le point part du coin supérieur gauche. Après un quart de tour horaire, il arrive en haut à droite et la case pleine passe en bas à droite. Cela correspond au modèle, donc un seul quart de tour suffit.',
      },
    },
  );
}

function rays() {
  return individualRound(
    range(4).map(() => {
      const size = 4;
      const unit = 25;
      const offset = 24;
      const inward = randomInt(0, 3);
      const position = randomInt(0, size - 1);
      const edges = range(size).flatMap((i): Point[] => [
        [-1, i],
        [i, -1],
        [size, i],
        [i, size],
      ]);
      const entry = edges[position * 4 + inward];
      const entryCell = shiftPoint(entry, CARDINAL[inward]);
      const mirrors = new Map<string, string>();
      for (const p of [entryCell, ...shuffle(coordinates(size)).slice(0, randomInt(4, 8))]) {
        mirrors.set(pointKey(p), pick(['/', '\\']));
      }
      let at = entryCell;
      let direction = inward;
      // Reflection is reversible, so a ray coming from outside cannot enter a closed cycle.
      while (inside(at, size)) {
        const mirror = mirrors.get(pointKey(at));
        if (mirror === '/') direction = 3 - direction;
        if (mirror === '\\') direction ^= 1;
        at = shiftPoint(at, CARDINAL[direction]);
      }
      const exit = at;
      const ports = shuffle([
        exit,
        ...shuffle(edges.filter((p) => !samePoint(p, entry) && !samePoint(p, exit))).slice(0, 3),
      ]);
      const digits = shuffle(range(10)).slice(0, 4);
      const center = ([x, y]: Point): Point => [
        offset + (x + 0.5) * unit,
        offset + (y + 0.5) * unit,
      ];
      const marks = squareGrid(size, unit, offset);
      coordinates(size).forEach((p) => {
        const mirror = mirrors.get(pointKey(p));
        if (!mirror) return;
        const [cx, cy] = center(p);
        const delta = mirror === '/' ? -8 : 8;
        marks.push(line([cx - 8, cy - delta], [cx + 8, cy + delta], 'ink', 2.6));
      });
      ports.forEach((p, i) => marks.push(label(center(p), digits[i], 14, 'focus')));
      const [dx, dy] = CARDINAL[inward];
      const port = center(entry);
      marks.push(
        ...arrow(
          shiftPoint(port, [-7 * dx, -7 * dy]),
          shiftPoint(port, [13 * dx, 13 * dy]),
          'accent',
        ),
      );
      const order = (p: Point) => `colonne ${p[0] + 1}, rangée ${p[1] + 1}`;
      const description = `Entrée à ${order(entry)}. Sorties : ${ports.map((p, i) => `${digits[i]} à ${order(p)}`).join(' ; ')}. Miroirs : ${coordinates(
        size,
      )
        .filter((p) => mirrors.has(pointKey(p)))
        .map((p) => `${mirrors.get(pointKey(p))} à ${order(p)}`)
        .join(' ; ')}.`;
      return {
        digit: digits[ports.findIndex((p) => samePoint(p, exit))],
        clue: diagram(148, 148, marks, description),
      };
    }),
    {
      instruction:
        'Suis chaque rayon depuis la flèche. À chaque miroir, il tourne de 90°. Relève le numéro de sa sortie.',
      solutionHint:
        'Dans une case vide, continue tout droit. Sur un miroir, imagine que le rayon rebondit sur le trait oblique. Un rayon allant vers la droite repart vers le haut sur un miroir / et vers le bas sur l’autre miroir.',
      workedExample: {
        clue: diagram(
          126,
          100,
          [
            ...squareGrid(2, 32, 30, 25),
            ...arrow([8, 41], [30, 41], 'accent'),
            line([38, 49], [54, 33], 'ink', 2.6),
            label([46, 12], 5, 14, 'focus'),
          ],
          'Le rayon entre à gauche, dans la première rangée. Un miroir / est dans la case d’entrée. La sortie 5 est en haut.',
        ),
        explanation:
          'Le rayon entre par la gauche et rencontre le miroir / dans la première case. Le miroir l’envoie vers le haut. Il sort donc par l’ouverture numérotée 5.',
      },
    },
  );
}

function layers() {
  const make = (digit: number): ExplainedExercise => {
    const indexes = shuffle(range(16));
    const overlap = randomInt(2, 4);
    const first = randomInt(0, digit);
    const active = [
      indexes.slice(0, overlap + first),
      [...indexes.slice(0, overlap), ...indexes.slice(overlap + first, overlap + digit)],
    ];
    const marks: DrawingMark[] = [];
    active.forEach((bits, i) => {
      const x = 8 + i * 67;
      bits.forEach((index) =>
        marks.push(box([x + (index % 4) * 13, 21 + Math.floor(index / 4) * 13], 13, 13, 'ink')),
      );
      marks.push(...squareGrid(4, 13, x, 21));
    });
    return {
      digit,
      clue: diagram(
        136,
        85,
        marks,
        `Deux grilles de quatre par quatre. Cases noires, numérotées de gauche à droite et de haut en bas : ${active
          .map((bits) =>
            [...bits]
              .sort((a, b) => a - b)
              .map((i) => i + 1)
              .join(', '),
          )
          .join(' puis ')}.`,
      ),
      explanation: `La grille de gauche contient ${active[0].length} cases remplies et celle de droite en contient ${active[1].length}. Elles se superposent sur ${overlap} cases, qu’on retire de chaque côté. Il reste (${active[0].length} − ${overlap}) + (${active[1].length} − ${overlap}) = ${digit} positions à compter.`,
    };
  };
  const tasks = shuffle(range(10).filter((i) => ![0, 3, 6].includes(i)))
    .slice(0, 4)
    .map(make);
  const examples = [make(0), make(3), make(6)];
  return individualRound(tasks, {
    examples,
    instruction: 'Déduis comment les deux grilles produisent le nombre montré.',
    solutionHint:
      'Superpose mentalement les deux grilles. Deux cases remplies au même endroit s’annulent. Compte les positions où une seule des deux grilles a une case remplie.',
    workedExample: examples[1],
  });
}

function cubeNet() {
  const net: Point[] = [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [1, 0],
    [1, 2],
  ];
  const opposite = [2, 3, 0, 1, 5, 4];
  const orientation = randomInt(0, 7);
  const coordinates = net.map((p) => orientPoint(p, 4, orientation));
  const digits = shuffle(range(10)).slice(0, 6);
  const queries = shuffle(range(6)).slice(0, 4);
  const faceAt = new Map(coordinates.map((point, i) => [pointKey(point), digits[i]]));
  const minX = Math.min(...coordinates.map(([x]) => x));
  const minY = Math.min(...coordinates.map(([, y]) => y));
  const shown = range(Math.max(...coordinates.map(([, y]) => y)) - minY + 1).map((y) =>
    range(Math.max(...coordinates.map(([x]) => x)) - minX + 1).map((x) => {
      const number = faceAt.get(pointKey([x + minX, y + minY]));
      return number === undefined ? cell('', 'spacer') : cell(number);
    }),
  );
  return boardRound(
    queries.map((face) => digits[opposite[face]]),
    [
      grid(shown),
      textClue(queries.map((face, i) => `${CODE_POSITIONS[i]} · Face opposée au ${digits[face]}`)),
    ],
    {
      instruction:
        'Une fois le cube refermé, quelle face est opposée à chacun des chiffres indiqués ?',
      solutionHint:
        'Les quatre faces alignées font le tour du cube. La première est opposée à la troisième et la deuxième à la quatrième. Les deux faces restantes ferment les extrémités et sont opposées entre elles.',
      workedExample: {
        clue: grid([
          [cell('', 'spacer'), 5, cell('', 'spacer'), cell('', 'spacer')],
          [1, 2, 3, 4],
          [cell('', 'spacer'), 6, cell('', 'spacer'), cell('', 'spacer')],
        ]),
        explanation:
          'La bande 1, 2, 3, 4 s’enroule pour faire le tour du cube. De la face 1 à la 3, tu fais deux quarts de tour autour du cube. La face opposée à 1 est donc 3. Les faces 5 et 6 ferment le dessus et le dessous.',
      },
    },
  );
}

function cubeShadows() {
  const size = 5;
  const spareRow = randomInt(0, 4);
  const names = shuffle(CODE_POSITIONS);
  const heights = new Map<string, number>();
  const targets = new Map<string, string>();
  range(size).forEach((y) => {
    const columns = shuffle(range(size)).slice(0, y === spareRow ? randomInt(2, 4) : 1);
    columns.forEach((x) => heights.set(pointKey([x, y]), randomInt(1, 5)));
    if (y !== spareRow) targets.set(pointKey([columns[0], y]), names[targets.size]);
  });
  const digits = CODE_POSITIONS.map(
    (position) => heights.get([...targets].find(([, name]) => name === position)![0])!,
  );
  const top = grid(
    range(size).map((y) => [
      cell(y + 1, 'heading'),
      ...range(size).map((x) => {
        const key = pointKey([x, y]);
        const name = targets.get(key);
        return name ? cell(name, 'target') : cell('', heights.has(key) ? 'filled' : undefined);
      }),
    ]),
    'Vue de dessus',
  );
  const profile = range(size).map((y) =>
    Math.max(...range(size).map((x) => heights.get(pointKey([x, y])) ?? 0)),
  );
  const side = grid(
    [
      ...range(size).map((h) => {
        const height = size - h;
        return [
          cell(height, 'heading'),
          ...profile.map((highest) => cell('', height <= highest ? 'filled' : undefined)),
        ];
      }),
      [cell('', 'heading'), ...range(size).map((y) => cell(y + 1, 'heading'))],
    ],
    'Vue de côté',
  );
  return boardRound(digits, [top, side], {
    instruction:
      'Les deux vues montrent la même construction. Les numéros sous la vue de côté correspondent aux rangées de la vue de dessus. Relève la hauteur des colonnes marquées.',
    solutionHint:
      'Chaque rangée marquée de la vue de dessus contient une seule colonne de cubes. Repère le numéro de cette rangée, puis lis la hauteur du profil au même numéro sur la vue de côté.',
    workedExample: {
      clue: grid(
        [
          [cell(3, 'heading'), '', cell('', 'filled'), ''],
          [cell(2, 'heading'), cell('', 'filled'), cell('', 'filled'), ''],
          [cell(1, 'heading'), cell('', 'filled'), cell('', 'filled'), cell('', 'filled')],
          [cell('', 'spacer'), cell(1, 'heading'), cell(2, 'heading'), cell(3, 'heading')],
        ],
        'Vue de côté',
      ),
      explanation:
        'Suppose que la lettre repérée est le seul empilement de la rangée 2 en vue de dessus. Dans le profil, la colonne numérotée 2 atteint la hauteur 3. L’empilement marqué contient donc 3 cubes.',
    },
  });
}

type Equation = { display: readonly number[]; solution: readonly number[]; operation: '+' | '−' };
let equationPool: Equation[] | undefined;

function matchEquations() {
  equationPool ??= legalMoves();
  const selected = shuffle(equationPool);
  const ordinals = ['premier', 'deuxième', 'troisième'];
  const make = ({ display, solution, operation }: Equation, target: number) => {
    const places = [9, 68, 127];
    const marks = display.flatMap((digit, i) =>
      drawDigit(digit, places[i], 23, i === target ? 'accent' : 'ink'),
    );
    marks.push(
      label([51, 47], operation, 24),
      label([110, 47], '=', 24),
      dot([places[target] + 12, 84], 3.5, 'accent'),
    );
    const description = `${display[0]} ${operation} ${display[1]} = ${display[2]}. Chiffre à lire : ${ordinals[target]}.`;
    return { digit: solution[target], clue: diagram(160, 95, marks, description) };
  };
  const tasks = selected.slice(0, 4).map((equation) => make(equation, randomInt(0, 2)));
  const example = selected[4];
  const { display, solution, operation } = example;
  const removed = display.map((digit, i) => SEGMENT_MASKS[digit] & ~SEGMENT_MASKS[solution[i]]);
  const added = solution.map((digit, i) => SEGMENT_MASKS[digit] & ~SEGMENT_MASKS[display[i]]);
  const from = removed.findIndex(Boolean);
  const to = added.findIndex(Boolean);
  return individualRound(tasks, {
    instruction:
      'Déplace exactement une allumette parmi les trois chiffres pour rendre chaque égalité vraie. Les signes restent en place. Relève le chiffre marqué dans l’égalité corrigée.',
    solutionHint:
      'Teste le déplacement d’une allumette vers un emplacement vide du même chiffre ou d’un autre. Vérifie que les trois chiffres obtenus sont lisibles, puis garde le déplacement qui rend les deux côtés égaux.',
    workedExample: {
      ...make(example, from),
      explanation: `Déplace l’allumette du segment « ${SEGMENT_NAMES[Math.log2(removed[from])]} » du ${ordinals[from]} chiffre vers la position « ${SEGMENT_NAMES[Math.log2(added[to])]} » du ${ordinals[to]} chiffre. L’égalité devient ${solution[0]} ${operation} ${solution[1]} = ${solution[2]}. Le chiffre marqué vaut maintenant ${solution[from]}.`,
    },
  });
}

function legalMoves(): Equation[] {
  const triples = range(1000).map((n) => {
    const values = [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];
    const mask = values.reduce((bits, digit, i) => bits | (SEGMENT_MASKS[digit] << (7 * i)), 0);
    return { values, mask };
  });
  const oneBit = (bits: number) => bits !== 0 && (bits & (bits - 1)) === 0;
  return (['+', '−'] as const).flatMap((operation) => {
    const valid = ([a, b, c]: readonly number[]) => (operation === '+' ? a + b : a - b) === c;
    const solved = triples.filter(({ values }) => valid(values));
    return triples
      .filter(({ values }) => !valid(values))
      .flatMap(({ values, mask }) => {
        const possible = solved.filter(
          (after) => oneBit(mask & ~after.mask) && oneBit(after.mask & ~mask),
        );
        return possible.length === 1
          ? [{ display: values, solution: possible[0].values, operation }]
          : [];
      });
  });
}

let pipePathPool: Point[][] | undefined;

function pipePaths() {
  const paths: Point[][] = [];
  const visit = (trail: Point[]): void => {
    const last = trail.at(-1)!;
    if (last[0] === 3) {
      if (trail.length >= 5) paths.push(trail);
      return;
    }
    if (trail.length === 9) return;
    for (const next of CARDINAL.map((step) => shiftPoint(last, step))) {
      if (!inside(next, 4) || trail.some((p) => samePoint(p, next))) continue;
      // The used cells form an induced path, so the entry and exit force a single connection.
      if (trail.slice(0, -1).some(([x, y]) => Math.abs(x - next[0]) + Math.abs(y - next[1]) === 1))
        continue;
      visit([...trail, next]);
    }
  };
  visit([[0, 1]]);
  visit([[0, 2]]);
  return paths;
}

function pipes() {
  pipePathPool ??= pipePaths();
  return individualRound(
    shuffle(pipePathPool)
      .slice(0, 4)
      .map((source) => {
        const unit = 25;
        const offset = 24;
        const orientation = randomInt(0, 7);
        const orient = (p: Point) => orientPoint(p, 4, orientation);
        const points = source.map(orient);
        const entry = orient([-1, source[0][1]]);
        const exit = orient([4, source.at(-1)![1]]);
        const marked = new Set(shuffle(range(points.length)).slice(0, randomInt(1, 4)));
        const trail = [entry, ...points, exit];
        const center = ([x, y]: Point): Point => [
          offset + (x + 0.5) * unit,
          offset + (y + 0.5) * unit,
        ];
        const marks = squareGrid(4, unit, offset);
        const directions = ['est', 'sud', 'ouest', 'nord'];
        const outlets: string[] = [];
        let digit = 0;
        let remainingTurns = marked.size;
        points.forEach(([x, y], i) => {
          const ends = [trail[i], trail[i + 2]].map(([nx, ny]) =>
            CARDINAL.findIndex((d) => samePoint(d, [nx - x, ny - y])),
          );
          const straight = Math.abs(ends[0] - ends[1]) === 2;
          let turns = 0;
          if (marked.has(i)) {
            remainingTurns--;
            turns = randomInt(1, straight ? 1 : Math.min(3, 9 - digit - remainingTurns));
          }
          digit += turns;
          const current = ends.map((direction) => (direction + 4 - turns) % 4);
          const joint = center([x, y]);
          for (const direction of current) {
            const [dx, dy] = CARDINAL[direction];
            marks.push(
              line(joint, [joint[0] + dx * unit * 0.47, joint[1] + dy * unit * 0.47], 'focus', 5),
            );
          }
          outlets.push(
            `(${x + 1},${y + 1}) vers ${current.map((d) => directions[d]).join(' et ')}`,
          );
        });
        for (const [port, neighbor, name] of [
          [entry, points[0], 'E'],
          [exit, points.at(-1)!, 'S'],
        ] as const) {
          const [x, y] = center(port);
          const dx = neighbor[0] - port[0];
          const dy = neighbor[1] - port[1];
          marks.push(label([x - dx * 3, y - dy * 3], name, 14, 'accent'));
          marks.push(line([x + dx * 7, y + dy * 7], [x + dx * 12.5, y + dy * 12.5], 'accent', 2));
        }
        const position = ([x, y]: Point) => `colonne ${x + 1}, rangée ${y + 1}`;
        return {
          digit,
          clue: diagram(
            148,
            148,
            marks,
            `Entrée E à ${position(entry)}, sortie S à ${position(exit)}. Segments, par colonne et rangée : ${outlets.join(' ; ')}.`,
          ),
        };
      }),
    {
      instruction:
        'Relie E à S en utilisant tous les tuyaux. Compte le minimum de quarts de tour dans le sens horaire. Les cases vides sont inutilisables.',
      solutionHint:
        'Repère la chaîne de cases occupées qui relie E à S. Pour chaque tuyau, compte les quarts de tour horaires nécessaires pour pointer ses deux bouts vers ses voisins dans la chaîne. Additionne les rotations des tuyaux.',
      workedExample: {
        clue: diagram(
          112,
          112,
          [
            box([30, 27], 52, 52, undefined, 'muted'),
            line([56, 53], [56, 29], 'focus', 5),
            line([56, 53], [80, 53], 'focus', 5),
            label([17, 53], 'E', 16, 'accent'),
            label([56, 93], 'S', 16, 'accent'),
          ],
          'Un tuyau coudé pointe vers le haut et la droite. E est à gauche et S en bas.',
        ),
        explanation:
          'Le coude pointe vers le haut et la droite. Un quart de tour horaire donne droite et bas. Un deuxième donne bas et gauche, ce qui relie S et E. Ce coude demande deux quarts de tour.',
      },
    },
  );
}

function strips() {
  const joints = shuffle(['◇', '✚', '▰', '✦', '◎']).slice(0, 3);
  const symbolBank = ['☀', '☾', '▲', '♣', '♠', '♥', '■', '✿', '◆', '●'];
  const key = shuffle(range(10)).slice(0, 4);
  const symbols = shuffle(symbolBank).slice(0, 4);
  const order = shuffle(range(4));
  const cuts = ['▶', ...joints, '⊣'];
  const rows = shuffle(
    order.map((symbol, i) => {
      const strip = [cell(cuts[i]), cell(symbols[symbol], 'target'), cell(cuts[i + 1])];
      return randomInt(0, 1) ? strip.reverse() : strip;
    }),
  );
  return boardRound(
    order.map((i) => key[i]),
    [
      grid(rows, 'Morceaux mélangés'),
      textClue(
        symbols.map((symbol, i) => `${symbol} = ${key[i]}`),
        false,
        'Légende',
      ),
    ],
    {
      instruction:
        'Le morceau ▶ ouvre la bande et ⊣ la ferme. Fais coïncider les motifs aux coupes, en retournant des morceaux au besoin. Lis les symboles du centre dans l’ordre de la bande.',
      solutionHint:
        'Place ▶ à gauche. Cherche le morceau dont un bord porte le même motif que le bord droit du morceau placé. Oriente-le pour que les motifs se touchent, puis recommence jusqu’à ⊣. Traduis les symboles du centre avec la légende.',
      workedExample: {
        clue: grid(
          [
            ['⊣', '▲', '◇'],
            ['▶', '●', '◇'],
          ],
          '● vaut 2 · ▲ vaut 7',
        ),
        explanation:
          'Le morceau du bas ouvre la bande avec ▶ et se termine par ◇. Retourne le morceau du haut pour placer son ◇ à gauche. En suivant la bande des deux morceaux, on lit ● puis ▲, soit 2 puis 7 avec cette légende.',
      },
    },
  );
}

function maze() {
  const size = 6;
  const locations = coordinates(size);
  const adjacency: number[][] = locations.map(() => []);
  const index = ([x, y]: Point) => y * size + x;
  const seen = new Set([0]);
  const parents = new Map<number, number>();
  const visit = (previous: number): void => {
    for (const position of shuffle(CARDINAL).map((d) => shiftPoint(locations[previous], d))) {
      if (!inside(position, size)) continue;
      const next = index(position);
      if (seen.has(next)) continue;
      seen.add(next);
      adjacency[previous].push(next);
      adjacency[next].push(previous);
      parents.set(next, previous);
      visit(next);
    }
  };
  visit(0);
  const exit = locations.length - 1;
  const trail = [exit];
  while (trail.at(-1) !== 0) trail.push(parents.get(trail.at(-1)!)!);
  trail.reverse();
  const stops = range(5).map((i) => Math.round((i * (trail.length - 1)) / 4));
  const digits = stops.slice(1).map((end, segment) => {
    let turns = 0;
    for (let i = stops[segment] + 1; i < end; i++) {
      if (trail[i] - trail[i - 1] !== trail[i + 1] - trail[i]) turns++;
    }
    return turns;
  });
  const markers = new Map(stops.map((stop, i) => [trail[stop], ['E', '1', '2', '3', 'S'][i]]));
  const unit = 28;
  const offset = 13;
  const far = offset + size * unit;
  const marks: DrawingMark[] = [
    line([offset, offset], [far, offset]),
    line([offset, far], [far, far]),
    line([offset, offset + unit], [offset, far]),
    line([far, offset], [far, far - unit]),
  ];
  locations.forEach(([x, y], i) => {
    const left = offset + x * unit;
    const top = offset + y * unit;
    if (x + 1 < size && !adjacency[i].includes(i + 1))
      marks.push(line([left + unit, top], [left + unit, top + unit]));
    if (y + 1 < size && !adjacency[i].includes(i + size))
      marks.push(line([left, top + unit], [left + unit, top + unit]));
    const marker = markers.get(i);
    marks.push(dot([left + unit / 2, top + unit / 2], 1.4, 'muted'));
    if (marker) marks.push(label([left + 8, top + 8], marker, 13, 'accent'));
  });
  const center = (i: number): Point => [
    offset + (locations[i][0] + 0.5) * unit,
    offset + (locations[i][1] + 0.5) * unit,
  ];
  const edges = adjacency.flatMap((neighbors, from) =>
    neighbors
      .filter((to) => to > from)
      .map((to) => ({
        from: center(from),
        to: center(to),
        description: `Passage entre les cases ${from + 1} et ${to + 1}`,
      })),
  );
  const open = adjacency.flatMap((neighbors, i) =>
    neighbors.filter((n) => n > i).map((n) => `${i + 1}–${n + 1}`),
  );
  return boardRound(
    digits,
    [
      {
        ...diagram(
          far + offset,
          far + offset,
          marks,
          `Grille 6 × 6, cases numérotées par rangée. Repères : ${[...markers].map(([i, marker]) => `${marker} dans la case ${i + 1}`).join(', ')}. Passages ouverts : ${open.join(', ')}.`,
        ),
        edges,
      },
    ],
    {
      instruction:
        'Suis le trajet de E à S en passant par 1, 2 et 3. Compte les virages dans E–1, 1–2, 2–3 et 3–S. Les virages sur les repères ne comptent pas.',
      solutionHint:
        'Écarte les impasses pour tracer le chemin entre E et S. Coupe le tracé aux trois repères numérotés. Dans chaque tronçon, compte les passages de l’horizontale à la verticale ou de la verticale à l’horizontale.',
      workedExample: {
        clue: textClue('E  →  →  ↓  1  →  2'),
        explanation:
          'Entre E et 1, deux pas à droite sont suivis d’un pas vers le bas. Ce changement de direction fait un virage. Le départ à droite sur le repère 1 se trouve au bord des deux tronçons, donc le premier tronçon compte un seul virage.',
      },
    },
  );
}

export const SPATIAL_MECHANICS: readonly Mechanic[] = [
  { title: 'Le papier plié', generate: foldedPaper },
  { title: 'Les rotations cachées', generate: rotations },
  { title: 'Le rayon réfléchi', generate: rays },
  { title: 'Les calques transparents', generate: layers },
  { title: 'Le patron de cube', generate: cubeNet },
  { title: 'Les ombres de cubes', generate: cubeShadows },
  { title: 'Les équations d’allumettes', generate: matchEquations },
  { title: 'Le réseau de tuyaux', generate: pipes },
  { title: 'Les bandes réassemblées', generate: strips },
  { title: 'Le labyrinthe des virages', generate: maze },
];
