import { createCodeDeductionPuzzle } from '../code-deduction/code-deduction.logic';
import { range, shuffle } from '../new-games/random';
import { solveSkyscrapers, visibleTowers } from '../new-games/skyscrapers.logic';
import {
  boardRound,
  box,
  cell,
  choiceCell,
  CODE_POSITIONS,
  diagram,
  dot,
  DrawingMark,
  grid,
  label,
  line,
  Mechanic,
  orientPoint,
  pick,
  Point,
  PuzzleContent,
  randomInt,
  textClue,
} from './cadenas-mystere.model';

type Bridge = readonly [number, number];

function candidatesFor(islands: readonly Point[]): Bridge[] {
  const edges: Bridge[] = [];
  islands.forEach(([x, y], i) => {
    const nearest = (column: boolean) =>
      islands.reduce(
        (closest, [a, b], j) => {
          const distance = column ? b - y : a - x;
          const aligned = column ? a === x : b === y;
          return aligned && distance > 0 && distance < closest.distance ? { j, distance } : closest;
        },
        { j: -1, distance: Infinity },
      ).j;
    for (const next of [nearest(false), nearest(true)]) {
      if (next >= 0) edges.push([i, next]);
    }
  });
  return edges;
}

function crosses(islands: readonly Point[], [a, b]: Bridge, [c, d]: Bridge): boolean {
  const [x1, y1] = islands[a];
  const [x2] = islands[b];
  const [x3, y3] = islands[c];
  const [x4, y4] = islands[d];
  if (x1 === x2 && x3 !== x4) return crosses(islands, [c, d], [a, b]);
  return x1 !== x2 && x3 === x4 && x1 < x3 && x3 < x2 && y3 < y1 && y1 < y4;
}

function bridgeSolutions(
  islands: readonly Point[],
  edges: readonly Bridge[],
  demand: readonly number[],
): number {
  const remaining = [...demand];
  const capacity = islands.map((_, i) => 2 * edges.filter((edge) => edge.includes(i)).length);
  const used: Bridge[] = [];
  let solutions = 0;
  const visit = (index: number): void => {
    if (index === edges.length) {
      if (remaining.some((value) => value !== 0)) return;
      const connected = new Set([0]);
      for (let i = 0; i < islands.length; i++) {
        for (const [a, b] of used) {
          if (connected.has(a) || connected.has(b)) {
            connected.add(a);
            connected.add(b);
          }
        }
      }
      if (connected.size === islands.length) solutions++;
      return;
    }
    const current = edges[index];
    const [a, b] = current;
    const upper = used.some((edge) => crosses(islands, current, edge))
      ? 0
      : Math.min(2, remaining[a], remaining[b]);
    capacity[a] -= 2;
    capacity[b] -= 2;
    const lower = Math.max(0, remaining[a] - capacity[a], remaining[b] - capacity[b]);
    for (let count = lower; count <= upper; count++) {
      remaining[a] -= count;
      remaining[b] -= count;
      if (count) used.push(current);
      visit(index + 1);
      if (count) used.pop();
      remaining[a] += count;
      remaining[b] += count;
      if (solutions >= 2) break;
    }
    capacity[a] += 2;
    capacity[b] += 2;
  };
  visit(0);
  return solutions;
}

function bridgeLayout(islands: Point[]) {
  const edges = shuffle(candidatesFor(islands));
  const groups = range(islands.length);
  const accepted: Bridge[] = [];
  const count = edges.map((edge) => {
    const [a, b] = edge;
    if (groups[a] === groups[b] || accepted.some((other) => crosses(islands, edge, other)))
      return 0;
    const combined = groups[b];
    const into = groups[a];
    groups.forEach((group, n) => {
      if (group === combined) groups[n] = into;
    });
    accepted.push(edge);
    return randomInt(1, 2);
  });
  const demand = islands.map((_, i) =>
    edges.reduce((sum, edge, n) => sum + (edge.includes(i) ? count[n] : 0), 0),
  );
  return { islands, edges, count, demand, connected: new Set(groups).size === 1 };
}

