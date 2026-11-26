import { TestBed } from '@angular/core/testing';
import {
  FINALE_1_PLAYLIST_ID,
  FINALE_1_PLAYLIST_ROUTES,
  FINALE_2_PLAYLIST_ID,
  FINALE_2_PLAYLIST_ROUTES,
  PuzzlePlaylist,
  PuzzlePlaylistService,
} from './puzzle-playlist.service';
import { AppStorageService } from './shared/storage/app-storage.service';

describe('PuzzlePlaylistService progress', () => {
  const progressStorageKey = 'epique-puzzle-playlist-progress';
  const finale1CompletionKey = 'epique-puzzle-playlist-completed-at-finale-1';
  const finale2CompletionKey = 'epique-puzzle-playlist-completed-at-finale-2';
  const previousFinale2Routes = [...FINALE_2_PLAYLIST_ROUTES.slice(0, -2), '/puzzle-a-cadenas'];
  const playlist: PuzzlePlaylist = {
    id: 'progress-test',
    name: 'Progression',
    routes: ['/first', '/second', '/third'],
  };

  beforeEach(async () => {
    localStorage.setItem('epique-puzzle-playlists', JSON.stringify([playlist]));
    localStorage.removeItem(progressStorageKey);

    await TestBed.configureTestingModule({
      providers: [PuzzlePlaylistService],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem('epique-puzzle-playlists');
    localStorage.removeItem(progressStorageKey);
    localStorage.removeItem(finale1CompletionKey);
    localStorage.removeItem(finale2CompletionKey);
    vi.restoreAllMocks();
  });

  it('saves the next puzzle and resumes it from the playlist entry point', () => {
    const service = TestBed.inject(PuzzlePlaylistService);

    const firstUrl = service.startUrl(playlist);
    const firstProgress = service.progressFromUrl(firstUrl!);

    expect(firstProgress?.index).toBe(0);
    expect(firstProgress?.previousRoute).toBeNull();
    expect(service.progressFor(playlist)).toEqual({
      index: 0,
      order: [0, 1, 2],
      routes: playlist.routes,
    });

    service.complete(firstProgress!);

    expect(service.progressFor(playlist)?.index).toBe(1);
    const secondUrl = service.startUrl(playlist)!;
    const secondProgress = service.progressFromUrl(secondUrl);

    expect(secondUrl).toContain('playlistIndex=1');
    expect(secondProgress?.previousRoute).toBe(
      '/first?from=playlist&playlist=progress-test&playlistIndex=0',
    );
  });

  it('always exposes both static Finale playlists without persisting them as user playlists', () => {
    const service = TestBed.inject(PuzzlePlaylistService);
    const finale1 = service.find(FINALE_1_PLAYLIST_ID);
    const finale2 = service.find(FINALE_2_PLAYLIST_ID);

    expect(finale1).toEqual(
      expect.objectContaining({
        id: FINALE_1_PLAYLIST_ID,
        name: 'Finale 1',
        isStatic: true,
        routes: [...FINALE_1_PLAYLIST_ROUTES],
      }),
    );
    expect(finale2).toEqual(
      expect.objectContaining({
        id: FINALE_2_PLAYLIST_ID,
        name: 'Finale 2',
        isStatic: true,
        routes: [...FINALE_2_PLAYLIST_ROUTES],
      }),
    );
    expect(finale1?.routes.at(-1)).toBe('/mots-sans-voyelles');
    expect(finale2?.routes.slice(-3)).toEqual(['/rush-hour', '/code-deduction', '/cadenas-mystere']);
    expect(finale2?.routes).not.toContain('/puzzle-a-cadenas');

    service.update(FINALE_1_PLAYLIST_ID, { routes: ['/changed'] });
    service.remove(FINALE_2_PLAYLIST_ID);

    expect(service.find(FINALE_1_PLAYLIST_ID)?.routes).toEqual([...FINALE_1_PLAYLIST_ROUTES]);
    expect(service.find(FINALE_2_PLAYLIST_ID)?.routes).toEqual([...FINALE_2_PLAYLIST_ROUTES]);

    service.create('Locale');

    const storedPlaylists = JSON.parse(
      localStorage.getItem('epique-puzzle-playlists') ?? '[]',
    ) as PuzzlePlaylist[];
    expect(storedPlaylists.some((playlist) => playlist.isStatic)).toBe(false);
  });

  it.each([
    [2, '/rush-hour'],
    [1, '/code-deduction'],
  ] as const)('continues the former Finale 2 with %i steps left at %s', (remaining, route) => {
    const index = previousFinale2Routes.length - remaining;
    localStorage.setItem(
      progressStorageKey,
      JSON.stringify({
        [FINALE_2_PLAYLIST_ID]: {
          index,
          order: previousFinale2Routes.map((_, i) => i),
          routes: previousFinale2Routes,
        },
      }),
    );

    const service = TestBed.inject(PuzzlePlaylistService);
    const finale = service.find(FINALE_2_PLAYLIST_ID)!;
    const resumed = service.startUrl(finale)!;
    expect(resumed.split('?')[0]).toBe(route);
    expect(service.progressFor(finale)?.index).toBe(index);
    expect(service.progressFromUrl(resumed)?.nextRoute?.split('?')[0]).toBe(
      finale.routes[index + 1],
    );
  });

  it('continues a shuffled Finale 2 after the removed game and appends the new games', () => {
    const removed = previousFinale2Routes.length - 1;
    const remaining = Array.from({ length: removed }, (_, i) => i).reverse();
    const order = [removed, ...remaining];
    const index = 2;
    const route = previousFinale2Routes[order[index]];
    localStorage.setItem(
      progressStorageKey,
      JSON.stringify({
        [FINALE_2_PLAYLIST_ID]: { index, order, routes: previousFinale2Routes },
      }),
    );

    const service = TestBed.inject(PuzzlePlaylistService);
    const finale = service.find(FINALE_2_PLAYLIST_ID)!;
    const resumed = service.startUrl(finale)!;
    expect(resumed.split('?')[0]).toBe(route);
    const progress = service.progressFromUrl(resumed);
    expect(progress?.index).toBe(index - 1);
    expect(progress?.order).toEqual([...remaining, removed, removed + 1]);
    expect(progress?.order.slice(-2).map((i) => finale.routes[i])).toEqual([
      '/code-deduction',
      '/cadenas-mystere',
    ]);

    const openBeforeUpdate = `${route}?from=playlist&playlist=${finale.id}&playlistIndex=${index}&playlistOrder=${order.join(',')}`;
    expect(service.progressFromUrl(openBeforeUpdate)).toEqual(progress);
    service.complete(progress!);
    expect(service.startUrl(finale)).toBe(progress?.nextRoute);
  });

  it.each([
    ['Finale 1', FINALE_1_PLAYLIST_ID, FINALE_1_PLAYLIST_ROUTES],
    ['Finale 2', FINALE_2_PLAYLIST_ID, FINALE_2_PLAYLIST_ROUTES],
  ] as const)('persists completion after resuming %s', (_name, playlistId, routes) => {
    const completedAt = Date.UTC(2026, 10, 16, 13);
    vi.spyOn(Date, 'now').mockReturnValue(completedAt);
    const order = routes.map((_, index) => index);
    const index = order.length - 2;
    const currentRoute = routes[order[index]];
    localStorage.setItem(
      progressStorageKey,
      JSON.stringify({ [playlistId]: { index, order, routes } }),
    );

    const service = TestBed.inject(PuzzlePlaylistService);
    const finale = service.find(playlistId)!;
    const resumedUrl = service.startUrl(finale)!;
    const resumedProgress = service.progressFromUrl(resumedUrl)!;

    expect(resumedUrl.split('?')[0]).toBe(currentRoute);
    expect(resumedProgress.order).toEqual(order);
    expect(resumedProgress.index).toBe(index);
    expect(resumedProgress.nextRoute?.split('?')[0]).toBe(routes.at(-1));

    service.complete(resumedProgress);
    expect(service.find(playlistId)?.lastCompletedAt).toBeNull();
    const finalUrl = service.startUrl(finale)!;
    expect(finalUrl).toBe(resumedProgress.nextRoute);
    const finalProgress = service.progressFromUrl(finalUrl)!;
    expect(finalProgress.nextRoute).toBeNull();
    service.complete(finalProgress);
    expect(service.progressFor(finale)).toBeNull();

    const reloadedService = TestBed.runInInjectionContext(() => new PuzzlePlaylistService());
    expect(reloadedService.find(playlistId)?.lastCompletedAt).toBe(completedAt);
  });

  it('refreshes each static completion date when account data is applied', () => {
    const service = TestBed.inject(PuzzlePlaylistService);
    const storage = TestBed.inject(AppStorageService);
    const firstCompletion = Date.UTC(2026, 10, 15);
    const secondCompletion = Date.UTC(2026, 10, 16);

    storage.replace({
      ...storage.snapshot(),
      [finale1CompletionKey]: String(firstCompletion),
      [finale2CompletionKey]: String(secondCompletion),
    });

    expect(service.find(FINALE_1_PLAYLIST_ID)?.lastCompletedAt).toBe(firstCompletion);
    expect(service.find(FINALE_2_PLAYLIST_ID)?.lastCompletedAt).toBe(secondCompletion);
  });

  it('keeps a random order while the playlist is in progress', () => {
    const service = TestBed.inject(PuzzlePlaylistService);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    service.startUrl(playlist, true);
    const savedProgress = service.progressFor(playlist);
    const resumedUrl = service.startUrl(playlist);

    expect(savedProgress?.order).not.toEqual([0, 1, 2]);
    expect(resumedUrl).toContain('playlistOrder=' + savedProgress?.order.join('%2C'));
  });

  it('clears progress when the last puzzle is completed', () => {
    const service = TestBed.inject(PuzzlePlaylistService);
    service.update(playlist.id, { routes: ['/only'] });
    const singlePuzzlePlaylist = service.find(playlist.id)!;
    const firstUrl = service.startUrl(singlePuzzlePlaylist);
    const progress = service.progressFromUrl(firstUrl!);

    service.complete(progress!);

    expect(service.progressFor(singlePuzzlePlaylist)).toBeNull();
    expect(JSON.parse(localStorage.getItem(progressStorageKey) ?? 'null')).toEqual({});
  });

  it('records when the playlist was last completed', () => {
    const completedAt = Date.UTC(2026, 9, 9, 12, 34);
    vi.spyOn(Date, 'now').mockReturnValue(completedAt);
    const service = TestBed.inject(PuzzlePlaylistService);
    service.update(playlist.id, { routes: ['/only'] });
    const singlePuzzlePlaylist = service.find(playlist.id)!;
    const progress = service.progressFromUrl(service.startUrl(singlePuzzlePlaylist)!);

    service.complete(progress!);

    expect(service.find(singlePuzzlePlaylist.id)?.lastCompletedAt).toBe(completedAt);
    expect(JSON.parse(localStorage.getItem('epique-puzzle-playlists') ?? 'null')).toEqual([
      expect.objectContaining({ id: singlePuzzlePlaylist.id, lastCompletedAt: completedAt }),
    ]);
  });

  it('loads a previously saved completion date', () => {
    const completedAt = Date.UTC(2026, 8, 30);
    localStorage.setItem(
      'epique-puzzle-playlists',
      JSON.stringify([{ ...playlist, lastCompletedAt: completedAt }]),
    );
    const service = TestBed.inject(PuzzlePlaylistService);

    expect(service.find(playlist.id)?.lastCompletedAt).toBe(completedAt);
  });

  it('invalidates progress when the playlist routes change', () => {
    const service = TestBed.inject(PuzzlePlaylistService);
    const storedPlaylist = service.create(playlist.name);
    service.update(storedPlaylist.id, { routes: playlist.routes });
    service.startUrl(service.find(storedPlaylist.id)!);

    service.update(storedPlaylist.id, { routes: ['/changed'] });

    expect(service.progressFor(service.find(storedPlaylist.id)!)).toBeNull();
  });
});
