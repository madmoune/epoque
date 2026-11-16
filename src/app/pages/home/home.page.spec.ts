import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import {
  FINALE_1_PLAYLIST_ID,
  FINALE_2_PLAYLIST_ID,
  PuzzlePlaylistService,
} from '../../puzzle-playlist.service';
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

  it('shows both Finale playlists for everyone without edit or delete actions', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const finaleCards = [...fixture.nativeElement.querySelectorAll('.playlist-card')].filter(
      (card: HTMLElement) =>
        /^Finale [12]$/.test(card.querySelector('h3')?.textContent?.trim() ?? ''),
    );

    expect(finaleCards).toHaveLength(2);
    for (const finaleCard of finaleCards) {
      expect(finaleCard.textContent).toContain('Disponible pour tout le monde');
      expect(finaleCard.querySelector('.playlist-card-actions')?.textContent).toContain('Jouer');
      expect(finaleCard.querySelector('.playlist-card-actions')?.textContent).not.toContain(
        'Modifier',
      );
      expect(finaleCard.querySelector('.playlist-card-actions')?.textContent).not.toContain(
        'Supprimer',
      );
    }

    const page = fixture.componentInstance;
    page.editPlaylist(FINALE_1_PLAYLIST_ID);
    page.requestDeletePlaylist(FINALE_1_PLAYLIST_ID);

    expect(page.editingPlaylist()).toBeNull();
    expect(page.pendingPlaylistDeletion()).toBeNull();

    page.editPlaylist(FINALE_2_PLAYLIST_ID);
    page.requestDeletePlaylist(FINALE_2_PLAYLIST_ID);

    expect(page.editingPlaylist()).toBeNull();
    expect(page.pendingPlaylistDeletion()).toBeNull();
  });

  it('filters the home game cards and their category links without hiding playlist options', () => {
    const fixture = TestBed.createComponent(HomePage);
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;

    page.searchQuery.set('carre magique');
    fixture.detectChanges();

    expect(
      page
        .visibleCategories()
        .flatMap((category) => category.puzzles.map((puzzle) => puzzle.title)),
    ).toEqual(['Carré magique']);
    expect(page.playlistPuzzleOptions().some((puzzle) => puzzle.title === 'Tangram')).toBe(true);
    const links = root.querySelectorAll<HTMLAnchorElement>('.category-nav-link');
    expect(Array.from(links, (link) => link.getAttribute('href'))).toEqual(['#grilles-numeriques']);
    expect(root.querySelector('.category-card')?.id).toBe('grilles-numeriques');

    page.clearSearch();

    expect(page.visibleCategories().length).toBe(page.categories().length);
  });

  it('classifies the six games in their themed categories and keeps them in playlists', () => {
    const page = TestBed.createComponent(HomePage).componentInstance;
    const expectedCategory: Record<string, string> = {
      '/cryptarithms': 'nombres-calcul',
      '/skyscrapers': 'grilles-numeriques',
      '/kakuro': 'grilles-numeriques',
      '/sumplete': 'grilles-numeriques',
      '/word-fit': 'mots-langage',
      '/drop-quote': 'mots-langage',
    };

    const playlistOptions = page.playlistPuzzleOptions();
    expect(new Set(playlistOptions.map((puzzle) => puzzle.route)).size).toBe(
      playlistOptions.length,
    );
    for (const route of NEW_GAME_ROUTES) {
      const category = page.categories().find((group) => group.puzzles.some((p) => p.route === route));
      expect(category?.id).toBe(expectedCategory[route]);
      expect(playlistOptions.some((puzzle) => puzzle.route === route)).toBe(true);
      expect(routes.find((candidate) => candidate.path === route.slice(1))?.data?.['game']).toBe(
        route.slice(1),
      );
    }
    expect(playlistOptions.some((puzzle) => /rébus|groupe de 4/i.test(puzzle.title))).toBe(false);
  });

  it('hides Mnémotechnique from discovery and keeps its saved playlist entry playable', () => {
    const page = TestBed.createComponent(HomePage).componentInstance;
    const playlists = TestBed.inject(PuzzlePlaylistService);
    const playlist = playlists.create('Parcours existant');
    playlists.update(playlist.id, { routes: ['/mnemonic'] });

    page.searchQuery.set('mnemotechnique');
    expect(page.visibleCategories()).toEqual([]);
    expect(page.playlistPuzzleOptions().some((puzzle) => puzzle.route === '/mnemonic')).toBe(false);
    expect(playlists.find(playlist.id)?.routes).toEqual(['/mnemonic']);
    expect(page.playlistPuzzleTitle('/mnemonic')).toBe('Mnémotechnique');

    vi.spyOn(TestBed.inject(PuzzlePlayHistoryService), 'lastPlayedAt').mockImplementation(
      (route) => (route === '/mnemonic' ? 0 : route === '/memory-grid' ? 1 : 2),
    );
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    page.playRandomOldestPuzzle();

    expect(navigate).toHaveBeenCalledWith('/memory-grid?from=random');
    expect(routes.find((route) => route.path === 'mnemonic')?.loadComponent).toBeDefined();
  });

  it('propose le Nim à retrait limité dans Duels, les playlists et les routes', () => {
    const page = TestBed.createComponent(HomePage).componentInstance;
    const category = page.categories().find((category) => category.id === 'duels-epique');

    expect(category?.puzzles).toContainEqual(
      expect.objectContaining({
        title: 'Nim — retrait limité',
        route: '/nim-limite',
      }),
    );
    expect(page.playlistPuzzleOptions().some((puzzle) => puzzle.route === '/nim-limite')).toBe(
      true,
    );
    expect(routes.find((route) => route.path === 'nim-limite')?.data?.['game']).toBe('nim-limite');
  });
});
