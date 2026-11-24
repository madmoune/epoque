import { range, shuffle } from '../new-games/random';
import {
  boardRound,
  box,
  cell,
  choiceCell,
  CODE_POSITIONS,
  diagram,
  dot,
  DrawingMark,
  ExplainedExercise,
  Exercise,
  grid,
  individualRound,
  label,
  line,
  Mechanic,
  orientPoint,
  pick,
  randomInt,
  textClue,
} from './cadenas-mystere.model';

type Operation = {
  calculate: (a: number, b: number) => number;
  expression: (a: number, b: number) => string;
  hint: string;
};
type Example = { a: number; b: number; digit: number };

const difference = (a: number, b: number) => Math.abs(a - b);
const differenceExpression = (a: number, b: number) => `${Math.max(a, b)} − ${Math.min(a, b)}`;

function operationCases(
  rules: readonly Operation[],
  maxInput: number,
  exampleCount: number,
  taskCount: number,
  toDigit = (result: number) => result,
) {
  const selected = pick(rules);
  const pool = shuffle(
    range(maxInput).flatMap((x) =>
      range(maxInput).map((y) => {
        const a = x + 1;
        const b = y + 1;
        return { a, b, digit: toDigit(selected.calculate(a, b)) };
      }),
    ),
  ).filter(({ digit }) => digit >= 0 && digit < 10);
  let alternatives = rules.filter((rule) => rule !== selected);
  const examples: Example[] = [];
  const mismatches = ({ a, b, digit }: Example) =>
    alternatives.filter(({ calculate }) => toDigit(calculate(a, b)) !== digit).length;
  while (alternatives.length) {
    const best = pool.reduce((choice, candidate) =>
      mismatches(candidate) > mismatches(choice) ? candidate : choice,
    );
    if (mismatches(best) === 0) break;
    examples.push(best);
    alternatives = alternatives.filter(
      ({ calculate }) => toDigit(calculate(best.a, best.b)) === best.digit,
    );
    pool.splice(pool.indexOf(best), 1);
  }
  if (examples.length < exampleCount)
    examples.push(...pool.splice(0, exampleCount - examples.length));
  return { examples: shuffle(examples), tasks: pool.slice(0, taskCount), rule: selected };
}

function machine() {
  const rules: Operation[] = [
    {
      calculate: (a, b) => a + b,
      expression: (a, b) => `${a} + ${b}`,
      hint: 'Additionne les deux nombres.',
    },
    {
      calculate: difference,
      expression: differenceExpression,
      hint: 'Soustrais le plus petit des deux nombres du plus grand.',
    },
    {
      calculate: (a, b) => a * b,
      expression: (a, b) => `${a} × ${b}`,
      hint: 'Multiplie les deux nombres.',
    },
    {
      calculate: (a, b) => 2 * a + b,
      expression: (a, b) => `2 × ${a} + ${b}`,
      hint: 'Double le premier nombre, puis ajoute le second.',
    },
    {
      calculate: (a, b) => difference(2 * a, b),
      expression: (a, b) => `2 × ${a} = ${2 * a}, puis ${differenceExpression(2 * a, b)}`,
      hint: 'Double le premier nombre, puis calcule la différence entre ce double et le second nombre en soustrayant le plus petit du plus grand.',
    },
    {
      calculate: (a, b) => (a % 2 === 0 ? a + b : difference(a, b)),
      expression: (a, b) => (a % 2 === 0 ? `${a} + ${b}` : differenceExpression(a, b)),
      hint: 'Si le premier nombre est pair, additionne les deux nombres. S’il est impair, soustrais le plus petit des deux nombres du plus grand.',
    },
  ];
  const { examples, tasks, rule } = operationCases(rules, 9, 4, 4, (result) => result % 10);
  const show = ({ a, b, digit }: Example): Exercise => ({ clue: textClue(`${a}  ·  ${b}`), digit });
  const visibleExamples = examples.map(show);
  const { a, b, digit } = examples[0];
  return individualRound(tasks.map(show), {
    examples: visibleExamples,
    instruction:
      'La même machine transforme chaque paire. Elle affiche le chiffre des unités du résultat.',
    solutionHint: `${rule.hint} Garde le chiffre des unités.`,
    workedExample: {
      clue: visibleExamples[0].clue,
      explanation: `Avec ces deux nombres, on calcule ${rule.expression(a, b)} = ${rule.calculate(a, b)}. On garde le chiffre des unités, soit ${digit}.`,
    },
  });
}