function bridges() {
  let layout: ReturnType<typeof bridgeLayout> | undefined;
  for (let attempt = 0; attempt < 14; attempt++) {
    const xs = [0, randomInt(2, 3), 5];
    const ys = [0, randomInt(2, 3), 5];
    const islands = xs.flatMap((x) => ys.map((y): Point => [x, y]));
    islands.splice(randomInt(0, islands.length - 1), 1);
    const current = bridgeLayout(islands);
    if (current.connected && bridgeSolutions(islands, current.edges, current.demand) === 1) {
      layout = current;
      break;
    }
  }
  const route: Point[] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [2, 2],
    [3, 2],
    [4, 2],
    [4, 3],
  ];
  const orientation = randomInt(0, 7);
  const { islands, edges, count, demand } =
    layout ?? bridgeLayout(route.map((p) => orientPoint(p, 5, orientation)));
  const columns = [...new Set(islands.map(([x]) => x))].sort((a, b) => a - b);
  const rows = [...new Set(islands.map(([, y]) => y))].sort((a, b) => a - b);
  const cuts = (values: number[]) =>
    shuffle(values.slice(1).map((last, i) => (last + values[i]) / 2))
      .slice(0, 2)
      .sort((a, b) => a - b);
  const axes = [cuts(columns), cuts(rows)] as const;
  const screenX = (x: number) => 40 + ((x - columns[0]) / (columns.at(-1)! - columns[0])) * 144;
  const screenY = (y: number) => 40 + ((y - rows[0]) / (rows.at(-1)! - rows[0])) * 131;
  const marks: DrawingMark[] = [];
  const digits = axes.flatMap((selected, axis) =>
    selected.map((cut, i) => {
      const name = CODE_POSITIONS[axis * 2 + i];
      if (axis === 0) {
        marks.push(
          line([screenX(cut), 29], [screenX(cut), 190], 'focus', 1, true),
          label([screenX(cut), 16], name, 14, 'accent'),
        );
      } else {
        marks.push(
          line([28, screenY(cut)], [203, screenY(cut)], 'focus', 1, true),
          label([15, screenY(cut)], name, 14, 'accent'),
        );
      }
      return edges.reduce(
        (sum, [a, b], index) =>
          sum + (islands[a][axis] < cut && cut < islands[b][axis] ? count[index] : 0),
        0,
      );
    }),
  );
  islands.forEach(([x, y], i) => {
    const center: Point = [screenX(x), screenY(y)];
    marks.push(dot(center, 12, 'paper', 'ink'), label(center, demand[i], 14));
  });
  const description = `Îles par position (colonne, rangée) : ${islands.map(([x, y], i) => `(${x}, ${y}) exige ${demand[i]}`).join(' ; ')}. Repères verticaux A et B aux colonnes ${axes[0].join(' et ')}, horizontaux C et D aux rangées ${axes[1].join(' et ')}.`;
  const screen = ([x, y]: Point): Point => [screenX(x), screenY(y)];
  return boardRound(
    digits,
    [
      {
        ...diagram(216, 200, marks, description),
        edges: edges.map(([a, b]) => ({
          from: screen(islands[a]),
          to: screen(islands[b]),
          double: true,
          description: `Pont de l’île colonne ${islands[a][0] + 1}, rangée ${islands[a][1] + 1} à l’île colonne ${islands[b][0] + 1}, rangée ${islands[b][1] + 1}`,
        })),
      },
    ],
    {
      instruction:
        'Relie toutes les îles avec des ponts horizontaux ou verticaux, un ou deux par paire. Aucun pont ne traverse une île ni un autre pont. Chaque île indique son total de ponts. Compte les ponts qui coupent chaque repère, les doubles comptent pour deux.',
      solutionHint:
        'Cherche les îles qui ont peu de voisines accessibles. Une île de total 4 qui a seulement deux voisines force un pont double vers chacune. Après chaque pont placé, retire-le du total restant aux deux extrémités et écarte les liaisons qu’il bloquerait.',
      workedExample: {
        clue: diagram(
          160,
          76,
          [
            line([51, 12], [51, 64], 'accent', 1, true),
            ...[2, 4, 2].flatMap((count, i) => {
              const at: Point = [24 + i * 56, 38];
              return [dot(at, 11, 'paper', 'ink'), label(at, count)];
            }),
          ],
          'Trois îles alignées avec 2, 4 et 2 ponts requis. Un repère coupe le passage de gauche.',
        ),
        explanation:
          'L’île du milieu a besoin de quatre ponts avec seulement deux voisines. Elle doit tracer un pont double vers chaque côté, ce qui satisfait aussi les deux îles aux extrémités. Le repère en pointillé coupe les deux ponts qui vont vers la gauche.',
      },
    },
  );
}

