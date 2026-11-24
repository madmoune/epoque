import { range, shuffle } from '../new-games/random';
import {
  boardRound,
  cell,
  CODE_POSITIONS,
  diagram,
  dot,
  DrawingMark,
  grid,
  gridNeighbors,
  individualRound,
  label,
  latticeEdges,
  line,
  Mechanic,
  pick,
  randomInt,
} from './cadenas-mystere.model';

function countMineSolutions(
  clues: ReadonlyMap<number, number>,
  size: number,
  total: number,
): number {
  const unknown = range(size * size).filter((i) => !clues.has(i));
  const touching = new Map(unknown.map((i) => [i, [] as { needed: number; free: number }[]]));
  const addConstraint = (cells: number[], needed: number) => {
    const constraint = { needed, free: cells.length };
    for (const i of cells) touching.get(i)!.push(constraint);
  };
  addConstraint(unknown, total);
  for (const [i, count] of clues)
    addConstraint(
      gridNeighbors(i, size, true).filter((n) => touching.has(n)),
      count,
    );
  const order = unknown.sort((a, b) => touching.get(b)!.length - touching.get(a)!.length);

  let found = 0;
  const solve = (index: number): void => {
    if (index === order.length) {
      found++;
      return;
    }
    const constraints = touching.get(order[index])!;
    for (const mined of [0, 1]) {
      for (const constraint of constraints) {
        constraint.free--;
        constraint.needed -= mined;
      }
      if (constraints.every(({ needed, free }) => needed >= 0 && needed <= free)) solve(index + 1);
      for (const constraint of constraints) {
        constraint.free++;
        constraint.needed += mined;
      }
      if (found >= 2) return;
    }
  };
  solve(0);
  return found;
}

function mines() {
  const size = 5;
  const total = randomInt(6, 9);
  const positions = shuffle(range(size * size));
  const mined = new Set(positions.slice(0, total));
  const safe = positions.slice(total);
  const clues = new Map(
    safe.map((i) => [i, gridNeighbors(i, size, true).filter((n) => mined.has(n)).length]),
  );
  let removed = 0;
  for (const i of safe) {
    const clue = clues.get(i)!;
    clues.delete(i);
    if (countMineSolutions(clues, size, total) !== 1) clues.set(i, clue);
    else if (++removed === 8) break;
  }
  const missing = randomInt(0, size - 1);
  const columns = range(size).filter((x) => x !== missing);
  const headers = range(size).map((x) =>
    cell(CODE_POSITIONS[columns.indexOf(x)] ?? '–', 'heading'),
  );
  const digits = columns.map((x) => [...mined].filter((i) => i % size === x).length);
  const rows = range(size).map((y) =>
    range(size).map((x) => {
      const clue = clues.get(y * size + x);
      return clue === undefined ? cell('', undefined, true) : cell(clue);
    }),
  );
  return boardRound(digits, [grid([headers, ...rows])], {
    instruction: `Il y a ${total} mines. Chaque chiffre compte les mines voisines, diagonales comprises. Une fois les mines placées, compte-les dans les colonnes A à D.`,
    solutionHint:
      'Pour chaque indice, soustrais les mines voisines déjà placées. S’il reste autant de mines que de cases voisines indéterminées, elles sont toutes minées. S’il reste zéro mine à placer, elles sont toutes sûres. Compare aussi les indices qui partagent des cases voisines.',
    workedExample: {
      clue: grid([
        ['', '', 1],
        [2, cell(2, 'target'), 1],
        [0, 0, 0],
      ]),
      explanation:
        'Le 2 du centre voit huit voisines et six affichent déjà un indice. Les deux cases vides au-dessus sont donc ses seules voisines susceptibles de recevoir une mine. Chacune doit en recevoir une.',
    },
  });
}

const PIXEL_DIGITS = [
  ['111', '101', '101', '101', '111'],
  ['010', '110', '010', '010', '111'],
  ['111', '001', '111', '100', '111'],
  ['111', '001', '111', '001', '111'],
  ['101', '101', '111', '001', '001'],
  ['111', '100', '111', '001', '111'],
  ['111', '100', '111', '101', '111'],
  ['111', '001', '010', '010', '010'],
  ['111', '101', '111', '101', '111'],
  ['111', '101', '111', '001', '111'],
];

function runs(bits: readonly number[]): string {
  return (bits.join('').match(/1+/g) ?? []).map((part) => part.length).join('·') || '–';
}

function nonogramClues(rows: number[][]) {
  return { left: rows.map(runs), top: rows[0].map((_, x) => runs(rows.map((row) => row[x]))) };
}