function secondDifferences() {
  const make = (digit: number): ExplainedExercise => {
    const sequence = (change: number, lastGap: number, length: number) => {
      const values = [digit];
      let gap = lastGap;
      while (values.length <= length) {
        values.push(values.at(-1)! - gap);
        gap -= change;
      }
      return values.slice(1).reverse();
    };
    const possibilities = [-3, -2, -1, 1, 2, 3]
      .flatMap((change) =>
        range(13).flatMap((i) => [4, 5].map((length) => sequence(change, i - 8, length))),
      )
      .filter((values) => values.every((value) => value >= 0 && value <= 45));
    const values = pick(possibilities);
    const gaps = values.slice(1).map((value, i) => value - values[i]);
    const change = gaps[1] - gaps[0];
    const next = gaps.at(-1)! + change;
    return {
      digit,
      clue: textClue(values.join('  ·  ') + '  ·  ?'),
      explanation: `Les écarts successifs sont ${gaps.join(', ')}. L’écart ${change > 0 ? 'augmente' : 'diminue'} de ${Math.abs(change)} à chaque étape, donc le suivant vaut ${next}. Le prochain terme est ${values.at(-1)} ${next < 0 ? '−' : '+'} ${Math.abs(next)} = ${digit}.`,
    };
  };
  const choice = shuffle(range(10)).slice(0, 7);
  const tasks = choice.slice(3).map(make);
  const examples = choice.slice(0, 3).map(make);
  return individualRound(tasks, {
    examples,
    instruction: 'Trouve le prochain terme de chaque suite.',
    solutionHint:
      'Soustrais chaque terme du suivant pour obtenir les écarts successifs. D’un écart au suivant, la même quantité s’ajoute ou se retranche. Prolonge ce motif pour trouver le prochain écart, puis ajoute-le au dernier terme.',
    workedExample: examples[0],
  });
}

function balances() {
  const numbers = shuffle(range(9).map((i) => i + 1)).slice(0, 4);
  const signs = shuffle(['●', '▲', '■', '◆', '✦', '✚']).slice(0, 4);
  const [a, b, c, d] = numbers;
  const [first, second, third, fourth] = signs;
  const weighings: [string, string][] = [
    [`${first} ${first}`, String(a * 2)],
    [`${first} ${second}`, String(a + b)],
    [`${second} ${third}`, String(b + c)],
    [`${first} ${third} ${fourth}`, String(a + c + d)],
  ];
  const clues = shuffle(weighings).map(([lhs, rhs]) => {
    const [left, right] = randomInt(0, 1) ? [lhs, rhs] : [rhs, lhs];
    return diagram(
      156,
      84,
      [
        line([15, 52], [141, 52], 'focus', 3),
        line([20, 29], [20, 52]),
        line([136, 29], [136, 52]),
        line([78, 52], [66, 72]),
        line([78, 52], [90, 72]),
        line([66, 72], [90, 72]),
        label([42, 34], left, 15),
        label([114, 34], right, 15),
      ],
      `Plateau gauche : ${left}. Plateau droit : ${right}. Les deux plateaux sont en équilibre.`,
    );
  });
  const order = shuffle(range(4));
  return boardRound(
    order.map((i) => numbers[i]),
    [
      ...clues,
      textClue(
        order.map((i, index) => `${CODE_POSITIONS[index]} · ${signs[i]}`).join(' '),
        false,
        'Valeurs à relever',
      ),
    ],
    {
      instruction:
        'Une forme a toujours le même poids. Les masses chiffrées sont connues. Trouve la valeur des quatre formes.',
      solutionHint:
        'Commence par la balance qui montre deux formes identiques et divise la masse indiquée par deux. Remplace cette forme par sa masse sur les autres balances, puis soustrais les masses connues pour isoler la suivante.',
      workedExample: {
        clue: textClue(['○ + ○ = 8', '○ + □ = 11']),
        explanation:
          'Deux cercles identiques pèsent 8, donc chacun pèse 8 ÷ 2 = 4. En remplaçant le cercle par 4 dans la deuxième pesée, on trouve que le carré pèse 11 − 4 = 7.',
      },
    },
  );
}

