import { range, shuffle } from '../new-games/random';
import {
  boardRound,
  CODE_POSITIONS,
  diagram,
  dot,
  DrawingMark,
  ExplainedExercise,
  Exercise,
  individualRound,
  label,
  line,
  Mechanic,
  pick,
  Point,
  randomInt,
} from './cadenas-mystere.model';

function braidedRibbons() {
  const swaps = shuffle([0, 1, 2, ...range(randomInt(2, 4)).map(() => randomInt(0, 2))]);
  const laneY = (lane: number) => 19 + lane * 32;
  const spacing = 28;
  const start = 23;
  const end = start + swaps.length * spacing;
  const order = range(4);
  const marks: DrawingMark[] = [];
  swaps.forEach((firstLane, i) => {
    const x = start + i * spacing;
    const secondLane = firstLane + 1;
    const upperGoesOver = randomInt(0, 1) === 0;
    for (const lane of range(4)) {
      const y = laneY(lane);
      if (lane !== firstLane && lane !== secondLane) {
        marks.push(line([x, y], [x + spacing, y], 'ink', 2.9));
        continue;
      }
      const to = laneY(lane === firstLane ? secondLane : firstLane);
      const startCross: Point = [x + 5, y];
      const endCross: Point = [x + spacing - 5, to];
      const slice = (t: number): Point => [
        startCross[0] + (endCross[0] - startCross[0]) * t,
        y + (to - y) * t,
      ];
      marks.push(
        line([x, y], startCross, 'ink', 2.9),
        line(endCross, [x + spacing, to], 'ink', 2.9),
      );
      if ((lane === firstLane) === upperGoesOver) {
        marks.push(line(startCross, endCross, 'ink', 2.9));
      } else {
        marks.push(
          line(startCross, slice(0.33), 'ink', 2.9),
          line(slice(0.67), endCross, 'ink', 2.9),
        );
      }
    }
    [order[firstLane], order[secondLane]] = [order[secondLane], order[firstLane]];
  });
  range(4).forEach((lane) =>
    marks.push(
      label([10, laneY(lane)], CODE_POSITIONS[lane], 15, 'accent'),
      label([end + 13, laneY(lane)], lane + 1, 15, 'focus'),
    ),
  );
  return boardRound(
    CODE_POSITIONS.map((_, i) => order.indexOf(i) + 1),
    [
      diagram(
        end + 23,
        135,
        marks,
        `Les rubans A à D commencent dans cet ordre, de haut en bas. De gauche à droite, les croisements échangent les rangées ${swaps.map((i) => `${i + 1} et ${i + 2}`).join(', puis ')}.`,
      ),
    ],
    {
      instruction:
        'Suis chaque ruban de gauche à droite et relève sa sortie. Au croisement, les deux rubans poursuivent leur diagonale.',
      solutionHint:
        'Écris A, B, C et D dans l’ordre des entrées. À chaque croisement, échange les deux lettres des rangées qui se croisent. À droite, la position finale de chaque lettre donne sa sortie.',
      workedExample: {
        explanation:
          'Imagine les rubans dans l’ordre A, B, C, D. Un croisement entre les rangées 1 et 2 donne B, A, C, D. Le suivant, entre les rangées 2 et 3, donne B, C, A, D. Le ruban A sort donc en position 3.',
      },
    },
  );
}

type JugStep = { volumes: readonly [number, number]; moves: number; previous?: JugStep };
type JugTask = { first: number; second: number; target: number; solution: JugStep };
let jugTasks: JugTask[] | undefined;

function jugSolutions(first: number, second: number): Map<number, JugStep> {
  const visited = new Set([0]);
  const queue: JugStep[] = [{ volumes: [0, 0], moves: 0 }];
  const solutions = new Map<number, JugStep>();
  for (let head = 0; head < queue.length; head++) {
    const step = queue[head];
    const [a, b] = step.volumes;
    if (!solutions.has(a)) solutions.set(a, step);
    if (!solutions.has(b)) solutions.set(b, step);
    const towardB = Math.min(a, second - b);
    const towardA = Math.min(b, first - a);
    const next: [number, number][] = [
      [first, b],
      [a, second],
      [0, b],
      [a, 0],
      [a - towardB, b + towardB],
      [a + towardA, b - towardA],
    ];
    for (const volumes of next) {
      const [nextA, nextB] = volumes;
      const key = nextA * (second + 1) + nextB;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ volumes, moves: step.moves + 1, previous: step });
    }
  }
  return solutions;
}

