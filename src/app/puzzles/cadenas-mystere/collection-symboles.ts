import { range, shuffle } from '../new-games/random';
import {
  cell,
  grid,
  individualRound,
  Mechanic,
  pick,
  randomInt,
  textClue,
} from './cadenas-mystere.model';

function secretSymbols() {
  const symbols = shuffle(['●', '▲', '■', '◆', '✦', '✚']);
  const values = shuffle(range(10)).slice(0, symbols.length);
  const knownGroups = [shuffle([0, 1, 2, 3]), shuffle([2, 3, 4, 5]), shuffle([0, 1, 4, 5])];
  const show = (group: number[]) =>
    `${group.map((i) => symbols[i]).join(' ')} = ${group.map((i) => values[i]).join('')}`;
  const examples = textClue(knownGroups.map(show), false, 'Exemples résolus');
  const selected = shuffle(range(symbols.length));
  const tasks = selected.slice(0, 4).map((i) => ({ clue: textClue(symbols[i]), digit: values[i] }));
  const symbol = selected[4];
  const group = knownGroups.find((items) => items.includes(symbol))!;
  const position = group.indexOf(symbol) + 1;
  return individualRound(tasks, {
    instruction:
      'Chaque symbole représente toujours le même chiffre. Retrouve les correspondances à partir des exemples.',
    shared: [examples],
    solutionHint:
      'Dans chaque exemple, associe le premier symbole au premier chiffre, le deuxième au deuxième, et ainsi de suite. Note les correspondances, puis utilise-les pour lire les symboles A à D.',
    workedExample: {
      clue: textClue(show(group)),
      explanation: `Le symbole ${symbols[symbol]} occupe la position ${position} à gauche. En lisant la même position à droite, on trouve ${values[symbol]}. Cette correspondance vaut chaque fois que le symbole réapparaît.`,
    },
  });
}

function compressedStrip() {
  const symbols = ['A', 'B', 'D', 'F', 'K', 'M', 'R'];
  const make = (digit: number) => {
    const count = randomInt(Math.max(2, Math.ceil(digit / 4)), Math.min(4, digit - 1));
    const letters = shuffle(symbols);
    let remaining = digit;
    const groups = range(count).map((i) => {
      const after = count - i - 1;
      const length = randomInt(Math.max(1, remaining - after * 4), Math.min(4, remaining - after));
      remaining -= length;
      return { length, letter: letters[i] };
    });
    return {
      clue: grid([groups.map(({ length, letter }) => `${length}${letter}`)]),
      digit,
      explanation: `En répétant chaque lettre selon le nombre qui la précède, on obtient ${groups.map(({ length, letter }) => letter.repeat(length)).join('')}. Sa longueur vaut ${groups.map(({ length }) => length).join(' + ')} = ${digit}.`,
    };
  };
  const options = shuffle([3, 4, 5, 6, 7, 8, 9]);
  const tasks = options.slice(3).map(make);
  const examples = options.slice(0, 3).map(make);
  return individualRound(tasks, {
    examples,
    instruction:
      'Déduis comment lire les groupes et retrouve la longueur de chaque bande une fois décompressée.',
    solutionHint:
      'Le nombre placé devant une lettre indique combien de fois elle se répète. Additionne les nombres affichés pour retrouver la longueur totale de la bande.',
    workedExample: examples[0],
  });
}

