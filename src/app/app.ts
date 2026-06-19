import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

type Theme = 'dark' | 'light';
type ThemeTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly document = inject(DOCUMENT);

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
