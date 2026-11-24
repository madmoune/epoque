import { WINNING_LINES } from '../games/tic-tac-toe/tic-tac-toe.logic';
import { range, shuffle } from '../new-games/random';
import {
  boardRound,
  Cell,
  cell,
  choiceCell,
  diagram,
  grid,
  gridNeighbors,
  individualRound,
  label,
  latticeEdges,
  line,
  Mechanic,
  orientPoint,
  pick,
  Point,
  randomInt,
} from './cadenas-mystere.model';

function rowsOf<T>(size: number, cells: readonly T[]): T[][] {
  return range(size).map((row) => cells.slice(row * size, (row + 1) * size));
}

const ISLANDS: readonly (readonly (readonly Point[])[])[] = [
  [[[0, 0]]],
  [
    [
      [0, 0],
      [1, 0],
    ],
  ],
  [
    [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    [
      [0, 0],
      [1, 0],
      [0, 1],
    ],
  ],
  [
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ],
  ],
];

function archipelago() {
  const size = 8;
  const occupied = new Set<number>();
  const groups = [4, 3, 2, 1, ...range(randomInt(2, 5)).map(() => randomInt(1, 4))];
  const counts = [0, 0, 0, 0];
  for (const length of groups) {
    const orientation = randomInt(0, 7);
    const raw = pick(ISLANDS[length - 1]).map((p) => orientPoint(p, 4, orientation));
    const top = Math.min(...raw.map(([, y]) => y));
    const left = Math.min(...raw.map(([x]) => x));
    const shape = raw.map(([x, y]): Point => [x - left, y - top]);
    const available = range(size * size).flatMap((i) => {
      const x = i % size;
      const y = Math.floor(i / size);
      if (shape.some(([dx, dy]) => x + dx >= size || y + dy >= size)) return [];
      const positions = shape.map(([dx, dy]) => (y + dy) * size + x + dx);
      return positions.every(
        (at) => !occupied.has(at) && !gridNeighbors(at, size).some((p) => occupied.has(p)),
      )
        ? [positions]
        : [];
    });
    if (!available.length) continue;
    pick(available).forEach((i) => occupied.add(i));
    counts[length - 1]++;
  }
  const cells = range(size * size).map((i) =>
    occupied.has(i) ? cell('', 'filled', true) : cell(''),
  );
  return boardRound(counts, [grid(rowsOf(size, cells))], {
    instruction:
      'Les cases colorées forment un îlot quand elles se touchent par les côtés. Les coins ne comptent pas. De A à D, compte les îlots de 1, 2, 3 et 4 cases.',
    solutionHint:
      'Pars d’une case colorée et marque toutes celles que tu peux rejoindre de côté en côté. Note la taille du groupe, puis recommence sur une case colorée encore sans marque. Regroupe les îlots par taille.',
    workedExample: {
      clue: grid(
        ['11001', '00000', '01110'].map((row) =>
          [...row].map((value) => cell('', value === '1' ? 'filled' : undefined)),
        ),
      ),
      explanation:
        'En haut à gauche, deux cases se touchent de côté et forment un seul îlot de taille 2. La case du coin supérieur droit forme un îlot de taille 1. Les trois cases du bas forment ensemble un îlot de taille 3.',
    },
  });
}

type TicTacTask = { marks: number[]; digit: number };
let winningBoards: TicTacTask[] | undefined;