function matrices() {
  const rules: Operation[] = [
    {
      calculate: (a, b) => a * b - a,
      expression: (a, b) => `${a} × ${b} − ${a}`,
      hint: 'Multiplie les deux premiers nombres de la ligne, puis soustrais le premier nombre du produit.',
    },
    {
      calculate: (a, b) => a * b - b,
      expression: (a, b) => `${a} × ${b} − ${b}`,
      hint: 'Multiplie les deux premiers nombres de la ligne, puis soustrais le deuxième nombre du produit.',
    },
    {
      calculate: (a, b) => a + b,
      expression: (a, b) => `${a} + ${b}`,
      hint: 'Additionne les deux premiers nombres de la ligne.',
    },
    {
      calculate: (a, b) => a * b,
      expression: (a, b) => `${a} × ${b}`,
      hint: 'Multiplie les deux premiers nombres de la ligne.',
    },
    {
      calculate: difference,
      expression: differenceExpression,
      hint: 'Parmi les deux premiers nombres de la ligne, soustrais le plus petit du plus grand.',
    },
    {
      calculate: (a, b) => 2 * a + b,
      expression: (a, b) => `2 × ${a} + ${b}`,
      hint: 'Double le premier nombre de la ligne, puis ajoute le deuxième.',
    },
  ];
  const { examples, tasks, rule } = operationCases(rules, 6, 8, 4);
  const { a, b, digit } = examples[0];
  return individualRound(
    tasks.map(({ a, b, digit }, i) => ({
      digit,
      clue: grid([
        ...examples.slice(i * 2, i * 2 + 2).map((row) => [row.a, row.b, row.digit]),
        [a, b, cell('?', 'target')],
      ]),
    })),
    {
      instruction:
        'La même opération relie les trois nombres de chaque ligne dans toutes les grilles. Complète les cases marquées.',
      solutionHint: rule.hint,
      workedExample: {
        clue: grid([[a, b, digit]]),
        explanation: `Dans la première ligne déjà remplie, on applique la règle aux deux nombres de gauche. Le calcul ${rule.expression(a, b)} = ${digit} donne bien le nombre dans la troisième case.`,
      },
    },
  );
}

const LO_SHU = [8, 1, 6, 3, 5, 7, 4, 9, 2];

function magicSquares() {
  const variants = range(8).map((orientation) =>
    range(9).map((i) => {
      const [x, y] = orientPoint([i % 3, Math.floor(i / 3)], 3, orientation);
      return LO_SHU[x + y * 3];
    }),
  );
  return individualRound(
    shuffle(variants)
      .slice(0, 4)
      .map((values) => {
        const order = shuffle(range(9));
        const given = order.slice(0, 3);
        for (const index of order.slice(3)) {
          if (
            variants.filter((variant) => given.every((i) => variant[i] === values[i])).length === 1
          )
            break;
          given.push(index);
        }
        const target = pick(order.filter((i) => !given.includes(i)));
        return {
          digit: values[target],
          clue: grid(
            range(3).map((y) =>
              range(3).map((x) => {
                const i = y * 3 + x;
                if (i === target) return choiceCell('?', '123456789', 'target');
                return given.includes(i) ? cell(values[i]) : choiceCell('', '123456789');
              }),
            ),
          ),
        };
      }),
    {
      instruction:
        'Utilise les chiffres de 1 à 9 une fois par grille. Chaque ligne, colonne et diagonale a la même somme. Relève les cases marquées.',
      solutionHint:
        'La somme de chaque ligne, colonne et diagonale vaut 15. Quand il reste une case vide sur un alignement, soustrais les deux nombres présents de 15. Sinon, cherche les combinaisons de chiffres encore disponibles qui donnent cette somme.',
      workedExample: {
        clue: grid([[4, 9, cell('?', 'target')]]),
        explanation:
          'Les deux chiffres donnés totalisent 4 + 9 = 13. Pour atteindre la somme de 15, il faut ajouter 15 − 13 = 2. La case vide vaut 2.',
      },
    },
  );
}

function buildPyramid(base: number[]): number[][] {
  const levels = [base];
  let row = base;
  while (row.length > 1) {
    row = row.slice(1).map((right, i) => Math.abs(right - row[i]));
    levels.unshift(row);
  }
  return levels;
}

