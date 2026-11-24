import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { CadenasMystereClueComponent } from './cadenas-mystere-clue.component';
import { createMysteryRound } from './cadenas-mystere.logic';
import { Clue, clueMinWidth, CODE_POSITIONS } from './cadenas-mystere.model';

const SOLUTION_HINT_STEP = 2;
const EXAMPLE_HINT_STEP = 3;

@Component({
  selector: 'app-cadenas-mystere-page',
  imports: [RouterLink, CadenasMystereClueComponent, PuzzleSuccessPopupComponent],
  templateUrl: './cadenas-mystere.page.html',
  styleUrl: './cadenas-mystere.page.scss',
})
export class CadenasMysterePage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly hintCount = signal(0);

  protected readonly positions = CODE_POSITIONS;
  protected readonly puzzle = signal(createMysteryRound());
  protected readonly exampleClueWidth = computed(() =>
    Math.max(0, ...(this.puzzle().examples ?? []).map(({ clue }) => clueMinWidth(clue))),
  );
  protected readonly round = signal(0);
  protected readonly attempt = signal('');
  protected readonly isSolved = computed(() => this.attempt() === this.puzzle().answer);
  protected readonly wrongCode = computed(
    () => this.attempt().length === CODE_POSITIONS.length && !this.isSolved(),
  );
  protected readonly showMechanic = computed(() => this.hintCount() > 0);
  protected readonly showSolutionHint = computed(() => this.hintCount() >= SOLUTION_HINT_STEP);
  protected readonly showExampleHint = computed(() => this.hintCount() >= EXAMPLE_HINT_STEP);
  protected readonly revealedDigits = computed(() =>
    this.puzzle().answer.slice(0, Math.max(0, this.hintCount() - EXAMPLE_HINT_STEP)),
  );
  protected readonly canRevealHint = computed(
    () => !this.isSolved() && this.hintCount() < EXAMPLE_HINT_STEP + CODE_POSITIONS.length,
  );
  protected readonly controls = computed(() => {
    const puzzle = this.puzzle();
    const clues = [...(puzzle.shared ?? []), ...(puzzle.challenges ?? [])];
    const cells = clues.flatMap((clue) => (clue.kind === 'grid' ? clue.rows.flat() : []));
    return {
      marks: cells.some((cell) => cell.markable),
      choices: cells.some((cell) => cell.choices),
      paths: clues.some((clue) => clue.kind === 'diagram' && clue.edges?.length),
    };
  });

  protected minClueWidth(clues: readonly Clue[]): number {
    return Math.max(88, ...clues.filter((clue) => !this.fullRow(clue)).map(clueMinWidth));
  }

  protected fullRow(clue: Clue): boolean {
    return clue.kind === 'text' && clue.reading && clue.lines.length > 5;
  }

  protected updateAttempt(input: HTMLInputElement): void {
    if (this.isSolved()) return;

    const code = input.value.replace(/\D/g, '').slice(0, CODE_POSITIONS.length);
    if (input.value !== code) input.value = code;

    this.attempt.set(code);
    if (this.isSolved()) this.playHistory.markSolved('/cadenas-mystere');
  }

  protected revealHint(): void {
    if (this.canRevealHint()) this.hintCount.update((count) => count + 1);
  }

  protected restart(): void {
    this.attempt.set('');
    this.hintCount.set(0);
    this.round.update((round) => round + 1);
  }

  protected newPuzzle(): void {
    const next = createMysteryRound(this.puzzle().title);
    this.restart();
    this.puzzle.set(next);
  }
}
