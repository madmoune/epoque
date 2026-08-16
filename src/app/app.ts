import { DOCUMENT } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationError, Router, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { PuzzlePlayHistoryService } from './puzzle-play-history.service';
import { FirebaseAuthService } from './shared/firebase/firebase-auth.service';
import { FirebaseUserDataSyncService } from './shared/firebase/firebase-user-data-sync.service';
import { AppStorageService } from './shared/storage/app-storage.service';

type Theme = 'dark' | 'light';
type ThemeTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};
//TODO: Puzzle où une phrase donne une défitition flou et chaque mot manque des segments aux lettres. Chaque segments manquants par mot forme une lettre.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly storage = inject(AppStorageService);
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  protected readonly firebaseAuth = inject(FirebaseAuthService);
  protected readonly userDataSync = inject(FirebaseUserDataSyncService);
  private recoveringFromChunkError = false;

  constructor() {
    inject(PuzzlePlayHistoryService);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationError) {
        this.handleChunkLoadFailure(event.error);
      }
    });
    this.watchForApplicationUpdates();
  }

  protected readonly theme = signal<Theme>(
    this.document.documentElement.dataset['theme'] === 'light' ? 'light' : 'dark',
  );

  @HostListener('document:pointerdown', ['$event'])
  protected closeQuickMenuOnOutsideClick(event: PointerEvent): void {
    if (!(event.target instanceof Element)) {
      return;
    }

    const quickMenu = this.document.querySelector<HTMLDetailsElement>('.quick-menu');

    if (!quickMenu?.open || quickMenu.contains(event.target)) {
      return;
    }

    quickMenu.open = false;
  }

  @HostListener('document:visibilitychange')
  protected checkForApplicationUpdate(): void {
    if (this.document.visibilityState === 'visible') {
      void this.checkForUpdate();
    }
  }

  @HostListener('window:unhandledrejection', ['$event'])
  protected handleUnhandledRejection(event: PromiseRejectionEvent): void {
    if (!this.isChunkLoadError(event.reason)) {
      return;
    }

    event.preventDefault();
    this.handleChunkLoadFailure(event.reason);
  }

  protected toggleTheme(): void {
    const nextTheme: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    const applyTheme = (): void => {
      this.theme.set(nextTheme);
      this.document.documentElement.dataset['theme'] = nextTheme;

      try {
        this.storage.set('epique-theme', nextTheme);
      } catch {
        // The selected theme still applies when browser storage is unavailable.
      }
    };
    const transitionDocument = this.document as ThemeTransitionDocument;

    if (transitionDocument.startViewTransition) {
      transitionDocument.startViewTransition(applyTheme);
    } else {
      this.document.documentElement.classList.add('theme-transition-fallback');
      applyTheme();
      globalThis.setTimeout(() => {
        this.document.documentElement.classList.remove('theme-transition-fallback');
      }, 320);
    }
  }

  protected signInWithGoogle(): void {
    void this.firebaseAuth.signInWithGoogle();
  }

  protected signOut(): void {
    void this.firebaseAuth.signOut();
  }

  private watchForApplicationUpdates(): void {
    if (!this.swUpdate?.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this.document.location.reload();
      }
    });

    void this.checkForUpdate();
  }

  private async checkForUpdate(): Promise<void> {
    if (!this.swUpdate?.isEnabled) {
      return;
    }

    try {
      await this.swUpdate.checkForUpdate();
    } catch {
      // A temporary offline state should not prevent the app from starting.
    }
  }

  private handleChunkLoadFailure(error: unknown): void {
    if (this.recoveringFromChunkError || !this.isChunkLoadError(error)) {
      return;
    }

    this.recoveringFromChunkError = true;
    void this.recoverFromChunkLoadError();
  }

  private isChunkLoadError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error ?? '');

    return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(
      message,
    );
  }

  private async recoverFromChunkLoadError(): Promise<void> {
    const currentWindow = this.document.defaultView;

    if (!currentWindow) {
      return;
    }

    const recoveryKey = 'epique-chunk-recovery-attempt';
    const now = Date.now();
    let previousAttempt = 0;

    try {
      previousAttempt = Number(currentWindow.sessionStorage.getItem(recoveryKey) ?? 0);
      currentWindow.sessionStorage.setItem(recoveryKey, String(now));
    } catch {
      // Storage can be unavailable in private browsing; recovery can still continue.
    }

    if (now - previousAttempt < 30_000) {
      return;
    }

    try {
      const appBaseHref = this.document.querySelector('base')?.getAttribute('href') ?? '/';
      const appScope = new URL(appBaseHref, currentWindow.location.origin).href;
      const registrations = await currentWindow.navigator.serviceWorker.getRegistrations();

      await Promise.all(
        registrations
          .filter((registration) => registration.scope.startsWith(appScope))
          .map((registration) => registration.unregister()),
      );

      const cacheNames = await currentWindow.caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('ngsw:'))
          .map((cacheName) => currentWindow.caches.delete(cacheName)),
      );
    } catch {
      // The cache may be unavailable; the cache-busting reload is still useful.
    }

    const recoveryUrl = new URL(currentWindow.location.href);
    recoveryUrl.searchParams.set('epique-recover', String(now));
    currentWindow.location.replace(recoveryUrl.toString());
  }
}
