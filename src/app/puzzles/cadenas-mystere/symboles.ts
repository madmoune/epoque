import { range, shuffle } from '../new-games/random';
import {
  box,
  diagram,
  dot,
  ExplainedExercise,
  Exercise,
  individualRound,
  label,
  Mechanic,
  pick,
  randomInt,
  textClue,
} from './cadenas-mystere.model';
import { drawDigit, segmentDescription } from './seven-segment';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const INFER = 'Déduis la règle à partir des exemples.';
const WORDS = [
  'FESTIN',
  'LUNE',
  'VESTE',
  'NUIT',
  'MENTHE',
  'SOLEIL',
  'MUGUET',
  'TISSU',
  'MUSEE',
  'ROSE',
  'RIVIERE',
  'ARBRE',
  'COQUILLE',
  'PARADOXE',
  'BONBON',
  'BORD',
  'CABANE',
  'PARABOLE',
  'ARDOISE',
  'BOUCLE',
  'DODO',
  'ORAGE',
  'SABLE',
  'BAMBOU',
  'OPERA',
  'BARBE',
  'PARAPLUIE',
  'CORBEAU',
  'DORADE',
  'PIERRE',
  'BROCANTE',
  'BALLON',
  'BOL',
  'ROBOT',
  'PAPAYE',
];

function letterHoles() {
  const choices = shuffle(WORDS).map((word) => {
    const counts = [...word].map((letter) =>
      letter === 'B' ? 2 : Number('ADOPQR'.includes(letter)),
    );
    const digit = counts.reduce((total, count) => total + count, 0);
    const shapes = [...word].flatMap((letter, i) =>
      counts[i] ? [`${letter} (${counts[i]})`] : [],
    );
    return {
      clue: textClue(word),
      digit,
      explanation: shapes.length
        ? `Dans ${word}, les lettres avec des espaces fermés sont ${shapes.join(', ')}, dans l’ordre. Leur nombre de trous s’additionne pour donner ${digit}.`
        : `Dans ${word}, toutes les lettres ont une forme ouverte. On compte zéro trou fermé.`,
    };
  });
  const examples = [0, 1, 5].map((count) => {
    const index = choices.findIndex(({ digit }) => digit === count);
    return choices.splice(index, 1)[0];
  });
  return individualRound(choices.slice(0, 4), {
    examples,
    instruction: INFER,
    solutionHint:
      'Compte les espaces complètement fermés à l’intérieur des majuscules. Par exemple, le B en contient deux, tandis que le C est ouvert.',
    workedExample: examples[2],
  });
}