let allLatinGrids: number[][] | undefined;

function latinGrids(): number[][] {
  if (allLatinGrids) return allLatinGrids;
  const permutations = (numbers: readonly number[]): number[][] =>
    numbers.length
      ? numbers.flatMap((n) =>
          permutations(numbers.filter((p) => p !== n)).map((rest) => [n, ...rest]),
        )
      : [[]];
  const orders = permutations([1, 2, 3, 4]);
  const layers = (rows: readonly number[][]): number[][] => {
    if (rows.length === 4) return [rows.flat()];
    return orders
      .filter((row) => row.every((value, x) => rows.every((line) => line[x] !== value)))
      .flatMap((row) => layers([...rows, row]));
  };
  allLatinGrids = layers([]);
  return allLatinGrids;
}

const DIRECTIONS = ['top', 'bottom', 'left', 'right'] as const;

function skyscrapers() {
  const size = 4;
  const solution = pick(latinGrids());
  const row = (y: number) => solution.slice(y * size, y * size + size);
  const col = (x: number) => range(size).map((y) => solution[y * size + x]);
  const full = {
    top: range(size).map((x) => visibleTowers(col(x))),
    bottom: range(size).map((x) => visibleTowers(col(x).reverse())),
    left: range(size).map((y) => visibleTowers(row(y))),
    right: range(size).map((y) => visibleTowers(row(y).reverse())),
  };
  const missing = Object.fromEntries(
    DIRECTIONS.map((direction) => [direction, randomInt(0, 3)]),
  ) as Record<(typeof DIRECTIONS)[number], number>;
  const puzzle = {
    size,
    solution,
    givens: {} as Record<number, number>,
    top: [...full.top],
    bottom: [...full.bottom],
    left: [...full.left],
    right: [...full.right],
  };
  for (const direction of DIRECTIONS) puzzle[direction][missing[direction]] = 0;
  for (const i of shuffle(range(size * size))) {
    if (solveSkyscrapers(puzzle).length === 1) break;
    puzzle.givens[i] = solution[i];
  }
  const edge = (direction: (typeof DIRECTIONS)[number], index: number) => {
    const i = DIRECTIONS.indexOf(direction);
    return index === missing[direction]
      ? cell(`${CODE_POSITIONS[i]}${['↓', '↑', '→', '←'][i]}`, 'target')
      : cell(full[direction][index], 'heading');
  };
  const empty = cell('', 'spacer');
  const rows = [
    [empty, ...range(size).map((x) => edge('top', x)), empty],
    ...range(size).map((y) => [
      edge('left', y),
      ...range(size).map((x) => {
        const value = puzzle.givens[y * size + x];
        return value ? cell(value) : choiceCell('', '1234');
      }),
      edge('right', y),
    ]),
    [empty, ...range(size).map((x) => edge('bottom', x)), empty],
  ];
  return boardRound(
    DIRECTIONS.map((direction) => full[direction][missing[direction]]),
    [grid(rows)],
    {
      instruction:
        'Chaque rangée et colonne contient une fois les hauteurs de 1 à 4. Les nombres autour de la grille comptent les immeubles visibles depuis ce bord, un grand cachant les plus petits derrière lui. Déduis les quatre nombres masqués.',
      solutionHint:
        'Un indice de 1 force un immeuble de hauteur 4 juste au bord. Un indice de 4 force les hauteurs dans l’ordre croissant depuis ce bord. Une fois la grille remplie, suis chaque flèche et compte une tour chaque fois que sa hauteur dépasse toutes celles déjà rencontrées.',
      workedExample: {
        clue: grid([[cell('→', 'target'), 2, 1, 4, 3]], 'Vue de gauche'),
        explanation:
          'On voit d’abord la tour de hauteur 2, qui cache celle de hauteur 1. La tour de hauteur 4 dépasse toutes les précédentes et cache celle de hauteur 3. On voit donc exactement deux tours.',
      },
    },
  );
}

