import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../../puzzle-play-history.service';
import { PuzzlePlaylistService } from '../../../puzzle-playlist.service';
import { HIDDEN_PUZZLE_ROUTES, puzzleMenuFragment } from '../../puzzle-catalog';
import { NEW_GAME_ROUTES } from '../../new-games/new-games.catalog';

export type PuzzlePopupTone = 'success' | 'partial';

@Component({
  selector: 'app-puzzle-success-popup',
  imports: [RouterLink],
  templateUrl: './puzzle-success-popup.component.html',
  styleUrl: './puzzle-success-popup.component.scss',
})
export class PuzzleSuccessPopupComponent implements OnInit {
  private readonly randomPuzzleRoutes = [
    ...NEW_GAME_ROUTES,
    '/anagrams',
    '/cryptograms',
    '/word-search',
    '/word-ladder',
    '/wordle',
    '/pivot-word',
    '/hidden-phrase',
    '/phrases',
    '/ciphers/caesar',
    '/ciphers/pigpen',
    '/ciphers/a1z26',
    '/ciphers/morse',
    '/ciphers/braille',
    '/ciphers/atbash',
    '/ciphers/tap-code',
    '/ciphers/semaphore',
    '/ciphers/nato',
    '/ciphers/cree-syllabics',
    '/memory-grid',
    '/memory-pieces',
    '/symbol-pairs',
    '/mnemonic',
    '/sequences',
    '/crossmath',
    '/latin-square',
    '/magic-square',
    '/sum-pyramid',
    '/count-is-good',
    '/calcudoku',
    '/mental-arithmetic',
    '/quick-arithmetic',
    '/nim',
    '/knights-and-knaves',
    '/weight-deduction',
    '/hanging-weights',
    '/mastermind',
    '/code-deduction',
    '/cadenas-mystere',
    '/voisins-numerotes',
    '/calcul-en-chaine',
    '/triangle-magique',
    '/polygones-etoiles',
    '/voie-ferree',
    '/grille-proprietes',
    '/mots-sans-voyelles',
    '/batonnets-de-calcul',
    '/grille-operations',
    '/ponts-et-iles',
    '/calcul-code',
    '/mosaique-logique',
    '/zebra',
    '/jigsaw-grid',
    '/jigsaw-blocks',
    '/corner-cube',
    '/sliding-puzzle',
    '/knights-tour',
    '/laser',
    '/shape-layers',
    '/tangram',
    '/rush-hour',
    '/towers-of-hanoi',
    '/tiges',
    '/color-rods',
    '/dice',
    '/tic-tac-toe',
    '/timing-drop',
    '/play/count-by-symbol',
    '/play/geometric-shapes',
    '/play/seven-segment',
    '/play/faux-words',
    '/play/segment-phrase',
    '/play/color-chain',
    '/play/syllabic-rotation',
  ].filter((route) => !HIDDEN_PUZZLE_ROUTES.has(route));

  private readonly router = inject(Router);
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly playlistService = inject(PuzzlePlaylistService);
  protected readonly dismissed = signal(false);

  @Input({ required: true }) title = '';
  @Input() message = '';
  @Input() answer = '';
  @Input() actionLabel = 'Nouvelle partie';
  @Input() showAction = true;
  @Input() showMenuLink = true;
  @Input() tone: PuzzlePopupTone = 'success';

  @Output() readonly action = new EventEmitter<void>();

  @ViewChild('primaryActionButton') private primaryActionButton?: ElementRef<HTMLButtonElement>;

  ngOnInit(): void {
    if (this.tone !== 'success' || !this.cameFromPlaylist) {
      return;
    }

    const progress = this.playlistService.progressFromUrl(this.router.url);

    if (progress) {
      // Save the next item as soon as the current puzzle is solved, even if the
      // player closes the popup instead of clicking « Jeu suivant ».
      this.playlistService.complete(progress);
    }
  }

  protected get menuFragment(): string {
    return puzzleMenuFragment(this.router.url);
  }

  protected get cameFromRandom(): boolean {
    return (
      new URLSearchParams(this.router.url.split('?')[1]?.split('#')[0] ?? '').get('from') ===
      'random'
    );
  }

  protected get cameFromPlaylist(): boolean {
    return (
      new URLSearchParams(this.router.url.split('?')[1]?.split('#')[0] ?? '').get('from') ===
      'playlist'
    );
  }

  protected get primaryActionLabel(): string {
    if (!this.cameFromPlaylist) {
      return this.actionLabel;
    }

    return this.playlistService.progressFromUrl(this.router.url)?.nextRoute
      ? 'Jeu suivant'
      : 'Terminer la playlist';
  }

  protected handlePrimaryAction(): void {
    if (!this.cameFromPlaylist) {
      this.action.emit();
      return;
    }

    const progress = this.playlistService.progressFromUrl(this.router.url);

    if (progress?.nextRoute) {
      this.playlistService.complete(progress);
      void this.router.navigateByUrl(progress.nextRoute);
      return;
    }

    if (progress) {
      this.playlistService.complete(progress);
    }

    void this.router.navigate(['/'], { fragment: 'playlists' });
  }

  protected playAnotherRandomOldestPuzzle(): void {
    const currentRoute = this.router.url.split(/[?#]/)[0];
    const candidateRoutes = this.randomPuzzleRoutes.filter((route) => route !== currentRoute);

    if (candidateRoutes.length === 0) {
      return;
    }

    const oldestPlayedAt = Math.min(
      ...candidateRoutes.map((route) => this.playHistory.lastPlayedAt(route) ?? 0),
    );
    const oldestRoutes = candidateRoutes.filter(
      (route) => (this.playHistory.lastPlayedAt(route) ?? 0) === oldestPlayedAt,
    );
    const randomRoute = oldestRoutes[Math.floor(Math.random() * oldestRoutes.length)];

    void this.router.navigateByUrl(`${randomRoute}?from=random`);
  }

  protected dismissFromBackground(event: Event): void {
    const target = event.target;

    if (target instanceof Element && target.closest('button, a')) {
      return;
    }

    this.dismissed.set(true);
  }

  @HostListener('document:keydown.enter', ['$event'])
  protected handleEnter(event: Event): void {
    if (!this.showAction || (event as KeyboardEvent).repeat) {
      return;
    }

    event.preventDefault();
    this.primaryActionButton?.nativeElement.click();
  }
}
