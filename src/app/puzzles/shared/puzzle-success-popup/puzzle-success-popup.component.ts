import { Component, EventEmitter, HostListener, inject, Input, Output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../../puzzle-play-history.service';

export type PuzzlePopupTone = 'success' | 'partial';

@Component({
  selector: 'app-puzzle-success-popup',
  imports: [RouterLink],
  templateUrl: './puzzle-success-popup.component.html',
  styleUrl: './puzzle-success-popup.component.scss',
})
export class PuzzleSuccessPopupComponent {
  private readonly randomPuzzleRoutes = [
    '/anagrams',
    '/cryptograms',
    '/word-search',
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
    '/memory-grid',
    '/mnemonic',
    '/sequences',
    '/crossmath',
    '/latin-square',
    '/magic-square',
    '/sum-pyramid',
    '/count-is-good',
    '/calcudoku',
    '/mental-arithmetic',
    '/nim',
    '/knights-and-knaves',
    '/mastermind',
    '/zebra',
    '/jigsaw-grid',
    '/jigsaw-blocks',
    '/corner-cube',
    '/sliding-puzzle',
    '/laser',
    '/shape-layers',
    '/tangram',
    '/rush-hour',
    '/dice',
    '/tic-tac-toe',
    '/timing-drop',
  ];

  private readonly sectionFragmentsByRoute: Record<string, string> = {
    anagrams: 'mots-langage',
    cryptograms: 'mots-langage',
    'word-search': 'mots-langage',
    'hidden-phrase': 'mots-langage',
    phrases: 'mots-langage',
    'ciphers/caesar': 'ciphers',
    'ciphers/pigpen': 'ciphers',
    'ciphers/a1z26': 'ciphers',
    'ciphers/morse': 'ciphers',
    'ciphers/braille': 'ciphers',
    'ciphers/atbash': 'ciphers',
    'ciphers/tap-code': 'ciphers',
    'ciphers/semaphore': 'ciphers',
    'ciphers/nato': 'ciphers',
    'memory-grid': 'memoire',
    mnemonic: 'memoire',
    sequences: 'nombres-calcul',
    crossmath: 'nombres-calcul',
    'latin-square': 'nombres-calcul',
    'magic-square': 'nombres-calcul',
    'sum-pyramid': 'nombres-calcul',
    'count-is-good': 'nombres-calcul',
    calcudoku: 'nombres-calcul',
    'mental-arithmetic': 'nombres-calcul',
    nim: 'nombres-calcul',
    'knights-and-knaves': 'deduction-logique',
    mastermind: 'deduction-logique',
    zebra: 'deduction-logique',
    'jigsaw-grid': 'spatial-placement',
    'jigsaw-blocks': 'spatial-placement',
    'corner-cube': 'spatial-placement',
    'sliding-puzzle': 'spatial-placement',
    laser: 'spatial-placement',
    'shape-layers': 'spatial-placement',
    tangram: 'spatial-placement',
    'rush-hour': 'spatial-placement',
    dice: 'spatial-placement',
    'tic-tac-toe': 'strategie-timing',
    'timing-drop': 'strategie-timing',
    'describe-symbols': 'multijoueurs',
    'puzzlehunt/navigation': 'enigmes',
  };

  private readonly router = inject(Router);
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  protected readonly dismissed = signal(false);

  @Input({ required: true }) title = '';
  @Input() message = '';
  @Input() answer = '';
  @Input() actionLabel = 'Nouvelle partie';
  @Input() showAction = true;
  @Input() tone: PuzzlePopupTone = 'success';

  @Output() readonly action = new EventEmitter<void>();

  protected get menuFragment(): string {
    const route = this.router.url.split(/[?#]/)[0].replace(/^\/+/, '');

    return this.sectionFragmentsByRoute[route] ?? route;
  }

  protected get cameFromRandom(): boolean {
    return new URLSearchParams(this.router.url.split('?')[1]?.split('#')[0] ?? '').get('from') === 'random';
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
    this.action.emit();
  }
}
