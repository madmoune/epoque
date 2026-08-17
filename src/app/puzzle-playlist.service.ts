import { Injectable, inject, signal } from '@angular/core';
import { AppStorageService } from './shared/storage/app-storage.service';

export type PuzzlePlaylist = {
  id: string;
  name: string;
  routes: string[];
};

export type PlaylistProgressSnapshot = {
  index: number;
  order: number[];
  routes: string[];
};

export type PlaylistProgress = {
  playlist: PuzzlePlaylist;
  index: number;
  order: number[];
  nextRoute: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class PuzzlePlaylistService {
  private readonly storageKey = 'epique-puzzle-playlists';
  private readonly progressStorageKey = 'epique-puzzle-playlist-progress';
  private readonly storage = inject(AppStorageService);
  readonly playlists = signal<PuzzlePlaylist[]>(this.readPlaylists());
  readonly progress = signal<Record<string, PlaylistProgressSnapshot>>(this.readProgress());

  constructor() {
    this.storage.changes$.subscribe((change) => {
      if (change.source !== 'remote') {
        return;
      }

      if (change.key === this.storageKey) {
        this.playlists.set(this.readPlaylists());
      }

      if (change.key === this.progressStorageKey) {
        this.progress.set(this.readProgress());
      }
    });
  }

  create(name: string): PuzzlePlaylist {
    const playlist: PuzzlePlaylist = {
      id: this.createId(),
      name: name.trim() || 'Nouvelle playlist',
      routes: [],
    };

    this.setPlaylists([...this.playlists(), playlist]);
    return playlist;
  }

  update(id: string, changes: Partial<Pick<PuzzlePlaylist, 'name' | 'routes'>>): void {
    const currentPlaylist = this.find(id);
    this.setPlaylists(
      this.playlists().map((playlist) =>
        playlist.id === id
          ? {
              ...playlist,
              ...(changes.name === undefined ? {} : { name: changes.name.trim() || playlist.name }),
              ...(changes.routes === undefined ? {} : { routes: [...changes.routes] }),
            }
          : playlist,
      ),
    );

    if (
      currentPlaylist &&
      changes.routes !== undefined &&
      !this.arraysEqual(currentPlaylist.routes, changes.routes)
    ) {
      this.clearProgress(id);
    }
  }

  remove(id: string): void {
    this.setPlaylists(this.playlists().filter((playlist) => playlist.id !== id));
    this.clearProgress(id);
  }

  find(id: string): PuzzlePlaylist | undefined {
    return this.playlists().find((playlist) => playlist.id === id);
  }

  startUrl(playlist: PuzzlePlaylist, randomOrder = false): string | null {
    if (playlist.routes.length === 0) {
      return null;
    }

    const savedProgress = randomOrder ? null : this.progressFor(playlist);

    if (savedProgress) {
      return this.playUrl(playlist, savedProgress.index, savedProgress.order);
    }

    const order = randomOrder
      ? this.createRandomOrder(playlist.routes.length)
      : this.createOrderedOrder(playlist.routes.length);

    this.saveProgress(playlist, 0, order);

    return this.playUrl(playlist, 0, order);
  }

  progressFor(playlist: PuzzlePlaylist): PlaylistProgressSnapshot | null {
    const savedProgress = this.progress()[playlist.id];

    if (!savedProgress || !this.isProgressForPlaylist(savedProgress, playlist)) {
      return null;
    }

    return {
      index: savedProgress.index,
      order: [...savedProgress.order],
      routes: [...savedProgress.routes],
    };
  }

  progressFromUrl(url: string): PlaylistProgress | null {
    const [pathAndQuery] = url.split('#');
    const [currentRoute, queryString] = pathAndQuery.split('?');
    const params = new URLSearchParams(queryString ?? '');

    if (params.get('from') !== 'playlist') {
      return null;
    }

    const playlist = this.find(params.get('playlist') ?? '');
    const index = Number(params.get('playlistIndex'));
    const order = this.orderFromParam(params.get('playlistOrder'), playlist?.routes.length ?? 0);

    if (
      !playlist ||
      !order ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= order.length ||
      playlist.routes[order[index]] !== currentRoute
    ) {
      return null;
    }

    return {
      playlist,
      index,
      order,
      nextRoute: index + 1 < order.length ? this.playUrl(playlist, index + 1, order) : null,
    };
  }

  complete(progress: PlaylistProgress): void {
    if (progress.nextRoute) {
      this.saveProgress(progress.playlist, progress.index + 1, progress.order);
      return;
    }

    this.clearProgress(progress.playlist.id);
  }

  private playUrl(playlist: PuzzlePlaylist, index: number, order: number[]): string {
    const routeIndex = order[index];
    const route = playlist.routes[routeIndex];
    const params = new URLSearchParams({
      from: 'playlist',
      playlist: playlist.id,
      playlistIndex: String(index),
    });

    if (!this.isOrderedOrder(order)) {
      params.set('playlistOrder', order.join(','));
    }

    return `${route}?${params.toString()}`;
  }

  private createOrderedOrder(length: number): number[] {
    return Array.from({ length }, (_, index) => index);
  }

  private createRandomOrder(length: number): number[] {
    const order = this.createOrderedOrder(length);

    for (let index = order.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }

    if (order.length > 1 && this.isOrderedOrder(order)) {
      [order[0], order[1]] = [order[1], order[0]];
    }

    return order;
  }

  private orderFromParam(value: string | null, length: number): number[] | null {
    const ordered = this.createOrderedOrder(length);

    if (value === null) {
      return ordered;
    }

    const order = value.split(',').map((item) => Number(item));
    const isValid =
      order.length === length &&
      order.every(
        (routeIndex, index) =>
          Number.isInteger(routeIndex) &&
          routeIndex >= 0 &&
          routeIndex < length &&
          order.indexOf(routeIndex) === index,
      );

    return isValid ? order : null;
  }

  private isOrderedOrder(order: number[]): boolean {
    return order.every((routeIndex, index) => routeIndex === index);
  }

  private setPlaylists(playlists: PuzzlePlaylist[]): void {
    this.playlists.set(playlists);
    this.writePlaylists(playlists);
  }

  private saveProgress(playlist: PuzzlePlaylist, index: number, order: number[]): void {
    if (!this.isValidOrder(order, playlist.routes.length) || index < 0 || index >= order.length) {
      return;
    }

    const existingProgress = this.progressFor(playlist);

    if (
      existingProgress &&
      existingProgress.index >= index &&
      this.arraysEqual(existingProgress.order, order)
    ) {
      return;
    }

    const nextProgress = {
      ...this.progress(),
      [playlist.id]: {
        index,
        order: [...order],
        routes: [...playlist.routes],
      },
    };

    this.setProgress(nextProgress);
  }

  private clearProgress(playlistId: string): void {
    const nextProgress = { ...this.progress() };
    delete nextProgress[playlistId];
    this.setProgress(nextProgress);
  }

  private setProgress(progress: Record<string, PlaylistProgressSnapshot>): void {
    this.progress.set(progress);

    try {
      // Keep an empty object in storage so a completion also clears the progress on other devices.
      this.storage.set(this.progressStorageKey, JSON.stringify(progress));
    } catch {
      // Le progrès reste disponible pendant la session si le stockage est indisponible.
    }
  }

  private readPlaylists(): PuzzlePlaylist[] {
    try {
      const stored = this.storage.get(this.storageKey);
      const parsed: unknown = stored ? JSON.parse(stored) : [];

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(this.isPlaylist).map((playlist) => ({
        id: playlist.id,
        name: playlist.name.trim() || 'Playlist',
        routes: [...new Set(playlist.routes.filter((route) => route.startsWith('/')))],
      }));
    } catch {
      return [];
    }
  }

  private readProgress(): Record<string, PlaylistProgressSnapshot> {
    try {
      const stored = this.storage.get(this.progressStorageKey);
      const parsed: unknown = stored ? JSON.parse(stored) : {};

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
      }

      return Object.fromEntries(
        Object.entries(parsed).filter(([, progress]) => this.isProgressSnapshot(progress)),
      ) as Record<string, PlaylistProgressSnapshot>;
    } catch {
      return {};
    }
  }

  private writePlaylists(playlists: PuzzlePlaylist[]): void {
    try {
      this.storage.set(this.storageKey, JSON.stringify(playlists));
    } catch {
      // Les playlists restent disponibles pendant la session si le stockage est indisponible.
    }
  }

  private isPlaylist(value: unknown): value is PuzzlePlaylist {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<PuzzlePlaylist>;

    return (
      typeof candidate.id === 'string' &&
      typeof candidate.name === 'string' &&
      Array.isArray(candidate.routes) &&
      candidate.routes.every((route) => typeof route === 'string')
    );
  }

  private isProgressSnapshot(value: unknown): value is PlaylistProgressSnapshot {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<PlaylistProgressSnapshot>;

    return (
      typeof candidate.index === 'number' &&
      Number.isInteger(candidate.index) &&
      candidate.index >= 0 &&
      Array.isArray(candidate.order) &&
      Array.isArray(candidate.routes) &&
      candidate.order.length === candidate.routes.length &&
      candidate.routes.every((route) => typeof route === 'string') &&
      this.isValidOrder(candidate.order, candidate.routes.length)
    );
  }

  private isProgressForPlaylist(
    progress: PlaylistProgressSnapshot,
    playlist: PuzzlePlaylist,
  ): boolean {
    return (
      this.arraysEqual(progress.routes, playlist.routes) &&
      progress.index < progress.order.length &&
      this.isValidOrder(progress.order, playlist.routes.length)
    );
  }

  private isValidOrder(order: readonly number[], length: number): boolean {
    return (
      order.length === length &&
      order.every(
        (routeIndex, index) =>
          Number.isInteger(routeIndex) &&
          routeIndex >= 0 &&
          routeIndex < length &&
          order.indexOf(routeIndex) === index,
      )
    );
  }

  private arraysEqual<T>(first: readonly T[], second: readonly T[]): boolean {
    return first.length === second.length && first.every((value, index) => value === second[index]);
  }

  private createId(): string {
    return `playlist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