function pyramids() {
  const make = (digit: number): ExplainedExercise => {
    const index = randomInt(0, 3);
    const base = range(4).map(() => randomInt(0, 9));
    base[index] = digit;
    const visible = buildPyramid(base);
    const inferred = range(10).filter((number) => {
      const candidate = [...base];
      candidate[index] = number;
      return buildPyramid(candidate)
        .slice(0, 3)
        .every((row, y) => row.every((n, x) => n === visible[y][x]));
    });
    if (inferred.length !== 1) base[index === 0 ? 1 : index - 1] = randomInt(0, 1) * 9;
    const levels = buildPyramid(base);
    const rows = levels.map((row, y) =>
      row.map((value, x) => (y === 3 && x === index ? cell('?', 'target') : cell(value))),
    );
    const neighbors = [index - 1, index + 1]
      .filter((i) => i >= 0 && i < base.length)
      .map((i) => ({ value: base[i], gap: levels[2][Math.min(i, index)] }));
    const required = neighbors.map(({ value, gap }) => `${gap} d’écart avec ${value}`).join(' et ');
    const comparisons = neighbors
      .map(({ value, gap }) => `${differenceExpression(value, digit)} = ${gap}`)
      .join(' et ');
    return {
      digit,
      clue: grid(rows),
      explanation: `Les différences inscrites juste au-dessus imposent ${required}. En essayant les chiffres de 0 à 9, on retient ${digit}. On vérifie ${comparisons}.`,
    };
  };
  const digits = shuffle(range(10)).slice(0, 7);
  const tasks = digits.slice(3).map(make);
  const examples = digits.slice(0, 3).map(make);
  return individualRound(tasks, {
    examples,
    instruction:
      'Déduis le lien entre les trois cases de chaque petit triangle, puis complète la base.',
    solutionHint:
      'Chaque case vaut la différence entre les deux qui la soutiennent. Soustrais le plus petit du plus grand. Pour la case manquante, essaie les chiffres qui donnent les différences affichées aux étages supérieurs.',
    workedExample: examples[0],
  });
}

function clocks() {
  const stride = pick([-3, -2, -1, 1, 2, 3]);
  const places = Math.abs(stride);
  const direction = stride > 0 ? 'horaire' : 'antihoraire';
  const make = (start: number, steps: number): ExplainedExercise => {
    const marks: DrawingMark[] = [dot([67, 62], 44, 'paper', 'muted')];
    range(10).forEach((digit) => {
      const angle = (digit * Math.PI) / 5 - Math.PI / 2;
      const center = [67 + Math.cos(angle) * 44, 62 + Math.sin(angle) * 44] as const;
      if (digit === start) marks.push(dot(center, 10, 'accent'));
      else marks.push(dot(center, 9, 'paper'));
      marks.push(label(center, digit, 13, digit === start ? 'paper' : 'ink'));
    });
    marks.push(label([67, 62], steps === 1 ? '1 pas' : `${steps} pas`, 14));
    const visited = range(steps + 1).map((i) => (start + i * stride + 100) % 10);
    const digit = visited.at(-1)!;
    return {
      digit,
      clue: diagram(
        134,
        124,
        marks,
        `Départ sur ${start}, cadran numéroté de 0 à 9 dans le sens horaire. ${steps} pas.`,
      ),
      explanation: `En partant de ${start}, déplace-toi de ${places} ${places === 1 ? 'position' : 'positions'} dans le sens ${direction} à chaque pas. Les positions successives sont ${visited.join(' → ')}. Après ${steps} pas, on arrive à ${digit}.`,
    };
  };
  const starts = shuffle(range(10));
  const tasks = starts.slice(3, 7).map((start) => make(start, randomInt(2, 12)));
  const examples = [make(starts[0], 1), make(starts[1], 2), make(starts[2], 5)];
  return individualRound(tasks, {
    examples,
    instruction:
      'Le déplacement par pas est identique pour tous les cadrans. Relève la position d’arrivée.',
    solutionHint: `Pars du nombre coloré. À chaque pas, déplace-toi de ${places} ${places === 1 ? 'position' : 'positions'} dans le sens ${direction}. Continue en boucle sur le cadran.`,
    workedExample: examples[1],
  });
}