function nonogramSolutions(left: readonly string[], top: readonly string[]): number {
  const patterns = (length: number, clue: string): number[] =>
    range(1 << length).filter(
      (pattern) => runs(range(length).map((i) => (pattern >> i) & 1)) === clue,
    );
  const possibleRows = left.map((clue) => patterns(top.length, clue));
  const possibleColumns = top.map((clue) => patterns(left.length, clue));
  let found = 0;
  const visit = (y: number, columns: readonly (readonly number[])[]): void => {
    if (y === left.length) {
      found++;
      return;
    }
    for (const row of possibleRows[y]) {
      const next = columns.map((possibilities, x) =>
        possibilities.filter((col) => ((col >> y) & 1) === ((row >> x) & 1)),
      );
      if (next.every((col) => col.length)) visit(y + 1, next);
      if (found >= 2) return;
    }
  };
  visit(0, possibleColumns);
  return found;
}

function nonograms() {
  return individualRound(
    shuffle(range(10))
      .slice(0, 4)
      .map((digit) => {
        const base = PIXEL_DIGITS[digit];
        const variants = shuffle(
          range(3).flatMap((col) => range(base.length).map((row) => ({ col, row }))),
        ).map(({ col, row }) =>
          [...base.slice(0, row), base[row], ...base.slice(row)].map((line) =>
            [...line.slice(0, col), line[col], ...line.slice(col)].map(Number),
          ),
        );
        variants.push(base.map((row) => [...row].map(Number)));
        const { top, left } = variants
          .map(nonogramClues)
          .find(({ top, left }) => nonogramSolutions(left, top) === 1)!;
        return {
          digit,
          clue: grid([
            [cell('', 'spacer'), ...top.map((n) => cell(n.replaceAll('·', '\n'), 'column-clue'))],
            ...left.map((n) => [cell(n, 'heading'), ...top.map(() => cell('', undefined, true))]),
          ]),
        };
      }),
    {
      instruction:
        'Les indices donnent les longueurs des groupes à colorier, dans l’ordre. Laisse au moins une case vide entre deux groupes. Chaque dessin révèle un chiffre.',
      solutionHint:
        'Compare les placements possibles des blocs sur une même ligne. Colorie les cases communes à tous ses placements. Par exemple, un bloc de 4 sur 5 cases couvre forcément les trois cases du milieu. Utilise ensuite les cases confirmées pour affiner les colonnes, puis les lignes.',
      workedExample: {
        clue: grid([[cell('2\n2', 'column-clue')], [''], [''], [''], [''], ['']]),
        explanation:
          'Cette colonne a cinq cases. Les deux blocs de deux en occupent quatre, et une case vide doit les séparer. Colorie les cases 1 et 2, laisse la 3 vide, puis colorie les cases 4 et 5.',
      },
    },
  );
}

const LOOP_SIZE = 4;
type Loop = { inside: number; clues: number[] };
let loopPool: Loop[] | undefined;
let uniqueLoopPool: Loop[] | undefined;

function latticeLoops(): Loop[] {
  const size = LOOP_SIZE;
  const cells = range(size * size);
  const all = (1 << cells.length) - 1;
  let left = 0;
  let right = 0;
  for (const y of range(size)) {
    left |= 1 << (y * size);
    right |= 1 << (y * size + size - 1);
  }
  const rim = left | right | ((1 << size) - 1) | (((1 << size) - 1) << (size * (size - 1)));
  const flood = (from: number, region: number): number => {
    let reached = from;
    let next = from;
    do {
      reached = next;
      next =
        reached |
        ((((reached & ~left) >> 1) |
          ((reached & ~right) << 1) |
          (reached >> size) |
          (reached << size)) &
          region);
    } while (next !== reached);
    return reached;
  };
  const vertices = cells.filter((i) => i % size < size - 1 && i < size * (size - 1));
  const adjacent = cells.map((i) =>
    [i % size ? i - 1 : -1, i % size < size - 1 ? i + 1 : -1, i - size, i + size].map((n) =>
      n < 0 || n >= cells.length ? 0 : 1 << n,
    ),
  );
  const loops: Loop[] = [];
  for (let inside = 1; inside <= all; inside++) {
    const outside = all ^ inside;
    if (flood(inside & -inside, inside) !== inside || flood(outside & rim, outside) !== outside)
      continue;
    const hasCrossing = vertices.some((i) => {
      const nw = (inside >> i) & 1;
      const ne = (inside >> (i + 1)) & 1;
      const sw = (inside >> (i + size)) & 1;
      const se = (inside >> (i + size + 1)) & 1;
      return nw === se && ne === sw && nw !== ne;
    });
    if (hasCrossing) continue;
    const clues = adjacent.map(
      (around, i) =>
        around.filter((neighbor) => Boolean(inside & neighbor) !== Boolean(inside & (1 << i)))
          .length,
    );
    loops.push({ inside, clues });
  }
  return loops;
}

