import { TestBed } from '@angular/core/testing';
import { PuzzlePlaylist, PuzzlePlaylistService } from './puzzle-playlist.service';

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

  it('invalidates progress when the playlist routes change', () => {
    const service = TestBed.inject(PuzzlePlaylistService);
    const storedPlaylist = service.create(playlist.name);
    service.update(storedPlaylist.id, { routes: playlist.routes });
    service.startUrl(service.find(storedPlaylist.id)!);

    service.update(storedPlaylist.id, { routes: ['/changed'] });

    expect(service.progressFor(service.find(storedPlaylist.id)!)).toBeNull();
  });
});
