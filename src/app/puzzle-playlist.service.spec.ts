import { TestBed } from '@angular/core/testing';
import {
  FINALE_PLAYLIST_ID,
  FINALE_PLAYLIST_ROUTES,
  PuzzlePlaylist,
  PuzzlePlaylistService,
} from './puzzle-playlist.service';

describe('PuzzlePlaylistService progress', () => {
  const progressStorageKey = 'epique-puzzle-playlist-progress';
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

  it('always exposes the static Finale playlist without persisting it as a user playlist', () => {
    const service = TestBed.inject(PuzzlePlaylistService);
    const finale = service.find(FINALE_PLAYLIST_ID);

    expect(finale).toEqual(
      expect.objectContaining({
        id: FINALE_PLAYLIST_ID,
        name: 'Finale',
        isStatic: true,
        routes: [...FINALE_PLAYLIST_ROUTES],
      }),
    );
    expect(finale?.routes.at(-1)).toBe('/quick-arithmetic');

    service.update(FINALE_PLAYLIST_ID, { routes: ['/changed'] });
    service.remove(FINALE_PLAYLIST_ID);

    expect(service.find(FINALE_PLAYLIST_ID)?.routes).toEqual([...FINALE_PLAYLIST_ROUTES]);

    service.create('Locale');

    expect(
      (
        JSON.parse(localStorage.getItem('epique-puzzle-playlists') ?? '[]') as PuzzlePlaylist[]
      ).some((storedPlaylist) => storedPlaylist.id === FINALE_PLAYLIST_ID),
    ).toBe(false);
  });

  it.each(['ordered', 'shuffled'])('resumes an older %s Finale run', (mode) => {
    const routes = FINALE_PLAYLIST_ROUTES.slice(0, -1);
    const order = routes.map((_, index) => index);
    if (mode === 'shuffled') {
      order.reverse();
    }
    const index = order.length - 1;
    const currentRoute = routes[order[index]];
    const legacyParams = new URLSearchParams({
      from: 'playlist',
      playlist: FINALE_PLAYLIST_ID,
      playlistIndex: String(index),
    });
    if (mode === 'shuffled') {
      legacyParams.set('playlistOrder', order.join(','));
    }
    localStorage.setItem(
      progressStorageKey,
      JSON.stringify({ [FINALE_PLAYLIST_ID]: { index, order, routes } }),
    );

    const service = TestBed.inject(PuzzlePlaylistService);
    const finale = service.find(FINALE_PLAYLIST_ID)!;
    const resumedUrl = service.startUrl(finale)!;
    const resumedProgress = service.progressFromUrl(resumedUrl)!;
    const legacyProgress = service.progressFromUrl(`${currentRoute}?${legacyParams}`)!;

    expect(resumedUrl.split('?')[0]).toBe(currentRoute);
    expect(resumedProgress.order).toEqual([...order, order.length]);
    expect(resumedProgress.index).toBe(index);
    expect(legacyProgress).toEqual(resumedProgress);
    expect(resumedProgress.nextRoute?.split('?')[0]).toBe('/quick-arithmetic');

    service.complete(legacyProgress);
    const finalUrl = service.startUrl(finale)!;
    expect(finalUrl).toBe(resumedProgress.nextRoute);
    const finalProgress = service.progressFromUrl(finalUrl)!;
    expect(finalProgress.nextRoute).toBeNull();
    service.complete(finalProgress);
    expect(service.progressFor(finale)).toBeNull();
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