function slitherlink() {
  loopPool ??= latticeLoops();
  const pool = loopPool;
  const size = LOOP_SIZE;
  uniqueLoopPool ??= (() => {
    const signatures = new Map<string, number>();
    for (const { clues } of pool) {
      const signature = clues.join('');
      signatures.set(signature, (signatures.get(signature) ?? 0) + 1);
    }
    return pool.filter(({ clues }) => !clues.includes(4) && signatures.get(clues.join('')) === 1);
  })();
  const piece = pick(uniqueLoopPool);
  const clues = piece.clues;
  const visible = new Set(range(size * size));
  for (const i of shuffle([...visible])) {
    visible.delete(i);
    const required = [...visible];
    if (
      pool.some(
        ({ inside, clues: candidate }) =>
          inside !== piece.inside && required.every((n) => candidate[n] === clues[n]),
      )
    )
      visible.add(i);
    if (visible.size === 10) break;
  }
  const sectorCounts = [0, 0, 0, 0];
  const unit = 38;
  const margin = 30;
  const middle = margin + (size * unit) / 2;
  const far = margin + size * unit;
  const marks: DrawingMark[] = [
    line([middle, margin - 5], [middle, far + 5], 'accent', 1, true),
    line([margin - 5, middle], [far + 5, middle], 'accent', 1, true),
    label([middle - unit, 13], 'A', 15, 'accent'),
    label([middle + unit, 13], 'B', 15, 'accent'),
    label([middle - unit, far + 17], 'C', 15, 'accent'),
    label([middle + unit, far + 17], 'D', 15, 'accent'),
  ];
  for (const y of range(size + 1))
    for (const x of range(size + 1)) marks.push(dot([margin + x * unit, margin + y * unit], 2.4));
  clues.forEach((clue, i) => {
    const x = i % size;
    const y = Math.floor(i / size);
    if (visible.has(i))
      marks.push(label([margin + (x + 0.5) * unit, margin + (y + 0.5) * unit], clue, 16));
    if (piece.inside & (1 << i)) sectorCounts[Math.floor(y / 2) * 2 + Math.floor(x / 2)]++;
  });
  const text = range(size).map((y) =>
    range(size)
      .map((x) => (visible.has(y * size + x) ? clues[y * size + x] : 'vide'))
      .join(', '),
  );
  return boardRound(
    sectorCounts,
    [
      {
        ...diagram(
          far + margin,
          far + margin,
          marks,
          `Grille 4 × 4, indices par rangée : ${text.join(' ; ')}. Secteurs A, B, C et D en ordre de lecture, deux par deux.`,
        ),
        edges: latticeEdges(size, margin, unit, true),
      },
    ],
    {
      instruction:
        'Trace une seule boucle le long des côtés des cases, sans croisement. Chaque nombre indique combien de ses côtés la boucle longe. Les pointillés délimitent les secteurs A à D. Compte les cases à l’intérieur de la boucle dans chaque secteur.',
      solutionHint:
        'Écarte les quatre côtés d’un 0. Quand un indice exige autant de traits qu’il reste de côtés disponibles, trace-les tous. Chaque point atteint par la boucle doit toucher exactement deux de ses traits. Garde une seule boucle qui satisfait tous les indices.',
      workedExample: {
        clue: grid([[0, 3]], 'Deux cases voisines'),
        explanation:
          'La case 0 exclut tous ses côtés, y compris le côté partagé avec le 3. Il reste exactement trois côtés disponibles autour du 3. Pour satisfaire cet indice, il faut tracer le haut, la droite et le bas.',
      },
    },
  );
}

const FLEET_SIZE = 6;
const LENGTHS = [3, 2, 2, 1];
type Ship = { cells: number[]; halo: number[] };

const shipPlacements = new Map<number, Ship[]>();

function placements(length: number): Ship[] {
  const existing = shipPlacements.get(length);
  if (existing) return existing;
  const size = FLEET_SIZE;
  const ships = range(size * size).flatMap((i) => {
    const column = i % size;
    const row = Math.floor(i / size);
    const orientations: number[] = [];
    if (column + length <= size) orientations.push(1);
    if (length > 1 && row + length <= size) orientations.push(size);
    return orientations.map((step) => {
      const cells = range(length).map((j) => i + j * step);
      const halo = [
        ...new Set(cells.flatMap((position) => [position, ...gridNeighbors(position, size, true)])),
      ];
      return { cells, halo };
    });
  });
  shipPlacements.set(length, ships);
  return ships;
}

function randomFleet(): Ship[] {
  const pickFleet = (deck: Ship[]): Ship[] | undefined => {
    if (deck.length === LENGTHS.length) return deck;
    const occupied = new Set(deck.flatMap(({ cells }) => cells));
    for (const ship of shuffle(placements(LENGTHS[deck.length]))) {
      if (ship.halo.some((i) => occupied.has(i))) continue;
      const complete = pickFleet([...deck, ship]);
      if (complete) return complete;
    }
    return undefined;
  };
  return pickFleet([])!;
}