function winningMove() {
  winningBoards ??= range(3 ** 9).flatMap((encoded): TicTacTask[] => {
    const marks = range(9).map((i) => Math.floor(encoded / 3 ** i) % 3);
    const x = marks.filter((mark) => mark === 1).length;
    if (x < 2 || x !== marks.filter((mark) => mark === 2).length) return [];
    if (WINNING_LINES.some((line) => line.every((i) => marks[i] && marks[i] === marks[line[0]])))
      return [];
    const winners = new Set(
      WINNING_LINES.flatMap((line) =>
        line.filter((i) => marks[i] === 1).length === 2 ? line.filter((i) => marks[i] === 0) : [],
      ),
    );
    return winners.size === 1 ? [{ marks, digit: [...winners][0] + 1 }] : [];
  });
  return individualRound(
    shuffle(winningBoards)
      .slice(0, 4)
      .map(({ marks, digit }) => ({
        digit,
        clue: grid(
          rowsOf(
            3,
            marks.map((mark, i) =>
              mark === 1 ? cell('X', 'filled') : mark === 2 ? cell('O', 'target') : cell(i + 1),
            ),
          ),
        ),
      })),
    {
      instruction:
        'Tu joues X. Relève le numéro de l’unique case libre qui permet d’aligner trois X immédiatement.',
      solutionHint:
        'Regarde les rangées, les colonnes et les diagonales. Cherche un alignement qui contient deux X et une case libre. Lis le numéro de cette case.',
      workedExample: {
        clue: grid([[cell('X', 'filled'), cell('X', 'filled'), 3]]),
        explanation:
          'Cette rangée contient déjà deux X. Place le troisième X dans la case libre pour compléter l’alignement. Son numéro est 3.',
      },
    },
  );
}

function cellColony() {
  const size = 4;
  const neighbors = range(size * size).map((i) => gridNeighbors(i, size, true));
  const next = (live: ReadonlySet<number>): number =>
    neighbors.filter((adjacent, i) => {
      const count = adjacent.filter((n) => live.has(n)).length;
      return count === 3 || (count === 2 && live.has(i));
    }).length;
  const tasks = range(4).map(() => {
    const occupied = shuffle(range(size * size)).slice(0, randomInt(5, 8));
    while (next(new Set(occupied)) > 9) occupied.pop();
    const live = new Set(occupied);
    const cells = range(size * size).map((i) =>
      live.has(i) ? cell('●', 'filled', true) : cell('', undefined, true),
    );
    return { clue: grid(rowsOf(size, cells)), digit: next(live) };
  });
  return individualRound(tasks, {
    instruction:
      'Les points indiquent les cellules vivantes. Compte les voisines, diagonales comprises. Une cellule vivante survit avec 2 ou 3 voisines. Une cellule vide naît avec exactement 3 voisines. Applique les changements en même temps et compte les cellules vivantes.',
    solutionHint:
      'Fais tous les décomptes de voisines sur la grille de départ. Marque les cases où une cellule survit, puis les cases vides où une cellule naît. Additionne les deux groupes de marques.',
    workedExample: {
      clue: grid([
        ['', '', ''],
        [cell('●', 'filled'), cell('●', 'filled'), cell('●', 'filled')],
        ['', '', ''],
      ]),
      explanation:
        'La cellule du milieu a deux voisines et survit. Les deux cellules aux extrémités ont une seule voisine et disparaissent. Les cases au-dessus et au-dessous du centre touchent chacune les trois cellules de départ, donc deux nouvelles cellules naissent. Le total est de 3.',
    },
  });
}

function maximumPartners() {
  const tasks = shuffle([2, 3, 4, 4]).map((poolSize) => {
    const pool = shuffle(range(4)).slice(0, poolSize);
    const partners = range(4).map(() =>
      shuffle(pool).slice(0, randomInt(1, Math.min(3, poolSize))),
    );
    const match = (row: number, used: number): number => {
      if (row === partners.length) return 0;
      const skip = match(row + 1, used);
      const choices = partners[row]
        .filter((col) => !(used & (1 << col)))
        .map((col) => 1 + match(row + 1, used | (1 << col)));
      return Math.max(skip, ...choices);
    };
    const rows = [
      [cell('', 'heading'), ...range(4).map((i) => cell(i + 1, 'heading'))],
      ...partners.map((options, i) => [
        cell('JKLM'[i], 'heading'),
        ...range(4).map((x) => (options.includes(x) ? cell('✓', 'filled', true) : cell('–'))),
      ]),
    ];
    return { digit: match(0, 0), clue: grid(rows) };
  });
  return individualRound(tasks, {
    instruction:
      'Les coches indiquent les paires possibles. Forme le maximum de paires en utilisant chaque lettre et chaque chiffre au plus une fois.',
    solutionHint:
      'Pour chaque lettre, essaie chaque partenaire encore libre et garde aussi l’option de laisser la lettre seule. Chaque paire réserve une rangée et une colonne. Compare les combinaisons et garde celle qui donne le plus de paires.',
    workedExample: {
      clue: grid([
        [cell('', 'heading'), cell(1, 'heading'), cell(2, 'heading'), cell(3, 'heading')],
        [cell('J', 'heading'), '✓', '✓', '–'],
        [cell('K', 'heading'), '✓', '–', '–'],
        [cell('L', 'heading'), '–', '✓', '✓'],
      ]),
      explanation:
        'K a un seul choix, le 1. En lui réservant le 1, il reste le 2 pour J et le 3 pour L. Les trois lettres ont un partenaire différent. Le maximum est donc de 3 paires.',
    },
  });
}

