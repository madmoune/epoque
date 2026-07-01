import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';

type PuzzleCard = {
  title: string;
  description: string;
  route: string;
  tag?: string;
};

type PuzzleCategory = {
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
  private readonly playHistory = inject(PuzzlePlayHistoryService);

  protected readonly sortMode = signal<HomeSortMode>(this.readSortMode());
  protected readonly categories = computed(() =>
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
          title: 'Phrases',
          description: 'Reconstruis ou devine la phrase cachée.',
          route: '/phrases',
          tag: 'Langage',
        },
      ],
    },
    {
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
          title: 'Nim',
          description: 'Analyse les tas et trouve les bons retraits avec la logique XOR.',
          route: '/nim',
          tag: 'XOR',
        },
      ],
    },
    {
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

  protected setSortMode(sortMode: HomeSortMode): void {
    this.sortMode.set(sortMode);
    this.writeSortMode(sortMode);
  }

  protected lastPlayedText(route: string): string {
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

  protected solvedStatusText(route: string): string {
    return this.playHistory.isSolved(route) ? 'Resolue' : 'Non resolue';
  }

  protected solvedStatusClass(route: string): string {
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
