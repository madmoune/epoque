import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  createStarPuzzle,
  isRegularOutline,
  nextStarInOutline,
  STAR_CHALLENGES,
} from './star-polygons.logic';

interface CompletedOutline {
  index: number;
  path: readonly number[];
}

@Component({
  selector: 'app-star-polygons-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './star-polygons.page.html',
  styleUrl: './star-polygons.page.scss',
})
export class StarPolygonsPage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);

  protected readonly challenges = STAR_CHALLENGES;
  protected readonly challenge = signal(this.challenges[0]);
  protected readonly board = signal(createStarPuzzle(this.challenge()));
  protected readonly path = signal<readonly number[]>([]);
  protected readonly completed = signal<readonly CompletedOutline[]>([]);
  protected readonly hintStar = signal<number | null>(null);
  protected readonly message = signal('');

  protected readonly solved = computed(
    () => this.completed().length === this.board().outlines.length,
  );
  protected readonly starColors = computed(() => {
    const colors = new Map<number, number>();
    this.completed().forEach(({ path }, index) => path.forEach((star) => colors.set(star, index)));
    return colors;
  });
  protected readonly lines = computed(() =>
    this.completed().map(({ path }) => this.svgPoints(path)),
  );
  protected readonly draft = computed(() => this.svgPoints(this.path()));
  private readonly remaining = computed(() =>
    this.board()
      .outlines.map((outline, index) => ({ outline, index }))
      .filter(({ index }) => this.completed().every((done) => done.index !== index)),
  );

  protected changeChallenge(index: number): void {
    const challenge = this.challenges[index];
    if (!challenge || challenge === this.challenge()) return;
    this.challenge.set(challenge);
    this.newPuzzle();
  }

  protected selectStar(star: number): void {
    if (this.solved() || this.starColors().has(star)) return;

    const path = this.path();
    this.clearFeedback();
    if (star === path[0]) {
      this.closeOutline(path);
    } else if (path.includes(star)) {
      this.message.set('Cette étoile fait déjà partie du tracé.');
    } else if (path.length >= Math.max(...this.remaining().map(({ outline }) => outline.length))) {
      this.message.set('Reviens à l’étoile de départ pour fermer la figure, ou annule un trait.');
    } else {
      this.path.set([...path, star]);
    }
  }

  protected undo(): void {
    if (this.solved()) return;
    this.clearFeedback();

    const path = this.path();
    const completed = this.completed();
    if (path.length > 0) {
      this.path.set(path.slice(0, -1));
    } else if (completed.length > 0) {
      this.path.set(completed[completed.length - 1].path);
      this.completed.set(completed.slice(0, -1));
    }
  }

  protected revealHint(): void {
    const path = this.path();
    const next = this.remaining()
      .map(({ outline }) => nextStarInOutline(outline, path))
      .find((star) => star !== null);

    this.hintStar.set(next ?? null);
    if (next === undefined) {
      this.message.set('Annule un trait pour reprendre ce tracé.');
    } else if (next === path[0]) {
      this.message.set('Reviens à l’étoile de départ pour fermer la figure.');
    } else {
      this.message.set('Poursuis avec l’étoile entourée.');
    }
  }

  protected restart(): void {
    this.path.set([]);
    this.completed.set([]);
    this.clearFeedback();
  }

  protected newPuzzle(): void {
    this.board.set(createStarPuzzle(this.challenge()));
    this.restart();
  }

  private closeOutline(path: readonly number[]): void {
    if (path.length < 3) {
      this.message.set('Relie au moins trois étoiles avant de revenir au départ.');
      return;
    }

    const candidates = this.remaining().filter(({ outline }) => outline.length === path.length);
    if (!candidates.length) {
      this.message.set('Il faut un autre nombre de sommets pour les figures demandées.');
      return;
    }

    const found = candidates.find(({ outline }) => nextStarInOutline(outline, path) === path[0]);
    if (!found) {
      const stars = this.board().stars;
      this.message.set(
        isRegularOutline(path.map((star) => stars[star]))
          ? 'Ces étoiles sont nécessaires à l’autre figure.'
          : 'Trace une figure régulière dont les côtés et les angles sont égaux.',
      );
      return;
    }

    this.completed.update((completed) => [...completed, { index: found.index, path }]);
    this.path.set([]);
    if (this.solved()) this.playHistory.markSolved('/polygones-etoiles');
  }

  private clearFeedback(): void {
    this.hintStar.set(null);
    this.message.set('');
  }

  private svgPoints(path: readonly number[]): string {
    const stars = this.board().stars;
    return path.map((star) => `${stars[star].x},${stars[star].y}`).join(' ');
  }
}