let binaryBoards: number[][] | undefined;

function binairoBoards(): number[][] {
  const validRows = range(16)
    .map((bits) => range(4).map((i) => (bits >> i) & 1))
    .filter((row) => row.filter(Boolean).length === 2);
  const build = (chosen: readonly number[][]): number[][] => {
    if (chosen.length < 4) {
      return validRows
        .filter((row) => !chosen.includes(row))
        .flatMap((row) => build([...chosen, row]));
    }
    const columns = range(4).map((x) => chosen.map((row) => row[x]).join(''));
    return new Set(columns).size === 4 && columns.every((col) => col.split('1').length === 3)
      ? [chosen.flat()]
      : [];
  };
  return build([]);
}

function twoToneBoard() {
  binaryBoards ??= binairoBoards();
  const boards = binaryBoards;
  return individualRound(
    shuffle(boards)
      .slice(0, 4)
      .map((solution) => {
        const givens = new Set(range(16));
        for (const i of shuffle([...givens])) {
          givens.delete(i);
          if (
            boards.some(
              (other) => other !== solution && [...givens].every((n) => solution[n] === other[n]),
            )
          )
            givens.add(i);
          if (givens.size <= 5) break;
        }
        const cells = solution.map((digit, i): Cell => {
          const role = i % 5 === 0 ? 'target' : undefined;
          return givens.has(i) ? cell(digit, role) : choiceCell('', '01', role);
        });
        return {
          clue: grid(rowsOf(4, cells)),
          digit: range(4).filter((i) => solution[i * 5] === 1).length,
        };
      }),
    {
      instruction:
        'Complète la grille avec deux 0 et deux 1 par rangée et par colonne. Deux rangées ou deux colonnes ne peuvent pas être identiques. Compte les 1 sur la diagonale marquée.',
      solutionHint:
        'Quand une rangée ou une colonne contient déjà deux 0, remplis le reste avec des 1, et inversement. Si un choix recrée une rangée ou une colonne identique, essaie l’autre chiffre. Compte ensuite les 1 sur la diagonale mise en évidence.',
      workedExample: {
        clue: grid([[0, '', 0, '']]),
        explanation:
          'Cette rangée contient déjà ses deux 0. Place un 1 dans chacune des cases vides pour obtenir la rangée 0 · 1 · 0 · 1. Il reste à vérifier que les colonnes et les autres rangées acceptent ce placement.',
      },
    },
  );
}

type HitoriBoard = { digits: number[]; shaded: number };
let hitoriBoards: HitoriBoard[] | undefined;

function createHitoriPool(): HitoriBoard[] {
  const size = 3;
  const cells = range(size * size);
  const adjacent = cells.map((i) => gridNeighbors(i, size));
  const validMasks = range(1 << cells.length).flatMap((mask) => {
    const shaded = cells.filter((i) => mask & (1 << i));
    if (shaded.some((i) => adjacent[i].some((n) => mask & (1 << n)))) return [];
    const white = cells.filter((i) => !(mask & (1 << i)));
    const connected = new Set([white[0]]);
    for (const i of connected) {
      adjacent[i].filter((n) => !(mask & (1 << n))).forEach((n) => connected.add(n));
    }
    return connected.size === white.length ? [{ mask, count: shaded.length }] : [];
  });
  const pairs = cells.flatMap((a) =>
    cells
      .filter(
        (b) => b > a && (a % size === b % size || Math.floor(a / size) === Math.floor(b / size)),
      )
      .map((b) => [a, b] as const),
  );
  return range(3 ** cells.length).flatMap((encoded): HitoriBoard[] => {
    const digits = cells.map((i) => 1 + (Math.floor(encoded / 3 ** i) % 3));
    const clashes = pairs
      .filter(([a, b]) => digits[a] === digits[b])
      .map(([a, b]) => (1 << a) | (1 << b));
    let shaded = 0;
    let solutions = 0;
    for (const { mask, count } of validMasks) {
      if (!clashes.every((pair) => pair & mask)) continue;
      if (++solutions > 1) return [];
      shaded = count;
    }
    return solutions === 1 && shaded > 0 ? [{ digits, shaded }] : [];
  });
}