function waterJugs() {
  const volumes = range(7).map((i) => i + 2);
  jugTasks ??= volumes.flatMap((first) =>
    volumes
      .filter((second) => first !== second)
      .flatMap((second) =>
        [...jugSolutions(first, second)]
          .filter(([target, { moves }]) => target > 0 && moves >= 2 && moves <= 9)
          .map(([target, solution]) => ({ first, second, target, solution })),
      ),
  );
  const make = ({ first, second, target, solution }: JugTask): Exercise => {
    const marks: DrawingMark[] = [label([82, 12], `Obtenir ${target} L`, 14, 'focus')];
    [first, second].forEach((volume, i) => {
      const left = 22 + i * 73;
      const top = 77 - volume * 6;
      const right = left + 44;
      marks.push(
        line([left, top], [left + 4, 77]),
        line([left + 4, 77], [right - 4, 77]),
        line([right - 4, 77], [right, top]),
        label([left + 22, 94], `${volume} L`, 15),
      );
    });
    return {
      digit: solution.moves,
      clue: diagram(
        163,
        108,
        marks,
        `Deux cruches vides de ${first} et ${second} litres. Quantité à obtenir dans une cruche, ${target} litres.`,
      ),
    };
  };
  const selected = shuffle(jugTasks).slice(0, 6);
  const examples = selected.slice(0, 2).map(make);
  const { target, solution } = selected[0];
  const states: string[] = [];
  for (let step: JugStep | undefined = solution; step; step = step.previous) {
    states.push(`(${step.volumes.join(', ')})`);
  }
  return individualRound(selected.slice(2).map(make), {
    examples,
    instruction:
      'Les cruches sont vides. En une action, tu peux remplir une cruche à ras bord, la vider complètement ou transvaser jusqu’à ce que l’une soit vide ou l’autre pleine. Trouve le minimum d’actions pour obtenir la quantité indiquée dans une seule cruche.',
    solutionHint:
      'Note les deux volumes après chaque action. Liste les paires atteignables en une action, puis en deux, et ainsi de suite, en écartant les paires déjà vues. Arrête-toi dès que l’un des deux volumes est la quantité cherchée.',
    workedExample: {
      clue: examples[0].clue,
      explanation: `Chaque paire donne les volumes en litres dans la première cruche, puis dans la seconde. En explorant un nombre croissant d’actions, on atteint ${target} L pour la première fois en suivant ${states.reverse().join(' → ')}. Il faut ${solution.moves} actions.`,
    },
  });
}

function gears() {
  const toothCounts = [8, 10, 12, 14, 16, 18, 20, 24];
  const options = toothCounts.flatMap((entry) =>
    toothCounts
      .filter((exit) => exit !== entry)
      .flatMap((exit) =>
        range(8)
          .map((i) => i + 1)
          .filter((turns) => (entry * turns) % exit === 0 && (entry * turns) / exit <= 9)
          .map((turns) => ({ entry, exit, turns })),
      ),
  );
  const make = ({ entry, exit, turns }: (typeof options)[number]): ExplainedExercise => {
    const teeth = randomInt(0, 1) ? [entry, exit] : [entry, pick(toothCounts), exit];
    const scale = Math.min(1.2, 178 / (2 * teeth.reduce((total, count) => total + count, 0)));
    let left = (210 - 2 * scale * teeth.reduce((total, count) => total + count, 0)) / 2;
    const marks: DrawingMark[] = [
      label([105, 13], `A fait ${turns} ${turns === 1 ? 'tour' : 'tours'}`, 14, 'focus'),
    ];
    teeth.forEach((n, i) => {
      const radius = n * scale;
      const center: Point = [left + radius, 59];
      marks.push(dot(center, radius - 2, 'paper', 'ink'));
      for (const k of range(n)) {
        const angle = ((k + (i % 2) / 2) * Math.PI * 2) / n;
        const point = (r: number): Point => [
          center[0] + r * Math.cos(angle),
          center[1] + r * Math.sin(angle),
        ];
        marks.push(line(point(radius - 3), point(radius + 1.4), 'ink', 1.8));
      }
      marks.push(label(center, i === 0 ? 'A' : i === teeth.length - 1 ? 'Z' : 'B', 13, 'focus'));
      marks.push(label([center[0], 103], n, 14));
      left += radius * 2;
    });
    return {
      clue: diagram(
        210,
        117,
        marks,
        `Train d’engrenages avec ${teeth.join(', ')} dents par roue, de A à Z. A effectue ${turns} tours.`,
      ),
      digit: (entry * turns) / exit,
      explanation: `La roue A entraîne ${turns} × ${entry} = ${turns * entry} dents. La roue Z a besoin de ${exit} dents pour un tour complet. Elle effectue donc ${turns * entry} ÷ ${exit} = ${(entry * turns) / exit} ${(entry * turns) / exit === 1 ? 'tour' : 'tours'}.`,
    };
  };
  const selected = shuffle(options).slice(0, 6);
  const tasks = selected.slice(2).map(make);
  const examples = selected.slice(0, 2).map(make);
  return individualRound(tasks, {
    examples,
    instruction:
      'Les nombres sous les roues indiquent leurs dents. Toutes les roues voisines s’engrènent. Combien de tours effectue la roue Z ?',
    solutionHint:
      'Multiplie les tours de A par le nombre de dents de A. Le même total de dents passe dans chaque roue. Divise ce produit par le nombre de dents de Z pour trouver ses tours.',
    workedExample: examples[0],
  });
}

