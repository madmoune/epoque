import { Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

type PlayHistory = Record<string, number>;
type SolvedHistory = Record<string, boolean>;

@Injectable({
  providedIn: 'root',
})
export class PuzzlePlayHistoryService {
  private readonly storageKey = 'epique-puzzle-play-history';
  private readonly solvedStorageKey = 'epique-puzzle-solved-history';
  private readonly history = signal<PlayHistory>(this.readHistory());
  private readonly solvedHistory = signal<SolvedHistory>(this.readSolvedHistory());

  readonly playedAt = this.history.asReadonly();
  readonly solved = this.solvedHistory.asReadonly();

  constructor(router: Router) {
    router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const route = this.normalizeRoute(event.urlAfterRedirects);

        if (route) {
          this.markPlayed(route);
        }
      });
  }

  markPlayed(route: string): void {
    const normalizedRoute = this.normalizeRoute(route);

    if (!normalizedRoute) {
      return;
    }

    this.history.update((history) => {
      const nextHistory = {
        ...history,
        [normalizedRoute]: Date.now(),
      };

      this.writeHistory(nextHistory);
      return nextHistory;
    });
  }

  lastPlayedAt(route: string): number | null {
    return this.history()[route] ?? null;
  }

  markSolved(route: string): void {
    const normalizedRoute = this.normalizeRoute(route);

    if (!normalizedRoute) {
      return;
    }

    this.solvedHistory.update((history) => {
      const nextHistory = {
        ...history,
        [normalizedRoute]: true,
      };

      this.writeSolvedHistory(nextHistory);
      return nextHistory;
    });
  }

  isSolved(route: string): boolean {
    return this.solvedHistory()[route] === true;
  }

  private normalizeRoute(route: string): string | null {
    const cleanRoute = route.split('?')[0].split('#')[0];

    if (!cleanRoute || cleanRoute === '/') {
      return null;
    }

    return cleanRoute.startsWith('/') ? cleanRoute : `/${cleanRoute}`;
  }

  private readHistory(): PlayHistory {
    try {
      const storedHistory = globalThis.localStorage?.getItem(this.storageKey);

      return storedHistory ? (JSON.parse(storedHistory) as PlayHistory) : {};
    } catch {
      return {};
    }
  }

  private writeHistory(history: PlayHistory): void {
    try {
      globalThis.localStorage?.setItem(this.storageKey, JSON.stringify(history));
    } catch {
      // The home screen still works when browser storage is unavailable.
    }
  }

  private readSolvedHistory(): SolvedHistory {
    try {
      const storedHistory = globalThis.localStorage?.getItem(this.solvedStorageKey);

      return storedHistory ? (JSON.parse(storedHistory) as SolvedHistory) : {};
    } catch {
      return {};
    }
  }

  private writeSolvedHistory(history: SolvedHistory): void {
    try {
      globalThis.localStorage?.setItem(this.solvedStorageKey, JSON.stringify(history));
    } catch {
      // The home screen still works when browser storage is unavailable.
    }
  }
}
