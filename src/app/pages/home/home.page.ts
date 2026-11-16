import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import {
  PlaylistProgressSnapshot,
  PuzzlePlaylist,
  PuzzlePlaylistService,
} from '../../puzzle-playlist.service';
import { LAB_PUZZLE_TYPES } from '../lab/lab.puzzle-types';
import {
  FirebasePuzzleCatalogService,
  PuzzleCatalogApprovalState,
} from '../../shared/firebase/firebase-puzzle-catalog.service';
import { AppStorageService } from '../../shared/storage/app-storage.service';
import {
  PUZZLE_CATEGORIES,
  type PuzzleCard,
  type PuzzleCategory,
} from '../../puzzles/puzzle-catalog';

type PlaylistPuzzleOption = PuzzleCard & {
  categoryTitle: string;
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
  private readonly storage = inject(AppStorageService);
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly playlistService = inject(PuzzlePlaylistService);
  private readonly firebaseCatalog = inject(FirebasePuzzleCatalogService);
  private readonly labTypeNames = signal<Record<string, string>>({});
  private readonly labTypeStates = signal<Record<string, PuzzleCatalogApprovalState>>({});

  readonly sortMode = signal<HomeSortMode>(this.readSortMode());
  readonly searchQuery = signal('');
  readonly playlists = this.playlistService.playlists;
  readonly newPlaylistName = signal('');
  readonly editingPlaylistId = signal<string | null>(null);
  readonly pendingPlaylistDeletionId = signal<string | null>(null);
  readonly editingPlaylist = computed(
    () => this.playlists().find((playlist) => playlist.id === this.editingPlaylistId()) ?? null,
  );
  readonly pendingPlaylistDeletion = computed(
    () =>
      this.playlists().find((playlist) => playlist.id === this.pendingPlaylistDeletionId()) ?? null,
  );
  readonly playlistPuzzleOptions = computed<PlaylistPuzzleOption[]>(() =>
    this.categories().flatMap((category) =>
      category.puzzles.map((puzzle) => ({ ...puzzle, categoryTitle: category.title })),
    ),
  );
  readonly categories = computed<PuzzleCategory[]>(() => {
    const labCategory: PuzzleCategory = {
      id: 'enigmes',
      title: 'Énigmes du laboratoire',
      description: 'Résous des énigmes individuelles approuvées par le laboratoire.',
      puzzles: LAB_PUZZLE_TYPES.filter(
        (type) => (this.labTypeStates()[type.id] ?? type.state) === 'approved',
      ).map((type) => ({
        title: this.labTypeNames()[type.id] ?? type.name,
        description: type.description,
        route: type.playRoute,
        tag: 'Énigme',
      })),
      emptyText: 'Aucune énigme approuvée pour le moment.',
      sortable: false,
      showSolvedStatus: true,
    };

    return [...PUZZLE_CATEGORIES, labCategory].map((category) => ({
      ...category,
      puzzles:
        this.sortMode() === 'oldest' && category.sortable !== false
          ? [...category.puzzles].sort((first, second) => this.compareByOldestPlayed(first, second))
          : category.puzzles,
    }));
  });
  readonly visibleCategories = computed<PuzzleCategory[]>(() => {
    const query = this.normalizeSearch(this.searchQuery());

    if (!query) {
      return this.categories();
    }

    return this.categories()
      .map((category) => ({
        ...category,
        puzzles: category.puzzles.filter((puzzle) =>
          this.normalizeSearch(puzzle.title).includes(query),
        ),
      }))
      .filter((category) => category.puzzles.length > 0);
  });

  constructor() {
    this.storage.changes$.subscribe((change) => {
      if (change.source === 'remote' && change.key === this.sortModeStorageKey) {
        this.sortMode.set(this.readSortMode());
      }
    });

    void this.loadApprovedLabPuzzles();
  }

  private async loadApprovedLabPuzzles(): Promise<void> {
    if (!this.firebaseCatalog.isConfigured) {
      return;
    }

    try {
      const overrides = await this.firebaseCatalog.loadStatuses();
      this.labTypeNames.set(overrides.typeNames);
      this.labTypeStates.set(overrides.typeStates);
    } catch {
      // L’accueil conserve la liste vide tant que le catalogue LAB est indisponible.
    }
  }

  setSortMode(sortMode: HomeSortMode): void {
    this.sortMode.set(sortMode);
    this.writeSortMode(sortMode);
  }

  setSearchQuery(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  setNewPlaylistName(event: Event): void {
    this.newPlaylistName.set((event.target as HTMLInputElement).value);
  }

  createPlaylist(): void {
    const name = this.newPlaylistName().trim();
    const userPlaylistCount = this.playlists().filter((playlist) => !playlist.isStatic).length;
    const playlist = this.playlistService.create(name || `Playlist ${userPlaylistCount + 1}`);

    this.newPlaylistName.set('');
    this.editingPlaylistId.set(playlist.id);
  }

  editPlaylist(playlistId: string): void {
    if (this.playlistService.find(playlistId)?.isStatic) {
      return;
    }

    this.editingPlaylistId.set(playlistId);
  }

  closePlaylistEditor(): void {
    this.editingPlaylistId.set(null);
  }

  renamePlaylist(playlistId: string, event: Event): void {
    this.playlistService.update(playlistId, {
      name: (event.target as HTMLInputElement).value,
    });
  }

  isPuzzleInPlaylist(playlistId: string, route: string): boolean {
    return this.playlistService.find(playlistId)?.routes.includes(route) ?? false;
  }

  playlistProgress(playlist: PuzzlePlaylist): PlaylistProgressSnapshot | null {
    return this.playlistService.progressFor(playlist);
  }

  playlistLastCompletedText(playlist: PuzzlePlaylist): string {
    if (playlist.lastCompletedAt == null) {
      return 'Jamais terminée';
    }

    return `Terminée le ${new Intl.DateTimeFormat('fr-CA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(playlist.lastCompletedAt))}`;
  }

  areAllCategoryPuzzlesInPlaylist(playlistId: string, puzzles: PuzzleCard[]): boolean {
    const playlist = this.playlistService.find(playlistId);

    return (
      puzzles.length > 0 &&
      !!playlist &&
      puzzles.every((puzzle) => playlist.routes.includes(puzzle.route))
    );
  }

  togglePlaylistCategory(playlistId: string, puzzles: PuzzleCard[]): void {
    const playlist = this.playlistService.find(playlistId);

    if (!playlist || puzzles.length === 0) {
      return;
    }

    const categoryRoutes = puzzles.map((puzzle) => puzzle.route);
    const selectedRoutes = new Set(playlist.routes);
    const shouldSelectAll = categoryRoutes.some((route) => !selectedRoutes.has(route));
    const routes = shouldSelectAll
      ? [...playlist.routes, ...categoryRoutes.filter((route) => !selectedRoutes.has(route))]
      : playlist.routes.filter((route) => !categoryRoutes.includes(route));

    this.playlistService.update(playlistId, { routes });
  }

  togglePlaylistPuzzle(playlistId: string, route: string, event: Event): void {
    const playlist = this.playlistService.find(playlistId);

    if (!playlist) {
      return;
    }

    const checked = (event.target as HTMLInputElement).checked;
    const routes = checked
      ? [...playlist.routes, ...(playlist.routes.includes(route) ? [] : [route])]
      : playlist.routes.filter((candidate) => candidate !== route);

    this.playlistService.update(playlistId, { routes });
  }

  removePlaylistPuzzle(playlistId: string, route: string): void {
    const playlist = this.playlistService.find(playlistId);

    if (playlist) {
      this.playlistService.update(playlistId, {
        routes: playlist.routes.filter((candidate) => candidate !== route),
      });
    }
  }

  movePlaylistPuzzle(playlistId: string, index: number, offset: number): void {
    const playlist = this.playlistService.find(playlistId);
    const targetIndex = index + offset;

    if (!playlist || targetIndex < 0 || targetIndex >= playlist.routes.length) {
      return;
    }

    const routes = [...playlist.routes];
    [routes[index], routes[targetIndex]] = [routes[targetIndex], routes[index]];
    this.playlistService.update(playlistId, { routes });
  }

  requestDeletePlaylist(playlistId: string): void {
    const playlist = this.playlistService.find(playlistId);

    if (playlist && !playlist.isStatic) {
      this.pendingPlaylistDeletionId.set(playlistId);
    }
  }

  cancelDeletePlaylist(): void {
    this.pendingPlaylistDeletionId.set(null);
  }

  confirmDeletePlaylist(): void {
    const playlistId = this.pendingPlaylistDeletionId();

    if (!playlistId) {
      return;
    }

    this.playlistService.remove(playlistId);

    if (this.editingPlaylistId() === playlistId) {
      this.editingPlaylistId.set(null);
    }

    this.pendingPlaylistDeletionId.set(null);
  }

  @HostListener('document:keydown.escape')
  closePlaylistDeletionOnEscape(): void {
    if (this.pendingPlaylistDeletionId()) {
      this.cancelDeletePlaylist();
    }
  }

  playPlaylist(playlist: PuzzlePlaylist, randomOrder = false): void {
    const url = this.playlistService.startUrl(playlist, randomOrder);

    if (url) {
      void this.router.navigateByUrl(url);
    }
  }

  playlistPuzzleTitle(route: string): string {
    return this.playlistPuzzleOptions().find((puzzle) => puzzle.route === route)?.title ?? route;
  }

  playRandomOldestPuzzle(): void {
    const puzzles = PUZZLE_CATEGORIES
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
      return 'Jamais joué';
    }

    const elapsedMilliseconds = Date.now() - playedAt;
    const elapsedDays = Math.floor(elapsedMilliseconds / 86_400_000);

    if (elapsedDays <= 0) {
      return 'Joué aujourd’hui';
    }

    if (elapsedDays === 1) {
      return 'Joué hier';
    }

    if (elapsedDays < 7) {
      return `Joué il y a ${elapsedDays} jours`;
    }

    return `Dernière fois : ${new Intl.DateTimeFormat('fr-CA', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(playedAt))}`;
  }

  solvedStatusText(route: string): string {
    return this.playHistory.isSolved(route) ? 'Résolue' : 'Non résolue';
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
      const storedSortMode = this.storage.get(this.sortModeStorageKey);

      return storedSortMode === 'oldest' ? 'oldest' : 'default';
    } catch {
      return 'default';
    }
  }

  private writeSortMode(sortMode: HomeSortMode): void {
    try {
      this.storage.set(this.sortModeStorageKey, sortMode);
    } catch {
      // The selected order still applies for the current page when storage is unavailable.
    }
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr-CA')
      .trim();
  }
}
