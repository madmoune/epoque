import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PuzzlePlaylistService } from '../../puzzle-playlist.service';
import { FirebasePuzzleCatalogService } from '../../shared/firebase/firebase-puzzle-catalog.service';
import { HomePage } from './home.page';
import { NEW_GAME_ROUTES } from '../../puzzles/new-games/new-games.catalog';
import { routes } from '../../app.routes';

describe('HomePage playlist category controls', () => {
  beforeEach(async () => {
    localStorage.removeItem('epique-puzzle-playlists');

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: FirebasePuzzleCatalogService,
          useValue: {
            loadStatuses: vi.fn().mockResolvedValue({
              typeNames: {},
              typeStates: {},
            }),
          },
        },
      ],
    }).compileComponents();
  });

  it('selects and clears only the games from the chosen category', () => {
    const fixture = TestBed.createComponent(HomePage);
    const page = fixture.componentInstance;
    const playlistService = TestBed.inject(PuzzlePlaylistService);
    const playlist = playlistService.create('Test');
    const wordsCategory = page.categories()[0];
    const unrelatedRoute = page.categories()[1].puzzles[0].route;

    playlistService.update(playlist.id, { routes: [unrelatedRoute] });
    page.togglePlaylistCategory(playlist.id, wordsCategory.puzzles);

    expect(playlistService.find(playlist.id)?.routes).toEqual([
      unrelatedRoute,
      ...wordsCategory.puzzles.map((puzzle) => puzzle.route),
    ]);
    expect(page.areAllCategoryPuzzlesInPlaylist(playlist.id, wordsCategory.puzzles)).toBe(true);

    page.togglePlaylistCategory(playlist.id, wordsCategory.puzzles);

    expect(playlistService.find(playlist.id)?.routes).toEqual([unrelatedRoute]);
    expect(page.areAllCategoryPuzzlesInPlaylist(playlist.id, wordsCategory.puzzles)).toBe(false);
  });

  it('requires confirmation before deleting a playlist', () => {
    const fixture = TestBed.createComponent(HomePage);
    const page = fixture.componentInstance;
    const playlistService = TestBed.inject(PuzzlePlaylistService);
    const playlist = playlistService.create('À supprimer');

    page.requestDeletePlaylist(playlist.id);

    expect(page.pendingPlaylistDeletion()?.id).toBe(playlist.id);
    expect(playlistService.find(playlist.id)).toBeDefined();

    page.cancelDeletePlaylist();

    expect(page.pendingPlaylistDeletion()).toBeNull();
    expect(playlistService.find(playlist.id)).toBeDefined();

    page.requestDeletePlaylist(playlist.id);
    page.confirmDeletePlaylist();

    expect(playlistService.find(playlist.id)).toBeUndefined();
  });

  it('filters the home game cards by name without hiding playlist options', () => {
    const fixture = TestBed.createComponent(HomePage);
    const page = fixture.componentInstance;

    page.searchQuery.set('carre magique');

    expect(
      page
        .visibleCategories()
        .flatMap((category) => category.puzzles.map((puzzle) => puzzle.title)),
    ).toEqual(['Carré magique']);
    expect(page.playlistPuzzleOptions().some((puzzle) => puzzle.title === 'Tangram')).toBe(true);

    page.clearSearch();

    expect(page.visibleCategories().length).toBe(page.categories().length);
  });

  it('lists exactly the six implemented games in the new section, playlists and routes', () => {
    const page = TestBed.createComponent(HomePage).componentInstance;
    const category = page.categories().find((category) => category.id === 'nouveaux-jeux');

    expect(category?.title).toBe('Nouveaux jeux');
    expect(category?.puzzles.map((puzzle) => puzzle.route)).toEqual(NEW_GAME_ROUTES);
    expect(category?.puzzles).toHaveLength(6);
    for (const route of NEW_GAME_ROUTES) {
      expect(page.playlistPuzzleOptions().some((puzzle) => puzzle.route === route)).toBe(true);
      expect(routes.find((candidate) => candidate.path === route.slice(1))?.data?.['game']).toBe(
        route.slice(1),
      );
    }
    expect(category?.puzzles.some((puzzle) => /rébus|groupe de 4/i.test(puzzle.title))).toBe(false);
  });
});