function hitori() {
  hitoriBoards ??= createHitoriPool();
  return individualRound(
    shuffle(hitoriBoards)
      .slice(0, 4)
      .map(({ digits, shaded }) => ({
        digit: shaded,
        clue: grid(
          rowsOf(
            3,
            digits.map((digit) => cell(digit, undefined, true)),
          ),
        ),
      })),
    {
      instruction:
        'Noircis des cases (une case marquée compte comme noircie). Les chiffres restants sont uniques dans leur rangée et leur colonne. Les cases noircies ne se touchent pas par un côté et les autres restent reliées. Compte les cases noircies.',
      solutionHint:
        'Dès que tu noircis une case, toutes ses voisines par un côté restent blanches. Si tu gardes un chiffre sur une case blanche, noircis ses doublons dans sa rangée et sa colonne. Écarte les essais qui isolent une case ou un groupe de cases blanches.',
      workedExample: {
        clue: grid([[2, 2, 2]]),
        explanation:
          'Pour garder un seul 2 dans cette rangée, il faut noircir deux cases. Les deux extrémités sont la seule paire qui ne se touche pas par un côté. On les noircit et on garde le 2 du milieu.',
      },
    },
  );
}

const RECTANGLE_SIZE = 4;
type Rectangle = { x: number; y: number; width: number; height: number };
type RectangleClue = { cell: number; area: number };

function rectangleCells({ x, y, width, height }: Rectangle): number[] {
  return range(height).flatMap((dy) =>
    range(width).map((dx) => (y + dy) * RECTANGLE_SIZE + x + dx),
  );
}

function bisectRegions() {
  const size = RECTANGLE_SIZE;
  const pieces: Rectangle[] = [{ x: 0, y: 0, width: size, height: size }];
  const total = randomInt(5, 7);
  while (pieces.length < total || pieces.some(({ width, height }) => width * height > 8)) {
    const large = pieces.filter(({ width, height }) => width * height > 8);
    const room = pick(
      large.length ? large : pieces.filter(({ width, height }) => width * height > 1),
    );
    const vertical = room.height === 1 || (room.width > 1 && randomInt(0, 1) === 0);
    const cut = randomInt(1, (vertical ? room.width : room.height) - 1);
    const x = room.x + (vertical ? cut : 0);
    const y = room.y + (vertical ? 0 : cut);
    pieces.splice(
      pieces.indexOf(room),
      1,
      { ...room, width: vertical ? cut : room.width, height: vertical ? room.height : cut },
      {
        x,
        y,
        width: vertical ? room.width - cut : room.width,
        height: vertical ? room.height : room.height - cut,
      },
    );
  }
  return pieces;
}

function rectangleMasks() {
  const size = RECTANGLE_SIZE;
  return range(size * size).flatMap((i) => {
    const x = i % size;
    const y = Math.floor(i / size);
    return range(size - x).flatMap((dx) =>
      range(size - y).map((dy) => {
        const cells = rectangleCells({ x, y, width: dx + 1, height: dy + 1 });
        return { area: cells.length, mask: cells.reduce((mask, cell) => mask | (1 << cell), 0) };
      }),
    );
  });
}