// These glyphs use a square pixel grid so their axes don't depend on the system font.
const LETTER_FORMS: Record<string, readonly string[]> = {
  A: ['01110', '11011', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
};

function symmetricLetters() {
  const letters = Object.keys(LETTER_FORMS);
  const symmetry = (letter: string) =>
    LETTER_FORMS[letter].every((row) => row === [...row].reverse().join(''));
  const symmetric = letters.filter(symmetry);
  const asymmetric = letters.filter((letter) => !symmetry(letter));
  const make = (digit: number): ExplainedExercise => {
    const word = [...digit.toString(2).padStart(4, '0')].map((bit) =>
      pick(bit === '1' ? symmetric : asymmetric),
    );
    const marks = word.flatMap((letter, i) =>
      LETTER_FORMS[letter].flatMap((row, y) =>
        [...row].flatMap((pixel, x) =>
          pixel === '1' ? [box([6 + i * 29 + x * 4, 6 + y * 4], 4, 4, 'ink')] : [],
        ),
      ),
    );
    const contributions = word.flatMap((letter, i) =>
      symmetry(letter) ? [`la lettre ${letter} en position ${i + 1} vaut ${1 << (3 - i)}`] : [],
    );
    return {
      digit,
      clue: diagram(119, 40, marks, `Lettres de gauche à droite. ${word.join(', ')}.`),
      explanation: contributions.length
        ? `En testant l’axe vertical de chaque lettre, ${contributions.join(' et ')}. La somme des poids des lettres symétriques est ${digit}.`
        : 'Aucune lettre ne se superpose à son reflet sur un axe vertical. Le résultat est zéro.',
    };
  };
  const tasks = shuffle([0, 3, 5, 6, 7, 9]).slice(0, 4).map(make);
  const examples = [8, 4, 2, 1].map(make);
  return individualRound(tasks, {
    examples,
    instruction: INFER,
    solutionHint:
      'Vérifie quelles lettres ont un axe de symétrie vertical. De gauche à droite, les lettres valent 8, 4, 2 et 1. Additionne seulement les valeurs des lettres symétriques.',
    workedExample: examples[0],
  });
}

function morse() {
  const make = (digit: number): ExplainedExercise => {
    const marks =
      digit === 0
        ? '-----'
        : digit <= 5
          ? '.'.repeat(digit) + '-'.repeat(5 - digit)
          : '-'.repeat(digit - 5) + '.'.repeat(10 - digit);
    let x = 0;
    const parts = [...marks].map((mark) => {
      const width = mark === '-' ? 20 : 7;
      const part = box([x, 13], width, 8, 'focus');
      x += width + 5;
      return part;
    });
    const start = (132 - x + 5) / 2;
    return {
      digit,
      clue: diagram(
        132,
        34,
        parts.map((part) =>
          part.kind === 'box' ? { ...part, at: [part.at[0] + start, part.at[1]] } : part,
        ),
        [...marks].map((mark) => (mark === '-' ? 'trait long' : 'trait court')).join(', '),
      ),
      explanation:
        digit === 0
          ? 'La bande se compose de cinq traits longs. Ce motif représente zéro en Morse.'
          : digit <= 5
            ? `La bande commence par un trait court. Elle en contient ${digit}, ce qui donne le chiffre ${digit}.`
            : `La bande commence par un trait long. Elle contient ${digit - 5} ${digit === 6 ? 'trait long' : 'traits longs'} au total. On ajoute 5 et on obtient ${digit - 5} + 5 = ${digit}.`,
    };
  };
  const sample = [0, 5, pick([1, 2, 3, 4]), pick([6, 7, 8, 9])];
  const tasks = shuffle(range(10).filter((d) => !sample.includes(d)))
    .slice(0, 4)
    .map(make);
  const examples = sample.map(make);
  return individualRound(tasks, {
    examples,
    instruction: INFER,
    solutionHint:
      'Cinq traits longs donnent zéro. Pour chaque autre bande, compte les traits courts si elle commence par un trait court. Si elle commence par un trait long, ajoute 5 au nombre de traits longs.',
    workedExample: examples[3],
  });
}

// The literary number sign is followed by a–j, with j standing for zero.
const BRAILLE_DIGITS = [26, 1, 3, 9, 25, 17, 11, 27, 19, 10];

function braille() {
  const dotsFor = (digit: number, firstX: number, firstY: number, spacing: number) =>
    range(6).map((i) =>
      dot(
        [firstX + Math.floor(i / 3) * spacing, firstY + (i % 3) * spacing],
        spacing * 0.27,
        BRAILLE_DIGITS[digit] & (1 << i) ? 'ink' : 'paper',
        'muted',
      ),
    );
  const legend = range(10).flatMap((digit) => {
    const x = 14 + (digit % 5) * 45;
    const y = 10 + Math.floor(digit / 5) * 62;
    return [...dotsFor(digit, x, y, 12), label([x + 6, y + 40], digit, 14, 'focus')];
  });
  const legendClue = diagram(
    220,
    130,
    legend,
    BRAILLE_DIGITS.map(
      (bits, digit) =>
        `Chiffre ${digit}, points pleins ${range(6)
          .filter((i) => bits & (1 << i))
          .map((i) => i + 1)
          .join(', ')}.`,
    ).join(' '),
    'Légende',
  );
  const names = [
    'en haut à gauche',
    'au milieu à gauche',
    'en bas à gauche',
    'en haut à droite',
    'au milieu à droite',
    'en bas à droite',
  ];
  const make = (digit: number): ExplainedExercise => {
    const bits = BRAILLE_DIGITS[digit];
    const positions = range(6).filter((i) => bits & (1 << i));
    return {
      digit,
      clue: diagram(
        80,
        94,
        dotsFor(digit, 25, 18, 30),
        `Deux colonnes de trois points. Points pleins (colonne de gauche, puis de droite) : ${positions.map((i) => i + 1).join(', ')}.`,
      ),
      explanation: `Compare la position des points pleins avec la légende. Ils sont ${positions.map((i) => names[i]).join(', ')}. Le motif identique dans la légende porte le chiffre ${digit}.`,
    };
  };
  const digits = shuffle(range(10));
  return individualRound(digits.slice(0, 4).map(make), {
    instruction:
      'Associe les points pleins de chaque groupe au chiffre correspondant dans la légende.',
    shared: [legendClue],
    solutionHint:
      'Compare les deux colonnes de points avec la légende, position par position. Dès que tous les points pleins coïncident, lis le chiffre sous le motif correspondant.',
    workedExample: make(digits[4]),
  });
}

const KEYS = ['ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'];
const PHONE_WORDS = [
  'JUGE',
  'CHAT',
  'LOUP',
  'OURS',
  'ROSE',
  'VASE',
  'KIWI',
  'RUSE',
  'BOIS',
  'LUNE',
  'NOIR',
  'PLUIE',
  'SABLE',
  'BANC',
  'SOUPE',
  'BULLE',
  'FLEUR',
  'GARE',
  'LOIN',
  'VIEUX',
  'NUIT',
];
const keyOf = (letter: string) => KEYS.findIndex((letters) => letters.includes(letter)) + 2;

function telephone() {
  const position = randomInt(0, 3);
  const candidates = shuffle(PHONE_WORDS);
  const first = candidates.findIndex(
    (word) => new Set([...word.slice(0, 4)].map(keyOf)).size === 4,
  );
  const make = (word: string): Exercise => ({ digit: keyOf(word[position]), clue: textClue(word) });
  const words = [candidates.splice(first, 1)[0], ...candidates.splice(0, 2)];
  const examples = words.map(make);
  const legend = [KEYS.slice(0, 4), KEYS.slice(4)].map((row, i) =>
    row.map((letters, col) => `${col + 2 + i * 4} ${letters}`).join('  ·  '),
  );
  const ordinal = ['première', 'deuxième', 'troisième', 'quatrième'][position];
  const letter = words[0][position];
  const digit = examples[0].digit;
  return individualRound(candidates.slice(0, 4).map(make), {
    examples,
    instruction:
      'Une lettre à la même position dans chaque mot donne un chiffre. Déduis cette position à partir des exemples.',
    shared: [textClue(legend, false, 'Correspondance lettres et touches')],
    solutionHint: `Prends la ${ordinal} lettre de chaque mot. Repère cette lettre dans la légende et lis le chiffre de sa touche.`,
    workedExample: {
      clue: examples[0].clue,
      explanation: `Dans ${words[0]}, la ${ordinal} lettre est ${letter}. La légende donne ${KEYS[digit - 2]} sur la touche ${digit}. Comme ${letter} fait partie de ce groupe, on lit ${digit}.`,
    },
  });
}

function alphabetShift() {
  const make = (digit: number, start: number): ExplainedExercise => {
    const letters = range(digit + 1).map((i) => ALPHABET[(start + i) % 26]);
    return {
      digit,
      clue: textClue(`${letters[0]}  →  ${letters.at(-1)}`),
      explanation:
        digit === 0
          ? 'La lettre de départ et celle d’arrivée coïncident. Il faut zéro pas pour atteindre la cible.'
          : `Avance dans l’alphabet en revenant à A après Z. Le parcours est ${letters.join(' → ')}. Compte les déplacements entre les lettres. On obtient ${digit} pas.`,
    };
  };
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const zeroExample = randomInt(0, 25);
  const tasks = shuffle([...digits.slice(2), 0])
    .slice(0, 4)
    .map((digit) =>
      make(digit, digit === 0 ? (zeroExample + randomInt(1, 25)) % 26 : randomInt(0, 25)),
    );
  const examples = [
    make(digits[0], randomInt(26 - digits[0], 25)),
    make(digits[1], randomInt(0, 16)),
    make(0, zeroExample),
  ];
  return individualRound(tasks, {
    examples,
    instruction: INFER,
    solutionHint:
      'Compte les pas nécessaires pour avancer de la première lettre à la deuxième dans l’alphabet. Après Z, reviens à A. Deux lettres identiques donnent zéro.',
    workedExample: examples[0],
  });
}

function alphabetGaps() {
  const useFirst = randomInt(0, 1) === 0;
  const make = (digit: number): ExplainedExercise => {
    const other = pick(range(10).filter((n) => n !== digit));
    const [first, second] = useFirst ? [digit, other] : [other, digit];
    const start = randomInt(0, 23 - first - second);
    const letters = [start, start + first + 1, start + first + second + 2];
    const [left, right] = letters.slice(useFirst ? 0 : 1, useFirst ? 2 : 3);
    const between = [...ALPHABET.slice(left + 1, right)];
    return {
      digit,
      clue: textClue(letters.map((index) => ALPHABET[index]).join('  ·  ')),
      explanation: between.length
        ? `Entre ${ALPHABET[left]} et ${ALPHABET[right]}, on passe par ${between.join(', ')}. Cela fait ${digit} ${digit === 1 ? 'lettre' : 'lettres'} entre les deux.`
        : `${ALPHABET[left]} et ${ALPHABET[right]} se suivent directement dans l’alphabet. Il y a zéro lettre entre les deux.`,
    };
  };
  const digits = shuffle(range(10)).slice(0, 7);
  const interval = useFirst ? 'la première et la deuxième' : 'la deuxième et la troisième';
  const tasks = digits.slice(3).map(make);
  const examples = digits.slice(0, 3).map(make);
  return individualRound(tasks, {
    examples,
    instruction: INFER,
    solutionHint: `Compte les lettres de l’alphabet strictement entre ${interval} lettre de chaque groupe.`,
    workedExample: examples[0],
  });
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

function hiddenRoman() {
  const initialNoise = randomInt(0, 1) === 0;
  const startingLetter = initialNoise ? 'deuxième' : 'première';
  const make = (digit: number): ExplainedExercise => {
    const noise = shuffle([
      pick([...'ZQKBF']),
      ...range(ROMAN[digit].length - 1).map(() => pick([...'ILXCQKZ'])),
    ]);
    const letters = [...ROMAN[digit]].flatMap((letter, i) =>
      initialNoise ? [noise[i], letter] : [letter, noise[i]],
    );
    return {
      digit,
      clue: textClue(letters.join('  ')),
      explanation: `Garde une lettre sur deux en partant de la ${startingLetter}. Les lettres retenues forment ${ROMAN[digit]}, ce qui donne ${digit} en chiffres arabes.`,
    };
  };
  const digits = shuffle(range(9).map((i) => i + 1));
  const tasks = digits.slice(3, 7).map(make);
  const examples = digits.slice(0, 3).map(make);
  return individualRound(tasks, {
    examples,
    instruction: INFER,
    solutionHint: `Lis une lettre sur deux en commençant par la ${startingLetter}. Convertis le nombre romain obtenu en chiffre.`,
    workedExample: examples[0],
  });
}

const FRENCH_DIGITS = [
  'zero',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
];
const PHRASES = [
  'Treize robots rangent la salle.',
  'Douze roses décorent la table.',
  'Onze routeurs clignotent dans le local.',
  'Ce bijou nacré capte la lumière.',
  'Le menu noir est posé sur la table.',
  'Ce bateau navigue près du phare.',
  'Regarde Uxmal sur la carte du Mexique.',
  'N’attends rien d’eux ce soir.',
  'D’eux, je garde des souvenirs chaleureux.',
  'Il peint rois et reines pour le théâtre.',
  'On y voit rois et reines défiler.',
  'Sur la photo rétro, Isabelle tient une raquette.',
  'Le kumquat ressemble à une petite orange.',
  'Ce kumquat repose dans une soucoupe.',
  'Ce kumquat regorge de jus.',
  'Ce bruit sec inquiète le chat.',
  'Le diagnostic inquiète le village.',
  'Ce silence public inquiète la maire.',
  'Vérifie si Xavier a fermé le portail.',
  'Après Ixelles, le bus poursuit vers Bruxelles.',
  'Demande si Xavier sera là demain.',
  'Le musée expose ptérosaures et fossiles.',
  'Le livre propose ptérosaures et reptiles marins.',
  'Cette planche oppose ptérodactyles et oiseaux modernes.',
  'Aujourd’hui, tout change.',
  'Aujourd’hui, tu choisis la musique.',
  'Aujourd’hui, Théo essaie sa nouvelle raquette.',
  'Le pneu fuit lentement.',
  'Ce pneu fragile doit être remplacé.',
  'Le pneu frotte contre la carrosserie.',
];

function concealedDigits(phrase: string) {
  const words =
    phrase
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .match(/[a-z]+/g) ?? [];
  const limits: number[] = [];
  let length = 0;
  for (const word of words.slice(0, -1)) {
    length += word.length;
    limits.push(length);
  }
  const letters = words.join('');
  return range(letters.length).flatMap((start) =>
    FRENCH_DIGITS.flatMap((name, digit) => {
      if (!letters.startsWith(name, start)) return [];
      const end = start + name.length;
      const cuts = limits.filter((cut) => cut > start && cut < end);
      if (!cuts.length) return [];
      const parts = [start, ...cuts].map((offset, i) => letters.slice(offset, cuts[i] ?? end));
      return [{ digit, parts }];
    }),
  );
}

function wordsWithinWords() {
  const choices = shuffle(PHRASES).flatMap((phrase): ExplainedExercise[] => {
    const matches = concealedDigits(phrase);
    if (matches.length !== 1) return [];
    const { digit, parts } = matches[0];
    return [
      {
        digit,
        clue: textClue(phrase, true),
        explanation: `À la coupure entre les mots, colle ${parts.map((part) => `« ${part} »`).join(' et ')}. Tu obtiens « ${FRENCH_DIGITS[digit]} », qui donne le chiffre ${digit}.`,
      },
    ];
  });
  const examples = [1, 5, 9].map(
    (digit) =>
      choices.splice(
        choices.findIndex((entry) => entry.digit === digit),
        1,
      )[0],
  );
  return individualRound(choices.slice(0, 4), {
    examples,
    instruction:
      'Déduis la règle à partir des exemples. Les accents et la ponctuation ne changent pas la lecture.',
    solutionHint:
      'Colle les mots et cherche le nom d’un chiffre écrit en lettres. Le nombre caché commence à la fin d’un mot et se poursuit au début du suivant.',
    workedExample: examples[0],
  });
}

function flippedNumerals() {
  const make = (digit: number): Exercise => ({
    digit,
    clue: diagram(
      100,
      66,
      [box([31, 3], 38, 60, undefined, 'muted'), ...drawDigit(digit, 38, 9, 'focus', true)],
      `Afficheur à sept segments. Segments allumés : ${segmentDescription(digit)}.`,
    ),
  });
  const tasks = shuffle([0, 2, 4, 5, 8, 9]).slice(0, 4).map(make);
  const examples = [1, 3, 6].map(make);
  return individualRound(tasks, {
    examples,
    instruction: INFER,
    solutionHint:
      'Fais pivoter chaque afficheur d’un demi-tour, comme si tu retournais la page tête en bas. Lis le chiffre remis à l’endroit.',
    workedExample: {
      clue: examples[2].clue,
      explanation:
        'Dans ce sens, l’afficheur ressemble à un 9. Après un demi-tour, la barre qui était en haut à droite se retrouve en bas à gauche. L’afficheur ainsi remis à l’endroit montre un 6.',
    },
  });
}

export const SYMBOL_MECHANICS: readonly Mechanic[] = [
  { title: 'Les trous dans les lettres', generate: letterHoles },
  { title: 'Les lettres symétriques', generate: symmetricLetters },
  { title: 'Les symboles en Morse', generate: morse },
  { title: 'Le braille camouflé', generate: braille },
  { title: 'Le clavier téléphonique', generate: telephone },
  { title: 'Le décalage alphabétique', generate: alphabetShift },
  { title: 'Les écarts dans l’alphabet', generate: alphabetGaps },
  { title: 'Les chiffres romains cachés', generate: hiddenRoman },
  { title: 'Les nombres dissimulés dans les mots', generate: wordsWithinWords },
  { title: 'Les mots déchiffrés par rotation', generate: flippedNumerals },
];
