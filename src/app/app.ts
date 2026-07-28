import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PuzzlePlayHistoryService } from './puzzle-play-history.service';

type Theme = 'dark' | 'light';
type ThemeTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};
//TODO: Puzzle où une phrase donne une défitition flou et chaque mot manque des segments aux lettres. Chaque segments manquants par mot forme une lettre.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly document = inject(DOCUMENT);

  constructor() {
    inject(PuzzlePlayHistoryService);
  }

  protected readonly theme = signal<Theme>(
    this.document.documentElement.dataset['theme'] === 'light' ? 'light' : 'dark',
  );

  protected toggleTheme(): void {
    const nextTheme: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    const applyTheme = (): void => {
      this.theme.set(nextTheme);
      this.document.documentElement.dataset['theme'] = nextTheme;

      try {
        globalThis.localStorage?.setItem('epique-theme', nextTheme);
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
}
