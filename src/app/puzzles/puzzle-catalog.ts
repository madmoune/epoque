import { EPIQUE_DUELS } from './epique-duels/epique-duels.catalog';
import { NEW_GAMES, type NewGameId } from './new-games/new-games.catalog';

// Les jeux masqués restent accessibles par leur lien et les playlists existantes.
export const HIDDEN_PUZZLE_ROUTES: ReadonlySet<string> = new Set(['/mnemonic']);

export type PuzzleCard = {
  title: string;
  description: string;
  route: string;
  tag?: string;
  needsCompletion?: boolean;
};

export type PuzzleCategory = {
  id: string;
  title: string;
  description: string;
  puzzles: PuzzleCard[];
  emptyText?: string;
  sortable?: boolean;
  showSolvedStatus?: boolean;
};

function newGameCard(id: NewGameId): PuzzleCard {
  const { title, description, tag } = NEW_GAMES.find((game) => game.id === id)!;

  return { title, description, route: `/${id}`, tag };
}

export const PUZZLE_CATEGORIES: readonly PuzzleCategory[] = [
  {
    id: 'nouveaux-jeux',
    title: 'Nouveaux jeux',
    description: 'Découvre les dernières énigmes ajoutées à la collection.',
    puzzles: [
      {
        title: 'Voisins numérotés',
        description: 'Place huit nombres sur les chaises en respectant une règle de voisinage.',
        route: '/voisins-numerotes',
        tag: 'Déduction',
      },
      {
        title: 'Calcul en chaîne',
        description: 'Suis les opérations dans l’ordre pour trouver le résultat final.',
        route: '/calcul-en-chaine',
        tag: 'Calcul',
      },
      {
        title: 'Triangle magique',
        description: 'Place six chiffres pour égaliser les sommes des trois côtés du triangle.',
        route: '/triangle-magique',
        tag: 'Sommes',
      },
      {
        title: 'Polygones étoilés',
        description: 'Relie les étoiles pour retrouver deux figures géométriques superposées.',
        route: '/polygones-etoiles',
        tag: 'Géométrie',
      },
      {
        title: 'Voie ferrée',
        description: 'Trace une voie continue en respectant les compteurs des lignes et colonnes.',
        route: '/voie-ferree',
        tag: 'Parcours',
      },
      {
        title: 'Grille de propriétés',
        description: 'Place neuf nombres selon les règles de leurs lignes et colonnes.',
        route: '/grille-proprietes',
        tag: 'Déduction',
      },
      {
        title: 'Mots sans voyelles',
        description: 'Retrouve un mot à partir de ses consonnes.',
        route: '/mots-sans-voyelles',
        tag: 'Lettres',
      },
      {
        title: 'Bâtonnets de calcul',
        description: 'Soulève les bâtonnets dans l’ordre pour reconstituer un calcul.',
        route: '/batonnets-de-calcul',
        tag: 'Calcul',
      },
      {
        title: 'Grille d’opérations',
        description: 'Place les chiffres de 1 à 9 pour réussir les quatre égalités de la grille.',
        route: '/grille-operations',
        tag: 'Calcul',
      },
      {
        title: 'Ponts et îles',
        description: 'Passe d’île en île en traversant chaque pont une seule fois.',
        route: '/ponts-et-iles',
        tag: 'Parcours',
      },
      {
        title: 'Calcul codé',
        description: 'Teste des calculs pour retrouver le chiffre caché derrière chaque symbole.',
        route: '/calcul-code',
        tag: 'Calcul',
      },
      {
        title: 'Mosaïque logique',
        description: 'Colorie une grille selon des indices de proportions, de symétrie et de position.',
        route: '/mosaique-logique',
        tag: 'Déduction',
      },
    ],
  },
  {
    id: 'mots-langage',
    title: 'Mots et phrases',
    description: 'Trouve des mots, croise des lettres et reconstitue des phrases.',
    puzzles: [
      {
        title: 'Anagrammes',
        description: 'Réarrange les lettres pour retrouver le mot caché.',
        route: '/anagrams',
        tag: 'Lettres',
      },
      {
        title: 'Wordle',
        description: 'Trouve le mot de cinq lettres en six essais grâce aux couleurs.',
        route: '/wordle',
        tag: 'Lettres',
      },
      {
        title: 'Échelle de mots',
        description: 'Change une lettre à la fois pour passer du mot de départ au mot cible.',
        route: '/word-ladder',
        tag: 'Lettres',
      },
      {
        title: 'Mot pivot',
        description: 'Trouve le mot commun qui relie trois expressions.',
        route: '/pivot-word',
        tag: 'Associations',
      },
      {
        title: 'Mots cachés',
        description: 'Trouve les mots dans la grille, puis déchiffre les lettres restantes.',
        route: '/word-search',
        tag: 'Grille',
      },
      newGameCard('word-fit'),
      {
        title: 'Lettres parasites',
        description: 'Barre les lettres inutiles pour retrouver la phrase cachée.',
        route: '/hidden-phrase',
        tag: 'Phrase',
      },
      newGameCard('drop-quote'),
      {
        title: 'Phrases',
        description: 'Reconstruis ou devine la phrase cachée.',
        route: '/phrases',
        tag: 'Langage',
      },
    ],
  },
  {
    id: 'ciphers',
    title: 'Codes et déchiffrement',
    description: 'Décode des messages à partir de lettres, de chiffres ou de symboles.',
    puzzles: [
      {
        title: 'Crypto',
        description: 'Déchiffre un message codé à partir d’indices.',
        route: '/cryptograms',
        tag: 'Code',
      },
      {
        title: 'César',
        description: 'Retrouve le mot original après un décalage de lettres.',
        route: '/ciphers/caesar',
        tag: 'Codes',
      },
      {
        title: 'Atbash',
        description: 'Inverse l’alphabet pour retrouver le mot caché.',
        route: '/ciphers/atbash',
        tag: 'Codes',
      },
      {
        title: 'A1Z26',
        description: 'Convertis les nombres en lettres de A à Z.',
        route: '/ciphers/a1z26',
        tag: 'Codes',
      },
      {
        title: 'NATO',
        description: 'Retrouve les lettres depuis l’alphabet radio.',
        route: '/ciphers/nato',
        tag: 'Codes',
      },
      {
        title: 'Morse',
        description: 'Lis les points et les traits pour retrouver le mot.',
        route: '/ciphers/morse',
        tag: 'Codes',
      },
      {
        title: 'Braille',
        description: 'Décode les cellules braille en lettres.',
        route: '/ciphers/braille',
        tag: 'Codes',
      },
      {
        title: 'Pigpen',
        description: 'Décode les lettres remplacées par des symboles de grille.',
        route: '/ciphers/pigpen',
        tag: 'Codes',
      },
      {
        title: 'Tap code',
        description: 'Utilise les coordonnées de la grille de 5 × 5 cases.',
        route: '/ciphers/tap-code',
        tag: 'Codes',
      },
      {
        title: 'Sémaphore',
        description: 'Lis les positions de deux drapeaux pour décoder le mot.',
        route: '/ciphers/semaphore',
        tag: 'Codes',
      },
    ],
  },
  {
    id: 'nombres-calcul',
    title: 'Calcul et suites',
    description: 'Calcule de tête, atteins un nombre cible ou trouve la règle d’une suite.',
    puzzles: [
      {
        title: 'Calcul rapide',
        description:
          'Enchaîne des multiplications et des divisions exactes, parfois suivies d’une addition ou d’une soustraction.',
        route: '/quick-arithmetic',
        tag: 'Vitesse',
      },
      {
        title: 'Arithmétique mentale',
        description:
          'Résous des calculs avancés avec des parenthèses, des puissances et des racines.',
        route: '/mental-arithmetic',
        tag: 'Priorités',
      },
      {
        title: 'Compte est bon',
        description: 'Utilise les nombres disponibles et les opérations pour approcher une cible.',
        route: '/count-is-good',
        tag: 'Cible',
      },
      {
        title: 'Suites mathématiques',
        description: 'Trouve le prochain nombre dans une suite logique.',
        route: '/sequences',
        tag: 'Nombres',
      },
      newGameCard('cryptarithms'),
    ],
  },
  {
    id: 'grilles-numeriques',
    title: 'Grilles de nombres',
    description:
      'Complète les cases en respectant les sommes, les indices et les contraintes de chaque grille.',
    puzzles: [
      {
        title: 'Carré latin',
        description: 'Place chaque chiffre une seule fois par ligne et par colonne.',
        route: '/latin-square',
        tag: 'Grille',
      },
      newGameCard('skyscrapers'),
      {
        title: 'Carré magique',
        description: 'Complète la grille pour atteindre la même somme partout.',
        route: '/magic-square',
        tag: 'Sommes',
      },
      {
        title: 'Pyramide de sommes',
        description: 'Additionne les nombres de deux cases voisines pour remplir celle du dessus.',
        route: '/sum-pyramid',
        tag: 'Sommes',
      },
      newGameCard('sumplete'),
      {
        title: 'Calcul croisé',
        description: 'Complète une grille où les lignes et les colonnes forment des équations.',
        route: '/crossmath',
        tag: 'Calcul',
      },
      newGameCard('kakuro'),
      {
        title: 'KenKen / Calcudoku',
        description: 'Complète une grille avec des chiffres uniques et des contraintes de calcul.',
        route: '/calcudoku',
        tag: 'Contraintes',
      },
    ],
  },
  {
    id: 'deduction-logique',
    title: 'Déduction logique',
    description: 'Croise les indices et élimine les possibilités pour déduire la solution.',
    puzzles: [
      {
        title: 'Chevaliers et menteurs',
        description: 'Déduis qui dit toujours vrai et qui ment toujours.',
        route: '/knights-and-knaves',
        tag: 'Logique',
      },
      {
        title: 'Mastermind',
        description: 'Devine une suite de formes et de couleurs.',
        route: '/mastermind',
        tag: 'Déduction',
      },
      {
        title: 'Déduction de Nombre',
        description: 'Croise cinq essais pour déduire le code à quatre chiffres.',
        route: '/code-deduction',
        tag: 'Déduction',
      },
      {
        title: 'Zebra Puzzle',
        description: 'Déduis les bonnes caractéristiques en fonction des indices.',
        route: '/zebra',
        tag: 'Déduction',
      },
      {
        title: 'Balance logique',
        description: 'Compare des pierres colorées et déduis leur poids.',
        route: '/weight-deduction',
        tag: 'Pesées',
      },
      {
        title: 'Poids suspendus',
        description: 'Équilibre les leviers et retrouve les poids accrochés aux branches.',
        route: '/hanging-weights',
        tag: 'Leviers',
      },
    ],
  },
  {
    id: 'spatial-placement',
    title: 'Formes et assemblage',
    description: 'Assemble, oriente ou superpose des pièces pour reconstituer une figure.',
    puzzles: [
      {
        title: 'Tangram',
        description: 'Place et assemble les sept pièces classiques du tangram.',
        route: '/tangram',
        tag: 'Formes',
      },
      {
        title: 'Grille de pièces',
        description: 'Place les pièces dans la grille pour compléter le puzzle.',
        route: '/jigsaw-grid',
        tag: 'Placement',
      },
      {
        title: 'Superposition',
        description: 'Superpose les formes colorées dans le bon ordre pour reproduire l’image.',
        route: '/shape-layers',
        tag: 'Formes',
      },
      {
        title: 'Cube 3 faces',
        description:
          'Reconstruis trois images sur un coin de cube avec des morceaux de face, d’arête et de coin.',
        route: '/corner-cube',
        tag: '3D',
      },
      {
        title: 'Tiges colorées',
        description: 'Aligne les tiges sans répéter une couleur au même niveau.',
        route: '/color-rods',
        tag: 'Couleurs',
      },
    ],
  },
  {
    id: 'parcours-deplacements',
    title: 'Parcours et déplacements',
    description: 'Trace un chemin ou trouve la bonne suite de déplacements sur un plateau.',
    puzzles: [
      {
        title: 'Chemins',
        description: 'Reconstruis le chemin continu avec les blocs disponibles.',
        route: '/jigsaw-blocks',
        tag: 'Chemin',
      },
      {
        title: 'Laser',
        description: 'Fais tourner les miroirs pour guider le laser jusqu’à la bonne sortie.',
        route: '/laser',
        tag: 'Réflexion',
      },
      {
        title: 'Dé logique',
        description: 'Suis le parcours d’un dé et retrouve le dernier symbole.',
        route: '/dice',
        tag: 'Spatial',
      },
      {
        title: 'Problème du Cavalier',
        description: 'Enchaîne les sauts du cavalier pour révéler un mot caché.',
        route: '/knights-tour',
        tag: 'Cavalier',
      },
      {
        title: 'Taquin 15',
        description:
          'Glisse les 15 pièces pour remettre les nombres en ordre ou reconstruire une image.',
        route: '/sliding-puzzle',
        tag: 'Glisse',
      },
      {
        title: 'Rush Hour',
        description:
          'Déplace les véhicules dans une grille de 6 × 6 cases pour libérer la voiture rouge.',
        route: '/rush-hour',
        tag: 'Blocage',
      },
      {
        title: 'Tours de Hanoï',
        description: 'Déplace toute la tour sans poser un grand disque sur un plus petit.',
        route: '/towers-of-hanoi',
        tag: 'Stratégie',
      },
    ],
  },
  {
    id: 'memoire',
    title: 'Mémoire',
    description: 'Mémorise des formes, des positions ou des associations.',
    puzzles: [
      {
        title: 'Grille mémoire',
        description: 'Mémorise une grille de formes et de couleurs.',
        route: '/memory-grid',
        tag: 'Mémoire',
      },
      {
        title: 'Paires de symboles',
        description: 'Retourne les cartes et retrouve tous les symboles identiques.',
        route: '/symbol-pairs',
        tag: 'Paires',
      },
      {
        title: 'Mémoire des morceaux',
        description: 'Retiens cinq formes, retrouve-les parmi dix, puis assemble le casse-tête.',
        route: '/memory-pieces',
        tag: 'Formes',
      },
      {
        title: 'Mnémotechnique',
        description: 'Pratique les associations objet, qualité, action et lieu.',
        route: '/mnemonic',
        tag: 'Méthode',
      },
    ],
  },
  {
    id: 'duels-epique',
    title: 'Duels de stratégie',
    description: 'Prévois les coups de l’adversaire dans des jeux au tour par tour.',
    puzzles: [
      {
        title: 'Nim',
        description: 'Analyse les tas et trouve les bons retraits avec la logique XOR.',
        route: '/nim',
        tag: 'XOR',
      },
      ...EPIQUE_DUELS.map((game) => ({
        title: game.title,
        description: game.description,
        route: `/${game.id}`,
        tag: game.tag,
      })),
      {
        title: 'Tic-Tac-Toe',
        description: 'Déplace tes trois X et aligne-les avant le CPU.',
        route: '/tic-tac-toe',
        tag: 'Stratégie',
      },
    ],
  },
  {
    id: 'strategie-timing',
    title: 'Timing et précision',
    description: 'Choisis le bon moment pour agir et synchroniser tes mouvements.',
    puzzles: [
      {
        title: 'Chute cachée',
        description: 'Lance quatre billes au bon moment pour les faire arriver ensemble.',
        route: '/timing-drop',
        tag: 'Timing',
      },
    ],
  },
  {
    id: 'multijoueurs',
    title: 'Coopération en ligne',
    description: 'Communique avec les autres joueurs pour réussir une manche ensemble.',
    puzzles: [
      {
        title: 'Description de symboles',
        description: 'Décris un symbole pour que les autres retrouvent la bonne image.',
        route: '/describe-symbols',
        tag: 'En ligne',
      },
    ],
  },
  {
    id: 'collections',
    title: 'Collections',
    description: 'Enchaîne plusieurs énigmes dans une même collection.',
    puzzles: [
      {
        title: 'Puzzle à Cadenas',
        description: 'Parcours une collection de puzzles à déverrouiller au fil des défis.',
        route: '/puzzle-a-cadenas',
        tag: 'Collection',
      },
      {
        title: 'Cadenas mystère',
        description: 'Déduis un code à quatre chiffres dans une énigme générée à chaque partie.',
        route: '/cadenas-mystere',
        tag: 'Aléatoire',
      },
    ],
  },
];

export function puzzleMenuFragment(url: string): string {
  const route = url.split(/[?#]/)[0];
  const category = PUZZLE_CATEGORIES.find(({ puzzles }) =>
    puzzles.some((puzzle) => puzzle.route === route),
  );

  if (category) return category.id;
  if (route.startsWith('/ciphers/')) return 'ciphers';
  if (route.startsWith('/play/') || route.startsWith('/puzzlehunt/')) return 'enigmes';
  if (route === '/tiges') return 'parcours-deplacements';

  return route.replace(/^\/+/, '');
}