function interlacedSequences() {
  const make = (digit: number) => {
    const step = pick([-4, -3, -2, -1, 1, 2, 3].filter((d) => digit - 3 * d >= 0));
    const otherStep = pick([-5, -3, -2, 2, 3, 4, 5].filter((d) => d !== step));
    const otherStart = randomInt(18, 29);
    const odd = range(3).map((i) => digit - (3 - i) * step);
    const row = odd.flatMap((value, i) => [cell(value), cell(otherStart + i * otherStep)]);
    return {
      clue: grid([[...row, cell('?', 'target')]]),
      digit,
      explanation: `Aux positions impaires, on lit ${odd.join(', ')}. Chaque passage ${step > 0 ? 'ajoute' : 'retranche'} ${Math.abs(step)}. La case manquante est impaire elle aussi, donc ${odd[2]} ${step > 0 ? '+' : '−'} ${Math.abs(step)} = ${digit}.`,
    };
  };
  const digits = shuffle(range(10)).slice(0, 7);
  const tasks = digits.slice(3).map(make);
  const examples = digits.slice(0, 3).map(make);
  return individualRound(tasks, {
    examples,
    instruction: 'Trouve le prochain terme de chaque suite.',
    solutionHint:
      'Sépare les positions impaires des positions paires. Chaque groupe a son propre écart constant entre deux termes. Prolonge la suite des positions impaires pour compléter la septième case.',
    workedExample: examples[0],
  });
}

function musicalChairs() {
  const startingOrder = shuffle(['J', 'K', 'L', '★']);
  const chairs = range(startingOrder.length);
  const pairs = chairs.flatMap((a) => chairs.filter((b) => b > a).map((b) => [a, b] as const));
  const tasks = range(4).map(() => {
    const order = [...startingOrder];
    const swaps = range(randomInt(4, 6)).map(() => pick(pairs));
    for (const [a, b] of swaps) [order[a], order[b]] = [order[b], order[a]];
    return {
      clue: textClue(swaps.map(([a, b]) => `${a + 1} ↔ ${b + 1}`)),
      digit: order.indexOf('★') + 1,
    };
  });
  return individualRound(tasks, {
    instruction:
      'Chaque liste repart de la disposition initiale. Échange les personnes assises aux deux places indiquées, du haut vers le bas. Relève la chaise qu’occupe l’étoile à la fin.',
    shared: [
      grid([chairs.map((i) => cell(i + 1, 'heading')), startingOrder], 'Disposition initiale'),
    ],
    solutionHint:
      'Suis seulement l’étoile. Sur chaque ligne, si une des deux places est la sienne, déplace-la vers l’autre. Les autres échanges la laissent en place.',
    workedExample: {
      clue: textClue(['2 ↔ 4', '1 ↔ 3', '4 ↔ 1'], false, 'Départ sur la chaise 2'),
      explanation:
        'Le premier échange fait passer l’étoile de la chaise 2 à la 4. L’échange entre 1 et 3 la laisse sur la 4. Le dernier échange l’amène sur la chaise 1.',
    },
  });
}

function sortQueue() {
  const inversionCount = (row: number[]) =>
    row.reduce(
      (sum, value, index) => sum + row.slice(index + 1).filter((after) => after < value).length,
      0,
    );
  const tasks = range(4).map(() => {
    const row = shuffle(range(10)).slice(0, 5);
    if (inversionCount(row) === 10) [row[0], row[1]] = [row[1], row[0]];
    return { clue: grid([row]), digit: inversionCount(row) };
  });
  return individualRound(tasks, {
    instruction:
      'Quel est le minimum d’échanges entre deux cartes voisines pour mettre chaque rangée en ordre croissant ?',
    solutionHint:
      'Pour chaque carte, compte les cartes plus petites à sa droite. Additionne ces comptes. Chaque paire ainsi repérée doit être inversée et un échange de voisines corrige une seule de ces paires.',
    workedExample: {
      clue: grid([[3, 1, 4, 2]]),
      explanation:
        'Le 3 précède deux cartes plus petites, le 1 et le 2. Le 4 précède aussi le 2. Cela fait 2 + 1 = 3 inversions. On peut les corriger en faisant passer le 1 devant le 3, puis le 2 devant le 4 et le 3.',
    },
  });
}

export const COLLECTION_SYMBOL_MECHANICS: readonly Mechanic[] = [
  { title: 'Les symboles mystérieux', generate: secretSymbols },
  { title: 'La bande comprimée', generate: compressedStrip },
  { title: 'Deux suites entrelacées', generate: interlacedSequences },
  { title: 'La danse des chaises', generate: musicalChairs },
  { title: 'La file à remettre en ordre', generate: sortQueue },
];
