import type { PuzzleACadenasEntry } from './puzzle-a-cadenas.catalog';

const diagram = (label: string, lines: readonly string[], result: string): string =>
  [`@diagram ${label}`, ...lines, `@result ${result}`].join('\n');

const makePuzzle = (
  id: string,
  title: string,
  instructions: string,
  examples: readonly string[],
  targets: readonly string[],
  answer: string,
): PuzzleACadenasEntry => ({
  id,
  title,
  difficulty: 'Moyen',
  instructions,
  display: ['Exemples', ...examples, '', 'À résoudre', ...targets].join('\n'),
  answer,
});

const PUZZLE_A_CADENAS_CODES: readonly PuzzleACadenasEntry[] = [
  makePuzzle(
    '101-voisins-invisibles',
    'Les voisins invisibles',
    'Compte les paires de cases noires qui se touchent horizontalement, verticalement, puis sur chacune des deux diagonales.',
    [
      diagram('Exemple 1', ['· · · ■', '· ■ · ■', '· ■ · ■', '■ ■ · ·'], '1401'),
      diagram('Exemple 2', ['· · ■ ·', '■ ■ · ■', '· ■ ■ ■', '· · · ■'], '2142'),
      diagram('Exemple 3', ['■ · · ■', '■ ■ · ·', '■ ■ ■ ·', '· · ■ ·'], '3441'),
    ],
    [diagram('A', ['· ■ ■ ■', '■ ■ ■ ·', '· ■ · ·', '· · · ·'], '?')],
    '4324',
  ),
  makePuzzle(
    '102-archipel-secret',
    'Archipel secret',
    'Compte les îlots de cases noires reliées par leurs côtés, classés par taille : 1, 2, 3 puis 4 cases.',
    [
      diagram(
        'Exemple 1',
        ['■ · · · · ■', '■ ■ · · ■ ■', '· · · · · ·', '· · · · · ·', '■ ■ · · ■ ·', '■ ■ · · ■ ·'],
        '0121',
      ),
      diagram(
        'Exemple 2',
        ['■ ■ · · ■ ·', '■ ■ · · · ·', '· · · · · ·', '· · · · · ·', '· ■ · · ■ ·', '■ ■ · · · ·'],
        '2011',
      ),
      diagram(
        'Exemple 3',
        ['■ · · · ■ ■', '■ · · · ■ ■', '· · · · · ·', '· · · · · ·', '■ ■ · · ■ ■', '■ ■ · · · ■'],
        '0112',
      ),
    ],
    [
      diagram(
        'A',
        ['■ · · · ■ ·', '· · · · ■ ·', '· · · · · ·', '· · · · · ·', '■ · · · ■ ■', '■ · · · ■ ■'],
        '?',
      ),
    ],
    '1201',
  ),
  makePuzzle(
    '103-carrefours',
    'Les carrefours',
    'Pour chaque dessin, compte dans l’ordre les impasses, les virages, les jonctions en T et les croisements en +. Les lignes droites ne comptent pas.',
    [
      diagram(
        'Exemple 1',
        ['A ┌─┐   B ──', '  │ │', '  └─┘   C │', '          │', '          D └─┐'],
        '7410',
      ),
      diagram('Exemple 2', ['A ┌─┐─┐ B', '  │ └─┘', 'C └─┐   D ┌─┐', '    └─┐   └─┘'], '6322'),
      diagram(
        'Exemple 3',
        ['A ┌─┐   B ┌─┐', '  └─┘     │', 'C ┌─┐   D └─┐', '  └─┘     └─┘'],
        '3710',
      ),
    ],
    [
      diagram(
        'A · B · C · D',
        ['A ┌─┐   B ──', '  │     C │', '  └─┐     D └─┐', '    └─┘       └─┘'],
        '?',
      ),
    ],
    '4441',
  ),
  makePuzzle(
    '104-marche-girouettes',
    'La marche des girouettes',
    'Sur chaque rangée, compte les changements de direction entre deux flèches successives.',
    [
      diagram('Exemple 1', ['→ ↓ ↑ ↓ ↓ ↓', '→ ↑ ← → → →', '← ↑ → ↓ ↑ ←', '↑ ↓ ← ← ↓ ←'], '3354'),
      diagram('Exemple 2', ['→ → ↓ ↑ ↓ ↑', '← ↑ ← ↓ ← ↓', '← ← → ← ↑ ↓', '→ ↓ ↑ ↓ ← →'], '4545'),
      diagram('Exemple 3', ['↑ ↑ ← ← → ↑', '↓ ← → ↑ → ↑', '→ ← ← ← ↑ →', '→ ↑ ↓ ↓ ↑ ←'], '3534'),
    ],
    [diagram('A · B · C · D', ['↓ → → → ← →', '↓ ↑ → → → ←', '↓ ← ↑ ↓ ← →', '← ↑ ← ↑ ↑ ↑'], '?')],
    '3353',
  ),
  makePuzzle(
    '105-laboratoire-rayons',
    'Le laboratoire des rayons',
    'Chaque chiffre compte les cercles traversés ou touchés par le rayon vertical correspondant.',
    [
      diagram('Exemple 1', ['○○      ┆  ○○  ┆○', '  ○○○  ┆○   ┆ ○○', '○  ○○  ┆  ○ ┆○'], '4612'),
      diagram('Exemple 2', ['○○  ┆○○    ┆ ○○', '  ○○┆ ○○○ ┆  ○', '○   ┆○○   ┆ ○○'], '3403'),
      diagram('Exemple 3', ['○   ┆ ○○   ┆○○', '○   ┆○○○○ ┆ ○○', '    ┆ ○○  ┆○  '], '2033'),
    ],
    [
      diagram(
        'A · B · C · D',
        ['○○  ┆  ○○ ┆ ○', '  ○○┆○○  ┆○○', '○   ┆  ○ ┆  ○', '    ┆ ○○ ┆ ○  '],
        '?',
      ),
    ],
    '1123',
  ),
  makePuzzle(
    '106-mur-sans-peinture',
    'Le mur sans peinture',
    'Compte les côtés unitaires visibles sur le contour extérieur de chaque polyomino.',
    [
      diagram('Exemple 1', ['■■    ■    ■■■    ■■', '                 ■·'], '6468'),
      diagram('Exemple 2', ['■    ■■    ■    ■', '          ■■'], '4664'),
      diagram('Exemple 3', ['■    ■■■    ■■    ■■', '              ·■'], '4888'),
    ],
    [diagram('A · B · C · D', ['■·    ■    ■    ■■', '■■         ■■■'], '?')],
    '8486',
  ),
  makePuzzle(
    '107-toits-caches',
    'Les toits cachés',
    'Pour chaque groupe, compte les immeubles visibles depuis la gauche : un immeuble doit dépasser tous ceux placés devant lui.',
    [
      diagram('Exemple 1', ['▂ ▅ ▆ ▅ ▃   →   ▂ ▆ ▂ ▇ ▃   →   ▂ ▃ ▅ ▂ ▇   →   ▂ ▃ ▂ ▆ ▇'], '2344'),
      diagram('Exemple 2', ['▁ ▃ ▅ ▂ ▃   →   ▂ ▆ ▃ ▇ ▂   →   ▆ ▂ ▅ ▃ ▇   →   ▂ ▅ ▇ ▃ ▂'], '3213'),
      diagram('Exemple 3', ['▂ ▆ ▂ ▆ ▁   →   ▅ ▂ ▆ ▁ ▇   →   ▁ ▃ ▄ ▂ ▇   →   ▄ ▆ ▇ ▂ ▇'], '2244'),
    ],
    [diagram('A · B · C · D', ['▅ ▂ ▅ ▆ ▁   →   ▂ ▅ ▃ ▇ ▂   →   ▅ ▃ ▇ ▂ ▆   →   ▂ ▆ ▇ ▃ ▅'], '?')],
    '1323',
  ),
  makePuzzle(
    '108-deux-vitraux',
    'Les deux vitraux',
    'Superpose les deux vitraux et compte les cases dans l’ordre : clair/clair, clair/noir, noir/clair, noir/noir.',
    [
      diagram('Exemple 1', ['I       II', '■■■     ···', '■·■  +  ■■·', '■■·     ·■·'], '1152'),
      diagram('Exemple 2', ['I       II', '·■·     ■■■', '■··  +  ·■·', '■··     ···'], '3321'),
      diagram('Exemple 3', ['I       II', '·■·     ■■·', '·■■  +  ·■·', '■··     ■··'], '4113'),
    ],
    [diagram('I · II', ['·■·     ··■', '··■  +  ·■·', '■·■     ·■■'], '?')],
    '2331',
  ),
  makePuzzle(
    '109-cordes-entrecroisees',
    'Les cordes entrecroisées',
    'Dans chaque cercle, compte les paires de cordes qui se croisent à l’intérieur. Les contacts sur le bord ne comptent pas.',
    [
      diagram('Exemple 1', ['◯╲╱   ◯╲╱   ◯╱╲   ◯╳', '  ╲╱     ╳     ╲╱'], '0112'),
      diagram('Exemple 2', ['◯╳   ◯╲╱   ◯╱╲   ◯╳╲', ' ╲╱    ╲╱     ╳    ╱'], '4003'),
      diagram('Exemple 3', ['◯╳╲   ◯╱╲   ◯╳╱   ◯╲╱', ' ╲╱     ╳     ╲╱    ╳'], '2121'),
    ],
    [diagram('A · B · C · D', ['◯╳╲   ◯╲╱   ◯╳╱   ◯╳', ' ╲╱     ╳     ╲╱    ╲╱'], '?')],
    '1022',
  ),
  makePuzzle(
    '110-horloge-sans-nombres',
    'L’horloge sans nombres',
    'Le cadran possède dix positions. Pour chaque horloge, compte les pas dans le sens des aiguilles d’une montre entre l’aiguille bleu foncé et l’aiguille rouge.',
    [
      diagram('Exemple 1', ['◷   ◴   ◹   ◸', '↘   ←   ↗   ←'], '0570'),
      diagram('Exemple 2', ['◹   ◸   ◷   ◴', '→   ↗   ←   ↘'], '7859'),
      diagram('Exemple 3', ['◴   ◷   ◸   ◹', '↖   ↑   ↙   →'], '8449'),
    ],
    [diagram('A · B · C · D', ['◸   ◷   ◴   ◹', '←   ↘   ↑   ↗'], '?')],
    '7926',
  ),
  makePuzzle(
    '111-chaine-dominos',
    'La chaîne des dominos',
    'Pour chaque rangée, compte les jonctions où les deux moitiés qui se touchent portent le même nombre.',
    [
      diagram(
        'Exemple 1',
        [
          '2│1 0│0 0│3 0│0 0│0',
          '0│2 3│3 3│2 2│2 3│3',
          '0│1 0│1 1│2 3│1 1│0',
          '0│3 2│3 3│3 1│1 2│1',
        ],
        '2221',
      ),
      diagram(
        'Exemple 2',
        [
          '3│3 0│2 1│2 2│1 3│3',
          '3│1 2│1 3│1 3│1 2│3',
          '1│0 2│2 2│3 1│0 2│3',
          '3│3 2│0 3│0 0│1 0│0',
        ],
        '1011',
      ),
      diagram(
        'Exemple 3',
        [
          '0│1 3│0 2│2 2│2 2│1',
          '1│2 3│1 1│1 0│2 2│1',
          '2│2 3│0 1│3 1│1 3│3',
          '3│3 1│0 0│3 0│2 2│1',
        ],
        '2202',
      ),
    ],
    [
      diagram(
        'A · B · C · D',
        [
          '2│1 1│1 0│1 1│1 2│0',
          '2│3 2│2 2│2 0│0 2│2',
          '0│0 3│2 1│2 2│1 0│1',
          '3│1 0│3 1│2 1│1 3│0',
        ],
        '?',
      ),
    ],
    '2110',
  ),
  makePuzzle(
    '112-roues-entrainent',
    'Les roues qui s’entraînent',
    'Les engrenages en contact tournent en sens opposés. Compte, dans chaque train, les roues qui tournent comme la première roue.',
    [
      diagram('Exemple 1', ['A  ⚙⚙⚙⚙⚙', 'B  ⚙⚙⚙⚙⚙⚙⚙⚙', 'C  ⚙⚙⚙', 'D  ⚙⚙⚙⚙⚙⚙'], '3423'),
      diagram('Exemple 2', ['A  ⚙⚙⚙⚙', 'B  ⚙⚙⚙⚙⚙⚙', 'C  ⚙⚙⚙⚙⚙⚙⚙', 'D  ⚙⚙⚙⚙⚙⚙⚙⚙'], '2334'),
      diagram('Exemple 3', ['A  ⚙⚙⚙⚙⚙⚙', 'B  ⚙⚙', 'C  ⚙⚙⚙⚙⚙⚙⚙⚙', 'D  ⚙⚙⚙'], '3142'),
    ],
    [diagram('A · B · C · D', ['A  ⚙⚙⚙⚙', 'B  ⚙⚙', 'C  ⚙⚙⚙⚙⚙⚙', 'D  ⚙⚙⚙'], '?')],
    '2132',
  ),
  makePuzzle(
    '113-reseau-refuges',
    'Le réseau des refuges',
    'Depuis A, puis B, C et D, compte le nombre de points du réseau atteignables en suivant les lignes, point de départ compris.',
    [
      diagram(
        'Exemple 1',
        ['D  ○   ○   C', '       │', '○   ○   ●─○', '       │  B', '○   ○   A'],
        '4111',
      ),
      diagram(
        'Exemple 2',
        ['○   ○   ○   ○', 'A   C   ○   ○', '│   ○   B   │', '○   D──○   ○'],
        '1212',
      ),
      diagram(
        'Exemple 3',
        ['○   ○   A   ○', '○   └─┬─┘   ○', 'C   │ D     │', '    └───┘   B'],
        '1133',
      ),
    ],
    [diagram('A · B · C · D', ['○   B──○   C', '│     │    ', 'A──○  ○    ', '○──○  │  D'], '?')],
    '2411',
  ),
  makePuzzle(
    '114-feuilles-repliees',
    'Les feuilles repliées',
    'Replie chaque bande sur la ligne rouge et compte, de haut en bas, les trous exactement superposés.',
    [
      diagram('Exemple 1', ['○···│·○○·', '·○○·│·○○○', '··○○│○···', '·○○·│○○○○'], '0212'),
      diagram('Exemple 2', ['○·○○│○○··', '○○··│·○○·', '○○○○│○○○○', '○○○·│○○○○'], '2143'),
      diagram('Exemple 3', ['··○○│○···', '··○·│○○○○', '·○··│○··○', '····│○··○'], '1100'),
    ],
    [diagram('A · B · C · D', ['○·○·│·○○○', '·○·○│····', '○○··│○·○○', '···○│○··○'], '?')],
    '2020',
  ),
  makePuzzle(
    '115-tamis-collectionneur',
    'Le tamis du collectionneur',
    'Compte successivement les cercles creux, triangles pleins, carrés creux et losanges pleins.',
    [
      diagram('Exemple 1', ['□ ■ ▲ ○ ●', '◆ △ △ ○ ■', '◇ ◇ ◆ ● ●', '◆ ◇ ◆ ▲ ■'], '2214'),
      diagram('Exemple 2', ['● ▲ ▲ ○ △', '■ ◇ ◆ ◇ ◇', '● ◆ ◇ ● ■', '△ ▲ ■ ■ ◆'], '1303'),
      diagram('Exemple 3', ['▲ △ ■ ◆ ◇', '△ ▲ ▲ ○ ○', '■ ■ ○ □ □', '● □ □ ■ ○'], '4341'),
    ],
    [diagram('A · B · C · D', ['○ ◇ ◇ ● ○', '△ ● △ ◇ ■', '□ □ ● ■ ▲', '■ ◆ ○ ● ◇'], '?')],
    '3121',
  ),
  makePuzzle(
    '116-chemins-possibles',
    'Tous les chemins possibles',
    'Pour chaque plan, compte les routes distinctes de D à A sans aller vers le haut ni vers la gauche.',
    [
      diagram(
        'Exemple 1',
        [
          'D ●─●─●    D ●─●   D ●─●─●    D ●─●',
          '  │ │ │      │ │     │ │ │      │ │',
          '  ●─●─●      ●─●     ●─●─●      ●─●',
          '  │ │ │      │ │     │ │ │      │ │',
          '  ●─●─A      ●─●─A   ●─●─A      ●─●─A',
        ],
        '4462',
      ),
      diagram(
        'Exemple 2',
        [
          'D ●─●─●    D ●     D ●─●─●    D ●─●─●',
          '  │ │ │      │     │ │        │ │ │',
          '  ●─●─●      ●─●─●  ●─●─●      ●─●─●',
          '  │ │ │      │ │     │ │        │',
          '  ●─●─A      ●─●─A   ●─●─A      ●─●─A',
        ],
        '4203',
      ),
      diagram(
        'Exemple 3',
        [
          'D ●─●─●    D ●─●    D ●─●─●    D ●─●─●',
          '  │ │ │      │ │     │ │        │ │',
          '  ●─●        ●─●─●   ●─●─●      ●─●─●',
          '  │          │ │     │          │',
          '  ●─●─A      ●─●─A   ●─●─A      ●─●─A',
        ],
        '1132',
      ),
    ],
    [
      diagram(
        'A · B · C · D',
        [
          'D ●─●─●    D ●─●─●    D ●─●─●    D ●─●',
          '  │ │ │      │ │      │ │ │      │',
          '  ●─●─●      ●─●─●    ●─●─●      ●─●',
          '  │ │ │      │ │      │ │        │',
          '  ●─●─A      ●─●─A    ●─●─A      ●─●─A',
        ],
        '?',
      ),
    ],
    '4352',
  ),
  makePuzzle(
    '117-cubes-replier',
    'Les cubes à replier',
    'Chaque figure est un patron de cube. Replie mentalement les six carrés et lis la face opposée à la case orange.',
    [
      diagram(
        'Exemple 1',
        [
          '    1        1        9        9',
          '  8 3 9    3 6 9    8 1 6    5 1 2',
          '    6        5        5        6',
          '    4        4        4        3',
        ],
        '1669',
      ),
      diagram(
        'Exemple 2',
        [
          '    5        7        3       [9]',
          ' [1] 4 7    4 [8] 5   [1] 4 5    3 7 4',
          '    6        1        8        8',
          '    2        9        2        2',
        ],
        '7958',
      ),
      diagram(
        'Exemple 3',
        [
          '    6        5        6       [1]',
          ' [4] 2 5    7 1 2    8 9 4    5 3 7',
          '    7       [4]       [5]      6',
          '    9        8        3        2',
        ],
        '5566',
      ),
    ],
    [
      diagram(
        'A · B · C · D',
        [
          '    5        4        3        9',
          '  1 3 9    5 3 9    2 1 7    6 [5] 2',
          '    6       [8]       9        3',
          '   [4]       1       [5]       8',
        ],
        '?',
      ),
    ],
    '3418',
  ),
  makePuzzle(
    '118-coins-rentrants',
    'Les coins rentrants',
    'Compte les coins rentrants, c’est-à-dire les angles de 270 degrés, sur le contour de chaque silhouette.',
    [
      diagram(
        'Exemple 1',
        ['  ■    ■■    ■■    ■', '■■■   ■■■   ■■■   ■■', '■■     ■   ■■■   ■■■'],
        '4244',
      ),
      diagram(
        'Exemple 2',
        ['  ■    ■■    ■■■   ■■■', '■■■■  ■■■   ■■■   ■■■', '  ■    ■    ■     ■'],
        '4212',
      ),
      diagram(
        'Exemple 3',
        ['■■■   ■■    ■■    ■■', '  ■   ■■■   ■■■   ■■', '■■■    ■    ■     ■'],
        '3122',
      ),
    ],
    [
      diagram(
        'A · B · C · D',
        ['  ■    ■■    ■■    ■■', '■■■   ■■■   ■■■   ■■■', '  ■    ■    ■■     ■'],
        '?',
      ),
    ],
    '4132',
  ),
  makePuzzle(
    '119-constellations-symetriques',
    'Les constellations symétriques',
    'Pour chaque motif, compte les axes de symétrie possibles parmi l’horizontale, la verticale et les deux diagonales.',
    [
      diagram(
        'Exemple 1',
        [
          '○ ● ○ ● ○   ○ ○ ● ● ○   ○ ○ ○ ○ ○   ○ ○ ○ ○ ○',
          '● ○ ○ ○ ●   ○ ○ ○ ○ ○   ● ○ ○ ○ ○   ○ ● ○ ● ●',
          '○ ○ ○ ○ ○   ○ ● ○ ○ ○   ○ ○ ○ ○ ○   ○ ○ ○ ○ ○',
          '● ○ ○ ○ ●   ○ ○ ○ ○ ○   ○ ○ ○ ○ ○   ○ ○ ○ ○ ○',
          '○ ● ○ ● ○   ○ ○ ● ● ○   ○ ● ○ ○ ○   ○ ○ ○ ○ ○',
        ],
        '4100',
      ),
      diagram(
        'Exemple 2',
        [
          '● ○ ○ ○ ○   ● ● ○ ● ●   ● ○ ○ ○ ●   ○ ● ● ● ○',
          '○ ○ ○ ○ ○   ● ○ ○ ○ ●   ● ○ ○ ○ ●   ● ○ ○ ○ ●',
          '● ● ○ ○ ○   ○ ○ ○ ○ ○   ○ ○ ● ○ ○   ● ○ ○ ○ ●',
          '○ ● ○ ○ ○   ○ ○ ○ ○ ●   ● ○ ○ ○ ●   ● ○ ○ ○ ●',
          '○ ○ ● ○ ●   ● ● ○ ● ●   ● ○ ○ ○ ●   ○ ● ● ● ○',
        ],
        '1414',
      ),
      diagram(
        'Exemple 3',
        [
          '○ ○ ○ ○ ○   ○ ○ ○ ○ ○   ● ● ○ ● ●   ○ ○ ○ ○ ○',
          '○ ○ ● ○ ○   ● ○ ○ ○ ●   ○ ○ ○ ○ ○   ● ○ ○ ○ ○',
          '○ ○ ● ○ ○   ○ ○ ○ ○ ○   ○ ○ ○ ○ ○   ● ○ ○ ○ ○',
          '○ ○ ● ○ ○   ● ○ ○ ○ ●   ○ ○ ○ ○ ○   ○ ○ ○ ○ ○',
          '○ ○ ○ ○ ○   ○ ○ ○ ○ ○   ● ● ○ ● ●   ○ ○ ● ● ○',
        ],
        '2221',
      ),
    ],
    [
      diagram(
        'A · B · C · D',
        [
          '○ ○ ○ ○ ○   ○ ● ○ ● ○   ○ ○ ○ ● ○   ● ○ ○ ○ ●',
          '○ ○ ○ ○ ○   ● ○ ○ ○ ●   ○ ○ ○ ● ●   ○ ● ○ ● ○',
          '○ ○ ● ○ ○   ○ ○ ○ ○ ○   ● ○ ○ ○ ○   ○ ○ ○ ○ ○',
          '○ ● ○ ○ ○   ● ○ ○ ○ ●   ○ ● ○ ○ ○   ○ ● ● ● ○',
          '○ ○ ○ ○ ○   ○ ● ○ ● ○   ○ ○ ● ○ ○   ○ ○ ○ ○ ○',
        ],
        '?',
      ),
    ],
    '1411',
  ),
  makePuzzle(
    '120-deux-rendez-vous',
    'Deux rendez-vous',
    'Chaque chiffre est la longueur de la portion de temps couverte simultanément par les deux bandes d’une même rangée.',
    [
      diagram(
        'Exemple 1',
        [
          'teal  ━━━━━      rouge  ━━━━━━━',
          'teal      ━━━━━━━  rouge  ━━━━━',
          'teal  ━━━━━        rouge      ━',
          'teal      ━━━━━    rouge  ━━━━━━━',
        ],
        '2013',
      ),
      diagram(
        'Exemple 2',
        [
          'teal    ━━━━━━━    rouge   ━━━━━',
          'teal       ━━━━━  rouge   ━━━━━',
          'teal          ━━━ rouge   ━━━',
          'teal       ━━━━━━━ rouge      ━',
        ],
        '4211',
      ),
      diagram(
        'Exemple 3',
        [
          'teal    ━━━━━━━  rouge        ━',
          'teal  ━━━        rouge       ━',
          'teal      ━━━━━━━ rouge  ━━━━━',
          'teal  ━━━━━      rouge  ━━━━━━━',
        ],
        '0065',
      ),
    ],
    [
      diagram(
        'A · B · C · D',
        [
          'teal        ━━━  rouge   ━━━',
          'teal    ━━━      rouge  ━━━',
          'teal       ━━━━━ rouge      ━',
          'teal   ━━━━━     rouge  ━━━',
        ],
        '?',
      ),
    ],
    '0102',
  ),
  makePuzzle(
    '121-cadres-sans-fond',
    'Les cadres sans fond',
    'Compte les cadres rectangulaires emboîtés autour du même centre. Les petits anneaux isolés ne font pas partie de la pile.',
    [
      diagram('Exemple 1', ['□     ▣▣▣     ▣▣     ▣▣▣', '      ▣▣▣            ◦◦'], '1434'),
      diagram('Exemple 2', ['▣▣     ▣▣▣     □     □', '▣▣     ▣▣▣            ◦'], '3411'),
      diagram('Exemple 3', ['▣     □     ▣▣▣     ▣', '              ◦      ◦'], '2152'),
    ],
    [diagram('A · B · C · D', ['▣▣     ▣▣     ▣     □', '◦◦     ◦◦     ◦     ◦'], '?')],
    '2221',
  ),
  makePuzzle(
    '122-rubans-tresses',
    'Les quatre rubans tressés',
    'Suis chaque ruban A, B, C et D dans les croisements et note sa position de sortie à droite, de haut en bas.',
    [
      diagram('Exemple 1', ['A ─╲╱─╲╱─ 1', 'B ─╱╲──── 2', 'C ─╲────╱ 3', 'D ─────── 4'], '1234'),
      diagram('Exemple 2', ['A ─╲╱──── 1', 'B ─╱╲─╲╱ 2', 'C ─╲╱──── 3', 'D ───╲╱── 4'], '2143'),
      diagram(
        'Exemple 3',
        ['A ─╲╱─╲╱── 1', 'B ─╱╲─╲╱── 2', 'C ─╲╱──╲╱ 3', 'D ───────── 4'],
        '4123',
      ),
    ],
    [diagram('A · B · C · D', ['A ─────╲╱ 1', 'B ─╲╱──── 2', 'C ─╱╲──── 3', 'D ─╲╱──── 4'], '?')],
    '2314',
  ),
  makePuzzle(
    '123-metro-rapide',
    'Le métro le plus rapide',
    'Depuis S, compte le nombre minimal de segments du réseau parcourus pour rejoindre A, B, C puis D.',
    [
      diagram('Exemple 1', ['      C', 'D──B──┐', '   ┌──S', '   └──A'], '1324'),
      diagram('Exemple 2', ['C──┬──A', '   B  │', 'S──┘  │', 'D──┘'], '3241'),
      diagram('Exemple 3', ['   ┌──┐', '   │  │', 'B──S──┘', 'D──A──C'], '2231'),
    ],
    [diagram('A · B · C · D', ['   D──○', '   │  S', 'C──B──○', '   A'], '?')],
    '4232',
  ),
  makePuzzle(
    '124-deux-jetons',
    'Les deux jetons',
    'Dans chaque trapèze, multiplie les deux nombres. Le chiffre retenu est le chiffre des unités du produit.',
    [
      diagram('Exemple 1', ['▱ ① ④   ▱ ④ ⑦   ▱ ① ⑤   ▱ ④ ③'], '4852'),
      diagram('Exemple 2', ['▱ ⑨ ⑤   ▱ ② ⑨   ▱ ③ ⑥   ▱ ③ ②'], '5886'),
      diagram('Exemple 3', ['▱ ⑦ ⑥   ▱ ⑥ ⑥   ▱ ② ⑦   ▱ ⑤ ⑥'], '2640'),
    ],
    [diagram('A · B · C · D', ['▱ ⑥ ④   ▱ ① ⑥   ▱ ⑨ ②   ▱ ⑨ ⑦'], '?')],
    '4683',
  ),
  makePuzzle(
    '125-poids-symboles',
    'Le poids des symboles',
    'Chaque forme possède une valeur fixe : cercle = 2, triangle = 4, carré = 3, losange = 1. Additionne les valeurs et garde le chiffre des unités.',
    [
      diagram('Exemple 1', ['▣ ●   ▲ ● ● ▲   ■   ■ ▲ ●', '────────  ───────  ───  ─────'], '5239'),
      diagram('Exemple 2', ['▲ ▲ ■ ◆   ■   ■ ◆   ▲ ■ ■', '────────  ───  ─────  ─────'], '2340'),
      diagram(
        'Exemple 3',
        ['◆ ◆   ■ ■ ▲ ◆   ▲ ▲ ● ◆   ●', '────  ────────  ─────────  ───'],
        '2112',
      ),
    ],
    [
      diagram(
        'A · B · C · D',
        ['■ ◆ ● ■   ● ● ● ◆   ■ ▲ ▲ ▲   ◆', '────────  ─────────  ─────────  ───'],
        '?',
      ),
    ],
    '9751',
  ),
] as const satisfies readonly PuzzleACadenasEntry[];

export { PUZZLE_A_CADENAS_CODES };