function tollRoads() {
  const nodes: Point[] = [
    [18, 63],
    [86, 20],
    [86, 106],
    [154, 63],
  ];
  const names = ['S', 'U', 'V', 'T'];
  const links = [
    [0, 1],
    [1, 3],
    [0, 2],
    [2, 3],
    [1, 2],
  ];
  const make = (costs: readonly number[]): ExplainedExercise => {
    const [su, ut, sv, vt, uv] = costs;
    const digit = Math.min(su + ut, sv + vt, su + uv + vt, sv + uv + ut);
    const marks = links.map(([from, to]) => line(nodes[from], nodes[to], 'muted', 2));
    links.forEach(([from, to], i) => {
      const center: Point = [
        (nodes[from][0] + nodes[to][0]) / 2,
        (nodes[from][1] + nodes[to][1]) / 2,
      ];
      marks.push(dot(center, 9, 'paper'), label(center, costs[i], 14));
    });
    nodes.forEach((point, i) => {
      marks.push(
        dot(point, 11, 'paper', 'ink'),
        label(point, names[i], 14, i === 0 || i === 3 ? 'accent' : 'ink'),
      );
    });
    return {
      digit,
      explanation: `S–U–T coûte ${su} + ${ut} = ${su + ut} et S–V–T coûte ${sv} + ${vt} = ${sv + vt}. En passant par les deux, S–U–V–T coûte ${su + uv + vt} et S–V–U–T coûte ${sv + uv + ut}. Le plus petit total est ${digit}.`,
      clue: diagram(
        172,
        126,
        marks,
        `Coûts des liaisons à double sens. ${links.map(([a, b], i) => `${names[a]} à ${names[b]} coûte ${costs[i]}`).join('. ')}.`,
      ),
    };
  };
  const tasks = range(4).map(() => {
    const startCost = randomInt(1, 6);
    return make([
      startCost,
      randomInt(1, Math.min(6, 9 - startCost)),
      randomInt(1, 7),
      randomInt(1, 7),
      randomInt(1, 4),
    ]);
  });
  return individualRound(tasks, {
    instruction:
      'De S à T, chaque liaison coûte le nombre indiqué. Quel est le coût total du trajet le moins cher ?',
    solutionHint:
      'Compare quatre trajets de S à T. Essaie de passer par U, par V, puis par les deux dans chacun des ordres possibles. Additionne les coûts le long de chaque trajet et garde le plus petit total.',
    workedExample: make([8, 2, 2, 6, 1]),
  });
}

export const COLLECTION_ROUTE_MECHANICS: readonly Mechanic[] = [
  { title: 'Les quatre rubans tressés', generate: braidedRibbons },
  { title: 'Les deux cruches', generate: waterJugs },
  { title: 'L’atelier des engrenages', generate: gears },
  { title: 'Le réseau à péages', generate: tollRoads },
];
