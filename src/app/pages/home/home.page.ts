import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';

type PuzzleCard = {
  title: string;
  description: string;
  route: string;
  tag?: string;
  needsCompletion?: boolean;
};

type PuzzleCategory = {
  id: string;
  title: string;
  description: string;
  puzzles: PuzzleCard[];
  emptyText?: string;
  sortable?: boolean;
  showSolvedStatus?: boolean;
};

type HomeSortMode = 'default' | 'oldest';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly sortModeStorageKey = 'epique-home-sort-mode';
  private readonly router = inject(Router);
  private readonly playHistory = inject(PuzzlePlayHistoryService);

  readonly sortMode = signal<HomeSortMode>(this.readSortMode());
  readonly categories = computed<PuzzleCategory[]>(() =>
    this.baseCategories.map((category) => ({
      ...category,
      puzzles:
        this.sortMode() === 'oldest' && category.sortable !== false
          ? [...category.puzzles].sort((first, second) => this.compareByOldestPlayed(first, second))
          : category.puzzles,
    })),
  );

  private readonly baseCategories: PuzzleCategory[] = [
    {
      id: 'mots-langage',
      title: 'Mots et langage',
      description: 'Jeux de lettres, de phrases et de déchiffrement.',
      puzzles: [
        {
          title: 'Anagrammes',
          description: 'Réarrange les lettres pour retrouver le mot caché.',
          route: '/anagrams',
          tag: 'Lettres',
        },
        {
          title: 'Crypto',
          description: 'Déchiffre un message codé à partir d’indices.',
          route: '/cryptograms',
          tag: 'Code',
        },
        {
          title: 'Mots cachés',
          description: 'Trouve les mots dans la grille, puis déchiffre les lettres restantes.',
          route: '/word-search',
          tag: 'Grille',
        },
        {
          title: 'Lettres parasites',
          description: 'Barre les lettres inutiles pour retrouver la phrase cachée.',
          route: '/hidden-phrase',
          tag: 'Phrase',
        },
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
      title: 'Ciphers',
      description: 'Mots transformés avec des codes simples à décoder mentalement.',
      puzzles: [
        {
          title: 'César',
          description: 'Retrouve le mot original après un décalage de lettres.',
          route: '/ciphers/caesar',
          tag: 'Codes',
        },
        {
          title: 'Pigpen',
          description: 'Décode les lettres remplacées par des symboles de grille.',
          route: '/ciphers/pigpen',
          tag: 'Codes',
        },
        {
          title: 'A1Z26',
          description: 'Convertis les nombres en lettres de A à Z.',
          route: '/ciphers/a1z26',
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
          title: 'Atbash',
          description: 'Inverse l’alphabet pour retrouver le mot caché.',
          route: '/ciphers/atbash',
          tag: 'Codes',
        },
        {
          title: 'Tap code',
          description: 'Utilise les coordonnées de la grille 5 x 5.',
          route: '/ciphers/tap-code',
          tag: 'Codes',
        },
        {
          title: 'Sémaphore',
          description: 'Lis les positions de deux drapeaux pour décoder le mot.',
          route: '/ciphers/semaphore',
          tag: 'Codes',
        },
        {
          title: 'NATO',
          description: 'Retrouve les lettres depuis l’alphabet radio.',
          route: '/ciphers/nato',
          tag: 'Codes',
        },
      ],
    },
    {
      id: 'memoire',
      title: 'Mémoire',
      description: 'Jeux basés sur la mémorisation, les symboles et les associations.',
      puzzles: [
        {
          title: 'Grille mémoire',
          description: 'Mémorise une grille de formes et de couleurs.',
          route: '/memory-grid',
          tag: 'Mémoire',
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
      id: 'nombres-calcul',
      title: 'Nombres et calcul',
      description: 'Suites, grilles numériques et raisonnement mathématique.',
      puzzles: [
        {
          title: 'Suites mathématiques',
          description: 'Trouve le prochain nombre dans une suite logique.',
          route: '/sequences',
          tag: 'Nombres',
        },
        {
          title: 'Calcul croisé',
          description: 'Complète une grille où les lignes et les colonnes forment des équations.',
          route: '/crossmath',
          tag: 'Calcul',
        },
        {
          title: 'Carré latin',
          description: 'Place chaque chiffre une seule fois par ligne et par colonne.',
          route: '/latin-square',
          tag: 'Grille',
        },
        {
          title: 'Carré magique',
          description: 'Complète la grille pour atteindre la même somme partout.',
          route: '/magic-square',
          tag: 'Sommes',
        },
        {
          title: 'Pyramide de sommes',
          description: 'Complete la pyramide en additionnant deux cases collees vers le haut.',
          route: '/sum-pyramid',
          tag: 'Sommes',
        },
        {
          title: 'Compte est bon',
          description: 'Utilise les nombres disponibles et les operations pour approcher une cible.',
          route: '/count-is-good',
          tag: 'Cible',
        },
        {
          title: 'KenKen / Calcudoku',
          description: 'Complete une grille avec chiffres uniques et contraintes de calcul.',
          route: '/calcudoku',
          tag: 'Contraintes',
        },
        {
          title: 'Arithmétique mentale',
          description: 'Resous des calculs courts et rapides en gardant le rythme.',
          route: '/mental-arithmetic',
          tag: 'Vitesse',
        },
        {
          title: 'Nim',
          description: 'Analyse les tas et trouve les bons retraits avec la logique XOR.',
          route: '/nim',
          tag: 'XOR',
        },
      ],
    },
    {
      id: 'deduction-logique',
      title: 'Déduction et logique',
      description: 'Puzzles où il faut éliminer les possibilités et lire entre les indices.',
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
          title: 'Zebra Puzzle',
          description: 'Déduis les bonnes caractéristiques en fonction des indices.',
          route: '/zebra',
          tag: 'Déduction',
        },
      ],
    },
    {
      id: 'spatial-placement',
      title: 'Spatial et placement',
      description: 'Casse-têtes de formes, de déplacements et de reconstruction visuelle.',
      puzzles: [
        {
          title: 'Grille de pièces',
          description: 'Place les pièces dans la grille pour compléter le puzzle.',
          route: '/jigsaw-grid',
          tag: 'Placement',
        },
        {
          title: 'Chemins',
          description: 'Reconstruis le chemin continu avec les blocs disponibles.',
          route: '/jigsaw-blocks',
          tag: 'Chemin',
        },
        {
          title: 'Cube 3 faces',
          description:
            'Reconstruis trois images sur un coin de cube avec des morceaux de face, d’arête et de coin.',
          route: '/corner-cube',
          tag: '3D',
        },
        {
          title: 'Taquin 15',
          description:
            'Glisse les 15 pièces pour remettre les nombres en ordre ou reconstruire une image.',
          route: '/sliding-puzzle',
          tag: 'Glisse',
        },
        {
          title: 'Superposition',
          description: 'Superpose les formes colorées dans le bon ordre pour reproduire l’image.',
          route: '/shape-layers',
          tag: 'Formes',
        },
        {
          title: 'Tangram',
          description: 'Place et assemble les sept pièces classiques du tangram.',
          route: '/tangram',
          tag: 'Formes',
        },
        {
          title: 'Laser',
          description: 'Fais tourner les miroirs pour guider le laser jusqu’à la bonne sortie.',
          route: '/laser',
          tag: 'Réflexion',
        },
        {
          title: 'Rush Hour',
          description: 'Déplace les véhicules dans une grille 6×6 pour libérer la voiture rouge.',
          route: '/rush-hour',
          tag: 'Blocage',
        },
        {
          title: 'Dé logique',
          description: 'Suis le parcours d’un dé et retrouve le dernier symbole.',
          route: '/dice',
          tag: 'Spatial',
        },
      ],
    },
    {
      id: 'strategie-timing',
      title: 'Stratégie et timing',
      description: 'Jeux plus directs où le bon coup ou le bon moment fait toute la différence.',
      puzzles: [
        {
          title: 'Tic-Tac-Toe',
          description: 'Déplace tes trois X et aligne-les avant le CPU.',
          route: '/tic-tac-toe',
          tag: 'Stratégie',
        },
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
      title: 'Multi-joueurs',
      description: 'Jeux a partager en salle avec plusieurs joueurs.',
      puzzles: [
        {
          title: 'Description de symboles',
          description: 'Decris un symbole pour que les autres retrouvent la bonne image.',
          route: '/describe-symbols',
          tag: 'En ligne',
        },
      ],
    },
    {
      id: 'enigmes',
      title: 'Enigmes',
      description: "Vraies enigmes de type jeu d'evasion.",
      puzzles: [
        {
          title: 'Navigation',
          description: 'Trouve ton chemin.',
          route: '/puzzlehunt/navigation',
          tag: 'Hunt',
        },
      ],
      emptyText: 'Aucun puzzle ajoute pour le moment.',
      sortable: false,
      showSolvedStatus: true,
    },
  ];

  setSortMode(sortMode: HomeSortMode): void {
    this.sortMode.set(sortMode);
    this.writeSortMode(sortMode);
  }

  playRandomOldestPuzzle(): void {
    const puzzles = this.baseCategories
      .filter((category) => category.sortable !== false && category.id !== 'multijoueurs')
      .flatMap((category) => category.puzzles);

    if (puzzles.length === 0) {
      return;
    }

    const oldestPlayedAt = Math.min(
      ...puzzles.map((puzzle) => this.playHistory.lastPlayedAt(puzzle.route) ?? 0),
    );
    const oldestPuzzles = puzzles.filter(
      (puzzle) => (this.playHistory.lastPlayedAt(puzzle.route) ?? 0) === oldestPlayedAt,
    );
    const randomPuzzle = oldestPuzzles[Math.floor(Math.random() * oldestPuzzles.length)];

    void this.router.navigateByUrl(`${randomPuzzle.route}?from=random`);
  }

  lastPlayedText(route: string): string {
    const playedAt = this.playHistory.lastPlayedAt(route);

    if (!playedAt) {
      return 'Jamais joue';
    }

    const elapsedMilliseconds = Date.now() - playedAt;
    const elapsedDays = Math.floor(elapsedMilliseconds / 86_400_000);

    if (elapsedDays <= 0) {
      return "Joue aujourd'hui";
    }

    if (elapsedDays === 1) {
      return 'Joue hier';
    }

    if (elapsedDays < 7) {
      return `Joue il y a ${elapsedDays} jours`;
    }

    return `Derniere fois: ${new Intl.DateTimeFormat('fr-CA', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(playedAt))}`;
  }

  solvedStatusText(route: string): string {
    return this.playHistory.isSolved(route) ? 'Resolue' : 'Non resolue';
  }

  solvedStatusClass(route: string): string {
    return this.playHistory.isSolved(route) ? 'solved' : 'unsolved';
  }

  private compareByOldestPlayed(first: PuzzleCard, second: PuzzleCard): number {
    const firstPlayedAt = this.playHistory.lastPlayedAt(first.route) ?? 0;
    const secondPlayedAt = this.playHistory.lastPlayedAt(second.route) ?? 0;

    return firstPlayedAt - secondPlayedAt || first.title.localeCompare(second.title);
  }

  private readSortMode(): HomeSortMode {
    try {
      const storedSortMode = globalThis.localStorage?.getItem(this.sortModeStorageKey);

      return storedSortMode === 'oldest' ? 'oldest' : 'default';
    } catch {
      return 'default';
    }
  }

  private writeSortMode(sortMode: HomeSortMode): void {
    try {
      globalThis.localStorage?.setItem(this.sortModeStorageKey, sortMode);
    } catch {
      // The selected order still applies for the current page when storage is unavailable.
    }
  }
}