function uniqueTiling(
  clues: readonly RectangleClue[],
  rectangles: ReturnType<typeof rectangleMasks>,
): boolean {
  const occupiedClues = clues.reduce((mask, clue) => mask | (1 << clue.cell), 0);
  const cases = clues
    .map(({ cell, area }) =>
      rectangles.filter(
        (rectangle) => rectangle.area === area && (rectangle.mask & occupiedClues) === 1 << cell,
      ),
    )
    .sort((a, b) => a.length - b.length);
  let found = 0;
  const visit = (depth: number, used: number): void => {
    if (depth === cases.length) {
      found++;
      return;
    }
    for (const { mask } of cases[depth]) {
      if (!(used & mask)) visit(depth + 1, used | mask);
      if (found >= 2) return;
    }
  };
  visit(0, 0);
  return found === 1;
}

function tailoredRectangles() {
  const size = RECTANGLE_SIZE;
  const pool = rectangleMasks();
  const unit = 38;
  const padding = 12;
  const extent = padding + size * unit;
  const guide = range(size + 1).flatMap((i) => {
    const position = padding + i * unit;
    const inner = i > 0 && i < size;
    return [
      line(
        [position, padding],
        [position, extent],
        inner ? 'muted' : 'ink',
        inner ? 0.85 : 1.8,
        inner,
      ),
      line(
        [padding, position],
        [extent, position],
        inner ? 'muted' : 'ink',
        inner ? 0.85 : 1.8,
        inner,
      ),
    ];
  });
  const edges = latticeEdges(size, padding, unit, false);
  const makeClues = (regions: readonly Rectangle[]) =>
    regions.map((region) => {
      const cells = rectangleCells(region);
      return { cell: pick(cells), area: cells.length };
    });
  const create = () => {
    for (const _ of range(24)) {
      const regions = bisectRegions();
      const clues = makeClues(regions);
      if (uniqueTiling(clues, pool)) return { regions, clues };
    }
    // Single-cell clues surround the fallback rectangle, forcing its exact extent.
    const large = { x: randomInt(0, 2), y: randomInt(0, 1), width: 2, height: 3 };
    const occupied = new Set(rectangleCells(large));
    const regions = [
      large,
      ...range(size * size)
        .filter((i) => !occupied.has(i))
        .map((i) => ({ x: i % size, y: Math.floor(i / size), width: 1, height: 1 })),
    ];
    return { regions, clues: makeClues(regions) };
  };
  const tasks = range(4).map(() => {
    const { regions, clues } = create();
    const marks = [
      ...guide,
      ...clues.map(({ cell, area }) =>
        label(
          [
            padding + ((cell % size) + 0.5) * unit,
            padding + (Math.floor(cell / size) + 0.5) * unit,
          ],
          area,
          17,
        ),
      ),
    ];
    return {
      digit: regions.filter(({ height }) => height >= 2).length,
      clue: {
        ...diagram(
          extent + padding,
          extent + padding,
          marks,
          `Grille 4 par 4. ${clues.map(({ cell, area }) => `Aire ${area} en rangée ${Math.floor(cell / size) + 1}, colonne ${(cell % size) + 1}`).join('. ')}.`,
        ),
        edges,
      },
    };
  });
  return individualRound(tasks, {
    instruction:
      'Découpe toute la grille en rectangles sans chevauchement. Chaque rectangle contient un seul nombre, égal à son aire en cases. Compte les rectangles qui occupent au moins deux rangées.',
    solutionHint:
      'Un 1 occupe une case seule. Pour chaque autre indice, cherche des dimensions dont le produit donne ce nombre. Essaie les rectangles qui englobent l’indice seul. Commence par ceux qui ont un seul placement possible.',
    workedExample: {
      clue: grid([
        [2, 1],
        ['', 1],
      ]),
      explanation:
        'Les deux 1 occupent chacun une case dans la colonne de droite. Le rectangle du 2 peut donc seulement s’étendre vers le bas pour couvrir deux cases. C’est le seul rectangle sur deux rangées.',
    },
  });
}

export const COLLECTION_GRID_MECHANICS: readonly Mechanic[] = [
  { title: 'Archipel secret', generate: archipelago },
  { title: 'Le coup gagnant', generate: winningMove },
  { title: 'La colonie de cellules', generate: cellColony },
  { title: 'Les partenaires possibles', generate: maximumPartners },
  { title: 'Le tableau bicolore', generate: twoToneBoard },
  { title: 'La suppression interdite', generate: hitori },
  { title: 'Les rectangles sur mesure', generate: tailoredRectangles },
];
