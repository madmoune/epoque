import { Component, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../../shared/puzzle-success-popup/puzzle-success-popup.component';

type BallState = 'ready' | 'falling' | 'arrived';

type TimingBall = {
  id: number;
  label: string;
  color: string;
  durationMs: number;
  state: BallState;
  launchedAt: number | null;
  arrivedAt: number | null;
};

@Component({
  selector: 'app-timing-drop-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './timing-drop.page.html',
  styleUrl: './timing-drop.page.scss',
})
export class TimingDropPage implements OnDestroy {
  private readonly toleranceMs = 400;
  private readonly timers = new Map<number, number>();

  protected readonly balls = signal<TimingBall[]>(this.createBalls());
  protected readonly attemptStartedAt = signal<number | null>(null);
  protected readonly attemptComplete = signal(false);

  protected readonly launchedCount = computed(
    () => this.balls().filter((ball) => ball.launchedAt !== null).length,
  );

  protected readonly arrivedCount = computed(
    () => this.balls().filter((ball) => ball.state === 'arrived').length,
  );

  protected readonly allArrived = computed(() => this.arrivedCount() === this.balls().length);

  protected readonly arrivalSpreadMs = computed(() => {
    if (!this.allArrived()) return null;

    const arrivals = this.balls()
      .map((ball) => ball.arrivedAt)
      .filter((value): value is number => value !== null);

    return Math.max(...arrivals) - Math.min(...arrivals);
  });

  protected readonly isSolved = computed(() => {
    const spread = this.arrivalSpreadMs();
    return spread !== null && spread <= this.toleranceMs;
  });

  ngOnDestroy(): void {
    this.clearTimers();
  }

  protected launchBall(ballId: number): void {
    const ball = this.balls().find((candidate) => candidate.id === ballId);
    if (!ball || ball.state === 'falling' || this.isSolved()) return;

    const launchedAt = performance.now();
    if (this.balls().every((candidate) => candidate.state !== 'falling')) {
      this.attemptStartedAt.set(launchedAt);
      this.attemptComplete.set(false);
    }

    this.balls.update((balls) =>
      balls.map((candidate) =>
        candidate.id === ballId
          ? { ...candidate, state: 'falling', launchedAt, arrivedAt: null }
          : candidate,
      ),
    );

    const timer = window.setTimeout(() => this.markArrived(ballId), ball.durationMs);
    this.timers.set(ballId, timer);
  }

  protected newPuzzle(): void {
    this.clearTimers();
    this.balls.set(this.createBalls());
    this.attemptStartedAt.set(null);
    this.attemptComplete.set(false);
  }

  private markArrived(ballId: number): void {
    this.timers.delete(ballId);
    const arrivedAt = performance.now();

    this.balls.update((balls) =>
      balls.map((ball) =>
        ball.id === ballId
          ? { ...ball, state: 'arrived', arrivedAt }
          : ball,
      ),
    );

    if (this.balls().every((ball) => ball.state === 'arrived')) {
      this.attemptComplete.set(true);
    }
  }

  private createBalls(): TimingBall[] {
    const durations = this.createDurations();
    const colors = ['#f97316', '#38bdf8', '#a78bfa', '#84cc16'];

    return durations.map((durationMs, index) => ({
      id: index,
      label: String.fromCharCode(65 + index),
      color: colors[index],
      durationMs,
      state: 'ready',
      launchedAt: null,
      arrivedAt: null,
    }));
  }

  private createDurations(): number[] {
    const durations = new Set<number>();

    while (durations.size < 4) {
      durations.add(this.randomInt(4, 10) * 500);
    }

    return [...durations].sort(() => Math.random() - 0.5);
  }

  private clearTimers(): void {
    for (const timer of this.timers.values()) {
      window.clearTimeout(timer);
    }
    this.timers.clear();
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