function fleetSolutions(
  rowTotals: readonly number[],
  columnTotals: readonly number[],
  targets: readonly number[],
  water: ReadonlySet<number>,
): Set<number>[] {
  const size = FLEET_SIZE;
  const rows = [...rowTotals];
  const cols = [...columnTotals];
  const filled = new Set<number>();
  const solutions: Set<number>[] = [];
  const allowed = new Map(
    [...new Set(LENGTHS)].map((length) => [
      length,
      placements(length).filter(
        ({ cells }) =>
          cells.every((i) => !water.has(i)) && cells.filter((i) => targets.includes(i)).length <= 1,
      ),
    ]),
  );
  const solve = (depth: number, previous: number): void => {
    if (depth === LENGTHS.length) {
      if (targets.every((i) => filled.has(i))) solutions.push(new Set(filled));
      return;
    }
    const candidates = allowed.get(LENGTHS[depth])!;
    const first = LENGTHS[depth] === LENGTHS[depth - 1] ? previous + 1 : 0;
    for (let index = first; index < candidates.length; index++) {
      const { cells, halo } = candidates[index];
      if (halo.some((i) => filled.has(i))) continue;
      for (const i of cells) {
        filled.add(i);
        rows[Math.floor(i / size)]--;
        cols[i % size]--;
      }
      if (
        [...rows, ...cols].every((n) => n >= 0) &&
        targets.every((i) => filled.has(i) || !halo.includes(i))
      )
        solve(depth + 1, index);
      for (const i of cells) {
        filled.delete(i);
        rows[Math.floor(i / size)]++;
        cols[i % size]++;
      }
      if (solutions.length >= 2) return;
    }
  };
  solve(0, -1);
  return solutions;
}

function battleship() {
  const size = FLEET_SIZE;
  const ships = shuffle(randomFleet());
  const occupied = new Set(ships.flatMap(({ cells }) => cells));
  const targets = ships.map(({ cells }) => pick(cells));
  const rowTotals = range(size).map(
    (y) => [...occupied].filter((i) => Math.floor(i / size) === y).length,
  );
  const colTotals = range(size).map((x) => [...occupied].filter((i) => i % size === x).length);
  const water = new Set<number>();
  for (;;) {
    const solutions = fleetSolutions(rowTotals, colTotals, targets, water);
    if (solutions.length <= 1) break;
    const different = solutions.flatMap((solution) =>
      [...solution].filter((i) => !occupied.has(i)),
    );
    water.add(pick(different));
  }
  const clues = [
    [cell('', 'heading'), ...colTotals.map((n) => cell(n, 'heading'))],
    ...range(size).map((y) => [
      cell(rowTotals[y], 'heading'),
      ...range(size).map((x) => {
        const i = y * size + x;
        const target = targets.indexOf(i);
        if (target >= 0) return cell(CODE_POSITIONS[target], 'target');
        if (water.has(i)) return cell('≈', 'blocked');
        return cell('', undefined, true);
      }),
    ]),
  ];
  return boardRound(
    ships.map(({ cells }) => cells.length),
    [grid(clues)],
    {
      instruction:
        'Place un navire de 3 cases, deux de 2 et un de 1. Les navires sont droits et ne se touchent jamais, même en diagonale. Les nombres au bord comptent les cases occupées. Le signe ≈ indique de l’eau. Chaque lettre est à bord d’un navire différent. Relève leurs longueurs.',
      solutionHint:
        'Commence par les rangées ou colonnes de total zéro et marque-les comme eau. Cherche où le navire de longueur 3 peut tenir en passant par une des lettres. Pour chaque placement possible, vérifie les totaux restants et laisse de l’eau autour de chaque navire, même aux coins.',
      workedExample: {
        clue: grid([
          [cell('', 'heading'), cell(1, 'heading'), cell(1, 'heading'), cell(1, 'heading')],
          [cell(0, 'heading'), '', '', ''],
          [cell(3, 'heading'), '', cell('X', 'target'), ''],
          [cell(0, 'heading'), '', '', ''],
        ]),
        explanation:
          'Les deux rangées de total zéro sont remplies d’eau. Celle du milieu a trois cases et son total vaut 3. Les trois cases occupées se touchent, donc elles appartiennent au même navire. Le navire de X mesure 3 cases.',
      },
    },
  );
}

export const GRID_MECHANICS: readonly Mechanic[] = [
  { title: 'Le démineur à colonnes', generate: mines },
  { title: 'Le nonogramme numérique', generate: nonograms },
  { title: 'Le Slitherlink à régions', generate: slitherlink },
  { title: 'La bataille navale masquée', generate: battleship },
];