function inequalities() {
  const size = 4;
  const variants = latinGrids();
  const solution = pick(variants);
  const pairs = range(size * size).flatMap((i) => {
    const next: [number, number][] = [];
    if (i % size < size - 1) next.push([i, i + 1]);
    if (i < size * (size - 1)) next.push([i, i + size]);
    return next;
  });
  const smaller = ([a, b]: readonly [number, number], numbers: readonly number[]) =>
    numbers[a] < numbers[b];
  const relationships = shuffle(pairs).slice(0, 11);
  let matching = variants.filter((values) =>
    relationships.every((pair) => smaller(pair, solution) === smaller(pair, values)),
  );
  const givens = new Set<number>();
  for (const i of shuffle(range(size * size))) {
    if (matching.length === 1) break;
    if (matching.every((values) => values[i] === solution[i])) continue;
    givens.add(i);
    matching = matching.filter((values) => values[i] === solution[i]);
  }
  const targets = shuffle(range(size * size).filter((i) => !givens.has(i))).slice(0, 4);
  const rows = range(size * 2 - 1).map(() => range(size * 2 - 1).map(() => cell('', 'spacer')));
  for (const i of range(size * size)) {
    const at = targets.indexOf(i);
    const x = (i % size) * 2;
    const y = Math.floor(i / size) * 2;
    rows[y][x] = givens.has(i)
      ? cell(solution[i])
      : choiceCell(CODE_POSITIONS[at] ?? '', '1234', at >= 0 ? 'target' : undefined);
  }
  for (const pair of relationships) {
    const [a, b] = pair;
    const x = (a % size) * 2;
    const y = Math.floor(a / size) * 2;
    const less = smaller(pair, solution);
    if (b === a + 1) rows[y][x + 1] = cell(less ? '<' : '>', 'heading');
    else rows[y + 1][x] = cell(less ? '∧' : '∨', 'heading');
  }
  return boardRound(
    targets.map((i) => solution[i]),
    [grid(rows)],
    {
      instruction:
        'Place les chiffres de 1 à 4 une fois par rangée et par colonne. Les chevrons pointent vers la plus petite valeur. Lis les cases A à D.',
      solutionHint:
        'Utilise les chevrons pour réduire les possibilités. Une case plus petite que sa voisine vaut au plus 3. Une fois un chiffre placé, retire-le des possibilités dans le reste de sa rangée et de sa colonne. Répète ces deux déductions.',
      workedExample: {
        clue: grid([[cell('?', 'target'), cell('<', 'heading'), 2]]),
        explanation:
          'Le chevron pointe vers la case inconnue, qui doit être plus petite que 2. Parmi les chiffres de 1 à 4, seul le 1 convient. Tu peux ensuite retirer le 1 des possibilités des autres cases de cette rangée et de cette colonne.',
      },
    },
  );
}