function divisors() {
  const choices = shuffle(range(99).map((i) => i + 1))
    .map((number) => {
      const factors = range(number)
        .map((n) => n + 1)
        .filter((n) => number % n === 0);
      const pairs = factors.filter((n) => n * n <= number).map((n) => `${n} × ${number / n}`);
      return {
        clue: textClue(String(number)),
        digit: factors.length,
        explanation: `Les paires dont le produit vaut ${number} sont ${pairs.join(', ')}. Leurs facteurs distincts sont ${factors.join(', ')}. On obtient ${factors.length} diviseurs.`,
      };
    })
    .filter(({ digit }) => digit <= 9);
  const examples = [2, 4, 6].map(
    (digit) =>
      choices.splice(
        choices.findIndex((item) => item.digit === digit),
        1,
      )[0],
  );
  return individualRound(choices.slice(0, 4), {
    examples,
    instruction: 'Déduis la propriété de chaque nombre à partir des exemples.',
    solutionHint:
      'Compte les entiers positifs qui divisent le nombre avec un reste nul, en incluant 1 et le nombre lui-même. Cherche les facteurs par paires et compte une seule fois un facteur qui se multiplie par lui-même.',
    workedExample: examples[2],
  });
}

function switches() {
  const weights = [8, 4, 2, 1];
  const make = (digit: number): ExplainedExercise => {
    const state = weights.map((weight) => Boolean(digit & weight));
    const marks = state.flatMap((on, index) => {
      const x = 10 + index * 34;
      return [
        box([x, 9], 23, 40, 'paper', 'muted'),
        dot([x + 11.5, on ? 20 : 38], 7, on ? 'focus' : 'muted'),
      ];
    });
    return {
      digit,
      clue: diagram(
        145,
        58,
        marks,
        `De gauche à droite : ${state.map((on) => (on ? 'allumé' : 'éteint')).join(', ')}.`,
      ),
      explanation: `Les positions de gauche à droite valent ${weights.join(', ')}. Les interrupteurs levés donnent la somme ${weights.filter((_, i) => state[i]).join(' + ') || '0'}. Le résultat est ${digit}.`,
    };
  };
  const tasks = shuffle([0, 3, 5, 6, 7, 9]).slice(0, 4).map(make);
  const examples = shuffle(weights).map(make);
  return individualRound(tasks, {
    examples,
    instruction: 'Position haute : allumé. Déduis la valeur de chaque configuration.',
    solutionHint:
      'De gauche à droite, les interrupteurs valent 8, 4, 2 et 1. Additionne seulement les valeurs de ceux en position haute.',
    workedExample: examples[0],
  });
}

function proportions() {
  const make = (digit: number, height: number, width: number): ExplainedExercise => {
    const unit = 13;
    const filled = (digit * width * height) / 10;
    const indices = new Set(shuffle(range(width * height)).slice(0, filled));
    const marks = range(width * height).map((i) =>
      box(
        [5 + (i % width) * unit, 5 + Math.floor(i / width) * unit],
        unit,
        unit,
        indices.has(i) ? 'focus' : 'paper',
        'muted',
      ),
    );
    return {
      digit,
      clue: diagram(
        width * unit + 10,
        height * unit + 10,
        marks,
        `Rectangle de ${height} rangées et ${width} colonnes. Cases colorées : ${
          [...indices]
            .sort((a, b) => a - b)
            .map((i) => i + 1)
            .join(', ') || 'aucune'
        }.`,
      ),
      explanation: `La figure contient ${height} × ${width} = ${width * height} cases. ${filled} sont colorées. Pour ramener cette proportion à 10 cases, on calcule (${filled} ÷ ${width * height}) × 10 = ${digit}.`,
    };
  };
  const tasks = shuffle(range(10))
    .slice(0, 4)
    .map((digit) => (randomInt(0, 1) ? make(digit, 4, 5) : make(digit, 3, 10)));
  const examples = [make(3, 2, 5), make(3, 4, 5), make(6, 2, 5)];
  return individualRound(tasks, {
    examples,
    instruction: 'Déduis la règle à partir des exemples.',
    solutionHint:
      'Divise le nombre de cases colorées par le nombre total de cases, puis multiplie par 10.',
    workedExample: examples[0],
  });
}

export const NUMBER_MECHANICS: readonly Mechanic[] = [
  { title: 'La machine inconnue', generate: machine },
  { title: 'Les suites à secondes différences', generate: secondDifferences },
  { title: 'Les balances mystérieuses', generate: balances },
  { title: 'Les matrices à opération cachée', generate: matrices },
  { title: 'Le carré magique incomplet', generate: magicSquares },
  { title: 'Les pyramides à différences', generate: pyramids },
  { title: 'Les horloges modulaires', generate: clocks },
  { title: 'Les nombres et leurs diviseurs', generate: divisors },
  { title: 'Les interrupteurs binaires', generate: switches },
  { title: 'Les figures proportionnelles', generate: proportions },
];