const PIPS: readonly (readonly Point[])[] = [
  [],
  [[0, 0]],
  [
    [-1, -1],
    [1, 1],
  ],
  [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  [
    [-1, -1],
    [1, -1],
    [0, 0],
    [-1, 1],
    [1, 1],
  ],
  [
    [-1, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
  ],
];

function dominos() {
  const chain = shuffle(range(7));
  const selected = shuffle(range(6))
    .slice(0, 4)
    .sort((a, b) => a - b);
  const tiles = shuffle(
    chain.slice(1).map((right, i) => {
      const left = chain[i];
      return {
        values: randomInt(0, 1) ? [left, right] : [right, left],
        marked: selected.includes(i),
      };
    }),
  );
  const marks: DrawingMark[] = [];
  tiles.forEach(({ values, marked }, i) => {
    const left = 9 + (i % 2) * 106;
    const top = 13 + Math.floor(i / 2) * 52;
    marks.push(box([left, top], 76, 34, 'paper', marked ? 'accent' : 'ink'));
    marks.push(line([left + 38, top + 1], [left + 38, top + 33], 'muted', 1));
    if (marked) marks.push(label([left + 87, top + 17], '★', 13, 'accent'));
    values.forEach((value, half) => {
      PIPS[value].forEach(([x, y]) =>
        marks.push(dot([left + 19 + half * 38 + x * 9, top + 17 + y * 9], 2.3)),
      );
    });
  });
  return boardRound(
    selected.map((index) => chain[index + 1]),
    [
      diagram(
        216,
        160,
        marks,
        `Dominos mélangés : ${tiles.map(({ values, marked }) => values.join('–') + (marked ? ' avec étoile' : '')).join(' ; ')}.`,
      ),
    ],
    {
      instruction: `La première moitié à gauche vaut ${chain[0]}. Raccorde les dominos par les valeurs identiques et retourne-les au besoin. Dans l’ordre de la chaîne, lis la moitié droite des quatre dominos étoilés.`,
      solutionHint:
        'Oriente le domino de départ pour que la valeur indiquée soit à gauche. Cherche ensuite, parmi les dominos libres, celui qui porte la valeur de la moitié droite. Raccorde les moitiés identiques et répète jusqu’au bout de la chaîne.',
      workedExample: {
        clue: textClue(['★ 4 | 2', '1 | 2', '4 | 5'], false, 'Départ à 1'),
        explanation:
          'Le départ impose le domino 1 | 2. Pour continuer par un 2, retourne le domino étoilé afin de lire 2 | 4, puis raccorde 4 | 5. La moitié droite du domino étoilé dans la chaîne vaut 4.',
      },
    },
  );
}

function knight() {
  const size = 6;
  const squares: Point[] = range(size * size).map((i) => [i % size, Math.floor(i / size)]);
  const edges = squares.map(([x, y]) =>
    range(squares.length).filter(
      (i) => Math.abs(squares[i][0] - x) * Math.abs(squares[i][1] - y) === 2,
    ),
  );
  const route = (trail: number[]): number[] | undefined => {
    if (trail.length === 10) return trail;
    for (const next of shuffle(edges[trail.at(-1)!])) {
      if (trail.includes(next) || trail.slice(0, -1).some((i) => edges[next].includes(i))) continue;
      const extended = route([...trail, next]);
      if (extended) return extended;
    }
    return undefined;
  };
  const passage = shuffle(range(squares.length)).reduce<number[] | undefined>(
    (found, start) => found ?? route([start]),
    undefined,
  )!;
  const open = new Set(passage);
  for (const i of shuffle(range(squares.length))) {
    if (!open.has(i) && edges[i].filter((neighbor) => open.has(neighbor)).length === 1) open.add(i);
    if (open.size === 13) break;
  }
  const distractors = range(squares.length).map(() => randomInt(0, 9));
  const steps = [2, 4, 6, 8];
  const rows = range(size).map((y) =>
    range(size).map((x) => {
      const i = y * size + x;
      if (i === passage[0]) return cell('E', 'target');
      if (i === passage.at(-1)) return cell('S', 'target');
      return open.has(i) ? cell(distractors[i], undefined, true) : cell('', 'blocked');
    }),
  );
  return boardRound(
    steps.map((step) => distractors[passage[step]]),
    [grid(rows)],
    {
      instruction:
        'Va d’E à S en neuf sauts de cavalier, sans revenir sur une case. Un saut fait deux cases dans un sens, puis une perpendiculairement. Tu peux franchir une case hachurée, mais pas y atterrir. Lis les chiffres après les sauts 2, 4, 6 et 8.',
      solutionHint:
        'Pars de S et remonte les sauts possibles vers E. Quand une branche se termine sans atteindre E, reviens à la dernière bifurcation. Une fois le trajet trouvé, numérote les sauts dans le sens E vers S pour relever les cases demandées.',
      workedExample: {
        clue: grid(
          ['E....', '....S', '.5...', '...7.'].map((row) =>
            [...row].map((value) =>
              value === '.'
                ? cell('', 'blocked')
                : cell(value, /[ES]/.test(value) ? 'target' : undefined),
            ),
          ),
        ),
        explanation:
          'Depuis S, un saut de deux cases vers le bas et d’une à gauche mène au 7. De là, deux cases à gauche et une vers le haut mènent au 5, puis un dernier saut mène à E. Dans le sens E vers S, le 7 se trouve au deuxième saut.',
      },
    },
  );
}

function crossDeduction() {
  const names = ['Ana', 'Léa', 'Max', 'Zoé'];
  const places = ['à la gare', 'au parc', 'au quai', 'à la serre'];
  const items = ['la boussole', 'la clé', 'la loupe', 'la plume'];
  const digits = shuffle(range(10))
    .slice(0, names.length)
    .sort((a, b) => a - b);
  const locationOf = shuffle(range(names.length));
  const itemAt = shuffle(range(names.length));
  const numberFor = shuffle(range(names.length));
  const personOrder = shuffle(range(names.length));
  const placeOrder = shuffle(range(names.length));
  const itemOrder = shuffle(range(names.length));
  const [p0, p1, p2, p3] = personOrder;
  const [l0, l1, l2, l3] = placeOrder;
  const [i0, i1, i2, i3] = itemOrder;
  const lookup = (item: number) => `La personne qui a ${items[item]}`;
  const clues = shuffle([
    `${names[p0]} se trouve ${places[locationOf[p0]]}.`,
    `${names[p1]} se trouve ${places[locationOf[p1]]}.`,
    `${names[p2]} ne se trouve pas ${places[locationOf[p3]]}.`,
    `${lookup(itemAt[l0])} se trouve ${places[l0]}.`,
    `${lookup(itemAt[l1])} se trouve ${places[l1]}.`,
    `${lookup(itemAt[l3])} ne se trouve pas ${places[l2]}.`,
    `${lookup(i0)} a le chiffre ${digits[numberFor[i0]]}.`,
    `${lookup(i1)} a le chiffre ${digits[numberFor[i1]]}.`,
    `${lookup(i2)} n’a pas le chiffre ${digits[numberFor[i3]]}.`,
  ]);
  const checklist = (values: readonly (string | number)[], title: string) =>
    grid(
      [
        [cell('', 'heading'), ...values.map((value) => cell(value, 'heading'))],
        ...names.map((name) => [
          cell(name, 'heading'),
          ...values.map(() => cell('', undefined, true)),
        ]),
      ],
      title,
    );
  return boardRound(
    locationOf.map((location) => digits[numberFor[itemAt[location]]]),
    [
      textClue(clues, true, 'Indices'),
      checklist(['G', 'P', 'Q', 'S'], 'Lieux · G gare · P parc · Q quai · S serre'),
      checklist(['B', 'C', 'L', 'P'], 'Objets · B boussole · C clé · L loupe · P plume'),
      checklist(digits, 'Chiffres'),
    ],
    {
      instruction:
        'Chaque personne a un lieu, un objet et un chiffre différents. Utilise les indices pour établir les associations. Lis les chiffres d’Ana, Léa, Max et Zoé dans cet ordre.',
      solutionHint:
        'Associe d’abord chaque personne à un lieu, puis chaque lieu à un objet et chaque objet à un chiffre. Une association confirmée élimine les autres choix pour chacun des deux éléments. Relie ensuite ces trois associations pour retrouver le chiffre de chaque personne.',
      workedExample: {
        clue: textClue(
          [
            'Lina est à la bibliothèque.',
            'La personne à la bibliothèque a la carte.',
            'La carte est associée au 4.',
          ],
          true,
        ),
        explanation:
          'Lina étant à la bibliothèque, le deuxième indice lui attribue la carte. Cette carte donne ensuite son chiffre, le 4. Dans une grille, tu peux confirmer chaque lien et éliminer les autres choix de Lina.',
      },
    },
  );
}

function codeDeduction(): PuzzleContent {
  const { solution, clues } = createCodeDeductionPuzzle();

  return {
    answer: solution,
    shared: [{ kind: 'code-deduction', clues }],
    instruction: 'Le code contient quatre chiffres différents et peut commencer par zéro.',
    solutionHint:
      'Additionne les deux nombres de chaque ligne pour savoir combien de chiffres de l’essai se trouvent dans le code. Élimine les groupes de quatre chiffres qui ne respectent pas ces totaux. Ensuite, utilise la colonne « Bien placés » pour choisir un ordre qui respecte tous les essais.',
    workedExample: {
      clue: textClue(
        [
          '728 → 1 bien placé · 1 mal placé',
          '259 → 0 bien placé · 2 mal placés',
          '790 → 2 bien placés · 0 mal placé',
        ],
        true,
        'Exemple à trois chiffres',
      ),
      explanation:
        'Si le 0 terminait le code, les deux places restantes devraient contenir deux chiffres de 728 et deux chiffres de 259. Ces essais ont seulement le 2 en commun. Les deux chiffres bien placés de 790 sont donc le 7 et le 9. Pour 728, un 8 à la fin serait bien placé. Le 2 en dernière position donne le chiffre mal placé demandé. On obtient 792.',
    },
  };
}

export const DEDUCTION_MECHANICS: readonly Mechanic[] = [
  { title: 'Les ponts qui traversent', generate: bridges },
  { title: 'Les gratte-ciel visibles', generate: skyscrapers },
  { title: 'Les inégalités ordonnées', generate: inequalities },
  { title: 'La chaîne de dominos', generate: dominos },
  { title: 'Le cavalier et les cases numérotées', generate: knight },
  { title: 'La grille de déduction croisée', generate: crossDeduction },
  { title: 'Déduction de Nombre', generate: codeDeduction },
];
